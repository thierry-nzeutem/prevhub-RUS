'use client';

// ============================================
// PREV'HUB - Composant NotificationBell
// ============================================

import { useState, useRef, useEffect } from 'react';
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
  X,
  Check,
  CheckCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Wrench,
  Mail,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    sujet: string | null;
    contenu: string | null;
    lu: boolean;
    created_at: string;
    metadata: Record<string, any>;
  };
  onMarkAsRead: () => void;
}

// ============================================
// Composants internes
// ============================================

function getNotificationIcon(type: string) {
  switch (type) {
    case 'prescription_en_retard':
    case 'prescription_urgente':
      return { icon: AlertTriangle, color: 'text-red-500 bg-red-100' };
    case 'commission_a_preparer':
      return { icon: Calendar, color: 'text-orange-500 bg-orange-100' };
    case 'verification_a_prevoir':
      return { icon: Wrench, color: 'text-blue-500 bg-blue-100' };
    case 'visite_planifiee':
      return { icon: Calendar, color: 'text-green-500 bg-green-100' };
    case 'commande_intervention':
      return { icon: Mail, color: 'text-purple-500 bg-purple-100' };
    default:
      return { icon: Bell, color: 'text-gray-500 bg-gray-100' };
  }
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const { icon: Icon, color } = getNotificationIcon(notification.type);

  const getTitle = () => {
    switch (notification.type) {
      case 'prescription_en_retard':
        return 'Prescription en retard';
      case 'prescription_urgente':
        return 'Prescription urgente';
      case 'commission_a_preparer':
        return 'Commission à préparer';
      case 'verification_a_prevoir':
        return 'Vérification à prévoir';
      case 'visite_planifiee':
        return 'Visite planifiée';
      case 'commande_intervention':
        return 'Commande envoyée';
      case 'recap_hebdomadaire':
        return 'Récapitulatif hebdomadaire';
      default:
        return 'Notification';
    }
  };

  const getLink = () => {
    const meta = notification.metadata || {};
    switch (notification.type) {
      case 'prescription_en_retard':
      case 'prescription_urgente':
        return `/prescriptions/${meta.prescription_id || ''}`;
      case 'commission_a_preparer':
        return `/commissions/${meta.commission_id || ''}`;
      case 'verification_a_prevoir':
        return `/verifications/${meta.verification_id || ''}`;
      case 'visite_planifiee':
        return `/visites/${meta.visite_id || ''}`;
      default:
        return null;
    }
  };

  const link = getLink();

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 border-b border-gray-100 last:border-0 transition-colors',
        notification.lu ? 'bg-white' : 'bg-orange-50'
      )}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', notification.lu ? 'text-gray-700' : 'text-gray-900')}>
            {getTitle()}
          </p>
          {!notification.lu && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAsRead();
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Marquer comme lu"
            >
              <Check className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
          {notification.metadata?.nom_etablissement || notification.contenu || 'Nouvelle notification'}
        </p>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(notification.created_at)}
          </span>
          {link && (
            <Link
              href={link}
              className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
            >
              Voir
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
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

// ============================================
// Composant principal
// ============================================

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications, isLoading } = useNotifications({ limit: 10 });
  const { data: unreadCount } = useUnreadNotificationsCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-600'
        )}
      >
        <Bell className="w-5 h-5" />
        {(unreadCount || 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {(unreadCount || 0) > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {(unreadCount || 0) > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Chargement...
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <Link
              href="/notifications"
              className="block p-3 text-center text-sm font-medium text-orange-600 hover:bg-orange-50 border-t border-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Voir toutes les notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Export par défaut
// ============================================

export default NotificationBell;
