/*
  # Création des tables Commissions & Arrêtés

  1. Nouvelles Tables
    - `commissions`
      - Gestion des commissions de sécurité et d'accessibilité
      - Lien avec établissements
      - Stockage des participants et références
    
    - `arretes`
      - Gestion des arrêtés municipaux
      - Lien avec commissions et établissements
    
    - `commission_participants`
      - Participants aux commissions
    
    - `commission_documents`
      - Documents associés aux commissions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Table des commissions
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  heure time,
  type text NOT NULL CHECK (type IN ('securite', 'accessibilite', 'mixte')),
  etablissement_id uuid REFERENCES etablissements(id),
  groupement_id uuid REFERENCES groupements(id),
  objet text NOT NULL CHECK (objet IN ('AT', 'ouverture', 'periodique', 'inopinee', 'levee', 'autre')),
  objet_details text,
  reference text,
  affaire text,
  avis text CHECK (avis IN ('favorable', 'defavorable', 'attente', 'ajourne')),
  date_convocation timestamptz,
  notes text,
  arrete_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des participants aux commissions
CREATE TABLE IF NOT EXISTS commission_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid REFERENCES commissions(id) ON DELETE CASCADE,
  nom text NOT NULL,
  role text NOT NULL CHECK (role IN ('president', 'sdis', 'exploitant', 'bureau_controle', 'architecte', 'autre')),
  fonction text,
  created_at timestamptz DEFAULT now()
);

-- Table des arrêtés
CREATE TABLE IF NOT EXISTS arretes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('autorisation', 'refus', 'ouverture', 'fermeture', 'autre')),
  etablissement_id uuid REFERENCES etablissements(id),
  groupement_id uuid REFERENCES groupements(id),
  objet text NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('delivre', 'en_attente', 'annule')),
  document_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de liaison entre arrêtés et commissions
CREATE TABLE IF NOT EXISTS arrete_commissions (
  arrete_id uuid REFERENCES arretes(id) ON DELETE CASCADE,
  commission_id uuid REFERENCES commissions(id) ON DELETE CASCADE,
  PRIMARY KEY (arrete_id, commission_id)
);

-- Table des documents liés aux commissions
CREATE TABLE IF NOT EXISTS commission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid REFERENCES commissions(id) ON DELETE CASCADE,
  nom text NOT NULL,
  type text CHECK (type IN ('pv', 'convocation', 'plans', 'rapport', 'autre')),
  url text NOT NULL,
  taille_ko integer,
  created_at timestamptz DEFAULT now()
);

-- Mettre à jour la table observations pour lier à une commission
ALTER TABLE observations ADD COLUMN IF NOT EXISTS commission_id uuid REFERENCES commissions(id);
ALTER TABLE observations ADD COLUMN IF NOT EXISTS origine text DEFAULT 'visite' CHECK (origine IN ('commission', 'visite', 'controle'));

-- Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE arretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrete_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_documents ENABLE ROW LEVEL SECURITY;

-- Policies pour commissions (lecture publique)
CREATE POLICY "Allow public read access to commissions"
  ON commissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert commissions"
  ON commissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update commissions"
  ON commissions FOR UPDATE
  TO authenticated
  USING (true);

-- Policies pour commission_participants
CREATE POLICY "Allow public read access to commission_participants"
  ON commission_participants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage commission_participants"
  ON commission_participants FOR ALL
  TO authenticated
  USING (true);

-- Policies pour arretes
CREATE POLICY "Allow public read access to arretes"
  ON arretes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert arretes"
  ON arretes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update arretes"
  ON arretes FOR UPDATE
  TO authenticated
  USING (true);

-- Policies pour arrete_commissions
CREATE POLICY "Allow public read access to arrete_commissions"
  ON arrete_commissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage arrete_commissions"
  ON arrete_commissions FOR ALL
  TO authenticated
  USING (true);

-- Policies pour commission_documents
CREATE POLICY "Allow public read access to commission_documents"
  ON commission_documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage commission_documents"
  ON commission_documents FOR ALL
  TO authenticated
  USING (true);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_commissions_etablissement ON commissions(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_commissions_groupement ON commissions(groupement_id);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON commissions(date);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);
CREATE INDEX IF NOT EXISTS idx_commissions_avis ON commissions(avis);

CREATE INDEX IF NOT EXISTS idx_arretes_etablissement ON arretes(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_arretes_groupement ON arretes(groupement_id);
CREATE INDEX IF NOT EXISTS idx_arretes_numero ON arretes(numero);
CREATE INDEX IF NOT EXISTS idx_arretes_date ON arretes(date);
