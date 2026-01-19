// ============================================
// PREV'HUB - API Documents Upload
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ============================================
// Configuration
// ============================================

const ALLOWED_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  photos: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
  ],
  rapports: [
    'application/pdf',
  ],
  avatars: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
};

const MAX_SIZES = {
  documents: 20 * 1024 * 1024, // 20 Mo
  photos: 10 * 1024 * 1024, // 10 Mo
  rapports: 50 * 1024 * 1024, // 50 Mo
  avatars: 2 * 1024 * 1024, // 2 Mo
};

type BucketType = keyof typeof ALLOWED_TYPES;

// ============================================
// POST - Upload de fichier
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le formdata
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as BucketType | null;
    const entite_type = formData.get('entite_type') as string | null;
    const entite_id = formData.get('entite_id') as string | null;
    const description = formData.get('description') as string | null;

    // Validations
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!bucket || !ALLOWED_TYPES[bucket]) {
      return NextResponse.json(
        { error: 'Bucket invalide. Valeurs autorisées: documents, photos, rapports, avatars' },
        { status: 400 }
      );
    }

    // Vérification du type de fichier
    if (!ALLOWED_TYPES[bucket].includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé pour ${bucket}` },
        { status: 400 }
      );
    }

    // Vérification de la taille
    if (file.size > MAX_SIZES[bucket]) {
      const maxSizeMo = MAX_SIZES[bucket] / (1024 * 1024);
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${maxSizeMo} Mo)` },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    
    const filePath = `${user.id}/${timestamp}-${randomSuffix}-${sanitizedName}`;

    // Convertir le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur upload storage:', uploadError);
      return NextResponse.json(
        { error: `Erreur upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique ou signée
    let publicUrl: string;
    
    if (bucket === 'avatars') {
      // Avatars publics
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      publicUrl = urlData.publicUrl;
    } else {
      // Autres fichiers: URL signée (1 heure)
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600);
      
      if (signedError) {
        console.error('Erreur génération URL signée:', signedError);
        return NextResponse.json(
          { error: 'Erreur génération URL' },
          { status: 500 }
        );
      }
      publicUrl = signedUrlData.signedUrl;
    }

    // Enregistrer dans la table documents
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        nom: file.name,
        description: description || null,
        type: getDocumentType(file.type),
        mime_type: file.type,
        taille_octets: file.size,
        url: publicUrl,
        storage_bucket: bucket,
        storage_path: filePath,
        entite_type: entite_type || null,
        entite_id: entite_id || null,
        uploaded_by: user.id,
        metadata: {
          original_name: file.name,
          upload_date: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erreur insertion document:', dbError);
      // Supprimer le fichier uploadé en cas d'erreur DB
      await supabase.storage.from(bucket).remove([filePath]);
      return NextResponse.json(
        { error: 'Erreur enregistrement document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: document.id,
        name: document.nom,
        url: publicUrl,
        size: document.taille_octets,
        type: document.mime_type,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur API documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Liste des documents
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Paramètres
    const entite_type = searchParams.get('entite_type');
    const entite_id = searchParams.get('entite_id');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construction requête
    let query = supabase
      .from('documents')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entite_type) {
      query = query.eq('entite_type', entite_type);
    }

    if (entite_id) {
      query = query.eq('entite_id', entite_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur fetch documents:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Régénérer les URLs signées si expirées
    const documentsWithFreshUrls = await Promise.all(
      (data || []).map(async (doc) => {
        if (doc.storage_bucket !== 'avatars') {
          const { data: signedUrlData } = await supabase.storage
            .from(doc.storage_bucket)
            .createSignedUrl(doc.storage_path, 3600);
          
          if (signedUrlData) {
            return { ...doc, url: signedUrlData.signedUrl };
          }
        }
        return doc;
      })
    );

    return NextResponse.json({ data: documentsWithFreshUrls });
  } catch (error) {
    console.error('Erreur API documents GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Supprimer un document
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer le document
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur peut supprimer (uploadeur ou admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (document.uploaded_by !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    // Supprimer du storage
    const { error: storageError } = await supabase.storage
      .from(document.storage_bucket)
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Erreur suppression storage:', storageError);
    }

    // Soft delete dans la base
    const { error: dbError } = await supabase
      .from('documents')
      .update({
        actif: false,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id);

    if (dbError) {
      console.error('Erreur soft delete document:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API documents DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

function getDocumentType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'text/csv') return 'csv';
  if (mimeType === 'text/plain') return 'text';
  return 'autre';
}
