/*
  # Correction catégorie groupement et liaison dynamique

  1. Modifications
    - Corriger la catégorie du groupement E. Leclerc Villeparisis
    - Ajouter une fonction pour calculer automatiquement la catégorie du groupement
    - Créer un trigger pour maintenir la cohérence

  2. Changements
    - Mise à jour de la catégorie E. Leclerc
    - Fonction de calcul dynamique de catégorie (la plus restrictive des cellules)
*/

-- Corriger la catégorie du groupement E. Leclerc Villeparisis
UPDATE groupements 
SET categorie_erp = '2ème catégorie' 
WHERE nom = 'E. Leclerc - Villeparisis';

-- Fonction pour calculer la catégorie la plus restrictive d'un groupement
-- La hiérarchie est : 1ère > 2ème > 3ème > 4ème > 5ème
CREATE OR REPLACE FUNCTION get_groupement_categorie_from_etablissements(p_groupement_id uuid)
RETURNS text AS $$
DECLARE
  v_categorie text;
BEGIN
  -- Récupérer la catégorie la plus restrictive parmi les établissements du groupement
  SELECT 
    CASE 
      WHEN bool_or(categorie_erp LIKE '1%') THEN '1ère catégorie'
      WHEN bool_or(categorie_erp LIKE '2%') THEN '2ème catégorie'
      WHEN bool_or(categorie_erp LIKE '3%') THEN '3ème catégorie'
      WHEN bool_or(categorie_erp LIKE '4%') THEN '4ème catégorie'
      ELSE '5ème catégorie'
    END INTO v_categorie
  FROM etablissements
  WHERE groupement_id = p_groupement_id;
  
  RETURN COALESCE(v_categorie, '5ème catégorie');
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour mettre à jour automatiquement la catégorie du groupement
CREATE OR REPLACE FUNCTION update_groupement_categorie()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un établissement est ajouté, modifié ou supprimé, recalculer la catégorie du groupement
  IF TG_OP = 'DELETE' THEN
    IF OLD.groupement_id IS NOT NULL THEN
      UPDATE groupements 
      SET categorie_erp = get_groupement_categorie_from_etablissements(OLD.groupement_id),
          updated_at = now()
      WHERE id = OLD.groupement_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.groupement_id IS NOT NULL THEN
      UPDATE groupements 
      SET categorie_erp = get_groupement_categorie_from_etablissements(NEW.groupement_id),
          updated_at = now()
      WHERE id = NEW.groupement_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table etablissements
DROP TRIGGER IF EXISTS trigger_update_groupement_categorie ON etablissements;

CREATE TRIGGER trigger_update_groupement_categorie
  AFTER INSERT OR UPDATE OF categorie_erp OR DELETE ON etablissements
  FOR EACH ROW
  EXECUTE FUNCTION update_groupement_categorie();

-- Vue pour les statistiques dynamiques du groupement
CREATE OR REPLACE VIEW v_groupements_avec_stats AS
SELECT 
  g.id,
  g.nom,
  g.adresse_complete,
  g.ville,
  g.code_postal,
  g.types_erp,
  g.categorie_erp,
  get_groupement_categorie_from_etablissements(g.id) as categorie_heritee,
  g.effectif_total_public,
  g.date_derniere_commission,
  g.prochaine_commission,
  g.avis_derniere_commission,
  g.created_at,
  g.updated_at,
  COUNT(DISTINCT e.id) as nombre_etablissements,
  COUNT(DISTINCT CASE WHEN o.type = 'prescription' AND o.statut != 'resolu' THEN o.id END) as nombre_prescriptions_actives,
  COUNT(DISTINCT CASE WHEN o.type != 'prescription' AND o.statut != 'resolu' THEN o.id END) as nombre_observations_actives
FROM groupements g
LEFT JOIN etablissements e ON g.id = e.groupement_id
LEFT JOIN observations o ON (g.id = o.groupement_id OR e.id = o.etablissement_id)
GROUP BY g.id;

COMMENT ON FUNCTION get_groupement_categorie_from_etablissements IS 'Calcule la catégorie la plus restrictive parmi les établissements du groupement';
COMMENT ON FUNCTION update_groupement_categorie IS 'Trigger pour maintenir la catégorie du groupement synchronisée avec ses établissements';
COMMENT ON VIEW v_groupements_avec_stats IS 'Vue enrichie des groupements avec statistiques calculées dynamiquement';
