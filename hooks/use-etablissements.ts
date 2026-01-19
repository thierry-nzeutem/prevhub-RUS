// ============================================
// PREV'HUB - Hook Établissements
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/lib/supabase-client';

// ============================================
// Types
// ============================================

export interface Etablissement {
  id: string;
  societe_id: string;
  groupement_id: string | null;
  code: string;
  nom_commercial: string;
  enseigne: string | null;
  adresse: string;
  complement_adresse: string | null;
  code_postal: string;
  ville: string;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  type_erp: string | null;
  categorie_erp: number | null;
  effectif_public: number | null;
  effectif_personnel: number | null;
  effectif_total: number | null;
  surface_plancher: number | null;
  exploitant_nom: string | null;
  exploitant_prenom: string | null;
  exploitant_telephone: string | null;
  exploitant_email: string | null;
  date_ouverture: string | null;
  date_derniere_commission: string | null;
  avis_commission: string | null;
  commentaires: string | null;
  latitude: number | null;
  longitude: number | null;
  actif: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  groupement?: {
    id: string;
    nom: string;
    type: string;
  };
  stats?: {
    prescriptions_actives: number;
    prescriptions_en_retard: number;
    nb_installations: number;
    prochaine_commission?: string;
  };
}

export interface EtablissementFilters {
  groupement_id?: string;
  type_erp?: string;
  categorie_erp?: number;
  ville?: string;
  departement?: string;
  recherche?: string;
  avec_prescriptions?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook pour récupérer les établissements avec filtres
 */
export function useEtablissements(filters?: EtablissementFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['etablissements', filters],
    queryFn: async () => {
      let query = supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(id, nom, type)
        `)
        .eq('actif', true)
        .order('nom_commercial', { ascending: true });

      // Filtres
      if (filters?.groupement_id) {
        query = query.eq('groupement_id', filters.groupement_id);
      }

      if (filters?.type_erp) {
        query = query.eq('type_erp', filters.type_erp);
      }

      if (filters?.categorie_erp) {
        query = query.eq('categorie_erp', filters.categorie_erp);
      }

      if (filters?.ville) {
        query = query.ilike('ville', `%${filters.ville}%`);
      }

      if (filters?.departement) {
        query = query.eq('departement', filters.departement);
      }

      if (filters?.recherche) {
        query = query.or(
          `nom_commercial.ilike.%${filters.recherche}%,enseigne.ilike.%${filters.recherche}%,ville.ilike.%${filters.recherche}%,adresse.ilike.%${filters.recherche}%`
        );
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: etablissements, error } = await query;

      if (error) throw error;

      // Ajouter les stats pour chaque établissement
      const etablissementsWithStats = await Promise.all(
        (etablissements || []).map(async (etab) => {
          // Compter les prescriptions actives
          const { count: prescriptionsActives } = await supabase
            .from('prescriptions')
            .select('id', { count: 'exact', head: true })
            .eq('etablissement_id', etab.id)
            .not('statut', 'in', '(leve,valide)');

          // Compter les prescriptions en retard
          const { count: prescriptionsEnRetard } = await supabase
            .from('prescriptions')
            .select('id', { count: 'exact', head: true })
            .eq('etablissement_id', etab.id)
            .not('statut', 'in', '(leve,valide)')
            .lt('date_limite_conformite', new Date().toISOString().split('T')[0]);

          return {
            ...etab,
            stats: {
              prescriptions_actives: prescriptionsActives || 0,
              prescriptions_en_retard: prescriptionsEnRetard || 0,
            },
          };
        })
      );

      // Filtrer par prescriptions si demandé
      if (filters?.avec_prescriptions) {
        return etablissementsWithStats.filter((e) => e.stats.prescriptions_actives > 0);
      }

      return etablissementsWithStats as Etablissement[];
    },
  });
}

/**
 * Hook pour récupérer un établissement par ID
 */
export function useEtablissement(etablissementId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['etablissement', etablissementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(id, nom, type, adresse, ville),
          prescriptions(id, numero_prescription, statut, priorite, date_limite_conformite, description_reformulee),
          installations(*),
          visites(id, date, heure_debut, statut, type_visite)
        `)
        .eq('id', etablissementId)
        .single();

      if (error) throw error;
      return data as Etablissement;
    },
    enabled: !!etablissementId,
  });
}

/**
 * Hook pour les établissements d'un groupement
 */
export function useEtablissementsByGroupement(groupementId: string) {
  return useEtablissements({ groupement_id: groupementId });
}

/**
 * Hook pour créer un établissement
 */
export function useCreateEtablissement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etablissement: Partial<Etablissement>) => {
      const response = await fetch('/api/etablissements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(etablissement),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur création établissement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] });
    },
  });
}

/**
 * Hook pour mettre à jour un établissement
 */
export function useUpdateEtablissement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Etablissement>) => {
      const response = await fetch('/api/etablissements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur mise à jour établissement');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] });
      queryClient.invalidateQueries({ queryKey: ['etablissement', variables.id] });
    },
  });
}

/**
 * Hook pour supprimer un établissement
 */
export function useDeleteEtablissement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etablissementId: string) => {
      const response = await fetch(`/api/etablissements?id=${etablissementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur suppression établissement');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] });
    },
  });
}

/**
 * Hook pour rechercher des établissements (avec debounce)
 */
export function useSearchEtablissements(query: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['etablissements-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('etablissements')
        .select('id, nom_commercial, enseigne, ville, type_erp, categorie_erp')
        .eq('actif', true)
        .or(`nom_commercial.ilike.%${query}%,enseigne.ilike.%${query}%,ville.ilike.%${query}%`)
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

export const TYPES_ERP = [
  { code: 'J', label: 'Structures d\'accueil pour personnes âgées ou handicapées' },
  { code: 'L', label: 'Salles d\'auditions, de conférences, de réunions, de spectacles' },
  { code: 'M', label: 'Magasins de vente, centres commerciaux' },
  { code: 'N', label: 'Restaurants et débits de boissons' },
  { code: 'O', label: 'Hôtels et pensions de famille' },
  { code: 'P', label: 'Salles de danse et salles de jeux' },
  { code: 'R', label: 'Établissements d\'enseignement, colonies de vacances' },
  { code: 'S', label: 'Bibliothèques, centres de documentation' },
  { code: 'T', label: 'Salles d\'expositions' },
  { code: 'U', label: 'Établissements sanitaires' },
  { code: 'V', label: 'Établissements de culte' },
  { code: 'W', label: 'Administrations, banques, bureaux' },
  { code: 'X', label: 'Établissements sportifs couverts' },
  { code: 'Y', label: 'Musées' },
  { code: 'PA', label: 'Établissements de plein air' },
  { code: 'CTS', label: 'Chapiteaux, tentes et structures' },
  { code: 'SG', label: 'Structures gonflables' },
  { code: 'PS', label: 'Parcs de stationnement couverts' },
  { code: 'GA', label: 'Gares accessibles au public' },
  { code: 'OA', label: 'Hôtels-restaurants d\'altitude' },
  { code: 'EF', label: 'Établissements flottants' },
  { code: 'REF', label: 'Refuges de montagne' },
];

export const CATEGORIES_ERP = [
  { categorie: 1, description: 'Plus de 1500 personnes', couleur: 'red' },
  { categorie: 2, description: 'De 701 à 1500 personnes', couleur: 'orange' },
  { categorie: 3, description: 'De 301 à 700 personnes', couleur: 'yellow' },
  { categorie: 4, description: 'Jusqu\'à 300 personnes (sauf 5e)', couleur: 'blue' },
  { categorie: 5, description: 'En dessous des seuils de 5e catégorie', couleur: 'green' },
];

export function getTypeERPLabel(code: string): string {
  return TYPES_ERP.find(t => t.code === code)?.label || code;
}

export function getCategorieERPInfo(categorie: number) {
  return CATEGORIES_ERP.find(c => c.categorie === categorie);
}

// ============================================
// Exports
// ============================================

export {
  useEtablissements,
  useEtablissement,
  useEtablissementsByGroupement,
  useCreateEtablissement,
  useUpdateEtablissement,
  useDeleteEtablissement,
  useSearchEtablissements,
};
