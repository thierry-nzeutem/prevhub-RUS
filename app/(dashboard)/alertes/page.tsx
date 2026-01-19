'use client';

// ============================================
// PREV'HUB - Page Alertes
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useAlertes, useAlertesStats, useTraiterAlerte } from '@/hooks/use-alertes';
import { cn, formatDate } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Check,
  X,
  ChevronRight,
  Filter,
  Building2,
  Calendar,
  FileText,
  Wrench,
  Search,
  RefreshCw,
  CheckCircle2,
  Archive,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type FilterNiveau = 'all' | 'critique' | 'urgent' | 'attention';
type FilterType = 'all' | 'prescription' | 'commission' | 'verification';

// ============================================
// Composants internes
// ============================================

function getNiveauStyle(niveau: string) {
  switch (niveau) {
    case 'critique':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        label: 'Critique',
      };
    case 'urgent':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        badge: 'bg-orange-100 text-orange-700',
        label: 'Urgent',
      };
    case 'attention':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700',
        label: 'Attention',
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: AlertCircle,
        iconColor: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
        label: 'Info',
      };
  }
}

function getTypeInfo(type: string) {
  switch (type) {
    case 'prescription':
      return { icon: FileText, label: 'Prescription', color: 'text-purple-500' };
    case 'commission':
      return { icon: Calendar, label: 'Commission', color: 'text-blue-500' };
    case 'verification':
      return { icon: Wrench, label: 'Vérification', color: 'text-green-500' };
    default:
      return { icon: AlertCircle, label: type, color: 'text-gray-500' };
  }
}

function getAlerteLink(alerte: any): string {
  switch (alerte.entite_type) {
    case 'prescription':
      return `/prescriptions/${alerte.entite_id}`;
    case 'commission':
      return `/commissions/${alerte.entite_id}`;
    case 'verification':
      return '/verifications';
    default:
      return '#';
  }
}

// ============================================
// Composant Page
// ============================================

export default function AlertesPage() {
  const [filterNiveau, setFilterNiveau] = useState<FilterNiveau>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTraitees, setShowTraitees] = useState(false);

  const stats = useAlertesStats();
  const { data: alertes, isLoading, refetch } = useAlertes({
    type: filterType !== 'all' ? filterType : undefined,
    niveau: filterNiveau !== 'all' ? filterNiveau : undefined,
  });
  const { mutate: traiter, isPending: isTraiting } = useTraiterAlerte();

  // Filtrer par recherche
  const filteredAlertes = alertes?.filter((alerte) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      alerte.message.toLowerCase().includes(search) ||
      (alerte.metadata?.nom_etablissement || '').toLowerCase().includes(search) ||
      (alerte.metadata?.numero_prescription || '').toLowerCase().includes(search)
    );
  });

  const handleTraiter = (id: string, statut: 'traitee' | 'ignoree') => {
    traiter({ alerteId: id, statut });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centre d'alertes</h1>
          <p className="text-gray-500 mt-1">
            Gérez et traitez les alertes de votre portefeuille
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          <span className="text-sm font-medium">Actualiser</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setFilterNiveau('critique')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all text-left',
            filterNiveau === 'critique'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-red-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.critique}</p>
              <p className="text-xs text-gray-500">Critiques</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterNiveau('urgent')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all text-left',
            filterNiveau === 'urgent'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white hover:border-orange-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              <p className="text-xs text-gray-500">Urgentes</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterNiveau('attention')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all text-left',
            filterNiveau === 'attention'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-yellow-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.attention}</p>
              <p className="text-xs text-gray-500">À surveiller</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterNiveau('all')}
          className={cn(
            'p-4 rounded-xl border-2 transition-all text-left',
            filterNiveau === 'all'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une alerte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Filtre par type */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {[
            { id: 'all', label: 'Tous' },
            { id: 'prescription', label: 'Prescriptions' },
            { id: 'commission', label: 'Commissions' },
            { id: 'verification', label: 'Vérifications' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as FilterType)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filterType === f.id
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement des alertes...</p>
          </div>
        ) : filteredAlertes && filteredAlertes.length > 0 ? (
          filteredAlertes.map((alerte) => {
            const niveauStyle = getNiveauStyle(alerte.niveau);
            const typeInfo = getTypeInfo(alerte.type);
            const NiveauIcon = niveauStyle.icon;
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={alerte.id}
                className={cn(
                  'bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md',
                  niveauStyle.border
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icône niveau */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    niveauStyle.bg
                  )}>
                    <NiveauIcon className={cn('w-6 h-6', niveauStyle.iconColor)} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold',
                        niveauStyle.badge
                      )}>
                        {niveauStyle.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <TypeIcon className={cn('w-3.5 h-3.5', typeInfo.color)} />
                        {typeInfo.label}
                      </span>
                      {alerte.jours_restants !== null && (
                        <span className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                          alerte.jours_restants <= 0
                            ? 'bg-red-100 text-red-700'
                            : alerte.jours_restants <= 7
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          <Clock className="w-3 h-3" />
                          {alerte.jours_restants <= 0
                            ? `En retard de ${Math.abs(alerte.jours_restants)}j`
                            : `${alerte.jours_restants}j restants`
                          }
                        </span>
                      )}
                    </div>

                    <p className="text-gray-900 font-medium mt-2">
                      {alerte.message}
                    </p>

                    {alerte.metadata?.nom_etablissement && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {alerte.metadata.nom_etablissement}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Créée le {formatDate(alerte.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTraiter(alerte.id, 'traitee')}
                      disabled={isTraiting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      title="Marquer comme traitée"
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Traiter</span>
                    </button>
                    <button
                      onClick={() => handleTraiter(alerte.id, 'ignoree')}
                      disabled={isTraiting}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      title="Ignorer"
                    >
                      <Archive className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Ignorer</span>
                    </button>
                    <Link
                      href={getAlerteLink(alerte)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                      title="Voir le détail"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-sm font-medium hidden sm:inline">Voir</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-900 font-medium">Aucune alerte active</p>
            <p className="text-sm text-gray-500 mt-1">
              {filterNiveau !== 'all' || filterType !== 'all'
                ? 'Modifiez vos filtres pour voir plus d\'alertes'
                : 'Félicitations ! Votre portefeuille est sous contrôle'
              }
            </p>
            {(filterNiveau !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setFilterNiveau('all');
                  setFilterType('all');
                }}
                className="mt-4 text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
