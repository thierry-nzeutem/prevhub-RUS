'use client';

// ============================================
// PREV'HUB - Composant Rapports PDF
// Génération, téléchargement et prévisualisation
// ============================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  User,
  Clock,
  ExternalLink,
  Printer,
  Share2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export type RapportType = 
  | 'visite'
  | 'commission'
  | 'prescription'
  | 'verification'
  | 'recap_mensuel'
  | 'recap_annuel';

interface RapportGeneratorProps {
  type: RapportType;
  entiteId: string;
  entiteName?: string;
  onGenerated?: (url: string) => void;
  className?: string;
}

interface RapportPreviewProps {
  url: string;
  title?: string;
  onClose: () => void;
}

interface RapportCardProps {
  rapport: {
    id: string;
    nom: string;
    type: RapportType;
    url: string;
    taille_octets: number;
    created_at: string;
    entite_type?: string;
    entite_nom?: string;
  };
  onPreview?: (url: string) => void;
  onDelete?: (id: string) => void;
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

function getRapportTypeLabel(type: RapportType): string {
  const labels: Record<RapportType, string> = {
    visite: 'Rapport de visite',
    commission: 'Rapport de commission',
    prescription: 'Fiche prescription',
    verification: 'Rapport de vérification',
    recap_mensuel: 'Récapitulatif mensuel',
    recap_annuel: 'Récapitulatif annuel',
  };
  return labels[type] || type;
}

function getRapportTypeIcon(type: RapportType) {
  switch (type) {
    case 'visite':
      return { icon: Building2, color: 'text-blue-500 bg-blue-100' };
    case 'commission':
      return { icon: Calendar, color: 'text-purple-500 bg-purple-100' };
    case 'prescription':
      return { icon: AlertCircle, color: 'text-orange-500 bg-orange-100' };
    case 'verification':
      return { icon: CheckCircle2, color: 'text-green-500 bg-green-100' };
    default:
      return { icon: FileText, color: 'text-gray-500 bg-gray-100' };
  }
}

// ============================================
// Composant Générateur
// ============================================

export function RapportGenerator({
  type,
  entiteId,
  entiteName,
  onGenerated,
  className,
}: RapportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/rapports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          entite_id: entiteId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      const { data } = await response.json();
      setGeneratedUrl(data.url);
      onGenerated?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{getRapportTypeLabel(type)}</h3>
          {entiteName && (
            <p className="text-sm text-gray-500">{entiteName}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {generatedUrl ? (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Rapport généré avec succès
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button
              onClick={() => window.open(generatedUrl, '_blank')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Générer le rapport PDF
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================
// Composant Prévisualisation
// ============================================

export function RapportPreview({ url, title, onClose }: RapportPreviewProps) {
  const handlePrint = () => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Rapport PDF',
          url,
        });
      } catch (err) {
        // L'utilisateur a annulé
      }
    } else {
      // Copier le lien
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-gray-900">
            {title || 'Aperçu du rapport'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Imprimer"
          >
            <Printer className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Partager"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="w-5 h-5 text-gray-600" />
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-900">
        <iframe
          src={`${url}#toolbar=0&navpanes=0`}
          className="w-full h-full"
          title="Aperçu PDF"
        />
      </div>
    </div>
  );
}

// ============================================
// Composant Carte Rapport
// ============================================

export function RapportCard({ rapport, onPreview, onDelete }: RapportCardProps) {
  const { icon: Icon, color } = getRapportTypeIcon(rapport.type);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{rapport.nom}</h4>
          <p className="text-sm text-gray-500">{getRapportTypeLabel(rapport.type)}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(rapport.created_at).toLocaleDateString('fr-FR')}
            </span>
            <span>{formatFileSize(rapport.taille_octets)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onPreview && (
            <button
              onClick={() => onPreview(rapport.url)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Aperçu"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <a
            href={rapport.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4 text-gray-500" />
          </a>
          {onDelete && (
            <button
              onClick={() => onDelete(rapport.id)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Composant Liste de Rapports
// ============================================

export function RapportsList({
  rapports,
  isLoading,
  onPreview,
  onDelete,
  emptyMessage = 'Aucun rapport disponible',
}: {
  rapports: RapportCardProps['rapport'][];
  isLoading?: boolean;
  onPreview?: (url: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = (url: string) => {
    if (onPreview) {
      onPreview(url);
    } else {
      setPreviewUrl(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!rapports || rapports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rapports.map((rapport) => (
          <RapportCard
            key={rapport.id}
            rapport={rapport}
            onPreview={handlePreview}
            onDelete={onDelete}
          />
        ))}
      </div>

      {previewUrl && (
        <RapportPreview
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  );
}

// ============================================
// Exports
// ============================================

export default RapportGenerator;
