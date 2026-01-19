'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Etablissement {
  id: string;
  nom_commercial: string;
  enseigne: string | null;
  logo: string | null;
  ville: string | null;
  types_erp: string[];
  categorie_erp: string | null;
  effectif_public: number;
  surface_m2: number | null;
  groupement_id: string | null;
  ge5_affiche: boolean;
  sogs_transmis: boolean;
  groupement?: {
    nom: string;
  };
}

export default function EtablissementsPage() {
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEtablissements();
  }, []);

  async function fetchEtablissements() {
    try {
      const { data, error } = await supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(nom)
        `)
        .order('nom_commercial');

      if (error) throw error;
      setEtablissements(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des établissements:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEtablissements = etablissements.filter((e) =>
    e.nom_commercial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.enseigne?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.ville?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: etablissements.length,
    ge5NonAffiche: etablissements.filter(e => !e.ge5_affiche).length,
    sogsNonTransmis: etablissements.filter(e => !e.sogs_transmis && e.types_erp.includes('M')).length,
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:opacity-80 transition">
            PREV'<span className="text-[#FF8C00]">HUB</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Thierry Nzeutem</span>
            <div className="w-8 h-8 rounded-full bg-[#FF8C00] text-white flex items-center justify-center font-semibold text-sm">
              TN
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
            ← Retour aux groupements
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">🏪 Tous les Établissements</h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <div>
                <div className="text-xs text-gray-600">Total</div>
                <div className="text-xl font-bold text-gray-800">{stats.total}</div>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-xs text-gray-600">GE5 non affiché</div>
                <div className="text-xl font-bold text-[#E53E3E]">{stats.ge5NonAffiche}</div>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <div>
                <div className="text-xs text-gray-600">SOGS manquant</div>
                <div className="text-xl font-bold text-[#DD6B20]">{stats.sogsNonTransmis}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-5 gap-4">
          <div className="flex-1 max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un établissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm hover:bg-gray-50 transition">
              📍 Toutes les villes
            </button>
            <button className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm hover:bg-gray-50 transition">
              🏷️ Type ERP
            </button>
            <button className="px-4 py-2 bg-[#FF8C00] text-white rounded-lg text-sm font-semibold hover:bg-[#E67E00] transition">
              ➕ Nouvel établissement
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEtablissements.map((etablissement) => (
              <Link
                key={etablissement.id}
                href={`/etablissements/${etablissement.id}`}
                className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                    {etablissement.logo ? (
                      <img src={etablissement.logo} alt={etablissement.nom_commercial} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">🏪</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{etablissement.nom_commercial}</h3>
                    {etablissement.enseigne && (
                      <div className="text-sm text-gray-600 mb-1">{etablissement.enseigne}</div>
                    )}
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      {etablissement.groupement ? (
                        <>
                          <span>🏢</span>
                          <span className="truncate">{etablissement.groupement.nom}</span>
                        </>
                      ) : (
                        <>
                          <span>📍</span>
                          <span>{etablissement.ville || 'Non renseigné'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold">
                    Type {etablissement.types_erp.join(', ')}
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm font-semibold">
                    {etablissement.categorie_erp || 'N/A'}
                  </span>
                </div>

                <div className="flex gap-3 mb-4 flex-wrap text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    👥 {etablissement.effectif_public} pers.
                  </span>
                  {etablissement.surface_m2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      📐 {etablissement.surface_m2} m²
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      etablissement.ge5_affiche
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    GE5 {etablissement.ge5_affiche ? '✓' : '✗'}
                  </span>
                  {etablissement.types_erp.includes('M') && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        etablissement.sogs_transmis
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      SOGS {etablissement.sogs_transmis ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredEtablissements.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-2">Aucun établissement trouvé</p>
            <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
          </div>
        )}
      </main>
    </div>
  );
}
