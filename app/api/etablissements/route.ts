// ============================================
// PREV'HUB - API Route Établissements
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// ============================================
// GET - Liste des établissements
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const search = searchParams.get('search');
    const groupement_id = searchParams.get('groupement_id');
    const type_erp = searchParams.getAll('type_erp');
    const categorie_erp = searchParams.getAll('categorie_erp');
    const ville = searchParams.get('ville');
    const avec_alertes = searchParams.get('avec_alertes') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construction de la requête
    let query = supabase
      .from('etablissements')
      .select(`
        *,
        groupement:groupements(id, nom, type, code_groupement),
        prescriptions:prescriptions(id, statut, priorite, date_limite_conformite),
        installations_techniques:installations_techniques(
          id, nom, type_installation,
          verifications_periodiques(id, date_prochaine_verification, est_conforme)
        ),
        commissions:commissions(id, date, type, avis)
      `, { count: 'exact' })
      .eq('est_actif', true)
      .order('nom_commercial', { ascending: true });

    // Filtres
    if (search) {
      query = query.or(`nom_commercial.ilike.%${search}%,enseigne.ilike.%${search}%,adresse.ilike.%${search}%,ville.ilike.%${search}%`);
    }

    if (groupement_id) {
      query = query.eq('groupement_id', groupement_id);
    }

    if (type_erp.length > 0) {
      query = query.in('type_erp', type_erp);
    }

    if (categorie_erp.length > 0) {
      query = query.in('categorie_erp', categorie_erp.map(Number));
    }

    if (ville) {
      query = query.ilike('ville', `%${ville}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: etablissements, error, count } = await query;

    if (error) {
      console.error('Erreur lecture établissements:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des établissements' },
        { status: 500 }
      );
    }

    // Enrichissement avec calcul des alertes
    let enrichedEtablissements = etablissements?.map((etablissement) => {
      const now = new Date();

      // Prescriptions en retard
      const prescriptionsEnRetard = etablissement.prescriptions?.filter((p: any) => {
        if (!p.date_limite_conformite || ['leve', 'valide'].includes(p.statut)) return false;
        return new Date(p.date_limite_conformite) < now;
      }) || [];

      // Prescriptions urgentes (< 30 jours)
      const prescriptionsUrgentes = etablissement.prescriptions?.filter((p: any) => {
        if (!p.date_limite_conformite || ['leve', 'valide'].includes(p.statut)) return false;
        const echeance = new Date(p.date_limite_conformite);
        const joursRestants = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return joursRestants >= 0 && joursRestants <= 30;
      }) || [];

      // Vérifications en retard
      const verificationsEnRetard = etablissement.installations_techniques?.filter((i: any) => {
        const prochaine = i.verifications_periodiques?.[0]?.date_prochaine_verification;
        if (!prochaine) return false;
        return new Date(prochaine) < now;
      }) || [];

      const hasAlertes = prescriptionsEnRetard.length > 0 || verificationsEnRetard.length > 0;

      return {
        ...etablissement,
        _stats: {
          prescriptions_en_retard: prescriptionsEnRetard.length,
          prescriptions_urgentes: prescriptionsUrgentes.length,
          prescriptions_actives: etablissement.prescriptions?.filter((p: any) => 
            !['leve', 'valide'].includes(p.statut)
          ).length || 0,
          verifications_en_retard: verificationsEnRetard.length,
          installations_count: etablissement.installations_techniques?.length || 0,
        },
        _has_alertes: hasAlertes,
      };
    }) || [];

    // Filtre post-traitement pour les alertes
    if (avec_alertes) {
      enrichedEtablissements = enrichedEtablissements.filter((e) => e._has_alertes);
    }

    return NextResponse.json({
      data: enrichedEtablissements,
      count: avec_alertes ? enrichedEtablissements.length : count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Erreur API établissements GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer un établissement
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
    if (!body.nom_commercial && !body.enseigne) {
      return NextResponse.json(
        { error: 'Le nom commercial ou l\'enseigne est requis' },
        { status: 400 }
      );
    }

    // Génération du code établissement
    const code_etablissement = body.code_etablissement || await generateCodeEtablissement(supabase, body.type_erp);

    // Création de l'établissement
    const { data: etablissement, error } = await supabase
      .from('etablissements')
      .insert({
        nom_commercial: body.nom_commercial,
        enseigne: body.enseigne || body.nom_commercial,
        code_etablissement,
        type_erp: body.type_erp,
        categorie_erp: body.categorie_erp,
        groupement_id: body.groupement_id,
        adresse: body.adresse,
        code_postal: body.code_postal,
        ville: body.ville,
        latitude: body.latitude,
        longitude: body.longitude,
        telephone: body.telephone,
        email: body.email,
        exploitant_nom: body.exploitant_nom,
        exploitant_telephone: body.exploitant_telephone,
        exploitant_email: body.exploitant_email,
        effectif_public: body.effectif_public,
        effectif_personnel: body.effectif_personnel,
        surface: body.surface,
        nombre_niveaux: body.nombre_niveaux,
        activites: body.activites,
        observations: body.observations,
        societe_id: profile.societe_id,
        created_by: user.id,
        est_actif: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création établissement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'établissement' },
        { status: 500 }
      );
    }

    // Créer des installations techniques par défaut selon le type ERP
    await createDefaultInstallations(supabase, etablissement.id, body.type_erp, body.categorie_erp);

    return NextResponse.json(etablissement, { status: 201 });

  } catch (error) {
    console.error('Erreur API établissements POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour un établissement
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
        { error: 'ID de l\'établissement requis' },
        { status: 400 }
      );
    }

    // Champs modifiables
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'nom_commercial', 'enseigne', 'type_erp', 'categorie_erp', 'groupement_id',
      'adresse', 'code_postal', 'ville', 'latitude', 'longitude',
      'telephone', 'email', 'exploitant_nom', 'exploitant_telephone', 'exploitant_email',
      'effectif_public', 'effectif_personnel', 'surface', 'nombre_niveaux',
      'activites', 'observations', 'est_actif'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    updateData.updated_at = new Date().toISOString();

    const { data: etablissement, error } = await supabase
      .from('etablissements')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour établissement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'établissement' },
        { status: 500 }
      );
    }

    return NextResponse.json(etablissement);

  } catch (error) {
    console.error('Erreur API établissements PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Supprimer un établissement (soft delete)
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
        { error: 'ID de l\'établissement requis' },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas de prescriptions actives
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('id')
      .eq('etablissement_id', id)
      .not('statut', 'in', '(leve,valide)')
      .limit(1);

    if (prescriptions && prescriptions.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un établissement avec des prescriptions actives' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('etablissements')
      .update({
        est_actif: false,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression établissement:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'établissement' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur API établissements DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

async function generateCodeEtablissement(supabase: any, typeERP?: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = typeERP || 'ERP';

  // Compter les établissements de l'année
  const { count } = await supabase
    .from('etablissements')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);

  const numero = String((count || 0) + 1).padStart(4, '0');
  return `${prefix}-${year}-${numero}`;
}

async function createDefaultInstallations(
  supabase: any,
  etablissementId: string,
  typeERP?: string,
  categorieERP?: number
): Promise<void> {
  // Installations obligatoires selon la catégorie
  const installations = [];

  // Toujours requis
  installations.push({
    etablissement_id: etablissementId,
    nom: 'Extincteurs',
    type_installation: 'extincteurs',
    periodicite_mois: 12,
    est_actif: true,
  });

  installations.push({
    etablissement_id: etablissementId,
    nom: 'Éclairage de sécurité',
    type_installation: 'eclairage_securite',
    periodicite_mois: 12,
    est_actif: true,
  });

  // Catégorie 1 à 4 : installations supplémentaires
  if (categorieERP && categorieERP <= 4) {
    installations.push({
      etablissement_id: etablissementId,
      nom: 'Système de sécurité incendie (SSI)',
      type_installation: 'alarme',
      periodicite_mois: 12,
      est_actif: true,
    });

    installations.push({
      etablissement_id: etablissementId,
      nom: 'Désenfumage',
      type_installation: 'desenfumage',
      periodicite_mois: 12,
      est_actif: true,
    });
  }

  // Types spécifiques
  if (['U', 'J'].includes(typeERP || '')) {
    installations.push({
      etablissement_id: etablissementId,
      nom: 'Portes coupe-feu',
      type_installation: 'portes_cf',
      periodicite_mois: 12,
      est_actif: true,
    });
  }

  try {
    await supabase.from('installations_techniques').insert(installations);
  } catch (error) {
    console.error('Erreur création installations par défaut:', error);
  }
}
