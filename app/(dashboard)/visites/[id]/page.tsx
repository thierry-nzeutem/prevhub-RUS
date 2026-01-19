'use client';

// ============================================
// PREV'HUB - Page Détail Visite
// ============================================

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import { PhotoCapture } from '@/components/shared/PhotoCapture';
import { usePhotoUpload } from '@/hooks/use-documents';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Camera,
  Plus,
  Check,
  Play,
  Square,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronRight,
  Loader2,
  Save,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Visite {
  id: string;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  heure_debut_effective: string | null;
  heure_fin_effective: string | null;
  type_visite: string;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee' | 'reportee';
  objet: string | null;
  notes_preparation: string | null;
  notes_visite: string | null;
  conclusion: string | null;
  personnes_presentes: string[];
  etablissement: { id: string; nom_commercial: string; ville: string; adresse: string } | null;
  groupement: { id: string; nom: string } | null;
  preventionniste: { id: string; prenom: string; nom: string; email: string } | null;
  observations: Observation[];
}

interface Observation {
  id: string;
  type: 'conforme' | 'remarque' | 'non_conformite' | 'prescription';
  description: string;
  localisation: string | null;
  photos: string[];
  priorite: string | null;
  created_at: string;
}

// ============================================
// Helpers
// ============================================

const STATUT_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  planifiee: { label: 'Planifiée', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  en_cours: { label: 'En cours', color: 'bg-orange-100 text-orange-700', icon: Play },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  annulee: { label: 'Annulée', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  reportee: { label: 'Reportée', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

const OBSERVATION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  conforme: { label: 'Conforme', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  remarque: { label: 'Remarque', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: MessageSquare },
  non_conformite: { label: 'Non-conformité', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  prescription: { label: 'Prescription', color: 'bg-red-100 text-red-700 border-red-200', icon: FileText },
};

// ============================================
// Composants
// ============================================

function ObservationItem({ observation }: { observation: Observation }) {
  const config = OBSERVATION_CONFIG[observation.type] || OBSERVATION_CONFIG.remarque;
  const Icon = config.icon;

  return (
    <div className={cn('p-4 border rounded-xl', config.color)}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">{config.label}</span>
            {observation.localisation && (
              <span className="text-xs opacity-75">{observation.localisation}</span>
            )}
          </div>
          <p className="text-sm">{observation.description}</p>
          
          {observation.photos && observation.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {observation.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddObservationModal({
  visiteId,
  onClose,
  onSuccess,
}: {
  visiteId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = useSupabase();
  const { uploadPhotos } = usePhotoUpload({ entite_type: 'observation' });
  const [type, setType] = useState<string>('remarque');
  const [description, setDescription] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      // Upload des photos
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        const results = await uploadPhotos(photos);
        photoUrls = results.map((r) => r.url);
      }

      // Créer l'observation
      const { error } = await supabase.from('observations').insert({
        visite_id: visiteId,
        type,
        description,
        localisation: localisation || null,
        photos: photoUrls,
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur ajout observation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Nouvelle observation</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(OBSERVATION_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border transition-all',
                      type === key
                        ? config.color + ' border-current'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre observation..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              rows={4}
            />
          </div>

          {/* Localisation */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Localisation</label>
            <input
              type="text"
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              placeholder="Ex: RDC, Cuisine, Escalier B..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Photos</label>
            <PhotoCapture
              maxPhotos={4}
              onCapture={(photoData) => {
                setPhotos((prev) => [...prev, ...photoData.map((p) => p.file)]);
              }}
              label="Ajouter une photo"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!description.trim() || isSubmitting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function VisiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAddObservation, setShowAddObservation] = useState(false);

  // Fetch visite
  const { data: visite, isLoading, error } = useQuery({
    queryKey: ['visite', params.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visites')
        .select(`
          *,
          etablissement:etablissements(id, nom_commercial, ville, adresse),
          groupement:groupements(id, nom),
          preventionniste:profiles!visites_preventionniste_id_fkey(id, prenom, nom, email),
          observations:observations(id, type, description, localisation, photos, priorite, created_at)
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      return data as Visite;
    },
  });

  // Mutation changement statut
  const { mutate: updateStatut, isPending: isUpdating } = useMutation({
    mutationFn: async (newStatut: string) => {
      const { error } = await supabase
        .from('visites')
        .update({ statut: newStatut })
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visite', params.id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !visite) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800">Visite non trouvée</h2>
          <Link
            href="/visites"
            className="mt-4 inline-flex items-center gap-2 text-sm text-red-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux visites
          </Link>
        </div>
      </div>
    );
  }

  const statutConfig = STATUT_CONFIG[visite.statut];
  const StatutIcon = statutConfig?.icon || Calendar;
  const isOwner = visite.preventionniste?.id === user?.id;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/visites"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Visite du {formatDate(visite.date)}
              </h1>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5', statutConfig.color)}>
                <StatutIcon className="w-4 h-4" />
                {statutConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {visite.type_visite?.replace(/_/g, ' ')}
              {visite.heure_debut && ` • ${visite.heure_debut}`}
            </p>
          </div>
        </div>

        {/* Actions statut */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {visite.statut === 'planifiee' && (
              <button
                onClick={() => updateStatut('en_cours')}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Démarrer
              </button>
            )}
            {visite.statut === 'en_cours' && (
              <button
                onClick={() => updateStatut('terminee')}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Terminer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Infos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Établissement */}
        {visite.etablissement && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Établissement</h3>
            </div>
            <Link
              href={`/etablissements/${visite.etablissement.id}`}
              className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <p className="font-medium text-gray-900">{visite.etablissement.nom_commercial}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {visite.etablissement.adresse}, {visite.etablissement.ville}
              </p>
            </Link>
          </div>
        )}

        {/* Préventionniste */}
        {visite.preventionniste && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Préventionniste</h3>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {visite.preventionniste.prenom} {visite.preventionniste.nom}
              </p>
              <p className="text-sm text-gray-500">{visite.preventionniste.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {(visite.objet || visite.notes_preparation || visite.notes_visite) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
          <div className="space-y-3">
            {visite.objet && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Objet</p>
                <p className="text-sm text-gray-700">{visite.objet}</p>
              </div>
            )}
            {visite.notes_preparation && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes de préparation</p>
                <p className="text-sm text-gray-700">{visite.notes_preparation}</p>
              </div>
            )}
            {visite.notes_visite && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes de visite</p>
                <p className="text-sm text-gray-700">{visite.notes_visite}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Observations */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Observations ({visite.observations?.length || 0})
          </h3>
          {(visite.statut === 'en_cours' || visite.statut === 'planifiee') && isOwner && (
            <button
              onClick={() => setShowAddObservation(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        <div className="p-4">
          {visite.observations && visite.observations.length > 0 ? (
            <div className="space-y-3">
              {visite.observations
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((obs) => (
                <ObservationItem key={obs.id} observation={obs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm">Aucune observation enregistrée</p>
              {(visite.statut === 'en_cours' || visite.statut === 'planifiee') && isOwner && (
                <button
                  onClick={() => setShowAddObservation(true)}
                  className="mt-3 text-sm text-orange-600 hover:underline"
                >
                  Ajouter la première observation
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conclusion (si terminée) */}
      {visite.statut === 'terminee' && visite.conclusion && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Conclusion</h3>
          </div>
          <p className="text-sm text-green-700">{visite.conclusion}</p>
        </div>
      )}

      {/* Modal ajout observation */}
      {showAddObservation && (
        <AddObservationModal
          visiteId={visite.id}
          onClose={() => setShowAddObservation(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['visite', params.id] });
          }}
        />
      )}
    </div>
  );
}
