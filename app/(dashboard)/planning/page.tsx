'use client';

// ============================================
// PREV'HUB - Page Planning
// ============================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useVisites } from '@/hooks/use-data';
import { useAuth } from '@/lib/auth-context';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  LoadingSpinner,
} from '@/components/shared';
import { cn, formatDate } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  Filter,
  List,
  LayoutGrid,
} from 'lucide-react';
import type { Visite } from '@/types';

// ============================================
// Types
// ============================================

type ViewMode = 'month' | 'week' | 'day';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  visites: Visite[];
}

// ============================================
// Utilitaires calendrier
// ============================================

function getCalendarDays(year: number, month: number, visites: Visite[]): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Ajuster pour commencer le lundi (0 = dimanche, 1 = lundi, ...)
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Jours du mois précédent
  const prevMonth = new Date(year, month, 0);
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      visites: getVisitesForDate(date, visites),
    });
  }

  // Jours du mois courant
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      visites: getVisitesForDate(date, visites),
    });
  }

  // Jours du mois suivant pour compléter la grille
  const remainingDays = 42 - days.length; // 6 semaines * 7 jours
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      visites: getVisitesForDate(date, visites),
    });
  }

  return days;
}

function getVisitesForDate(date: Date, visites: Visite[]): Visite[] {
  const dateStr = date.toISOString().split('T')[0];
  return visites.filter((v) => v.date_visite?.startsWith(dateStr));
}

function getWeekDays(date: Date, visites: Visite[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Trouver le lundi de la semaine
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: d.getTime() === today.getTime(),
      visites: getVisitesForDate(d, visites),
    });
  }

  return days;
}

// ============================================
// Composants internes
// ============================================

function VisiteChip({ visite }: { visite: Visite }) {
  const statusColors = {
    planifiee: 'bg-blue-100 text-blue-700 border-blue-200',
    en_cours: 'bg-orange-100 text-orange-700 border-orange-200',
    terminee: 'bg-green-100 text-green-700 border-green-200',
    annulee: 'bg-gray-100 text-gray-500 border-gray-200',
    reportee: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <Link
      href={`/visites/${visite.id}`}
      className={cn(
        'block px-2 py-1 text-xs rounded border truncate hover:opacity-80 transition-opacity',
        statusColors[visite.statut] || statusColors.planifiee
      )}
    >
      {visite.heure_debut && <span className="font-medium">{visite.heure_debut} </span>}
      {visite.etablissement?.nom_commercial || visite.groupement?.nom || 'Visite'}
    </Link>
  );
}

function MonthView({ days, onDayClick }: { days: CalendarDay[]; onDayClick: (date: Date) => void }) {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-tête jours */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => onDayClick(day.date)}
            className={cn(
              'min-h-[100px] p-2 cursor-pointer transition-colors',
              !day.isCurrentMonth && 'bg-gray-50',
              day.isToday && 'bg-orange-50',
              'hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'text-sm font-medium mb-1',
              !day.isCurrentMonth && 'text-gray-400',
              day.isToday && 'text-orange-600'
            )}>
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.visites.slice(0, 3).map((visite) => (
                <VisiteChip key={visite.id} visite={visite} />
              ))}
              {day.visites.length > 3 && (
                <div className="text-xs text-gray-500 px-2">
                  +{day.visites.length - 3} autres
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({ days }: { days: CalendarDay[] }) {
  const hours = Array.from({ length: 12 }, (_, i) => 7 + i); // 7h à 18h

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* En-tête jours */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="px-2 py-3" /> {/* Colonne heures */}
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              'px-2 py-3 text-center border-l border-gray-200',
              day.isToday && 'bg-orange-50'
            )}
          >
            <div className="text-xs text-gray-500 uppercase">
              {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
            </div>
            <div className={cn(
              'text-lg font-semibold',
              day.isToday && 'text-orange-600'
            )}>
              {day.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Grille horaire */}
      <div className="grid grid-cols-8">
        {/* Colonne heures */}
        <div className="border-r border-gray-200">
          {hours.map((hour) => (
            <div key={hour} className="h-16 border-b border-gray-100 px-2 py-1">
              <span className="text-xs text-gray-400">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Colonnes jours */}
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="border-l border-gray-200 relative">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-100" />
            ))}
            {/* Visites positionnées */}
            {day.visites.map((visite) => {
              const startHour = visite.heure_debut 
                ? parseInt(visite.heure_debut.split(':')[0])
                : 9;
              const top = (startHour - 7) * 64; // 64px par heure

              return (
                <Link
                  key={visite.id}
                  href={`/visites/${visite.id}`}
                  className={cn(
                    'absolute left-1 right-1 p-1 rounded text-xs',
                    visite.statut === 'en_cours' && 'bg-orange-100 border border-orange-200',
                    visite.statut === 'terminee' && 'bg-green-100 border border-green-200',
                    visite.statut === 'planifiee' && 'bg-blue-100 border border-blue-200'
                  )}
                  style={{ top: `${top}px`, minHeight: '32px' }}
                >
                  <div className="font-medium truncate">
                    {visite.etablissement?.nom_commercial || visite.groupement?.nom}
                  </div>
                  <div className="text-gray-500 truncate">
                    {visite.heure_debut}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({ day }: { day: CalendarDay }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {day.date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })}
      </h3>

      {day.visites.length > 0 ? (
        <div className="space-y-3">
          {day.visites.map((visite) => (
            <Link
              key={visite.id}
              href={`/visites/${visite.id}`}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
            >
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                visite.statut === 'en_cours' && 'bg-orange-100',
                visite.statut === 'terminee' && 'bg-green-100',
                visite.statut === 'planifiee' && 'bg-blue-100'
              )}>
                <Calendar className={cn(
                  'w-6 h-6',
                  visite.statut === 'en_cours' && 'text-orange-600',
                  visite.statut === 'terminee' && 'text-green-600',
                  visite.statut === 'planifiee' && 'text-blue-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900">
                  {visite.etablissement?.nom_commercial || visite.groupement?.nom}
                </h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {visite.heure_debut && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {visite.heure_debut}
                      {visite.heure_fin && ` - ${visite.heure_fin}`}
                    </span>
                  )}
                  {visite.etablissement?.ville && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {visite.etablissement.ville}
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  visite.statut === 'en_cours' ? 'warning' :
                  visite.statut === 'terminee' ? 'success' : 'info'
                }
                size="sm"
              >
                {visite.statut === 'en_cours' && 'En cours'}
                {visite.statut === 'terminee' && 'Terminée'}
                {visite.statut === 'planifiee' && 'Planifiée'}
              </Badge>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p>Aucune visite ce jour</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function PlanningPage() {
  const { profile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: visites, isLoading } = useVisites();

  // Calcul des jours du calendrier
  const calendarDays = useMemo(() => {
    if (!visites) return [];
    
    if (viewMode === 'month') {
      return getCalendarDays(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        visites
      );
    } else if (viewMode === 'week') {
      return getWeekDays(currentDate, visites);
    }
    
    return [];
  }, [visites, currentDate, viewMode]);

  // Navigation
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
    setCurrentDate(date);
  };

  // Titre selon la vue
  const getTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate, []);
      const start = weekDays[0].date;
      const end = weekDays[6].date;
      return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDate || !visites) return null;
    return {
      date: selectedDate,
      isCurrentMonth: true,
      isToday: selectedDate.toDateString() === new Date().toDateString(),
      visites: getVisitesForDate(selectedDate, visites),
    };
  }, [selectedDate, visites]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        subtitle="Gérez vos visites et rendez-vous"
        actions={
          <Button variant="primary" size="sm" icon={Plus}>
            Nouvelle visite
          </Button>
        }
      />

      {/* Barre de navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Aujourd'hui
            </Button>
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 capitalize ml-2">
              {getTitle()}
            </h2>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'month' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Mois
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'week' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Semaine
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'day' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Jour
            </button>
          </div>
        </div>
      </Card>

      {/* Calendrier */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {viewMode === 'month' && (
            <MonthView days={calendarDays} onDayClick={handleDayClick} />
          )}
          {viewMode === 'week' && (
            <WeekView days={calendarDays} />
          )}
          {viewMode === 'day' && selectedDayData && (
            <DayView day={selectedDayData} />
          )}
          {viewMode === 'day' && !selectedDayData && (
            <DayView day={{
              date: currentDate,
              isCurrentMonth: true,
              isToday: currentDate.toDateString() === new Date().toDateString(),
              visites: visites ? getVisitesForDate(currentDate, visites) : [],
            }} />
          )}
        </>
      )}

      {/* Légende */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200" />
            <span className="text-sm text-gray-600">Planifiée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
            <span className="text-sm text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
            <span className="text-sm text-gray-600">Terminée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
            <span className="text-sm text-gray-600">Reportée</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
