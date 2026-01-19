/*
  # Prev'Hub - Création des tables principales
  
  ## Tables créées
  
  1. **sites** - Zones commerciales regroupant plusieurs bâtiments
     - id, nom, adresse, coordonnées GPS
  
  2. **groupements** - Bâtiments avec plusieurs établissements
     - id, nom, adresse, types_erp (calculé), catégorie_erp (calculé)
     - Liens avec site, contrat, RUS assigné
  
  3. **etablissements** - ERP individuels
     - id, nom, enseigne, types_erp, catégorie_erp
     - Lien avec groupement (nullable), société exploitation
  
  4. **societes** - Entreprises (exploitation, maintenance, propriétaires)
     - id, raison_sociale, siret, types (exploitation/maintenance/propriétaire)
  
  5. **contacts** - Personnes physiques
     - id, civilité, nom, prénom, fonction, coordonnées
  
  6. **contrats** - Contrats RUS avec clients
     - id, numéro, dates, tarification, prestations
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Policies restrictives par défaut
  - Accès authentifié requis
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sites / Zones commerciales
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  adresse_complete text,
  code_postal text,
  ville text,
  coordonnees_gps jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sites"
  ON sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sociétés
CREATE TABLE IF NOT EXISTS societes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  raison_sociale text NOT NULL,
  siret text,
  forme_juridique text,
  logo text,
  secteur_activite text,
  adresse_siege text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  site_web text,
  est_exploitation boolean DEFAULT false,
  est_maintenance boolean DEFAULT false,
  est_proprietaire boolean DEFAULT false,
  est_syndic boolean DEFAULT false,
  autre_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE societes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read societes"
  ON societes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert societes"
  ON societes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update societes"
  ON societes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  civilite text,
  prenom text NOT NULL,
  nom text NOT NULL,
  fonction text,
  photo text,
  telephone_portable text,
  telephone_fixe text,
  email_professionnel text,
  email_personnel text,
  societe_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  canal_prefere text DEFAULT 'email',
  langue text DEFAULT 'fr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contrats
CREATE TABLE IF NOT EXISTS contrats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_contrat text UNIQUE NOT NULL,
  date_debut date NOT NULL,
  date_fin date,
  duree_engagement_mois integer,
  reconduction_tacite boolean DEFAULT true,
  type_signataire text,
  societe_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  type_prestation text[] DEFAULT ARRAY['RUS'],
  periodicite_visites text,
  nombre_visites_annuelles integer,
  prix_unitaire_visite numeric(10,2),
  prix_forfaitaire_annuel numeric(10,2),
  mode_facturation text DEFAULT 'forfaitaire',
  date_reevaluation_tarifaire date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contrats"
  ON contrats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contrats"
  ON contrats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contrats"
  ON contrats FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Groupements
CREATE TABLE IF NOT EXISTS groupements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  logo text,
  adresse_complete text,
  code_postal text,
  ville text,
  coordonnees_gps jsonb,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  types_erp text[] DEFAULT ARRAY[]::text[],
  categorie_erp text,
  effectif_total_public integer DEFAULT 0,
  date_derniere_commission date,
  prochaine_commission date,
  periodicite_commission integer DEFAULT 3,
  avis_derniere_commission text,
  contrat_id uuid REFERENCES contrats(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groupements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read groupements"
  ON groupements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert groupements"
  ON groupements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update groupements"
  ON groupements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Établissements
CREATE TABLE IF NOT EXISTS etablissements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_commercial text NOT NULL,
  enseigne text,
  logo text,
  numero_dans_groupement text,
  groupement_id uuid REFERENCES groupements(id) ON DELETE SET NULL,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  adresse text,
  code_postal text,
  ville text,
  types_erp text[] DEFAULT ARRAY[]::text[],
  categorie_erp text,
  effectif_public integer DEFAULT 0,
  surface_m2 numeric(10,2),
  societe_exploitation_id uuid REFERENCES societes(id) ON DELETE SET NULL,
  ge5_affiche boolean DEFAULT false,
  ge5_date_derniere_verification date,
  sogs_transmis boolean DEFAULT false,
  sogs_date_transmission date,
  date_derniere_commission date,
  prochaine_commission date,
  est_client_preveris boolean DEFAULT false,
  contrat_id uuid REFERENCES contrats(id) ON DELETE SET NULL,
  contrat_via_groupement boolean DEFAULT false,
  batiments_occupes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE etablissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read etablissements"
  ON etablissements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert etablissements"
  ON etablissements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update etablissements"
  ON etablissements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tables de liaison (many-to-many)

-- Groupements <-> Contacts
CREATE TABLE IF NOT EXISTS groupements_contacts (
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (groupement_id, contact_id)
);

ALTER TABLE groupements_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage groupements_contacts"
  ON groupements_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Groupements <-> Sociétés
CREATE TABLE IF NOT EXISTS groupements_societes (
  groupement_id uuid REFERENCES groupements(id) ON DELETE CASCADE,
  societe_id uuid REFERENCES societes(id) ON DELETE CASCADE,
  PRIMARY KEY (groupement_id, societe_id)
);

ALTER TABLE groupements_societes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage groupements_societes"
  ON groupements_societes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Établissements <-> Contacts
CREATE TABLE IF NOT EXISTS etablissements_contacts (
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (etablissement_id, contact_id)
);

ALTER TABLE etablissements_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage etablissements_contacts"
  ON etablissements_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes pour optimisation
CREATE INDEX IF NOT EXISTS idx_groupements_site ON groupements(site_id);
CREATE INDEX IF NOT EXISTS idx_groupements_ville ON groupements(ville);
CREATE INDEX IF NOT EXISTS idx_etablissements_groupement ON etablissements(groupement_id);
CREATE INDEX IF NOT EXISTS idx_etablissements_exploitation ON etablissements(societe_exploitation_id);
CREATE INDEX IF NOT EXISTS idx_contacts_societe ON contacts(societe_id);