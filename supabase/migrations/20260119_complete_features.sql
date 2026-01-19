-- ============================================
-- PREV'HUB - Migration Complète v2.0
-- Toutes les fonctionnalités du CDC
-- ============================================

-- ============================================
-- 1. TABLE UTILISATEURS ET RÔLES
-- ============================================

-- Enum pour les rôles utilisateurs
CREATE TYPE user_role AS ENUM ('admin', 'secretariat', 'preventionniste', 'client', 'exploitant');

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  telephone TEXT,
  avatar_url TEXT,
  societe_id UUID REFERENCES public.societes(id),
  preferences JSONB DEFAULT '{"theme": "light", "notifications_email": true, "notifications_sms": false, "notifications_push": true, "langue": "fr", "timezone": "Europe/Paris"}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les profils
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_societe ON public.profiles(societe_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================
-- 2. EXTENSION TABLE SOCIETES (PRESTATAIRES)
-- ============================================

ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS est_prestataire BOOLEAN DEFAULT false;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS domaines_expertise TEXT[];
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS zones_intervention TEXT[];
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS note_moyenne DECIMAL(3,2);
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS nombre_interventions INTEGER DEFAULT 0;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS delai_moyen_jours DECIMAL(5,2);
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS tarifs_indicatifs JSONB;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS assurance_rc_pro TEXT;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS date_expiration_assurance DATE;
ALTER TABLE public.societes ADD COLUMN IF NOT EXISTS coordonnees_gps JSONB;

-- Index prestataires
CREATE INDEX idx_societes_prestataire ON public.societes(est_prestataire) WHERE est_prestataire = true;
CREATE INDEX idx_societes_note ON public.societes(note_moyenne DESC) WHERE est_prestataire = true;

-- ============================================
-- 3. PARTIES COMMUNES
-- ============================================

CREATE TYPE type_partie_commune AS ENUM ('circulation', 'parking', 'local_technique', 'toiture', 'facade', 'autre');
CREATE TYPE responsable_type AS ENUM ('bailleur', 'syndic', 'copropriete');

CREATE TABLE IF NOT EXISTS public.parties_communes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupement_id UUID NOT NULL REFERENCES public.groupements(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  type type_partie_commune NOT NULL DEFAULT 'autre',
  responsable_type responsable_type NOT NULL DEFAULT 'bailleur',
  societe_responsable_id UUID REFERENCES public.societes(id),
  contact_responsable_id UUID REFERENCES public.contacts(id),
  localisation TEXT,
  surface_m2 DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_communes_groupement ON public.parties_communes(groupement_id);

-- ============================================
-- 4. RÉFÉRENTIEL INSTALLATIONS TECHNIQUES
-- ============================================

CREATE TYPE type_installation AS ENUM (
  'electricite_erp', 'electricite_code_travail', 'electricite_mail_travail', 'electricite_mail_erp',
  'gaz', 'cuisson', 'ramonage_hottes', 'climatisation', 'groupe_froid', 'chauffage',
  'ascenseurs', 'onduleur', 'eclairage_securite', 'desenfumage_naturel',
  'portes_coupe_feu', 'portes_automatiques', 'portes_souples',
  'extincteurs', 'ria', 'ssi', 'extinction_auto_eau', 'motopompe_sprinkler',
  'groupe_electrogene', 'poteaux_incendie', 'foudre', 'defibrillateur'
);

CREATE TABLE IF NOT EXISTS public.referentiel_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type type_installation UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  periodicite_mois INTEGER NOT NULL,
  base_reglementaire TEXT NOT NULL,
  articles_references TEXT[],
  description TEXT,
  competences_requises TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion du référentiel des 25+ types d'installations
INSERT INTO public.referentiel_installations (type, libelle, periodicite_mois, base_reglementaire, articles_references) VALUES
  ('electricite_erp', 'Installations électriques (ERP)', 12, 'Arrêté du 25 juin 1980', ARRAY['EL 18', 'EL 19']),
  ('electricite_code_travail', 'Installations électriques (Code du travail)', 12, 'Code du travail', ARRAY['R4226-14']),
  ('electricite_mail_travail', 'Installations électriques Mail (Code du travail)', 12, 'Code du travail', ARRAY['R4226-14']),
  ('electricite_mail_erp', 'Installations électriques Mail (ERP)', 12, 'Arrêté du 25 juin 1980', ARRAY['EL 18']),
  ('gaz', 'Installations de gaz', 12, 'Arrêté du 25 juin 1980', ARRAY['GZ 29', 'GZ 30']),
  ('cuisson', 'Installations de cuisson', 12, 'Arrêté du 25 juin 1980', ARRAY['GC 22']),
  ('ramonage_hottes', 'Ramonage hottes d''extraction', 12, 'Arrêté du 25 juin 1980', ARRAY['GC 18']),
  ('climatisation', 'Climatisation', 12, 'Code de l''environnement', ARRAY['R543-75']),
  ('groupe_froid', 'Groupe Froid', 12, 'Code de l''environnement', ARRAY['R543-75']),
  ('chauffage', 'Chauffage', 12, 'Arrêté du 25 juin 1980', ARRAY['CH 57', 'CH 58']),
  ('ascenseurs', 'Ascenseurs', 6, 'Code de la construction', ARRAY['R125-2-1']),
  ('onduleur', 'Onduleur', 12, 'Arrêté du 25 juin 1980', ARRAY['EL 18']),
  ('eclairage_securite', 'Eclairage de sécurité', 12, 'Arrêté du 25 juin 1980', ARRAY['EC 14', 'EC 15']),
  ('desenfumage_naturel', 'Désenfumage naturel', 12, 'Arrêté du 25 juin 1980', ARRAY['DF 9', 'DF 10']),
  ('portes_coupe_feu', 'Portes Coupe-Feu', 12, 'Arrêté du 25 juin 1980', ARRAY['CO 47']),
  ('portes_automatiques', 'Portes automatiques', 6, 'Arrêté du 21 décembre 1993', ARRAY['Art. 5']),
  ('portes_souples', 'Portes souples/sectionnelles', 12, 'Code du travail', ARRAY['R4224-12']),
  ('extincteurs', 'Extincteurs', 12, 'Arrêté du 25 juin 1980', ARRAY['MS 38', 'MS 39']),
  ('ria', 'RIA (Robinets Incendie Armés)', 12, 'Arrêté du 25 juin 1980', ARRAY['MS 15', 'MS 16']),
  ('ssi', 'SSI (Système Sécurité Incendie)', 12, 'Arrêté du 25 juin 1980', ARRAY['MS 56', 'MS 58']),
  ('extinction_auto_eau', 'Extinction automatique à eau', 12, 'Arrêté du 25 juin 1980', ARRAY['MS 25', 'MS 30']),
  ('motopompe_sprinkler', 'Groupe motopompe sprinkler', 1, 'APSAD R1', ARRAY['Chapitre 8']),
  ('groupe_electrogene', 'Groupe électrogène', 12, 'Arrêté du 25 juin 1980', ARRAY['EL 18']),
  ('poteaux_incendie', 'Poteaux Incendie', 24, 'Arrêté du 25 juin 1980', ARRAY['MS 5']),
  ('foudre', 'Protection foudre', 12, 'NF C 17-102', ARRAY['Art. 10']),
  ('defibrillateur', 'Défibrillateur Accueil', 12, 'Décret 2018-1186', ARRAY['Art. 1'])
ON CONFLICT (type) DO NOTHING;

-- Extension table installations_techniques
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS type_installation type_installation;
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS partie_commune_id UUID REFERENCES public.parties_communes(id);
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS marque TEXT;
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS modele TEXT;
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS numero_serie TEXT;
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS date_mise_en_service DATE;
ALTER TABLE public.installations_techniques ADD COLUMN IF NOT EXISTS localisation TEXT;

CREATE INDEX idx_installations_type ON public.installations_techniques(type_installation);
CREATE INDEX idx_installations_partie_commune ON public.installations_techniques(partie_commune_id);

-- ============================================
-- 5. EXTENSION VISITES
-- ============================================

CREATE TYPE type_visite AS ENUM ('prevention', 'commission', 'suivi', 'urgence', 'audit');
CREATE TYPE statut_visite AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee', 'reportee');

ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS type_visite type_visite DEFAULT 'prevention';
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS statut statut_visite DEFAULT 'planifiee';
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS preventionniste_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS heure_debut TIME;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS heure_fin TIME;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS contact_present_id UUID REFERENCES public.contacts(id);
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS signature_representant TEXT;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS signature_preventionniste TEXT;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS notes_internes TEXT;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS checklist_materiel TEXT[];
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS coordonnees_arrivee JSONB;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS coordonnees_depart JSONB;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS duree_trajet_minutes INTEGER;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
ALTER TABLE public.visites ADD COLUMN IF NOT EXISTS offline_id TEXT;

CREATE INDEX idx_visites_preventionniste ON public.visites(preventionniste_id);
CREATE INDEX idx_visites_statut ON public.visites(statut);
CREATE INDEX idx_visites_date ON public.visites(date_visite);

-- ============================================
-- 6. EXTENSION OBSERVATIONS
-- ============================================

CREATE TYPE type_observation AS ENUM ('non_conformite', 'remarque', 'recommandation', 'point_positif');
CREATE TYPE criticite AS ENUM ('critique', 'majeure', 'mineure', 'observation');
CREATE TYPE statut_observation AS ENUM ('nouvelle', 'en_cours', 'planifiee', 'resolue', 'non_applicable');
CREATE TYPE type_intervenant AS ENUM ('interne', 'prestataire', 'bailleur');

ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS numero_observation TEXT;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS type type_observation DEFAULT 'remarque';
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS criticite criticite DEFAULT 'mineure';
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS statut statut_observation DEFAULT 'nouvelle';
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS localisation TEXT;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS description_reformulee TEXT;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS articles_reglementaires TEXT[];
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS type_intervenant_suggere type_intervenant;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS prestataire_recommande_id UUID REFERENCES public.societes(id);
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS cout_estime_min DECIMAL(10,2);
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS cout_estime_max DECIMAL(10,2);
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS score_confiance_ia DECIMAL(5,2);
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS date_resolution DATE;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS commentaire_resolution TEXT;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS preuve_resolution TEXT;
ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS installation_concernee_id UUID REFERENCES public.installations_techniques(id);

CREATE INDEX idx_observations_statut ON public.observations(statut);
CREATE INDEX idx_observations_criticite ON public.observations(criticite);

-- ============================================
-- 7. EXTENSION PRESCRIPTIONS
-- ============================================

CREATE TYPE statut_prescription AS ENUM (
  'nouveau', 'en_cours', 'commande_envoyee', 'planifie', 
  'en_attente_validation', 'leve', 'valide', 'annule', 'non_applicable'
);
CREATE TYPE priorite_prescription AS ENUM ('urgent', 'haute', 'normale', 'basse');
CREATE TYPE type_intervention AS ENUM ('technique', 'structurel', 'organisationnel', 'documentaire');

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS numero_prescription TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS description_reformulee TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS type_intervention type_intervention DEFAULT 'technique';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS criticite criticite DEFAULT 'majeure';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS priorite priorite_prescription DEFAULT 'normale';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS type_intervenant_suggere type_intervenant;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS score_confiance_ia DECIMAL(5,2);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS prestataire_recommande_id UUID REFERENCES public.societes(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS raison_recommendation TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS cout_estime_min DECIMAL(10,2);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS cout_estime_max DECIMAL(10,2);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS prestataire_effectif_id UUID REFERENCES public.societes(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS cout_reel DECIMAL(10,2);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS rapport_travaux TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS facture TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS photos_avant TEXT[];
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS photos_apres TEXT[];
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS note_satisfaction_client INTEGER CHECK (note_satisfaction_client BETWEEN 1 AND 5);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS responsable_suivi_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS notes_internes TEXT;

CREATE INDEX idx_prescriptions_statut ON public.prescriptions(statut);
CREATE INDEX idx_prescriptions_priorite ON public.prescriptions(priorite);
CREATE INDEX idx_prescriptions_echeance ON public.prescriptions(date_limite_conformite);

-- ============================================
-- 8. TABLE COMMANDES D'INTERVENTION
-- ============================================

CREATE TYPE statut_commande AS ENUM (
  'brouillon', 'envoyee', 'accusee', 'planifiee', 
  'en_cours', 'terminee', 'annulee', 'bloquee'
);
CREATE TYPE canal_envoi AS ENUM ('email', 'sms', 'whatsapp', 'telephone', 'courrier');

CREATE TABLE IF NOT EXISTS public.commandes_intervention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_commande TEXT NOT NULL UNIQUE,
  prescription_id UUID REFERENCES public.prescriptions(id),
  observation_id UUID REFERENCES public.observations(id),
  type_intervention type_intervention NOT NULL DEFAULT 'technique',
  description TEXT NOT NULL,
  prestataire_id UUID NOT NULL REFERENCES public.societes(id),
  contact_prestataire_id UUID REFERENCES public.contacts(id),
  etablissement_id UUID REFERENCES public.etablissements(id),
  groupement_id UUID REFERENCES public.groupements(id),
  date_souhaitee DATE,
  date_planifiee DATE,
  date_realisation DATE,
  urgence BOOLEAN DEFAULT false,
  canal_envoi canal_envoi DEFAULT 'email',
  message_envoye TEXT,
  statut statut_commande DEFAULT 'brouillon',
  montant_devis DECIMAL(10,2),
  montant_facture DECIMAL(10,2),
  devis_document TEXT,
  facture_document TEXT,
  rapport_intervention TEXT,
  note_qualite INTEGER CHECK (note_qualite BETWEEN 1 AND 5),
  commentaire_qualite TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commandes_prestataire ON public.commandes_intervention(prestataire_id);
CREATE INDEX idx_commandes_statut ON public.commandes_intervention(statut);
CREATE INDEX idx_commandes_prescription ON public.commandes_intervention(prescription_id);

-- Séquence pour numéros de commande
CREATE SEQUENCE IF NOT EXISTS commande_numero_seq START 1000;

-- ============================================
-- 9. TABLE RELANCES COMMANDES
-- ============================================

CREATE TABLE IF NOT EXISTS public.relances_commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID NOT NULL REFERENCES public.commandes_intervention(id) ON DELETE CASCADE,
  date_relance TIMESTAMPTZ DEFAULT NOW(),
  type_relance TEXT DEFAULT 'automatique',
  canal canal_envoi NOT NULL,
  message TEXT,
  reponse_recue BOOLEAN DEFAULT false,
  date_reponse TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_relances_commande ON public.relances_commandes(commande_id);

-- ============================================
-- 10. TABLE HISTORIQUE PRESCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.prescriptions_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  statut_avant TEXT,
  statut_apres TEXT,
  commentaire TEXT,
  auteur_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historique_prescription ON public.prescriptions_historique(prescription_id);

-- ============================================
-- 11. TABLE ALERTES
-- ============================================

CREATE TYPE type_alerte AS ENUM (
  'commission_proche', 'prescription_echeance', 'verification_retard',
  'verification_proche', 'contrat_echeance', 'ge5_perime',
  'commande_sans_reponse', 'avis_defavorable'
);
CREATE TYPE niveau_alerte AS ENUM ('info', 'attention', 'urgent', 'critique');

CREATE TABLE IF NOT EXISTS public.alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type type_alerte NOT NULL,
  niveau niveau_alerte DEFAULT 'info',
  titre TEXT NOT NULL,
  description TEXT,
  entite_type TEXT NOT NULL,
  entite_id UUID NOT NULL,
  date_echeance DATE,
  jours_restants INTEGER,
  destinataires_ids UUID[],
  lue BOOLEAN DEFAULT false,
  date_lecture TIMESTAMPTZ,
  actionnee BOOLEAN DEFAULT false,
  date_action TIMESTAMPTZ,
  action_effectuee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alertes_type ON public.alertes(type);
CREATE INDEX idx_alertes_niveau ON public.alertes(niveau);
CREATE INDEX idx_alertes_lue ON public.alertes(lue);
CREATE INDEX idx_alertes_entite ON public.alertes(entite_type, entite_id);

-- ============================================
-- 12. TABLE NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alerte_id UUID REFERENCES public.alertes(id),
  type TEXT DEFAULT 'info',
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  lien TEXT,
  lue BOOLEAN DEFAULT false,
  date_lecture TIMESTAMPTZ,
  canaux_envoyes canal_envoi[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_lue ON public.notifications(lue);

-- ============================================
-- 13. TABLE DOCUMENTS
-- ============================================

CREATE TYPE type_document AS ENUM (
  'pv_commission', 'convocation', 'rapport_visite', 'rapport_verification',
  'devis', 'facture', 'photo', 'plan', 'attestation', 'contrat', 'autre'
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type type_document DEFAULT 'autre',
  mime_type TEXT,
  taille_octets BIGINT,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  entite_type TEXT NOT NULL,
  entite_id UUID NOT NULL,
  uploaded_by_id UUID REFERENCES public.profiles(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_entite ON public.documents(entite_type, entite_id);
CREATE INDEX idx_documents_type ON public.documents(type);

-- ============================================
-- 14. TABLE TEMPLATES MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS public.templates_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  canal canal_envoi DEFAULT 'email',
  sujet TEXT,
  contenu TEXT NOT NULL,
  variables TEXT[],
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates par défaut
INSERT INTO public.templates_messages (nom, type, canal, sujet, contenu, variables) VALUES
(
  'Commande intervention prestataire',
  'commande_prestataire',
  'email',
  '[AUTO] Commande intervention - {{etablissement}} - {{type_intervention}}',
  'Bonjour {{prenom_contact}},

Suite à notre visite de prévention du {{date_visite}}, nous vous commandons l''intervention suivante :

🔧 INTERVENTION DEMANDÉE :
- Nature : {{description}}
- Localisation : {{localisation}}
- Échéance réglementaire : {{date_echeance}}
- Niveau priorité : {{priorite}}

🏢 ÉTABLISSEMENT :
- {{nom_etablissement}}
- {{adresse_etablissement}}
- Contact sur place : {{contact_exploitant}} ({{telephone_exploitant}})

📋 INFORMATIONS COMPLÉMENTAIRES :
{{contexte_historique}}

Merci de nous confirmer :
- Vos disponibilités sous 48h
- Délai d''intervention envisagé
- Devis si montant > {{seuil_devis}}€

Rapport de visite disponible : {{lien_rapport}}

Cordialement,
{{signature_preventionniste}}
{{coordonnees_preveris}}

---
Ce message a été généré automatiquement par Prev''Hub
Référence : {{id_commande}}',
  ARRAY['prenom_contact', 'date_visite', 'description', 'localisation', 'date_echeance', 'priorite', 'nom_etablissement', 'adresse_etablissement', 'contact_exploitant', 'telephone_exploitant', 'contexte_historique', 'seuil_devis', 'lien_rapport', 'signature_preventionniste', 'coordonnees_preveris', 'id_commande']
),
(
  'Commande travaux bailleur',
  'commande_bailleur',
  'email',
  '[URGENT] Mise en conformité sécurité - {{etablissement}}',
  'Madame, Monsieur,

En ma qualité de bureau de contrôle missionné pour {{etablissement}}, je vous informe d''une non-conformité relevant de votre responsabilité :

⚠️ NON-CONFORMITÉ IDENTIFIÉE :
- Nature : {{description}}
- Impact sécurité : {{niveau_risque}} (évacuation compromise)
- Base réglementaire : {{reference_code}}
- Échéance mise en conformité : {{date_imperative}}

🏗️ TRAVAUX À PRÉVOIR :
{{description_travaux}}
Budget estimé : {{fourchette_budget}}

📎 DOCUMENTS JOINTS :
- Rapport de visite complet
- Photos de la non-conformité
- Extraits réglementaires applicables

Une réponse rapide est nécessaire pour respecter les délais réglementaires.
Nous restons à votre disposition pour tout complément d''information.

Cordialement,
{{signature_preventionniste}}',
  ARRAY['etablissement', 'description', 'niveau_risque', 'reference_code', 'date_imperative', 'description_travaux', 'fourchette_budget', 'signature_preventionniste']
),
(
  'Relance commande J+2',
  'relance',
  'email',
  'Relance : Commande intervention {{numero_commande}}',
  'Bonjour {{prenom_contact}},

Nous n''avons pas reçu d''accusé de réception pour notre commande du {{date_commande}}.

📋 Rappel de l''intervention :
- {{description}}
- Établissement : {{etablissement}}
- Échéance : {{date_echeance}}

Merci de nous confirmer la prise en compte de cette demande.

Cordialement,
L''équipe PRÉVÉRIS',
  ARRAY['prenom_contact', 'numero_commande', 'date_commande', 'description', 'etablissement', 'date_echeance']
),
(
  'Notification client - Nouvelle prescription',
  'notification_client',
  'email',
  'Nouvelle prescription - {{etablissement}}',
  'Bonjour,

Suite à la commission de sécurité du {{date_commission}}, une nouvelle prescription a été émise pour votre établissement {{etablissement}} :

📋 PRESCRIPTION :
{{description}}

⏰ Échéance : {{date_echeance}}
🎯 Priorité : {{priorite}}

Connectez-vous à votre espace client pour voir le détail et suivre l''avancement :
{{lien_portail}}

Cordialement,
L''équipe PRÉVÉRIS',
  ARRAY['date_commission', 'etablissement', 'description', 'date_echeance', 'priorite', 'lien_portail']
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. TABLE PLANNING VISITES
-- ============================================

CREATE TABLE IF NOT EXISTS public.planning_visites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preventionniste_id UUID NOT NULL REFERENCES public.profiles(id),
  date_planning DATE NOT NULL,
  visites_ids UUID[],
  ordre_visites INTEGER[],
  distance_totale_km DECIMAL(10,2),
  duree_totale_minutes INTEGER,
  optimise BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(preventionniste_id, date_planning)
);

-- ============================================
-- 16. EXTENSION CONTRATS
-- ============================================

ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS modele_contractuel TEXT DEFAULT 'bailleur_unique';
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS type_prestation TEXT[];
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS periodicite_visites TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS nombre_visites_annuelles INTEGER;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS prix_unitaire_visite DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS prix_forfaitaire_annuel DECIMAL(10,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS mode_facturation TEXT DEFAULT 'forfaitaire';
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS date_reevaluation_tarifaire DATE;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS taux_reevaluation DECIMAL(5,2);
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS conditions_particulieres TEXT;
ALTER TABLE public.contrats ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif';

-- ============================================
-- 17. FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour générer un numéro de commande
CREATE OR REPLACE FUNCTION generate_commande_numero()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('commande_numero_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de prescription
CREATE OR REPLACE FUNCTION generate_prescription_numero(commission_id UUID)
RETURNS TEXT AS $$
DECLARE
  commission_date DATE;
  count_existing INTEGER;
BEGIN
  SELECT date INTO commission_date FROM commissions WHERE id = commission_id;
  SELECT COUNT(*) + 1 INTO count_existing FROM prescriptions WHERE prescriptions.commission_id = generate_prescription_numero.commission_id;
  RETURN 'P-' || TO_CHAR(commission_date, 'YYYY-MM') || '-' || LPAD(count_existing::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le statut d'alerte d'une prescription
CREATE OR REPLACE FUNCTION calcul_alerte_prescription(date_limite DATE)
RETURNS TEXT AS $$
DECLARE
  jours_restants INTEGER;
BEGIN
  jours_restants := date_limite - CURRENT_DATE;
  IF jours_restants < 0 THEN RETURN 'retard';
  ELSIF jours_restants <= 7 THEN RETURN 'urgent';
  ELSIF jours_restants <= 30 THEN RETURN 'attention';
  ELSE RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le statut de vérification d'une installation
CREATE OR REPLACE FUNCTION calcul_statut_verification(date_prochaine DATE)
RETURNS TEXT AS $$
DECLARE
  jours_restants INTEGER;
BEGIN
  IF date_prochaine IS NULL THEN RETURN 'urgent'; END IF;
  jours_restants := date_prochaine - CURRENT_DATE;
  IF jours_restants < 0 THEN RETURN 'en_retard';
  ELSIF jours_restants <= 30 THEN RETURN 'urgent';
  ELSIF jours_restants <= 60 THEN RETURN 'a_prevoir';
  ELSE RETURN 'a_jour';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 18. VUES UTILES
-- ============================================

-- Vue des prescriptions avec alertes
CREATE OR REPLACE VIEW v_prescriptions_alertes AS
SELECT 
  p.*,
  c.date as commission_date,
  c.avis as commission_avis,
  e.nom_commercial as etablissement_nom,
  g.nom as groupement_nom,
  (p.date_limite_conformite - CURRENT_DATE) as jours_restants,
  calcul_alerte_prescription(p.date_limite_conformite) as niveau_alerte
FROM prescriptions p
LEFT JOIN commissions c ON p.commission_id = c.id
LEFT JOIN etablissements e ON p.etablissement_id = e.id
LEFT JOIN groupements g ON p.groupement_id = g.id
WHERE p.statut NOT IN ('leve', 'valide', 'annule', 'non_applicable');

-- Vue des vérifications avec alertes
CREATE OR REPLACE VIEW v_verifications_alertes AS
SELECT 
  v.*,
  i.nom as installation_nom,
  i.type_installation,
  e.nom_commercial as etablissement_nom,
  g.nom as groupement_nom,
  (v.date_prochaine_verification - CURRENT_DATE) as jours_restants,
  calcul_statut_verification(v.date_prochaine_verification) as statut_alerte
FROM verifications_periodiques v
JOIN installations_techniques i ON v.installation_id = i.id
LEFT JOIN etablissements e ON i.etablissement_id = e.id
LEFT JOIN groupements g ON i.groupement_id = g.id;

-- Vue des commissions à préparer
CREATE OR REPLACE VIEW v_commissions_a_preparer AS
SELECT 
  c.*,
  g.nom as groupement_nom,
  e.nom_commercial as etablissement_nom,
  (c.date - CURRENT_DATE) as jours_avant,
  CASE 
    WHEN (c.date - CURRENT_DATE) <= 15 THEN 'urgent'
    WHEN (c.date - CURRENT_DATE) <= 30 THEN 'attention'
    WHEN (c.date - CURRENT_DATE) <= 45 THEN 'a_preparer'
    ELSE 'planifie'
  END as niveau_preparation
FROM commissions c
LEFT JOIN groupements g ON c.groupement_id = g.id
LEFT JOIN etablissements e ON c.etablissement_id = e.id
WHERE c.date >= CURRENT_DATE
ORDER BY c.date;

-- Vue dashboard KPIs
CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM visites WHERE date_visite >= DATE_TRUNC('month', CURRENT_DATE)) as visites_mois,
  (SELECT COUNT(*) FROM prescriptions WHERE statut = 'nouveau' OR (statut IN ('en_cours', 'commande_envoyee') AND priorite = 'urgent')) as prescriptions_urgentes,
  (SELECT COUNT(*) FROM prescriptions WHERE statut IN ('en_cours', 'commande_envoyee', 'planifie')) as prescriptions_en_cours,
  (SELECT COUNT(*) FROM prescriptions WHERE statut = 'leve' AND date_realisation >= DATE_TRUNC('month', CURRENT_DATE)) as prescriptions_levees_mois,
  (SELECT COUNT(*) FROM v_verifications_alertes WHERE statut_alerte = 'en_retard') as verifications_retard,
  (SELECT COUNT(*) FROM v_verifications_alertes WHERE statut_alerte IN ('urgent', 'a_prevoir')) as verifications_a_prevoir,
  (SELECT COUNT(*) FROM v_commissions_a_preparer WHERE niveau_preparation IN ('urgent', 'attention', 'a_preparer')) as commissions_a_preparer;

-- ============================================
-- 19. RLS POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes_intervention ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy pour les profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy admin a accès total
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy pour les notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Policy pour les alertes (selon rôle)
CREATE POLICY "Staff can view all alertes" ON public.alertes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'secretariat', 'preventionniste'))
  );

-- Policy clients voient leurs établissements
CREATE POLICY "Clients view own etablissements" ON public.etablissements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND (
        p.role IN ('admin', 'secretariat', 'preventionniste')
        OR (p.role = 'client' AND p.societe_id = etablissements.societe_exploitation_id)
      )
    )
  );

-- ============================================
-- 20. TRIGGERS
-- ============================================

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at BEFORE UPDATE ON public.commandes_intervention
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_updated_at BEFORE UPDATE ON public.planning_visites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer profile après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, prenom, nom, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nouveau'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger pour historiser les changements de prescription
CREATE OR REPLACE FUNCTION log_prescription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut THEN
    INSERT INTO public.prescriptions_historique (prescription_id, action, statut_avant, statut_apres, auteur_id)
    VALUES (NEW.id, 'changement_statut', OLD.statut::TEXT, NEW.statut::TEXT, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prescription_history_trigger
  AFTER UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION log_prescription_change();

-- Trigger pour générer numéro commande
CREATE OR REPLACE FUNCTION set_commande_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_commande IS NULL THEN
    NEW.numero_commande := generate_commande_numero();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commande_numero_trigger
  BEFORE INSERT ON public.commandes_intervention
  FOR EACH ROW EXECUTE FUNCTION set_commande_numero();

-- ============================================
-- 21. STORAGE BUCKETS
-- ============================================

-- Ces commandes doivent être exécutées via l'interface Supabase ou l'API
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('documents', 'documents', false),
--   ('photos', 'photos', false),
--   ('rapports', 'rapports', false),
--   ('avatars', 'avatars', true);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs liés à auth.users';
COMMENT ON TABLE public.parties_communes IS 'Parties communes des groupements (responsabilité bailleur)';
COMMENT ON TABLE public.referentiel_installations IS 'Référentiel des 25+ types d''installations avec périodicités';
COMMENT ON TABLE public.commandes_intervention IS 'Commandes d''intervention vers prestataires';
COMMENT ON TABLE public.alertes IS 'Alertes système pour échéances et anomalies';
COMMENT ON TABLE public.templates_messages IS 'Templates de messages personnalisables';
