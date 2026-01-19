'use client';

// ============================================
// PREV'HUB - Hooks Personnalisés
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type {
  Groupement,
  Etablissement,
  Commission,
  Prescription,
  Visite,
  Observation,
  InstallationTechnique,
  VerificationPeriodique,
  Alerte,
  Notification,
  CommandeIntervention,
  Societe,
  FiltresPrescriptions,
  FiltresEtablissements,
  FiltresCommissions,
} from '@/types';

// ============================================
// Hook générique pour les requêtes
// ============================================

interface UseQueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: any[] = [],
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true, onSuccess, onError } = options;

  const fetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  useEffect(() => {
    fetch();
  }, [...deps, enabled]);

  return { data, isLoading, error, refetch: fetch };
}

// ============================================
// Hook pour les mutations
// ============================================

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
  } = {}
): UseMutationResult<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError } = options;

  const mutate = useCallback(async (variables: V): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error, variables);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { mutate, isLoading, error, data, reset };
}

// ============================================
// Hook Groupements
// ============================================

export function useGroupements() {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Groupement[]>(
    async () => {
      const { data, error } = await supabase
        .from('groupements')
        .select(`
          *,
          site:sites(*),
          contrat:contrats(*),
          etablissements(count),
          commissions(count)
        `)
        .order('nom');

      if (error) throw error;
      return data as Groupement[];
    },
    []
  );
}

export function useGroupement(id: string | null) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Groupement | null>(
    async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('groupements')
        .select(`
          *,
          site:sites(*),
          contrat:contrats(*),
          etablissements(*),
          parties_communes(*),
          installations_techniques(*),
          commissions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Groupement;
    },
    [id],
    { enabled: !!id }
  );
}

// ============================================
// Hook Établissements
// ============================================

export function useEtablissements(filtres?: FiltresEtablissements) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Etablissement[]>(
    async () => {
      let query = supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(id, nom),
          societe_exploitation:societes(id, raison_sociale),
          contrat:contrats(id, numero_contrat, statut)
        `)
        .order('nom_commercial');

      if (filtres?.groupement_id) {
        query = query.eq('groupement_id', filtres.groupement_id);
      }
      if (filtres?.ville) {
        query = query.ilike('ville', `%${filtres.ville}%`);
      }
      if (filtres?.est_client_preveris !== undefined) {
        query = query.eq('est_client_preveris', filtres.est_client_preveris);
      }
      if (filtres?.recherche) {
        query = query.or(`nom_commercial.ilike.%${filtres.recherche}%,enseigne.ilike.%${filtres.recherche}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Etablissement[];
    },
    [JSON.stringify(filtres)]
  );
}

export function useEtablissement(id: string | null) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Etablissement | null>(
    async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(*),
          societe_exploitation:societes(*),
          contrat:contrats(*),
          installations_techniques(*),
          visites(*),
          prescriptions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Etablissement;
    },
    [id],
    { enabled: !!id }
  );
}

// ============================================
// Hook Commissions
// ============================================

export function useCommissions(filtres?: FiltresCommissions) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Commission[]>(
    async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          groupement:groupements(id, nom),
          etablissement:etablissements(id, nom_commercial),
          prescriptions(count)
        `)
        .order('date', { ascending: false });

      if (filtres?.groupement_id) {
        query = query.eq('groupement_id', filtres.groupement_id);
      }
      if (filtres?.avis && filtres.avis.length > 0) {
        query = query.in('avis', filtres.avis);
      }
      if (filtres?.date_debut) {
        query = query.gte('date', filtres.date_debut);
      }
      if (filtres?.date_fin) {
        query = query.lte('date', filtres.date_fin);
      }
      if (filtres?.a_preparer) {
        query = query.gte('date', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Commission[];
    },
    [JSON.stringify(filtres)]
  );
}

export function useCommissionsAPreparer() {
  const supabase = getSupabaseBrowserClient();

  return useQuery<any[]>(
    async () => {
      const { data, error } = await supabase
        .from('v_commissions_a_preparer')
        .select('*')
        .limit(20);

      if (error) throw error;
      return data;
    },
    []
  );
}

// ============================================
// Hook Prescriptions
// ============================================

export function usePrescriptions(filtres?: FiltresPrescriptions) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Prescription[]>(
    async () => {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          commission:commissions(id, date, avis),
          etablissement:etablissements(id, nom_commercial),
          groupement:groupements(id, nom),
          prestataire_recommande:societes!prestataire_recommande_id(id, raison_sociale),
          prestataire_effectif:societes!prestataire_effectif_id(id, raison_sociale)
        `)
        .order('date_limite_conformite', { ascending: true });

      if (filtres?.statut && filtres.statut.length > 0) {
        query = query.in('statut', filtres.statut);
      }
      if (filtres?.priorite && filtres.priorite.length > 0) {
        query = query.in('priorite', filtres.priorite);
      }
      if (filtres?.groupement_id) {
        query = query.eq('groupement_id', filtres.groupement_id);
      }
      if (filtres?.etablissement_id) {
        query = query.eq('etablissement_id', filtres.etablissement_id);
      }
      if (filtres?.commission_id) {
        query = query.eq('commission_id', filtres.commission_id);
      }
      if (filtres?.en_retard) {
        query = query.lt('date_limite_conformite', new Date().toISOString().split('T')[0]);
      }
      if (filtres?.recherche) {
        query = query.ilike('description_complete', `%${filtres.recherche}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Prescription[];
    },
    [JSON.stringify(filtres)]
  );
}

export function usePrescription(id: string | null) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Prescription | null>(
    async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          commission:commissions(*),
          etablissement:etablissements(*),
          groupement:groupements(*),
          prestataire_recommande:societes!prestataire_recommande_id(*),
          prestataire_effectif:societes!prestataire_effectif_id(*),
          historique:prescriptions_historique(*),
          commandes:commandes_intervention(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Prescription;
    },
    [id],
    { enabled: !!id }
  );
}

export function useUpdatePrescription() {
  const supabase = getSupabaseBrowserClient();

  return useMutation<Prescription, { id: string; updates: Partial<Prescription> }>(
    async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Prescription;
    }
  );
}

// ============================================
// Hook Visites
// ============================================

export function useVisites(preventionnisteId?: string, dateDebut?: string, dateFin?: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Visite[]>(
    async () => {
      let query = supabase
        .from('visites')
        .select(`
          *,
          etablissement:etablissements(id, nom_commercial, adresse, ville),
          groupement:groupements(id, nom),
          preventionniste:profiles(id, prenom, nom),
          observations(count)
        `)
        .order('date_visite', { ascending: false });

      if (preventionnisteId) {
        query = query.eq('preventionniste_id', preventionnisteId);
      }
      if (dateDebut) {
        query = query.gte('date_visite', dateDebut);
      }
      if (dateFin) {
        query = query.lte('date_visite', dateFin);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Visite[];
    },
    [preventionnisteId, dateDebut, dateFin]
  );
}

export function useVisitesDuJour(preventionnisteId: string) {
  const today = new Date().toISOString().split('T')[0];
  return useVisites(preventionnisteId, today, today);
}

// ============================================
// Hook Vérifications Techniques
// ============================================

export function useVerificationsAlertes() {
  const supabase = getSupabaseBrowserClient();

  return useQuery<any[]>(
    async () => {
      const { data, error } = await supabase
        .from('v_verifications_alertes')
        .select('*')
        .in('statut_alerte', ['en_retard', 'urgent', 'a_prevoir'])
        .order('jours_restants', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data;
    },
    []
  );
}

// ============================================
// Hook Alertes
// ============================================

export function useAlertes(nonLues = false) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Alerte[]>(
    async () => {
      let query = supabase
        .from('alertes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (nonLues) {
        query = query.eq('lue', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Alerte[];
    },
    [nonLues]
  );
}

export function useAlertesCount() {
  const supabase = getSupabaseBrowserClient();

  return useQuery<number>(
    async () => {
      const { count, error } = await supabase
        .from('alertes')
        .select('*', { count: 'exact', head: true })
        .eq('lue', false);

      if (error) throw error;
      return count || 0;
    },
    []
  );
}

// ============================================
// Hook Notifications
// ============================================

export function useNotifications() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery<Notification[]>(
    async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    [user?.id],
    { enabled: !!user?.id }
  );
}

export function useMarkNotificationRead() {
  const supabase = getSupabaseBrowserClient();

  return useMutation<void, string>(
    async (id) => {
      const { error } = await supabase
        .from('notifications')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    }
  );
}

// ============================================
// Hook Commandes Intervention
// ============================================

export function useCommandes(prestataireId?: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<CommandeIntervention[]>(
    async () => {
      let query = supabase
        .from('commandes_intervention')
        .select(`
          *,
          prestataire:societes!prestataire_id(id, raison_sociale),
          prescription:prescriptions(id, numero_prescription, description_complete),
          etablissement:etablissements(id, nom_commercial)
        `)
        .order('created_at', { ascending: false });

      if (prestataireId) {
        query = query.eq('prestataire_id', prestataireId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommandeIntervention[];
    },
    [prestataireId]
  );
}

export function useCreateCommande() {
  const supabase = getSupabaseBrowserClient();

  return useMutation<CommandeIntervention, Omit<CommandeIntervention, 'id' | 'numero_commande' | 'created_at' | 'updated_at'>>(
    async (commande) => {
      const { data, error } = await supabase
        .from('commandes_intervention')
        .insert(commande)
        .select()
        .single();

      if (error) throw error;
      return data as CommandeIntervention;
    }
  );
}

// ============================================
// Hook Prestataires
// ============================================

export function usePrestataires(domaineExpertise?: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery<Societe[]>(
    async () => {
      let query = supabase
        .from('societes')
        .select('*')
        .eq('est_prestataire', true)
        .order('note_moyenne', { ascending: false, nullsFirst: false });

      if (domaineExpertise) {
        query = query.contains('domaines_expertise', [domaineExpertise]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Societe[];
    },
    [domaineExpertise]
  );
}

// ============================================
// Hook Dashboard KPIs
// ============================================

export function useDashboardKPIs() {
  const supabase = getSupabaseBrowserClient();

  return useQuery<any>(
    async () => {
      const { data, error } = await supabase
        .from('v_dashboard_kpis')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    []
  );
}

// ============================================
// Hook Temps réel (Subscriptions)
// ============================================

export function useRealtimeAlertes(callback: (alerte: Alerte) => void) {
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const subscription = supabase
      .channel('alertes-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertes' },
        (payload) => {
          callback(payload.new as Alerte);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, callback]);
}

export function useRealtimeNotifications(userId: string, callback: (notification: Notification) => void) {
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const subscription = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, userId, callback]);
}

// ============================================
// Exports
// ============================================

export { useQuery, useMutation };
