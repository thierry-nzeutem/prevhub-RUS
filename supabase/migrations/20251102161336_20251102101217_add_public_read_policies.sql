/*
  # Ajouter des politiques de lecture publique

  1. Modifications
    - Ajouter des politiques pour permettre la lecture publique (anon) des données
    - Les données de groupements, établissements et observations doivent être lisibles sans authentification
  
  2. Sécurité
    - Lecture publique autorisée pour toutes les tables principales
    - Les opérations d'écriture restent réservées aux utilisateurs authentifiés
*/

-- Supprimer et recréer les politiques pour les groupements
DROP POLICY IF EXISTS "Public users can read groupements" ON groupements;
CREATE POLICY "Public users can read groupements"
  ON groupements
  FOR SELECT
  TO anon
  USING (true);

-- Supprimer et recréer les politiques pour les établissements
DROP POLICY IF EXISTS "Public users can read etablissements" ON etablissements;
CREATE POLICY "Public users can read etablissements"
  ON etablissements
  FOR SELECT
  TO anon
  USING (true);

-- Supprimer et recréer les politiques pour les observations
DROP POLICY IF EXISTS "Public users can read observations" ON observations;
CREATE POLICY "Public users can read observations"
  ON observations
  FOR SELECT
  TO anon
  USING (true);

-- Supprimer et recréer les politiques pour les visites
DROP POLICY IF EXISTS "Public users can read visites" ON visites;
CREATE POLICY "Public users can read visites"
  ON visites
  FOR SELECT
  TO anon
  USING (true);