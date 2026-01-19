// ============================================
// PREV'HUB - Edge Function: Génération Alertes
// ============================================
// 
// Cette fonction est exécutée quotidiennement via un cron job Supabase
// pour générer les alertes et envoyer les notifications automatiques.
//
// Configuration cron dans Supabase Dashboard:
// Nom: daily-alerts
// Schedule: 0 7 * * * (tous les jours à 7h)
// URL: /functions/v1/generate-alerts
// ============================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://prevhub.preveris.fr';
const API_URL = `${APP_URL}/api`;

// Seuils d'alerte (en jours)
const SEUILS = {
  prescription: {
    critique: 0,     // En retard
    urgent: 7,       // < 7 jours
    attention: 30,   // < 30 jours
  },
  commission: {
    urgent: 15,      // < 15 jours
    attention: 45,   // < 45 jours
  },
  verification: {
    critique: 0,     // En retard
    urgent: 30,      // < 30 jours
    attention: 90,   // < 90 jours
  },
};

// ============================================
// Types
// ============================================

interface Alerte {
  type: 'prescription' | 'commission' | 'verification';
  niveau: 'critique' | 'urgent' | 'attention';
  entite_id: string;
  entite_type: string;
  message: string;
  jours_restants: number;
  destinataires: string[];
  metadata: Record<string, any>;
}

// ============================================
// Fonction principale
// ============================================

serve(async (req) => {
  try {
    // Vérifier l'authentification (cron ou admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && req.headers.get('X-Supabase-Cron') !== 'true') {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    const alertes: Alerte[] = [];
    const notifications: any[] = [];

    console.log(`[${new Date().toISOString()}] Début génération alertes`);

    // ============================================
    // 1. Alertes Prescriptions
    // ============================================

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        id,
        numero_prescription,
        description_complete,
        date_limite_conformite,
        priorite,
        criticite,
        statut,
        etablissement:etablissements(id, nom_commercial, ville),
        groupement:groupements(id, nom),
        responsable_suivi:profiles(id, email, prenom, nom)
      `)
      .not('statut', 'in', '("leve","valide")')
      .not('date_limite_conformite', 'is', null);

    if (prescriptions) {
      for (const prescription of prescriptions) {
        const echeance = new Date(prescription.date_limite_conformite);
        const joursRestants = Math.ceil(
          (echeance.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
        );

        let niveau: 'critique' | 'urgent' | 'attention' | null = null;

        if (joursRestants <= SEUILS.prescription.critique) {
          niveau = 'critique';
        } else if (joursRestants <= SEUILS.prescription.urgent) {
          niveau = 'urgent';
        } else if (joursRestants <= SEUILS.prescription.attention) {
          niveau = 'attention';
        }

        if (niveau) {
          const alerte: Alerte = {
            type: 'prescription',
            niveau,
            entite_id: prescription.id,
            entite_type: 'prescription',
            message: joursRestants <= 0
              ? `Prescription ${prescription.numero_prescription} en retard de ${Math.abs(joursRestants)} jours`
              : `Prescription ${prescription.numero_prescription} échue dans ${joursRestants} jours`,
            jours_restants: joursRestants,
            destinataires: prescription.responsable_suivi?.id
              ? [prescription.responsable_suivi.id]
              : [],
            metadata: {
              numero_prescription: prescription.numero_prescription,
              nom_etablissement: prescription.etablissement?.nom_commercial,
              nom_groupement: prescription.groupement?.nom,
              priorite: prescription.priorite,
              criticite: prescription.criticite,
            },
          };

          alertes.push(alerte);

          // Notification si critique ou urgent
          if ((niveau === 'critique' || niveau === 'urgent') && prescription.responsable_suivi?.email) {
            notifications.push({
              type: niveau === 'critique' ? 'prescription_en_retard' : 'prescription_urgente',
              canal: 'email',
              destinataire_id: prescription.responsable_suivi.id,
              destinataire_email: prescription.responsable_suivi.email,
              data: {
                numero_prescription: prescription.numero_prescription,
                description_prescription: prescription.description_complete,
                nom_etablissement: prescription.etablissement?.nom_commercial,
                date_echeance: prescription.date_limite_conformite,
                jours_restants: joursRestants,
                priorite: prescription.priorite,
                prenom_destinataire: prescription.responsable_suivi?.prenom,
              },
            });
          }
        }
      }
    }

    console.log(`Prescriptions analysées: ${prescriptions?.length || 0}, alertes: ${alertes.filter(a => a.type === 'prescription').length}`);

    // ============================================
    // 2. Alertes Commissions
    // ============================================

    const { data: commissions } = await supabase
      .from('commissions')
      .select(`
        id,
        date,
        heure,
        type,
        lieu,
        etablissement:etablissements(id, nom_commercial, ville),
        groupement:groupements(id, nom)
      `)
      .gte('date', aujourdHui.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (commissions) {
      for (const commission of commissions) {
        const dateCommission = new Date(commission.date);
        const joursRestants = Math.ceil(
          (dateCommission.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
        );

        let niveau: 'urgent' | 'attention' | null = null;

        if (joursRestants <= SEUILS.commission.urgent) {
          niveau = 'urgent';
        } else if (joursRestants <= SEUILS.commission.attention) {
          niveau = 'attention';
        }

        if (niveau) {
          alertes.push({
            type: 'commission',
            niveau,
            entite_id: commission.id,
            entite_type: 'commission',
            message: `Commission ${commission.type || 'sécurité'} dans ${joursRestants} jours`,
            jours_restants: joursRestants,
            destinataires: [], // Tous les admins/secrétariat
            metadata: {
              date_commission: commission.date,
              heure_commission: commission.heure,
              type_commission: commission.type,
              lieu_commission: commission.lieu,
              nom_etablissement: commission.etablissement?.nom_commercial,
              nom_groupement: commission.groupement?.nom,
            },
          });
        }
      }
    }

    console.log(`Commissions analysées: ${commissions?.length || 0}, alertes: ${alertes.filter(a => a.type === 'commission').length}`);

    // ============================================
    // 3. Alertes Vérifications
    // ============================================

    const { data: verifications } = await supabase
      .from('verifications_periodiques')
      .select(`
        id,
        date_prochaine_verification,
        installation:installations(
          id,
          nom,
          type_installation,
          etablissement:etablissements(id, nom_commercial),
          groupement:groupements(id, nom)
        )
      `)
      .not('date_prochaine_verification', 'is', null);

    if (verifications) {
      for (const verification of verifications) {
        const echeance = new Date(verification.date_prochaine_verification);
        const joursRestants = Math.ceil(
          (echeance.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24)
        );

        let niveau: 'critique' | 'urgent' | 'attention' | null = null;

        if (joursRestants <= SEUILS.verification.critique) {
          niveau = 'critique';
        } else if (joursRestants <= SEUILS.verification.urgent) {
          niveau = 'urgent';
        } else if (joursRestants <= SEUILS.verification.attention) {
          niveau = 'attention';
        }

        if (niveau) {
          alertes.push({
            type: 'verification',
            niveau,
            entite_id: verification.id,
            entite_type: 'verification',
            message: joursRestants <= 0
              ? `Vérification ${verification.installation?.type_installation} en retard de ${Math.abs(joursRestants)} jours`
              : `Vérification ${verification.installation?.type_installation} à prévoir dans ${joursRestants} jours`,
            jours_restants: joursRestants,
            destinataires: [],
            metadata: {
              nom_installation: verification.installation?.nom,
              type_installation: verification.installation?.type_installation,
              date_prochaine_verif: verification.date_prochaine_verification,
              nom_etablissement: verification.installation?.etablissement?.nom_commercial,
              nom_groupement: verification.installation?.groupement?.nom,
            },
          });
        }
      }
    }

    console.log(`Vérifications analysées: ${verifications?.length || 0}, alertes: ${alertes.filter(a => a.type === 'verification').length}`);

    // ============================================
    // 4. Enregistrer les alertes
    // ============================================

    // Supprimer les anciennes alertes non traitées
    await supabase
      .from('alertes')
      .delete()
      .eq('statut', 'active')
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Insérer les nouvelles alertes
    if (alertes.length > 0) {
      const alertesInsert = alertes.map((a) => ({
        type: a.type,
        niveau: a.niveau,
        entite_id: a.entite_id,
        entite_type: a.entite_type,
        message: a.message,
        jours_restants: a.jours_restants,
        metadata: a.metadata,
        statut: 'active',
      }));

      const { error: insertError } = await supabase
        .from('alertes')
        .upsert(alertesInsert, {
          onConflict: 'entite_type,entite_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('Erreur insertion alertes:', insertError);
      }
    }

    // ============================================
    // 5. Envoyer les notifications
    // ============================================

    let notificationsSent = 0;

    for (const notification of notifications) {
      try {
        const response = await fetch(`${API_URL}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
          body: JSON.stringify(notification),
        });

        if (response.ok) {
          notificationsSent++;
        } else {
          console.error('Erreur envoi notification:', await response.text());
        }
      } catch (error) {
        console.error('Erreur notification:', error);
      }
    }

    console.log(`[${new Date().toISOString()}] Fin génération alertes`);
    console.log(`Alertes créées: ${alertes.length}, Notifications envoyées: ${notificationsSent}`);

    // ============================================
    // Réponse
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          alertes_total: alertes.length,
          alertes_critiques: alertes.filter((a) => a.niveau === 'critique').length,
          alertes_urgentes: alertes.filter((a) => a.niveau === 'urgent').length,
          alertes_attention: alertes.filter((a) => a.niveau === 'attention').length,
          notifications_envoyees: notificationsSent,
        },
        details: {
          prescriptions: alertes.filter((a) => a.type === 'prescription').length,
          commissions: alertes.filter((a) => a.type === 'commission').length,
          verifications: alertes.filter((a) => a.type === 'verification').length,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erreur Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
