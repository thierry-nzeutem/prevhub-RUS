// ============================================
// PREV'HUB - API Route Groupements
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// ============================================
// GET - Liste des groupements
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const avec_etablissements = searchParams.get('avec_etablissements') === 'true';
    const avec_prescriptions = searchParams.get('avec_prescriptions') === 'true';
    const avec_commissions = searchParams.get('avec_commissions') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construction de la requête
    let query = supabase
      .from('groupements')
      .select(`
        *,
        societe:societes(id, raison_sociale),
        etablissements:etablissements(id, nom_commercial, type_erp, categorie_erp, ville),
        commissions:commissions(id, date, type, avis),
        prescriptions:prescriptions(id, statut, priorite, date_limite_conformite)
      `, { count: 'exact' })
      .eq('est_actif', true)
      .order('nom', { ascending: true });

    // Filtres
    if (search) {
      query = query.or(`nom.ilike.%${search}%,code_groupement.ilike.%${search}%,ville.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: groupements, error, count } = await query;

    if (error) {
      console.error('Erreur lecture groupements:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des groupements' },
        { status: 500 }
      );
    }

    // Enrichissement des données
    const enrichedGroupements = groupements?.map((groupement) => {
      const prescriptionsActives = groupement.prescriptions?.filter(
        (p: any) => !['leve', 'valide'].includes(p.statut)
      ) || [];
      
      const prescriptionsEnRetard = prescriptionsActives.filter((p: any) => {
        if (!p.date_limite_conformite) return false;
        return new Date(p.date_limite_conformite) < new Date();
      });

      const commissionsAVenir = groupement.commissions?.filter((c: any) => {
        if (!c.date) return false;
        return new Date(c.date) >= new Date();
      }) || [];

      return {
        ...groupement,
        _stats: {
          etablissements_count: groupement.etablissements?.length || 0,
          prescriptions_actives: prescriptionsActives.length,
          prescriptions_en_retard: prescriptionsEnRetard.length,
          commissions_a_venir: commissionsAVenir.length,
        },
        // Optionnellement exclure les relations volumineuses
        etablissements: avec_etablissements ? groupement.etablissements : undefined,
        prescriptions: avec_prescriptions ? groupement.prescriptions : undefined,
        commissions: avec_commissions ? groupement.commissions : undefined,
      };
    });

    return NextResponse.json({
      data: enrichedGroupements,
      count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Erreur API groupements GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer un groupement
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

    if (!profile || !['admin', 'secretariat'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Validation des champs requis
    if (!body.nom) {
      return NextResponse.json(
        { error: 'Le nom du groupement est requis' },
        { status: 400 }
      );
    }

    // Génération du code groupement si non fourni
    const code_groupement = body.code_groupement || await generateCodeGroupement(supabase);

    // Création du groupement
    const { data: groupement, error } = await supabase
      .from('groupements')
      .insert({
        nom: body.nom,
        code_groupement,
        type: body.type,
        adresse: body.adresse,
        code_postal: body.code_postal,
        ville: body.ville,
        telephone: body.telephone,
        email: body.email,
        contact_principal: body.contact_principal,
        siret: body.siret,
        notes: body.notes,
        societe_id: profile.societe_id,
        created_by: user.id,
        est_actif: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création groupement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du groupement' },
        { status: 500 }
      );
    }

    return NextResponse.json(groupement, { status: 201 });

  } catch (error) {
    console.error('Erreur API groupements POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour un groupement
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

    // Vérification du rôle
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'secretariat'].includes(profile.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID du groupement requis' },
        { status: 400 }
      );
    }

    // Champs modifiables
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'nom', 'code_groupement', 'type', 'adresse', 'code_postal', 'ville',
      'telephone', 'email', 'contact_principal', 'siret', 'notes', 'est_actif'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    updateData.updated_at = new Date().toISOString();

    const { data: groupement, error } = await supabase
      .from('groupements')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour groupement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du groupement' },
        { status: 500 }
      );
    }

    return NextResponse.json(groupement);

  } catch (error) {
    console.error('Erreur API groupements PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Supprimer un groupement (soft delete)
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

    // Vérification du rôle (admin uniquement)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID du groupement requis' },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas d'établissements actifs
    const { data: etablissements } = await supabase
      .from('etablissements')
      .select('id')
      .eq('groupement_id', id)
      .eq('est_actif', true)
      .limit(1);

    if (etablissements && etablissements.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un groupement avec des établissements actifs' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('groupements')
      .update({
        est_actif: false,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression groupement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du groupement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API groupements DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

async function generateCodeGroupement(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Compter les groupements du mois
  const { count } = await supabase
    .from('groupements')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-${month}-01`);

  const numero = String((count || 0) + 1).padStart(3, '0');
  return `GRP-${year}${month}-${numero}`;
}
