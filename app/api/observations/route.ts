// ============================================
// PREV'HUB - API Route Observations
// Gestion des observations terrain
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================
// GET - Liste des observations
// ============================================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const visite_id = searchParams.get('visite_id');
    const etablissement_id = searchParams.get('etablissement_id');
    const type = searchParams.get('type');
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('observations')
      .select(`
        *,
        visite:visites(id, date, etablissement:etablissements(id, nom_commercial)),
        etablissement:etablissements(id, nom_commercial, ville),
        auteur:profiles(id, nom, prenom)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (visite_id) {
      query = query.eq('visite_id', visite_id);
    }

    if (etablissement_id) {
      query = query.eq('etablissement_id', etablissement_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (statut) {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Erreur liste observations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des observations' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer une observation
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      priorite,
      titre,
      description,
      localisation,
      visite_id,
      etablissement_id,
      latitude,
      longitude,
      statut,
      photos,
    } = body;

    if (!titre || !description) {
      return NextResponse.json(
        { error: 'Titre et description requis' },
        { status: 400 }
      );
    }

    // Créer l'observation
    const { data: observation, error: createError } = await supabase
      .from('observations')
      .insert({
        type: type || 'generale',
        priorite: priorite || 'normale',
        titre,
        description,
        localisation,
        visite_id,
        etablissement_id,
        latitude,
        longitude,
        statut: statut || 'brouillon',
        auteur_id: user.id,
        metadata: {},
      })
      .select()
      .single();

    if (createError) throw createError;

    // Si des photos sont fournies, les uploader
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photoDataUrl = photos[i];
        
        // Convertir base64 en blob
        const base64Data = photoDataUrl.split(',')[1];
        const binaryData = Buffer.from(base64Data, 'base64');
        
        const filename = `observation-${observation.id}-${i + 1}.jpg`;
        const storagePath = `observations/${observation.id}/${filename}`;

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(storagePath, binaryData, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Erreur upload photo:', uploadError);
          continue;
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(storagePath);

        // Créer un document lié
        await supabase.from('documents').insert({
          nom: `Photo observation ${i + 1}`,
          description: titre,
          type: 'image',
          mime_type: 'image/jpeg',
          taille_octets: binaryData.length,
          url: urlData.publicUrl,
          storage_bucket: 'photos',
          storage_path: storagePath,
          entite_type: 'observation',
          entite_id: observation.id,
          uploaded_by: user.id,
          metadata: {
            observation_id: observation.id,
            index: i + 1,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: observation,
      message: 'Observation créée avec succès',
    });

  } catch (error) {
    console.error('Erreur création observation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'observation' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour une observation
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID observation requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('observations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('Erreur mise à jour observation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'observation' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Supprimer une observation
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID observation requis' },
        { status: 400 }
      );
    }

    // Supprimer les photos associées
    const { data: docs } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('entite_type', 'observation')
      .eq('entite_id', id);

    if (docs && docs.length > 0) {
      const paths = docs.map(d => d.storage_path);
      await supabase.storage.from('photos').remove(paths);
    }

    // Supprimer les documents
    await supabase
      .from('documents')
      .delete()
      .eq('entite_type', 'observation')
      .eq('entite_id', id);

    // Supprimer l'observation
    const { error } = await supabase
      .from('observations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Observation supprimée',
    });

  } catch (error) {
    console.error('Erreur suppression observation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'observation' },
      { status: 500 }
    );
  }
}
