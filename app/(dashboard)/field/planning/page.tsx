'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Planning Terrain
// Vue planning optimisée pour les préventionnistes
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVisites } from '@/hooks/use-visites';
import { cn, formatDate } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Play,
  CheckCircle2,
  Navigation,
  Loader2,
  Plus,
  Filter,
  List,
  Grid,
  Home,
  Camera,
  User,
} from 'lucide-react';

// ============================================
// Types
// ============================================

type ViewMode = 'semaine' | 'mois';

// ============================================
// Utilitaires
// ============================================

function getWeekDays(date: Date): Date[] {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Trouver le lundi de la première semaine
  const startDate = new Date(firstDay);
  const day = startDate.getDay();
  startDate.setDate(startDate.getDate() - (day === 0 ? 6 : day - 1));

  // Générer toutes les dates jusqu'à la fin de la dernière semaine
  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= lastDay || current.getDay() !== 1) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
    if (days.length > 42) break; // Max 6 semaines
  }

  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// Composants
// ============================================

function DayCard({ 
  date, 
  visites, 
  isToday, 
  isCurrentMonth,
  compact = false,
}: { 
  date: Date; 
  visites: any[];
  isToday: boolean;
  isCurrentMonth: boolean;
  compact?: boolean;
}) {
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-3 min-h-[100px]',
        isToday ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200',
        !isCurrentMonth && 'opacity-50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs font-medium',
            isToday ? 'text-orange-600' : 'text-gray-500'
          )}>
            {dayNames[date.getDay()]}
          </span>
          <span className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold',
            isToday ? 'bg-orange-500 text-white' : 'text-gray-900'
          )}>
            {date.getDate()}
          </span>
        </div>
        {visites.length > 0 && (
          <span className="text-xs text-gray-500">
            {visites.length} visite{visites.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {visites.slice(0, compact ? 2 : 3).map((visite) => (
          <Link
            key={visite.id}
            href={`/field/visite/${visite.id}`}
            className={cn(
              'block p-2 rounded-lg text-xs transition-colors',
              visite.statut === 'terminee' ? 'bg-green-50 text-green-700' :
              visite.statut === 'en_cours' ? 'bg-orange-50 text-orange-700' :
              'bg-gray-50 text-gray-700 hover:bg-gray-100'
            )}
          >
            <div className="flex items-center gap-1">
              {visite.statut === 'terminee' && <CheckCircle2 className="w-3 h-3" />}
              {visite.statut === 'en_cours' && <Play className="w-3 h-3" />}
              <span className="font-medium">{visite.heure_debut}</span>
            </div>
            <p className="truncate mt-0.5">
              {visite.etablissement?.nom_commercial || 'Établissement'}
            </p>
          </Link>
        ))}
        {visites.length > (compact ? 2 : 3) && (
          <p className="text-xs text-gray-400 text-center">
            +{visites.length - (compact ? 2 : 3)} autre{visites.length - (compact ? 2 : 3) > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

function VisiteListItem({ visite }: { visite: any }) {
  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'planifiee':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planifiée' };
      case 'en_cours':
        return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En cours' };
      case 'terminee':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Terminée' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: statut };
    }
  };

  const style = getStatutStyle(visite.statut);

  return (
    <Link
      href={`/field/visite/${visite.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 active:scale-[0.99] transition-transform"
    >
      <div className="flex-shrink-0 text-center">
        <p className="text-lg font-bold text-gray-900">
          {new Date(visite.date).getDate()}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(visite.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short' })}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', style.bg, style.text)}>
            {style.label}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {visite.heure_debut}
          </span>
        </div>
        <h3 className="font-medium text-gray-900 truncate">
          {visite.etablissement?.nom_commercial || 'Établissement'}
        </h3>
        <p className="text-sm text-gray-500 truncate flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {visite.etablissement?.ville}
        </p>
      </div>

      {visite.etablissement?.categorie_erp && (
        <span className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0',
          visite.etablissement.categorie_erp === 1 ? 'bg-red-500' :
          visite.etablissement.categorie_erp === 2 ? 'bg-orange-500' :
          visite.etablissement.categorie_erp === 3 ? 'bg-yellow-500' :
          visite.etablissement.categorie_erp === 4 ? 'bg-blue-500' :
          'bg-green-500'
        )}>
          {visite.etablissement.categorie_erp}
        </span>
      )}
    </Link>
  );
}

// ============================================
// Page principale
// ============================================

export default function FieldPlanningPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('semaine');
  const [showListView, setShowListView] = useState(true);

  // Calculer la période à charger
  const startDate = viewMode === 'semaine'
    ? getWeekDays(currentDate)[0]
    : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const endDate = viewMode === 'semaine'
    ? getWeekDays(currentDate)[6]
    : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Charger les visites de la période
  const { data: visites, isLoading } = useVisites({
    preventionniste_id: user?.id,
  });

  // Filtrer les visites par période
  const filteredVisites = visites?.filter((v) => {
    const vDate = new Date(v.date);
    return vDate >= startDate && vDate <= endDate;
  }) || [];

  // Grouper par date
  const visitesByDate = filteredVisites.reduce((acc, visite) => {
    const key = formatDateKey(new Date(visite.date));
    if (!acc[key]) acc[key] = [];
    acc[key].push(visite);
    return acc;
  }, {} as Record<string, any[]>);

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'semaine') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'semaine') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();
  const isCurrentPeriod = viewMode === 'semaine'
    ? getWeekDays(today).some(d => formatDateKey(d) === formatDateKey(currentDate))
    : today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  // Jours à afficher
  const days = viewMode === 'semaine' ? getWeekDays(currentDate) : getMonthDays(currentDate);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Planning</h1>
          <div className="flex items-center gap-2">
            {!isCurrentPeriod && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg"
              >
                Aujourd'hui
              </button>
            )}
            <button
              onClick={() => setShowListView(!showListView)}
              className={cn(
                'p-2 rounded-lg',
                showListView ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
              )}
            >
              {showListView ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation période */}
        <div className="flex items-center justify-between">
          <button
            onClick={navigatePrev}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {viewMode === 'semaine' ? (
                <>
                  {startDate.getDate()} - {endDate.getDate()}{' '}
                  {endDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </>
              ) : (
                currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              )}
            </p>
            <p className="text-xs text-gray-500">
              {filteredVisites.length} visite{filteredVisites.length > 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle vue */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setViewMode('semaine')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              viewMode === 'semaine'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            Semaine
          </button>
          <button
            onClick={() => setViewMode('mois')}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              viewMode === 'mois'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            Mois
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : showListView ? (
          /* Vue liste */
          <div className="space-y-3">
            {filteredVisites.length > 0 ? (
              filteredVisites
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || 
                  (a.heure_debut || '').localeCompare(b.heure_debut || ''))
                .map((visite) => (
                  <VisiteListItem key={visite.id} visite={visite} />
                ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Aucune visite prévue</p>
                <p className="text-sm text-gray-400 mt-1">
                  {viewMode === 'semaine' ? 'Cette semaine' : 'Ce mois-ci'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Vue calendrier */
          <div className={cn(
            'grid gap-2',
            viewMode === 'semaine' ? 'grid-cols-7' : 'grid-cols-7'
          )}>
            {/* En-têtes jours */}
            {viewMode === 'mois' && ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {days.map((date) => {
              const key = formatDateKey(date);
              const dayVisites = visitesByDate[key] || [];
              const isToday = formatDateKey(date) === formatDateKey(today);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <DayCard
                  key={key}
                  date={date}
                  visites={dayVisites}
                  isToday={isToday}
                  isCurrentMonth={isCurrentMonth}
                  compact={viewMode === 'mois'}
                />
              );
            })}
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
            className="flex flex-col items-center gap-1 p-2 text-orange-600"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Planning</span>
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
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Sites</span>
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
