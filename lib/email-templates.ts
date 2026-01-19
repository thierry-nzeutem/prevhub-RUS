// ============================================
// PREV'HUB - Templates Email HTML
// ============================================

// ============================================
// Types
// ============================================

export interface EmailTemplateData {
  // Destinataire
  prenom_destinataire?: string;
  nom_destinataire?: string;
  email_destinataire?: string;

  // Prescription
  numero_prescription?: string;
  description_prescription?: string;
  date_echeance?: string;
  jours_restants?: number;
  priorite?: string;
  criticite?: string;
  
  // Établissement
  nom_etablissement?: string;
  adresse_etablissement?: string;
  ville_etablissement?: string;
  type_erp?: string;
  categorie_erp?: number;
  
  // Groupement
  nom_groupement?: string;
  
  // Commission
  date_commission?: string;
  type_commission?: string;
  heure_commission?: string;
  lieu_commission?: string;
  
  // Visite
  date_visite?: string;
  heure_visite?: string;
  type_visite?: string;
  preventionniste_nom?: string;
  
  // Intervention
  numero_commande?: string;
  prestataire_nom?: string;
  type_intervention?: string;
  message_personnalise?: string;
  
  // Vérification
  nom_installation?: string;
  type_installation?: string;
  date_derniere_verif?: string;
  date_prochaine_verif?: string;
  
  // Liens
  lien_rapport?: string;
  lien_application?: string;
  
  // Entreprise
  nom_societe?: string;
}

// ============================================
// Styles communs
// ============================================

const STYLES = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  `,
  header: `
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    padding: 24px;
    text-align: center;
  `,
  logo: `
    color: #ffffff;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.5px;
  `,
  content: `
    padding: 32px 24px;
  `,
  title: `
    color: #111827;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 16px 0;
  `,
  text: `
    color: #4b5563;
    font-size: 16px;
    line-height: 1.6;
    margin: 0 0 16px 0;
  `,
  infoBox: `
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
  `,
  infoRow: `
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e5e7eb;
  `,
  infoLabel: `
    color: #6b7280;
    font-size: 14px;
  `,
  infoValue: `
    color: #111827;
    font-size: 14px;
    font-weight: 500;
  `,
  alertBox: (type: 'danger' | 'warning' | 'info' | 'success') => {
    const colors = {
      danger: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
      warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
      info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
      success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    };
    const c = colors[type];
    return `
      background-color: ${c.bg};
      border: 1px solid ${c.border};
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      color: ${c.text};
    `;
  },
  button: `
    display: inline-block;
    background-color: #f97316;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    margin: 24px 0;
  `,
  footer: `
    background-color: #f9fafb;
    padding: 24px;
    text-align: center;
    border-top: 1px solid #e5e7eb;
  `,
  footerText: `
    color: #9ca3af;
    font-size: 12px;
    margin: 0 0 8px 0;
  `,
  badge: (color: string) => `
    display: inline-block;
    background-color: ${color};
    color: #ffffff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  `,
};

// ============================================
// Template de base
// ============================================

function baseTemplate(content: string, data: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prev'Hub - PRÉVÉRIS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="${STYLES.container}">
    <!-- Header -->
    <div style="${STYLES.header}">
      <h1 style="${STYLES.logo}">Prev'Hub</h1>
      <p style="color: #fed7aa; font-size: 14px; margin: 4px 0 0 0;">
        ${data.nom_societe || 'PRÉVÉRIS'}
      </p>
    </div>

    <!-- Content -->
    <div style="${STYLES.content}">
      ${content}
    </div>

    <!-- Footer -->
    <div style="${STYLES.footer}">
      <p style="${STYLES.footerText}">
        Cet email a été envoyé automatiquement par Prev'Hub.
      </p>
      <p style="${STYLES.footerText}">
        © ${new Date().getFullYear()} PRÉVÉRIS - Tous droits réservés
      </p>
      ${data.lien_application ? `
        <a href="${data.lien_application}" style="color: #f97316; font-size: 12px; text-decoration: none;">
          Accéder à Prev'Hub
        </a>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// Templates spécifiques
// ============================================

/**
 * Email d'alerte prescription en retard
 */
export function prescriptionEnRetardEmail(data: EmailTemplateData): string {
  const content = `
    <h2 style="${STYLES.title}">⚠️ Prescription en retard</h2>
    
    <p style="${STYLES.text}">
      Bonjour${data.prenom_destinataire ? ` ${data.prenom_destinataire}` : ''},
    </p>
    
    <p style="${STYLES.text}">
      La prescription suivante est <strong>en retard de ${Math.abs(data.jours_restants || 0)} jours</strong>
      et nécessite une action immédiate.
    </p>

    <div style="${STYLES.alertBox('danger')}">
      <strong>Action requise !</strong> Cette prescription a dépassé sa date limite de conformité.
    </div>

    <div style="${STYLES.infoBox}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° Prescription</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.numero_prescription || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Établissement</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_etablissement || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600; text-align: right;">
            ${data.date_echeance || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Priorité</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="${STYLES.badge('#dc2626')}">${data.priorite || 'Urgent'}</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="${STYLES.text}">
      <strong>Description :</strong><br>
      ${data.description_prescription || 'Non renseignée'}
    </p>

    <div style="text-align: center;">
      <a href="${data.lien_application || '#'}" style="${STYLES.button}">
        Voir la prescription
      </a>
    </div>
  `;

  return baseTemplate(content, data);
}

/**
 * Email de rappel commission à préparer
 */
export function commissionARapprochementEmail(data: EmailTemplateData): string {
  const content = `
    <h2 style="${STYLES.title}">📅 Commission à préparer</h2>
    
    <p style="${STYLES.text}">
      Bonjour${data.prenom_destinataire ? ` ${data.prenom_destinataire}` : ''},
    </p>
    
    <p style="${STYLES.text}">
      Une commission de sécurité est programmée dans <strong>${data.jours_restants} jours</strong>.
      Il est temps de préparer le dossier.
    </p>

    <div style="${STYLES.alertBox('warning')}">
      <strong>Rappel :</strong> Pensez à vérifier que toutes les prescriptions sont levées
      et que le registre de sécurité est à jour.
    </div>

    <div style="${STYLES.infoBox}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.date_commission || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Heure</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.heure_commission || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.type_commission || 'Sécurité'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Établissement</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_etablissement || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Lieu</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.lieu_commission || '-'}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${data.lien_application || '#'}" style="${STYLES.button}">
        Préparer la commission
      </a>
    </div>
  `;

  return baseTemplate(content, data);
}

/**
 * Email de commande d'intervention au prestataire
 */
export function commandeInterventionEmail(data: EmailTemplateData): string {
  const content = `
    <h2 style="${STYLES.title}">🔧 Demande d'intervention</h2>
    
    <p style="${STYLES.text}">
      Bonjour,
    </p>
    
    <p style="${STYLES.text}">
      Nous sollicitons votre intervention pour la prescription suivante :
    </p>

    <div style="${STYLES.infoBox}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° Commande</td>
          <td style="padding: 8px 0; color: #f97316; font-size: 14px; font-weight: 600; text-align: right;">
            ${data.numero_commande || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Établissement</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_etablissement || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Adresse</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
            ${data.adresse_etablissement || '-'}<br>
            ${data.ville_etablissement || ''}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date limite</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.date_echeance || '-'}
          </td>
        </tr>
      </table>
    </div>

    <p style="${STYLES.text}">
      <strong>Description des travaux :</strong><br>
      ${data.description_prescription || 'Non renseignée'}
    </p>

    ${data.message_personnalise ? `
      <div style="${STYLES.alertBox('info')}">
        <strong>Message complémentaire :</strong><br>
        ${data.message_personnalise}
      </div>
    ` : ''}

    <p style="${STYLES.text}">
      Merci de nous confirmer la prise en charge de cette intervention
      et de nous communiquer la date prévue d'exécution.
    </p>

    <p style="${STYLES.text}">
      Cordialement,<br>
      <strong>${data.nom_societe || 'PRÉVÉRIS'}</strong>
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Email de rappel vérification technique
 */
export function verificationARealiserEmail(data: EmailTemplateData): string {
  const content = `
    <h2 style="${STYLES.title}">🔍 Vérification technique à programmer</h2>
    
    <p style="${STYLES.text}">
      Bonjour${data.prenom_destinataire ? ` ${data.prenom_destinataire}` : ''},
    </p>
    
    <p style="${STYLES.text}">
      La vérification périodique suivante doit être programmée dans les
      <strong>${data.jours_restants} prochains jours</strong>.
    </p>

    <div style="${STYLES.infoBox}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Installation</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_installation || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.type_installation?.replace(/_/g, ' ') || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Établissement</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_etablissement || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Dernière vérification</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">
            ${data.date_derniere_verif || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance</td>
          <td style="padding: 8px 0; color: #f97316; font-size: 14px; font-weight: 600; text-align: right;">
            ${data.date_prochaine_verif || '-'}
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${data.lien_application || '#'}" style="${STYLES.button}">
        Programmer la vérification
      </a>
    </div>
  `;

  return baseTemplate(content, data);
}

/**
 * Email de confirmation visite planifiée
 */
export function visitePlanifieeEmail(data: EmailTemplateData): string {
  const content = `
    <h2 style="${STYLES.title}">📋 Visite planifiée</h2>
    
    <p style="${STYLES.text}">
      Bonjour${data.prenom_destinataire ? ` ${data.prenom_destinataire}` : ''},
    </p>
    
    <p style="${STYLES.text}">
      Une visite a été planifiée pour votre établissement.
    </p>

    <div style="${STYLES.infoBox}">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.date_visite || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Heure</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.heure_visite || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Type de visite</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.type_visite || 'Visite de prévention'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Établissement</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.nom_etablissement || '-'}
          </td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Préventionniste</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-align: right;">
            ${data.preventionniste_nom || '-'}
          </td>
        </tr>
      </table>
    </div>

    <div style="${STYLES.alertBox('info')}">
      <strong>Rappel :</strong> Merci de prévoir l'accès à l'ensemble des locaux
      et d'avoir le registre de sécurité à disposition.
    </div>

    <p style="${STYLES.text}">
      Pour toute modification, merci de nous contacter.
    </p>
  `;

  return baseTemplate(content, data);
}

/**
 * Email de récapitulatif hebdomadaire
 */
export function recapHebdomadaireEmail(data: EmailTemplateData & {
  nb_prescriptions_retard: number;
  nb_prescriptions_urgentes: number;
  nb_commissions_semaine: number;
  nb_verifications_echues: number;
}): string {
  const content = `
    <h2 style="${STYLES.title}">📊 Récapitulatif hebdomadaire</h2>
    
    <p style="${STYLES.text}">
      Bonjour${data.prenom_destinataire ? ` ${data.prenom_destinataire}` : ''},
    </p>
    
    <p style="${STYLES.text}">
      Voici le récapitulatif de votre activité pour la semaine passée.
    </p>

    <div style="display: flex; gap: 16px; margin: 24px 0;">
      <div style="flex: 1; background: #fef2f2; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #dc2626;">
          ${data.nb_prescriptions_retard || 0}
        </div>
        <div style="font-size: 12px; color: #991b1b;">Prescriptions en retard</div>
      </div>
      <div style="flex: 1; background: #fffbeb; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #d97706;">
          ${data.nb_prescriptions_urgentes || 0}
        </div>
        <div style="font-size: 12px; color: #92400e;">Prescriptions urgentes</div>
      </div>
    </div>

    <div style="display: flex; gap: 16px; margin: 24px 0;">
      <div style="flex: 1; background: #eff6ff; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #2563eb;">
          ${data.nb_commissions_semaine || 0}
        </div>
        <div style="font-size: 12px; color: #1e40af;">Commissions cette semaine</div>
      </div>
      <div style="flex: 1; background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #d97706;">
          ${data.nb_verifications_echues || 0}
        </div>
        <div style="font-size: 12px; color: #92400e;">Vérifications à prévoir</div>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${data.lien_application || '#'}" style="${STYLES.button}">
        Accéder au tableau de bord
      </a>
    </div>
  `;

  return baseTemplate(content, data);
}

// ============================================
// Export
// ============================================

export const emailTemplates = {
  prescriptionEnRetard: prescriptionEnRetardEmail,
  commissionAPrevoir: commissionARapprochementEmail,
  commandeIntervention: commandeInterventionEmail,
  verificationAPrevoir: verificationARealiserEmail,
  visitePlanifiee: visitePlanifieeEmail,
  recapHebdomadaire: recapHebdomadaireEmail,
};

export default emailTemplates;
