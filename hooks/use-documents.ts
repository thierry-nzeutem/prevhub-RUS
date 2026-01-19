// ============================================
// PREV'HUB - Hook Documents
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface Document {
  id: string;
  nom: string;
  description: string | null;
  type: 'pdf' | 'word' | 'excel' | 'image' | 'csv' | 'text' | 'autre';
  mime_type: string;
  taille_octets: number;
  url: string;
  storage_bucket: string;
  storage_path: string;
  entite_type: string | null;
  entite_id: string | null;
  uploaded_by: string;
  metadata: Record<string, any>;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface UploadOptions {
  bucket: 'documents' | 'photos' | 'rapports' | 'avatars';
  entite_type?: string;
  entite_id?: string;
  description?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

// ============================================
// Hook useDocuments
// ============================================

export function useDocuments(options?: {
  entite_type?: string;
  entite_id?: string;
  type?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['documents', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.entite_type) params.set('entite_type', options.entite_type);
      if (options?.entite_id) params.set('entite_id', options.entite_id);
      if (options?.type) params.set('type', options.type);
      if (options?.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur chargement documents');
      }

      const { data } = await response.json();
      return data as Document[];
    },
  });
}

// ============================================
// Hook useDocumentUpload
// ============================================

export function useDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      options,
    }: {
      files: File[];
      options: UploadOptions;
    }): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', options.bucket);
        if (options.entite_type) formData.append('entite_type', options.entite_type);
        if (options.entite_id) formData.append('entite_id', options.entite_id);
        if (options.description) formData.append('description', options.description);

        // Upload avec simulation de progression
        options.onProgress?.(((i + 0.5) / files.length) * 100);

        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Erreur upload ${file.name}`);
        }

        const { data } = await response.json();
        results.push(data);

        options.onProgress?.(((i + 1) / files.length) * 100);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ============================================
// Hook useDocumentDelete
// ============================================

export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur suppression');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ============================================
// Hook usePhotoUpload (spécialisé photos)
// ============================================

export function usePhotoUpload(options?: {
  entite_type?: string;
  entite_id?: string;
}) {
  const { mutateAsync: uploadDocuments } = useDocumentUpload();

  const uploadPhotos = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      return uploadDocuments({
        files,
        options: {
          bucket: 'photos',
          entite_type: options?.entite_type,
          entite_id: options?.entite_id,
        },
      });
    },
    [uploadDocuments, options]
  );

  return { uploadPhotos };
}

// ============================================
// Hook useRapportUpload (spécialisé rapports)
// ============================================

export function useRapportUpload(options?: {
  entite_type?: string;
  entite_id?: string;
}) {
  const { mutateAsync: uploadDocuments } = useDocumentUpload();

  const uploadRapport = useCallback(
    async (file: File, description?: string): Promise<UploadResult> => {
      const results = await uploadDocuments({
        files: [file],
        options: {
          bucket: 'rapports',
          entite_type: options?.entite_type,
          entite_id: options?.entite_id,
          description,
        },
      });
      return results[0];
    },
    [uploadDocuments, options]
  );

  return { uploadRapport };
}

// ============================================
// Hook useAvatarUpload
// ============================================

export function useAvatarUpload() {
  const { mutateAsync: uploadDocuments } = useDocumentUpload();
  const queryClient = useQueryClient();

  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      const results = await uploadDocuments({
        files: [file],
        options: {
          bucket: 'avatars',
        },
      });

      // Invalider le profil pour rafraîchir l'avatar
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      return results[0].url;
    },
    [uploadDocuments, queryClient]
  );

  return { uploadAvatar };
}

// ============================================
// Utilitaires
// ============================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getDocumentIcon(type: string): string {
  switch (type) {
    case 'pdf':
      return '📄';
    case 'word':
      return '📝';
    case 'excel':
      return '📊';
    case 'image':
      return '🖼️';
    case 'csv':
      return '📋';
    default:
      return '📁';
  }
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

// ============================================
// Exports
// ============================================

export {
  useDocuments,
  useDocumentUpload,
  useDocumentDelete,
  usePhotoUpload,
  useRapportUpload,
  useAvatarUpload,
  formatFileSize,
  getDocumentIcon,
  isImageFile,
  isPdfFile,
};
