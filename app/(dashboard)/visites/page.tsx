'use client';

// ============================================
// PREV'HUB - Page Visites / Planning
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVisites, useVisitesDuJour, useGroupements } from '@/hooks/use-data';
import { useAuth } from '@/lib/auth-context';
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
  Calendar,
  MapPin,
  Building2,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Eye,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { Visite } from '@/types';

// ============================================
// Composants
// ============================================

function VisiteCard({ visite, isToday = false }: { visite: Visite; isToday?: boolean }) {
  const router = useRouter();

  const statusColors = {
    planifie: 'bg-blue-100 text-blue-700 border-blue-200',
    en_cours: 'bg-orange-100 text-orange-700 border-orange-200',
    termine: 'bg-green-100 text-green-700 border-green-200',
    annule: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const statusLabels = {
    planifie: 'Planifiée',
    en_cours: 'En cours',
    termine: 'Terminée',
    annule: 'Annulée',
  };

  return (
    <div
      className={cn(
        'bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md',
        isToday && visite.statut === 'planifie' && 'border-orange-300 bg-orange-50/30',
        visite.statut === 'en_cours' && 'border-orange-400 ring-2 ring-orange-200'
      )}
      onClick={() => router.push(`/visites/${visite.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {visite.etablissement?.nom_commercial || visite.groupement?.nom || 'Visite'}
            </h3>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full border',
                statusColors[visite.statut]
              )}
            >
              {statusLabels[visite.statut]}
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1.5 text-sm text-gray-500">
            {(visite.etablissement?.adresse || visite.etablissement?.ville) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">
                  {visite.etablissement?.adresse}, {visite.etablissement?.ville}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {visite.heure_debut || '09:00'}
                {visite.heure_fin && ` - ${visite.heure_fin}`}
              </span>
            </div>

            {visite.preventionniste && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" />
                <span>
                  {visite.preventionniste.prenom} {visite.preventionniste.nom}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats observations */}
        {visite.observations && visite.observations.length > 0 && (
          <div className="text-right">
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{visite.observations.length}</p>
              <p className="text-xs text-gray-500">observations</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides pour aujourd'hui */}
      {isToday && visite.statut !== 'termine' && visite.statut !== 'annule' && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          {visite.statut === 'planifie' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/visites/${visite.id}/demarrer`);
              }}
            >
              Démarrer
            </Button>
          )}
          {visite.statut === 'en_cours' && (
            <Button
              variant="primary"
              size="sm"
              icon={FileText}
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/visites/${visite.id}`);
              }}
            >
              Continuer
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={Navigation}
            onClick={(e) => {
              e.stopPropagation();
              const address = `${visite.etablissement?.adresse}, ${visite.etablissement?.code_postal} ${visite.etablissement?.ville}`;
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
                '_blank'
              );
            }}
          >
            Itinéraire
          </Button>
        </div>
      )}
    </div>
  );
}

function CalendarWeekView({
  visites,
  selectedDate,
  onDateChange,
}: {
  visites: Visite[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const startOfWeek = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [startOfWeek]);

  const visitesByDate = useMemo(() => {
    const map: Record<string, Visite[]> = {};
    visites.forEach((v) => {
      const dateKey = new Date(v.date_visite).toISOString().split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(v);
    });
    return map;
  }, [visites]);

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card padding="none">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(startOfWeek);
            prev.setDate(prev.getDate() - 7);
            onDateChange(prev);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900">
          Semaine du {startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </h3>
        <button
          onClick={() => {
            const next = new Date(startOfWeek);
            next.setDate(next.getDate() + 7);
            onDateChange(next);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDays.map((date, i) => {
          const dateKey = date.toISOString().split('T')[0];
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate.toISOString().split('T')[0];
          const visitesCount = visitesByDate[dateKey]?.length || 0;

          return (
            <button
              key={i}
              onClick={() => onDateChange(date)}
              className={cn(
                'p-3 text-center border-r last:border-r-0 border-gray-100 transition-colors',
                isSelected && 'bg-orange-50',
                isToday && !isSelected && 'bg-blue-50'
              )}
            >
              <p className="text-xs text-gray-500">{dayNames[i]}</p>
              <p
                className={cn(
                  'text-lg font-semibold mt-1',
                  isToday ? 'text-orange-600' : 'text-gray-900'
                )}
              >
                {date.getDate()}
              </p>
              {visitesCount > 0 && (
                <div className="mt-1 flex justify-center">
                  <span
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {visitesCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================
// Page principale
// ============================================

export default function VisitesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'today' | 'week' | 'all'>('today');
  const [search, setSearch] = useState('');

  const { data: allVisites, isLoading: loadingAll } = useVisites();
  const { data: visitesDuJour, isLoading: loadingToday } = useVisitesDuJour(
    profile?.role === 'preventionniste' ? user?.id : undefined
  );

  const isLoading = view === 'today' ? loadingToday : loadingAll;

  // Filtrage des visites selon la vue
  const displayedVisites = useMemo(() => {
    let visites: Visite[] = [];

    if (view === 'today') {
      visites = visitesDuJour || [];
    } else if (view === 'week') {
      const startOfWeek = new Date(selectedDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      visites = (allVisites || []).filter((v) => {
        const date = new Date(v.date_visite);
        return date >= startOfWeek && date <= endOfWeek;
      });
    } else {
      visites = allVisites || [];
    }

    // Filtre recherche
    if (search) {
      const searchLower = search.toLowerCase();
      visites = visites.filter(
        (v) =>
          v.etablissement?.nom_commercial?.toLowerCase().includes(searchLower) ||
          v.groupement?.nom?.toLowerCase().includes(searchLower) ||
          v.etablissement?.ville?.toLowerCase().includes(searchLower)
      );
    }

    // Tri par date et heure
    return visites.sort((a, b) => {
      const dateA = new Date(`${a.date_visite}T${a.heure_debut || '00:00'}`);
      const dateB = new Date(`${b.date_visite}T${b.heure_debut || '00:00'}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [view, visitesDuJour, allVisites, selectedDate, search]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayVisites = (allVisites || []).filter(
      (v) => v.date_visite === today
    );

    return {
      today: todayVisites.length,
      enCours: todayVisites.filter((v) => v.statut === 'en_cours').length,
      terminees: todayVisites.filter((v) => v.statut === 'termine').length,
      total: allVisites?.length || 0,
    };
  }, [allVisites]);

  // Visites filtrées par date sélectionnée (vue semaine)
  const visitesSelectedDate = useMemo(() => {
    if (view !== 'week') return displayedVisites;
    
    const dateKey = selectedDate.toISOString().split('T')[0];
    return displayedVisites.filter((v) => v.date_visite === dateKey);
  }, [view, displayedVisites, selectedDate]);

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visites"
        subtitle={`${stats.today} visite${stats.today > 1 ? 's' : ''} aujourd'hui`}
        actions={
          <Button variant="primary" size="sm" icon={Plus}>
            Planifier une visite
          </Button>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setView('today')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            view === 'today'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
          <p className="text-sm text-gray-500">Aujourd'hui</p>
        </button>
        <Card padding="sm" className="bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
          <p className="text-sm text-blue-600">En cours</p>
        </Card>
        <Card padding="sm" className="bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.terminees}</p>
          <p className="text-sm text-green-600">Terminées</p>
        </Card>
        <button
          onClick={() => setView('all')}
          className={cn(
            'p-4 rounded-xl border text-left transition-colors',
            view === 'all'
              ? 'bg-orange-50 border-orange-200'
              : 'bg-white border-gray-200 hover:border-gray-300'
          )}
        >
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </button>
      </div>

      {/* Sélecteur de vue */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: 'today', label: "Aujourd'hui" },
            { value: 'week', label: 'Semaine' },
            { value: 'all', label: 'Toutes' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setView(option.value as any)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                view === option.value
                  ? 'bg-white shadow text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {view !== 'today' && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}
      </div>

      {/* Calendrier semaine */}
      {view === 'week' && (
        <CalendarWeekView
          visites={displayedVisites}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Liste des visites */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : view === 'week' ? (
        visitesSelectedDate.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-700">
              {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {visitesSelectedDate.map((visite) => (
              <VisiteCard
                key={visite.id}
                visite={visite}
                isToday={isToday(visite.date_visite)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="Aucune visite ce jour"
            description={`Aucune visite planifiée pour le ${selectedDate.toLocaleDateString('fr-FR')}.`}
            action={{ label: 'Planifier une visite', href: '/visites/nouvelle' }}
          />
        )
      ) : displayedVisites.length > 0 ? (
        <div className="space-y-3">
          {displayedVisites.map((visite) => (
            <VisiteCard
              key={visite.id}
              visite={visite}
              isToday={isToday(visite.date_visite)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Aucune visite"
          description={
            view === 'today'
              ? "Aucune visite planifiée pour aujourd'hui."
              : search
              ? 'Aucune visite ne correspond à votre recherche.'
              : 'Commencez par planifier une visite.'
          }
          action={{ label: 'Planifier une visite', href: '/visites/nouvelle' }}
        />
      )}
    </div>
  );
}
