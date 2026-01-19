'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CommissionsTab from '@/components/commissions/CommissionsTab';

interface Groupement {
  id: string;
  nom: string;
  logo: string | null;
  ville: string | null;
  types_erp: string[];
  categorie_erp: string | null;
  effectif_total_public: number;
  avis_derniere_commission: string | null;
  prochaine_commission: string | null;
  created_at: string;
  updated_at: string;
}

interface Etablissement {
  id: string;
  nom_commercial: string;
  types_erp: string[];
  adresse: string;
  ville: string;
  code_postal: string;
}

interface Observation {
  id: string;
  numero_observation: string;
  description: string;
  type: string;
  criticite: string;
  statut: string;
  etablissement_id: string;
}

export default function GroupementDetailPage() {
  const params = useParams();
  const [groupement, setGroupement] = useState<Groupement | null>(null);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informations');

  useEffect(() => {
    if (params.id) {
      fetchGroupementDetails();
    }
  }, [params.id]);

  async function fetchGroupementDetails() {
    try {
      const { data: groupementData, error: groupementError } = await supabase
        .from('groupements')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (groupementError) throw groupementError;
      setGroupement(groupementData);

      const { data: etablissementsData } = await supabase
        .from('etablissements')
        .select('id, nom_commercial, types_erp, adresse, ville, code_postal')
        .eq('groupement_id', params.id)
        .order('nom_commercial');

      setEtablissements(etablissementsData || []);

      const { data: observationsData } = await supabase
        .from('observations')
        .select(`
          *,
          commission:commissions(date, reference, avis),
          etablissement:etablissements(nom_commercial)
        `)
        .eq('groupement_id', params.id)
        .eq('statut', 'en_cours');

      setObservations(observationsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function getTypeColor(type: string) {
    const colors: Record<string, { bg: string; color: string }> = {
      M: { bg: '#EBF4FF', color: '#3182CE' },
      N: { bg: '#FED7E2', color: '#C53030' },
      O: { bg: '#FEEBC8', color: '#C05621' },
      P: { bg: '#E6FFFA', color: '#319795' },
      R: { bg: '#FAF5FF', color: '#805AD5' },
    };
    return colors[type] || { bg: '#F7FAFC', color: '#2D3748' };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!groupement) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Groupement non trouvé</div>
      </div>
    );
  }

  const prescriptions = observations.filter(o => o.type === 'prescription');
  const observationsOnly = observations.filter(o => o.type === 'observation');

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Link href="/groupements" className="text-blue-600 hover:underline">🏢 Groupements</Link>
            <span>›</span>
            <span>{groupement.nom}</span>
          </div>
          <Link href="/" className="text-xl font-bold text-gray-800 hover:opacity-80 transition">
            PREV'<span className="text-[#FF8C00]">HUB</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="bg-white rounded-xl p-8 shadow mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-[100px] h-[100px] rounded-xl bg-[#F7FAFC] flex items-center justify-center border-2 border-[#E2E8F0] flex-shrink-0 overflow-hidden">
              {groupement.logo ? (
                <img src={groupement.logo} alt={groupement.nom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-[#2D3748]">L</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#1A202C] mb-2">{groupement.nom}</h1>
              <div className="text-[16px] text-[#718096] mb-4 flex items-center gap-4 flex-wrap">
                <span>🏗️ Groupement d'établissements</span>
                <span>•</span>
                <span>📍 {groupement.ville || 'Non renseigné'}</span>
                <span>•</span>
                <span>👥 {etablissements.length} établissements</span>
              </div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <span className="px-4 py-2 bg-[#EBF4FF] text-[#3182CE] rounded-lg text-[14px] font-semibold">
                  Type {groupement.types_erp.join(', ')}
                </span>
                <span className="px-4 py-2 bg-[#F0FFF4] text-[#38A169] rounded-lg text-[14px] font-semibold">
                  {groupement.categorie_erp}
                </span>
                <span className="px-4 py-2 bg-[#F7FAFC] text-[#2D3748] rounded-lg text-[14px]">
                  Effectif public: {groupement.effectif_total_public} pers.
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button className="px-5 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition flex items-center gap-2">
                  📅 Planifier visite
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  ✏️ Modifier
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  📄 Générer rapport
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  📧 Contacter
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 p-5 bg-[#F7FAFC] rounded-lg">
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Dernière Commission</div>
              <div className="text-[20px] font-bold text-[#2D3748] mb-2 flex items-center gap-2">
                <span>Octobre 2023</span>
                <span className={`px-3 py-1 rounded-xl text-[13px] font-semibold ${
                  groupement.avis_derniere_commission === 'favorable'
                    ? 'bg-[#F0FFF4] text-[#38A169]'
                    : 'bg-[#FFF5F5] text-[#E53E3E]'
                }`}>
                  {groupement.avis_derniere_commission === 'favorable' ? 'Favorable' : 'Défavorable'}
                </span>
              </div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Prochaine Commission</div>
              <div className="text-[20px] font-bold text-[#2D3748] flex items-center gap-2">
                <span>Octobre 2026</span>
                <span className="text-[13px] text-[#718096] font-normal">(dans 3 ans)</span>
              </div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Prescriptions</div>
              <div className="text-[20px] font-bold text-[#DD6B20]">{prescriptions.length} en cours</div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg shadow-sm">
              <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Observations</div>
              <div className="text-[20px] font-bold text-[#DD6B20]">{observationsOnly.length} actives</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b-2 border-[#E2E8F0] bg-white px-8 rounded-t-xl">
          {[
            { id: 'informations', label: '📋 Informations', count: null },
            { id: 'etablissements', label: '🏪 Établissements', count: etablissements.length },
            { id: 'verifications', label: '✅ Vérifications périodiques', count: null },
            { id: 'prescriptions', label: '⚠️ Prescriptions', count: prescriptions.length },
            { id: 'observations', label: '📝 Observations', count: observationsOnly.length },
            { id: 'commissions', label: '⚖️ Commissions & Arrêtés', count: null },
            { id: 'documents', label: '📄 Contrat & Documents', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-semibold border-b-3 -mb-0.5 transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-[#FF8C00] border-b-[3px] border-[#FF8C00]'
                  : 'text-[#718096] border-transparent hover:text-[#2D3748]'
              }`}
            >
              {tab.label}
              {tab.count !== null && ` (${tab.count})`}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-xl p-8 shadow">
          {activeTab === 'informations' && (
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] mb-5 flex items-center gap-2">
                📋 Informations générales
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Adresse complète</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">
                      123 Avenue du Groupement<br />
                      {groupement.ville}<br />
                      France
                    </div>
                  </div>

                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Coordonnées GPS</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">48.9539° N, 2.6108° E</div>
                  </div>

                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Classement ERP</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {groupement.types_erp.map(type => {
                        const typeColor = getTypeColor(type);
                        return (
                          <span
                            key={type}
                            className="px-4 py-2 rounded-lg text-[14px] font-bold"
                            style={{ background: typeColor.bg, color: typeColor.color }}
                          >
                            Type {type}
                          </span>
                        );
                      })}
                    </div>
                    <div className="mt-2 text-[15px] text-[#2D3748] font-medium">
                      {groupement.categorie_erp} - Effectif: {groupement.effectif_total_public} personnes
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Date création fiche</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">
                      {new Date(groupement.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Dernière mise à jour</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">
                      {new Date(groupement.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">RUS assigné</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">Thierry Nzeutem</div>
                  </div>

                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Statut client</div>
                    <div>
                      <span className="inline-block px-3 py-1 bg-[#F0FFF4] text-[#38A169] rounded-xl text-[13px] font-semibold">
                        Client actif
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-[20px] font-bold text-[#1A202C] mt-10 mb-5 flex items-center gap-2">
                👥 Contacts du groupement
              </h2>

              <div className="space-y-3">
                {[
                  { name: 'Pierre Rousseau', role: 'Direction Centre Commercial • 06 12 34 56 78 • p.rousseau@leclerc.fr', initials: 'PR', color: '#FF8C00' },
                  { name: 'Sophie Gaillard', role: 'Syndic de copropriété • 01 23 45 67 89 • s.gaillard@syndic-paris.fr', initials: 'SG', color: '#3182CE' },
                  { name: 'Marc Lambert', role: 'Responsable Sécurité • 06 98 76 54 32 • m.lambert@leclerc.fr', initials: 'ML', color: '#38A169' },
                ].map(contact => (
                  <div key={contact.initials} className="flex items-center gap-4 p-4 bg-[#F7FAFC] rounded-lg hover:bg-[#EDF2F7] transition">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0"
                      style={{ background: contact.color }}
                    >
                      {contact.initials}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[15px] text-[#2D3748] mb-1">{contact.name}</div>
                      <div className="text-[13px] text-[#718096]">{contact.role}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F7FAFC] hover:border-[#CBD5E0] transition text-[16px]">
                        📞
                      </button>
                      <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F7FAFC] hover:border-[#CBD5E0] transition text-[16px]">
                        📧
                      </button>
                      <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F7FAFC] hover:border-[#CBD5E0] transition text-[16px]">
                        💬
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-[20px] font-bold text-[#1A202C] mt-10 mb-2 flex items-center gap-2">
                🔧 Installations techniques communes
              </h2>

              <div className="text-[14px] text-[#718096] mb-4">
                Installations gérées au niveau du groupement (non spécifiques à un établissement)
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F7FAFC] border-b-2 border-[#E2E8F0]">
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Installation</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Prestataire</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Dernière vérification</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Prochaine vérification</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Éclairage de sécurité', period: 'Annuelle', provider: 'IBAT', last: '11/03/2021', next: '11/03/2022', status: 'overdue', delay: '+3 ans' },
                      { name: 'Installations électriques (Code du Travail)', period: 'Annuelle', provider: 'DEKRA', last: '14/11/2024', next: '14/11/2025', status: 'ok', delay: '' },
                      { name: 'Installations électriques (ERP)', period: 'Annuelle', provider: 'DEKRA', last: '12/11/2024', next: '12/11/2025', status: 'ok', delay: '' },
                      { name: 'VMC', period: 'Annuelle', provider: 'Exploitant', last: '10/08/2021', next: '10/08/2022', status: 'overdue', delay: '+3 ans' },
                      { name: 'Extincteurs', period: 'Annuelle', provider: 'IBAT', last: '11/03/2021', next: '11/03/2022', status: 'overdue', delay: '+3 ans' },
                    ].map((install, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-[#E2E8F0] hover:bg-[#F7FAFC] ${install.status === 'overdue' ? 'bg-[#FFF5F5]' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-semibold text-[14px]">{install.name}</div>
                          <div className="text-[13px] text-[#718096]">Périodicité: {install.period}</div>
                        </td>
                        <td className="p-4 text-[14px]">{install.provider}</td>
                        <td className="p-4 text-[14px]">{install.last}</td>
                        <td className={`p-4 text-[14px] ${install.status === 'overdue' ? 'text-[#E53E3E] font-semibold' : ''}`}>
                          {install.next}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold ${
                            install.status === 'ok'
                              ? 'bg-[#F0FFF4] text-[#38A169]'
                              : 'bg-[#FFF5F5] text-[#E53E3E]'
                          }`}>
                            {install.status === 'ok' ? '🟢 Conforme' : `🔴 En retard (${install.delay})`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'etablissements' && (
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] mb-5">🏪 Établissements du groupement</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F7FAFC] border-b-2 border-[#E2E8F0]">
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Établissement</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Types ERP</th>
                      <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Adresse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {etablissements.map(etab => (
                      <tr key={etab.id} className="border-b border-[#E2E8F0] hover:bg-[#F7FAFC]">
                        <td className="p-4">
                          <Link href={`/etablissements/${etab.id}`} className="font-semibold text-[#2D3748] hover:text-[#FF8C00]">
                            {etab.nom_commercial}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {etab.types_erp.map(type => {
                              const color = getTypeColor(type);
                              return (
                                <span
                                  key={type}
                                  className="px-2 py-1 rounded text-[11px] font-bold"
                                  style={{ background: color.bg, color: color.color }}
                                >
                                  {type}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 text-[14px] text-[#718096]">
                          {etab.adresse}, {etab.code_postal} {etab.ville}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] mb-5">⚠️ Prescriptions</h2>
              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((obs: any) => (
                    <div key={obs.id} className="p-4 bg-[#FFF5F5] border-l-4 border-[#E53E3E] rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-[#2D3748] mb-1">{obs.numero_observation}</div>
                          <div className="text-[14px] text-[#718096] mb-2">{obs.description}</div>
                          {obs.cellule_reference && (
                            <div className="text-[13px] text-[#FF8C00] font-semibold mb-1">
                              📍 {obs.cellule_reference}
                            </div>
                          )}
                          {obs.etablissement && (
                            <div className="text-[13px] text-[#718096]">
                              🏢 <strong>Cellule :</strong> {obs.etablissement.nom_commercial}
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[13px] font-semibold ml-4 ${
                          obs.criticite === 'critique' ? 'bg-[#E53E3E] text-white' :
                          obs.criticite === 'majeure' ? 'bg-[#DD6B20] text-white' :
                          'bg-[#718096] text-white'
                        }`}>
                          {obs.criticite}
                        </span>
                      </div>
                      {obs.commission && (
                        <div className="pt-3 border-t border-[#FED7D7]">
                          <div className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-4 text-[#718096]">
                              <span>📅 Commission du {new Date(obs.commission.date).toLocaleDateString('fr-FR')}</span>
                              {obs.commission.reference && (
                                <span>📄 {obs.commission.reference}</span>
                              )}
                            </div>
                            {obs.commission.avis && (
                              <span className={`px-2 py-1 rounded text-[11px] font-semibold ${
                                obs.commission.avis === 'favorable' ? 'bg-[#C6F6D5] text-[#22543D]' :
                                obs.commission.avis === 'defavorable' ? 'bg-[#FED7D7] text-[#742A2A]' :
                                'bg-[#FEEBC8] text-[#7C2D12]'
                              }`}>
                                {obs.commission.avis === 'favorable' ? '✓ Favorable' :
                                 obs.commission.avis === 'defavorable' ? '✗ Défavorable' :
                                 '⏸ Avis suspendu'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#718096]">
                  <div className="text-5xl mb-4">✅</div>
                  <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune prescription en cours</div>
                  <div className="text-[14px]">Toutes les prescriptions ont été levées</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'observations' && (
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] mb-5">📝 Observations</h2>
              {observationsOnly.length > 0 ? (
                <div className="space-y-3">
                  {observationsOnly.map(obs => (
                    <div key={obs.id} className="p-4 bg-[#FFFAF0] border-l-4 border-[#DD6B20] rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-[#2D3748] mb-1">{obs.numero_observation}</div>
                          <div className="text-[14px] text-[#718096]">{obs.description}</div>
                        </div>
                        <span className="px-3 py-1 bg-[#718096] text-white rounded-lg text-[13px] font-semibold ml-4">
                          {obs.criticite}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#718096]">
                  <div className="text-5xl mb-4">📝</div>
                  <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune observation active</div>
                  <div className="text-[14px]">Les observations seront affichées ici</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'commissions' && (
            <CommissionsTab
              groupementId={params.id as string}
              etablissementNom={groupement?.nom}
            />
          )}

          {(activeTab === 'verifications' || activeTab === 'documents') && (
            <div className="text-center py-12 text-[#718096]">
              <div className="text-5xl mb-4">🚧</div>
              <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Section en cours de développement</div>
              <div className="text-[14px]">Cette fonctionnalité sera bientôt disponible</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
