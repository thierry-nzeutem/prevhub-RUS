'use client';

// ============================================
// PREV'HUB - Page Prestataires
// Gestion de la base de données prestataires
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { usePrestataires, useCreatePrestataire } from '@/hooks/use-prestataires';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  StarOff,
  Shield,
  Award,
  Wrench,
  ChevronRight,
  MoreHorizontal,
  Check,
  X,
  Loader2,
  Users,
  Calendar,
  TrendingUp,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type FilterDomaine = 'all' | 'extincteurs' | 'desenfumage' | 'electricite' | 'alarme' | 'ascenseurs' | 'portes_cf' | 'autre';

// ============================================
// Composants
// ============================================

function DomaineTag({ domaine }: { domaine: string }) {
  const colorMap: Record<string, string> = {
    extincteurs: 'bg-red-100 text-red-700',
    desenfumage: 'bg-sky-100 text-sky-700',
    electricite: 'bg-yellow-100 text-yellow-700',
    alarme: 'bg-purple-100 text-purple-700',
    ascenseurs: 'bg-green-100 text-green-700',
    portes_cf: 'bg-orange-100 text-orange-700',
    sprinklers: 'bg-blue-100 text-blue-700',
    eclairage_securite: 'bg-amber-100 text-amber-700',
    default: 'bg-gray-100 text-gray-700',
  };

  const labelMap: Record<string, string> = {
    extincteurs: 'Extincteurs',
    desenfumage: 'Désenfumage',
    electricite: 'Électricité',
    alarme: 'Alarme incendie',
    ascenseurs: 'Ascenseurs',
    portes_cf: 'Portes CF',
    sprinklers: 'Sprinklers',
    eclairage_securite: 'Éclairage sécurité',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colorMap[domaine] || colorMap.default)}>
      {labelMap[domaine] || domaine}
    </span>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses,
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

function PrestataireCard({ prestataire }: { prestataire: any }) {
  return (
    <Link
      href={`/prestataires/${prestataire.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar/Logo */}
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {prestataire.raison_sociale}
              </h3>
              {prestataire.is_favorite && (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              )}
            </div>

            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {prestataire.ville}
              {prestataire.departement && ` (${prestataire.departement})`}
            </p>

            {/* Domaines */}
            <div className="flex flex-wrap gap-1 mt-2">
              {prestataire.domaines_expertise?.slice(0, 3).map((domaine: string) => (
                <DomaineTag key={domaine} domaine={domaine} />
              ))}
              {prestataire.domaines_expertise?.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{prestataire.domaines_expertise.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Rating */}
          {prestataire.note_moyenne > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={prestataire.note_moyenne} />
              <span className="text-xs text-gray-500">
                ({prestataire.nb_interventions || 0})
              </span>
            </div>
          )}

          {/* Certifications */}
          {prestataire.certifications?.length > 0 && (
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">
                {prestataire.certifications.length} cert.
              </span>
            </div>
          )}

          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal création
// ============================================

function CreatePrestataireModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    raison_sociale: '',
    siret: '',
    adresse: '',
    code_postal: '',
    ville: '',
    telephone: '',
    email: '',
    domaines_expertise: [] as string[],
  });

  const { mutate: createPrestataire, isPending } = useCreatePrestataire();

  const domaines = [
    { id: 'extincteurs', label: 'Extincteurs' },
    { id: 'desenfumage', label: 'Désenfumage' },
    { id: 'electricite', label: 'Électricité' },
    { id: 'alarme', label: 'Alarme incendie' },
    { id: 'ascenseurs', label: 'Ascenseurs' },
    { id: 'portes_cf', label: 'Portes CF' },
    { id: 'sprinklers', label: 'Sprinklers' },
    { id: 'eclairage_securite', label: 'Éclairage sécurité' },
  ];

  const toggleDomaine = (domaineId: string) => {
    setFormData((prev) => ({
      ...prev,
      domaines_expertise: prev.domaines_expertise.includes(domaineId)
        ? prev.domaines_expertise.filter((d) => d !== domaineId)
        : [...prev.domaines_expertise, domaineId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPrestataire(formData, {
      onSuccess: () => {
        onClose();
        setFormData({
          raison_sociale: '',
          siret: '',
          adresse: '',
          code_postal: '',
          ville: '',
          telephone: '',
          email: '',
          domaines_expertise: [],
        });
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau prestataire</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison sociale *
            </label>
            <input
              type="text"
              required
              value={formData.raison_sociale}
              onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET
            </label>
            <input
              type="text"
              value={formData.siret}
              onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="12345678901234"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={formData.code_postal}
                onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaines d'expertise
            </label>
            <div className="grid grid-cols-2 gap-2">
              {domaines.map((domaine) => (
                <button
                  key={domaine.id}
                  type="button"
                  onClick={() => toggleDomaine(domaine.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    formData.domaines_expertise.includes(domaine.id)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  )}
                >
                  {domaine.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !formData.raison_sociale}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function PrestatairesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomaine, setFilterDomaine] = useState<FilterDomaine>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: prestataires, isLoading } = usePrestataires({
    domaine: filterDomaine !== 'all' ? filterDomaine : undefined,
    recherche: searchQuery || undefined,
  });

  // Stats
  const stats = {
    total: prestataires?.length || 0,
    favoris: prestataires?.filter((p: any) => p.is_favorite).length || 0,
    certifies: prestataires?.filter((p: any) => p.certifications?.length > 0).length || 0,
    actifs: prestataires?.filter((p: any) => p.actif).length || 0,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestataires</h1>
          <p className="text-gray-500 mt-1">
            Base de données des entreprises partenaires
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau prestataire</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          icon={Users}
          label="Total prestataires"
          value={stats.total}
          color="bg-gray-100 text-gray-600"
        />
        <StatsCard
          icon={Star}
          label="Favoris"
          value={stats.favoris}
          color="bg-yellow-100 text-yellow-600"
        />
        <StatsCard
          icon={Award}
          label="Certifiés"
          value={stats.certifies}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Actifs"
          value={stats.actifs}
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un prestataire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filtre domaine */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'extincteurs', label: 'Extincteurs' },
            { id: 'desenfumage', label: 'Désenfumage' },
            { id: 'electricite', label: 'Électricité' },
            { id: 'alarme', label: 'Alarme' },
            { id: 'ascenseurs', label: 'Ascenseurs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterDomaine(f.id as FilterDomaine)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                filterDomaine === f.id
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement des prestataires...</p>
          </div>
        ) : prestataires && prestataires.length > 0 ? (
          prestataires.map((prestataire: any) => (
            <PrestataireCard key={prestataire.id} prestataire={prestataire} />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Aucun prestataire trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || filterDomaine !== 'all'
                ? 'Modifiez vos critères de recherche'
                : 'Commencez par ajouter un prestataire'
              }
            </p>
            {(!searchQuery && filterDomaine === 'all') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium"
              >
                Ajouter un prestataire
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal création */}
      <CreatePrestataireModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
