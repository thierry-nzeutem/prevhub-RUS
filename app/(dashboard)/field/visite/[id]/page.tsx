'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Visite Détail
// Gestion d'une visite sur le terrain
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVisite, useUpdateVisite } from '@/hooks/use-visites';
import { useDocumentsForEntity } from '@/hooks/use-documents';
import { cn, formatDate } from '@/lib/utils';
import {
  ChevronLeft,
  MapPin,
  Clock,
  Building2,
  Phone,
  Mail,
  User,
  Calendar,
  Camera,
  FileText,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Play,
  Pause,
  StopCircle,
  Navigation,
  Clipboard,
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface ActionButtonProps {
  icon: any;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// ============================================
// Composants
// ============================================

function ActionButton({ icon: Icon, label, onClick, href, variant = 'secondary', disabled }: ActionButtonProps) {
  const baseClasses = 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50';
  const variantClasses = {
    primary: 'bg-orange-500 text-white active:bg-orange-600',
    secondary: 'bg-gray-100 text-gray-700 active:bg-gray-200',
    danger: 'bg-red-100 text-red-700 active:bg-red-200',
  };

  const className = cn(baseClasses, variantClasses[variant]);

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  if (!value) return null;
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon className="w-5 h-5 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: any }) {
  return (
    <Link
      href={`/field/prescription?id=${prescription.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              prescription.priorite === 'urgent' ? 'bg-red-100 text-red-700' :
              prescription.priorite === 'haute' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {prescription.priorite || 'Normal'}
            </span>
            <span className="text-xs text-gray-500">
              {prescription.numero_prescription}
            </span>
          </div>
          <p className="text-sm text-gray-900 line-clamp-2">
            {prescription.description_reformulee || prescription.description_complete}
          </p>
          {prescription.date_limite_conformite && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Échéance: {formatDate(prescription.date_limite_conformite)}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
}

// ============================================
// Page principale
// ============================================

export default function VisiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const visiteId = params.id as string;

  const { data: visite, isLoading } = useVisite(visiteId);
  const { data: photos } = useDocumentsForEntity('visite', visiteId);
  const { mutate: updateVisite, isPending: isUpdating } = useUpdateVisite();

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!visite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">Visite non trouvée</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-orange-600 font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const etablissement = visite.etablissement;
  const prescriptions = visite.prescriptions || [];
  const isEnCours = visite.statut === 'en_cours';
  const isTerminee = visite.statut === 'terminee';

  // Démarrer la visite
  const handleStart = () => {
    updateVisite({
      id: visiteId,
      statut: 'en_cours',
      heure_debut_effective: new Date().toTimeString().slice(0, 5),
    });
  };

  // Terminer la visite
  const handleEnd = () => {
    updateVisite({
      id: visiteId,
      statut: 'terminee',
      heure_fin_effective: new Date().toTimeString().slice(0, 5),
    });
    setShowEndConfirm(false);
  };

  // Ouvrir Google Maps
  const openMaps = () => {
    if (etablissement?.adresse && etablissement?.ville) {
      const address = encodeURIComponent(`${etablissement.adresse}, ${etablissement.ville}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className={cn(
        'px-4 pt-12 pb-6',
        isEnCours ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
        isTerminee ? 'bg-gradient-to-br from-green-500 to-green-600' :
        'bg-gradient-to-br from-blue-500 to-blue-600'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white/80 text-sm">Visite</p>
            <h1 className="text-xl font-bold text-white">
              {etablissement?.nom_commercial || 'Établissement'}
            </h1>
          </div>
          {etablissement?.categorie_erp && (
            <span className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {etablissement.categorie_erp}
            </span>
          )}
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium',
            isEnCours ? 'bg-white/20 text-white' :
            isTerminee ? 'bg-white/20 text-white' :
            'bg-white/20 text-white'
          )}>
            {isEnCours ? '🔄 En cours' : isTerminee ? '✅ Terminée' : '📅 Planifiée'}
          </span>
          <span className="text-white/80 text-sm">
            {visite.date} à {visite.heure_debut}
          </span>
        </div>
      </div>

      {/* Actions principales */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          {!isEnCours && !isTerminee ? (
            <button
              onClick={handleStart}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-3 py-4 bg-orange-500 text-white rounded-xl font-semibold text-lg active:bg-orange-600 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Play className="w-6 h-6" />
              )}
              Démarrer la visite
            </button>
          ) : isEnCours ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 py-3 rounded-xl">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="font-medium">Visite en cours</span>
              </div>
              <button
                onClick={() => setShowEndConfirm(true)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 text-white rounded-xl font-semibold text-lg active:bg-green-600"
              >
                <StopCircle className="w-6 h-6" />
                Terminer la visite
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Visite terminée</span>
            </div>
          )}
        </div>
      </div>

      {/* Infos établissement */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              Établissement
            </h2>
          </div>
          <div className="px-4">
            <InfoRow
              icon={MapPin}
              label="Adresse"
              value={`${etablissement?.adresse || ''}, ${etablissement?.code_postal || ''} ${etablissement?.ville || ''}`}
            />
            <InfoRow
              icon={FileText}
              label="Type ERP"
              value={etablissement?.type_erp ? `Type ${etablissement.type_erp}` : null}
            />
            <InfoRow
              icon={User}
              label="Exploitant"
              value={etablissement?.exploitant_nom ? `${etablissement.exploitant_prenom || ''} ${etablissement.exploitant_nom}` : null}
            />
            <InfoRow
              icon={Phone}
              label="Téléphone"
              value={etablissement?.exploitant_telephone || etablissement?.telephone}
            />
          </div>
          
          {/* Bouton itinéraire */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={openMaps}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium"
            >
              <Navigation className="w-5 h-5" />
              Ouvrir dans Google Maps
            </button>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      {isEnCours && (
        <div className="px-4 mt-6">
          <h2 className="font-semibold text-gray-900 mb-3">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton
              icon={Camera}
              label="Photo"
              href={`/field/photo?visite_id=${visiteId}`}
              variant="secondary"
            />
            <ActionButton
              icon={Clipboard}
              label="Observation"
              href={`/field/observation?visite_id=${visiteId}`}
              variant="secondary"
            />
            <ActionButton
              icon={AlertTriangle}
              label="Prescription"
              href={`/field/prescription/new?visite_id=${visiteId}&etablissement_id=${etablissement?.id}`}
              variant="secondary"
            />
            <ActionButton
              icon={FileText}
              label="Note"
              href={`/field/note?visite_id=${visiteId}`}
              variant="secondary"
            />
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {prescriptions.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Prescriptions ({prescriptions.length})
            </h2>
            {isEnCours && (
              <Link
                href={`/field/prescription/new?visite_id=${visiteId}&etablissement_id=${etablissement?.id}`}
                className="text-sm text-orange-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {prescriptions.map((prescription: any) => (
              <PrescriptionCard key={prescription.id} prescription={prescription} />
            ))}
          </div>
        </div>
      )}

      {/* Photos prises */}
      {photos && photos.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">
              Photos ({photos.length})
            </h2>
            {isEnCours && (
              <Link
                href={`/field/photo?visite_id=${visiteId}`}
                className="text-sm text-orange-600 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Link>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {photos.slice(0, 8).map((photo: any) => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.url}
                  alt="Photo visite"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {photos.length > 8 && (
              <Link
                href={`/field/visite/${visiteId}/photos`}
                className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center"
              >
                <span className="text-gray-500 font-medium">+{photos.length - 8}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmation fin de visite */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Terminer la visite ?
              </h3>
              <p className="text-gray-500 text-sm">
                Vous pourrez toujours modifier le rapport après avoir terminé.
              </p>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleEnd}
                disabled={isUpdating}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Terminer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
