'use client';

// ============================================
// PREV'HUB - Page Établissements
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEtablissements, useGroupements } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingTable,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  Filter,
  Building2,
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  ChevronDown,
  X,
  Download,
} from 'lucide-react';
import type { Etablissement, FiltresEtablissements, TypeERP, CategorieERP } from '@/types';

// ============================================
// Composants
// ============================================

function EtablissementRow({ etablissement }: { etablissement: Etablissement }) {
  const router = useRouter();

  const prescriptionsActives =
    etablissement.prescriptions?.filter(
      (p) => !['leve', 'valide', 'annule'].includes(p.statut)
    ).length || 0;

  const avisLastCommission =
    etablissement.commissions?.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]?.avis;

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push(`/etablissements/${etablissement.id}`)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-gray-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {etablissement.nom_commercial || etablissement.enseigne || 'Sans nom'}
            </p>
            {etablissement.enseigne && etablissement.nom_commercial !== etablissement.enseigne && (
              <p className="text-sm text-gray-500 truncate">{etablissement.enseigne}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate max-w-[200px]">
            {etablissement.ville || etablissement.adresse || '-'}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        {etablissement.type_erp ? (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
            Type {etablissement.type_erp}
            {etablissement.categorie_erp && ` - Cat. ${etablissement.categorie_erp}`}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-4">
        {etablissement.groupement ? (
          <Link
            href={`/groupements/${etablissement.groupement.id}`}
            className="text-sm text-orange-600 hover:text-orange-700"
            onClick={(e) => e.stopPropagation()}
          >
            {etablissement.groupement.nom}
          </Link>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-4">
        {avisLastCommission && (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
              avisLastCommission === 'favorable' && 'bg-green-100 text-green-700',
              avisLastCommission === 'defavorable' && 'bg-red-100 text-red-700',
              avisLastCommission === 'avis_suspendu' && 'bg-yellow-100 text-yellow-700'
            )}
          >
            {avisLastCommission === 'favorable' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {avisLastCommission === 'defavorable' && <AlertTriangle className="w-3.5 h-3.5" />}
            {avisLastCommission === 'favorable' ? 'Favorable' : avisLastCommission === 'defavorable' ? 'Défavorable' : 'Suspendu'}
          </span>
        )}
        {!avisLastCommission && <span className="text-gray-400">-</span>}
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium',
            prescriptionsActives > 0
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          {prescriptionsActives}
        </span>
      </td>
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <button className="p-1.5 hover:bg-gray-100 rounded-lg">
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </td>
    </tr>
  );
}

// ============================================
// Page principale
// ============================================

export default function EtablissementsPage() {
  const searchParams = useSearchParams();
  const groupementIdParam = searchParams.get('groupement_id');

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtres, setFiltres] = useState<FiltresEtablissements>({
    groupement_id: groupementIdParam || undefined,
  });

  const { data: etablissements, isLoading } = useEtablissements(filtres);
  const { data: groupements } = useGroupements();

  // Filtrage local par recherche
  const filteredEtablissements = useMemo(() => {
    if (!etablissements) return [];
    if (!search) return etablissements;

    const searchLower = search.toLowerCase();
    return etablissements.filter(
      (e) =>
        e.nom_commercial?.toLowerCase().includes(searchLower) ||
        e.enseigne?.toLowerCase().includes(searchLower) ||
        e.ville?.toLowerCase().includes(searchLower) ||
        e.adresse?.toLowerCase().includes(searchLower)
    );
  }, [etablissements, search]);

  // Stats
  const stats = useMemo(() => {
    if (!etablissements) return { total: 0, favorables: 0, defavorables: 0 };

    return {
      total: etablissements.length,
      favorables: etablissements.filter(
        (e) =>
          e.commissions?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            ?.avis === 'favorable'
      ).length,
      defavorables: etablissements.filter(
        (e) =>
          e.commissions?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            ?.avis === 'defavorable'
      ).length,
    };
  }, [etablissements]);

  const typesERP: TypeERP[] = ['J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];
  const categories: CategorieERP[] = [1, 2, 3, 4, 5];

  const hasActiveFilters = Object.values(filtres).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Établissements"
        subtitle={`${stats.total} établissement${stats.total > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={Download}>
              Exporter
            </Button>
            <Button variant="primary" size="sm" icon={Plus}>
              Nouvel établissement
            </Button>
          </div>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </Card>
        <Card padding="sm" className="bg-green-50 border-green-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.favorables}</p>
            <p className="text-sm text-green-600">Avis favorable</p>
          </div>
        </Card>
        <Card padding="sm" className="bg-red-50 border-red-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.defavorables}</p>
            <p className="text-sm text-red-600">Avis défavorable</p>
          </div>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un établissement..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-white text-orange-600 rounded text-xs">
                {Object.values(filtres).filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Panneau filtres */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Groupement</label>
              <select
                value={filtres.groupement_id || ''}
                onChange={(e) => setFiltres({ ...filtres, groupement_id: e.target.value || undefined })}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Tous les groupements</option>
                {groupements?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type ERP</label>
              <select
                value={filtres.type_erp || ''}
                onChange={(e) =>
                  setFiltres({ ...filtres, type_erp: (e.target.value as TypeERP) || undefined })
                }
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Tous les types</option>
                {typesERP.map((type) => (
                  <option key={type} value={type}>
                    Type {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
              <select
                value={filtres.categorie_erp || ''}
                onChange={(e) =>
                  setFiltres({
                    ...filtres,
                    categorie_erp: e.target.value ? (parseInt(e.target.value) as CategorieERP) : undefined,
                  })
                }
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    Catégorie {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
              <input
                type="text"
                value={filtres.ville || ''}
                onChange={(e) => setFiltres({ ...filtres, ville: e.target.value || undefined })}
                placeholder="Filtrer par ville..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Chips filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filtres.groupement_id && groupements && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {groupements.find((g) => g.id === filtres.groupement_id)?.nom}
                <button onClick={() => setFiltres({ ...filtres, groupement_id: undefined })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filtres.type_erp && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                Type {filtres.type_erp}
                <button onClick={() => setFiltres({ ...filtres, type_erp: undefined })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filtres.categorie_erp && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                Cat. {filtres.categorie_erp}
                <button onClick={() => setFiltres({ ...filtres, categorie_erp: undefined })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filtres.ville && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                {filtres.ville}
                <button onClick={() => setFiltres({ ...filtres, ville: undefined })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => setFiltres({})}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tout effacer
            </button>
          </div>
        )}
      </Card>

      {/* Tableau */}
      <Card padding="none">
        {isLoading ? (
          <LoadingTable rows={10} cols={7} />
        ) : filteredEtablissements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Établissement
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Localisation
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Type / Catégorie
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Groupement
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dernier avis
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Prescriptions
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEtablissements.map((etablissement) => (
                  <EtablissementRow key={etablissement.id} etablissement={etablissement} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="Aucun établissement trouvé"
            description={
              search || hasActiveFilters
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Ajoutez votre premier établissement.'
            }
            action={
              search || hasActiveFilters
                ? {
                    label: 'Réinitialiser',
                    onClick: () => {
                      setSearch('');
                      setFiltres({});
                    },
                  }
                : { label: 'Nouvel établissement', href: '/etablissements/nouveau' }
            }
            className="py-12"
          />
        )}
      </Card>
    </div>
  );
}
