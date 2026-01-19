'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Commission {
  id: string;
  date: string;
  heure: string | null;
  type: 'securite' | 'accessibilite' | 'mixte';
  etablissement_id: string | null;
  groupement_id: string | null;
  objet: string;
  objet_details: string | null;
  reference: string | null;
  affaire: string | null;
  avis: 'favorable' | 'defavorable' | 'avis_suspendu' | null;
  etablissement: {
    nom_commercial: string;
    ville: string;
  } | null;
  groupement: {
    nom: string;
  } | null;
}

interface Arrete {
  id: string;
  numero: string;
  date: string;
  type: string;
  objet: string;
  statut: string;
  etablissement: {
    nom_commercial: string;
    ville: string;
  } | null;
  groupement: {
    nom: string;
  } | null;
}

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [arretes, setArretes] = useState<Arrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('commissions');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select(`
          *,
          etablissement:etablissement_id(nom_commercial, ville),
          groupement:groupement_id(nom)
        `)
        .order('date', { ascending: false });

      setCommissions(commissionsData || []);

      const { data: arretesData } = await supabase
        .from('arretes')
        .select(`
          *,
          etablissement:etablissement_id(nom_commercial, ville),
          groupement:groupement_id(nom)
        `)
        .order('date', { ascending: false });

      setArretes(arretesData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTypeLabel(type: string) {
    const types: Record<string, { label: string; icon: string; color: string }> = {
      securite: { label: 'Sécurité', icon: '🔥', color: '#E53E3E' },
      accessibilite: { label: 'Accessibilité', icon: '♿', color: '#319795' },
      mixte: { label: 'Mixte', icon: '🔄', color: '#805AD5' },
    };
    return types[type] || types.securite;
  }

  function getAvisBadge(avis: string | null) {
    if (!avis) return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-xl text-[13px] font-semibold">-</span>;

    const badges: Record<string, { label: string; bg: string; color: string }> = {
      favorable: { label: '✓ Favorable', bg: '#C6F6D5', color: '#22543D' },
      defavorable: { label: '✗ Défavorable', bg: '#FED7D7', color: '#742A2A' },
      avis_suspendu: { label: '⏸ Avis suspendu', bg: '#FEEBC8', color: '#7C2D12' },
    };

    const badge = badges[avis] || badges.avis_suspendu;
    return (
      <span className="px-3 py-1 rounded-xl text-[13px] font-semibold" style={{ background: badge.bg, color: badge.color }}>
        {badge.label}
      </span>
    );
  }

  function openDrawer(commission: Commission) {
    setSelectedCommission(commission);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedCommission(null);
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
              <span>Commissions & Arrêtés</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#718096] text-[14px]">Thierry Nzeutem</span>
            <div className="w-8 h-8 rounded-full bg-[#FF8C00] text-white flex items-center justify-center font-semibold text-[14px]">
              TN
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-xl p-5 shadow-sm h-fit sticky top-[96px]">
          <h3 className="text-[13px] font-bold text-[#718096] uppercase tracking-wide mb-4">Filtres</h3>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#4A5568] mb-2">Période</label>
            <select className="w-full p-2 border border-[#E2E8F0] rounded-lg text-[14px] outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00] focus:ring-opacity-20">
              <option>Tous</option>
              <option>Cette semaine</option>
              <option>Ce mois</option>
              <option selected>3 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#4A5568] mb-2">Type de commission</label>
            <label className="flex items-center gap-2 py-1.5">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-[14px]">Sécurité</span>
            </label>
            <label className="flex items-center gap-2 py-1.5">
              <input type="checkbox" className="w-4 h-4" defaultChecked />
              <span className="text-[14px]">Accessibilité</span>
            </label>
            <label className="flex items-center gap-2 py-1.5">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-[14px]">Mixte</span>
            </label>
          </div>

          <div className="bg-[#F7FAFC] rounded-lg p-3 mt-5">
            <div className="flex justify-between py-1.5 text-[13px]">
              <span className="text-[#718096]">Total commissions :</span>
              <span className="font-bold">{commissions.length}</span>
            </div>
            <div className="flex justify-between py-1.5 text-[13px]">
              <span className="text-[#718096]">À venir :</span>
              <span className="font-bold text-[#4299E1]">
                {commissions.filter(c => new Date(c.date) > new Date()).length}
              </span>
            </div>
            <div className="flex justify-between py-1.5 text-[13px]">
              <span className="text-[#718096]">Arrêtés en cours :</span>
              <span className="font-bold text-[#48BB78]">{arretes.length}</span>
            </div>
          </div>
        </aside>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="flex border-b-2 border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-6 py-4 font-semibold text-[15px] border-b-[3px] -mb-0.5 transition ${
                activeTab === 'commissions'
                  ? 'text-[#FF8C00] border-[#FF8C00]'
                  : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              📅 Commissions
            </button>
            <button
              onClick={() => setActiveTab('arretes')}
              className={`px-6 py-4 font-semibold text-[15px] border-b-[3px] -mb-0.5 transition ${
                activeTab === 'arretes'
                  ? 'text-[#FF8C00] border-[#FF8C00]'
                  : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              📄 Arrêtés
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-4 font-semibold text-[15px] border-b-[3px] -mb-0.5 transition ${
                activeTab === 'timeline'
                  ? 'text-[#FF8C00] border-[#FF8C00]'
                  : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              🕒 Timeline
            </button>
          </div>

          {activeTab === 'commissions' && (
            <div>
              <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]">🔍</span>
                  <input
                    type="text"
                    placeholder="Rechercher une commission..."
                    className="w-[320px] pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[14px] outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00] focus:ring-opacity-20"
                  />
                </div>
                <button className="px-4 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition flex items-center gap-2">
                  <span>+</span>
                  Nouvelle commission
                </button>
              </div>

              <div className="p-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F7FAFC]">
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Date</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Type</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Établissement</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Objet</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Référence</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Avis</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission) => {
                      const typeInfo = getTypeLabel(commission.type);
                      const isFuture = new Date(commission.date) > new Date();

                      return (
                        <tr
                          key={commission.id}
                          className="border-t border-[#E2E8F0] hover:bg-[#F7FAFC] cursor-pointer transition"
                          onClick={() => openDrawer(commission)}
                        >
                          <td className="p-4">
                            <div className={`font-semibold ${isFuture ? 'text-[#4299E1]' : ''}`}>
                              {new Date(commission.date).toLocaleDateString('fr-FR')}
                            </div>
                            {commission.heure && (
                              <div className={`text-[12px] ${isFuture ? 'text-[#4299E1]' : 'text-[#718096]'}`}>
                                {commission.heure} {isFuture ? '• À venir' : ''}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="flex items-center gap-1.5 font-semibold text-[13px]" style={{ color: typeInfo.color }}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">
                              {commission.etablissement?.nom_commercial || commission.groupement?.nom || '-'}
                            </div>
                            {commission.etablissement?.ville && (
                              <div className="text-[12px] text-[#718096]">{commission.etablissement.ville}</div>
                            )}
                          </td>
                          <td className="p-4">
                            {commission.objet_details && (
                              <span className="px-2 py-1 bg-[#BEE3F8] text-[#2C5282] rounded text-[12px] font-semibold">
                                {commission.objet_details}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {commission.reference ? (
                              <>
                                <div className="text-[13px]">{commission.reference}</div>
                                {commission.affaire && (
                                  <div className="text-[12px] text-[#718096]">{commission.affaire}</div>
                                )}
                              </>
                            ) : (
                              <span className="text-[#718096]">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            {getAvisBadge(commission.avis)}
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/commissions/${commission.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[12px] font-semibold hover:bg-[#F7FAFC] transition inline-block"
                            >
                              Voir détails
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {commissions.length === 0 && (
                  <div className="text-center py-12 text-[#718096]">
                    <div className="text-5xl mb-4">📅</div>
                    <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune commission</div>
                    <div className="text-[14px]">Les commissions seront affichées ici</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'arretes' && (
            <div>
              <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]">🔍</span>
                  <input
                    type="text"
                    placeholder="Rechercher un arrêté..."
                    className="w-[320px] pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-[14px] outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00] focus:ring-opacity-20"
                  />
                </div>
                <button className="px-4 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition flex items-center gap-2">
                  <span>+</span>
                  Nouvel arrêté
                </button>
              </div>

              <div className="p-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#F7FAFC]">
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Date</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Numéro</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Type</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Établissement</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Objet</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Statut</th>
                      <th className="text-left p-3 text-[12px] font-bold text-[#718096] uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arretes.map((arrete) => (
                      <tr key={arrete.id} className="border-t border-[#E2E8F0] hover:bg-[#F7FAFC] transition">
                        <td className="p-4 font-semibold">
                          {new Date(arrete.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4 font-semibold">{arrete.numero}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-[#C6F6D5] text-[#22543D] rounded text-[12px] font-semibold capitalize">
                            {arrete.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">
                            {arrete.etablissement?.nom_commercial || arrete.groupement?.nom || '-'}
                          </div>
                          {arrete.etablissement?.ville && (
                            <div className="text-[12px] text-[#718096]">{arrete.etablissement.ville}</div>
                          )}
                        </td>
                        <td className="p-4 text-[14px]">{arrete.objet}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-[#C6F6D5] text-[#22543D] rounded-xl text-[13px] font-semibold">
                            ✓ Délivré
                          </span>
                        </td>
                        <td className="p-4">
                          <button className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[12px] font-semibold hover:bg-[#F7FAFC] transition">
                            Consulter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {arretes.length === 0 && (
                  <div className="text-center py-12 text-[#718096]">
                    <div className="text-5xl mb-4">📄</div>
                    <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucun arrêté</div>
                    <div className="text-[14px]">Les arrêtés seront affichés ici</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-[#4A5568] mb-2">Sélectionner un établissement</label>
                <select className="max-w-md p-2 border border-[#E2E8F0] rounded-lg text-[14px] outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00] focus:ring-opacity-20">
                  <option>Tous les établissements</option>
                  {Array.from(new Set(commissions.map(c => c.etablissement?.nom_commercial || c.groupement?.nom).filter(Boolean))).map(nom => (
                    <option key={nom}>{nom}</option>
                  ))}
                </select>
              </div>

              <div className="relative pl-10">
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#E2E8F0]" />

                {commissions.slice().reverse().map((commission, idx) => {
                  const typeInfo = getTypeLabel(commission.type);
                  const isSuccess = commission.avis === 'favorable';
                  const isFailed = commission.avis === 'defavorable';

                  return (
                    <div key={commission.id} className="relative pb-8">
                      <div
                        className={`absolute left-[-33px] w-7 h-7 rounded-full border-[3px] bg-white flex items-center justify-center text-[14px] z-10 ${
                          isSuccess ? 'border-[#48BB78]' :
                          isFailed ? 'border-[#E53E3E]' :
                          'border-[#FF8C00]'
                        }`}
                      >
                        {isSuccess ? '✓' : isFailed ? '✗' : typeInfo.icon}
                      </div>

                      <div className="bg-[#F7FAFC] rounded-lg p-4">
                        <div className="text-[12px] text-[#718096] mb-2">
                          {new Date(commission.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-[15px] font-bold text-[#2D3748] mb-2">
                          Commission de {typeInfo.label.toLowerCase()} - {commission.objet_details} - Avis {commission.avis}
                        </div>
                        <div className="text-[14px] text-[#4A5568] mb-3">
                          {commission.etablissement?.nom_commercial || commission.groupement?.nom}
                        </div>
                        {commission.reference && (
                          <div className="flex gap-4 flex-wrap text-[13px]">
                            <span className="flex items-center gap-1.5 text-[#718096]">
                              📄 <strong>Référence :</strong> {commission.reference}
                            </span>
                            {commission.affaire && (
                              <span className="flex items-center gap-1.5 text-[#718096]">{commission.affaire}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {drawerOpen && selectedCommission && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[200]"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-xl z-[201] overflow-y-auto">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-[#2D3748]">Détails de la commission</h2>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-lg bg-[#F7FAFC] hover:bg-[#E2E8F0] flex items-center justify-center text-[20px] text-[#718096]"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-[14px] font-bold text-[#2D3748] mb-3">Informations générales</h3>
                <div className="space-y-3">
                  <div className="flex py-2.5 border-b border-[#E2E8F0]">
                    <div className="w-44 text-[13px] text-[#718096] font-semibold">Date et heure</div>
                    <div className="flex-1 text-[14px] text-[#2D3748]">
                      {new Date(selectedCommission.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {selectedCommission.heure && ` à ${selectedCommission.heure}`}
                    </div>
                  </div>
                  <div className="flex py-2.5 border-b border-[#E2E8F0]">
                    <div className="w-44 text-[13px] text-[#718096] font-semibold">Type</div>
                    <div className="flex-1">
                      {(() => {
                        const typeInfo = getTypeLabel(selectedCommission.type);
                        return (
                          <span className="flex items-center gap-1.5 font-semibold text-[13px]" style={{ color: typeInfo.color }}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex py-2.5 border-b border-[#E2E8F0]">
                    <div className="w-44 text-[13px] text-[#718096] font-semibold">
                      {selectedCommission.etablissement ? 'Établissement' : 'Groupement'}
                    </div>
                    <div className="flex-1 text-[14px] text-[#2D3748]">
                      <strong>
                        {selectedCommission.etablissement?.nom_commercial || selectedCommission.groupement?.nom}
                      </strong><br />
                      {selectedCommission.etablissement?.ville && (
                        <span className="text-[13px] text-[#718096]">{selectedCommission.etablissement.ville}</span>
                      )}
                    </div>
                  </div>
                  {selectedCommission.reference && (
                    <div className="flex py-2.5 border-b border-[#E2E8F0]">
                      <div className="w-44 text-[13px] text-[#718096] font-semibold">Référence</div>
                      <div className="flex-1 text-[14px] text-[#2D3748]">
                        <strong>{selectedCommission.reference}</strong>
                        {selectedCommission.affaire && (
                          <>
                            <br />
                            <span className="text-[13px] text-[#718096]">{selectedCommission.affaire}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex py-2.5">
                    <div className="w-44 text-[13px] text-[#718096] font-semibold">Avis</div>
                    <div className="flex-1">
                      {getAvisBadge(selectedCommission.avis)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button className="w-full px-4 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition flex items-center justify-center gap-2">
                  <span>✏️</span>
                  Modifier la commission
                </button>
                <button className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center justify-center gap-2">
                  <span>📥</span>
                  Télécharger le PV
                </button>
                <button className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center justify-center gap-2">
                  <span>📧</span>
                  Envoyer par email
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
