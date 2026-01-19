// ============================================
// PREV'HUB - API Prescriptions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';

// ============================================
// GET - Liste des prescriptions
// ============================================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const statut = searchParams.getAll('statut');
    const priorite = searchParams.getAll('priorite');
    const groupement_id = searchParams.get('groupement_id');
    const etablissement_id = searchParams.get('etablissement_id');
    const commission_id = searchParams.get('commission_id');
    const en_retard = searchParams.get('en_retard') === 'true';
    const recherche = searchParams.get('recherche');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        commission:commissions(id, date, avis, type),
        etablissement:etablissements(id, nom_commercial, enseigne, adresse, ville),
        groupement:groupements(id, nom),
        prestataire_recommande:societes!prestataire_recommande_id(id, raison_sociale),
        prestataire_effectif:societes!prestataire_effectif_id(id, raison_sociale),
        responsable_suivi:profiles!responsable_suivi_id(id, prenom, nom)
      `, { count: 'exact' })
      .order('date_limite_conformite', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Filtres
    if (statut.length > 0) {
      query = query.in('statut', statut);
    }

    if (priorite.length > 0) {
      query = query.in('priorite', priorite);
    }

    if (groupement_id) {
      query = query.eq('groupement_id', groupement_id);
    }

    if (etablissement_id) {
      query = query.eq('etablissement_id', etablissement_id);
    }

    if (commission_id) {
      query = query.eq('commission_id', commission_id);
    }

    if (en_retard) {
      query = query.lt('date_limite_conformite', new Date().toISOString().split('T')[0]);
    }

    if (recherche) {
      query = query.or(`description_complete.ilike.%${recherche}%,numero_prescription.ilike.%${recherche}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Calculer les jours restants pour chaque prescription
    const prescriptionsWithDays = data?.map((p) => ({
      ...p,
      jours_restants: p.date_limite_conformite
        ? Math.ceil(
            (new Date(p.date_limite_conformite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : null,
      alerte_niveau: getAlerteNiveau(p.date_limite_conformite),
    }));

    return NextResponse.json({
      data: prescriptionsWithDays,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error: any) {
    console.error('Erreur GET prescriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer une prescription
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const body = await request.json();
    const {
      commission_id,
      etablissement_id,
      groupement_id,
      description_complete,
      date_limite_conformite,
      priorite = 'normale',
      criticite = 'majeure',
      type_intervention = 'technique',
      articles_reglementaires,
      ...rest
    } = body;

    // Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Générer le numéro de prescription
    let numero_prescription = null;
    if (commission_id) {
      const { data: commission } = await supabase
        .from('commissions')
        .select('date')
        .eq('id', commission_id)
        .single();

      if (commission) {
        const { count } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('commission_id', commission_id);

        numero_prescription = `P-${new Date(commission.date).toISOString().slice(0, 7)}-${String((count || 0) + 1).padStart(3, '0')}`;
      }
    }

    // Enrichir avec l'IA (si configuré)
    let enrichedData = {
      description_reformulee: null as string | null,
      prestataire_recommande_id: null as string | null,
      score_confiance_ia: null as number | null,
      raison_recommendation: null as string | null,
      cout_estime_min: null as number | null,
      cout_estime_max: null as number | null,
      type_intervenant_suggere: null as string | null,
    };

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        enrichedData = await enrichirAvecIA(description_complete, type_intervention, supabase);
      } catch (error) {
        console.warn('Enrichissement IA échoué:', error);
      }
    }

    // Créer la prescription
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        commission_id,
        etablissement_id,
        groupement_id,
        numero_prescription,
        description_complete,
        date_limite_conformite,
        priorite,
        criticite,
        type_intervention,
        articles_reglementaires,
        statut: 'nouveau',
        ...enrichedData,
        ...rest,
      })
      .select()
      .single();

    if (error) throw error;

    // Créer une alerte si échéance proche
    if (date_limite_conformite) {
      const joursRestants = Math.ceil(
        (new Date(date_limite_conformite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (joursRestants <= 30) {
        await createAlerte(prescription.id, 'prescription', joursRestants, supabase);
      }
    }

    // Historiser
    await supabase.from('prescriptions_historique').insert({
      prescription_id: prescription.id,
      action: 'creation',
      statut_apres: 'nouveau',
      commentaire: `Prescription créée${numero_prescription ? ` - ${numero_prescription}` : ''}`,
      auteur_id: user.id,
    });

    return NextResponse.json({ data: prescription }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST prescription:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Mettre à jour une prescription
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Récupérer l'état actuel
    const { data: current } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Prescription non trouvée' }, { status: 404 });
    }

    // Mettre à jour
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Historiser si changement de statut
    if (updates.statut && updates.statut !== current.statut) {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('prescriptions_historique').insert({
        prescription_id: id,
        action: 'changement_statut',
        statut_avant: current.statut,
        statut_apres: updates.statut,
        commentaire: updates.commentaire_resolution || null,
        auteur_id: user?.id,
      });

      // Notifier si prescription levée
      if (updates.statut === 'leve') {
        await notifierPrescriptionLevee(prescription, supabase);
      }
    }

    return NextResponse.json({ data: prescription });
  } catch (error: any) {
    console.error('Erreur PATCH prescription:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Supprimer une prescription
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Vérifier les permissions
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (!['admin', 'secretariat'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur DELETE prescription:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonctions utilitaires
// ============================================

function getAlerteNiveau(dateLimite: string | null): string {
  if (!dateLimite) return 'normal';
  
  const jours = Math.ceil(
    (new Date(dateLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (jours < 0) return 'retard';
  if (jours <= 7) return 'urgent';
  if (jours <= 30) return 'attention';
  return 'normal';
}

async function enrichirAvecIA(
  description: string,
  typeIntervention: string,
  supabase: any
): Promise<{
  description_reformulee: string | null;
  prestataire_recommande_id: string | null;
  score_confiance_ia: number | null;
  raison_recommendation: string | null;
  cout_estime_min: number | null;
  cout_estime_max: number | null;
  type_intervenant_suggere: string | null;
}> {
  // Appeler l'API Claude pour enrichir
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en sécurité incendie ERP. Analyse cette prescription et fournis:
1. Une reformulation claire et professionnelle
2. Le type d'intervenant approprié (interne, prestataire, bailleur)
3. Une estimation de coût (min et max en euros)

Prescription originale: "${description}"
Type d'intervention: ${typeIntervention}

Réponds en JSON avec cette structure exacte:
{
  "reformulation": "texte reformulé",
  "intervenant": "prestataire|interne|bailleur",
  "cout_min": 0,
  "cout_max": 0,
  "raison": "explication courte"
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Erreur API Claude');
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  try {
    const parsed = JSON.parse(content);
    
    // Rechercher un prestataire adapté si type = prestataire
    let prestataireId = null;
    let scoreConfiance = 0.7;

    if (parsed.intervenant === 'prestataire') {
      // Rechercher dans la base des prestataires
      const { data: prestataires } = await supabase
        .from('societes')
        .select('id, raison_sociale, domaines_expertise, note_moyenne')
        .eq('est_prestataire', true)
        .order('note_moyenne', { ascending: false })
        .limit(1);

      if (prestataires && prestataires.length > 0) {
        prestataireId = prestataires[0].id;
        scoreConfiance = (prestataires[0].note_moyenne || 3) / 5;
      }
    }

    return {
      description_reformulee: parsed.reformulation,
      prestataire_recommande_id: prestataireId,
      score_confiance_ia: scoreConfiance,
      raison_recommendation: parsed.raison,
      cout_estime_min: parsed.cout_min,
      cout_estime_max: parsed.cout_max,
      type_intervenant_suggere: parsed.intervenant,
    };
  } catch {
    return {
      description_reformulee: null,
      prestataire_recommande_id: null,
      score_confiance_ia: null,
      raison_recommendation: null,
      cout_estime_min: null,
      cout_estime_max: null,
      type_intervenant_suggere: null,
    };
  }
}

async function createAlerte(
  entiteId: string,
  entiteType: string,
  joursRestants: number,
  supabase: any
): Promise<void> {
  const niveau = joursRestants < 0 ? 'critique' : joursRestants <= 7 ? 'urgent' : 'attention';

  await supabase.from('alertes').insert({
    type: 'prescription_echeance',
    niveau,
    titre: `Prescription arrivant à échéance`,
    description: joursRestants < 0
      ? `Prescription en retard de ${Math.abs(joursRestants)} jours`
      : `${joursRestants} jours restants avant l'échéance`,
    entite_type: entiteType,
    entite_id: entiteId,
    jours_restants: joursRestants,
  });
}

async function notifierPrescriptionLevee(prescription: any, supabase: any): Promise<void> {
  // Créer une notification pour les responsables
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'secretariat']);

  if (profiles) {
    const notifications = profiles.map((p: any) => ({
      user_id: p.id,
      type: 'success',
      titre: 'Prescription levée',
      message: `La prescription ${prescription.numero_prescription || prescription.id} a été levée.`,
      lien: `/prescriptions/${prescription.id}`,
    }));

    await supabase.from('notifications').insert(notifications);
  }
}
