/*
  # Prev'Hub - Fonctions automatiques et données de test
  
  ## Fonctions créées
  
  1. **calculate_verification_status** - Calcule le statut selon échéance
  2. **update_groupement_classification** - Met à jour types_erp et catégorie
  
  ## Données de test
  
  - 4 groupements (E. Leclerc, Shopping Promenade, Woodshop, Grand Parc)
  - 10 établissements
  - Sociétés et contacts
  - Installations techniques
  - Vérifications périodiques (certaines en retard)
*/

-- Fonction pour calculer le statut de vérification
CREATE OR REPLACE FUNCTION calculate_verification_status(date_prochaine date)
RETURNS text AS $$
BEGIN
  IF date_prochaine < CURRENT_DATE THEN
    RETURN 'non_conforme';
  ELSIF date_prochaine < (CURRENT_DATE + INTERVAL '60 days') THEN
    RETURN 'echeance_proche';
  ELSE
    RETURN 'conforme';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour mettre à jour la classification d'un groupement
CREATE OR REPLACE FUNCTION update_groupement_classification()
RETURNS TRIGGER AS $$
DECLARE
  grp_id uuid;
  all_types text[];
  total_effectif integer;
  new_categorie text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    grp_id := OLD.groupement_id;
  ELSE
    grp_id := NEW.groupement_id;
  END IF;
  
  IF grp_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT 
    array_agg(DISTINCT unnest_types ORDER BY unnest_types),
    COALESCE(SUM(effectif_public), 0)
  INTO all_types, total_effectif
  FROM etablissements, unnest(types_erp) as unnest_types
  WHERE groupement_id = grp_id;
  
  IF total_effectif >= 1500 THEN
    new_categorie := '1ère';
  ELSIF total_effectif >= 701 THEN
    new_categorie := '2ème';
  ELSIF total_effectif >= 301 THEN
    new_categorie := '3ème';
  ELSIF total_effectif >= 101 THEN
    new_categorie := '4ème';
  ELSE
    new_categorie := '5ème';
  END IF;
  
  UPDATE groupements
  SET 
    types_erp = COALESCE(all_types, ARRAY[]::text[]),
    effectif_total_public = total_effectif,
    categorie_erp = new_categorie
  WHERE id = grp_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_groupement_classification'
  ) THEN
    CREATE TRIGGER trigger_update_groupement_classification
    AFTER INSERT OR UPDATE OR DELETE ON etablissements
    FOR EACH ROW
    EXECUTE FUNCTION update_groupement_classification();
  END IF;
END $$;

-- Données de test - Sociétés
INSERT INTO societes (id, raison_sociale, siret, est_exploitation, ville) VALUES
  ('11111111-1111-1111-1111-111111111111', 'E. LECLERC VILLEPARISIS', '12345678900012', true, 'Villeparisis'),
  ('22222222-2222-2222-2222-222222222222', 'DEKRA INDUSTRIAL', '98765432100012', true, 'Paris'),
  ('33333333-3333-3333-3333-333333333333', 'IBAT', '55555555500012', true, 'Paris'),
  ('44444444-4444-4444-4444-444444444444', 'PHARMACIE LAFAYETTE SAS', '11122233300012', true, 'Paris')
ON CONFLICT (id) DO NOTHING;

-- Données de test - Groupements
INSERT INTO groupements (id, nom, adresse_complete, ville, code_postal, types_erp, categorie_erp, effectif_total_public, date_derniere_commission, prochaine_commission, avis_derniere_commission) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'E. Leclerc - Villeparisis', '123 Avenue du Groupement', 'Villeparisis', '77270', ARRAY['M', 'N', 'O'], '2ème', 1500, '2023-10-15', '2026-10-15', 'defavorable'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Shopping Promenade Bât Da', '45 Boulevard de la Promenade', 'Claye-Souilly', '77410', ARRAY['M', 'N'], '3ème', 800, '2024-03-20', '2027-03-20', 'favorable'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Woodshop', '78 Rue du Commerce', 'Cesson', '77240', ARRAY['M'], '4ème', 250, '2025-02-10', '2030-02-10', 'favorable'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Grand Parc Bât 4', '90 Avenue du Grand Parc', 'La Francheville', '08000', ARRAY['M', 'N'], '3ème', 650, '2025-04-15', '2028-04-15', 'defavorable')
ON CONFLICT (id) DO NOTHING;

-- Données de test - Établissements
INSERT INTO etablissements (id, nom_commercial, enseigne, groupement_id, types_erp, categorie_erp, effectif_public, surface_m2, societe_exploitation_id, ge5_affiche, sogs_transmis) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Pharmacie Lafayette', 'Lafayette', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['M'], '2ème', 150, 280, '44444444-4444-4444-4444-444444444444', false, true),
  ('e2222222-2222-2222-2222-222222222222', 'Sequoia Pressing', 'Sequoia', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['M'], '2ème', 100, 150, '11111111-1111-1111-1111-111111111111', true, true),
  ('e3333333-3333-3333-3333-333333333333', 'Louis Valentin - Optic 2000', 'Optic 2000', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['M'], '2ème', 120, 200, '11111111-1111-1111-1111-111111111111', true, true),
  ('e4444444-4444-4444-4444-444444444444', 'Damart', 'Damart', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ARRAY['M'], '3ème', 180, 320, '11111111-1111-1111-1111-111111111111', true, false),
  ('e5555555-5555-5555-5555-555555555555', 'Old Wild West', 'Old Wild West', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ARRAY['N'], '3ème', 200, 250, '11111111-1111-1111-1111-111111111111', true, false),
  ('e6666666-6666-6666-6666-666666666666', 'LA FOIRFOUILLE', 'La Foirfouille', 'cccccccc-cccc-cccc-cccc-cccccccccccc', ARRAY['M'], '4ème', 130, 400, '11111111-1111-1111-1111-111111111111', true, true),
  ('e7777777-7777-7777-7777-777777777777', 'Nova Swiss', 'Nova Swiss', 'cccccccc-cccc-cccc-cccc-cccccccccccc', ARRAY['M'], '4ème', 120, 180, '11111111-1111-1111-1111-111111111111', true, false),
  ('e8888888-8888-8888-8888-888888888888', 'SoCoOc-La Francheville', 'SoCoOc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY['M'], '3ème', 220, 350, '11111111-1111-1111-1111-111111111111', true, true),
  ('e9999999-9999-9999-9999-999999999999', 'Orchestra', 'Orchestra', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY['M'], '3ème', 180, 280, '11111111-1111-1111-1111-111111111111', true, false),
  ('eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Réauté Chocolat', 'Réauté', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY['N'], '3ème', 150, 200, '11111111-1111-1111-1111-111111111111', true, false)
ON CONFLICT (id) DO NOTHING;

-- Données de test - Installations Techniques (groupement E. Leclerc)
INSERT INTO installations_techniques (id, nom, type_installation, periodicite_reglementaire, groupement_id, societe_prestataire_id) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Éclairage de sécurité', 'Éclairage de sécurité', 'annuelle', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
  ('a2222222-2222-2222-2222-222222222222', 'Installations électriques (Code du Travail)', 'Installations électriques (Code du Travail)', 'annuelle', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('a3333333-3333-3333-3333-333333333333', 'Installations électriques (ERP)', 'Installations électriques (ERP)', 'annuelle', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('a4444444-4444-4444-4444-444444444444', 'VMC', 'VMC', 'annuelle', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('a5555555-5555-5555-5555-555555555555', 'Extincteurs', 'Extincteurs', 'annuelle', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Données de test - Installations Techniques (établissement Pharmacie Lafayette)
INSERT INTO installations_techniques (id, nom, type_installation, periodicite_reglementaire, etablissement_id, societe_prestataire_id) VALUES
  ('a6666666-6666-6666-6666-666666666666', 'Installations électriques (Code du Travail)', 'Installations électriques (Code du Travail)', 'annuelle', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('a7777777-7777-7777-7777-777777777777', 'Installations électriques (ERP)', 'Installations électriques (ERP)', 'annuelle', 'e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('a8888888-8888-8888-8888-888888888888', 'Chaufferie gaz (entretien)', 'Chauffage gaz (annuelle)', 'annuelle', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Données de test - Vérifications Périodiques (avec des en retard)
INSERT INTO verifications_periodiques (installation_id, date_verification, date_prochaine_verification, societe_prestataire_id, synthese) VALUES
  ('a1111111-1111-1111-1111-111111111111', '2021-03-11', '2022-03-11', '33333333-3333-3333-3333-333333333333', 'non_conforme'),
  ('a2222222-2222-2222-2222-222222222222', '2024-11-14', '2025-11-14', '22222222-2222-2222-2222-222222222222', 'conforme'),
  ('a3333333-3333-3333-3333-333333333333', '2024-11-12', '2025-11-12', '22222222-2222-2222-2222-222222222222', 'conforme'),
  ('a4444444-4444-4444-4444-444444444444', '2021-08-10', '2022-08-10', '11111111-1111-1111-1111-111111111111', 'non_conforme'),
  ('a5555555-5555-5555-5555-555555555555', '2021-03-11', '2022-03-11', '33333333-3333-3333-3333-333333333333', 'non_conforme'),
  ('a6666666-6666-6666-6666-666666666666', '2024-11-14', '2025-11-14', '22222222-2222-2222-2222-222222222222', 'conforme'),
  ('a7777777-7777-7777-7777-777777777777', '2024-11-12', '2025-11-12', '22222222-2222-2222-2222-222222222222', 'conforme'),
  ('a8888888-8888-8888-8888-888888888888', '2019-12-24', '2020-12-24', '11111111-1111-1111-1111-111111111111', 'non_conforme')
ON CONFLICT DO NOTHING;

-- Mettre à jour les statuts des vérifications
UPDATE verifications_periodiques
SET statut = calculate_verification_status(date_prochaine_verification);