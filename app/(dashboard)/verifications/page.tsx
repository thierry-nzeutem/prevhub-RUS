'use client';

// ============================================
// PREV'HUB - Page Vérifications Techniques
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useVerificationsAlertes, useGroupements } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingTable,
  VerificationStatusBadge,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  Filter,
  Wrench,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Download,
  X,
  RefreshCw,
} from 'lucide-react';

// ============================================
// Types locaux
// ============================================

interface Verification {
  id: string;
  installation: {
    id: string;
    nom: string;
    type_installation: string;
    etablissement?: { id: string; nom_commercial: string };
    groupement?: { id: string; nom: string };
  };
  date_verification: string;
  date_prochaine_verification: string;
  organisme_verificateur: string;
  est_conforme: boolean;
  observations?: string;
  statut_alerte: 'a_jour' | 'a_prevoir' | 'urgent' | 'en_retard';
  jours_restants: number;
}

// ============================================
// Composants
// ============================================

function VerificationCard({ verification }: { verification: Verification }) {
  const statusConfig = {
    a_jour: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      label: 'À jour',
    },
    a_prevoir: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Calendar,
      iconColor: 'text-blue-500',
      label: 'À prévoir',
    },
    urgent: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: Clock,
      iconColor: 'text-orange-500',
      label: 'Urgent',
    },
    en_retard: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      label: 'En retard',
    },
  };

  const status = statusConfig[verification.statut_alerte];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all hover:shadow-md',
        status.bg,
        status.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              status.bg === 'bg-green-50' && 'bg-green-100',
              status.bg === 'bg-blue-50' && 'bg-blue-100',
              status.bg === 'bg-orange-50' && 'bg-orange-100',
              status.bg === 'bg-red-50' && 'bg-red-100'
            )}
          >
            <Wrench className={cn('w-5 h-5', status.iconColor)} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{verification.installation.nom}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {verification.installation.type_installation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-5 h-5', status.iconColor)} />
          <span
            className={cn(
              'text-sm font-medium',
              status.iconColor.replace('text-', 'text-').replace('-500', '-700')
            )}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Établissement</p>
          <p className="font-medium text-gray-900">
            {verification.installation.etablissement?.nom_commercial ||
              verification.installation.groupement?.nom ||
              '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Organisme</p>
          <p className="font-medium text-gray-900">
            {verification.organisme_verificateur || '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Dernière vérification</p>
          <p className="font-medium text-gray-900">
            {verification.date_verification
              ? new Date(verification.date_verification).toLocaleDateString('fr-FR')
              : '-'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Prochaine échéance</p>
          <p
            className={cn(
              'font-medium',
              verification.jours_restants < 0 && 'text-red-600',
              verification.jours_restants >= 0 && verification.jours_restants <= 30 && 'text-orange-600',
              verification.jours_restants > 30 && 'text-gray-900'
            )}
          >
            {verification.date_prochaine_verification
              ? new Date(verification.date_prochaine_verification).toLocaleDateString('fr-FR')
              : '-'}
            {verification.jours_restants !== null && (
              <span className="ml-1 text-xs">
                ({verification.jours_restants < 0
                  ? `${Math.abs(verification.jours_restants)}j de retard`
                  : `J-${verification.jours_restants}`})
              </span>
            )}
          </p>
        </div>
      </div>

      {!verification.est_conforme && verification.observations && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">{verification.observations}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verification.est_conforme ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Conforme
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Non conforme
            </span>
          )}
        </div>
        <Button variant="outline" size="sm">
          Voir détails
        </Button>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function VerificationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [groupementFilter, setGroupementFilter] = useState<string>('');

  const { data: verifications, isLoading, refetch } = useVerificationsAlertes();
  const { data: groupements } = useGroupements();

  // Types d'installations uniques
  const typesInstallation = useMemo(() => {
    if (!verifications) return [];
    const types = new Set(verifications.map((v: Verification) => v.installation.type_installation));
    return Array.from(types).filter(Boolean);
  }, [verifications]);

  // Filtrage
  const filteredVerifications = useMemo(() => {
    if (!verifications) return [];

    return verifications.filter((v: Verification) => {
      const matchSearch =
        !search ||
        v.installation.nom.toLowerCase().includes(search.toLowerCase()) ||
        v.installation.etablissement?.nom_commercial?.toLowerCase().includes(search.toLowerCase()) ||
        v.installation.groupement?.nom?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = !statusFilter || v.statut_alerte === statusFilter;
      const matchType = !typeFilter || v.installation.type_installation === typeFilter;
      const matchGroupement =
        !groupementFilter || v.installation.groupement?.id === groupementFilter;

      return matchSearch && matchStatus && matchType && matchGroupement;
    });
  }, [verifications, search, statusFilter, typeFilter, groupementFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!verifications) return { total: 0, enRetard: 0, urgent: 0, aJour: 0 };

    return {
      total: verifications.length,
      enRetard: verifications.filter((v: Verification) => v.statut_alerte === 'en_retard').length,
      urgent: verifications.filter((v: Verification) => v.statut_alerte === 'urgent').length,
      aJour: verifications.filter((v: Verification) => v.statut_alerte === 'a_jour').length,
    };
  }, [verifications]);

  const hasFilters = statusFilter || typeFilter || groupementFilter || search;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vérifications techniques"
        subtitle={`${stats.total} installation${stats.total > 1 ? 's' : ''} suivie${stats.total > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>
              Actualiser
            </Button>
            <Button variant="outline" size="sm" icon={Download}>
              Exporter
            </Button>
            <Button variant="primary" size="sm" icon={Plus}>
              Nouvelle vérification
            </Button>
          </div>
        }
      />

      {/* Alertes */}
      {stats.enRetard > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              {stats.enRetard} vérification{stats.enRetard > 1 ? 's' : ''} en retard
            </p>
            <p className="text-sm text-red-600">
              Action immédiate requise pour maintenir la conformité réglementaire.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setStatusFilter('en_retard')}
          >
            Voir
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            !statusFilter
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter('en_retard')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            statusFilter === 'en_retard'
              ? 'bg-red-100 border-red-300'
              : 'bg-red-50 border-red-200 hover:border-red-300'
          )}
        >
          <p className="text-2xl font-bold text-red-600">{stats.enRetard}</p>
          <p className="text-sm text-red-600">En retard</p>
        </button>
        <button
          onClick={() => setStatusFilter('urgent')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            statusFilter === 'urgent'
              ? 'bg-orange-100 border-orange-300'
              : 'bg-orange-50 border-orange-200 hover:border-orange-300'
          )}
        >
          <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
          <p className="text-sm text-orange-600">Urgent (30j)</p>
        </button>
        <button
          onClick={() => setStatusFilter('a_jour')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            statusFilter === 'a_jour'
              ? 'bg-green-100 border-green-300'
              : 'bg-green-50 border-green-200 hover:border-green-300'
          )}
        >
          <p className="text-2xl font-bold text-green-600">{stats.aJour}</p>
          <p className="text-sm text-green-600">À jour</p>
        </button>
      </div>

      {/* Filtres */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une installation..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Tous les types</option>
            {typesInstallation.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={groupementFilter}
            onChange={(e) => setGroupementFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Tous les groupements</option>
            {groupements?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="mt-4 flex items-center gap-2">
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                Statut: {statusFilter}
                <button onClick={() => setStatusFilter('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {typeFilter}
                <button onClick={() => setTypeFilter('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {groupementFilter && groupements && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {groupements.find((g) => g.id === groupementFilter)?.nom}
                <button onClick={() => setGroupementFilter('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                setGroupementFilter('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tout effacer
            </button>
          </div>
        )}
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredVerifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVerifications.map((verification: Verification) => (
            <VerificationCard key={verification.id} verification={verification} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="Aucune vérification trouvée"
          description={
            hasFilters
              ? 'Essayez de modifier vos critères de recherche.'
              : 'Ajoutez vos premières vérifications techniques.'
          }
          action={
            hasFilters
              ? {
                  label: 'Réinitialiser',
                  onClick: () => {
                    setSearch('');
                    setStatusFilter('');
                    setTypeFilter('');
                    setGroupementFilter('');
                  },
                }
              : { label: 'Nouvelle vérification', href: '/verifications/nouvelle' }
          }
        />
      )}
    </div>
  );
}
