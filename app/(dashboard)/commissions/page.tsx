'use client';

// ============================================
// PREV'HUB - Page Commissions
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCommissions, useGroupements } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  AvisCommissionBadge,
  EmptyState,
  LoadingTable,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Building2,
  Clock,
  FileText,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { Commission, FiltresCommissions } from '@/types';

// ============================================
// Composants internes
// ============================================

function CommissionCard({ commission }: { commission: Commission }) {
  const joursAvant = commission.date
    ? Math.ceil((new Date(commission.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isPassed = joursAvant !== null && joursAvant < 0;
  const isUrgent = joursAvant !== null && joursAvant >= 0 && joursAvant <= 15;
  const isWarning = joursAvant !== null && joursAvant > 15 && joursAvant <= 30;

  return (
    <Link
      href={`/commissions/${commission.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 truncate">
              {commission.groupement?.nom || commission.etablissement?.nom_commercial || 'Commission'}
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            {commission.type === 'securite' && 'Commission de sécurité'}
            {commission.type === 'accessibilite' && 'Commission accessibilité'}
            {commission.type === 'mixte' && 'Commission mixte'}
            {!commission.type && 'Commission de sécurité'}
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(commission.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {commission.heure && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{commission.heure}</span>
              </div>
            )}
          </div>
        </div>

        {/* Statut et Avis */}
        <div className="flex flex-col items-end gap-2">
          <AvisCommissionBadge avis={commission.avis} />

          {joursAvant !== null && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                isPassed && 'bg-gray-100 text-gray-600',
                isUrgent && !isPassed && 'bg-red-100 text-red-700',
                isWarning && 'bg-orange-100 text-orange-700',
                !isPassed && !isUrgent && !isWarning && 'bg-blue-100 text-blue-700'
              )}
            >
              {isPassed
                ? `Il y a ${Math.abs(joursAvant)} jours`
                : joursAvant === 0
                ? "Aujourd'hui"
                : `J-${joursAvant}`}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <FileText className="w-4 h-4" />
          <span>{commission.prescriptions?.count || 0} prescriptions</span>
        </div>

        {commission.lieu && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Building2 className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{commission.lieu}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function CalendarView({ commissions, currentMonth, onMonthChange }: {
  commissions: Commission[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}) {
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const commissionsByDate = useMemo(() => {
    const map: Record<string, Commission[]> = {};
    commissions.forEach((c) => {
      const dateKey = new Date(c.date).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(c);
    });
    return map;
  }, [commissions]);

  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <Card padding="none">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(currentMonth);
            prev.setMonth(prev.getMonth() - 1);
            onMonthChange(prev);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => {
            const next = new Date(currentMonth);
            next.setMonth(next.getMonth() + 1);
            onMonthChange(next);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day
            ).toISOString().split('T')[0];

            const dayCommissions = commissionsByDate[dateStr] || [];
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={cn(
                  'aspect-square p-1 rounded-lg border text-center relative',
                  isToday && 'border-orange-300 bg-orange-50',
                  !isToday && dayCommissions.length > 0 && 'border-blue-200 bg-blue-50',
                  !isToday && dayCommissions.length === 0 && 'border-transparent hover:bg-gray-50'
                )}
              >
                <span className={cn(
                  'text-sm',
                  isToday && 'font-bold text-orange-600',
                  dayCommissions.length > 0 && !isToday && 'font-medium text-blue-600'
                )}>
                  {day}
                </span>
                {dayCommissions.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayCommissions.slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          c.avis === 'favorable' && 'bg-green-500',
                          c.avis === 'defavorable' && 'bg-red-500',
                          !c.avis && 'bg-blue-500'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Page principale
// ============================================

export default function CommissionsPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filtres, setFiltres] = useState<FiltresCommissions>({});

  const { data: commissions, isLoading } = useCommissions(filtres);
  const { data: groupements } = useGroupements();

  // Filtrage par recherche
  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    if (!search) return commissions;

    const searchLower = search.toLowerCase();
    return commissions.filter(
      (c) =>
        c.groupement?.nom?.toLowerCase().includes(searchLower) ||
        c.etablissement?.nom_commercial?.toLowerCase().includes(searchLower) ||
        c.lieu?.toLowerCase().includes(searchLower)
    );
  }, [commissions, search]);

  // Statistiques
  const stats = useMemo(() => {
    if (!commissions) return { total: 0, favorable: 0, defavorable: 0, aPreparer: 0 };

    const now = new Date();
    return {
      total: commissions.length,
      favorable: commissions.filter((c) => c.avis === 'favorable').length,
      defavorable: commissions.filter((c) => c.avis === 'defavorable').length,
      aPreparer: commissions.filter((c) => {
        if (!c.date) return false;
        const diff = Math.ceil((new Date(c.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 45;
      }).length,
    };
  }, [commissions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions de sécurité"
        subtitle={`${stats.total} commission${stats.total > 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Liste
              </button>
              <button
                onClick={() => setView('calendar')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Calendrier
              </button>
            </div>
            <Button variant="primary" size="sm" icon={Plus}>
              Nouvelle commission
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-orange-600">{stats.aPreparer}</p>
          <p className="text-sm text-orange-600">À préparer</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-600">{stats.favorable}</p>
          <p className="text-sm text-green-600">Favorables</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-600">{stats.defavorable}</p>
          <p className="text-sm text-red-600">Défavorables</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une commission..."
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
          </Button>
          <select
            value={filtres.groupement_id || ''}
            onChange={(e) => setFiltres({ ...filtres, groupement_id: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Tous les groupements</option>
            {groupements?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <Card className="border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtres avancés</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avis</label>
              <div className="flex flex-wrap gap-2">
                {['favorable', 'defavorable', 'avis_suspendu'].map((avis) => (
                  <button
                    key={avis}
                    onClick={() => {
                      const current = filtres.avis || [];
                      const updated = current.includes(avis as any)
                        ? current.filter((a) => a !== avis)
                        : [...current, avis as any];
                      setFiltres({ ...filtres, avis: updated.length > 0 ? updated : undefined });
                    }}
                    className={cn(
                      'px-3 py-1 text-sm rounded-full border transition-colors',
                      filtres.avis?.includes(avis as any)
                        ? 'bg-orange-50 border-orange-300 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {avis === 'favorable' && 'Favorable'}
                    {avis === 'defavorable' && 'Défavorable'}
                    {avis === 'avis_suspendu' && 'Suspendu'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={filtres.date_debut || ''}
                onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={filtres.date_fin || ''}
                onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filtres.a_preparer || false}
                onChange={(e) => setFiltres({ ...filtres, a_preparer: e.target.checked || undefined })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Uniquement à préparer (45 jours)</span>
            </label>
            <button
              onClick={() => setFiltres({})}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Réinitialiser
            </button>
          </div>
        </Card>
      )}

      {/* Contenu */}
      {isLoading ? (
        <LoadingTable rows={6} cols={5} />
      ) : view === 'list' ? (
        filteredCommissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommissions.map((commission) => (
              <CommissionCard key={commission.id} commission={commission} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title="Aucune commission trouvée"
            description="Ajoutez une commission pour commencer le suivi."
            action={{ label: 'Nouvelle commission', href: '/commissions/nouvelle' }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              commissions={filteredCommissions}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
            />
          </div>
          <div>
            <Card title="Commissions à venir" padding="none">
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {filteredCommissions
                  .filter((c) => new Date(c.date) >= new Date())
                  .slice(0, 5)
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/commissions/${c.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.groupement?.nom || c.etablissement?.nom_commercial}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(c.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </Link>
                  ))}
                {filteredCommissions.filter((c) => new Date(c.date) >= new Date()).length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Aucune commission à venir
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
