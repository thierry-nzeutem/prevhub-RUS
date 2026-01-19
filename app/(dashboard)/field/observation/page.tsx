'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Nouvelle Observation
// Formulaire de saisie d'observation terrain
// ============================================

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Camera,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Image as ImageIcon,
  X,
  Plus,
  Mic,
  MicOff,
  Building2,
  Save,
  Send,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type ObservationType = 'generale' | 'non_conformite' | 'point_positif' | 'recommandation';
type Priorite = 'basse' | 'normale' | 'haute' | 'urgente';

interface ObservationPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

// ============================================
// Configuration
// ============================================

const OBSERVATION_TYPES: { value: ObservationType; label: string; icon: any; color: string }[] = [
  { value: 'generale', label: 'Observation générale', icon: FileText, color: 'bg-gray-100 text-gray-600' },
  { value: 'non_conformite', label: 'Non-conformité', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  { value: 'point_positif', label: 'Point positif', icon: CheckCircle2, color: 'bg-green-100 text-green-600' },
  { value: 'recommandation', label: 'Recommandation', icon: Clock, color: 'bg-orange-100 text-orange-600' },
];

const PRIORITES: { value: Priorite; label: string; color: string }[] = [
  { value: 'basse', label: 'Basse', color: 'bg-gray-100 text-gray-600' },
  { value: 'normale', label: 'Normale', color: 'bg-blue-100 text-blue-600' },
  { value: 'haute', label: 'Haute', color: 'bg-orange-100 text-orange-600' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-600' },
];

// ============================================
// Composants
// ============================================

function PhotoThumbnail({ 
  photo, 
  onRemove 
}: { 
  photo: ObservationPhoto; 
  onRemove: () => void;
}) {
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
      <img
        src={photo.dataUrl}
        alt="Photo"
        className="w-full h-full object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

function TypeSelector({ 
  value, 
  onChange 
}: { 
  value: ObservationType; 
  onChange: (type: ObservationType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OBSERVATION_TYPES.map((type) => {
        const Icon = type.icon;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left',
              value === type.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white'
            )}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', type.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              'text-sm font-medium',
              value === type.value ? 'text-orange-700' : 'text-gray-700'
            )}>
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PrioriteSelector({ 
  value, 
  onChange 
}: { 
  value: Priorite; 
  onChange: (priorite: Priorite) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {PRIORITES.map((priorite) => (
        <button
          key={priorite.value}
          type="button"
          onClick={() => onChange(priorite.value)}
          className={cn(
            'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
            value === priorite.value
              ? cn(priorite.color, 'ring-2 ring-offset-1 ring-current')
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {priorite.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function FieldObservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visiteId = searchParams.get('visite_id');
  const etablissementId = searchParams.get('etablissement_id');

  const [type, setType] = useState<ObservationType>('generale');
  const [priorite, setPriorite] = useState<Priorite>('normale');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [photos, setPhotos] = useState<ObservationPhoto[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log('Erreur GPS:', error)
      );
    }
  }, []);

  // Ajouter une photo
  const handleAddPhoto = () => {
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPhoto: ObservationPhoto = {
            id: Date.now().toString(),
            dataUrl: event.target?.result as string,
            timestamp: new Date(),
          };
          setPhotos((prev) => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Supprimer une photo
  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Dictée vocale (simulation)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implémenter Web Speech API
  };

  // Sauvegarder
  const handleSave = async (asDraft = true) => {
    setIsSaving(true);
    try {
      // Préparer les données
      const observationData = {
        type,
        priorite,
        titre,
        description,
        localisation,
        visite_id: visiteId,
        etablissement_id: etablissementId,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        statut: asDraft ? 'brouillon' : 'validee',
        photos: photos.map((p) => p.dataUrl),
      };

      // Envoyer à l'API
      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(observationData),
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');

      // Retour à la visite ou page précédente
      if (visiteId) {
        router.push(`/field/visite/${visiteId}`);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = titre.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Nouvelle observation</h1>
            {gpsLocation && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Position GPS enregistrée
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="p-4 space-y-6">
        {/* Type d'observation */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Type d'observation
          </label>
          <TypeSelector value={type} onChange={setType} />
        </div>

        {/* Priorité (uniquement pour non-conformité) */}
        {type === 'non_conformite' && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Priorité
            </label>
            <PrioriteSelector value={priorite} onChange={setPriorite} />
          </div>
        )}

        {/* Titre */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex: Absence de signalétique sortie de secours"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900">
              Description <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={toggleRecording}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isRecording
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {isRecording ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre observation en détail..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
          {isRecording && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Dictée en cours...
            </p>
          )}
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Localisation dans le bâtiment
          </label>
          <input
            type="text"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
            placeholder="Ex: Niveau 2, couloir principal, côté escalier A"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Photos
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {photos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onRemove={() => handleRemovePhoto(photo.id)}
              />
            ))}
            <button
              type="button"
              onClick={handleAddPhoto}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs mt-1">Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || !isValid}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Brouillon
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving || !isValid}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Valider
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
