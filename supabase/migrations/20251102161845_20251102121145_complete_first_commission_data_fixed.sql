/*
  # Compléter les données de la première commission

  1. Ajouts
    - Participants pour la première commission
    - Prescriptions pour la première commission avec visite_id
*/

DO $$
DECLARE
  commission_id_1 uuid;
  groupement_id_1 uuid;
  etablissement_id_1 uuid;
  visite_id_1 uuid;
BEGIN
  -- Récupérer la première commission
  SELECT id INTO commission_id_1 FROM commissions ORDER BY date LIMIT 1;
  
  -- Récupérer un groupement, établissement et visite
  SELECT id INTO groupement_id_1 FROM groupements LIMIT 1;
  SELECT id INTO etablissement_id_1 FROM etablissements LIMIT 1;
  SELECT visite_id INTO visite_id_1 FROM observations LIMIT 1;

  -- Ajouter des participants
  INSERT INTO commission_participants (commission_id, nom, role, fonction)
  VALUES
    (commission_id_1, 'Jean Dupont', 'president', 'Président de la commission'),
    (commission_id_1, 'Claire Bernard', 'sdis', 'Lieutenant sapeur-pompier'),
    (commission_id_1, 'Thomas Petit', 'exploitant', 'Directeur du site')
  ON CONFLICT DO NOTHING;

  -- Ajouter quelques prescriptions
  INSERT INTO observations (
    numero_observation,
    description,
    type,
    criticite,
    statut,
    statut_detaille,
    priorite,
    delai_jours,
    groupement_id,
    etablissement_id,
    commission_id,
    visite_id,
    responsable_nom,
    responsable_email,
    cout_previsionnel,
    cellule_reference
  )
  VALUES
    (
      'PRES-2021-001',
      'Installation de portes coupe-feu REI 60 dans les circulations principales',
      'prescription',
      'critique',
      'en_cours',
      'en_cours',
      'haute',
      90,
      groupement_id_1,
      etablissement_id_1,
      commission_id_1,
      visite_id_1,
      'Thierry Nzeutem',
      'thierry.nzeutem@prevhub.fr',
      8500.00,
      'Cellule A'
    ),
    (
      'PRES-2021-002',
      'Mise en conformité du système de désenfumage',
      'prescription',
      'majeure',
      'en_cours',
      'leve',
      'normale',
      60,
      groupement_id_1,
      etablissement_id_1,
      commission_id_1,
      visite_id_1,
      'Thierry Nzeutem',
      'thierry.nzeutem@prevhub.fr',
      12000.00,
      'Cellule B'
    ),
    (
      'PRES-2021-003',
      'Vérification et mise à jour des plans d''évacuation',
      'prescription',
      'mineure',
      'en_cours',
      'leve',
      'basse',
      30,
      groupement_id_1,
      etablissement_id_1,
      commission_id_1,
      visite_id_1,
      'Thierry Nzeutem',
      'thierry.nzeutem@prevhub.fr',
      1200.00,
      'Toutes cellules'
    )
  ON CONFLICT DO NOTHING;

END $$;