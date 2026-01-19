/*
  # Données d'exemple pour Commissions & Arrêtés

  Ajout de commissions et arrêtés d'exemple pour les établissements existants
*/

-- Récupérer un établissement pour les données d'exemple
DO $$
DECLARE
  v_etablissement_id uuid;
  v_groupement_id uuid;
  v_commission_id1 uuid;
  v_commission_id2 uuid;
  v_commission_id3 uuid;
  v_arrete_id1 uuid;
  v_arrete_id2 uuid;
BEGIN
  -- Récupérer le premier établissement
  SELECT id, groupement_id INTO v_etablissement_id, v_groupement_id
  FROM etablissements
  LIMIT 1;

  IF v_etablissement_id IS NOT NULL THEN
    -- Créer des commissions
    INSERT INTO commissions (id, date, heure, type, etablissement_id, groupement_id, objet, objet_details, reference, affaire, avis)
    VALUES
      (gen_random_uuid(), '2021-07-15 10:00:00'::timestamptz, '10:00'::time, 'securite', v_etablissement_id, v_groupement_id, 'AT', 'PCM 05', 'PV n°2021.14', 'Affaire n°8', 'favorable')
    RETURNING id INTO v_commission_id1;

    INSERT INTO commissions (id, date, heure, type, etablissement_id, groupement_id, objet, objet_details, reference, avis)
    VALUES
      (gen_random_uuid(), '2021-04-08 14:30:00'::timestamptz, '14:30'::time, 'securite', v_etablissement_id, v_groupement_id, 'AT', 'PCM 05', '510584', 'defavorable')
    RETURNING id INTO v_commission_id2;

    INSERT INTO commissions (id, date, heure, type, etablissement_id, groupement_id, objet, objet_details, reference, affaire, avis)
    VALUES
      (gen_random_uuid(), '2025-12-03 14:00:00'::timestamptz, '14:00'::time, 'accessibilite', v_etablissement_id, v_groupement_id, 'periodique', 'Visite périodique', NULL, NULL, 'attente')
    RETURNING id INTO v_commission_id3;

    -- Ajouter des participants
    INSERT INTO commission_participants (commission_id, nom, role, fonction)
    VALUES
      (v_commission_id1, 'M. Jean DUPONT', 'president', 'Maire adjoint'),
      (v_commission_id1, 'Cdt Pierre MARTIN', 'sdis', NULL),
      (v_commission_id1, 'M. Nabil AROUA', 'exploitant', 'FREY SA');

    -- Créer des arrêtés
    INSERT INTO arretes (id, numero, date, type, etablissement_id, groupement_id, objet, statut)
    VALUES
      (gen_random_uuid(), 'ARR-2021-087', '2021-07-22', 'autorisation', v_etablissement_id, v_groupement_id, 'Autorisation PCM 05', 'delivre')
    RETURNING id INTO v_arrete_id1;

    INSERT INTO arretes (id, numero, date, type, etablissement_id, groupement_id, objet, statut)
    VALUES
      (gen_random_uuid(), 'ARR-2021-034', '2021-03-18', 'ouverture', v_etablissement_id, v_groupement_id, 'Autorisation d''ouverture', 'delivre')
    RETURNING id INTO v_arrete_id2;

    -- Lier arrêtés et commissions
    INSERT INTO arrete_commissions (arrete_id, commission_id)
    VALUES
      (v_arrete_id1, v_commission_id1);

    -- Ajouter des documents
    INSERT INTO commission_documents (commission_id, nom, type, url, taille_ko)
    VALUES
      (v_commission_id1, 'PV_Commission_2021.14.pdf', 'pv', '/documents/pv_2021_14.pdf', 254),
      (v_commission_id1, 'Convocation_Commission.pdf', 'convocation', '/documents/convocation.pdf', 128),
      (v_commission_id1, 'Plans_PCM05.pdf', 'plans', '/documents/plans_pcm05.pdf', 1200);

  END IF;
END $$;