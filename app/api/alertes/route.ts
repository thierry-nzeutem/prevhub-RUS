// ============================================
// PREV'HUB - API Alertes & Notifications
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// ============================================
// Types
// ============================================

interface AlerteRequest {
  type: 'prescription_echeance' | 'verification_echeance' | 'commission_preparation' | 'commande_relance' | 'custom';
  niveau: 'info' | 'attention' | 'urgent' | 'critique';
  titre: string;
  message: string;
  entite_type?: 'prescription' | 'verification' | 'commission' | 'commande' | 'visite';
  entite_id?: string;
  destinataires?: string[]; // user IDs
  metadata?: Record<string, any>;
}

interface NotificationRequest {
  user_id: string;
  titre: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  lien?: string;
  metadata?: Record<string, any>;
}

// ============================================
// GET - Liste des alertes
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Paramètres
    const type = searchParams.get('type');
    const niveau = searchParams.get('niveau');
    const non_lues = searchParams.get('non_lues') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construire la requête
    let query = supabase
      .from('alertes')
      .select(`
        *,
        prescription:prescriptions(id, numero_prescription, description_complete),
        verification:verifications(id, installation:installations(nom)),
        commission:commissions(id, date, type)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filtres
    if (type) {
      query = query.eq('type', type);
    }
    if (niveau) {
      query = query.eq('niveau', niveau);
    }
    if (non_lues) {
      query = query.eq('est_lue', false);
    }

    const { data: alertes, error } = await query;

    if (error) {
      console.error('Erreur récupération alertes:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Stats
    const { count: totalNonLues } = await supabase
      .from('alertes')
      .select('*', { count: 'exact', head: true })
      .eq('est_lue', false);

    const { count: critiques } = await supabase
      .from('alertes')
      .select('*', { count: 'exact', head: true })
      .eq('niveau', 'critique')
      .eq('est_lue', false);

    return NextResponse.json({
      alertes,
      stats: {
        total_non_lues: totalNonLues || 0,
        critiques: critiques || 0,
      },
    });
  } catch (error) {
    console.error('Erreur GET alertes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// POST - Créer une alerte
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body: AlerteRequest = await request.json();

    // Validation
    if (!body.type || !body.niveau || !body.titre || !body.message) {
      return NextResponse.json(
        { error: 'type, niveau, titre et message requis' },
        { status: 400 }
      );
    }

    // Créer l'alerte
    const alerteData = {
      type: body.type,
      niveau: body.niveau,
      titre: body.titre,
      message: body.message,
      entite_type: body.entite_type,
      entite_id: body.entite_id,
      metadata: body.metadata,
      est_lue: false,
      created_by: user.id,
    };

    const { data: alerte, error: insertError } = await supabase
      .from('alertes')
      .insert(alerteData)
      .select()
      .single();

    if (insertError) {
      console.error('Erreur création alerte:', insertError);
      return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
    }

    // Créer les notifications pour les destinataires
    if (body.destinataires && body.destinataires.length > 0) {
      const notifications = body.destinataires.map((userId) => ({
        user_id: userId,
        alerte_id: alerte.id,
        titre: body.titre,
        message: body.message,
        type: body.niveau === 'critique' ? 'error' : body.niveau === 'urgent' ? 'warning' : 'info',
        lien: body.entite_type && body.entite_id ? `/${body.entite_type}s/${body.entite_id}` : null,
        est_lue: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({ alerte }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST alerte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// ============================================
// PATCH - Marquer comme lue
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();

    // Vérifier auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ids, marquer_toutes } = body;

    if (marquer_toutes) {
      // Marquer toutes comme lues
      const { error } = await supabase
        .from('alertes')
        .update({ est_lue: true, lue_at: new Date().toISOString() })
        .eq('est_lue', false);

      if (error) {
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Toutes les alertes marquées comme lues' });
    }

    if (ids && Array.isArray(ids)) {
      // Marquer plusieurs
      const { error } = await supabase
        .from('alertes')
        .update({ est_lue: true, lue_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
      }

      return NextResponse.json({ message: `${ids.length} alertes marquées comme lues` });
    }

    if (id) {
      // Marquer une seule
      const { data, error } = await supabase
        .from('alertes')
        .update({ est_lue: true, lue_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
      }

      return NextResponse.json({ alerte: data });
    }

    return NextResponse.json({ error: 'id, ids ou marquer_toutes requis' }, { status: 400 });
  } catch (error) {
    console.error('Erreur PATCH alertes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
