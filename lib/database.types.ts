export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string
          nom: string
          adresse_complete: string | null
          code_postal: string | null
          ville: string | null
          coordonnees_gps: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sites']['Insert']>
      }
      societes: {
        Row: {
          id: string
          raison_sociale: string
          siret: string | null
          forme_juridique: string | null
          logo: string | null
          secteur_activite: string | null
          adresse_siege: string | null
          code_postal: string | null
          ville: string | null
          telephone: string | null
          email: string | null
          site_web: string | null
          est_exploitation: boolean
          est_maintenance: boolean
          est_proprietaire: boolean
          est_syndic: boolean
          autre_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['societes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['societes']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          civilite: string | null
          prenom: string
          nom: string
          fonction: string | null
          photo: string | null
          telephone_portable: string | null
          telephone_fixe: string | null
          email_professionnel: string | null
          email_personnel: string | null
          societe_id: string | null
          canal_prefere: string
          langue: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      contrats: {
        Row: {
          id: string
          numero_contrat: string
          date_debut: string
          date_fin: string | null
          duree_engagement_mois: number | null
          reconduction_tacite: boolean
          type_signataire: string | null
          societe_id: string | null
          type_prestation: string[]
          periodicite_visites: string | null
          nombre_visites_annuelles: number | null
          prix_unitaire_visite: number | null
          prix_forfaitaire_annuel: number | null
          mode_facturation: string
          date_reevaluation_tarifaire: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contrats']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contrats']['Insert']>
      }
      groupements: {
        Row: {
          id: string
          nom: string
          logo: string | null
          adresse_complete: string | null
          code_postal: string | null
          ville: string | null
          coordonnees_gps: Json | null
          site_id: string | null
          types_erp: string[]
          categorie_erp: string | null
          effectif_total_public: number
          date_derniere_commission: string | null
          prochaine_commission: string | null
          periodicite_commission: number
          avis_derniere_commission: string | null
          contrat_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['groupements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['groupements']['Insert']>
      }
      etablissements: {
        Row: {
          id: string
          nom_commercial: string
          enseigne: string | null
          logo: string | null
          numero_dans_groupement: string | null
          groupement_id: string | null
          site_id: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          types_erp: string[]
          categorie_erp: string | null
          effectif_public: number
          surface_m2: number | null
          societe_exploitation_id: string | null
          ge5_affiche: boolean
          ge5_date_derniere_verification: string | null
          sogs_transmis: boolean
          sogs_date_transmission: string | null
          date_derniere_commission: string | null
          prochaine_commission: string | null
          est_client_preveris: boolean
          contrat_id: string | null
          contrat_via_groupement: boolean
          batiments_occupes: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['etablissements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['etablissements']['Insert']>
      }
      installations_techniques: {
        Row: {
          id: string
          nom: string
          type_installation: string
          periodicite_reglementaire: string
          base_reglementaire: string | null
          etablissement_id: string | null
          groupement_id: string | null
          societe_prestataire_id: string | null
          contact_prestataire_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['installations_techniques']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['installations_techniques']['Insert']>
      }
      verifications_periodiques: {
        Row: {
          id: string
          installation_id: string
          date_verification: string
          date_prochaine_verification: string
          statut: string
          societe_prestataire_id: string | null
          numero_rapport: string | null
          document_rapport: string | null
          synthese: string | null
          capture_ecran_analysee: string | null
          date_extraite_par_ocr: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['verifications_periodiques']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['verifications_periodiques']['Insert']>
      }
      visites: {
        Row: {
          id: string
          date_visite: string
          etablissement_id: string | null
          groupement_id: string | null
          type_visite: string
          statut: string
          rapport_pdf: string | null
          date_generation_rapport: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['visites']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['visites']['Insert']>
      }
      observations: {
        Row: {
          id: string
          numero_observation: string
          visite_id: string
          etablissement_id: string | null
          groupement_id: string | null
          description: string
          photos: string[] | null
          type: string
          criticite: string
          type_intervenant_suggere: string | null
          prestataire_recommande_id: string | null
          contact_recommande_id: string | null
          cout_estime_min: number | null
          cout_estime_max: number | null
          score_confiance_ia: number | null
          statut: string
          date_resolution: string | null
          commentaire_resolution: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['observations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['observations']['Insert']>
      }
      commissions_securite: {
        Row: {
          id: string
          date_commission: string
          etablissement_id: string | null
          groupement_id: string | null
          type_commission: string
          periodicite: number
          date_prochaine_commission: string | null
          avis: string | null
          pv_commission: string | null
          convocation: string | null
          dossier_presente: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['commissions_securite']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['commissions_securite']['Insert']>
      }
      prescriptions_commission: {
        Row: {
          id: string
          numero_prescription: string
          commission_id: string
          etablissement_id: string | null
          groupement_id: string | null
          description_complete: string
          articles_reglementaires: string[] | null
          delai_reglementaire_jours: number | null
          date_limite_conformite: string | null
          type_intervention: string
          type_intervenant_suggere: string | null
          score_confiance_ia: number | null
          prestataire_recommande_id: string | null
          raison_recommendation: string | null
          cout_estime_min: number | null
          cout_estime_max: number | null
          statut: string
          date_realisation: string | null
          prestataire_effectif_id: string | null
          cout_reel: number | null
          rapport_travaux: string | null
          facture: string | null
          note_satisfaction_client: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prescriptions_commission']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prescriptions_commission']['Insert']>
      }
    }
  }
}
