// ============================================
// PREV'HUB - API Commandes d'Intervention
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';

// ============================================
// GET - Liste des commandes
// ============================================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const { searchParams } = new URL(request.url);
    const prestataire_id = searchParams.get('prestataire_id');
    const statut = searchParams.get('statut');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('commandes_intervention')
      .select(`
        *,
        prestataire:societes!prestataire_id(id, raison_sociale, email, telephone),
        prescription:prescriptions(id, numero_prescription, description_complete),
        etablissement:etablissements(id, nom_commercial, adresse, ville),
        groupement:groupements(id, nom),
        relances:relances_commandes(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (prestataire_id) {
      query = query.eq('prestataire_id', prestataire_id);
    }

    if (statut) {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Erreur GET commandes:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Créer une commande (envoi 1-click)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);
    const adminSupabase = createAdminSupabaseClient();

    const body = await request.json();
    const {
      prescription_id,
      observation_id,
      prestataire_id,
      canal_envoi = 'email',
      message_personnalise,
      date_souhaitee,
      urgence = false,
    } = body;

    // Vérifier l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Charger les données de la prescription
    let prescriptionData = null;
    let etablissementData = null;
    let groupementData = null;

    if (prescription_id) {
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select(`
          *,
          commission:commissions(*),
          etablissement:etablissements(*),
          groupement:groupements(*),
          prestataire_recommande:societes!prestataire_recommande_id(*)
        `)
        .eq('id', prescription_id)
        .single();

      prescriptionData = prescription;
      etablissementData = prescription?.etablissement;
      groupementData = prescription?.groupement;
    }

    // Déterminer le prestataire à utiliser
    let prestataireToUse = prestataire_id;
    if (!prestataireToUse && prescriptionData?.prestataire_recommande_id) {
      prestataireToUse = prescriptionData.prestataire_recommande_id;
    }

    if (!prestataireToUse) {
      return NextResponse.json(
        { error: 'Prestataire requis pour créer une commande' },
        { status: 400 }
      );
    }

    // Charger les infos du prestataire
    const { data: prestataire } = await supabase
      .from('societes')
      .select('*, contacts:contacts(*)')
      .eq('id', prestataireToUse)
      .single();

    if (!prestataire) {
      return NextResponse.json(
        { error: 'Prestataire non trouvé' },
        { status: 404 }
      );
    }

    // Charger le template de message
    const { data: template } = await supabase
      .from('templates_messages')
      .select('*')
      .eq('type', 'commande_prestataire')
      .eq('canal', canal_envoi)
      .eq('actif', true)
      .single();

    // Générer le message personnalisé
    let messageEnvoye = template?.contenu || generateDefaultMessage(canal_envoi);

    // Remplacer les variables du template
    const variables = {
      prenom_contact: prestataire.contacts?.[0]?.prenom || 'Madame, Monsieur',
      date_visite: prescriptionData?.commission?.date
        ? new Date(prescriptionData.commission.date).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR'),
      description: prescriptionData?.description_complete || 'Intervention demandée',
      localisation: etablissementData?.adresse || groupementData?.nom || '',
      date_echeance: prescriptionData?.date_limite_conformite
        ? new Date(prescriptionData.date_limite_conformite).toLocaleDateString('fr-FR')
        : 'À définir',
      priorite: prescriptionData?.priorite || 'normale',
      nom_etablissement: etablissementData?.nom_commercial || groupementData?.nom || '',
      adresse_etablissement: etablissementData
        ? `${etablissementData.adresse}, ${etablissementData.code_postal} ${etablissementData.ville}`
        : '',
      contact_exploitant: etablissementData?.societe_exploitation?.raison_sociale || '',
      telephone_exploitant: etablissementData?.societe_exploitation?.telephone || '',
      contexte_historique: prescriptionData?.notes_internes || '',
      seuil_devis: '500',
      lien_rapport: `${process.env.NEXT_PUBLIC_APP_URL}/rapports/${prescriptionData?.commission_id}`,
      signature_preventionniste: 'L\'équipe PRÉVÉRIS',
      coordonnees_preveris: 'PRÉVÉRIS - Tél: 01 XX XX XX XX - contact@preveris.fr',
      id_commande: '', // Sera rempli après création
    };

    // Remplacer les variables
    Object.entries(variables).forEach(([key, value]) => {
      messageEnvoye = messageEnvoye.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });

    // Ajouter le message personnalisé
    if (message_personnalise) {
      messageEnvoye += `\n\n📝 Message complémentaire :\n${message_personnalise}`;
    }

    // Créer la commande
    const { data: commande, error: commandeError } = await supabase
      .from('commandes_intervention')
      .insert({
        prescription_id,
        observation_id,
        type_intervention: prescriptionData?.type_intervention || 'technique',
        description: prescriptionData?.description_complete || 'Intervention demandée',
        prestataire_id: prestataireToUse,
        contact_prestataire_id: prestataire.contacts?.[0]?.id,
        etablissement_id: etablissementData?.id,
        groupement_id: groupementData?.id,
        date_souhaitee: date_souhaitee || prescriptionData?.date_limite_conformite,
        urgence,
        canal_envoi,
        message_envoye: messageEnvoye,
        statut: 'envoyee',
        created_by: user.id,
      })
      .select()
      .single();

    if (commandeError) {
      throw commandeError;
    }

    // Envoyer le message (selon le canal)
    let envoyeAvecSucces = false;

    if (canal_envoi === 'email') {
      envoyeAvecSucces = await sendEmail({
        to: prestataire.email,
        subject: template?.sujet?.replace('{{etablissement}}', etablissementData?.nom_commercial || '')
          .replace('{{type_intervention}}', prescriptionData?.type_intervention || 'Intervention') || 
          `[PRÉVÉRIS] Commande intervention - ${commande.numero_commande}`,
        body: messageEnvoye,
      });
    } else if (canal_envoi === 'sms') {
      envoyeAvecSucces = await sendSMS({
        to: prestataire.telephone,
        message: messageEnvoye.substring(0, 160), // Limite SMS
      });
    }

    // Mettre à jour le statut de la prescription
    if (prescription_id) {
      await supabase
        .from('prescriptions')
        .update({
          statut: 'commande_envoyee',
          prestataire_effectif_id: prestataireToUse,
        })
        .eq('id', prescription_id);
    }

    // Créer une entrée d'historique
    if (prescription_id) {
      await supabase.from('prescriptions_historique').insert({
        prescription_id,
        action: 'commande_envoyee',
        statut_avant: prescriptionData?.statut,
        statut_apres: 'commande_envoyee',
        commentaire: `Commande ${commande.numero_commande} envoyée à ${prestataire.raison_sociale} via ${canal_envoi}`,
        auteur_id: user.id,
      });
    }

    // Programmer les relances automatiques
    await programmerRelances(commande.id, prestataire.id, canal_envoi, adminSupabase);

    return NextResponse.json({
      data: commande,
      message: envoyeAvecSucces
        ? 'Commande envoyée avec succès'
        : 'Commande créée, envoi en attente',
    });
  } catch (error: any) {
    console.error('Erreur POST commande:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la commande' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonctions utilitaires
// ============================================

function generateDefaultMessage(canal: string): string {
  if (canal === 'sms') {
    return `[PRÉVÉRIS] Intervention demandée: {{description}}. Établissement: {{nom_etablissement}}. Échéance: {{date_echeance}}. Merci de confirmer. Réf: {{id_commande}}`;
  }

  return `Bonjour {{prenom_contact}},

Nous vous commandons l'intervention suivante :

📋 INTERVENTION :
{{description}}

🏢 ÉTABLISSEMENT :
{{nom_etablissement}}
{{adresse_etablissement}}

⏰ Échéance : {{date_echeance}}
📊 Priorité : {{priorite}}

Merci de nous confirmer vos disponibilités.

Cordialement,
{{signature_preventionniste}}

---
{{coordonnees_preveris}}
Réf: {{id_commande}}`;
}

async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  try {
    // Utiliser Resend ou autre service d'email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'notifications@preveris.fr',
        to: [to],
        subject,
        text: body,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}

async function sendSMS({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<boolean> {
  try {
    // Utiliser Twilio ou autre service SMS
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.warn('Configuration Twilio manquante');
      return false;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: message,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    return false;
  }
}

async function programmerRelances(
  commandeId: string,
  prestataireId: string,
  canal: string,
  supabase: any
): Promise<void> {
  // Programmer les relances J+2, J+7, J+14, J+30
  const relances = [
    { jours: 2, type: 'automatique' },
    { jours: 7, type: 'automatique' },
    { jours: 14, type: 'automatique' },
    { jours: 30, type: 'manuelle' },
  ];

  // Note: Dans une vraie implémentation, on utiliserait des Edge Functions
  // ou un job scheduler pour programmer ces relances
  console.log(`Relances programmées pour commande ${commandeId}:`, relances);
}

// ============================================
// PATCH - Mettre à jour une commande
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

    const { data, error } = await supabase
      .from('commandes_intervention')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Erreur PATCH commande:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
