'use client';

// ============================================
// PREV'HUB - Page Groupements
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGroupements } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  Building,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Folder,
} from 'lucide-react';
import type { Groupement } from '@/types';

// ============================================
// Composants
// ============================================

function GroupementCard({ groupement }: { groupement: Groupement }) {
  const [showMenu, setShowMenu] = useState(false);

  const prescriptionsActives = groupement.prescriptions?.filter(
    (p) => !['leve', 'valide', 'annule'].includes(p.statut)
  ).length || 0;

  const prescriptionsUrgentes = groupement.prescriptions?.filter(
    (p) => p.priorite === 'urgent' && !['leve', 'valide', 'annule'].includes(p.statut)
  ).length || 0;

  const prochaineCommission = groupement.commissions
    ?.filter((c) => new Date(c.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/groupements/${groupement.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Folder className="w-6 h-6 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{groupement.nom}</h3>
              <p className="text-sm text-gray-500 truncate">
                {groupement.type_groupement === 'multisite' && 'Multi-sites'}
                {groupement.type_groupement === 'copropriete' && 'Copropriété'}
                {groupement.type_groupement === 'bailleur' && 'Bailleur'}
                {groupement.type_groupement === 'enseigne' && 'Enseigne'}
                {!groupement.type_groupement && 'Groupement'}
              </p>
            </div>
          </div>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <Link
                  href={`/groupements/${groupement.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir détails
                </Link>
                <Link
                  href={`/groupements/${groupement.id}/modifier`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                <hr className="my-1 border-gray-100" />
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">
            {groupement.etablissements?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Établissements</p>
        </div>
        <div
          className={cn(
            'text-center p-2 rounded-lg',
            prescriptionsUrgentes > 0 ? 'bg-red-50' : 'bg-gray-50'
          )}
        >
          <p
            className={cn(
              'text-lg font-semibold',
              prescriptionsUrgentes > 0 ? 'text-red-600' : 'text-gray-900'
            )}
          >
            {prescriptionsActives}
          </p>
          <p className={cn('text-xs', prescriptionsUrgentes > 0 ? 'text-red-600' : 'text-gray-500')}>
            Prescriptions
          </p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">
            {groupement.commissions?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Commissions</p>
        </div>
      </div>

      {/* Prochaine commission */}
      {prochaineCommission && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">
              Prochaine commission :{' '}
              <span className="font-medium text-gray-900">
                {new Date(prochaineCommission.date).toLocaleDateString('fr-FR')}
              </span>
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Alertes */}
      {prescriptionsUrgentes > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{prescriptionsUrgentes} prescription{prescriptionsUrgentes > 1 ? 's' : ''} urgente{prescriptionsUrgentes > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function GroupementsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: groupements, isLoading } = useGroupements();

  // Filtrage
  const filteredGroupements = useMemo(() => {
    if (!groupements) return [];

    return groupements.filter((g) => {
      const matchSearch =
        !search ||
        g.nom.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase());

      const matchType = !typeFilter || g.type_groupement === typeFilter;

      return matchSearch && matchType;
    });
  }, [groupements, search, typeFilter]);

  // Statistiques
  const stats = useMemo(() => {
    if (!groupements) return { total: 0, etablissements: 0, prescriptions: 0 };

    return {
      total: groupements.length,
      etablissements: groupements.reduce((sum, g) => sum + (g.etablissements?.length || 0), 0),
      prescriptions: groupements.reduce(
        (sum, g) =>
          sum +
          (g.prescriptions?.filter((p) => !['leve', 'valide', 'annule'].includes(p.statut)).length ||
            0),
        0
      ),
    };
  }, [groupements]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groupements"
        subtitle={`${stats.total} groupement${stats.total > 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" size="sm" icon={Plus}>
            Nouveau groupement
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Folder className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Groupements</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.etablissements}</p>
              <p className="text-sm text-gray-500">Établissements</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
              <p className="text-sm text-gray-500">Prescriptions actives</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un groupement..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Tous les types</option>
          <option value="multisite">Multi-sites</option>
          <option value="copropriete">Copropriété</option>
          <option value="bailleur">Bailleur</option>
          <option value="enseigne">Enseigne</option>
        </select>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredGroupements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroupements.map((groupement) => (
            <GroupementCard key={groupement.id} groupement={groupement} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Folder}
          title="Aucun groupement trouvé"
          description={
            search || typeFilter
              ? 'Essayez de modifier vos critères de recherche.'
              : 'Créez votre premier groupement pour commencer.'
          }
          action={
            search || typeFilter
              ? {
                  label: 'Réinitialiser',
                  onClick: () => {
                    setSearch('');
                    setTypeFilter('');
                  },
                }
              : { label: 'Nouveau groupement', href: '/groupements/nouveau' }
          }
        />
      )}
    </div>
  );
}
