// ============================================
// PREV'HUB - API Notifications
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { emailTemplates, EmailTemplateData } from '@/lib/email-templates';

// ============================================
// Configuration
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const EMAIL_FROM = process.env.EMAIL_FROM || 'notifications@preveris.fr';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://prevhub.preveris.fr';

// ============================================
// Types
// ============================================

type NotificationType = 
  | 'prescription_en_retard'
  | 'prescription_urgente'
  | 'commission_a_preparer'
  | 'verification_a_prevoir'
  | 'visite_planifiee'
  | 'commande_intervention'
  | 'recap_hebdomadaire';

interface NotificationPayload {
  type: NotificationType;
  canal: 'email' | 'sms' | 'push';
  destinataire_id?: string;
  destinataire_email?: string;
  destinataire_telephone?: string;
  data: EmailTemplateData & Record<string, any>;
}

// ============================================
// POST - Envoyer une notification
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json() as NotificationPayload;

    // Vérification authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Validation
    if (!body.type || !body.canal) {
      return NextResponse.json(
        { error: 'Type et canal requis' },
        { status: 400 }
      );
    }

    // Récupérer les infos du destinataire si ID fourni
    let destinataireEmail = body.destinataire_email;
    let destinataireTelephone = body.destinataire_telephone;
    let destinataireNom = body.data?.nom_destinataire || '';
    let destinatairePrenom = body.data?.prenom_destinataire || '';

    if (body.destinataire_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, telephone, nom, prenom')
        .eq('id', body.destinataire_id)
        .single();

      if (profile) {
        destinataireEmail = destinataireEmail || profile.email;
        destinataireTelephone = destinataireTelephone || profile.telephone;
        destinataireNom = profile.nom || destinataireNom;
        destinatairePrenom = profile.prenom || destinatairePrenom;
      }
    }

    // Enrichir les données
    const enrichedData: EmailTemplateData = {
      ...body.data,
      prenom_destinataire: destinatairePrenom,
      nom_destinataire: destinataireNom,
      lien_application: APP_URL,
      nom_societe: 'PRÉVÉRIS',
    };

    let result: { success: boolean; messageId?: string; error?: string };

    // Envoyer selon le canal
    switch (body.canal) {
      case 'email':
        if (!destinataireEmail) {
          return NextResponse.json(
            { error: 'Email du destinataire requis' },
            { status: 400 }
          );
        }
        result = await sendEmail(body.type, destinataireEmail, enrichedData);
        break;

      case 'sms':
        if (!destinataireTelephone) {
          return NextResponse.json(
            { error: 'Téléphone du destinataire requis' },
            { status: 400 }
          );
        }
        result = await sendSMS(body.type, destinataireTelephone, enrichedData);
        break;

      case 'push':
        result = await sendPushNotification(body.type, body.destinataire_id!, enrichedData);
        break;

      default:
        return NextResponse.json(
          { error: 'Canal non supporté' },
          { status: 400 }
        );
    }

    // Enregistrer la notification
    await supabase.from('notifications').insert({
      type: body.type,
      canal: body.canal,
      destinataire_id: body.destinataire_id || null,
      destinataire_email: destinataireEmail || null,
      destinataire_telephone: destinataireTelephone || null,
      contenu: JSON.stringify(enrichedData),
      statut: result.success ? 'envoye' : 'echec',
      message_id: result.messageId || null,
      erreur: result.error || null,
      metadata: {
        sent_by: user.id,
        sent_at: new Date().toISOString(),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur envoi notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('Erreur API notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Liste des notifications envoyées
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
    const destinataire_id = searchParams.get('destinataire_id');
    const type = searchParams.get('type');
    const canal = searchParams.get('canal');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construction requête
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (destinataire_id) {
      query = query.eq('destinataire_id', destinataire_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (canal) {
      query = query.eq('canal', canal);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur fetch notifications:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Erreur API notifications GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonctions d'envoi
// ============================================

async function sendEmail(
  type: NotificationType,
  to: string,
  data: EmailTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY non configurée');
    return { success: false, error: 'Service email non configuré' };
  }

  try {
    // Générer le HTML selon le type
    let html: string;
    let subject: string;

    switch (type) {
      case 'prescription_en_retard':
        html = emailTemplates.prescriptionEnRetard(data);
        subject = `⚠️ Prescription en retard - ${data.numero_prescription || 'Action requise'}`;
        break;

      case 'prescription_urgente':
        html = emailTemplates.prescriptionEnRetard(data);
        subject = `🔴 Prescription urgente - ${data.nom_etablissement || 'Action requise'}`;
        break;

      case 'commission_a_preparer':
        html = emailTemplates.commissionAPrevoir(data);
        subject = `📅 Commission à préparer - ${data.nom_etablissement || ''} - ${data.date_commission || ''}`;
        break;

      case 'verification_a_prevoir':
        html = emailTemplates.verificationAPrevoir(data);
        subject = `🔍 Vérification à programmer - ${data.nom_installation || data.type_installation || ''}`;
        break;

      case 'visite_planifiee':
        html = emailTemplates.visitePlanifiee(data);
        subject = `📋 Visite planifiée - ${data.nom_etablissement || ''} - ${data.date_visite || ''}`;
        break;

      case 'commande_intervention':
        html = emailTemplates.commandeIntervention(data);
        subject = `🔧 Demande d'intervention - ${data.numero_commande || ''} - ${data.nom_etablissement || ''}`;
        break;

      case 'recap_hebdomadaire':
        html = emailTemplates.recapHebdomadaire(data as any);
        subject = `📊 Récapitulatif hebdomadaire Prev'Hub`;
        break;

      default:
        return { success: false, error: 'Type de notification non supporté' };
    }

    // Envoyer via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erreur Resend:', result);
      return { success: false, error: result.message || 'Erreur envoi email' };
    }

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Erreur sendEmail:', error);
    return { success: false, error: 'Erreur technique envoi email' };
  }
}

async function sendSMS(
  type: NotificationType,
  to: string,
  data: EmailTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio non configuré');
    return { success: false, error: 'Service SMS non configuré' };
  }

  try {
    // Formater le numéro
    let phoneNumber = to.replace(/\s/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+33' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+33' + phoneNumber;
    }

    // Générer le message SMS (max 160 caractères pour éviter le multipart)
    let message: string;

    switch (type) {
      case 'prescription_en_retard':
        message = `PREVERIS: Prescription ${data.numero_prescription || ''} en RETARD (${Math.abs(data.jours_restants || 0)}j) - ${data.nom_etablissement || ''}. Action urgente requise.`;
        break;

      case 'prescription_urgente':
        message = `PREVERIS: Prescription URGENTE - ${data.nom_etablissement || ''}, échéance ${data.date_echeance || 'proche'}. Voir Prev'Hub.`;
        break;

      case 'commission_a_preparer':
        message = `PREVERIS: Commission ${data.date_commission || ''} dans ${data.jours_restants || 0}j - ${data.nom_etablissement || ''}. À préparer.`;
        break;

      case 'verification_a_prevoir':
        message = `PREVERIS: Vérif. ${data.type_installation || ''} à programmer avant ${data.date_prochaine_verif || ''} - ${data.nom_etablissement || ''}.`;
        break;

      default:
        return { success: false, error: 'Type non supporté pour SMS' };
    }

    // Tronquer si nécessaire
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }

    // Envoyer via Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: phoneNumber,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Erreur Twilio:', result);
      return { success: false, error: result.message || 'Erreur envoi SMS' };
    }

    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('Erreur sendSMS:', error);
    return { success: false, error: 'Erreur technique envoi SMS' };
  }
}

async function sendPushNotification(
  type: NotificationType,
  userId: string,
  data: EmailTemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: Implémenter avec Web Push API
  // Pour l'instant, on stocke juste dans la base pour affichage dans l'app

  try {
    // Générer le titre et le corps
    let title: string;
    let body: string;
    let url: string = APP_URL;

    switch (type) {
      case 'prescription_en_retard':
        title = '⚠️ Prescription en retard';
        body = `${data.numero_prescription} - ${data.nom_etablissement}`;
        url = `${APP_URL}/prescriptions/${data.numero_prescription}`;
        break;

      case 'commission_a_preparer':
        title = '📅 Commission à préparer';
        body = `${data.nom_etablissement} - ${data.date_commission}`;
        url = `${APP_URL}/commissions`;
        break;

      case 'verification_a_prevoir':
        title = '🔍 Vérification à prévoir';
        body = `${data.type_installation} - ${data.nom_etablissement}`;
        url = `${APP_URL}/verifications`;
        break;

      default:
        title = 'Notification Prev\'Hub';
        body = 'Vous avez une nouvelle notification';
    }

    // Note: Ici on pourrait envoyer via Web Push si on a un endpoint configuré
    // Pour l'instant, retour succès (la notif est stockée côté serveur)
    
    return { 
      success: true, 
      messageId: `push-${Date.now()}` 
    };
  } catch (error) {
    console.error('Erreur sendPushNotification:', error);
    return { success: false, error: 'Erreur technique push notification' };
  }
}
