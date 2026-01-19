'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Groupement {
  id: string;
  nom: string;
  logo: string | null;
  ville: string | null;
  types_erp: string[];
  categorie_erp: string | null;
  avis_derniere_commission: string | null;
  prochaine_commission: string | null;
  etablissements?: Etablissement[];
  observations_count?: number;
}

interface Etablissement {
  id: string;
  nom_commercial: string;
  types_erp: string[];
}

export default function GroupementsPage() {
  const [groupements, setGroupements] = useState<Groupement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('tous');

  useEffect(() => {
    fetchGroupements();
  }, []);

  async function fetchGroupements() {
    try {
      const { data: groupementsData, error } = await supabase
        .from('groupements')
        .select('*')
        .order('nom');

      if (error) throw error;

      const groupementsWithDetails = await Promise.all(
        (groupementsData || []).map(async (groupement: any) => {
          const { data: etablissements } = await supabase
            .from('etablissements')
            .select('id, nom_commercial, types_erp')
            .eq('groupement_id', groupement.id)
            .order('nom_commercial');

          const { count: observationsCount } = await supabase
            .from('observations')
            .select('*', { count: 'exact', head: true })
            .eq('groupement_id', groupement.id);

          return {
            ...groupement,
            etablissements: etablissements || [],
            observations_count: observationsCount || 0,
          };
        })
      );

      setGroupements(groupementsWithDetails);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroupements = groupements.filter((g) =>
    g.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.ville?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEtablissements = groupements.reduce((sum, g) => sum + (g.etablissements?.length || 0), 0);
  const totalAlertes = groupements.reduce((sum, g) => sum + (g.observations_count || 0), 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'M':
        return { bg: '#EBF4FF', color: '#3182CE' };
      case 'N':
        return { bg: '#FED7E2', color: '#C53030' };
      case 'O':
        return { bg: '#FEEBC8', color: '#C05621' };
      default:
        return { bg: '#F7FAFC', color: '#4A5568' };
    }
  };

  const getStatusStyle = (avis: string | null) => {
    switch (avis) {
      case 'favorable':
        return { bg: '#F0FFF4', color: '#38A169', label: 'Favorable' };
      case 'defavorable':
        return { bg: '#FFF5F5', color: '#E53E3E', label: 'Défavorable' };
      default:
        return { bg: '#FFFAF0', color: '#DD6B20', label: 'Avec réserves' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-gray-600 transition">
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

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">🏢 Groupements & Établissements</h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <div>
                <div className="text-xs text-gray-600">Groupements</div>
                <div className="text-xl font-bold text-gray-800">{groupements.length}</div>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <div>
                <div className="text-xs text-gray-600">Établissements</div>
                <div className="text-xl font-bold text-gray-800">{totalEtablissements}</div>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-xs text-gray-600">Alertes</div>
                <div className="text-xl font-bold text-[#DD6B20]">{totalAlertes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              ⚠️ Alertes urgentes
            </h2>
            <a href="#" className="text-sm text-blue-600 font-semibold hover:underline">
              Voir tout →
            </a>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
              <div className="text-xl text-orange-600">🔥</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  Vérification périodique en retard - Éclairage de sécurité
                </div>
                <div className="text-sm text-gray-600">
                  E. Leclerc - Villeparisis • Dernier contrôle : 11/03/2021 (⚠️ +3 ans)
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
              <div className="text-xl text-orange-600">📅</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm mb-1">
                  Commission de sécurité dans 45 jours
                </div>
                <div className="text-sm text-gray-600">
                  Grand Parc Bât 4 • Prévue : Avril 2025 • 12 prescriptions en cours
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-5 gap-4">
          <div className="flex-1 max-w-md relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Rechercher un groupement ou établissement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm hover:bg-gray-50 transition">
              📍 Toutes les villes
            </button>
            <button className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm hover:bg-gray-50 transition">
              🏷️ Catégorie ERP
            </button>
            <button className="px-4 py-2.5 border border-gray-200 bg-white rounded-lg text-sm hover:bg-gray-50 transition">
              ✅ Avis commission
            </button>
            <button className="px-4 py-2.5 bg-[#FF8C00] text-white rounded-lg text-sm font-semibold hover:bg-[#E67E00] transition">
              ➕ Nouveau groupement
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b-2 border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('tous')}
            className={`px-5 py-3 font-semibold -mb-0.5 border-b-3 transition ${
              activeTab === 'tous'
                ? 'text-[#FF8C00] border-[#FF8C00]'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Tous les groupements ({groupements.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-5 py-3 font-semibold -mb-0.5 border-b-3 transition ${
              activeTab === 'clients'
                ? 'text-[#FF8C00] border-[#FF8C00]'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Clients actifs (3)
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-5 py-3 font-semibold -mb-0.5 border-b-3 transition ${
              activeTab === 'commissions'
                ? 'text-[#FF8C00] border-[#FF8C00]'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Commissions à venir (2)
          </button>
          <button
            onClick={() => setActiveTab('alertes')}
            className={`px-5 py-3 font-semibold -mb-0.5 border-b-3 transition ${
              activeTab === 'alertes'
                ? 'text-[#FF8C00] border-[#FF8C00]'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Alertes (7)
          </button>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredGroupements.map((groupement) => {
              const status = getStatusStyle(groupement.avis_derniere_commission);
              const visibleEtablissements = groupement.etablissements?.slice(0, 3) || [];
              const remainingCount = (groupement.etablissements?.length || 0) - 3;

              return (
                <Link
                  key={groupement.id}
                  href={`/groupements/${groupement.id}`}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition border-2 border-transparent hover:border-[#FF8C00] cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-[60px] h-[60px] rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                      {groupement.logo ? (
                        <img
                          src={groupement.logo}
                          alt={groupement.nom}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">🏢</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{groupement.nom}</h3>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>📍</span>
                        <span>{groupement.ville || 'Non renseigné'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Meta */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                      🏗️ Groupement
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                      👥 {groupement.etablissements?.length || 0} établissements
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                      📊 {groupement.observations_count || 0} observations
                    </span>
                  </div>

                  {/* ERP Classification */}
                  <div className="flex gap-2 mb-4">
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-semibold">
                      Type {groupement.types_erp.join(', ')}
                    </span>
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-semibold">
                      {groupement.categorie_erp || 'N/A'}
                    </span>
                  </div>

                  {/* Etablissements List */}
                  {visibleEtablissements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">
                        Établissements
                      </div>
                      <div className="space-y-1.5">
                        {visibleEtablissements.map((etab) => (
                          <div
                            key={etab.id}
                            className="flex justify-between items-center py-2 px-2 bg-gray-50 rounded-md text-sm"
                          >
                            <span className="text-gray-900 font-medium">{etab.nom_commercial}</span>
                            <div className="flex gap-1.5">
                              {etab.types_erp.map((type) => {
                                const typeColor = getTypeColor(type);
                                return (
                                  <div
                                    key={type}
                                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                                    style={{ background: typeColor.bg, color: typeColor.color }}
                                  >
                                    {type}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="text-center py-2 text-gray-600 text-sm">
                            + {remainingCount} autre{remainingCount > 1 ? 's' : ''} établissement
                            {remainingCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-600">
                      📅 Prochaine:{' '}
                      {groupement.prochaine_commission
                        ? new Date(groupement.prochaine_commission).toLocaleDateString('fr-FR', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && filteredGroupements.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-2">Aucun groupement trouvé</p>
            <p className="text-sm">Essayez de modifier vos filtres de recherche</p>
          </div>
        )}
      </main>
    </div>
  );
}
