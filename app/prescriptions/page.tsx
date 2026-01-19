'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Prescription {
  id: string;
  numero_observation: string;
  description: string;
  criticite: string;
  statut_detaille: string;
  priorite: string;
  delai_jours: number;
  date_echeance: string;
  groupement_nom: string;
  etablissement_nom: string;
  cellule_reference: string;
  commission_date: string;
  prestataire_nom: string;
  cout_previsionnel: number;
  alerte_delai: string;
  nb_documents: number;
}

export default function PrescriptionsPage() {
  const [commissionIdFilter, setCommissionIdFilter] = useState<string | null>(null);
  const [groupementIdFilter, setGroupementIdFilter] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [prioriteFilter, setPrioriteFilter] = useState<string>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCommissionIdFilter(params.get('commission_id'));
      setGroupementIdFilter(params.get('groupement_id'));
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionIdFilter, groupementIdFilter]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, activeTab, prioriteFilter, searchQuery]);

  async function fetchPrescriptions() {
    try {
      let query = supabase
        .from('v_prescriptions_enrichies')
        .select('*');

      if (commissionIdFilter) {
        query = query.eq('commission_id', commissionIdFilter);
      } else if (groupementIdFilter) {
        query = query.eq('groupement_id', groupementIdFilter);
      }

      const { data, error } = await query
        .order('priorite', { ascending: true })
        .order('date_echeance', { ascending: true});

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterPrescriptions() {
    let filtered = [...prescriptions];

    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.statut_detaille === activeTab);
    }

    if (prioriteFilter !== 'all') {
      filtered = filtered.filter(p => p.priorite === prioriteFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.numero_observation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.groupement_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.etablissement_nom?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPrescriptions(filtered);
  }

  const stats = {
    total: prescriptions.length,
    nouveau: prescriptions.filter(p => p.statut_detaille === 'nouveau').length,
    en_cours: prescriptions.filter(p => p.statut_detaille === 'en_cours').length,
    en_attente: prescriptions.filter(p => p.statut_detaille === 'en_attente_validation').length,
    leve: prescriptions.filter(p => p.statut_detaille === 'leve').length,
    urgent: prescriptions.filter(p => p.priorite === 'urgent').length,
    retard: prescriptions.filter(p => p.alerte_delai === 'retard').length,
  };

  function getStatutBadge(statut: string) {
    const badges: Record<string, { label: string; bg: string; color: string }> = {
      nouveau: { label: '🆕 Nouveau', bg: '#BEE3F8', color: '#2C5282' },
      en_cours: { label: '⚙️ En cours', bg: '#FEEBC8', color: '#7C2D12' },
      en_attente_validation: { label: '⏳ En attente', bg: '#FAF089', color: '#744210' },
      leve: { label: '✓ Levé', bg: '#C6F6D5', color: '#22543D' },
      valide: { label: '✓✓ Validé', bg: '#9AE6B4', color: '#22543D' },
    };
    const badge = badges[statut] || badges.nouveau;
    return <span className="px-3 py-1 rounded-lg text-[12px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>;
  }

  function getPrioriteBadge(priorite: string) {
    const badges: Record<string, { label: string; bg: string; color: string }> = {
      urgent: { label: '🔴 URGENT', bg: '#FED7D7', color: '#742A2A' },
      haute: { label: '🟠 Haute', bg: '#FEEBC8', color: '#7C2D12' },
      normale: { label: '🟢 Normale', bg: '#C6F6D5', color: '#22543D' },
      basse: { label: '🔵 Basse', bg: '#BEE3F8', color: '#2C5282' },
    };
    const badge = badges[priorite] || badges.normale;
    return <span className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>;
  }

  function getCriticiteBadge(criticite: string) {
    const badges: Record<string, { bg: string; color: string }> = {
      critique: { bg: '#E53E3E', color: 'white' },
      majeure: { bg: '#DD6B20', color: 'white' },
      mineure: { bg: '#718096', color: 'white' },
    };
    const badge = badges[criticite] || badges.mineure;
    return <span className="px-2 py-1 rounded text-[11px] font-bold" style={{ background: badge.bg, color: badge.color }}>{criticite}</span>;
  }

  function getDelaiInfo(prescription: Prescription) {
    if (!prescription.date_echeance) return null;
    const today = new Date();
    const echeance = new Date(prescription.date_echeance);
    const diff = Math.ceil((echeance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let color = '#38A169';
    let text = `${diff}j restants`;

    if (diff < 0) {
      color = '#E53E3E';
      text = `${Math.abs(diff)}j de retard`;
    } else if (diff <= 7) {
      color = '#DD6B20';
      text = `${diff}j restants`;
    }

    return { color, text, diff };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[20px] font-bold text-[#2D3748] hover:opacity-80 transition">
              PREV'<span className="text-[#FF8C00]">HUB</span>
            </Link>
            <div className="text-[14px] text-[#718096] flex items-center gap-2">
              <Link href="/" className="text-[#4299E1] hover:underline">Tableau de bord</Link>
              <span>›</span>
              <span>Prescriptions</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#718096] text-[14px]">Thierry Nzeutem</span>
            <div className="w-8 h-8 rounded-full bg-[#FF8C00] text-white flex items-center justify-center font-semibold text-[14px]">
              TN
            </div>
          </div>
        </div>
        {(commissionIdFilter || groupementIdFilter) && (
          <div className="max-w-[1600px] mx-auto px-6 py-3 bg-[#EBF4FF] border-t border-[#BEE3F8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px]">
                <span className="text-[#2C5282] font-semibold">📌 Filtre actif :</span>
                <span className="text-[#4A5568]">
                  {commissionIdFilter ? 'Prescriptions de cette commission uniquement' : 'Prescriptions de ce groupement uniquement'}
                </span>
              </div>
              <Link
                href="/prescriptions"
                className="px-3 py-1 bg-white border border-[#BEE3F8] text-[#2C5282] rounded-lg font-semibold hover:bg-[#F7FAFC] transition text-[13px]"
              >
                ✕ Afficher toutes les prescriptions
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[32px] font-bold text-[#2D3748] mb-2">⚠️ Prescriptions</h1>
            <p className="text-[15px] text-[#718096]">Gestion et suivi des prescriptions de sécurité</p>
          </div>
          <button className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition">
            ➕ Nouvelle prescription
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#4299E1]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">TOTAL</div>
            <div className="text-[28px] font-bold text-[#2D3748]">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#E53E3E]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">URGENT</div>
            <div className="text-[28px] font-bold text-[#E53E3E]">{stats.urgent}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#DD6B20]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">RETARD</div>
            <div className="text-[28px] font-bold text-[#DD6B20]">{stats.retard}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#4299E1]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">NOUVEAU</div>
            <div className="text-[28px] font-bold text-[#4299E1]">{stats.nouveau}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#DD6B20]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">EN COURS</div>
            <div className="text-[28px] font-bold text-[#DD6B20]">{stats.en_cours}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#38A169]">
            <div className="text-[13px] text-[#718096] font-semibold mb-1">LEVÉ</div>
            <div className="text-[28px] font-bold text-[#38A169]">{stats.leve}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Rechercher une prescription..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>
            <select
              value={prioriteFilter}
              onChange={(e) => setPrioriteFilter(e.target.value)}
              className="px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            >
              <option value="all">Toutes priorités</option>
              <option value="urgent">🔴 Urgent</option>
              <option value="haute">🟠 Haute</option>
              <option value="normale">🟢 Normale</option>
              <option value="basse">🔵 Basse</option>
            </select>
          </div>

          <div className="flex gap-2 border-b border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-semibold text-[14px] border-b-2 -mb-px transition ${
                activeTab === 'all' ? 'text-[#FF8C00] border-[#FF8C00]' : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              Toutes ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('nouveau')}
              className={`px-4 py-2 font-semibold text-[14px] border-b-2 -mb-px transition ${
                activeTab === 'nouveau' ? 'text-[#FF8C00] border-[#FF8C00]' : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              Nouveau ({stats.nouveau})
            </button>
            <button
              onClick={() => setActiveTab('en_cours')}
              className={`px-4 py-2 font-semibold text-[14px] border-b-2 -mb-px transition ${
                activeTab === 'en_cours' ? 'text-[#FF8C00] border-[#FF8C00]' : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              En cours ({stats.en_cours})
            </button>
            <button
              onClick={() => setActiveTab('en_attente_validation')}
              className={`px-4 py-2 font-semibold text-[14px] border-b-2 -mb-px transition ${
                activeTab === 'en_attente_validation' ? 'text-[#FF8C00] border-[#FF8C00]' : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              En attente ({stats.en_attente})
            </button>
            <button
              onClick={() => setActiveTab('leve')}
              className={`px-4 py-2 font-semibold text-[14px] border-b-2 -mb-px transition ${
                activeTab === 'leve' ? 'text-[#FF8C00] border-[#FF8C00]' : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              Levé ({stats.leve})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPrescriptions.map((prescription) => {
            const delaiInfo = getDelaiInfo(prescription);

            return (
              <Link
                key={prescription.id}
                href={`/prescriptions/${prescription.id}`}
                className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4"
                style={{ borderLeftColor: prescription.alerte_delai === 'retard' ? '#E53E3E' : prescription.alerte_delai === 'urgent' ? '#DD6B20' : '#38A169' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-[16px] text-[#2D3748]">{prescription.numero_observation}</div>
                    {getPrioriteBadge(prescription.priorite)}
                    {getCriticiteBadge(prescription.criticite)}
                    {getStatutBadge(prescription.statut_detaille)}
                  </div>
                  {delaiInfo && (
                    <div className="px-3 py-1 rounded-lg font-bold text-[13px]" style={{ background: delaiInfo.color + '20', color: delaiInfo.color }}>
                      ⏰ {delaiInfo.text}
                    </div>
                  )}
                </div>

                <div className="text-[15px] text-[#4A5568] mb-3">{prescription.description}</div>

                <div className="flex items-center gap-4 text-[13px] text-[#718096] mb-3">
                  {prescription.groupement_nom && (
                    <span>🏢 {prescription.groupement_nom}</span>
                  )}
                  {prescription.cellule_reference ? (
                    <>
                      <span>›</span>
                      <span className="font-semibold text-[#FF8C00]">📍 Cellule {prescription.cellule_reference}</span>
                      {prescription.etablissement_nom && (
                        <span className="text-[#718096]"> ({prescription.etablissement_nom})</span>
                      )}
                    </>
                  ) : prescription.etablissement_nom ? (
                    <>
                      <span>›</span>
                      <span className="font-semibold text-[#FF8C00]">📍 {prescription.etablissement_nom}</span>
                    </>
                  ) : (
                    <>
                      <span>›</span>
                      <span className="text-[#4A5568]">Toutes cellules</span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[13px] text-[#718096]">
                    {prescription.commission_date && (
                      <span>📅 Commission: {new Date(prescription.commission_date).toLocaleDateString('fr-FR')}</span>
                    )}
                    {prescription.prestataire_nom && (
                      <span>🔧 {prescription.prestataire_nom}</span>
                    )}
                    {prescription.nb_documents > 0 && (
                      <span>📎 {prescription.nb_documents} document{prescription.nb_documents > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {prescription.cout_previsionnel && (
                    <div className="font-bold text-[14px] text-[#2D3748]">
                      💰 {prescription.cout_previsionnel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {filteredPrescriptions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune prescription trouvée</div>
            <div className="text-[14px] text-[#718096]">Modifiez vos filtres pour voir plus de résultats</div>
          </div>
        )}
      </main>
    </div>
  );
}
