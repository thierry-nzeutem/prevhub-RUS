/*
  # Mise à jour des avis de commission et rattachement des prescriptions

  1. Modifications
    - Corriger les valeurs possibles pour l'avis de commission
    - Mettre à jour les données existantes
    - Ajouter trigger pour valider les prescriptions

  2. Changements
    - commissions.avis : valeurs possibles 'favorable', 'defavorable', 'avis_suspendu'
*/

-- Étape 1 : Supprimer l'ancienne contrainte
ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_avis_check;

-- Étape 2 : Mettre à jour les données existantes
UPDATE commissions SET avis = 'avis_suspendu' WHERE avis = 'attente';
UPDATE commissions SET avis = 'avis_suspendu' WHERE avis = 'ajourne';

-- Étape 3 : Ajouter la nouvelle contrainte
ALTER TABLE commissions ADD CONSTRAINT commissions_avis_check 
  CHECK (avis IS NULL OR avis IN ('favorable', 'defavorable', 'avis_suspendu'));

-- Commentaires pour documentation
COMMENT ON COLUMN commissions.avis IS 'Avis de la commission : favorable, defavorable, ou avis_suspendu';
COMMENT ON COLUMN observations.commission_id IS 'Commission ayant émis cette observation/prescription (obligatoire pour les prescriptions)';

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_observations_commission_type ON observations(commission_id, type);

-- Vue pour les prescriptions avec leurs commissions
CREATE OR REPLACE VIEW v_prescriptions_avec_commissions AS
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
  o.commission_id,
  c.date as commission_date,
  c.type as commission_type,
  c.avis as commission_avis,
  c.reference as commission_reference,
  COALESCE(e.nom_commercial, 'Niveau groupement') as etablissement_nom,
  g.nom as groupement_nom,
  o.created_at,
  o.updated_at
FROM observations o
LEFT JOIN commissions c ON o.commission_id = c.id
LEFT JOIN etablissements e ON o.etablissement_id = e.id
LEFT JOIN groupements g ON o.groupement_id = g.id
WHERE o.type = 'prescription'
ORDER BY o.created_at DESC;

-- Fonction trigger pour valider que les prescriptions ont une commission
CREATE OR REPLACE FUNCTION check_prescription_has_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'prescription' AND NEW.commission_id IS NULL THEN
    RAISE EXCEPTION 'Les prescriptions doivent être rattachées à une commission';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (sera actif pour les nouvelles prescriptions)
DROP TRIGGER IF EXISTS ensure_prescription_has_commission ON observations;

CREATE TRIGGER ensure_prescription_has_commission
  BEFORE INSERT OR UPDATE ON observations
  FOR EACH ROW
  WHEN (NEW.type = 'prescription')
  EXECUTE FUNCTION check_prescription_has_commission();

COMMENT ON FUNCTION check_prescription_has_commission IS 'Vérifie que toute prescription est rattachée à une commission';