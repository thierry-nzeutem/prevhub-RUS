// ============================================
// PREV'HUB - API Recherche Globale
// Recherche unifiée sur toutes les entités
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Configuration
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================
// Types
// ============================================

interface SearchResult {
  id: string;
  type: 'etablissements' | 'groupements' | 'prescriptions' | 'visites' | 'commissions';
  title: string;
  subtitle?: string;
  url: string;
  metadata?: Record<string, any>;
  score: number;
}

// ============================================
// GET - Recherche globale
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q');
    const scope = searchParams.get('scope') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];
    const searchTerm = `%${query}%`;

    // Recherche établissements
    if (scope === 'all' || scope === 'etablissements') {
      const { data: etablissements } = await supabase
        .from('etablissements')
        .select('id, nom_commercial, enseigne, adresse, ville, type_erp, categorie_erp')
        .eq('actif', true)
        .or(`nom_commercial.ilike.${searchTerm},enseigne.ilike.${searchTerm},adresse.ilike.${searchTerm},ville.ilike.${searchTerm}`)
        .limit(limit);

      if (etablissements) {
        results.push(
          ...etablissements.map((e) => ({
            id: e.id,
            type: 'etablissements' as const,
            title: e.nom_commercial || e.enseigne || 'Établissement',
            subtitle: `${e.adresse}, ${e.ville} • Type ${e.type_erp || '?'} Cat ${e.categorie_erp || '?'}`,
            url: `/etablissements/${e.id}`,
            metadata: { type_erp: e.type_erp, categorie_erp: e.categorie_erp },
            score: calculateScore(query, [e.nom_commercial, e.enseigne, e.ville]),
          }))
        );
      }
    }

    // Recherche groupements
    if (scope === 'all' || scope === 'groupements') {
      const { data: groupements } = await supabase
        .from('groupements')
        .select('id, nom, type, ville')
        .eq('actif', true)
        .or(`nom.ilike.${searchTerm},ville.ilike.${searchTerm}`)
        .limit(limit);

      if (groupements) {
        results.push(
          ...groupements.map((g) => ({
            id: g.id,
            type: 'groupements' as const,
            title: g.nom,
            subtitle: `${g.type || 'Groupement'} • ${g.ville || ''}`,
            url: `/groupements/${g.id}`,
            metadata: { type: g.type },
            score: calculateScore(query, [g.nom, g.ville]),
          }))
        );
      }
    }

    // Recherche prescriptions
    if (scope === 'all' || scope === 'prescriptions') {
      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select(`
          id, 
          numero_prescription, 
          description_reformulee,
          description_complete, 
          statut,
          priorite,
          etablissement:etablissements(nom_commercial, ville)
        `)
        .eq('actif', true)
        .or(`numero_prescription.ilike.${searchTerm},description_reformulee.ilike.${searchTerm},description_complete.ilike.${searchTerm}`)
        .limit(limit);

      if (prescriptions) {
        results.push(
          ...prescriptions.map((p: any) => ({
            id: p.id,
            type: 'prescriptions' as const,
            title: `${p.numero_prescription || 'Prescription'}`,
            subtitle: `${p.etablissement?.nom_commercial || ''} • ${p.description_reformulee?.substring(0, 50) || p.description_complete?.substring(0, 50) || ''}...`,
            url: `/prescriptions/${p.id}`,
            metadata: { statut: p.statut, priorite: p.priorite },
            score: calculateScore(query, [p.numero_prescription, p.description_reformulee, p.description_complete]),
          }))
        );
      }
    }

    // Recherche visites
    if (scope === 'all' || scope === 'visites') {
      const { data: visites } = await supabase
        .from('visites')
        .select(`
          id,
          date,
          type_visite,
          statut,
          etablissement:etablissements(nom_commercial, ville),
          groupement:groupements(nom)
        `)
        .or(`type_visite.ilike.${searchTerm}`)
        .limit(limit);

      if (visites) {
        results.push(
          ...visites.map((v: any) => ({
            id: v.id,
            type: 'visites' as const,
            title: `Visite ${v.type_visite || ''} - ${v.date}`,
            subtitle: v.etablissement?.nom_commercial || v.groupement?.nom || '',
            url: `/visites/${v.id}`,
            metadata: { statut: v.statut, date: v.date },
            score: calculateScore(query, [v.type_visite, v.etablissement?.nom_commercial]),
          }))
        );
      }
    }

    // Recherche commissions
    if (scope === 'all' || scope === 'commissions') {
      const { data: commissions } = await supabase
        .from('commissions')
        .select(`
          id,
          date,
          type,
          lieu,
          etablissement:etablissements(nom_commercial, ville),
          groupement:groupements(nom)
        `)
        .or(`type.ilike.${searchTerm},lieu.ilike.${searchTerm}`)
        .limit(limit);

      if (commissions) {
        results.push(
          ...commissions.map((c: any) => ({
            id: c.id,
            type: 'commissions' as const,
            title: `Commission ${c.type || ''} - ${c.date}`,
            subtitle: c.etablissement?.nom_commercial || c.groupement?.nom || c.lieu || '',
            url: `/commissions/${c.id}`,
            metadata: { type: c.type, date: c.date },
            score: calculateScore(query, [c.type, c.lieu, c.etablissement?.nom_commercial]),
          }))
        );
      }
    }

    // Trier par score et limiter
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      results: sortedResults,
      total: results.length,
      query,
      scope,
    });
  } catch (error) {
    console.error('Erreur API recherche:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}

// ============================================
// Utilitaires
// ============================================

/**
 * Calculer un score de pertinence basique
 */
function calculateScore(query: string, fields: (string | null | undefined)[]): number {
  const normalizedQuery = query.toLowerCase().trim();
  let score = 0;

  for (const field of fields) {
    if (!field) continue;
    const normalizedField = field.toLowerCase();

    // Match exact au début = score élevé
    if (normalizedField.startsWith(normalizedQuery)) {
      score += 100;
    }
    // Match exact quelque part = score moyen
    else if (normalizedField.includes(normalizedQuery)) {
      score += 50;
    }
    // Match partiel des mots
    else {
      const queryWords = normalizedQuery.split(/\s+/);
      const fieldWords = normalizedField.split(/\s+/);
      
      for (const qWord of queryWords) {
        for (const fWord of fieldWords) {
          if (fWord.startsWith(qWord)) {
            score += 25;
          } else if (fWord.includes(qWord)) {
            score += 10;
          }
        }
      }
    }
  }

  return score;
}
