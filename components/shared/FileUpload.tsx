'use client';

// ============================================
// PREV'HUB - Composant FileUpload
// ============================================

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  Loader2,
  Trash2,
  Download,
  Eye,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<{ url: string; id: string }[]>;
  onRemove?: (fileId: string) => Promise<void>;
  accept?: string;
  maxSize?: number; // en Mo
  maxFiles?: number;
  multiple?: boolean;
  existingFiles?: { id: string; name: string; url: string; size: number; type: string }[];
  className?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

// ============================================
// Utilitaires
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  return File;
}

function getFileIconColor(type: string) {
  if (type.startsWith('image/')) return 'text-green-500';
  if (type === 'application/pdf') return 'text-red-500';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'text-emerald-500';
  return 'text-blue-500';
}

// ============================================
// Composant FileItem
// ============================================

function FileItem({
  file,
  onRemove,
  onPreview,
}: {
  file: UploadedFile;
  onRemove?: () => void;
  onPreview?: () => void;
}) {
  const Icon = getFileIcon(file.type);
  const iconColor = getFileIconColor(file.type);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gray-50 rounded-lg border',
        file.status === 'error' && 'border-red-200 bg-red-50',
        file.status === 'success' && 'border-green-200 bg-green-50',
        file.status === 'uploading' && 'border-orange-200 bg-orange-50'
      )}
    >
      {/* Icône */}
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center bg-white')}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        
        {/* Barre de progression */}
        {file.status === 'uploading' && (
          <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        {/* Message d'erreur */}
        {file.status === 'error' && file.error && (
          <p className="text-xs text-red-600 mt-1">{file.error}</p>
        )}
      </div>

      {/* Statut / Actions */}
      <div className="flex items-center gap-1">
        {file.status === 'uploading' && (
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
        )}
        {file.status === 'success' && (
          <Check className="w-5 h-5 text-green-500" />
        )}
        {file.status === 'error' && (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        )}

        {file.status === 'success' && file.url && (
          <>
            {file.type.startsWith('image/') || file.type === 'application/pdf' ? (
              <button
                onClick={onPreview}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Aperçu"
              >
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
            ) : (
              <a
                href={file.url}
                download={file.name}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Télécharger"
              >
                <Download className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </>
        )}

        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-white rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Composant principal
// ============================================

export function FileUpload({
  onUpload,
  onRemove,
  accept = '*/*',
  maxSize = 10,
  maxFiles = 10,
  multiple = true,
  existingFiles = [],
  className,
  label = 'Glissez vos fichiers ici ou cliquez pour parcourir',
  hint,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    existingFiles.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.url,
      status: 'success' as const,
      progress: 100,
    }))
  );
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation d'un fichier
  const validateFile = useCallback(
    (file: File): string | null => {
      // Vérification taille
      if (file.size > maxSize * 1024 * 1024) {
        return `Fichier trop volumineux (max ${maxSize} Mo)`;
      }

      // Vérification type si accept spécifié
      if (accept !== '*/*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const isAccepted = acceptedTypes.some((acceptedType) => {
          if (acceptedType.startsWith('.')) {
            return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
          }
          if (acceptedType.endsWith('/*')) {
            return file.type.startsWith(acceptedType.replace('/*', '/'));
          }
          return file.type === acceptedType;
        });

        if (!isAccepted) {
          return 'Type de fichier non autorisé';
        }
      }

      return null;
    },
    [accept, maxSize]
  );

  // Gestion de l'upload
  const handleUpload = useCallback(
    async (newFiles: File[]) => {
      if (disabled) return;

      // Limiter le nombre de fichiers
      const remainingSlots = maxFiles - files.length;
      const filesToUpload = newFiles.slice(0, remainingSlots);

      if (filesToUpload.length === 0) return;

      // Créer les entrées en pending
      const newUploadedFiles: UploadedFile[] = filesToUpload.map((file) => {
        const error = validateFile(file);
        return {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: error ? 'error' : 'pending',
          progress: 0,
          error: error || undefined,
        };
      });

      setFiles((prev) => [...prev, ...newUploadedFiles]);

      // Uploader les fichiers valides
      const validFiles = filesToUpload.filter((_, i) => !newUploadedFiles[i].error);
      if (validFiles.length === 0) return;

      // Simuler la progression
      const progressIntervals: NodeJS.Timeout[] = [];
      validFiles.forEach((file, index) => {
        const fileIndex = files.length + index;
        const interval = setInterval(() => {
          setFiles((prev) => {
            const updated = [...prev];
            const targetFile = updated[fileIndex];
            if (targetFile && targetFile.status !== 'success' && targetFile.status !== 'error') {
              targetFile.status = 'uploading';
              targetFile.progress = Math.min(targetFile.progress + 10, 90);
            }
            return updated;
          });
        }, 100);
        progressIntervals.push(interval);
      });

      try {
        const results = await onUpload(validFiles);

        // Nettoyer les intervals
        progressIntervals.forEach((i) => clearInterval(i));

        // Mettre à jour avec les résultats
        setFiles((prev) => {
          const updated = [...prev];
          validFiles.forEach((file, i) => {
            const fileIndex = prev.findIndex(
              (f) => f.name === file.name && f.status === 'uploading'
            );
            if (fileIndex !== -1 && results[i]) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                id: results[i].id,
                url: results[i].url,
                status: 'success',
                progress: 100,
              };
            }
          });
          return updated;
        });
      } catch (error) {
        // Nettoyer les intervals
        progressIntervals.forEach((i) => clearInterval(i));

        // Marquer en erreur
        setFiles((prev) => {
          return prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error', error: 'Erreur lors de l\'upload' }
              : f
          );
        });
      }
    },
    [disabled, files.length, maxFiles, onUpload, validateFile]
  );

  // Gestion du drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleUpload(droppedFiles);
    },
    [disabled, handleUpload]
  );

  // Gestion du changement de fichier
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const selectedFiles = Array.from(e.target.files);
      handleUpload(selectedFiles);
      
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleUpload]
  );

  // Suppression d'un fichier
  const handleRemove = useCallback(
    async (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      if (file.status === 'success' && onRemove) {
        try {
          await onRemove(fileId);
        } catch (error) {
          console.error('Erreur suppression:', error);
          return;
        }
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    [files, onRemove]
  );

  // Nombre de fichiers restants
  const remainingSlots = maxFiles - files.length;
  const canUploadMore = remainingSlots > 0 && !disabled;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Zone de drop */}
      {canUploadMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            onChange={handleChange}
            accept={accept}
            multiple={multiple && remainingSlots > 1}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                isDragging ? 'bg-orange-100' : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn(
                  'w-7 h-7',
                  isDragging ? 'text-orange-600' : 'text-gray-400'
                )}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Max {maxSize} Mo par fichier • {remainingSlots} fichier{remainingSlots > 1 ? 's' : ''} restant{remainingSlots > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onRemove={() => handleRemove(file.id)}
              onPreview={() => file.url && setPreviewUrl(file.url)}
            />
          ))}
        </div>
      )}

      {/* Modal de prévisualisation */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          {previewUrl.endsWith('.pdf') ? (
            <iframe
              src={previewUrl}
              className="w-full max-w-4xl h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewUrl}
              alt="Aperçu"
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Export par défaut
// ============================================

export default FileUpload;
