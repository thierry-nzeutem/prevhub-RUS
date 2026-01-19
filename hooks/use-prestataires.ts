// ============================================
// PREV'HUB - Hook Prestataires
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase-client';

// ============================================
// Types
// ============================================

export interface Prestataire {
  id: string;
  societe_id: string;
  raison_sociale: string;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  contact_nom: string | null;
  contact_prenom: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
  domaines_expertise: string[];
  certifications: string[];
  zone_intervention: string[];
  note_moyenne: number;
  nb_interventions: number;
  delai_moyen_intervention: number | null;
  is_favorite: boolean;
  commentaires: string | null;
  actif: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePrestataireParams {
  raison_sociale: string;
  siret?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  contact_nom?: string;
  contact_prenom?: string;
  contact_telephone?: string;
  contact_email?: string;
  domaines_expertise?: string[];
  certifications?: string[];
  zone_intervention?: string[];
  commentaires?: string;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les prestataires avec filtres
 */
export function usePrestataires(filters?: {
  domaine?: string;
  ville?: string;
  recherche?: string;
  favoris?: boolean;
  limit?: number;
}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['prestataires', filters],
    queryFn: async () => {
      let query = supabase
        .from('prestataires')
        .select('*')
        .eq('actif', true)
        .order('is_favorite', { ascending: false })
        .order('note_moyenne', { ascending: false })
        .order('raison_sociale', { ascending: true });

      if (filters?.domaine) {
        query = query.contains('domaines_expertise', [filters.domaine]);
      }

      if (filters?.ville) {
        query = query.ilike('ville', `%${filters.ville}%`);
      }

      if (filters?.recherche) {
        query = query.or(
          `raison_sociale.ilike.%${filters.recherche}%,ville.ilike.%${filters.recherche}%,email.ilike.%${filters.recherche}%`
        );
      }

      if (filters?.favoris) {
        query = query.eq('is_favorite', true);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Prestataire[];
    },
  });
}

/**
 * Hook pour récupérer un prestataire par ID
 */
export function usePrestataire(prestataireId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['prestataire', prestataireId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestataires')
        .select('*')
        .eq('id', prestataireId)
        .single();

      if (error) throw error;
      return data as Prestataire;
    },
    enabled: !!prestataireId,
  });
}

/**
 * Hook pour récupérer les prestataires par domaine d'expertise
 */
export function usePrestatairesByDomaine(domaine: string) {
  return usePrestataires({ domaine });
}

/**
 * Hook pour récupérer les prestataires favoris
 */
export function usePrestatairesFavoris() {
  return usePrestataires({ favoris: true });
}

/**
 * Hook pour créer un prestataire
 */
export function useCreatePrestataire() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePrestataireParams) => {
      // Extraire le département du code postal
      let departement: string | null = null;
      if (params.code_postal) {
        if (params.code_postal.startsWith('97') || params.code_postal.startsWith('98')) {
          departement = params.code_postal.substring(0, 3);
        } else if (params.code_postal.startsWith('20')) {
          // Corse
          const code = parseInt(params.code_postal);
          departement = code < 20200 ? '2A' : '2B';
        } else {
          departement = params.code_postal.substring(0, 2);
        }
      }

      const { data, error } = await supabase
        .from('prestataires')
        .insert({
          ...params,
          departement,
          domaines_expertise: params.domaines_expertise || [],
          certifications: params.certifications || [],
          zone_intervention: params.zone_intervention || [],
          note_moyenne: 0,
          nb_interventions: 0,
          is_favorite: false,
          actif: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Prestataire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestataires'] });
    },
  });
}

/**
 * Hook pour mettre à jour un prestataire
 */
export function useUpdatePrestataire() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Prestataire>) => {
      const { data, error } = await supabase
        .from('prestataires')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Prestataire;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prestataires'] });
      queryClient.invalidateQueries({ queryKey: ['prestataire', data.id] });
    },
  });
}

/**
 * Hook pour basculer le favori d'un prestataire
 */
export function useToggleFavoriPrestataire() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { data, error } = await supabase
        .from('prestataires')
        .update({
          is_favorite: isFavorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Prestataire;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestataires'] });
    },
  });
}

/**
 * Hook pour ajouter une note à un prestataire
 */
export function useRatePrestataire() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: number }) => {
      // Récupérer le prestataire actuel
      const { data: current, error: fetchError } = await supabase
        .from('prestataires')
        .select('note_moyenne, nb_interventions')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Calculer la nouvelle moyenne
      const nbInterventions = (current.nb_interventions || 0) + 1;
      const nouvelleMoyenne = current.nb_interventions > 0
        ? ((current.note_moyenne * current.nb_interventions) + note) / nbInterventions
        : note;

      const { data, error } = await supabase
        .from('prestataires')
        .update({
          note_moyenne: Math.round(nouvelleMoyenne * 10) / 10,
          nb_interventions: nbInterventions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Prestataire;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prestataires'] });
      queryClient.invalidateQueries({ queryKey: ['prestataire', data.id] });
    },
  });
}

/**
 * Hook pour supprimer (désactiver) un prestataire
 */
export function useDeletePrestataire() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prestataireId: string) => {
      const { error } = await supabase
        .from('prestataires')
        .update({
          actif: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prestataireId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestataires'] });
    },
  });
}

/**
 * Hook pour rechercher des prestataires par zone géographique
 */
export function usePrestatairesByZone(departement: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['prestataires', 'zone', departement],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prestataires')
        .select('*')
        .eq('actif', true)
        .or(`departement.eq.${departement},zone_intervention.cs.{${departement}}`)
        .order('note_moyenne', { ascending: false });

      if (error) throw error;
      return data as Prestataire[];
    },
    enabled: !!departement,
  });
}

/**
 * Hook pour l'auto-complétion des prestataires
 */
export function useSearchPrestataires(query: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['prestataires', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('prestataires')
        .select('id, raison_sociale, ville, domaines_expertise')
        .eq('actif', true)
        .ilike('raison_sociale', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
}

// ============================================
// Utilitaires
// ============================================

/**
 * Liste des domaines d'expertise disponibles
 */
export const DOMAINES_EXPERTISE = [
  { id: 'extincteurs', label: 'Extincteurs', icon: '🧯' },
  { id: 'desenfumage', label: 'Désenfumage', icon: '💨' },
  { id: 'electricite', label: 'Électricité', icon: '⚡' },
  { id: 'alarme', label: 'Alarme incendie', icon: '🔔' },
  { id: 'ascenseurs', label: 'Ascenseurs', icon: '🛗' },
  { id: 'portes_cf', label: 'Portes CF', icon: '🚪' },
  { id: 'sprinklers', label: 'Sprinklers', icon: '💧' },
  { id: 'eclairage_securite', label: 'Éclairage sécurité', icon: '💡' },
  { id: 'robineterie', label: 'Robineterie incendie', icon: '🔴' },
  { id: 'gaz', label: 'Gaz', icon: '🔥' },
  { id: 'cuisine', label: 'Équipements cuisine', icon: '🍳' },
  { id: 'chauffage', label: 'Chauffage/Climatisation', icon: '🌡️' },
] as const;

/**
 * Obtenir le label d'un domaine d'expertise
 */
export function getDomaineLabel(domaineId: string): string {
  const domaine = DOMAINES_EXPERTISE.find((d) => d.id === domaineId);
  return domaine?.label || domaineId;
}

// ============================================
// Exports
// ============================================

export {
  usePrestataires,
  usePrestataire,
  usePrestatairesByDomaine,
  usePrestatairesFavoris,
  useCreatePrestataire,
  useUpdatePrestataire,
  useToggleFavoriPrestataire,
  useRatePrestataire,
  useDeletePrestataire,
  usePrestatairesByZone,
  useSearchPrestataires,
};
