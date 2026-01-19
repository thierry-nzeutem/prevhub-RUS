// ============================================
// PREV'HUB - Hooks Alertes & Notifications
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

// ============================================
// Types
// ============================================

export interface Alerte {
  id: string;
  type: 'prescription' | 'commission' | 'verification' | 'document' | 'autre';
  niveau: 'critique' | 'urgent' | 'attention' | 'info';
  entite_type: string;
  entite_id: string;
  message: string;
  jours_restants: number | null;
  statut: 'active' | 'traitee' | 'ignoree' | 'expiree';
  traitee_par: string | null;
  traitee_at: string | null;
  commentaire_traitement: string | null;
  metadata: Record<string, any>;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  canal: 'email' | 'sms' | 'push' | 'in_app';
  destinataire_id: string | null;
  destinataire_email: string | null;
  destinataire_telephone: string | null;
  sujet: string | null;
  contenu: string | null;
  statut: 'en_attente' | 'envoye' | 'echec' | 'lu';
  message_id: string | null;
  erreur: string | null;
  lu: boolean;
  lu_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AlertesCompteur {
  type: string;
  niveau: string;
  count: number;
}

// ============================================
// HOOKS ALERTES
// ============================================

/**
 * Hook pour récupérer les alertes actives
 */
export function useAlertes(filters?: {
  type?: string;
  niveau?: string;
  limit?: number;
}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['alertes', filters],
    queryFn: async () => {
      let query = supabase
        .from('v_alertes_actives')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      if (filters?.niveau) {
        query = query.eq('niveau', filters.niveau);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Alerte[];
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
}

/**
 * Hook pour le compteur d'alertes
 */
export function useAlertesCompteur() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['alertes-compteur'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_alertes_compteur')
        .select('*');

      if (error) throw error;
      return data as AlertesCompteur[];
    },
    refetchInterval: 60000,
  });
}

/**
 * Hook pour les stats d'alertes (résumé)
 */
export function useAlertesStats() {
  const { data: compteur } = useAlertesCompteur();

  const stats = {
    total: 0,
    critique: 0,
    urgent: 0,
    attention: 0,
    parType: {
      prescription: 0,
      commission: 0,
      verification: 0,
    },
  };

  if (compteur) {
    for (const c of compteur) {
      stats.total += c.count;
      
      if (c.niveau === 'critique') stats.critique += c.count;
      if (c.niveau === 'urgent') stats.urgent += c.count;
      if (c.niveau === 'attention') stats.attention += c.count;
      
      if (c.type === 'prescription') stats.parType.prescription += c.count;
      if (c.type === 'commission') stats.parType.commission += c.count;
      if (c.type === 'verification') stats.parType.verification += c.count;
    }
  }

  return stats;
}

/**
 * Hook pour marquer une alerte comme traitée
 */
export function useTraiterAlerte() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      alerteId,
      statut,
      commentaire,
    }: {
      alerteId: string;
      statut: 'traitee' | 'ignoree';
      commentaire?: string;
    }) => {
      const { data, error } = await supabase
        .from('alertes')
        .update({
          statut,
          traitee_par: user?.id,
          traitee_at: new Date().toISOString(),
          commentaire_traitement: commentaire || null,
        })
        .eq('id', alerteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] });
      queryClient.invalidateQueries({ queryKey: ['alertes-compteur'] });
    },
  });
}

// ============================================
// HOOKS NOTIFICATIONS
// ============================================

/**
 * Hook pour récupérer les notifications de l'utilisateur
 */
export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, options],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('destinataire_id', user.id)
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('lu', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });
}

/**
 * Hook pour le compteur de notifications non lues
 */
export function useUnreadNotificationsCount() {
  const supabase = useSupabase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('destinataire_id', user.id)
        .eq('lu', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

/**
 * Hook pour marquer une notification comme lue
 */
export function useMarkNotificationAsRead() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          lu: true,
          lu_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('destinataire_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/**
 * Hook pour marquer toutes les notifications comme lues
 */
export function useMarkAllNotificationsAsRead() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({
          lu: true,
          lu_at: new Date().toISOString(),
        })
        .eq('destinataire_id', user?.id)
        .eq('lu', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

/**
 * Hook pour envoyer une notification
 */
export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      type: string;
      canal: 'email' | 'sms' | 'push';
      destinataire_id?: string;
      destinataire_email?: string;
      destinataire_telephone?: string;
      data: Record<string, any>;
    }) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur envoi notification');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ============================================
// EXPORTS
// ============================================

export {
  useAlertes,
  useAlertesCompteur,
  useAlertesStats,
  useTraiterAlerte,
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useSendNotification,
};
