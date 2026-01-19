/*
  # Lier les participants et prescriptions aux commissions

  1. Modifications
    - Associer les prescriptions existantes à des commissions
    - Ajouter plus de participants aux commissions
    
  2. Données de test
    - Participants pour chaque commission
    - Lien des prescriptions aux commissions
*/

-- Récupérer les IDs des commissions existantes et créer les liens
DO $$
DECLARE
  commission_id_1 uuid;
  commission_id_2 uuid;
  commission_id_3 uuid;
BEGIN
  -- Récupérer les 3 premières commissions
  SELECT id INTO commission_id_1 FROM commissions ORDER BY date LIMIT 1;
  SELECT id INTO commission_id_2 FROM commissions ORDER BY date OFFSET 1 LIMIT 1;
  SELECT id INTO commission_id_3 FROM commissions ORDER BY date OFFSET 2 LIMIT 1;

  -- Associer les prescriptions existantes aux commissions
  -- Répartir les prescriptions entre les 3 commissions
  UPDATE observations 
  SET commission_id = commission_id_1 
  WHERE type = 'prescription' 
  AND commission_id IS NULL 
  AND numero_observation IN ('PRES-2024-001', 'PRES-2024-002', 'PRES-2024-003');

  -- 6 prescriptions à la commission 2
  UPDATE observations 
  SET commission_id = commission_id_2 
  WHERE type = 'prescription' 
  AND commission_id IS NULL 
  AND id IN (
    SELECT id FROM observations 
    WHERE type = 'prescription' AND commission_id IS NULL 
    LIMIT 6
  );

  -- Le reste à la commission 3
  UPDATE observations 
  SET commission_id = commission_id_3 
  WHERE type = 'prescription' 
  AND commission_id IS NULL;

  -- Ajouter des participants à la deuxième commission
  INSERT INTO commission_participants (commission_id, nom, role, fonction)
  VALUES
    (commission_id_2, 'Sophie Martin', 'exploitant', 'Directrice du site'),
    (commission_id_2, 'Marc Dubois', 'sdis', 'Sapeur-pompier'),
    (commission_id_2, 'Julie Leroy', 'president', 'Président de commission')
  ON CONFLICT DO NOTHING;

  -- Ajouter des participants à la troisième commission
  INSERT INTO commission_participants (commission_id, nom, role, fonction)
  VALUES
    (commission_id_3, 'Pierre Blanc', 'exploitant', 'Responsable sécurité'),
    (commission_id_3, 'Marie Rousseau', 'sdis', 'Sapeur-pompier'),
    (commission_id_3, 'Antoine Moreau', 'president', 'Président de commission'),
    (commission_id_3, 'Isabelle Petit', 'exploitant', 'Adjointe sécurité')
  ON CONFLICT DO NOTHING;

END $$;

-- Vérifier les liens créés
COMMENT ON TABLE commission_participants IS 'Participants aux commissions de sécurité - rôles: exploitant, sdis, president';