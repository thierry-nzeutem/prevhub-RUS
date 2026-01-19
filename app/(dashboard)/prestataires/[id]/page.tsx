'use client';

// ============================================
// PREV'HUB - Page Détail Prestataire
// ============================================

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrestataire, useUpdatePrestataire, useToggleFavoriPrestataire, useRatePrestataire, DOMAINES_EXPERTISE } from '@/hooks/use-prestataires';
import { cn, formatDate } from '@/lib/utils';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Award,
  Edit2,
  Save,
  X,
  ChevronLeft,
  Loader2,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  field: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
}

// ============================================
// Composants
// ============================================

function EditableField({ label, value, field, type = 'text', isEditing, onChange }: EditableFieldProps) {
  if (!isEditing) {
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900">{value || '-'}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
      />
    </div>
  );
}

function StarRating({ 
  rating, 
  size = 'md',
  interactive = false,
  onChange,
}: { 
  rating: number; 
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            sizeClasses[size],
            interactive && 'cursor-pointer hover:scale-110 transition-transform'
          )}
        >
          <Star
            className={cn(
              'w-full h-full',
              (hoverRating || rating) >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function DomaineTag({ domaine, selected = false, onClick }: { domaine: string; selected?: boolean; onClick?: () => void }) {
  const domaineInfo = DOMAINES_EXPERTISE.find((d) => d.id === domaine);
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        selected
          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        !onClick && 'cursor-default'
      )}
    >
      {domaineInfo?.icon} {domaineInfo?.label || domaine}
    </button>
  );
}

// ============================================
// Page principale
// ============================================

export default function PrestataireDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prestataireId = params.id as string;

  const { data: prestataire, isLoading } = usePrestataire(prestataireId);
  const { mutate: updatePrestataire, isPending: isUpdating } = useUpdatePrestataire();
  const { mutate: toggleFavori } = useToggleFavoriPrestataire();
  const { mutate: ratePrestataire } = useRatePrestataire();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialiser le formulaire
  const startEditing = () => {
    setFormData({
      raison_sociale: prestataire?.raison_sociale || '',
      siret: prestataire?.siret || '',
      adresse: prestataire?.adresse || '',
      code_postal: prestataire?.code_postal || '',
      ville: prestataire?.ville || '',
      telephone: prestataire?.telephone || '',
      email: prestataire?.email || '',
      site_web: prestataire?.site_web || '',
      contact_nom: prestataire?.contact_nom || '',
      contact_prenom: prestataire?.contact_prenom || '',
      contact_telephone: prestataire?.contact_telephone || '',
      contact_email: prestataire?.contact_email || '',
      domaines_expertise: prestataire?.domaines_expertise || [],
      commentaires: prestataire?.commentaires || '',
    });
    setIsEditing(true);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDomaine = (domaineId: string) => {
    const currentDomaines = formData.domaines_expertise || [];
    const newDomaines = currentDomaines.includes(domaineId)
      ? currentDomaines.filter((d: string) => d !== domaineId)
      : [...currentDomaines, domaineId];
    handleChange('domaines_expertise', newDomaines);
  };

  const handleSave = () => {
    updatePrestataire(
      { id: prestataireId, ...formData },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleToggleFavori = () => {
    if (prestataire) {
      toggleFavori({ id: prestataireId, isFavorite: !prestataire.is_favorite });
    }
  };

  const handleRate = (note: number) => {
    ratePrestataire({ id: prestataireId, note });
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!prestataire) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Prestataire non trouvé</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-orange-600 font-medium"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{prestataire.raison_sociale}</h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {prestataire.ville}
              {prestataire.departement && ` (${prestataire.departement})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavori}
            className={cn(
              'p-2 rounded-lg transition-colors',
              prestataire.is_favorite
                ? 'bg-yellow-100 text-yellow-600'
                : 'hover:bg-gray-100 text-gray-400'
            )}
          >
            <Star className={cn('w-5 h-5', prestataire.is_favorite && 'fill-yellow-400')} />
          </button>

          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {prestataire.note_moyenne?.toFixed(1) || '-'}
              </p>
              <p className="text-xs text-gray-500">Note moyenne</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {prestataire.nb_interventions || 0}
              </p>
              <p className="text-xs text-gray-500">Interventions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {prestataire.delai_moyen_intervention || '-'}
              </p>
              <p className="text-xs text-gray-500">Délai moyen (j)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {prestataire.certifications?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Certifications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Coordonnées */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                Informations entreprise
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <EditableField
                label="Raison sociale"
                value={isEditing ? formData.raison_sociale : prestataire.raison_sociale}
                field="raison_sociale"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="SIRET"
                value={isEditing ? formData.siret : prestataire.siret}
                field="siret"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Adresse"
                value={isEditing ? formData.adresse : prestataire.adresse}
                field="adresse"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <div className="grid grid-cols-2 gap-2">
                <EditableField
                  label="Code postal"
                  value={isEditing ? formData.code_postal : prestataire.code_postal}
                  field="code_postal"
                  isEditing={isEditing}
                  onChange={handleChange}
                />
                <EditableField
                  label="Ville"
                  value={isEditing ? formData.ville : prestataire.ville}
                  field="ville"
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
              <EditableField
                label="Téléphone"
                value={isEditing ? formData.telephone : prestataire.telephone}
                field="telephone"
                type="tel"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Email"
                value={isEditing ? formData.email : prestataire.email}
                field="email"
                type="email"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <div className="col-span-2">
                <EditableField
                  label="Site web"
                  value={isEditing ? formData.site_web : prestataire.site_web}
                  field="site_web"
                  type="url"
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                Contact principal
              </h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <EditableField
                label="Prénom"
                value={isEditing ? formData.contact_prenom : prestataire.contact_prenom}
                field="contact_prenom"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Nom"
                value={isEditing ? formData.contact_nom : prestataire.contact_nom}
                field="contact_nom"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Téléphone"
                value={isEditing ? formData.contact_telephone : prestataire.contact_telephone}
                field="contact_telephone"
                type="tel"
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Email"
                value={isEditing ? formData.contact_email : prestataire.contact_email}
                field="contact_email"
                type="email"
                isEditing={isEditing}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Commentaires */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Notes internes</h2>
            </div>
            <div className="p-4">
              {isEditing ? (
                <textarea
                  value={formData.commentaires || ''}
                  onChange={(e) => handleChange('commentaires', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Notes internes sur ce prestataire..."
                />
              ) : (
                <p className="text-gray-600">
                  {prestataire.commentaires || 'Aucune note'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Domaines d'expertise */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Domaines d'expertise</h2>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  DOMAINES_EXPERTISE.map((domaine) => (
                    <DomaineTag
                      key={domaine.id}
                      domaine={domaine.id}
                      selected={(formData.domaines_expertise || []).includes(domaine.id)}
                      onClick={() => handleToggleDomaine(domaine.id)}
                    />
                  ))
                ) : prestataire.domaines_expertise?.length > 0 ? (
                  prestataire.domaines_expertise.map((domaine: string) => (
                    <DomaineTag key={domaine} domaine={domaine} />
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Aucun domaine renseigné</p>
                )}
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-gray-400" />
                Certifications
              </h2>
            </div>
            <div className="p-4">
              {prestataire.certifications?.length > 0 ? (
                <ul className="space-y-2">
                  {prestataire.certifications.map((cert: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      {cert}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">Aucune certification</p>
              )}
            </div>
          </div>

          {/* Évaluer */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Évaluer ce prestataire</h2>
            </div>
            <div className="p-4 text-center">
              <StarRating
                rating={prestataire.note_moyenne || 0}
                size="lg"
                interactive
                onChange={handleRate}
              />
              <p className="text-xs text-gray-500 mt-2">
                Cliquez pour noter (basé sur {prestataire.nb_interventions || 0} intervention{(prestataire.nb_interventions || 0) > 1 ? 's' : ''})
              </p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {prestataire.telephone && (
                <a
                  href={`tel:${prestataire.telephone}`}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </a>
              )}
              {prestataire.email && (
                <a
                  href={`mailto:${prestataire.email}`}
                  className="flex items-center gap-2 w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Mail className="w-4 h-4" />
                  Envoyer un email
                </a>
              )}
              {prestataire.site_web && (
                <a
                  href={prestataire.site_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Globe className="w-4 h-4" />
                  Voir le site web
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
