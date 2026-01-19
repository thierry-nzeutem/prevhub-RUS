/*
  # Prev'Hub - Tables de vérifications et prescriptions
  
  ## Tables créées
  
  1. **installations_techniques** - Équipements à vérifier
     - id, nom, type, périodicité réglementaire
     - Lien avec établissement ou groupement
  
  2. **verifications_periodiques** - Contrôles réglementaires
     - id, date vérification, prochaine échéance (calculée)
     - Statut automatique (conforme/échéance proche/non conforme)
  
  3. **visites** - Visites de prévention Prévéris
     - id, date, type, statut, préventionniste
  
  4. **observations** - Remarques lors des visites
     - id, description, criticité, attribution IA
  
  5. **commissions_securite** - Passages commission SDIS
     - id, date, type, avis, périodicité
  
  6. **prescriptions_commission** - Points à lever suite commission
     - id, description, délai, attribution IA, workflow
  
  ## Calculs automatiques
  - Prochaine vérification = date + périodicité
  - Statut selon échéance (>60j = conforme, <60j = proche, <0j = non conforme)
  - Prochaine commission = date + périodicité (3 ou 5 ans)
*/

-- Installations Techniques
CREATE TABLE IF NOT EXISTS installations_techniques (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type_installation text NOT NULL,
  periodicite_reglementaire text NOT NULL,
  base_reglementaire text,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  societe_prestataire_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  contact_prestataire_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_one_parent CHECK (
    (etablissement_id IS NOT NULL AND groupement_id IS NULL) OR
    (etablissement_id IS NULL AND groupement_id IS NOT NULL)
  )
);

ALTER TABLE installations_techniques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read installations_techniques"
  ON installations_techniques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert installations_techniques"
  ON installations_techniques FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update installations_techniques"
  ON installations_techniques FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Vérifications Périodiques
CREATE TABLE IF NOT EXISTS verifications_periodiques (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  installation_id uuid REFERENCES installations_techniques(id) ON DELETE CASCADE NOT NULL,
  date_verification date NOT NULL,
  date_prochaine_verification date NOT NULL,
  statut text DEFAULT 'conforme',
  societe_prestataire_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  numero_rapport text,
  document_rapport text,
  synthese text,
  capture_ecran_analysee text,
  date_extraite_par_ocr date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE verifications_periodiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read verifications_periodiques"
  ON verifications_periodiques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert verifications_periodiques"
  ON verifications_periodiques FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update verifications_periodiques"
  ON verifications_periodiques FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Visites
CREATE TABLE IF NOT EXISTS visites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_visite timestamptz NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  type_visite text NOT NULL,
  statut text DEFAULT 'planifiee',
  rapport_pdf text,
  date_generation_rapport timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_one_parent_visite CHECK (
    (etablissement_id IS NOT NULL AND groupement_id IS NULL) OR
    (etablissement_id IS NULL AND groupement_id IS NOT NULL)
  )
);

ALTER TABLE visites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read visites"
  ON visites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert visites"
  ON visites FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update visites"
  ON visites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Observations Prévéris
CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_observation text UNIQUE NOT NULL,
  visite_id uuid REFERENCES visites(id) ON DELETE CASCADE NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  description text NOT NULL,
  photos text[],
  type text NOT NULL,
  criticite text DEFAULT 'moyenne',
  type_intervenant_suggere text,
  prestataire_recommande_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  contact_recommande_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  cout_estime_min numeric(10,2),
  cout_estime_max numeric(10,2),
  score_confiance_ia integer,
  statut text DEFAULT 'nouvelle',
  date_resolution date,
  commentaire_resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read observations"
  ON observations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert observations"
  ON observations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update observations"
  ON observations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commissions de Sécurité
CREATE TABLE IF NOT EXISTS commissions_securite (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date_commission date NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  type_commission text NOT NULL,
  periodicite integer DEFAULT 3,
  date_prochaine_commission date,
  avis text,
  pv_commission text,
  convocation text,
  dossier_presente text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_one_parent_commission CHECK (
    (etablissement_id IS NOT NULL AND groupement_id IS NULL) OR
    (etablissement_id IS NULL AND groupement_id IS NOT NULL)
  )
);

ALTER TABLE commissions_securite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read commissions_securite"
  ON commissions_securite FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert commissions_securite"
  ON commissions_securite FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update commissions_securite"
  ON commissions_securite FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Prescriptions Commission
CREATE TABLE IF NOT EXISTS prescriptions_commission (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_prescription text UNIQUE NOT NULL,
  commission_id uuid REFERENCES commissions_securite(id) ON DELETE CASCADE NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  description_complete text NOT NULL,
  articles_reglementaires text[],
  delai_reglementaire_jours integer,
  date_limite_conformite date,
  type_intervention text NOT NULL,
  type_intervenant_suggere text,
  score_confiance_ia integer,
  prestataire_recommande_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  raison_recommendation text,
  cout_estime_min numeric(10,2),
  cout_estime_max numeric(10,2),
  statut text DEFAULT 'a_faire',
  date_realisation date,
  prestataire_effectif_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  cout_reel numeric(10,2),
  rapport_travaux text,
  facture text,
  note_satisfaction_client integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions_commission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prescriptions_commission"
  ON prescriptions_commission FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prescriptions_commission"
  ON prescriptions_commission FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescriptions_commission"
  ON prescriptions_commission FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes pour optimisation
CREATE INDEX IF NOT EXISTS idx_installations_etablissement ON installations_techniques(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_installations_groupement ON installations_techniques(groupement_id);
CREATE INDEX IF NOT EXISTS idx_verifications_installation ON verifications_periodiques(installation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_statut ON verifications_periodiques(statut);
CREATE INDEX IF NOT EXISTS idx_visites_etablissement ON visites(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_visites_date ON visites(date_visite);
CREATE INDEX IF NOT EXISTS idx_observations_visite ON observations(visite_id);
CREATE INDEX IF NOT EXISTS idx_observations_statut ON observations(statut);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON commissions_securite(date_commission);
CREATE INDEX IF NOT EXISTS idx_prescriptions_commission ON prescriptions_commission(commission_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_statut ON prescriptions_commission(statut);