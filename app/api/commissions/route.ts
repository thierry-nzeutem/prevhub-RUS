// ============================================
// PREV'HUB - API Route Commissions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// ============================================
// GET - Liste des commissions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const etablissement_id = searchParams.get('etablissement_id');
    const groupement_id = searchParams.get('groupement_id');
    const type = searchParams.get('type');
    const avis = searchParams.getAll('avis');
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');
    const a_preparer = searchParams.get('a_preparer') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construction de la requête
    let query = supabase
      .from('commissions')
      .select(`
        *,
        etablissement:etablissements(
          id, nom_commercial, enseigne, adresse, ville,
          type_erp, categorie_erp
        ),
        groupement:groupements(id, nom, type),
        prescriptions:prescriptions(
          id, numero_prescription, description_complete, description_reformulee,
          priorite, criticite, statut, date_limite_conformite
        )
      `, { count: 'exact' })
      .order('date', { ascending: false });

    // Filtres
    if (etablissement_id) {
      query = query.eq('etablissement_id', etablissement_id);
    }

    if (groupement_id) {
      query = query.eq('groupement_id', groupement_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (avis.length > 0) {
      query = query.in('avis', avis);
    }

    if (date_debut) {
      query = query.gte('date', date_debut);
    }

    if (date_fin) {
      query = query.lte('date', date_fin);
    }

    // Filtre "à préparer" (commissions à venir dans les 45 jours)
    if (a_preparer) {
      const today = new Date();
      const in45Days = new Date();
      in45Days.setDate(today.getDate() + 45);
      query = query
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', in45Days.toISOString().split('T')[0]);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: commissions, error, count } = await query;

    if (error) {
      console.error('Erreur lecture commissions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des commissions' },
        { status: 500 }
      );
    }

    // Enrichissement
    const now = new Date();
    const enrichedCommissions = commissions?.map((commission) => {
      const dateCommission = new Date(commission.date);
      const joursRestants = Math.ceil((dateCommission.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const prescriptionsActives = commission.prescriptions?.filter(
        (p: any) => !['leve', 'valide'].includes(p.statut)
      ) || [];

      const prescriptionsLevees = commission.prescriptions?.filter(
        (p: any) => p.statut === 'leve'
      ) || [];

      return {
        ...commission,
        _jours_restants: joursRestants,
        _is_passed: joursRestants < 0,
        _is_urgent: joursRestants >= 0 && joursRestants <= 15,
        _is_warning: joursRestants > 15 && joursRestants <= 30,
        _prescriptions_actives: prescriptionsActives.length,
        _prescriptions_levees: prescriptionsLevees.length,
        _prescriptions_total: commission.prescriptions?.length || 0,
        _taux_levee: commission.prescriptions?.length
          ? Math.round((prescriptionsLevees.length / commission.prescriptions.length) * 100)
          : 100,
      };
    });

    return NextResponse.json({
      data: enrichedCommissions,
      count,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Erreur API commissions GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer une commission
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

    // Validation
    if (!body.date) {
      return NextResponse.json(
        { error: 'La date de la commission est requise' },
        { status: 400 }
      );
    }

    if (!body.etablissement_id && !body.groupement_id) {
      return NextResponse.json(
        { error: 'Un établissement ou un groupement est requis' },
        { status: 400 }
      );
    }

    // Génération du numéro de commission
    const numero_commission = await generateNumeroCommission(supabase);

    // Création de la commission
    const { data: commission, error } = await supabase
      .from('commissions')
      .insert({
        numero_commission,
        date: body.date,
        heure: body.heure,
        type: body.type || 'securite',
        sous_type: body.sous_type,
        lieu: body.lieu,
        avis: body.avis,
        observations: body.observations,
        etablissement_id: body.etablissement_id,
        groupement_id: body.groupement_id,
        participants: body.participants,
        pv_url: body.pv_url,
        documents: body.documents,
        societe_id: profile.societe_id,
        created_by: user.id,
      })
      .select(`
        *,
        etablissement:etablissements(id, nom_commercial, ville),
        groupement:groupements(id, nom)
      `)
      .single();

    if (error) {
      console.error('Erreur création commission:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commission' },
        { status: 500 }
      );
    }

    // Créer des alertes pour le secrétariat
    await createCommissionAlerts(supabase, commission);

    return NextResponse.json(commission, { status: 201 });

  } catch (error) {
    console.error('Erreur API commissions POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour une commission
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
        { error: 'ID de la commission requis' },
        { status: 400 }
      );
    }

    // Champs modifiables
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'date', 'heure', 'type', 'sous_type', 'lieu',
      'avis', 'observations', 'etablissement_id', 'groupement_id',
      'participants', 'pv_url', 'documents'
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    updateData.updated_at = new Date().toISOString();

    // Charger l'ancienne commission pour comparer l'avis
    const { data: oldCommission } = await supabase
      .from('commissions')
      .select('avis')
      .eq('id', body.id)
      .single();

    const { data: commission, error } = await supabase
      .from('commissions')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        etablissement:etablissements(id, nom_commercial, ville),
        groupement:groupements(id, nom),
        prescriptions:prescriptions(id, statut, priorite)
      `)
      .single();

    if (error) {
      console.error('Erreur mise à jour commission:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la commission' },
        { status: 500 }
      );
    }

    // Si l'avis a changé, créer des notifications
    if (body.avis && oldCommission?.avis !== body.avis) {
      await handleAvisChange(supabase, commission, oldCommission?.avis, body.avis);
    }

    return NextResponse.json(commission);

  } catch (error) {
    console.error('Erreur API commissions PATCH:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Saisie des prescriptions d'une commission
// ============================================

export async function PUT(request: NextRequest) {
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

    if (!body.commission_id || !body.prescriptions || !Array.isArray(body.prescriptions)) {
      return NextResponse.json(
        { error: 'commission_id et prescriptions sont requis' },
        { status: 400 }
      );
    }

    // Charger la commission
    const { data: commission } = await supabase
      .from('commissions')
      .select('id, date, etablissement_id, groupement_id')
      .eq('id', body.commission_id)
      .single();

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission non trouvée' },
        { status: 404 }
      );
    }

    // Créer les prescriptions
    const prescriptionsToInsert = body.prescriptions.map((p: any, index: number) => ({
      commission_id: body.commission_id,
      etablissement_id: p.etablissement_id || commission.etablissement_id,
      groupement_id: p.groupement_id || commission.groupement_id,
      numero_prescription: generateNumeroPrescription(commission.date, index + 1),
      description_complete: p.description_complete,
      type_intervention: p.type_intervention,
      priorite: p.priorite || 'normale',
      criticite: p.criticite,
      date_limite_conformite: p.date_limite_conformite,
      articles_reglementaires: p.articles_reglementaires,
      localisation: p.localisation,
      statut: 'nouveau',
      societe_id: profile.societe_id,
      created_by: user.id,
    }));

    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .insert(prescriptionsToInsert)
      .select();

    if (error) {
      console.error('Erreur création prescriptions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création des prescriptions' },
        { status: 500 }
      );
    }

    // Déclencher l'enrichissement IA en arrière-plan
    // (appel async sans attendre)
    prescriptions.forEach((p) => {
      enrichPrescriptionWithAI(supabase, p.id).catch(console.error);
    });

    return NextResponse.json({
      message: `${prescriptions.length} prescription(s) créée(s)`,
      prescriptions,
    });

  } catch (error) {
    console.error('Erreur API commissions PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

async function generateNumeroCommission(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  
  const { count } = await supabase
    .from('commissions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);

  const numero = String((count || 0) + 1).padStart(4, '0');
  return `COM-${year}-${numero}`;
}

function generateNumeroPrescription(commissionDate: string, index: number): string {
  const date = new Date(commissionDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `P-${year}${month}-${String(index).padStart(3, '0')}`;
}

async function createCommissionAlerts(supabase: any, commission: any): Promise<void> {
  try {
    const dateCommission = new Date(commission.date);
    const now = new Date();
    const joursAvant = Math.ceil((dateCommission.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Créer des alertes pour J-30, J-15, J-7, J-1
    const alerteDates = [
      { jours: 30, niveau: 'attention' },
      { jours: 15, niveau: 'urgent' },
      { jours: 7, niveau: 'critique' },
      { jours: 1, niveau: 'critique' },
    ];

    for (const alerte of alerteDates) {
      if (joursAvant > alerte.jours) {
        const dateAlerte = new Date(dateCommission);
        dateAlerte.setDate(dateAlerte.getDate() - alerte.jours);

        await supabase.from('alertes').insert({
          type: 'commission',
          niveau: alerte.niveau,
          entite_type: 'commission',
          entite_id: commission.id,
          titre: `Commission dans ${alerte.jours} jour${alerte.jours > 1 ? 's' : ''}`,
          message: `La commission du ${commission.date} pour ${commission.etablissement?.nom_commercial || commission.groupement?.nom} approche.`,
          date_echeance: commission.date,
          date_declenchement: dateAlerte.toISOString().split('T')[0],
          est_active: true,
        });
      }
    }
  } catch (error) {
    console.error('Erreur création alertes commission:', error);
  }
}

async function handleAvisChange(
  supabase: any,
  commission: any,
  oldAvis: string | null,
  newAvis: string
): Promise<void> {
  try {
    // Notification pour le changement d'avis
    await supabase.from('notifications').insert({
      type: 'avis_commission',
      titre: `Avis de commission : ${newAvis}`,
      message: `La commission du ${commission.date} pour ${commission.etablissement?.nom_commercial || commission.groupement?.nom} a reçu un avis ${newAvis}${oldAvis ? ` (précédemment ${oldAvis})` : ''}.`,
      lien: `/commissions/${commission.id}`,
      priorite: newAvis === 'defavorable' ? 'haute' : 'normale',
    });

    // Si avis défavorable, créer des alertes sur les prescriptions
    if (newAvis === 'defavorable') {
      const prescriptionsActives = commission.prescriptions?.filter(
        (p: any) => !['leve', 'valide'].includes(p.statut)
      );

      if (prescriptionsActives?.length > 0) {
        await supabase.from('alertes').insert({
          type: 'prescription',
          niveau: 'critique',
          entite_type: 'commission',
          entite_id: commission.id,
          titre: 'Avis défavorable - Actions urgentes requises',
          message: `${prescriptionsActives.length} prescription(s) à traiter suite à l'avis défavorable.`,
          est_active: true,
        });
      }
    }
  } catch (error) {
    console.error('Erreur gestion changement avis:', error);
  }
}

async function enrichPrescriptionWithAI(supabase: any, prescriptionId: string): Promise<void> {
  // Appel à l'API prescriptions pour déclencher l'enrichissement IA
  // Cette fonction est appelée en arrière-plan
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/prescriptions/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescription_id: prescriptionId }),
    });
    
    if (!response.ok) {
      console.error('Erreur enrichissement IA:', await response.text());
    }
  } catch (error) {
    console.error('Erreur appel enrichissement IA:', error);
  }
}
