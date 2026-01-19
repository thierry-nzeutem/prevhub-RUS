'use client';

// ============================================
// PREV'HUB - Composant PhotoCapture
// Capture photo mobile avec géolocalisation et EXIF
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Camera,
  X,
  Image,
  MapPin,
  Clock,
  Trash2,
  Upload,
  RefreshCw,
  ZoomIn,
  RotateCw,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface PhotoData {
  id: string;
  file: File;
  preview: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface PhotoCaptureProps {
  onCapture?: (photos: PhotoData[]) => void;
  onUpload?: (photos: File[]) => Promise<{ url: string; id: string }[]>;
  maxPhotos?: number;
  quality?: number;
  maxWidth?: number;
  existingPhotos?: { id: string; url: string; timestamp?: string }[];
  className?: string;
  label?: string;
  showLocation?: boolean;
  showTimestamp?: boolean;
  disabled?: boolean;
}

// ============================================
// Utilitaires
// ============================================

async function getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

async function compressImage(file: File, quality: number, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Composant PhotoItem
// ============================================

function PhotoItem({
  photo,
  onRemove,
  onView,
  showLocation,
  showTimestamp,
}: {
  photo: PhotoData;
  onRemove: () => void;
  onView: () => void;
  showLocation: boolean;
  showTimestamp: boolean;
}) {
  return (
    <div className="relative group">
      <div
        className={cn(
          'aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
          photo.status === 'error'
            ? 'border-red-300 bg-red-50'
            : photo.status === 'success'
            ? 'border-green-300'
            : 'border-gray-200'
        )}
        onClick={onView}
      >
        <img
          src={photo.preview}
          alt="Photo capturée"
          className="w-full h-full object-cover"
        />

        {/* Overlay infos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
            {showTimestamp && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimestamp(new Date(photo.timestamp))}
              </div>
            )}
            {showLocation && photo.latitude && photo.longitude && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>

        {/* Statut */}
        {photo.status === 'uploading' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-xs mt-1">{photo.progress}%</p>
            </div>
          </div>
        )}

        {photo.status === 'success' && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {photo.status === 'error' && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Bouton supprimer */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// Composant principal
// ============================================

export function PhotoCapture({
  onCapture,
  onUpload,
  maxPhotos = 10,
  quality = 0.8,
  maxWidth = 1920,
  existingPhotos = [],
  className,
  label = 'Prendre une photo',
  showLocation = true,
  showTimestamp = true,
  disabled = false,
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<PhotoData[]>(() =>
    existingPhotos.map((p) => ({
      id: p.id,
      file: new File([], 'existing'),
      preview: p.url,
      latitude: null,
      longitude: null,
      timestamp: p.timestamp || new Date().toISOString(),
      status: 'success' as const,
      progress: 100,
      url: p.url,
    }))
  );
  const [viewingPhoto, setViewingPhoto] = useState<PhotoData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Nettoyer le stream caméra
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Démarrer la capture caméra
  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: maxWidth },
          height: { ideal: maxWidth },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      // Fallback vers input file
      inputRef.current?.click();
    }
  }, [maxWidth]);

  // Arrêter la capture
  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  // Prendre la photo
  const takePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        // Obtenir la géolocalisation
        const position = showLocation ? await getCurrentPosition() : null;

        const photo: PhotoData = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }),
          preview: URL.createObjectURL(blob),
          latitude: position?.latitude || null,
          longitude: position?.longitude || null,
          timestamp: new Date().toISOString(),
          status: 'pending',
          progress: 0,
        };

        setPhotos((prev) => [...prev, photo]);
        onCapture?.([photo]);

        // Arrêter la capture après la photo
        stopCapture();

        // Upload automatique si handler fourni
        if (onUpload) {
          uploadPhoto(photo);
        }
      },
      'image/jpeg',
      quality
    );
  }, [quality, showLocation, onCapture, onUpload, stopCapture]);

  // Gérer la sélection de fichier
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const remainingSlots = maxPhotos - photos.length;
      const filesToProcess = files.slice(0, remainingSlots);

      // Obtenir la géolocalisation
      const position = showLocation ? await getCurrentPosition() : null;

      const newPhotos: PhotoData[] = await Promise.all(
        filesToProcess.map(async (file) => {
          // Compresser l'image
          const compressed = await compressImage(file, quality, maxWidth);

          return {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: new File([compressed], file.name, { type: 'image/jpeg' }),
            preview: URL.createObjectURL(compressed),
            latitude: position?.latitude || null,
            longitude: position?.longitude || null,
            timestamp: new Date().toISOString(),
            status: 'pending' as const,
            progress: 0,
          };
        })
      );

      setPhotos((prev) => [...prev, ...newPhotos]);
      onCapture?.(newPhotos);

      // Upload automatique
      if (onUpload) {
        for (const photo of newPhotos) {
          uploadPhoto(photo);
        }
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [photos.length, maxPhotos, quality, maxWidth, showLocation, onCapture, onUpload]
  );

  // Upload d'une photo
  const uploadPhoto = useCallback(
    async (photo: PhotoData) => {
      if (!onUpload) return;

      setPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, status: 'uploading', progress: 0 } : p))
      );

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id && p.status === 'uploading'
              ? { ...p, progress: Math.min(p.progress + 10, 90) }
              : p
          )
        );
      }, 100);

      try {
        const results = await onUpload([photo.file]);
        clearInterval(progressInterval);

        if (results[0]) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, status: 'success', progress: 100, url: results[0].url }
                : p
            )
          );
        }
      } catch (error) {
        clearInterval(progressInterval);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, status: 'error', error: 'Erreur upload' }
              : p
          )
        );
      }
    },
    [onUpload]
  );

  // Supprimer une photo
  const removePhoto = useCallback((photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  const canAddMore = photos.length < maxPhotos && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grille de photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoItem
              key={photo.id}
              photo={photo}
              onRemove={() => removePhoto(photo.id)}
              onView={() => setViewingPhoto(photo)}
              showLocation={showLocation}
              showTimestamp={showTimestamp}
            />
          ))}
        </div>
      )}

      {/* Boutons de capture */}
      {canAddMore && (
        <div className="flex gap-3">
          <button
            onClick={startCapture}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-5 h-5" />
            {label}
          </button>

          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex items-center justify-center gap-2 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Image className="w-5 h-5" />
            Galerie
          </button>
        </div>
      )}

      {/* Compteur */}
      <p className="text-xs text-gray-500 text-center">
        {photos.length} / {maxPhotos} photos
      </p>

      {/* Input file caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Modal capture vidéo */}
      {isCapturing && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <video
            ref={videoRef}
            className="flex-1 object-cover"
            playsInline
            muted
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={stopCapture}
                className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={takePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-orange-500"
              >
                <div className="w-16 h-16 bg-orange-500 rounded-full" />
              </button>
              <button
                onClick={() => {
                  // TODO: Changer de caméra
                }}
                className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
              >
                <RefreshCw className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal visualisation */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingPhoto.preview}
            alt="Photo"
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-4 right-4 text-white text-sm">
            <div className="flex items-center justify-center gap-4">
              {showTimestamp && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTimestamp(new Date(viewingPhoto.timestamp))}
                </span>
              )}
              {showLocation && viewingPhoto.latitude && viewingPhoto.longitude && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {viewingPhoto.latitude.toFixed(6)}, {viewingPhoto.longitude.toFixed(6)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Export
// ============================================

export default PhotoCapture;
