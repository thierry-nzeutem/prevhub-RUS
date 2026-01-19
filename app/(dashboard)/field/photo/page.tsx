'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Photo Capture
// Capture photo avec géolocalisation et EXIF
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Camera,
  X,
  Check,
  RotateCcw,
  FlipHorizontal2,
  MapPin,
  Clock,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  Zap,
  ZapOff,
  Upload,
  Trash2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  type: 'avant' | 'apres' | 'observation';
  description?: string;
}

// ============================================
// Composants
// ============================================

function PhotoThumbnail({ 
  photo, 
  onDelete 
}: { 
  photo: CapturedPhoto; 
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      <img
        src={photo.dataUrl}
        alt="Capture"
        className="w-16 h-16 rounded-lg object-cover border-2 border-white shadow"
      />
      <button
        onClick={onDelete}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
      {photo.location && (
        <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center">
          <MapPin className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function PhotoCapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const visiteId = searchParams.get('visite_id');
  const prescriptionId = searchParams.get('prescription_id');
  const photoType = (searchParams.get('type') || 'observation') as 'avant' | 'apres' | 'observation';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialiser la caméra
  const initCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      setStream(newStream);
      setIsCameraReady(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
    }
  }, [facingMode]);

  // Obtenir la géolocalisation
  const getLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          setLocationError(null);
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  useEffect(() => {
    initCamera();
    getLocation();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Basculer la caméra
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (isCameraReady) {
      initCamera();
    }
  }, [facingMode]);

  // Capturer une photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCurrentPhoto(dataUrl);
    }

    setIsCapturing(false);
  };

  // Confirmer la photo
  const confirmPhoto = () => {
    if (!currentPhoto) return;

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl: currentPhoto,
      timestamp: new Date(),
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      } : undefined,
      type: photoType,
    };

    setPhotos(prev => [...prev, newPhoto]);
    setCurrentPhoto(null);
  };

  // Reprendre la photo
  const retakePhoto = () => {
    setCurrentPhoto(null);
  };

  // Supprimer une photo
  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Sauvegarder les photos
  const savePhotos = async () => {
    if (photos.length === 0) return;

    setIsUploading(true);

    try {
      // Convertir les dataUrls en fichiers et uploader
      for (const photo of photos) {
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'photos');
        
        if (prescriptionId) {
          formData.append('entite_type', 'prescription');
          formData.append('entite_id', prescriptionId);
          formData.append('description', `Photo ${photo.type}`);
        } else if (visiteId) {
          formData.append('entite_type', 'visite');
          formData.append('entite_id', visiteId);
          formData.append('description', 'Photo de visite');
        }

        // Ajouter les métadonnées de géolocalisation
        if (photo.location) {
          // Ces infos seront stockées dans les métadonnées du document
        }

        await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
      }

      // Retour à la page précédente
      router.back();
    } catch (error) {
      console.error('Erreur upload photos:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Aperçu caméra ou photo capturée */}
      {currentPhoto ? (
        <img
          src={currentPhoto}
          alt="Photo capturée"
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent safe-area-inset-top">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div className="flex items-center gap-2">
            {location ? (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/80 backdrop-blur rounded-full">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">GPS OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/80 backdrop-blur rounded-full">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">
                  {locationError ? 'GPS erreur' : 'GPS...'}
                </span>
              </div>
            )}

            <span className="px-3 py-1.5 bg-orange-500/80 backdrop-blur rounded-full text-xs text-white font-medium capitalize">
              {photoType}
            </span>
          </div>

          <button
            onClick={toggleCamera}
            className="w-10 h-10 bg-black/30 backdrop-blur rounded-full flex items-center justify-center"
          >
            <FlipHorizontal2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Photos capturées */}
      {photos.length > 0 && !currentPhoto && (
        <div className="absolute top-24 left-4 right-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onDelete={() => deletePhoto(photo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contrôles */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent safe-area-inset-bottom">
        {currentPhoto ? (
          /* Mode preview */
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={retakePhoto}
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>

            <button
              onClick={confirmPhoto}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Check className="w-10 h-10 text-white" />
            </button>

            <div className="w-14" /> {/* Spacer */}
          </div>
        ) : (
          /* Mode capture */
          <div className="flex items-center justify-center gap-8">
            {/* Flash toggle */}
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
            >
              {flashEnabled ? (
                <Zap className="w-6 h-6 text-yellow-400" />
              ) : (
                <ZapOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Bouton capture */}
            <button
              onClick={capturePhoto}
              disabled={!isCameraReady || isCapturing}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform',
                isCameraReady ? 'bg-white active:scale-95' : 'bg-gray-400'
              )}
            >
              <div className="w-16 h-16 rounded-full border-4 border-gray-800" />
            </button>

            {/* Bouton sauvegarder */}
            {photos.length > 0 ? (
              <button
                onClick={savePhotos}
                disabled={isUploading}
                className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <div className="relative">
                    <Upload className="w-6 h-6 text-white" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-500 rounded-full text-xs font-bold flex items-center justify-center">
                      {photos.length}
                    </span>
                  </div>
                )}
              </button>
            ) : (
              <div className="w-14" /> /* Spacer */
            )}
          </div>
        )}

        {/* Info géolocalisation */}
        {location && !currentPhoto && (
          <div className="mt-4 text-center">
            <p className="text-xs text-white/70">
              📍 {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-white/50">
              Précision: ±{Math.round(location.coords.accuracy)}m
            </p>
          </div>
        )}
      </div>

      {/* Indicateur de chargement */}
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-white">Initialisation de la caméra...</p>
          </div>
        </div>
      )}
    </div>
  );
}
