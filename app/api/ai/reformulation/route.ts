// ============================================
// PREV'HUB - API Route Reformulation IA
// Reformulation automatique des prescriptions
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================
// Configuration Anthropic
// ============================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ============================================
// Prompt système pour la reformulation
// ============================================

const SYSTEM_PROMPT = `Tu es un expert en prévention incendie et sécurité des ERP (Établissements Recevant du Public) en France.
Tu reformules des prescriptions de sécurité pour les rendre :
- Claires et précises
- Conformes à la réglementation (Code de la construction, règlement de sécurité contre l'incendie)
- Professionnelles et formelles
- Actionnables pour l'exploitant

RÈGLES DE REFORMULATION :
1. Utiliser la terminologie réglementaire exacte
2. Être précis sur les références normatives si possible (NFS, EN, etc.)
3. Indiquer clairement l'action à réaliser
4. Éviter les termes vagues
5. Structurer en une phrase ou deux maximum
6. Garder le sens original

EXEMPLES :
- Original: "extincteur manquant dans le couloir"
  Reformulé: "Installer un extincteur à eau pulvérisée de 6 litres dans le couloir principal, conformément à l'article MS 38 du règlement de sécurité."

- Original: "sortie de secours bloquée par des cartons"
  Reformulé: "Dégager et maintenir libre de tout obstacle le dégagement menant à l'issue de secours, conformément à l'article CO 37."

- Original: "éclairage de sécurité hs"
  Reformulé: "Remettre en état de fonctionnement les blocs d'éclairage de sécurité BAES défaillants et effectuer l'essai de mise en sécurité conformément à l'article EC 14."

Réponds UNIQUEMENT avec la prescription reformulée, sans commentaire ni explication.`;

// ============================================
// POST - Reformuler une prescription
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      texte_original, 
      type_erp, 
      categorie_erp, 
      type_installation,
      contexte_supplementaire,
    } = body;

    if (!texte_original || texte_original.trim().length < 5) {
      return NextResponse.json(
        { error: 'Texte de prescription requis (minimum 5 caractères)' },
        { status: 400 }
      );
    }

    // Construire le prompt avec contexte
    let contextInfo = '';
    if (type_erp) contextInfo += `Type ERP: ${type_erp}. `;
    if (categorie_erp) contextInfo += `Catégorie: ${categorie_erp}. `;
    if (type_installation) contextInfo += `Installation concernée: ${type_installation}. `;
    if (contexte_supplementaire) contextInfo += `Contexte: ${contexte_supplementaire}. `;

    const userMessage = contextInfo 
      ? `Contexte: ${contextInfo}\n\nPrescription à reformuler: "${texte_original}"`
      : `Prescription à reformuler: "${texte_original}"`;

    // Vérifier si l'API Anthropic est configurée
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      // Mode fallback: reformulation basique sans IA
      const reformulee = reformulationBasique(texte_original);
      return NextResponse.json({
        success: true,
        data: {
          texte_original,
          texte_reformule: reformulee,
          score_confiance: 0.6,
          mode: 'fallback',
        },
      });
    }

    // Appel à l'API Anthropic
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Anthropic:', errorData);
      
      // Fallback en cas d'erreur
      const reformulee = reformulationBasique(texte_original);
      return NextResponse.json({
        success: true,
        data: {
          texte_original,
          texte_reformule: reformulee,
          score_confiance: 0.5,
          mode: 'fallback',
          warning: 'Reformulation IA indisponible, mode basique utilisé',
        },
      });
    }

    const aiResponse = await response.json();
    const texteReformule = aiResponse.content[0]?.text?.trim();

    if (!texteReformule) {
      return NextResponse.json(
        { error: 'Réponse IA invalide' },
        { status: 500 }
      );
    }

    // Calculer un score de confiance basé sur la longueur et la structure
    const scoreConfiance = calculerScoreConfiance(texte_original, texteReformule);

    return NextResponse.json({
      success: true,
      data: {
        texte_original,
        texte_reformule: texteReformule,
        score_confiance: scoreConfiance,
        mode: 'ia',
        model: 'claude-3-haiku',
        tokens_utilises: aiResponse.usage?.output_tokens || 0,
      },
    });

  } catch (error) {
    console.error('Erreur reformulation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reformulation' },
      { status: 500 }
    );
  }
}

// ============================================
// Reformulation basique (fallback)
// ============================================

function reformulationBasique(texte: string): string {
  let reformule = texte.trim();
  
  // Capitaliser la première lettre
  reformule = reformule.charAt(0).toUpperCase() + reformule.slice(1);
  
  // Remplacements courants
  const remplacements: [RegExp, string][] = [
    [/\bhs\b/gi, 'hors service'],
    [/\bko\b/gi, 'défaillant'],
    [/\bok\b/gi, 'conforme'],
    [/\bmanque\b/gi, 'absence de'],
    [/\bpas de\b/gi, 'absence de'],
    [/\bil manque\b/gi, 'installer'],
    [/\bbloqué\b/gi, 'obstrué'],
    [/\bcassé\b/gi, 'endommagé'],
    [/\bfaut\b/gi, 'il est nécessaire de'],
    [/\bdoit\b/gi, 'devra'],
    [/\bextincteur\b/gi, 'extincteur portatif'],
    [/\bbaes\b/gi, 'bloc autonome d\'éclairage de sécurité (BAES)'],
    [/\bssi\b/gi, 'système de sécurité incendie (SSI)'],
    [/\bria\b/gi, 'robinet d\'incendie armé (RIA)'],
  ];

  for (const [pattern, replacement] of remplacements) {
    reformule = reformule.replace(pattern, replacement);
  }
  
  // Ajouter un point final si absent
  if (!/[.!?]$/.test(reformule)) {
    reformule += '.';
  }

  return reformule;
}

// ============================================
// Calcul du score de confiance
// ============================================

function calculerScoreConfiance(original: string, reformule: string): number {
  let score = 0.7; // Score de base

  // Bonus si la reformulation est plus longue (plus détaillée)
  if (reformule.length > original.length * 1.5) {
    score += 0.1;
  }

  // Bonus si contient une référence réglementaire
  if (/article\s+[A-Z]{1,3}\s*\d+/i.test(reformule)) {
    score += 0.1;
  }

  // Bonus si contient une référence normative
  if (/NF[S\s]?\d+|EN\s*\d+/i.test(reformule)) {
    score += 0.05;
  }

  // Malus si trop court
  if (reformule.length < 50) {
    score -= 0.1;
  }

  // Plafonner entre 0.5 et 0.95
  return Math.min(0.95, Math.max(0.5, score));
}

// ============================================
// POST - Reformuler en batch (plusieurs prescriptions)
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { prescriptions } = body;

    if (!prescriptions || !Array.isArray(prescriptions)) {
      return NextResponse.json(
        { error: 'Liste de prescriptions requise' },
        { status: 400 }
      );
    }

    // Limiter à 10 prescriptions par batch
    const batch = prescriptions.slice(0, 10);
    const resultats = [];

    for (const prescription of batch) {
      try {
        // Reformulation basique pour le batch (pour éviter les coûts API)
        const reformulee = reformulationBasique(prescription.texte);
        resultats.push({
          id: prescription.id,
          texte_original: prescription.texte,
          texte_reformule: reformulee,
          score_confiance: 0.6,
          success: true,
        });
      } catch (err) {
        resultats.push({
          id: prescription.id,
          texte_original: prescription.texte,
          success: false,
          error: 'Erreur reformulation',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: resultats,
      total: resultats.length,
      reussis: resultats.filter(r => r.success).length,
    });

  } catch (error) {
    console.error('Erreur batch reformulation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la reformulation batch' },
      { status: 500 }
    );
  }
}
