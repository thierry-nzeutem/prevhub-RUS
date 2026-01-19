// ============================================
// PREV'HUB - Types TypeScript Complets
// ============================================

// Types de base
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================
// UTILISATEURS ET AUTHENTIFICATION
// ============================================

export type UserRole = 'admin' | 'secretariat' | 'preventionniste' | 'client' | 'exploitant';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  prenom: string;
  nom: string;
  telephone?: string;
  avatar_url?: string;
  societe_id?: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_push: boolean;
  langue: 'fr' | 'en';
  timezone: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ============================================
// ENTITÉS MÉTIER
// ============================================

export interface Site {
  id: string;
  nom: string;
  adresse_complete?: string;
  code_postal?: string;
  ville?: string;
  coordonnees_gps?: { lat: number; lng: number };
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Societe {
  id: string;
  raison_sociale: string;
  siret?: string;
  forme_juridique?: string;
  logo?: string;
  secteur_activite?: string;
  adresse_siege?: string;
  code_postal?: string;
  ville?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  est_exploitation: boolean;
  est_maintenance: boolean;
  est_proprietaire: boolean;
  est_syndic: boolean;
  est_prestataire: boolean;
  autre_type?: string;
  // Champs prestataires
  domaines_expertise?: string[];
  zones_intervention?: string[];
  note_moyenne?: number;
  nombre_interventions?: number;
  delai_moyen_jours?: number;
  tarifs_indicatifs?: Json;
  certifications?: string[];
  assurance_rc_pro?: string;
  date_expiration_assurance?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  civilite?: string;
  prenom: string;
  nom: string;
  fonction?: string;
  photo?: string;
  telephone_portable?: string;
  telephone_fixe?: string;
  email_professionnel?: string;
  email_personnel?: string;
  societe_id?: string;
  societe?: Societe;
  canal_prefere: 'email' | 'telephone' | 'sms' | 'whatsapp';
  langue: string;
  est_contact_urgence: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contrat {
  id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin?: string;
  duree_engagement_mois?: number;
  reconduction_tacite: boolean;
  type_signataire?: string;
  societe_id?: string;
  societe?: Societe;
  modele_contractuel: 'bailleur_unique' | 'exploitants_multiples';
  type_prestation: string[];
  periodicite_visites?: string;
  nombre_visites_annuelles?: number;
  prix_unitaire_visite?: number;
  prix_forfaitaire_annuel?: number;
  mode_facturation: 'forfaitaire' | 'unitaire' | 'mixte';
  date_reevaluation_tarifaire?: string;
  taux_reevaluation?: number;
  conditions_particulieres?: string;
  statut: 'brouillon' | 'actif' | 'suspendu' | 'termine' | 'resilie';
  created_at: string;
  updated_at: string;
}

// ============================================
// GROUPEMENTS ET ÉTABLISSEMENTS
// ============================================

export interface Groupement {
  id: string;
  nom: string;
  logo?: string;
  adresse_complete?: string;
  code_postal?: string;
  ville?: string;
  coordonnees_gps?: { lat: number; lng: number };
  site_id?: string;
  site?: Site;
  types_erp: string[];
  categorie_erp?: string;
  effectif_total_public: number;
  date_derniere_commission?: string;
  prochaine_commission?: string;
  periodicite_commission: number;
  avis_derniere_commission?: 'favorable' | 'defavorable' | 'avis_suspendu';
  contrat_id?: string;
  contrat?: Contrat;
  etablissements?: Etablissement[];
  parties_communes?: PartieCommune[];
  installations_techniques?: InstallationTechnique[];
  created_at: string;
  updated_at: string;
}

export interface Etablissement {
  id: string;
  nom_commercial: string;
  enseigne?: string;
  logo?: string;
  numero_dans_groupement?: string;
  groupement_id?: string;
  groupement?: Groupement;
  site_id?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  coordonnees_gps?: { lat: number; lng: number };
  types_erp: string[];
  categorie_erp?: string;
  effectif_public: number;
  surface_m2?: number;
  societe_exploitation_id?: string;
  societe_exploitation?: Societe;
  ge5_affiche: boolean;
  ge5_date_derniere_verification?: string;
  sogs_transmis: boolean;
  sogs_date_transmission?: string;
  date_derniere_commission?: string;
  prochaine_commission?: string;
  est_client_preveris: boolean;
  contrat_id?: string;
  contrat?: Contrat;
  contrat_via_groupement: boolean;
  batiments_occupes?: string[];
  contacts?: Contact[];
  installations_techniques?: InstallationTechnique[];
  created_at: string;
  updated_at: string;
}

export interface PartieCommune {
  id: string;
  groupement_id: string;
  groupement?: Groupement;
  nom: string;
  description?: string;
  type: 'circulation' | 'parking' | 'local_technique' | 'toiture' | 'facade' | 'autre';
  responsable_type: 'bailleur' | 'syndic' | 'copropriete';
  societe_responsable_id?: string;
  societe_responsable?: Societe;
  contact_responsable_id?: string;
  contact_responsable?: Contact;
  installations_techniques?: InstallationTechnique[];
  created_at: string;
  updated_at: string;
}

// ============================================
// INSTALLATIONS TECHNIQUES
// ============================================

export type TypeInstallation = 
  | 'electricite_erp'
  | 'electricite_code_travail'
  | 'electricite_mail_travail'
  | 'electricite_mail_erp'
  | 'gaz'
  | 'cuisson'
  | 'ramonage_hottes'
  | 'climatisation'
  | 'groupe_froid'
  | 'chauffage'
  | 'ascenseurs'
  | 'onduleur'
  | 'eclairage_securite'
  | 'desenfumage_naturel'
  | 'portes_coupe_feu'
  | 'portes_automatiques'
  | 'portes_souples'
  | 'extincteurs'
  | 'ria'
  | 'ssi'
  | 'extinction_auto_eau'
  | 'motopompe_sprinkler'
  | 'groupe_electrogene'
  | 'poteaux_incendie'
  | 'foudre'
  | 'defibrillateur';

export interface ReferentielInstallation {
  id: string;
  type: TypeInstallation;
  libelle: string;
  periodicite_mois: number;
  base_reglementaire: string;
  articles_references: string[];
  description?: string;
  competences_requises?: string[];
}

export interface InstallationTechnique {
  id: string;
  nom: string;
  type_installation: TypeInstallation;
  referentiel?: ReferentielInstallation;
  periodicite_reglementaire: string;
  base_reglementaire?: string;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  groupement?: Groupement;
  partie_commune_id?: string;
  partie_commune?: PartieCommune;
  societe_prestataire_id?: string;
  societe_prestataire?: Societe;
  contact_prestataire_id?: string;
  contact_prestataire?: Contact;
  date_mise_en_service?: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  localisation?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Calculés
  derniere_verification?: VerificationPeriodique;
  prochaine_verification?: string;
  statut_verification?: 'a_jour' | 'a_prevoir' | 'en_retard' | 'urgent';
  jours_avant_echeance?: number;
}

export interface VerificationPeriodique {
  id: string;
  installation_id: string;
  installation?: InstallationTechnique;
  date_verification: string;
  date_prochaine_verification: string;
  statut: 'conforme' | 'non_conforme' | 'avec_reserves' | 'en_attente';
  societe_prestataire_id?: string;
  societe_prestataire?: Societe;
  technicien_nom?: string;
  numero_rapport?: string;
  document_rapport?: string;
  synthese?: string;
  observations_count?: number;
  anomalies_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// VISITES ET OBSERVATIONS
// ============================================

export type TypeVisite = 'prevention' | 'commission' | 'suivi' | 'urgence' | 'audit';
export type StatutVisite = 'planifiee' | 'en_cours' | 'terminee' | 'annulee' | 'reportee';

export interface Visite {
  id: string;
  date_visite: string;
  heure_debut?: string;
  heure_fin?: string;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  groupement?: Groupement;
  type_visite: TypeVisite;
  statut: StatutVisite;
  preventionniste_id?: string;
  preventionniste?: User;
  contact_present_id?: string;
  contact_present?: Contact;
  rapport_pdf?: string;
  date_generation_rapport?: string;
  signature_representant?: string;
  signature_preventionniste?: string;
  observations?: Observation[];
  photos_count?: number;
  observations_count?: number;
  notes_internes?: string;
  checklist_materiel?: string[];
  coordonnees_arrivee?: { lat: number; lng: number };
  coordonnees_depart?: { lat: number; lng: number };
  duree_trajet_minutes?: number;
  created_at: string;
  updated_at: string;
}

export type TypeObservation = 'non_conformite' | 'remarque' | 'recommandation' | 'point_positif';
export type Criticite = 'critique' | 'majeure' | 'mineure' | 'observation';
export type StatutObservation = 'nouvelle' | 'en_cours' | 'planifiee' | 'resolue' | 'non_applicable';

export interface Observation {
  id: string;
  numero_observation: string;
  visite_id: string;
  visite?: Visite;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  description: string;
  description_reformulee?: string;
  photos: string[];
  type: TypeObservation;
  criticite: Criticite;
  localisation?: string;
  installation_concernee_id?: string;
  articles_reglementaires?: string[];
  type_intervenant_suggere?: 'interne' | 'prestataire' | 'bailleur';
  prestataire_recommande_id?: string;
  contact_recommande_id?: string;
  cout_estime_min?: number;
  cout_estime_max?: number;
  score_confiance_ia?: number;
  statut: StatutObservation;
  date_resolution?: string;
  commentaire_resolution?: string;
  preuve_resolution?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// COMMISSIONS DE SÉCURITÉ
// ============================================

export type TypeCommission = 'securite' | 'accessibilite' | 'mixte';
export type AvisCommission = 'favorable' | 'defavorable' | 'avis_suspendu';

export interface Commission {
  id: string;
  date: string;
  heure?: string;
  type: TypeCommission;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  groupement?: Groupement;
  objet: string;
  objet_details?: string;
  reference?: string;
  affaire?: string;
  lieu?: string;
  avis?: AvisCommission;
  pv_commission?: string;
  convocation?: string;
  dossier_presente?: string;
  rapport_preveris?: string;
  periodicite_mois: number;
  date_prochaine_commission?: string;
  participants?: ParticipantCommission[];
  prescriptions?: Prescription[];
  prescriptions_count?: number;
  prescriptions_levees_count?: number;
  notes_preparation?: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantCommission {
  id: string;
  commission_id: string;
  nom: string;
  fonction: string;
  organisme?: string;
  present: boolean;
}

// ============================================
// PRESCRIPTIONS
// ============================================

export type StatutPrescription = 
  | 'nouveau'
  | 'en_cours'
  | 'commande_envoyee'
  | 'planifie'
  | 'en_attente_validation'
  | 'leve'
  | 'valide'
  | 'annule'
  | 'non_applicable';

export type PrioritePrescription = 'urgent' | 'haute' | 'normale' | 'basse';
export type TypeIntervenant = 'interne' | 'prestataire' | 'bailleur';
export type TypeIntervention = 'technique' | 'structurel' | 'organisationnel' | 'documentaire';

export interface Prescription {
  id: string;
  numero_prescription: string;
  commission_id: string;
  commission?: Commission;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  groupement?: Groupement;
  cellule_reference?: string;
  description_complete: string;
  description_reformulee?: string;
  articles_reglementaires?: string[];
  delai_reglementaire_jours?: number;
  date_limite_conformite?: string;
  type_intervention: TypeIntervention;
  criticite: Criticite;
  priorite: PrioritePrescription;
  type_intervenant_suggere?: TypeIntervenant;
  score_confiance_ia?: number;
  prestataire_recommande_id?: string;
  prestataire_recommande?: Societe;
  raison_recommendation?: string;
  cout_estime_min?: number;
  cout_estime_max?: number;
  statut: StatutPrescription;
  date_realisation?: string;
  prestataire_effectif_id?: string;
  prestataire_effectif?: Societe;
  cout_reel?: number;
  rapport_travaux?: string;
  facture?: string;
  photos_avant?: string[];
  photos_apres?: string[];
  note_satisfaction_client?: number;
  responsable_suivi_id?: string;
  responsable_suivi?: User;
  notes_internes?: string;
  historique?: PrescriptionHistorique[];
  commandes?: CommandeIntervention[];
  created_at: string;
  updated_at: string;
  // Calculés
  jours_restants?: number;
  alerte_delai?: 'normal' | 'attention' | 'urgent' | 'retard';
}

export interface PrescriptionHistorique {
  id: string;
  prescription_id: string;
  action: string;
  statut_avant?: string;
  statut_apres?: string;
  commentaire?: string;
  auteur_id?: string;
  auteur?: User;
  created_at: string;
}

// ============================================
// COMMANDES D'INTERVENTION
// ============================================

export type StatutCommande = 
  | 'brouillon'
  | 'envoyee'
  | 'accusee'
  | 'planifiee'
  | 'en_cours'
  | 'terminee'
  | 'annulee'
  | 'bloquee';

export type CanalEnvoi = 'email' | 'sms' | 'whatsapp' | 'telephone' | 'courrier';

export interface CommandeIntervention {
  id: string;
  numero_commande: string;
  prescription_id?: string;
  prescription?: Prescription;
  observation_id?: string;
  observation?: Observation;
  type_intervention: TypeIntervention;
  description: string;
  prestataire_id: string;
  prestataire?: Societe;
  contact_prestataire_id?: string;
  contact_prestataire?: Contact;
  etablissement_id?: string;
  etablissement?: Etablissement;
  groupement_id?: string;
  date_souhaitee?: string;
  date_planifiee?: string;
  date_realisation?: string;
  urgence: boolean;
  canal_envoi: CanalEnvoi;
  message_envoye?: string;
  statut: StatutCommande;
  montant_devis?: number;
  montant_facture?: number;
  devis_document?: string;
  facture_document?: string;
  rapport_intervention?: string;
  note_qualite?: number;
  commentaire_qualite?: string;
  relances?: RelanceCommande[];
  created_at: string;
  updated_at: string;
}

export interface RelanceCommande {
  id: string;
  commande_id: string;
  date_relance: string;
  type_relance: 'automatique' | 'manuelle';
  canal: CanalEnvoi;
  message?: string;
  reponse_recue: boolean;
  date_reponse?: string;
}

// ============================================
// ALERTES ET NOTIFICATIONS
// ============================================

export type TypeAlerte = 
  | 'commission_proche'
  | 'prescription_echeance'
  | 'verification_retard'
  | 'verification_proche'
  | 'contrat_echeance'
  | 'ge5_perime'
  | 'commande_sans_reponse'
  | 'avis_defavorable';

export type NiveauAlerte = 'info' | 'attention' | 'urgent' | 'critique';

export interface Alerte {
  id: string;
  type: TypeAlerte;
  niveau: NiveauAlerte;
  titre: string;
  description: string;
  entite_type: 'etablissement' | 'groupement' | 'prescription' | 'commission' | 'installation' | 'commande';
  entite_id: string;
  date_echeance?: string;
  jours_restants?: number;
  destinataires_ids?: string[];
  lue: boolean;
  date_lecture?: string;
  actionnee: boolean;
  date_action?: string;
  action_effectuee?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  alerte_id?: string;
  alerte?: Alerte;
  type: 'alerte' | 'info' | 'succes' | 'erreur';
  titre: string;
  message: string;
  lien?: string;
  lue: boolean;
  date_lecture?: string;
  canal_envoye?: CanalEnvoi[];
  created_at: string;
}

// ============================================
// DOCUMENTS
// ============================================

export type TypeDocument = 
  | 'pv_commission'
  | 'convocation'
  | 'rapport_visite'
  | 'rapport_verification'
  | 'devis'
  | 'facture'
  | 'photo'
  | 'plan'
  | 'attestation'
  | 'contrat'
  | 'autre';

export interface Document {
  id: string;
  nom: string;
  type: TypeDocument;
  mime_type: string;
  taille_octets: number;
  url: string;
  storage_path: string;
  entite_type: string;
  entite_id: string;
  uploaded_by_id?: string;
  uploaded_by?: User;
  metadata?: Json;
  created_at: string;
}

// ============================================
// TEMPLATES DE MESSAGES
// ============================================

export interface TemplateMessage {
  id: string;
  nom: string;
  type: 'commande_prestataire' | 'commande_bailleur' | 'relance' | 'notification_client' | 'rapport';
  canal: CanalEnvoi;
  sujet?: string;
  contenu: string;
  variables: string[];
  actif: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ANALYTICS ET RAPPORTS
// ============================================

export interface StatistiquesDashboard {
  visites_mois: number;
  visites_progression: number;
  prescriptions_urgentes: number;
  prescriptions_en_cours: number;
  prescriptions_levees_mois: number;
  verifications_retard: number;
  verifications_a_prevoir: number;
  commissions_a_preparer: number;
  taux_conformite: number;
  delai_moyen_resolution: number;
}

export interface StatistiquesPrestataire {
  prestataire_id: string;
  prestataire?: Societe;
  nombre_interventions: number;
  note_moyenne: number;
  delai_moyen_reponse_heures: number;
  delai_moyen_intervention_jours: number;
  taux_respect_delais: number;
  montant_total_facture: number;
}

// ============================================
// FORMULAIRES ET VALIDATION
// ============================================

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// FILTRES ET RECHERCHE
// ============================================

export interface FiltresPrescriptions {
  statut?: StatutPrescription[];
  priorite?: PrioritePrescription[];
  criticite?: Criticite[];
  groupement_id?: string;
  etablissement_id?: string;
  commission_id?: string;
  date_debut?: string;
  date_fin?: string;
  en_retard?: boolean;
  recherche?: string;
}

export interface FiltresEtablissements {
  groupement_id?: string;
  ville?: string;
  types_erp?: string[];
  categorie_erp?: string;
  est_client_preveris?: boolean;
  ge5_affiche?: boolean;
  sogs_transmis?: boolean;
  recherche?: string;
}

export interface FiltresCommissions {
  type?: TypeCommission[];
  avis?: AvisCommission[];
  groupement_id?: string;
  etablissement_id?: string;
  date_debut?: string;
  date_fin?: string;
  a_preparer?: boolean;
  recherche?: string;
}
