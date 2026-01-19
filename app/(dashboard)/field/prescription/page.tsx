'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Nouvelle Prescription
// Création de prescription terrain avec IA
// ============================================

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Camera,
  MapPin,
  FileText,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  X,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Save,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  Wrench,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type Priorite = 'normal' | 'haute' | 'urgent';
type TypeInstallation = 
  | 'extincteurs' 
  | 'desenfumage' 
  | 'ssi' 
  | 'eclairage_securite' 
  | 'portes_cf'
  | 'ria'
  | 'electricite'
  | 'autre';

interface Photo {
  id: string;
  dataUrl: string;
}

// ============================================
// Configuration
// ============================================

const PRIORITES: { value: Priorite; label: string; color: string; delai: string }[] = [
  { value: 'normal', label: 'Normal', color: 'bg-gray-100 text-gray-600', delai: '6 mois' },
  { value: 'haute', label: 'Haute', color: 'bg-orange-100 text-orange-600', delai: '3 mois' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600', delai: '1 mois' },
];

const TYPES_INSTALLATION: { value: TypeInstallation; label: string; icon: string }[] = [
  { value: 'extincteurs', label: 'Extincteurs / RIA', icon: '🧯' },
  { value: 'desenfumage', label: 'Désenfumage', icon: '💨' },
  { value: 'ssi', label: 'SSI / Alarme', icon: '🔔' },
  { value: 'eclairage_securite', label: 'Éclairage de sécurité', icon: '💡' },
  { value: 'portes_cf', label: 'Portes coupe-feu', icon: '🚪' },
  { value: 'electricite', label: 'Électricité', icon: '⚡' },
  { value: 'ria', label: 'RIA / Colonnes', icon: '🚿' },
  { value: 'autre', label: 'Autre', icon: '📦' },
];

// ============================================
// Composants
// ============================================

function PhotoThumbnail({ photo, onRemove }: { photo: Photo; onRemove: () => void }) {
  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
      <img src={photo.dataUrl} alt="Photo" className="w-full h-full object-cover" />
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

function AIReformulationCard({
  original,
  reformule,
  score,
  isLoading,
  onAccept,
  onReject,
  onRetry,
}: {
  original: string;
  reformule: string | null;
  score: number | null;
  isLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
}) {
  if (!original.trim()) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 overflow-hidden">
      <div className="px-4 py-3 bg-white/50 border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-purple-900">Reformulation IA</span>
        </div>
        {score !== null && (
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            score >= 0.8 ? 'bg-green-100 text-green-700' :
            score >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          )}>
            {Math.round(score * 100)}% confiance
          </span>
        )}
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
              <span className="text-purple-700">Reformulation en cours...</span>
            </div>
          </div>
        ) : reformule ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Texte original :</p>
              <p className="text-sm text-gray-600 line-through">{original}</p>
            </div>
            <div>
              <p className="text-xs text-purple-600 mb-1">Texte reformulé :</p>
              <p className="text-sm text-gray-900 font-medium">{reformule}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium"
              >
                <ThumbsUp className="w-4 h-4" />
                Utiliser
              </button>
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
              >
                <ThumbsDown className="w-4 h-4" />
                Garder l'original
              </button>
              <button
                onClick={onRetry}
                className="p-2 bg-purple-100 text-purple-600 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Commencez à saisir pour obtenir une reformulation IA
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function FieldPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visiteId = searchParams.get('visite_id');
  const etablissementId = searchParams.get('etablissement_id');

  // Form state
  const [typeInstallation, setTypeInstallation] = useState<TypeInstallation>('extincteurs');
  const [priorite, setPriorite] = useState<Priorite>('normal');
  const [descriptionOriginale, setDescriptionOriginale] = useState('');
  const [descriptionFinale, setDescriptionFinale] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dateLimite, setDateLimite] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // IA state
  const [reformulationIA, setReformulationIA] = useState<string | null>(null);
  const [scoreIA, setScoreIA] = useState<number | null>(null);
  const [isReformulating, setIsReformulating] = useState(false);
  const [useReformulation, setUseReformulation] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('GPS error:', err)
      );
    }
  }, []);

  // Calcul de la date limite par défaut selon priorité
  useEffect(() => {
    const now = new Date();
    let months = 6; // normal
    if (priorite === 'haute') months = 3;
    if (priorite === 'urgent') months = 1;
    
    const limite = new Date(now.setMonth(now.getMonth() + months));
    setDateLimite(limite.toISOString().split('T')[0]);
  }, [priorite]);

  // Reformulation IA avec debounce
  useEffect(() => {
    if (descriptionOriginale.trim().length < 10) {
      setReformulationIA(null);
      setScoreIA(null);
      return;
    }

    const timer = setTimeout(() => {
      reformulerDescription();
    }, 1500);

    return () => clearTimeout(timer);
  }, [descriptionOriginale, typeInstallation]);

  const reformulerDescription = async () => {
    if (descriptionOriginale.trim().length < 10) return;
    
    setIsReformulating(true);
    try {
      const response = await fetch('/api/ai/reformulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texte_original: descriptionOriginale,
          type_installation: typeInstallation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReformulationIA(data.data.texte_reformule);
        setScoreIA(data.data.score_confiance);
      }
    } catch (error) {
      console.error('Erreur reformulation:', error);
    } finally {
      setIsReformulating(false);
    }
  };

  const handleAcceptReformulation = () => {
    if (reformulationIA) {
      setDescriptionFinale(reformulationIA);
      setUseReformulation(true);
    }
  };

  const handleRejectReformulation = () => {
    setDescriptionFinale(descriptionOriginale);
    setUseReformulation(false);
  };

  // Ajouter une photo
  const handleAddPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotos((prev) => [...prev, {
            id: Date.now().toString(),
            dataUrl: event.target?.result as string,
          }]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Sauvegarder
  const handleSave = async (asDraft = true) => {
    setIsSaving(true);
    try {
      const prescriptionData = {
        type_installation: typeInstallation,
        priorite,
        description_originale: descriptionOriginale,
        description_reformulee: useReformulation ? reformulationIA : null,
        description_complete: descriptionFinale || descriptionOriginale,
        localisation,
        date_limite_conformite: dateLimite,
        visite_id: visiteId,
        etablissement_id: etablissementId,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        statut: asDraft ? 'brouillon' : 'nouveau',
        photos: photos.map((p) => p.dataUrl),
        score_reformulation_ia: useReformulation ? scoreIA : null,
      };

      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData),
      });

      if (!response.ok) throw new Error('Erreur sauvegarde');

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

  const isValid = (descriptionOriginale.trim().length >= 10 || descriptionFinale.trim().length >= 10);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white/20 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Nouvelle prescription</h1>
            {gpsLocation && (
              <p className="text-xs text-orange-100 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Position enregistrée
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="p-4 space-y-6">
        {/* Type d'installation */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Type d'installation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES_INSTALLATION.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setTypeInstallation(type.value)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left',
                  typeInstallation === type.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white'
                )}
              >
                <span className="text-xl">{type.icon}</span>
                <span className={cn(
                  'text-sm font-medium',
                  typeInstallation === type.value ? 'text-orange-700' : 'text-gray-700'
                )}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Priorité */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Priorité
          </label>
          <div className="flex items-center gap-2">
            {PRIORITES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriorite(p.value)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  priorite === p.value
                    ? cn(p.color, 'ring-2 ring-offset-1 ring-current')
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                <div>{p.label}</div>
                <div className="text-xs opacity-75">{p.delai}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={descriptionOriginale}
            onChange={(e) => setDescriptionOriginale(e.target.value)}
            placeholder="Décrivez la non-conformité ou l'observation..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
        </div>

        {/* Reformulation IA */}
        <AIReformulationCard
          original={descriptionOriginale}
          reformule={reformulationIA}
          score={scoreIA}
          isLoading={isReformulating}
          onAccept={handleAcceptReformulation}
          onReject={handleRejectReformulation}
          onRetry={reformulerDescription}
        />

        {/* Localisation */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Localisation
          </label>
          <input
            type="text"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
            placeholder="Ex: RDC, couloir principal, près de l'escalier B"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Date limite */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Date limite de conformité
          </label>
          <input
            type="date"
            value={dateLimite}
            onChange={(e) => setDateLimite(e.target.value)}
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
                onRemove={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
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
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
