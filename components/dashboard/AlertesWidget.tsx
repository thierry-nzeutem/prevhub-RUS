'use client';

// ============================================
// PREV'HUB - Widget Alertes Dashboard
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useAlertes, useAlertesStats, useTraiterAlerte } from '@/hooks/use-alertes';
import { cn, formatDate } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  Wrench,
  ChevronRight,
  Check,
  X,
  Clock,
  Building2,
  MoreHorizontal,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AlerteItemProps {
  alerte: {
    id: string;
    type: string;
    niveau: string;
    message: string;
    jours_restants: number | null;
    entite_type: string;
    entite_id: string;
    metadata: Record<string, any>;
    details?: Record<string, any>;
    created_at: string;
  };
  onTraiter?: (id: string, statut: 'traitee' | 'ignoree') => void;
  compact?: boolean;
}

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
      };
    case 'urgent':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        badge: 'bg-orange-100 text-orange-700',
      };
    case 'attention':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700',
      };
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: Info,
        iconColor: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
      };
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'prescription':
      return FileText;
    case 'commission':
      return Calendar;
    case 'verification':
      return Wrench;
    default:
      return AlertCircle;
  }
}

function getAlerteLink(alerte: AlerteItemProps['alerte']): string {
  switch (alerte.entite_type) {
    case 'prescription':
      return `/prescriptions/${alerte.entite_id}`;
    case 'commission':
      return `/commissions/${alerte.entite_id}`;
    case 'verification':
      return `/verifications`;
    default:
      return '#';
  }
}

function AlerteItem({ alerte, onTraiter, compact = false }: AlerteItemProps) {
  const [showActions, setShowActions] = useState(false);
  const style = getNiveauStyle(alerte.niveau);
  const TypeIcon = getTypeIcon(alerte.type);
  const NiveauIcon = style.icon;

  const etablissement = alerte.metadata?.nom_etablissement || alerte.details?.etablissement || '';

  return (
    <div
      className={cn(
        'relative border rounded-lg transition-all',
        style.bg,
        style.border,
        compact ? 'p-3' : 'p-4'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={cn('flex-shrink-0', compact ? 'mt-0' : 'mt-0.5')}>
          <NiveauIcon className={cn('w-5 h-5', style.iconColor)} />
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', style.badge)}>
              {alerte.niveau === 'critique' ? 'Critique' :
               alerte.niveau === 'urgent' ? 'Urgent' :
               alerte.niveau === 'attention' ? 'Attention' : 'Info'}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <TypeIcon className="w-3.5 h-3.5" />
              {alerte.type.charAt(0).toUpperCase() + alerte.type.slice(1)}
            </span>
          </div>

          <p className={cn('text-gray-900 mt-1.5', compact ? 'text-sm' : 'text-sm font-medium')}>
            {alerte.message}
          </p>

          {etablissement && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {etablissement}
            </p>
          )}

          {/* Jours restants */}
          {alerte.jours_restants !== null && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs font-medium',
              alerte.jours_restants <= 0 ? 'bg-red-100 text-red-700' :
              alerte.jours_restants <= 7 ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-600'
            )}>
              <Clock className="w-3 h-3" />
              {alerte.jours_restants <= 0 
                ? `En retard de ${Math.abs(alerte.jours_restants)} jour${Math.abs(alerte.jours_restants) > 1 ? 's' : ''}`
                : `${alerte.jours_restants} jour${alerte.jours_restants > 1 ? 's' : ''} restant${alerte.jours_restants > 1 ? 's' : ''}`
              }
            </div>
          )}
        </div>

        {/* Actions */}
        {onTraiter && (
          <div className={cn(
            'flex items-center gap-1 transition-opacity',
            showActions ? 'opacity-100' : 'opacity-0'
          )}>
            <button
              onClick={() => onTraiter(alerte.id, 'traitee')}
              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              title="Marquer comme traitée"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTraiter(alerte.id, 'ignoree')}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              title="Ignorer"
            >
              <X className="w-4 h-4" />
            </button>
            <Link
              href={getAlerteLink(alerte)}
              className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
              title="Voir le détail"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Widget Stats
// ============================================

export function AlertesStatsWidget() {
  const stats = useAlertesStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.critique}</p>
            <p className="text-xs text-gray-500">Critiques</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            <p className="text-xs text-gray-500">Urgentes</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.attention}</p>
            <p className="text-xs text-gray-500">À surveiller</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total actives</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Widget Liste compacte
// ============================================

export function AlertesListWidget({ 
  limit = 5,
  showHeader = true,
}: { 
  limit?: number;
  showHeader?: boolean;
}) {
  const { data: alertes, isLoading } = useAlertes({ limit });
  const { mutate: traiter } = useTraiterAlerte();

  const handleTraiter = (id: string, statut: 'traitee' | 'ignoree') => {
    traiter({ alerteId: id, statut });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Alertes actives</h3>
          </div>
          <Link
            href="/alertes"
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement...
          </div>
        ) : alertes && alertes.length > 0 ? (
          alertes.map((alerte) => (
            <AlerteItem
              key={alerte.id}
              alerte={alerte}
              onTraiter={handleTraiter}
              compact
            />
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-gray-500">Aucune alerte active</p>
            <p className="text-xs text-gray-400 mt-1">Tout est sous contrôle !</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Widget combiné pour Dashboard
// ============================================

export function AlertesDashboardWidget() {
  const stats = useAlertesStats();
  const { data: alertes } = useAlertes({ limit: 3 });
  const { mutate: traiter } = useTraiterAlerte();

  const handleTraiter = (id: string, statut: 'traitee' | 'ignoree') => {
    traiter({ alerteId: id, statut });
  };

  // Ne rien afficher si pas d'alertes
  if (stats.total === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header avec stats */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">
              {stats.total} alerte{stats.total > 1 ? 's' : ''} active{stats.total > 1 ? 's' : ''}
            </h3>
          </div>
          <Link
            href="/alertes"
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Gérer
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {stats.critique > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-red-600">{stats.critique}</span> critique{stats.critique > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {stats.urgent > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-orange-600">{stats.urgent}</span> urgente{stats.urgent > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {stats.attention > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-yellow-600">{stats.attention}</span> à surveiller
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Liste des alertes prioritaires */}
      <div className="p-4 space-y-3">
        {alertes?.slice(0, 3).map((alerte) => (
          <AlerteItem
            key={alerte.id}
            alerte={alerte}
            onTraiter={handleTraiter}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export { AlerteItem };
export default AlertesDashboardWidget;
