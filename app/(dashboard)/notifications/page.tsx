'use client';

// ============================================
// PREV'HUB - Page Notifications
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/use-alertes';
import { cn, formatDate } from '@/lib/utils';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Wrench,
  Mail,
  Filter,
  ChevronRight,
  Inbox,
  Clock,
  Loader2,
} from 'lucide-react';

// ============================================
// Types & Helpers
// ============================================

type FilterType = 'all' | 'unread' | 'prescription' | 'commission' | 'verification';

function getNotificationConfig(type: string) {
  switch (type) {
    case 'prescription_en_retard':
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        label: 'Prescription en retard',
        priority: 1,
      };
    case 'prescription_urgente':
      return {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        label: 'Prescription urgente',
        priority: 2,
      };
    case 'commission_a_preparer':
      return {
        icon: Calendar,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        label: 'Commission à préparer',
        priority: 3,
      };
    case 'verification_a_prevoir':
      return {
        icon: Wrench,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        label: 'Vérification à prévoir',
        priority: 4,
      };
    case 'visite_planifiee':
      return {
        icon: Calendar,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        label: 'Visite planifiée',
        priority: 5,
      };
    case 'commande_intervention':
      return {
        icon: Mail,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        label: 'Commande envoyée',
        priority: 6,
      };
    case 'recap_hebdomadaire':
      return {
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Récapitulatif',
        priority: 7,
      };
    default:
      return {
        icon: Bell,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        label: 'Notification',
        priority: 10,
      };
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return formatDate(dateStr);
}

function getNotificationLink(notification: any): string | null {
  const meta = notification.metadata || {};
  switch (notification.type) {
    case 'prescription_en_retard':
    case 'prescription_urgente':
      return meta.prescription_id ? `/prescriptions/${meta.prescription_id}` : '/prescriptions';
    case 'commission_a_preparer':
      return meta.commission_id ? `/commissions/${meta.commission_id}` : '/commissions';
    case 'verification_a_prevoir':
      return meta.verification_id ? `/verifications/${meta.verification_id}` : '/verifications';
    case 'visite_planifiee':
      return meta.visite_id ? `/visites/${meta.visite_id}` : '/visites';
    default:
      return null;
  }
}

// ============================================
// Composants
// ============================================

function FilterTabs({
  activeFilter,
  setActiveFilter,
  unreadCount,
}: {
  activeFilter: FilterType;
  setActiveFilter: (f: FilterType) => void;
  unreadCount: number;
}) {
  const filters: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'unread', label: 'Non lues', count: unreadCount },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'commission', label: 'Commissions' },
    { id: 'verification', label: 'Vérifications' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
            activeFilter === filter.id
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {filter.label}
          {filter.count !== undefined && filter.count > 0 && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-xs font-bold',
              activeFilter === filter.id
                ? 'bg-orange-200 text-orange-800'
                : 'bg-gray-200 text-gray-700'
            )}>
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: any;
  onMarkAsRead: () => void;
}) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;
  const link = getNotificationLink(notification);

  const content = (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border rounded-xl transition-all',
        notification.lu
          ? 'bg-white border-gray-200'
          : 'bg-orange-50 border-orange-200 shadow-sm'
      )}
    >
      {/* Icône */}
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bgColor)}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={cn(
              'inline-block px-2 py-0.5 rounded text-xs font-medium mb-1',
              config.bgColor, config.color
            )}>
              {config.label}
            </span>
            <h3 className={cn(
              'text-sm font-medium',
              notification.lu ? 'text-gray-700' : 'text-gray-900'
            )}>
              {notification.metadata?.nom_etablissement || notification.sujet || 'Notification'}
            </h3>
          </div>

          {!notification.lu && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAsRead();
              }}
              className="p-1.5 hover:bg-white rounded-lg transition-colors"
              title="Marquer comme lu"
            >
              <Check className="w-4 h-4 text-gray-400 hover:text-green-600" />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {notification.metadata?.message ||
            notification.contenu ||
            `${notification.metadata?.jours_restants !== undefined
              ? `${notification.metadata.jours_restants} jour(s) restant(s)`
              : ''
            }`}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(notification.created_at)}
          </div>

          {link && (
            <span className="text-xs font-medium text-orange-600 flex items-center gap-0.5">
              Voir détails
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block hover:scale-[1.01] transition-transform">
        {content}
      </Link>
    );
  }

  return content;
}

function EmptyState({ filter }: { filter: FilterType }) {
  const messages: Record<FilterType, { title: string; description: string }> = {
    all: {
      title: 'Aucune notification',
      description: 'Vous n\'avez pas encore reçu de notification.',
    },
    unread: {
      title: 'Tout est lu !',
      description: 'Vous êtes à jour sur toutes vos notifications.',
    },
    prescription: {
      title: 'Aucune notification de prescription',
      description: 'Les alertes de prescription apparaîtront ici.',
    },
    commission: {
      title: 'Aucune notification de commission',
      description: 'Les rappels de commission apparaîtront ici.',
    },
    verification: {
      title: 'Aucune notification de vérification',
      description: 'Les échéances de vérification apparaîtront ici.',
    },
  };

  const { title, description } = messages[filter];

  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        {filter === 'unread' ? (
          <CheckCheck className="w-8 h-8 text-green-500" />
        ) : (
          <Inbox className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: notifications, isLoading, error } = useNotifications({
    limit: 100,
    unreadOnly: filter === 'unread',
  });

  const { data: unreadCount } = useUnreadNotificationsCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

  // Filtrer les notifications
  const filteredNotifications = notifications?.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.lu;
    if (filter === 'prescription') return n.type.includes('prescription');
    if (filter === 'commission') return n.type.includes('commission');
    if (filter === 'verification') return n.type.includes('verification');
    return true;
  }) || [];

  // Grouper par date
  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Hier';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      group = 'Cette semaine';
    } else {
      group = 'Plus ancien';
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, typeof filteredNotifications>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount || 0} non lue{(unreadCount || 0) > 1 ? 's' : ''}
          </p>
        </div>

        {(unreadCount || 0) > 0 && (
          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isMarkingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="mb-6">
        <FilterTabs
          activeFilter={filter}
          setActiveFilter={setFilter}
          unreadCount={unreadCount || 0}
        />
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">
          Erreur lors du chargement des notifications
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([group, items]) => (
            <div key={group}>
              <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">{group}</h2>
              <div className="space-y-3">
                {items.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
