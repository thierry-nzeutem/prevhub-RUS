// ============================================
// PREV'HUB - Service Génération PDF
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';

// ============================================
// Types
// ============================================

interface RapportVisite {
  visite: any;
  observations: any[];
  etablissement: any;
  groupement: any;
  preventionniste: any;
}

interface RapportCommission {
  commission: any;
  prescriptions: any[];
  etablissement: any;
  groupement: any;
  participants: any[];
}

// ============================================
// POST - Générer un rapport PDF
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient(cookieStore);

    const body = await request.json();
    const { type, id, options = {} } = body;

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let pdfContent: string;
    let filename: string;

    switch (type) {
      case 'visite':
        const visiteData = await getVisiteData(id, supabase);
        pdfContent = generateVisiteHTML(visiteData, options);
        filename = `rapport-visite-${visiteData.visite.date_visite}-${visiteData.etablissement?.nom_commercial || 'etablissement'}.pdf`;
        break;

      case 'commission':
        const commissionData = await getCommissionData(id, supabase);
        pdfContent = generateCommissionHTML(commissionData, options);
        filename = `rapport-commission-${commissionData.commission.date}-${commissionData.groupement?.nom || 'groupement'}.pdf`;
        break;

      case 'prescriptions':
        const prescriptionsData = await getPrescriptionsData(id, supabase);
        pdfContent = generatePrescriptionsHTML(prescriptionsData, options);
        filename = `synthese-prescriptions-${new Date().toISOString().split('T')[0]}.pdf`;
        break;

      case 'verification':
        const verificationData = await getVerificationData(id, supabase);
        pdfContent = generateVerificationHTML(verificationData, options);
        filename = `rapport-verification-${verificationData.installation?.nom || 'installation'}.pdf`;
        break;

      default:
        return NextResponse.json({ error: 'Type de rapport non supporté' }, { status: 400 });
    }

    // Générer le PDF avec un service externe ou Puppeteer
    const pdfBuffer = await generatePDF(pdfContent);

    // Stocker dans Supabase Storage
    const storagePath = `rapports/${user.id}/${filename}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('rapports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Créer l'entrée document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        nom: filename,
        type: type === 'visite' ? 'rapport_visite' : type === 'commission' ? 'pv_commission' : 'autre',
        mime_type: 'application/pdf',
        taille_octets: pdfBuffer.length,
        url: uploadData.path,
        storage_path: storagePath,
        entite_type: type,
        entite_id: id,
        uploaded_by_id: user.id,
        metadata: { options, generated_at: new Date().toISOString() },
      })
      .select()
      .single();

    if (docError) {
      throw docError;
    }

    // Générer l'URL signée
    const { data: signedUrl } = await supabase.storage
      .from('rapports')
      .createSignedUrl(storagePath, 3600); // 1 heure

    return NextResponse.json({
      data: {
        document,
        download_url: signedUrl?.signedUrl,
        filename,
      },
    });
  } catch (error: any) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonctions de récupération des données
// ============================================

async function getVisiteData(visiteId: string, supabase: any): Promise<RapportVisite> {
  const { data: visite } = await supabase
    .from('visites')
    .select(`
      *,
      etablissement:etablissements(*),
      groupement:groupements(*),
      preventionniste:profiles(*)
    `)
    .eq('id', visiteId)
    .single();

  const { data: observations } = await supabase
    .from('observations')
    .select('*')
    .eq('visite_id', visiteId)
    .order('created_at');

  return {
    visite,
    observations: observations || [],
    etablissement: visite?.etablissement,
    groupement: visite?.groupement,
    preventionniste: visite?.preventionniste,
  };
}

async function getCommissionData(commissionId: string, supabase: any): Promise<RapportCommission> {
  const { data: commission } = await supabase
    .from('commissions')
    .select(`
      *,
      etablissement:etablissements(*),
      groupement:groupements(*),
      participants:participants_commission(*)
    `)
    .eq('id', commissionId)
    .single();

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('commission_id', commissionId)
    .order('priorite');

  return {
    commission,
    prescriptions: prescriptions || [],
    etablissement: commission?.etablissement,
    groupement: commission?.groupement,
    participants: commission?.participants || [],
  };
}

async function getPrescriptionsData(groupementId: string, supabase: any) {
  const { data: groupement } = await supabase
    .from('groupements')
    .select('*')
    .eq('id', groupementId)
    .single();

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      *,
      commission:commissions(date, avis),
      etablissement:etablissements(nom_commercial)
    `)
    .eq('groupement_id', groupementId)
    .order('date_limite_conformite');

  return {
    groupement,
    prescriptions: prescriptions || [],
  };
}

async function getVerificationData(verificationId: string, supabase: any) {
  const { data: verification } = await supabase
    .from('verifications_periodiques')
    .select(`
      *,
      installation:installations_techniques(*, etablissement:etablissements(*), groupement:groupements(*))
    `)
    .eq('id', verificationId)
    .single();

  return {
    verification,
    installation: verification?.installation,
    etablissement: verification?.installation?.etablissement,
    groupement: verification?.installation?.groupement,
  };
}

// ============================================
// Générateurs HTML pour PDF
// ============================================

function generateVisiteHTML(data: RapportVisite, options: any): string {
  const { visite, observations, etablissement, groupement, preventionniste } = data;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de visite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .page { padding: 40px 50px; max-width: 210mm; margin: 0 auto; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f97316; }
    .logo { font-size: 24pt; font-weight: bold; color: #f97316; }
    .logo span { font-size: 10pt; color: #666; display: block; font-weight: normal; }
    .header-info { text-align: right; font-size: 9pt; color: #666; }
    
    /* Title */
    .title { font-size: 18pt; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
    .subtitle { font-size: 11pt; color: #6b7280; margin-bottom: 25px; }
    
    /* Info boxes */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
    .info-box h3 { font-size: 9pt; text-transform: uppercase; color: #9ca3af; margin-bottom: 10px; letter-spacing: 0.5px; }
    .info-box p { margin-bottom: 5px; }
    .info-box strong { color: #1f2937; }
    
    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #f97316; color: white; text-align: left; padding: 10px 12px; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) { background: #f9fafb; }
    
    /* Badges */
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
    .badge-critical { background: #fef2f2; color: #dc2626; }
    .badge-major { background: #fff7ed; color: #ea580c; }
    .badge-minor { background: #eff6ff; color: #2563eb; }
    .badge-observation { background: #f3f4f6; color: #6b7280; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; display: flex; justify-content: space-between; }
    
    /* Signatures */
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
    .signature-box { border-top: 1px solid #333; padding-top: 10px; }
    .signature-box p { font-size: 9pt; color: #666; }
    
    /* Section */
    .section { margin-bottom: 25px; }
    .section-title { font-size: 12pt; font-weight: bold; color: #1f2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
    
    /* Print */
    @media print {
      .page { padding: 20px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">
        PRÉVÉRIS
        <span>Conseil en prévention des risques</span>
      </div>
      <div class="header-info">
        <p><strong>Date:</strong> ${formatDate(visite.date_visite)}</p>
        <p><strong>Réf:</strong> ${visite.id?.substring(0, 8).toUpperCase()}</p>
      </div>
    </div>
    
    <!-- Title -->
    <h1 class="title">Rapport de visite de prévention</h1>
    <p class="subtitle">${etablissement?.nom_commercial || groupement?.nom || 'Établissement'}</p>
    
    <!-- Info -->
    <div class="info-grid">
      <div class="info-box">
        <h3>Établissement</h3>
        <p><strong>${etablissement?.nom_commercial || groupement?.nom}</strong></p>
        ${etablissement?.enseigne ? `<p>${etablissement.enseigne}</p>` : ''}
        <p>${etablissement?.adresse || ''}</p>
        <p>${etablissement?.code_postal || ''} ${etablissement?.ville || ''}</p>
        ${etablissement?.type_erp ? `<p>Type ERP: ${etablissement.type_erp} - Cat. ${etablissement.categorie_erp || ''}</p>` : ''}
      </div>
      <div class="info-box">
        <h3>Visite</h3>
        <p><strong>Date:</strong> ${formatDate(visite.date_visite)}</p>
        <p><strong>Type:</strong> ${visite.type_visite || 'Prévention'}</p>
        <p><strong>Préventionniste:</strong> ${preventionniste?.prenom || ''} ${preventionniste?.nom || ''}</p>
        <p><strong>Durée:</strong> ${visite.heure_debut || ''} - ${visite.heure_fin || ''}</p>
      </div>
    </div>
    
    <!-- Observations -->
    <div class="section">
      <h2 class="section-title">Observations (${observations.length})</h2>
      ${observations.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 8%">N°</th>
            <th style="width: 55%">Description</th>
            <th style="width: 15%">Localisation</th>
            <th style="width: 12%">Criticité</th>
            <th style="width: 10%">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${observations.map((obs, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>
              ${obs.description_reformulee || obs.description}
              ${obs.articles_reglementaires?.length ? `<br><small style="color: #9ca3af">Réf: ${obs.articles_reglementaires.join(', ')}</small>` : ''}
            </td>
            <td>${obs.localisation || '-'}</td>
            <td><span class="badge badge-${obs.criticite || 'observation'}">${obs.criticite || 'Observation'}</span></td>
            <td>${obs.statut || 'Nouvelle'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #6b7280; font-style: italic;">Aucune observation relevée lors de cette visite.</p>'}
    </div>
    
    <!-- Remarques -->
    ${visite.remarques ? `
    <div class="section">
      <h2 class="section-title">Remarques générales</h2>
      <p>${visite.remarques}</p>
    </div>
    ` : ''}
    
    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-box">
        <p><strong>Représentant de l'établissement</strong></p>
        <p>Nom: ${visite.contact_present?.nom || '_________________'}</p>
        <p style="margin-top: 40px;">Signature:</p>
      </div>
      <div class="signature-box">
        <p><strong>Préventionniste PRÉVÉRIS</strong></p>
        <p>${preventionniste?.prenom || ''} ${preventionniste?.nom || ''}</p>
        <p style="margin-top: 40px;">Signature:</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>PRÉVÉRIS - Tél: 01 XX XX XX XX - contact@preveris.fr</div>
      <div>Page 1/1</div>
    </div>
  </div>
</body>
</html>
`;
}

function generateCommissionHTML(data: RapportCommission, options: any): string {
  const { commission, prescriptions, etablissement, groupement } = data;
  
  const prescriptionsByPriority = {
    urgent: prescriptions.filter(p => p.priorite === 'urgent'),
    haute: prescriptions.filter(p => p.priorite === 'haute'),
    normale: prescriptions.filter(p => p.priorite === 'normale'),
    basse: prescriptions.filter(p => p.priorite === 'basse'),
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Commission de Sécurité</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .page { padding: 40px 50px; max-width: 210mm; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #f97316; }
    .logo { font-size: 24pt; font-weight: bold; color: #f97316; }
    .title { font-size: 18pt; font-weight: bold; color: #1f2937; margin-bottom: 5px; }
    .avis-box { display: inline-block; padding: 8px 20px; border-radius: 6px; font-weight: bold; font-size: 12pt; margin-bottom: 20px; }
    .avis-favorable { background: #dcfce7; color: #166534; }
    .avis-defavorable { background: #fef2f2; color: #dc2626; }
    .avis-suspendu { background: #fef3c7; color: #92400e; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
    .info-box h3 { font-size: 9pt; text-transform: uppercase; color: #9ca3af; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th { background: #f97316; color: white; text-align: left; padding: 10px 12px; font-size: 9pt; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 12pt; font-weight: bold; color: #1f2937; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
    .badge-urgent { background: #fef2f2; color: #dc2626; }
    .badge-haute { background: #fff7ed; color: #ea580c; }
    .badge-normale { background: #eff6ff; color: #2563eb; }
    .badge-basse { background: #f3f4f6; color: #6b7280; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; }
    @media print { .page { padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">PRÉVÉRIS</div>
      <div style="text-align: right; font-size: 9pt; color: #666;">
        <p><strong>Date commission:</strong> ${formatDate(commission.date)}</p>
        <p><strong>Type:</strong> ${commission.type || 'Sécurité'}</p>
      </div>
    </div>
    
    <h1 class="title">Rapport de Commission de Sécurité</h1>
    <p style="color: #6b7280; margin-bottom: 15px;">${groupement?.nom || etablissement?.nom_commercial}</p>
    
    <div class="avis-box avis-${commission.avis || 'suspendu'}">
      Avis: ${commission.avis === 'favorable' ? 'FAVORABLE' : commission.avis === 'defavorable' ? 'DÉFAVORABLE' : 'EN ATTENTE'}
    </div>
    
    <div class="info-grid">
      <div class="info-box">
        <h3>Établissement</h3>
        <p><strong>${etablissement?.nom_commercial || groupement?.nom}</strong></p>
        <p>${etablissement?.adresse || ''}</p>
        <p>${etablissement?.code_postal || ''} ${etablissement?.ville || ''}</p>
      </div>
      <div class="info-box">
        <h3>Synthèse</h3>
        <p><strong>${prescriptions.length}</strong> prescriptions émises</p>
        <p><strong>${prescriptionsByPriority.urgent.length}</strong> urgentes</p>
        <p><strong>${prescriptionsByPriority.haute.length}</strong> priorité haute</p>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Prescriptions (${prescriptions.length})</h2>
      ${prescriptions.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 10%">N°</th>
            <th style="width: 50%">Description</th>
            <th style="width: 15%">Échéance</th>
            <th style="width: 12%">Priorité</th>
            <th style="width: 13%">Statut</th>
          </tr>
        </thead>
        <tbody>
          ${prescriptions.map((p, i) => `
          <tr>
            <td>${p.numero_prescription || i + 1}</td>
            <td>${p.description_complete}</td>
            <td>${p.date_limite_conformite ? formatDate(p.date_limite_conformite) : '-'}</td>
            <td><span class="badge badge-${p.priorite}">${p.priorite}</span></td>
            <td>${p.statut}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #6b7280;">Aucune prescription émise.</p>'}
    </div>
    
    <div class="footer">
      <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} - PRÉVÉRIS</p>
    </div>
  </div>
</body>
</html>
`;
}

function generatePrescriptionsHTML(data: any, options: any): string {
  // Synthèse des prescriptions d'un groupement
  const { groupement, prescriptions } = data;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Synthèse Prescriptions</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    .page { padding: 30px; }
    .title { font-size: 16pt; font-weight: bold; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
    th { background: #f97316; color: white; }
    .footer { margin-top: 30px; font-size: 8pt; color: #999; }
  </style>
</head>
<body>
  <div class="page">
    <h1 class="title">Synthèse des prescriptions - ${groupement?.nom || 'Groupement'}</h1>
    <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
    <p>Total: ${prescriptions.length} prescriptions</p>
    
    <table style="margin-top: 20px;">
      <thead>
        <tr>
          <th>N°</th>
          <th>Établissement</th>
          <th>Description</th>
          <th>Échéance</th>
          <th>Priorité</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${prescriptions.map((p: any, i: number) => `
        <tr>
          <td>${p.numero_prescription || i + 1}</td>
          <td>${p.etablissement?.nom_commercial || '-'}</td>
          <td>${p.description_complete?.substring(0, 100)}${p.description_complete?.length > 100 ? '...' : ''}</td>
          <td>${p.date_limite_conformite ? formatDate(p.date_limite_conformite) : '-'}</td>
          <td>${p.priorite}</td>
          <td>${p.statut}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">PRÉVÉRIS - Document confidentiel</div>
  </div>
</body>
</html>
`;
}

function generateVerificationHTML(data: any, options: any): string {
  const { verification, installation, etablissement, groupement } = data;
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Vérification</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    .page { padding: 30px; }
    .title { font-size: 16pt; font-weight: bold; margin-bottom: 20px; }
    .info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="page">
    <h1 class="title">Rapport de Vérification Technique</h1>
    
    <div class="info">
      <p><strong>Installation:</strong> ${installation?.nom || '-'}</p>
      <p><strong>Type:</strong> ${installation?.type_installation || '-'}</p>
      <p><strong>Établissement:</strong> ${etablissement?.nom_commercial || groupement?.nom || '-'}</p>
      <p><strong>Date vérification:</strong> ${verification?.date_verification ? formatDate(verification.date_verification) : '-'}</p>
      <p><strong>Prochaine échéance:</strong> ${verification?.date_prochaine_verification ? formatDate(verification.date_prochaine_verification) : '-'}</p>
    </div>
    
    <h2>Résultat</h2>
    <p><strong>Conformité:</strong> ${verification?.est_conforme ? 'Conforme' : 'Non conforme'}</p>
    
    ${verification?.observations ? `<h2>Observations</h2><p>${verification.observations}</p>` : ''}
  </div>
</body>
</html>
`;
}

// ============================================
// Génération PDF
// ============================================

async function generatePDF(htmlContent: string): Promise<Buffer> {
  // Option 1: Utiliser un service externe comme html-pdf-node, Puppeteer, ou un service SaaS
  
  // Pour l'instant, on retourne le HTML encodé en base64
  // Dans une vraie implémentation, utiliser Puppeteer ou un service comme html2pdf.app
  
  try {
    // Exemple avec un service externe (à remplacer par votre solution)
    const response = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.HTML2PDF_API_KEY}`,
      },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          format: 'A4',
          margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        },
      }),
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (error) {
    console.warn('Service PDF externe non disponible, utilisation du fallback');
  }

  // Fallback: retourner le HTML comme "PDF" (pour tests)
  return Buffer.from(htmlContent, 'utf-8');
}

// ============================================
// Utilitaires
// ============================================

function formatDate(date: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
