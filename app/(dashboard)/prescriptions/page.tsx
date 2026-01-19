'use client';

// ============================================
// PREV'HUB - Page Prescriptions
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePrescriptions, useGroupements, useUpdatePrescription } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  PrescriptionStatusBadge,
  PrioriteBadge,
  CriticiteBadge,
  EmptyState,
  LoadingTable,
  AlertBanner,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  ExternalLink,
  Send,
  FileText,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import type { Prescription, FiltresPrescriptions, StatutPrescription, PrioritePrescription } from '@/types';

// ============================================
// Composants internes
// ============================================

interface FilterPanelProps {
  filtres: FiltresPrescriptions;
  onChange: (filtres: FiltresPrescriptions) => void;
  onClose: () => void;
}

function FilterPanel({ filtres, onChange, onClose }: FilterPanelProps) {
  const { data: groupements } = useGroupements();

  const statuts: { value: StatutPrescription; label: string }[] = [
    { value: 'nouveau', label: 'Nouveau' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'commande_envoyee', label: 'Commandé' },
    { value: 'planifie', label: 'Planifié' },
    { value: 'en_attente_validation', label: 'À valider' },
    { value: 'leve', label: 'Levé' },
    { value: 'valide', label: 'Validé' },
  ];

  const priorites: { value: PrioritePrescription; label: string }[] = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'haute', label: 'Haute' },
    { value: 'normale', label: 'Normale' },
    { value: 'basse', label: 'Basse' },
  ];

  const toggleStatut = (statut: StatutPrescription) => {
    const current = filtres.statut || [];
    const updated = current.includes(statut)
      ? current.filter((s) => s !== statut)
      : [...current, statut];
    onChange({ ...filtres, statut: updated.length > 0 ? updated : undefined });
  };

  const togglePriorite = (priorite: PrioritePrescription) => {
    const current = filtres.priorite || [];
    const updated = current.includes(priorite)
      ? current.filter((p) => p !== priorite)
      : [...current, priorite];
    onChange({ ...filtres, priorite: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filtres avancés</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Statuts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
        <div className="flex flex-wrap gap-2">
          {statuts.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleStatut(value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                filtres.statut?.includes(value)
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Priorités */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
        <div className="flex flex-wrap gap-2">
          {priorites.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => togglePriorite(value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                filtres.priorite?.includes(value)
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Groupement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Groupement</label>
        <select
          value={filtres.groupement_id || ''}
          onChange={(e) => onChange({ ...filtres, groupement_id: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Tous les groupements</option>
          {groupements?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nom}
            </option>
          ))}
        </select>
      </div>

      {/* En retard */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="en_retard"
          checked={filtres.en_retard || false}
          onChange={(e) => onChange({ ...filtres, en_retard: e.target.checked || undefined })}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
        />
        <label htmlFor="en_retard" className="text-sm text-gray-700">
          Uniquement les prescriptions en retard
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          onClick={() => onChange({})}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Réinitialiser les filtres
        </button>
        <Button size="sm" onClick={onClose}>
          Appliquer
        </Button>
      </div>
    </div>
  );
}

function PrescriptionRow({
  prescription,
  onCommanderIntervention,
}: {
  prescription: Prescription;
  onCommanderIntervention: (p: Prescription) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const joursRestants = prescription.date_limite_conformite
    ? Math.ceil(
        (new Date(prescription.date_limite_conformite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isEnRetard = joursRestants !== null && joursRestants < 0;
  const isUrgent = joursRestants !== null && joursRestants >= 0 && joursRestants <= 7;

  return (
    <tr className="hover:bg-gray-50 group">
      {/* Numéro */}
      <td className="px-4 py-3">
        <Link
          href={`/prescriptions/${prescription.id}`}
          className="font-medium text-gray-900 hover:text-orange-600"
        >
          {prescription.numero_prescription || '-'}
        </Link>
      </td>

      {/* Description */}
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-gray-900 line-clamp-2">{prescription.description_complete}</p>
        {prescription.description_reformulee && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">
            {prescription.description_reformulee}
          </p>
        )}
      </td>

      {/* Établissement/Groupement */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {prescription.etablissement?.nom_commercial || prescription.groupement?.nom || '-'}
          </span>
        </div>
      </td>

      {/* Échéance */}
      <td className="px-4 py-3">
        {prescription.date_limite_conformite ? (
          <div className="flex items-center gap-2">
            <Clock
              className={cn(
                'w-4 h-4',
                isEnRetard ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-400'
              )}
            />
            <div>
              <p className={cn('text-sm font-medium', isEnRetard && 'text-red-600')}>
                {new Date(prescription.date_limite_conformite).toLocaleDateString('fr-FR')}
              </p>
              <p
                className={cn(
                  'text-xs',
                  isEnRetard ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-500'
                )}
              >
                {isEnRetard
                  ? `${Math.abs(joursRestants!)} jours de retard`
                  : joursRestants === 0
                  ? "Aujourd'hui"
                  : `${joursRestants} jours`}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      {/* Priorité */}
      <td className="px-4 py-3">
        <PrioriteBadge priorite={prescription.priorite} />
      </td>

      {/* Statut */}
      <td className="px-4 py-3">
        <PrescriptionStatusBadge statut={prescription.statut} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>

          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <Link
                  href={`/prescriptions/${prescription.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Voir détails
                </Link>
                <Link
                  href={`/prescriptions/${prescription.id}/modifier`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </Link>
                {prescription.statut !== 'leve' && prescription.statut !== 'valide' && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onCommanderIntervention(prescription);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 w-full"
                  >
                    <Send className="w-4 h-4" />
                    Commander intervention
                  </button>
                )}
                <hr className="my-1 border-gray-100" />
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Modal Commande Intervention
// ============================================

function CommandeInterventionModal({
  prescription,
  onClose,
  onSuccess,
}: {
  prescription: Prescription;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [canal, setCanal] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Appel API pour créer la commande
      const response = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescription_id: prescription.id,
          canal_envoi: canal,
          message_personnalise: message,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création de la commande');

      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Commander une intervention</h2>
            <p className="text-sm text-gray-500">Prescription : {prescription.numero_prescription}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Résumé prescription */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">{prescription.description_complete}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>Échéance : {new Date(prescription.date_limite_conformite!).toLocaleDateString('fr-FR')}</span>
              <PrioriteBadge priorite={prescription.priorite} />
            </div>
          </div>

          {/* Prestataire suggéré */}
          {prescription.prestataire_recommande && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-medium text-orange-800">
                Prestataire recommandé : {prescription.prestataire_recommande.raison_sociale}
              </p>
              {prescription.score_confiance_ia && (
                <p className="text-xs text-orange-600 mt-1">
                  Score de confiance IA : {Math.round(prescription.score_confiance_ia * 100)}%
                </p>
              )}
            </div>
          )}

          {/* Canal d'envoi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal d'envoi
            </label>
            <div className="flex gap-2">
              {[
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' },
                { value: 'whatsapp', label: 'WhatsApp' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCanal(option.value as any)}
                  className={cn(
                    'flex-1 py-2 px-3 text-sm rounded-lg border transition-colors',
                    canal === option.value
                      ? 'bg-orange-50 border-orange-300 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message personnalisé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajoutez des instructions spécifiques..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isLoading} icon={Send}>
              Envoyer la commande
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function PrescriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'priorite'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtres depuis URL
  const [filtres, setFiltres] = useState<FiltresPrescriptions>(() => {
    const statut = searchParams.get('statut');
    return {
      statut: statut ? [statut as StatutPrescription] : undefined,
      en_retard: searchParams.get('en_retard') === 'true' || undefined,
    };
  });

  const { data: prescriptions, isLoading, refetch } = usePrescriptions({
    ...filtres,
    recherche: search || undefined,
  });

  // Tri des prescriptions
  const sortedPrescriptions = useMemo(() => {
    if (!prescriptions) return [];

    return [...prescriptions].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.date_limite_conformite ? new Date(a.date_limite_conformite).getTime() : Infinity;
        const dateB = b.date_limite_conformite ? new Date(b.date_limite_conformite).getTime() : Infinity;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const prioriteOrder = { urgent: 0, haute: 1, normale: 2, basse: 3 };
      const orderA = prioriteOrder[a.priorite] ?? 4;
      const orderB = prioriteOrder[b.priorite] ?? 4;
      return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
    });
  }, [prescriptions, sortBy, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    if (!prescriptions) return { total: 0, urgent: 0, enRetard: 0, enCours: 0 };
    
    return {
      total: prescriptions.length,
      urgent: prescriptions.filter((p) => p.priorite === 'urgent').length,
      enRetard: prescriptions.filter((p) => {
        if (!p.date_limite_conformite) return false;
        return new Date(p.date_limite_conformite) < new Date();
      }).length,
      enCours: prescriptions.filter((p) => ['en_cours', 'commande_envoyee', 'planifie'].includes(p.statut)).length,
    };
  }, [prescriptions]);

  const activeFiltersCount = [
    filtres.statut?.length,
    filtres.priorite?.length,
    filtres.groupement_id,
    filtres.en_retard,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        subtitle={`${stats.total} prescription${stats.total > 1 ? 's' : ''} au total`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={Download}>
              Exporter
            </Button>
            <Button variant="primary" size="sm" icon={Plus}>
              Nouvelle prescription
            </Button>
          </div>
        }
      />

      {/* Alertes */}
      {stats.enRetard > 0 && (
        <AlertBanner type="error">
          <strong>{stats.enRetard} prescription{stats.enRetard > 1 ? 's' : ''}</strong> en retard nécessite{stats.enRetard > 1 ? 'nt' : ''} une action immédiate.
        </AlertBanner>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-600">{stats.enRetard}</p>
          <p className="text-sm text-red-600">En retard</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
          <p className="text-sm text-orange-600">Urgentes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
          <p className="text-sm text-blue-600">En cours</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une prescription..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            icon={ArrowUpDown}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortBy === 'date' ? 'Date' : 'Priorité'}
          </Button>
        </div>
      </div>

      {/* Panel de filtres */}
      {showFilters && (
        <FilterPanel
          filtres={filtres}
          onChange={setFiltres}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Tableau */}
      <Card padding="none">
        {isLoading ? (
          <LoadingTable rows={8} cols={7} />
        ) : sortedPrescriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Établissement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedPrescriptions.map((prescription) => (
                  <PrescriptionRow
                    key={prescription.id}
                    prescription={prescription}
                    onCommanderIntervention={setSelectedPrescription}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Aucune prescription trouvée"
            description={
              activeFiltersCount > 0
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Les prescriptions apparaîtront ici après les commissions de sécurité.'
            }
            action={
              activeFiltersCount > 0
                ? { label: 'Réinitialiser les filtres', onClick: () => setFiltres({}) }
                : undefined
            }
          />
        )}
      </Card>

      {/* Modal commande intervention */}
      {selectedPrescription && (
        <CommandeInterventionModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onSuccess={() => {
            setSelectedPrescription(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
