/*
  # Mise à jour du système d'attribution des prescriptions et commissions

  1. Modifications
    - Permettre l'attribution des prescriptions au niveau groupement OU établissement
    - Permettre aux commissions de concerner plusieurs établissements
    - Ajouter une table de liaison entre commissions et établissements
    - Modifier les observations pour supporter l'attribution flexible

  2. Changements
    - observations : rendre etablissement_id nullable, ajouter reference de cellule
    - commissions : ajouter table de liaison commission_etablissements
    - Vues pour faciliter les requêtes agrégées
*/

-- Modifier la table observations pour supporter l'attribution flexible
DO $$
BEGIN
  -- Rendre etablissement_id nullable si ce n'est pas déjà le cas
  ALTER TABLE observations ALTER COLUMN etablissement_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Déjà nullable ou autre erreur, on continue
    NULL;
END $$;

-- Ajouter une colonne pour référencer la cellule/établissement concerné
ALTER TABLE observations ADD COLUMN IF NOT EXISTS cellule_reference text;

-- Table de liaison entre commissions et établissements (plusieurs établissements par commission)
CREATE TABLE IF NOT EXISTS commission_etablissements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid REFERENCES commissions(id) ON DELETE CASCADE,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(commission_id, etablissement_id)
);

-- Enable RLS
ALTER TABLE commission_etablissements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to commission_etablissements"
  ON commission_etablissements FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage commission_etablissements"
  ON commission_etablissements FOR ALL
  TO authenticated
  USING (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_commission_etablissements_commission ON commission_etablissements(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_etablissements_etablissement ON commission_etablissements(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_observations_groupement ON observations(groupement_id);
CREATE INDEX IF NOT EXISTS idx_observations_cellule ON observations(cellule_reference);

-- Vue pour les prescriptions au niveau groupement (toutes les prescriptions du groupement et de ses établissements)
CREATE OR REPLACE VIEW v_prescriptions_groupement AS
SELECT 
  o.id,
  o.numero_observation,
  o.description,
  o.type,
  o.criticite,
  o.statut,
  o.date_resolution,
  o.groupement_id,
  o.etablissement_id,
  o.cellule_reference,
  COALESCE(e.nom_commercial, 'Niveau groupement') as etablissement_nom,
  g.nom as groupement_nom,
  o.created_at,
  o.updated_at
FROM observations o
LEFT JOIN etablissements e ON o.etablissement_id = e.id
LEFT JOIN groupements g ON o.groupement_id = g.id
WHERE o.type = 'prescription'
ORDER BY o.created_at DESC;

-- Vue pour les commissions au niveau groupement (avec liste des établissements concernés)
CREATE OR REPLACE VIEW v_commissions_groupement AS
SELECT 
  c.id,
  c.date,
  c.heure,
  c.type,
  c.objet,
  c.objet_details,
  c.reference,
  c.affaire,
  c.avis,
  c.groupement_id,
  g.nom as groupement_nom,
  c.etablissement_id as etablissement_principal_id,
  e.nom_commercial as etablissement_principal_nom,
  array_agg(DISTINCT ce.etablissement_id) FILTER (WHERE ce.etablissement_id IS NOT NULL) as etablissements_concernes_ids,
  array_agg(DISTINCT e2.nom_commercial) FILTER (WHERE e2.nom_commercial IS NOT NULL) as etablissements_concernes_noms,
  c.created_at,
  c.updated_at
FROM commissions c
LEFT JOIN groupements g ON c.groupement_id = g.id
LEFT JOIN etablissements e ON c.etablissement_id = e.id
LEFT JOIN commission_etablissements ce ON c.id = ce.commission_id
LEFT JOIN etablissements e2 ON ce.etablissement_id = e2.id
GROUP BY c.id, g.nom, e.nom_commercial;

-- Commentaires pour documentation
COMMENT ON COLUMN observations.etablissement_id IS 'Établissement concerné (null si prescription au niveau groupement)';
COMMENT ON COLUMN observations.cellule_reference IS 'Référence de la cellule/établissement concerné (ex: "Cellule A10", "Bât DA")';
COMMENT ON TABLE commission_etablissements IS 'Liaison N-N entre commissions et établissements - une commission peut concerner plusieurs établissements';