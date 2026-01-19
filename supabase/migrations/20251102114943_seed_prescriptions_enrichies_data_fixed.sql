/*
  # Données de démonstration pour le workflow des prescriptions

  1. Prestataires
    - 5 prestataires spécialisés
  
  2. Prescriptions enrichies
    - Mise à jour des prescriptions existantes
    - Nouvelles prescriptions avec différents statuts
    - Historique des actions
    - Documents joints
*/

-- Insertion des prestataires
INSERT INTO prestataires (id, nom, specialite, telephone, email, adresse, ville, code_postal, siret, note_moyenne, nombre_interventions) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Sécurité Plus', 'Sécurité incendie', '01 48 12 34 56', 'contact@securiteplus.fr', '12 rue des Pompiers', 'Paris', '75015', '12345678901234', 4.5, 45),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Access Confort', 'Accessibilité PMR', '01 49 23 45 67', 'info@accessconfort.fr', '8 avenue de la République', 'Villeparisis', '77270', '23456789012345', 4.8, 32),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Élec Pro Services', 'Électricité', '01 50 34 56 78', 'contact@elecpro.fr', '25 boulevard Voltaire', 'Meaux', '77100', '34567890123456', 4.2, 67),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Batiment Expertise', 'Travaux généraux', '01 51 45 67 89', 'devis@batiment-expertise.fr', '15 rue du Commerce', 'Chelles', '77500', '45678901234567', 4.6, 89),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Alarmes & Détection', 'Systèmes de détection', '01 52 56 78 90', 'contact@alarmes-detection.fr', '42 rue de la Paix', 'Mitry-Mory', '77290', '56789012345678', 4.4, 54)
ON CONFLICT (id) DO NOTHING;

-- Mettre à jour les prescriptions existantes avec données enrichies
UPDATE observations SET
  statut_detaille = 'nouveau',
  priorite = 'haute',
  delai_jours = 30,
  responsable_nom = 'Thierry Nzeutem',
  responsable_email = 'thierry.nzeutem@prevhub.fr',
  prestataire_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  cout_previsionnel = 2500.00,
  notes_internes = 'Prescription émise lors de la commission de sécurité. À traiter en priorité.'
WHERE numero_observation = 'PRES-2024-001' AND type = 'prescription';

UPDATE observations SET
  statut_detaille = 'en_cours',
  priorite = 'normale',
  delai_jours = 60,
  responsable_nom = 'Thierry Nzeutem',
  responsable_email = 'thierry.nzeutem@prevhub.fr',
  prestataire_id = 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  cout_previsionnel = 15000.00,
  cout_reel = 14200.00,
  notes_internes = 'Travaux en cours. Prestataire Access Confort intervient cette semaine.'
WHERE numero_observation = 'PRES-2024-002' AND type = 'prescription';

UPDATE observations SET
  statut_detaille = 'leve',
  priorite = 'normale',
  delai_jours = 45,
  date_resolution_effective = CURRENT_DATE - interval '10 days',
  responsable_nom = 'Thierry Nzeutem',
  responsable_email = 'thierry.nzeutem@prevhub.fr',
  prestataire_id = 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  cout_previsionnel = 3500.00,
  cout_reel = 3200.00,
  notes_internes = 'Prescription levée et validée. Travaux conformes.'
WHERE numero_observation = 'PRES-2024-003' AND type = 'prescription';

-- Insertion d'historique pour les prescriptions existantes
INSERT INTO prescription_historique (prescription_id, action, statut_avant, statut_apres, commentaire, auteur_nom, auteur_email, created_at) 
SELECT 
  id,
  'Création de la prescription',
  NULL,
  'nouveau',
  'Prescription émise suite à la commission de sécurité',
  'Thierry Nzeutem',
  'thierry.nzeutem@prevhub.fr',
  created_at
FROM observations 
WHERE type = 'prescription' AND numero_observation IN ('PRES-2024-001', 'PRES-2024-002', 'PRES-2024-003')
ON CONFLICT DO NOTHING;

-- Ajout d'historique pour prescription en cours
INSERT INTO prescription_historique (prescription_id, action, statut_avant, statut_apres, commentaire, auteur_nom, auteur_email, created_at)
SELECT 
  id,
  'Assignation prestataire',
  'nouveau',
  'en_cours',
  'Prestataire Access Confort assigné. Devis validé à 14 200€',
  'Thierry Nzeutem',
  'thierry.nzeutem@prevhub.fr',
  created_at + interval '2 days'
FROM observations 
WHERE type = 'prescription' AND numero_observation = 'PRES-2024-002'
ON CONFLICT DO NOTHING;

-- Ajout d'historique pour prescription levée
INSERT INTO prescription_historique (prescription_id, action, statut_avant, statut_apres, commentaire, auteur_nom, auteur_email, created_at)
SELECT 
  id,
  'Travaux terminés',
  'en_cours',
  'leve',
  'Travaux réalisés conformément aux prescriptions.',
  'Thierry Nzeutem',
  'thierry.nzeutem@prevhub.fr',
  created_at + interval '25 days'
FROM observations 
WHERE type = 'prescription' AND numero_observation = 'PRES-2024-003'
ON CONFLICT DO NOTHING;

-- Insertion de documents pour les prescriptions
INSERT INTO prescription_documents (prescription_id, nom_fichier, type_fichier, url_fichier, taille_ko, type_document, description, uploaded_by, created_at)
SELECT 
  id,
  'photo_anomalie_' || numero_observation || '.jpg',
  'image/jpeg',
  'https://images.pexels.com/photos/1329711/pexels-photo-1329711.jpeg',
  245,
  'photo_avant',
  'Photo de l''anomalie constatée lors de la visite',
  'Thierry Nzeutem',
  created_at + interval '1 hour'
FROM observations 
WHERE type = 'prescription' AND numero_observation IN ('PRES-2024-001', 'PRES-2024-002')
ON CONFLICT DO NOTHING;

INSERT INTO prescription_documents (prescription_id, nom_fichier, type_fichier, url_fichier, taille_ko, type_document, description, uploaded_by, created_at)
SELECT 
  id,
  'devis_travaux_' || numero_observation || '.pdf',
  'application/pdf',
  'https://example.com/devis.pdf',
  156,
  'devis',
  'Devis du prestataire pour les travaux de mise en conformité',
  'Thierry Nzeutem',
  created_at + interval '3 days'
FROM observations 
WHERE type = 'prescription' AND numero_observation = 'PRES-2024-002'
ON CONFLICT DO NOTHING;

INSERT INTO prescription_documents (prescription_id, nom_fichier, type_fichier, url_fichier, taille_ko, type_document, description, uploaded_by, created_at)
SELECT 
  id,
  'photo_apres_travaux_' || numero_observation || '.jpg',
  'image/jpeg',
  'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg',
  312,
  'photo_apres',
  'Photo après réalisation des travaux',
  'Thierry Nzeutem',
  created_at + interval '26 days'
FROM observations 
WHERE type = 'prescription' AND numero_observation = 'PRES-2024-003'
ON CONFLICT DO NOTHING;
