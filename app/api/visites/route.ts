// ============================================
// PREV'HUB - API Route Visites
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// ============================================
// GET - Liste des visites
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const preventionniste_id = searchParams.get('preventionniste_id');
    const etablissement_id = searchParams.get('etablissement_id');
    const groupement_id = searchParams.get('groupement_id');
    const statut = searchParams.getAll('statut');
    const type_visite = searchParams.get('type_visite');
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');
    const today_only = searchParams.get('today_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construction de la requête
    let query = supabase
      .from('visites')
      .select(`
        *,
        etablissement:etablissements(
          id, nom_commercial, enseigne, adresse, code_postal, ville,
          type_erp, categorie_erp, latitude, longitude
        ),
        groupement:groupements(id, nom, type),
        preventionniste:profiles!visites_preventionniste_id_fkey(
          id, prenom, nom, email, telephone
        ),
        observations:observations(id, contenu, type, created_at)
      `, { count: 'exact' })
      .order('date_visite', { ascending: false })
      .order('heure_debut', { ascending: true });

    // Filtres
    if (preventionniste_id) {
      query = query.eq('preventionniste_id', preventionniste_id);
    }

    if (etablissement_id) {
      query = query.eq('etablissement_id', etablissement_id);
    }

    if (groupement_id) {
      query = query.eq('groupement_id', groupement_id);
    }

    if (statut.length > 0) {
      query = query.in('statut', statut);
    }

    if (type_visite) {
      query = query.eq('type_visite', type_visite);
    }

    // Filtre aujourd'hui
    if (today_only) {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('date_visite', today);
    } else {
      // Filtre plage de dates
      if (date_debut) {
        query = query.gte('date_visite', date_debut);
      }
      if (date_fin) {
        query = query.lte('date_visite', date_fin);
      }
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: visites, error, count } = await query;

    if (error) {
      console.error('Erreur lecture visites:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des visites' },
        { status: 500 }
      );
    }

    // Enrichissement
    const enrichedVisites = visites?.map((visite) => {
      // Calculer la durée si dates de début/fin sont présentes
      let duree_minutes = null;
      if (visite.heure_debut && visite.heure_fin) {
        const [hd, md] = visite.heure_debut.split(':').map(Number);
        const [hf, mf] = visite.heure_fin.split(':').map(Number);
        duree_minutes = (hf * 60 + mf) - (hd * 60 + md);
      }

      return {
        ...visite,
        _duree_minutes: duree_minutes,
        _observations_count: visite.observations?.length || 0,
      };
    });

    return NextResponse.json({
      data: enrichedVisites,
      count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Erreur API visites GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer une visite
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification du rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, societe_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'secretariat', 'preventionniste'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Validation
    if (!body.date_visite) {
      return NextResponse.json(
        { error: 'La date de visite est requise' },
        { status: 400 }
      );
    }

    if (!body.etablissement_id && !body.groupement_id) {
      return NextResponse.json(
        { error: 'Un établissement ou un groupement est requis' },
        { status: 400 }
      );
    }

    // Génération du numéro de visite
    const numero_visite = await generateNumeroVisite(supabase);

    // Création de la visite
    const { data: visite, error } = await supabase
      .from('visites')
      .insert({
        numero_visite,
        date_visite: body.date_visite,
        heure_debut: body.heure_debut,
        heure_fin: body.heure_fin,
        type_visite: body.type_visite || 'prevention',
        statut: body.statut || 'planifiee',
        etablissement_id: body.etablissement_id,
        groupement_id: body.groupement_id,
        preventionniste_id: body.preventionniste_id || user.id,
        motif: body.motif,
        objectifs: body.objectifs,
        participants: body.participants,
        conditions_acces: body.conditions_acces,
        notes_preparation: body.notes_preparation,
        societe_id: profile.societe_id,
        created_by: user.id,
      })
      .select(`
        *,
        etablissement:etablissements(id, nom_commercial, adresse, ville),
        groupement:groupements(id, nom),
        preventionniste:profiles!visites_preventionniste_id_fkey(id, prenom, nom)
      `)
      .single();

    if (error) {
      console.error('Erreur création visite:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la visite' },
        { status: 500 }
      );
    }

    return NextResponse.json(visite, { status: 201 });

  } catch (error) {
    console.error('Erreur API visites POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour une visite
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID de la visite requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur peut modifier cette visite
    const { data: visite } = await supabase
      .from('visites')
      .select('preventionniste_id')
      .eq('id', body.id)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canEdit = 
      profile?.role === 'admin' || 
      profile?.role === 'secretariat' ||
      visite?.preventionniste_id === user.id;

    if (!canEdit) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Champs modifiables
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'date_visite', 'heure_debut', 'heure_fin', 'type_visite', 'statut',
      'etablissement_id', 'groupement_id', 'preventionniste_id',
      'motif', 'objectifs', 'participants', 'conditions_acces',
      'notes_preparation', 'conclusion', 'recommandations',
      'signature_preventionniste', 'signature_exploitant',
      'latitude_debut', 'longitude_debut', 'latitude_fin', 'longitude_fin',
      'photos', 'documents'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Gestion des transitions de statut
    if (body.statut === 'en_cours' && !body.heure_debut_effective) {
      updateData.heure_debut_effective = new Date().toISOString();
    }
    if (body.statut === 'terminee' && !body.heure_fin_effective) {
      updateData.heure_fin_effective = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedVisite, error } = await supabase
      .from('visites')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        etablissement:etablissements(id, nom_commercial, adresse, ville),
        groupement:groupements(id, nom),
        preventionniste:profiles!visites_preventionniste_id_fkey(id, prenom, nom)
      `)
      .single();

    if (error) {
      console.error('Erreur mise à jour visite:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la visite' },
        { status: 500 }
      );
    }

    // Si la visite est terminée, créer le rapport
    if (body.statut === 'terminee') {
      await handleVisiteTerminee(supabase, updatedVisite, user.id);
    }

    return NextResponse.json(updatedVisite);

  } catch (error) {
    console.error('Erreur API visites PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Annuler une visite
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la visite requis' },
        { status: 400 }
      );
    }

    // Vérification droits
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'secretariat'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Annulation (pas de suppression réelle)
    const { error } = await supabase
      .from('visites')
      .update({
        statut: 'annulee',
        annulee_par: user.id,
        annulee_le: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur annulation visite:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation de la visite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API visites DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

async function generateNumeroVisite(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Compter les visites du mois
  const { count } = await supabase
    .from('visites')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-${month}-01`);

  const numero = String((count || 0) + 1).padStart(4, '0');
  return `V-${year}${month}-${numero}`;
}

async function handleVisiteTerminee(supabase: any, visite: any, userId: string): Promise<void> {
  try {
    // Charger les observations de la visite
    const { data: observations } = await supabase
      .from('observations')
      .select('*')
      .eq('visite_id', visite.id);

    // Créer une notification pour le secrétariat
    await supabase.from('notifications').insert({
      user_id: null, // Sera distribué à tous les secrétariats
      type: 'visite_terminee',
      titre: `Visite terminée : ${visite.etablissement?.nom_commercial || visite.groupement?.nom}`,
      message: `La visite du ${visite.date_visite} a été terminée par ${visite.preventionniste?.prenom} ${visite.preventionniste?.nom}. ${observations?.length || 0} observation(s) enregistrée(s).`,
      lien: `/visites/${visite.id}`,
      priorite: 'normale',
    });

    // Mettre à jour les statistiques du préventionniste
    // (à implémenter selon les besoins)

  } catch (error) {
    console.error('Erreur post-traitement visite terminée:', error);
  }
}
