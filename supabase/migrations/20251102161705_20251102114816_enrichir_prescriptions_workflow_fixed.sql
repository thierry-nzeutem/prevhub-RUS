/*
  # Enrichissement du système de prescriptions

  1. Nouvelles tables
    - `prestataires` : liste des prestataires pour les travaux
    - `prescription_historique` : historique des actions sur les prescriptions
    - `prescription_documents` : documents joints aux prescriptions

  2. Modifications tables existantes
    - `observations` : ajout de colonnes pour workflow complet

  3. Sécurité
    - RLS activé sur toutes les nouvelles tables
*/

-- Table des prestataires
CREATE TABLE IF NOT EXISTS prestataires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  specialite text NOT NULL,
  telephone text,
  email text,
  adresse text,
  ville text,
  code_postal text,
  siret text,
  note_moyenne decimal(2,1) DEFAULT 0,
  nombre_interventions integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table historique des prescriptions
CREATE TABLE IF NOT EXISTS prescription_historique (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES observations(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  statut_avant text,
  statut_apres text,
  commentaire text,
  auteur_nom text NOT NULL,
  auteur_email text,
  created_at timestamptz DEFAULT now()
);

-- Table des documents
CREATE TABLE IF NOT EXISTS prescription_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES observations(id) ON DELETE CASCADE NOT NULL,
  nom_fichier text NOT NULL,
  type_fichier text NOT NULL,
  url_fichier text NOT NULL,
  taille_ko integer,
  type_document text NOT NULL CHECK (type_document IN ('photo_avant', 'photo_apres', 'rapport', 'devis', 'facture', 'autre')),
  description text,
  uploaded_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Ajouter les nouvelles colonnes à observations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'delai_jours') THEN
    ALTER TABLE observations ADD COLUMN delai_jours integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'date_echeance') THEN
    ALTER TABLE observations ADD COLUMN date_echeance date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'date_resolution_effective') THEN
    ALTER TABLE observations ADD COLUMN date_resolution_effective date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'responsable_nom') THEN
    ALTER TABLE observations ADD COLUMN responsable_nom text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'responsable_email') THEN
    ALTER TABLE observations ADD COLUMN responsable_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'prestataire_id') THEN
    ALTER TABLE observations ADD COLUMN prestataire_id uuid REFERENCES prestataires(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'cout_previsionnel') THEN
    ALTER TABLE observations ADD COLUMN cout_previsionnel decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'cout_reel') THEN
    ALTER TABLE observations ADD COLUMN cout_reel decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'statut_detaille') THEN
    ALTER TABLE observations ADD COLUMN statut_detaille text DEFAULT 'nouveau';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'priorite') THEN
    ALTER TABLE observations ADD COLUMN priorite text DEFAULT 'normale';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'observations' AND column_name = 'notes_internes') THEN
    ALTER TABLE observations ADD COLUMN notes_internes text;
  END IF;
END $$;

-- Ajouter des contraintes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'observations_statut_detaille_check') THEN
    ALTER TABLE observations ADD CONSTRAINT observations_statut_detaille_check 
      CHECK (statut_detaille IN ('nouveau', 'en_cours', 'en_attente_validation', 'leve', 'valide', 'annule'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'observations_priorite_check') THEN
    ALTER TABLE observations ADD CONSTRAINT observations_priorite_check 
      CHECK (priorite IN ('urgent', 'haute', 'normale', 'basse'));
  END IF;
END $$;

-- RLS sur les nouvelles tables
ALTER TABLE prestataires ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_documents ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture pour authenticated
DROP POLICY IF EXISTS "Allow authenticated read prestataires" ON prestataires;
CREATE POLICY "Allow authenticated read prestataires"
  ON prestataires FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read prescription_historique" ON prescription_historique;
CREATE POLICY "Allow authenticated read prescription_historique"
  ON prescription_historique FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read prescription_documents" ON prescription_documents;
CREATE POLICY "Allow authenticated read prescription_documents"
  ON prescription_documents FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert prescription_historique" ON prescription_historique;
CREATE POLICY "Allow authenticated insert prescription_historique"
  ON prescription_historique FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert prescription_documents" ON prescription_documents;
CREATE POLICY "Allow authenticated insert prescription_documents"
  ON prescription_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fonction pour calculer automatiquement la date d'échéance
CREATE OR REPLACE FUNCTION calculate_date_echeance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delai_jours IS NOT NULL AND NEW.created_at IS NOT NULL THEN
    NEW.date_echeance := (NEW.created_at::date + (NEW.delai_jours || ' days')::interval)::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer la date d'échéance
DROP TRIGGER IF EXISTS trigger_calculate_date_echeance ON observations;
CREATE TRIGGER trigger_calculate_date_echeance
  BEFORE INSERT OR UPDATE OF delai_jours ON observations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_date_echeance();

-- Fonction pour logger les changements de statut
CREATE OR REPLACE FUNCTION log_prescription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut_detaille IS DISTINCT FROM NEW.statut_detaille THEN
    INSERT INTO prescription_historique (
      prescription_id,
      action,
      statut_avant,
      statut_apres,
      commentaire,
      auteur_nom
    ) VALUES (
      NEW.id,
      'Changement de statut',
      OLD.statut_detaille,
      NEW.statut_detaille,
      'Statut modifié',
      COALESCE(NEW.responsable_nom, 'Système')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour logger les changements
DROP TRIGGER IF EXISTS trigger_log_status_change ON observations;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE OF statut_detaille ON observations
  FOR EACH ROW
  EXECUTE FUNCTION log_prescription_status_change();

-- Vue enrichie des prescriptions
CREATE OR REPLACE VIEW v_prescriptions_enrichies AS
SELECT 
  o.id,
  o.numero_observation,
  o.description,
  o.type,
  o.criticite,
  o.statut,
  o.statut_detaille,
  o.priorite,
  o.delai_jours,
  o.date_echeance,
  o.date_resolution,
  o.date_resolution_effective,
  o.responsable_nom,
  o.responsable_email,
  o.cout_previsionnel,
  o.cout_reel,
  o.notes_internes,
  o.groupement_id,
  o.etablissement_id,
  o.cellule_reference,
  o.commission_id,
  c.date as commission_date,
  c.reference as commission_reference,
  c.avis as commission_avis,
  e.nom_commercial as etablissement_nom,
  g.nom as groupement_nom,
  p.nom as prestataire_nom,
  p.specialite as prestataire_specialite,
  p.telephone as prestataire_telephone,
  CASE 
    WHEN o.date_echeance < CURRENT_DATE AND o.statut_detaille NOT IN ('leve', 'valide') THEN 'retard'
    WHEN o.date_echeance <= CURRENT_DATE + interval '7 days' AND o.statut_detaille NOT IN ('leve', 'valide') THEN 'urgent'
    ELSE 'ok'
  END as alerte_delai,
  (SELECT COUNT(*) FROM prescription_documents WHERE prescription_id = o.id) as nb_documents,
  (SELECT COUNT(*) FROM prescription_historique WHERE prescription_id = o.id) as nb_actions,
  o.created_at,
  o.updated_at
FROM observations o
LEFT JOIN commissions c ON o.commission_id = c.id
LEFT JOIN etablissements e ON o.etablissement_id = e.id
LEFT JOIN groupements g ON o.groupement_id = g.id
LEFT JOIN prestataires p ON o.prestataire_id = p.id
WHERE o.type = 'prescription'
ORDER BY 
  CASE o.priorite
    WHEN 'urgent' THEN 1
    WHEN 'haute' THEN 2
    WHEN 'normale' THEN 3
    WHEN 'basse' THEN 4
  END,
  o.date_echeance ASC NULLS LAST;

-- Commentaires
COMMENT ON TABLE prestataires IS 'Liste des prestataires pour les travaux de mise en conformité';
COMMENT ON TABLE prescription_historique IS 'Historique de toutes les actions sur les prescriptions';
COMMENT ON TABLE prescription_documents IS 'Documents joints aux prescriptions (photos, rapports, devis, factures)';
COMMENT ON VIEW v_prescriptions_enrichies IS 'Vue complète des prescriptions avec toutes les informations liées et calcul des alertes';