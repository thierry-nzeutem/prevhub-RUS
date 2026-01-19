'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CommissionsTab from '@/components/commissions/CommissionsTab';

export default function EtablissementDetailPage() {
  const params = useParams();
  const [etablissement, setEtablissement] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('informations');

  useEffect(() => {
    if (params.id) {
      fetchEtablissementDetails();
    }
  }, [params.id]);

  async function fetchEtablissementDetails() {
    try {
      const { data: etabData, error } = await supabase
        .from('etablissements')
        .select(`
          *,
          groupement:groupements(nom),
          societe_exploitation:societes(raison_sociale, siret, telephone, email, forme_juridique, adresse_siege, code_postal, ville)
        `)
        .eq('id', params.id)
        .maybeSingle();

      if (error) throw error;
      setEtablissement(etabData);

      const { data: installationsData } = await supabase
        .from('installations_techniques')
        .select('id')
        .eq('etablissement_id', params.id);

      if (installationsData && installationsData.length > 0) {
        const installationIds = installationsData.map((i: any) => i.id);

        const { data: verificationsData } = await supabase
          .from('verifications_periodiques')
          .select(`
            *,
            installation:installations_techniques(nom, type_installation, periodicite_reglementaire),
            societe_prestataire:societes(raison_sociale, telephone)
          `)
          .in('installation_id', installationIds)
          .order('date_prochaine_verification');

        setVerifications(verificationsData || []);
      }

      const { data: observationsData } = await supabase
        .from('observations')
        .select('*')
        .eq('etablissement_id', params.id)
        .eq('statut', 'en_cours');

      setObservations(observationsData || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function getVerificationStatusBadge(dateProchaine: string) {
    const today = new Date();
    const prochaine = new Date(dateProchaine);
    const diffDays = Math.ceil((prochaine.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const yearsLate = Math.abs(Math.floor(diffDays / 365));
      return {
        className: 'bg-[#FFF5F5] text-[#E53E3E]',
        label: `🔴 En retard (+${yearsLate} ans)`,
        rowClass: 'bg-[#FFF5F5]',
      };
    } else if (diffDays < 60) {
      return {
        className: 'bg-[#FFFAF0] text-[#DD6B20]',
        label: '🟠 Échéance proche',
        rowClass: 'bg-[#FFFAF0]',
      };
    } else {
      return {
        className: 'bg-[#F0FFF4] text-[#38A169]',
        label: '🟢 Conforme',
        rowClass: '',
      };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!etablissement) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Établissement non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-[14px] text-[#718096] flex items-center gap-2">
            <Link href="/groupements" className="text-[#3182CE] hover:underline">🏢 Groupements</Link>
            {etablissement.groupement && (
              <>
                <span>›</span>
                <Link href={`/groupements/${etablissement.groupement_id}`} className="text-[#3182CE] hover:underline">
                  {etablissement.groupement.nom}
                </Link>
              </>
            )}
            <span>›</span>
            <span>{etablissement.nom_commercial}</span>
          </div>
          <Link href="/" className="text-[20px] font-bold text-[#2D3748] hover:opacity-80 transition">
            PREV'<span className="text-[#FF8C00]">HUB</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {!etablissement.ge5_affiche && (
          <div className="bg-[#FFFAF0] border-l-4 border-[#DD6B20] p-4 mb-6 rounded-lg flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-[#2D3748]">GE5 non affiché</div>
              <div className="text-[14px] text-[#718096]">L'avis relatif à la sécurité n'a pas été vérifié depuis le 15/01/2023</div>
            </div>
            <button className="px-5 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition">
              Marquer comme vérifié
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl p-8 shadow mb-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-[100px] h-[100px] rounded-xl bg-[#F7FAFC] flex items-center justify-center border-2 border-[#E2E8F0] flex-shrink-0">
              <span className="text-[36px]">💊</span>
            </div>
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#1A202C] mb-2">{etablissement.nom_commercial}</h1>
              <div className="text-[16px] text-[#718096] mb-4 flex items-center gap-4 flex-wrap">
                <span>🏪 Établissement</span>
                {etablissement.groupement && (
                  <>
                    <span>•</span>
                    <span>📍 {etablissement.groupement.nom}</span>
                  </>
                )}
                {etablissement.numero_dans_groupement && (
                  <>
                    <span>•</span>
                    <span>🏷️ {etablissement.numero_dans_groupement}</span>
                  </>
                )}
              </div>
              <div className="flex gap-3 mb-4 flex-wrap">
                <span className="px-4 py-2 bg-[#EBF4FF] text-[#3182CE] rounded-lg text-[14px] font-semibold">
                  Type {etablissement.types_erp.join(', ')} (Magasin)
                </span>
                <span className="px-4 py-2 bg-[#F0FFF4] text-[#38A169] rounded-lg text-[14px] font-semibold">
                  {etablissement.categorie_erp}
                  {etablissement.groupement_id && ' (héritée)'}
                </span>
                <span className="px-4 py-2 bg-[#F7FAFC] text-[#2D3748] rounded-lg text-[14px]">
                  Effectif: {etablissement.effectif_public} pers.
                </span>
                {etablissement.surface_m2 && (
                  <span className="px-4 py-2 bg-[#F7FAFC] text-[#2D3748] rounded-lg text-[14px]">
                    Surface: {etablissement.surface_m2} m²
                  </span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button className="px-5 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition flex items-center gap-2">
                  📅 Planifier visite
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  ✏️ Modifier
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  📄 Rapport
                </button>
                <button className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition flex items-center gap-2">
                  📧 Contacter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">GE5 Affiché</div>
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-xl text-[13px] font-semibold ${
                etablissement.ge5_affiche ? 'bg-[#F0FFF4] text-[#38A169]' : 'bg-[#FFF5F5] text-[#E53E3E]'
              }`}>
                {etablissement.ge5_affiche ? 'Oui' : 'Non vérifié'}
              </span>
            </div>
            <div className="text-[12px] text-[#718096]">Dernière vérif: 15/01/2023</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">SOGS Transmis</div>
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-xl text-[13px] font-semibold ${
                etablissement.sogs_transmis ? 'bg-[#F0FFF4] text-[#38A169]' : 'bg-[#FFF5F5] text-[#E53E3E]'
              }`}>
                {etablissement.sogs_transmis ? 'Oui' : 'Non'}
              </span>
            </div>
            <div className="text-[12px] text-[#718096]">Transmis le: 20/03/2023</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Client Prévéris</div>
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 rounded-xl text-[13px] font-semibold ${
                etablissement.est_client_preveris ? 'bg-[#F0FFF4] text-[#38A169]' : 'bg-[#F7FAFC] text-[#718096]'
              }`}>
                {etablissement.est_client_preveris ? 'Oui' : 'Non'}
              </span>
            </div>
            <div className="text-[12px] text-[#718096]">Contrat via groupement</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-2">Dernière Visite</div>
            <div className="text-[20px] font-bold text-[#2D3748] mb-1">15 Oct. 2024</div>
            <div className="text-[12px] text-[#718096]">Par Thierry Nzeutem</div>
          </div>
        </div>

        <div className="flex gap-2 border-b-2 border-[#E2E8F0] bg-white px-8 rounded-t-xl">
          {[
            { id: 'informations', label: '📋 Informations', count: null },
            { id: 'verifications', label: '✅ Vérifications périodiques', count: null },
            { id: 'observations', label: '📝 Observations', count: observations.length },
            { id: 'commissions', label: '⚖️ Historique administratif', count: null },
            { id: 'documents', label: '📄 Documents', count: null },
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
              {tab.count !== null && tab.count > 0 && ` (${tab.count})`}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-xl p-8 shadow">
          {activeTab === 'informations' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[20px] font-bold text-[#1A202C]">📋 Informations</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Adresse</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">
                      {etablissement.adresse}<br />
                      {etablissement.code_postal} {etablissement.ville}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Création fiche</div>
                    <div className="text-[15px] text-[#2D3748] font-medium">
                      {new Date(etablissement.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-[20px] font-bold text-[#1A202C] mb-5 flex items-center gap-2">
                👥 Contacts de l'établissement
                <button className="ml-auto px-4 py-2 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[14px] font-semibold hover:bg-[#F7FAFC] transition">
                  ➕ Ajouter contact
                </button>
              </h3>

              <div className="space-y-3 mb-10">
                {[
                  { name: 'Jean Martin', role: 'Gérant Pharmacie Lafayette • 06 12 34 56 78 • j.martin@lafayette.fr', initials: 'JM', color: '#FF8C00' },
                  { name: 'Sophie Laurent', role: 'Pharmacienne responsable • 06 98 76 54 32 • s.laurent@lafayette.fr', initials: 'SL', color: '#3182CE' },
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

              {etablissement.societe_exploitation && (
                <>
                  <h3 className="text-[20px] font-bold text-[#1A202C] mb-5">📄 Informations société d'exploitation</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Raison sociale</div>
                        <div className="text-[15px] text-[#2D3748] font-medium">{etablissement.societe_exploitation.raison_sociale}</div>
                      </div>
                      {etablissement.societe_exploitation.siret && (
                        <div>
                          <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">SIRET</div>
                          <div className="text-[15px] text-[#2D3748] font-medium">{etablissement.societe_exploitation.siret}</div>
                        </div>
                      )}
                      {etablissement.societe_exploitation.forme_juridique && (
                        <div>
                          <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Forme juridique</div>
                          <div className="text-[15px] text-[#2D3748] font-medium">{etablissement.societe_exploitation.forme_juridique}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">
                      {etablissement.societe_exploitation.adresse_siege && (
                        <div>
                          <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Siège social</div>
                          <div className="text-[15px] text-[#2D3748] font-medium">
                            {etablissement.societe_exploitation.adresse_siege}<br />
                            {etablissement.societe_exploitation.code_postal} {etablissement.societe_exploitation.ville}
                          </div>
                        </div>
                      )}
                      {etablissement.societe_exploitation.telephone && (
                        <div>
                          <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Téléphone</div>
                          <div className="text-[15px] text-[#2D3748] font-medium">{etablissement.societe_exploitation.telephone}</div>
                        </div>
                      )}
                      {etablissement.societe_exploitation.email && (
                        <div>
                          <div className="text-[13px] text-[#718096] font-semibold uppercase tracking-wide mb-1.5">Email</div>
                          <div className="text-[15px] text-[#2D3748] font-medium">{etablissement.societe_exploitation.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'verifications' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-[20px] font-bold text-[#1A202C]">✅ Vérifications Périodiques</h2>
                <button className="px-5 py-2.5 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition">
                  ➕ Ajouter vérification
                </button>
              </div>

              <div className="mb-4 p-3 bg-[#F7FAFC] rounded-lg text-[14px] text-[#718096]">
                💡 <strong>Rappel:</strong> Vous devez vous assurer que l'établissement a bien fait effectuer tous les contrôles réglementaires dans les délais impartis.
              </div>

              {verifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F7FAFC] border-b-2 border-[#E2E8F0]">
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Installation Technique</th>
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Société Prestataire</th>
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Dernière Vérification</th>
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Prochaine Échéance</th>
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Statut</th>
                        <th className="text-left p-4 text-[13px] text-[#718096] font-semibold uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((verif: any) => {
                        const statusBadge = getVerificationStatusBadge(verif.date_prochaine_verification);
                        const isOverdue = new Date(verif.date_prochaine_verification) < new Date();

                        return (
                          <tr key={verif.id} className={`border-b border-[#E2E8F0] hover:bg-[#F7FAFC] ${statusBadge.rowClass}`}>
                            <td className="p-4">
                              <div className="font-semibold text-[14px]">{verif.installation.nom}</div>
                              <div className="text-[13px] text-[#718096]">Périodicité: {verif.installation.periodicite_reglementaire}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-[14px]">
                                {verif.societe_prestataire?.raison_sociale || 'Non renseigné'}
                              </div>
                              {verif.societe_prestataire?.telephone && (
                                <div className="text-[13px] text-[#718096]">📞 {verif.societe_prestataire.telephone}</div>
                              )}
                            </td>
                            <td className="p-4 text-[14px]">
                              {new Date(verif.date_verification).toLocaleDateString('fr-FR')}
                            </td>
                            <td className={`p-4 text-[14px] font-semibold ${isOverdue ? 'text-[#E53E3E]' : ''}`}>
                              {new Date(verif.date_prochaine_verification).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-md hover:bg-[#F7FAFC] hover:border-[#CBD5E0] text-[14px]" title="Voir rapport">
                                  📄
                                </button>
                                <button className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-md hover:bg-[#F7FAFC] hover:border-[#CBD5E0] text-[14px]" title="Modifier">
                                  ✏️
                                </button>
                                {isOverdue && (
                                  <>
                                    <button className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-md hover:bg-[#F7FAFC] hover:border-[#CBD5E0] text-[14px]" title="Créer prescription">
                                      ⚠️
                                    </button>
                                    <button className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-md hover:bg-[#F7FAFC] hover:border-[#CBD5E0] text-[14px]" title="Relancer client">
                                      📧
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#718096]">
                  <div className="text-5xl mb-4">✅</div>
                  <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune vérification enregistrée</div>
                  <div className="text-[14px]">Ajoutez des installations techniques et leurs vérifications</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'observations' && (
            <div>
              <h2 className="text-[20px] font-bold text-[#1A202C] mb-5">📝 Observations</h2>
              {observations.length > 0 ? (
                <div className="space-y-3">
                  {observations.map(obs => (
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
              etablissementId={params.id as string}
              etablissementNom={etablissement?.nom_commercial}
            />
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12 text-[#718096]">
              <div className="text-5xl mb-4">📄</div>
              <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Section Documents</div>
              <div className="text-[14px]">Fonctionnalité en cours de développement</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
