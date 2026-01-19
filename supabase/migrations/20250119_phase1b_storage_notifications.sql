-- ============================================
-- PREV'HUB - Migration Phase 1b
-- Storage Buckets + Tables Notifications/Alertes
-- ============================================

-- ============================================
-- 1. CRÉATION DES BUCKETS STORAGE
-- ============================================

-- Bucket pour les documents (PDF, Word, Excel)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520, -- 20 Mo
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket pour les photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  false,
  10485760, -- 10 Mo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket pour les rapports générés
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rapports',
  'rapports',
  false,
  52428800, -- 50 Mo
  ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket pour les avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 Mo
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. POLICIES STORAGE
-- ============================================

-- Documents: accès selon société
CREATE POLICY "documents_select_policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (
      -- L'utilisateur qui a uploadé
      (storage.foldername(name))[1] = auth.uid()::text OR
      -- Ou membre de la même société
      EXISTS (
        SELECT 1 FROM public.profiles p1
        JOIN public.profiles p2 ON p1.societe_id = p2.societe_id
        WHERE p1.id = auth.uid()
        AND p2.id = (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "documents_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "documents_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Photos: même logique que documents
CREATE POLICY "photos_select_policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "photos_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "photos_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos' AND
    auth.uid() IS NOT NULL AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'secretariat')
      )
    )
  );

-- Rapports: accès selon société
CREATE POLICY "rapports_select_policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rapports' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "rapports_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rapports' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars: public en lecture, utilisateur en écriture
CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- 3. TABLE NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type et canal
  type VARCHAR(50) NOT NULL,
  canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'sms', 'push', 'in_app')),
  
  -- Destinataire
  destinataire_id UUID REFERENCES public.profiles(id),
  destinataire_email VARCHAR(255),
  destinataire_telephone VARCHAR(20),
  
  -- Contenu
  sujet VARCHAR(255),
  contenu TEXT,
  
  -- Statut
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'envoye', 'echec', 'lu')),
  message_id VARCHAR(255), -- ID externe (Resend, Twilio)
  erreur TEXT,
  
  -- Lecture (pour in_app)
  lu BOOLEAN DEFAULT false,
  lu_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire ON public.notifications(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_statut ON public.notifications(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- 4. TABLE ALERTES
-- ============================================

CREATE TABLE IF NOT EXISTS public.alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type d'alerte
  type VARCHAR(50) NOT NULL CHECK (type IN ('prescription', 'commission', 'verification', 'document', 'autre')),
  niveau VARCHAR(20) NOT NULL CHECK (niveau IN ('critique', 'urgent', 'attention', 'info')),
  
  -- Entité concernée
  entite_type VARCHAR(50) NOT NULL,
  entite_id UUID NOT NULL,
  
  -- Contenu
  message TEXT NOT NULL,
  jours_restants INTEGER,
  
  -- Statut
  statut VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'traitee', 'ignoree', 'expiree')),
  traitee_par UUID REFERENCES public.profiles(id),
  traitee_at TIMESTAMP WITH TIME ZONE,
  commentaire_traitement TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(entite_type, entite_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_alertes_type ON public.alertes(type);
CREATE INDEX IF NOT EXISTS idx_alertes_niveau ON public.alertes(niveau);
CREATE INDEX IF NOT EXISTS idx_alertes_statut ON public.alertes(statut);
CREATE INDEX IF NOT EXISTS idx_alertes_entite ON public.alertes(entite_type, entite_id);
CREATE INDEX IF NOT EXISTS idx_alertes_created ON public.alertes(created_at DESC);

-- ============================================
-- 5. POLICIES RLS NOTIFICATIONS
-- ============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins voient tout
CREATE POLICY "notifications_admin" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Utilisateurs voient leurs notifications
CREATE POLICY "notifications_own" ON public.notifications
  FOR SELECT USING (destinataire_id = auth.uid());

-- Marquer comme lu ses propres notifications
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (destinataire_id = auth.uid())
  WITH CHECK (destinataire_id = auth.uid());

-- ============================================
-- 6. POLICIES RLS ALERTES
-- ============================================

ALTER TABLE public.alertes ENABLE ROW LEVEL SECURITY;

-- Admins et secrétariat voient toutes les alertes
CREATE POLICY "alertes_admin_secretariat" ON public.alertes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'secretariat')
    )
  );

-- Préventionnistes voient les alertes
CREATE POLICY "alertes_preventionniste_select" ON public.alertes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'preventionniste'
    )
  );

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger updated_at pour notifications
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at pour alertes
CREATE TRIGGER alertes_updated_at
  BEFORE UPDATE ON public.alertes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. VUES UTILES
-- ============================================

-- Vue des alertes actives avec détails
CREATE OR REPLACE VIEW public.v_alertes_actives AS
SELECT 
  a.*,
  CASE 
    WHEN a.entite_type = 'prescription' THEN (
      SELECT jsonb_build_object(
        'numero', p.numero_prescription,
        'etablissement', e.nom_commercial,
        'priorite', p.priorite
      )
      FROM public.prescriptions p
      LEFT JOIN public.etablissements e ON p.etablissement_id = e.id
      WHERE p.id = a.entite_id
    )
    WHEN a.entite_type = 'commission' THEN (
      SELECT jsonb_build_object(
        'date', c.date,
        'type', c.type,
        'etablissement', e.nom_commercial
      )
      FROM public.commissions c
      LEFT JOIN public.etablissements e ON c.etablissement_id = e.id
      WHERE c.id = a.entite_id
    )
    WHEN a.entite_type = 'verification' THEN (
      SELECT jsonb_build_object(
        'installation', i.nom,
        'type', i.type_installation,
        'etablissement', e.nom_commercial
      )
      FROM public.verifications_periodiques v
      JOIN public.installations i ON v.installation_id = i.id
      LEFT JOIN public.etablissements e ON i.etablissement_id = e.id
      WHERE v.id = a.entite_id
    )
  END AS details
FROM public.alertes a
WHERE a.statut = 'active'
ORDER BY 
  CASE a.niveau 
    WHEN 'critique' THEN 1
    WHEN 'urgent' THEN 2
    WHEN 'attention' THEN 3
    ELSE 4
  END,
  a.jours_restants ASC NULLS LAST;

-- Vue compteur alertes par niveau
CREATE OR REPLACE VIEW public.v_alertes_compteur AS
SELECT 
  type,
  niveau,
  COUNT(*) as count
FROM public.alertes
WHERE statut = 'active'
GROUP BY type, niveau
ORDER BY type, niveau;

-- ============================================
-- 9. FONCTION DE NETTOYAGE
-- ============================================

-- Fonction pour nettoyer les vieilles alertes et notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les notifications de plus de 90 jours
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Marquer les alertes expirées
  UPDATE public.alertes
  SET statut = 'expiree', updated_at = NOW()
  WHERE statut = 'active'
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Supprimer les alertes de plus de 180 jours
  DELETE FROM public.alertes
  WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, UPDATE ON public.alertes TO authenticated;
GRANT SELECT ON public.v_alertes_actives TO authenticated;
GRANT SELECT ON public.v_alertes_compteur TO authenticated;
