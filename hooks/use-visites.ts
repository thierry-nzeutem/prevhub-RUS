// ============================================
// PREV'HUB - Hook Visites
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase-client';
import { useAuth } from '@/lib/auth-context';

// ============================================
// Types
// ============================================

export interface Visite {
  id: string;
  etablissement_id: string | null;
  groupement_id: string | null;
  preventionniste_id: string | null;
  type_visite: string;
  date: string;
  heure_debut: string | null;
  heure_fin: string | null;
  heure_debut_effective: string | null;
  heure_fin_effective: string | null;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'reportee' | 'annulee';
  motif_report: string | null;
  observations: string | null;
  compte_rendu: string | null;
  rapport_genere: boolean;
  rapport_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  etablissement?: {
    id: string;
    nom_commercial: string;
    adresse: string;
    code_postal: string;
    ville: string;
    type_erp: string;
    categorie_erp: number;
    telephone: string | null;
    exploitant_nom: string | null;
    exploitant_prenom: string | null;
    exploitant_telephone: string | null;
  };
  groupement?: {
    id: string;
    nom: string;
    type: string;
  };
  preventionniste?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  prescriptions?: any[];
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les visites avec filtres
 */
export function useVisites(filters?: {
  date?: string;
  preventionniste_id?: string;
  etablissement_id?: string;
  statut?: string;
  limit?: number;
}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['visites', filters],
    queryFn: async () => {
      let query = supabase
        .from('visites')
        .select(`
          *,
          etablissement:etablissements(
            id,
            nom_commercial,
            adresse,
            code_postal,
            ville,
            type_erp,
            categorie_erp,
            telephone,
            exploitant_nom,
            exploitant_prenom,
            exploitant_telephone
          ),
          groupement:groupements(id, nom, type),
          preventionniste:profiles!visites_preventionniste_id_fkey(id, nom, prenom, email),
          prescriptions:prescriptions(id, numero_prescription, statut, priorite, description_reformulee, description_complete, date_limite_conformite)
        `)
        .order('date', { ascending: true })
        .order('heure_debut', { ascending: true });

      if (filters?.date) {
        query = query.eq('date', filters.date);
      }

      if (filters?.preventionniste_id) {
        query = query.eq('preventionniste_id', filters.preventionniste_id);
      }

      if (filters?.etablissement_id) {
        query = query.eq('etablissement_id', filters.etablissement_id);
      }

      if (filters?.statut) {
        query = query.eq('statut', filters.statut);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Visite[];
    },
  });
}

/**
 * Hook pour récupérer une visite par ID
 */
export function useVisite(visiteId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['visite', visiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visites')
        .select(`
          *,
          etablissement:etablissements(
            id,
            nom_commercial,
            enseigne,
            adresse,
            complement_adresse,
            code_postal,
            ville,
            type_erp,
            categorie_erp,
            effectif_public,
            effectif_personnel,
            telephone,
            email,
            exploitant_nom,
            exploitant_prenom,
            exploitant_telephone,
            exploitant_email,
            latitude,
            longitude
          ),
          groupement:groupements(id, nom, type, adresse, ville),
          preventionniste:profiles!visites_preventionniste_id_fkey(id, nom, prenom, email, telephone),
          prescriptions:prescriptions(
            id,
            numero_prescription,
            statut,
            priorite,
            criticite,
            description_complete,
            description_reformulee,
            date_limite_conformite,
            photos_avant,
            photos_apres
          )
        `)
        .eq('id', visiteId)
        .single();

      if (error) throw error;
      return data as Visite;
    },
    enabled: !!visiteId,
  });
}

/**
 * Hook pour les visites du jour de l'utilisateur
 */
export function useVisitesAujourdhui() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useVisites({
    date: today,
    preventionniste_id: user?.id,
  });
}

/**
 * Hook pour les prochaines visites
 */
export function useProchainesVisites(limit: number = 5) {
  const supabase = useSupabase();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['visites-prochaines', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visites')
        .select(`
          *,
          etablissement:etablissements(id, nom_commercial, adresse, ville, categorie_erp),
          groupement:groupements(id, nom)
        `)
        .eq('preventionniste_id', user?.id)
        .gte('date', today)
        .in('statut', ['planifiee', 'en_cours'])
        .order('date', { ascending: true })
        .order('heure_debut', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Visite[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Hook pour créer une visite
 */
export function useCreateVisite() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visite: Partial<Visite>) => {
      const { data, error } = await supabase
        .from('visites')
        .insert(visite)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visites'] });
    },
  });
}

/**
 * Hook pour mettre à jour une visite
 */
export function useUpdateVisite() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Visite>) => {
      const { data, error } = await supabase
        .from('visites')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visites'] });
      queryClient.invalidateQueries({ queryKey: ['visite', data.id] });
    },
  });
}

/**
 * Hook pour démarrer une visite
 */
export function useStartVisite() {
  const { mutate: updateVisite, ...rest } = useUpdateVisite();

  return {
    ...rest,
    startVisite: (visiteId: string) => {
      updateVisite({
        id: visiteId,
        statut: 'en_cours',
        heure_debut_effective: new Date().toTimeString().slice(0, 5),
      });
    },
  };
}

/**
 * Hook pour terminer une visite
 */
export function useEndVisite() {
  const { mutate: updateVisite, ...rest } = useUpdateVisite();

  return {
    ...rest,
    endVisite: (visiteId: string, observations?: string) => {
      updateVisite({
        id: visiteId,
        statut: 'terminee',
        heure_fin_effective: new Date().toTimeString().slice(0, 5),
        observations,
      });
    },
  };
}

/**
 * Hook pour reporter une visite
 */
export function useReportVisite() {
  const { mutate: updateVisite, ...rest } = useUpdateVisite();

  return {
    ...rest,
    reportVisite: (visiteId: string, nouvelleDate: string, motif: string) => {
      updateVisite({
        id: visiteId,
        statut: 'reportee',
        motif_report: motif,
        metadata: {
          ancienne_date: new Date().toISOString().split('T')[0],
          nouvelle_date: nouvelleDate,
        },
      });
    },
  };
}

/**
 * Hook pour supprimer une visite
 */
export function useDeleteVisite() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visiteId: string) => {
      const { error } = await supabase
        .from('visites')
        .delete()
        .eq('id', visiteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visites'] });
    },
  });
}

// ============================================
// Exports
// ============================================

export {
  useVisites,
  useVisite,
  useVisitesAujourdhui,
  useProchainesVisites,
  useCreateVisite,
  useUpdateVisite,
  useStartVisite,
  useEndVisite,
  useReportVisite,
  useDeleteVisite,
};
