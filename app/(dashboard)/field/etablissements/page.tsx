'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Établissements
// Liste des établissements pour préventionnistes terrain
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useEtablissements } from '@/hooks/use-etablissements';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  Phone,
  Navigation,
  Star,
  StarOff,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Home,
  Calendar,
  Camera,
  User,
  Map,
  List,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type ViewMode = 'liste' | 'carte';
type FilterCategorie = 'all' | 1 | 2 | 3 | 4 | 5;

// ============================================
// Composants
// ============================================

function EtablissementCard({ etablissement }: { etablissement: any }) {
  const prescriptionsActives = etablissement.stats?.prescriptions_actives || 0;
  const prescriptionsEnRetard = etablissement.stats?.prescriptions_en_retard || 0;

  const openMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const address = encodeURIComponent(`${etablissement.adresse}, ${etablissement.code_postal} ${etablissement.ville}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  const callPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (etablissement.telephone) {
      window.location.href = `tel:${etablissement.telephone}`;
    }
  };

  return (
    <Link
      href={`/etablissements/${etablissement.id}`}
      className="block bg-white rounded-2xl border border-gray-200 overflow-hidden active:scale-[0.99] transition-transform"
    >
      {/* Header avec catégorie */}
      <div className={cn(
        'px-4 py-2 flex items-center justify-between',
        etablissement.categorie_erp === 1 ? 'bg-red-500' :
        etablissement.categorie_erp === 2 ? 'bg-orange-500' :
        etablissement.categorie_erp === 3 ? 'bg-yellow-500' :
        etablissement.categorie_erp === 4 ? 'bg-blue-500' :
        'bg-green-500'
      )}>
        <span className="text-white text-sm font-semibold">
          Catégorie {etablissement.categorie_erp}
        </span>
        <span className="text-white/80 text-xs">
          Type {etablissement.type_erp}
        </span>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {etablissement.nom_commercial}
        </h3>
        {etablissement.enseigne && etablissement.enseigne !== etablissement.nom_commercial && (
          <p className="text-sm text-gray-500 mb-2">{etablissement.enseigne}</p>
        )}
        
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
          <MapPin className="w-4 h-4" />
          {etablissement.adresse}, {etablissement.ville}
        </p>

        {/* Stats prescriptions */}
        {(prescriptionsActives > 0 || prescriptionsEnRetard > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {prescriptionsEnRetard > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {prescriptionsEnRetard} en retard
              </span>
            )}
            {prescriptionsActives > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                <Clock className="w-3 h-3" />
                {prescriptionsActives} active{prescriptionsActives > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={openMaps}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium"
          >
            <Navigation className="w-4 h-4" />
            Itinéraire
          </button>
          {etablissement.telephone && (
            <button
              onClick={callPhone}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center justify-center px-4 py-2 text-gray-400">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategorieFilter({ 
  value, 
  onChange 
}: { 
  value: FilterCategorie; 
  onChange: (cat: FilterCategorie) => void;
}) {
  const categories: { value: FilterCategorie; label: string; color: string }[] = [
    { value: 'all', label: 'Tous', color: 'bg-gray-100 text-gray-700' },
    { value: 1, label: 'Cat. 1', color: 'bg-red-100 text-red-700' },
    { value: 2, label: 'Cat. 2', color: 'bg-orange-100 text-orange-700' },
    { value: 3, label: 'Cat. 3', color: 'bg-yellow-100 text-yellow-700' },
    { value: 4, label: 'Cat. 4', color: 'bg-blue-100 text-blue-700' },
    { value: 5, label: 'Cat. 5', color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            value === cat.value
              ? cn(cat.color, 'ring-2 ring-offset-1', cat.value === 'all' ? 'ring-gray-300' : 'ring-current')
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function FieldEtablissementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<FilterCategorie>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('liste');

  const { data: etablissements, isLoading } = useEtablissements({
    categorie_erp: filterCategorie !== 'all' ? filterCategorie : undefined,
    recherche: searchQuery || undefined,
    limit: 50,
  });

  // Filtrer les résultats
  const filteredEtablissements = useMemo(() => {
    if (!etablissements) return [];
    return etablissements;
  }, [etablissements]);

  // Stats
  const stats = useMemo(() => {
    if (!etablissements) return { total: 0, avecPrescriptions: 0, enRetard: 0 };
    return {
      total: etablissements.length,
      avecPrescriptions: etablissements.filter((e: any) => e.stats?.prescriptions_actives > 0).length,
      enRetard: etablissements.filter((e: any) => e.stats?.prescriptions_en_retard > 0).length,
    };
  }, [etablissements]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Établissements</h1>
            <p className="text-sm text-gray-500">
              {stats.total} site{stats.total > 1 ? 's' : ''}
              {stats.enRetard > 0 && (
                <span className="text-red-600"> • {stats.enRetard} en alerte</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'liste' ? 'carte' : 'liste')}
              className={cn(
                'p-2 rounded-lg',
                'bg-gray-100 text-gray-600'
              )}
            >
              {viewMode === 'liste' ? <Map className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un établissement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filtres catégorie */}
        <CategorieFilter value={filterCategorie} onChange={setFilterCategorie} />
      </div>

      {/* Contenu */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : viewMode === 'liste' ? (
          <div className="space-y-4">
            {filteredEtablissements.length > 0 ? (
              filteredEtablissements.map((etablissement: any) => (
                <EtablissementCard key={etablissement.id} etablissement={etablissement} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Aucun établissement trouvé</p>
                <p className="text-sm text-gray-400 mt-1">
                  Modifiez vos critères de recherche
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Vue carte - placeholder */
          <div className="bg-white rounded-2xl border border-gray-200 h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Vue carte à venir</p>
              <p className="text-sm text-gray-400 mt-1">
                Utilisez la vue liste pour le moment
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation mobile bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <Link
            href="/field"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Accueil</span>
          </Link>
          <Link
            href="/field/planning"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Planning</span>
          </Link>
          <Link
            href="/field/photo"
            className="flex flex-col items-center justify-center -mt-4"
          >
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </Link>
          <Link
            href="/field/etablissements"
            className="flex flex-col items-center gap-1 p-2 text-orange-600"
          >
            <Building2 className="w-6 h-6" />
            <span className="text-xs font-medium">Sites</span>
          </Link>
          <Link
            href="/field/profil"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
