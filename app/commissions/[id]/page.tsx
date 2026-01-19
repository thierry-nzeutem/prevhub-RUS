'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EditCommissionModal from '@/components/modals/EditCommissionModal';

interface Commission {
  id: string;
  date: string;
  heure: string | null;
  type: 'securite' | 'accessibilite' | 'mixte';
  objet: string;
  objet_details: string | null;
  reference: string | null;
  affaire: string | null;
  avis: 'favorable' | 'defavorable' | 'avis_suspendu' | null;
  notes: string | null;
  date_convocation: string | null;
  groupement_id: string;
  etablissement_id: string | null;
}

interface Participant {
  id: string;
  nom: string;
  role: string;
  fonction: string | null;
}

interface Etablissement {
  id: string;
  nom_commercial: string;
  ville: string;
}

interface Prescription {
  id: string;
  numero_observation: string;
  description: string;
  criticite: string;
  statut: string;
  cellule_reference: string | null;
}

export default function CommissionDetailPage() {
  const params = useParams();
  const [commission, setCommission] = useState<Commission | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [groupement, setGroupement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ nom: '', role: 'exploitant', fonction: '' });
  const [selectedCellule, setSelectedCellule] = useState<string>('all');
  const [availableCellules, setAvailableCellules] = useState<string[]>([]);

  useEffect(() => {
    fetchCommissionDetails();
  }, [params.id]);

  async function fetchCommissionDetails() {
    try {
      const { data: commissionData } = await supabase
        .from('commissions')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (commissionData) {
        setCommission(commissionData as any);

        if ((commissionData as any).groupement_id) {
          const { data: groupementData } = await supabase
            .from('groupements')
            .select('*')
            .eq('id', (commissionData as any).groupement_id)
            .single();
          setGroupement(groupementData);
        }

        const { data: participantsData } = await supabase
          .from('commission_participants')
          .select('*')
          .eq('commission_id', params.id);
        setParticipants(participantsData || []);

        const { data: etablissementsData } = await supabase
          .from('commission_etablissements')
          .select('etablissement:etablissements(id, nom_commercial, ville)')
          .eq('commission_id', params.id);

        const etabs = etablissementsData?.map((e: any) => e.etablissement).filter(Boolean) || [];
        setEtablissements(etabs);

        const { data: prescriptionsData } = await supabase
          .from('observations')
          .select('*')
          .eq('commission_id', params.id)
          .eq('type', 'prescription');
        setPrescriptions(prescriptionsData || []);

        const cellules = Array.from(new Set(
          (prescriptionsData || [])
            .map((p: any) => p.cellule_reference)
            .filter(Boolean)
        ));
        setAvailableCellules(cellules as string[]);
      }
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
    if (!avis) return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-xl text-[13px] font-semibold">Non renseigné</span>;

    const badges: Record<string, { label: string; bg: string; color: string }> = {
      favorable: { label: '✓ Favorable', bg: '#C6F6D5', color: '#22543D' },
      defavorable: { label: '✗ Défavorable', bg: '#FED7D7', color: '#742A2A' },
      avis_suspendu: { label: '⏸ Avis suspendu', bg: '#FEEBC8', color: '#7C2D12' },
    };

    const badge = badges[avis] || badges.avis_suspendu;
    return (
      <span className="px-4 py-2 rounded-xl text-[15px] font-bold" style={{ background: badge.bg, color: badge.color }}>
        {badge.label}
      </span>
    );
  }

  async function handleAddParticipant() {
    if (!newParticipant.nom || !newParticipant.role) {
      alert('Le nom et le rôle sont obligatoires');
      return;
    }

    try {
      const { error } = await supabase
        .from('commission_participants')
        .insert({
          commission_id: params.id,
          nom: newParticipant.nom,
          role: newParticipant.role,
          fonction: newParticipant.fonction || null
        } as any);

      if (error) throw error;

      setNewParticipant({ nom: '', role: 'exploitant', fonction: '' });
      setShowAddParticipant(false);
      fetchCommissionDetails();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ajout du participant');
    }
  }

  async function handleDeleteParticipant(id: string) {
    if (!confirm('Supprimer ce participant ?')) return;

    try {
      const { error } = await supabase
        .from('commission_participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCommissionDetails();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function getFilteredPrescriptions() {
    if (selectedCellule === 'all') {
      return prescriptions;
    }
    return prescriptions.filter(p => p.cellule_reference === selectedCellule);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Commission introuvable</div>
          <Link href="/commissions" className="text-[#4299E1] hover:underline">
            Retour aux commissions
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = getTypeLabel(commission.type);
  const isFuture = new Date(commission.date) > new Date();

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
              <Link href="/commissions" className="text-[#4299E1] hover:underline">Commissions</Link>
              <span>›</span>
              <span>Détails</span>
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

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{typeInfo.icon}</span>
                <h1 className="text-[28px] font-bold text-[#2D3748]">
                  Commission de {typeInfo.label.toLowerCase()}
                </h1>
              </div>
              <div className="flex items-center gap-4 text-[15px] text-[#718096]">
                <span className={`font-semibold ${isFuture ? 'text-[#4299E1]' : ''}`}>
                  📅 {new Date(commission.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {commission.heure && ` à ${commission.heure}`}
                </span>
                {isFuture && <span className="px-3 py-1 bg-[#BEE3F8] text-[#2C5282] rounded-lg text-[13px] font-semibold">À venir</span>}
              </div>
            </div>
            {getAvisBadge(commission.avis)}
          </div>

          {commission.objet_details && (
            <div className="mb-6">
              <div className="text-[14px] font-semibold text-[#718096] mb-2">OBJET</div>
              <div className="text-[18px] font-semibold text-[#2D3748]">{commission.objet_details}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mb-6">
            {commission.reference && (
              <div>
                <div className="text-[14px] font-semibold text-[#718096] mb-2">RÉFÉRENCE</div>
                <div className="text-[16px] text-[#2D3748]">{commission.reference}</div>
              </div>
            )}
            {commission.affaire && (
              <div>
                <div className="text-[14px] font-semibold text-[#718096] mb-2">AFFAIRE</div>
                <div className="text-[16px] text-[#2D3748]">{commission.affaire}</div>
              </div>
            )}
          </div>

          {groupement && (
            <div className="mb-6">
              <div className="text-[14px] font-semibold text-[#718096] mb-2">GROUPEMENT</div>
              <Link
                href={`/groupements/${groupement.id}`}
                className="text-[16px] font-semibold text-[#4299E1] hover:underline"
              >
                {groupement.nom}
              </Link>
            </div>
          )}

          {etablissements.length > 0 && (
            <div>
              <div className="text-[14px] font-semibold text-[#718096] mb-3">
                CELLULES CONCERNÉES ({etablissements.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {etablissements.map((etab) => (
                  <Link
                    key={etab.id}
                    href={`/etablissements/${etab.id}`}
                    className="px-4 py-2 bg-[#EBF4FF] text-[#2C5282] rounded-lg text-[14px] font-semibold hover:bg-[#BEE3F8] transition"
                  >
                    🏢 {etab.nom_commercial}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-[#2D3748]">👥 Participants ({participants.length})</h2>
              <button
                onClick={() => setShowAddParticipant(!showAddParticipant)}
                className="px-3 py-1.5 bg-[#4299E1] text-white rounded-lg font-semibold hover:bg-[#3182CE] transition text-[13px]"
              >
                ➕ Ajouter
              </button>
            </div>

            {showAddParticipant && (
              <div className="bg-[#EBF4FF] p-4 rounded-lg space-y-3 mb-4">
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    placeholder="Nom complet *"
                    value={newParticipant.nom}
                    onChange={(e) => setNewParticipant({ ...newParticipant, nom: e.target.value })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                  />
                  <select
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                  >
                    <option value="exploitant">Exploitant</option>
                    <option value="sdis">SDIS</option>
                    <option value="president">Président</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Fonction (optionnel)"
                    value={newParticipant.fonction}
                    onChange={(e) => setNewParticipant({ ...newParticipant, fonction: e.target.value })}
                    className="px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddParticipant}
                    className="px-4 py-2 bg-[#38A169] text-white rounded-lg font-semibold hover:bg-[#2F855A] transition text-[13px]"
                  >
                    ✓ Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddParticipant(false);
                      setNewParticipant({ nom: '', role: 'exploitant', fonction: '' });
                    }}
                    className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg font-semibold hover:bg-[#F7FAFC] transition text-[13px]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {participants.length > 0 ? (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-[#F7FAFC] rounded-lg hover:bg-[#EDF2F7] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4299E1] text-white flex items-center justify-center font-bold flex-shrink-0">
                        {participant.nom.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#2D3748]">{participant.nom}</div>
                        <div className="text-[13px] text-[#718096]">
                          {participant.role}
                          {participant.fonction && ` • ${participant.fonction}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteParticipant(participant.id)}
                      className="px-3 py-1 bg-[#FED7D7] text-[#742A2A] rounded-lg font-semibold hover:bg-[#FEB2B2] transition text-[12px]"
                    >
                      ✗ Retirer
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#718096]">
                <div className="text-3xl mb-2">👤</div>
                <div className="text-[14px]">Aucun participant enregistré</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[20px] font-bold text-[#2D3748]">⚠️ Prescriptions ({getFilteredPrescriptions().length}/{prescriptions.length})</h2>
              <div className="flex gap-2">
                {availableCellules.length > 0 && (
                  <select
                    value={selectedCellule}
                    onChange={(e) => setSelectedCellule(e.target.value)}
                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                  >
                    <option value="all">Toutes les cellules</option>
                    {availableCellules.map((cellule) => (
                      <option key={cellule} value={cellule}>{cellule}</option>
                    ))}
                  </select>
                )}
                {groupement ? (
                  <Link
                    href={`/prescriptions?groupement_id=${groupement.id}`}
                    className="px-3 py-1.5 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition text-[13px]"
                  >
                    📋 Voir toutes ({groupement.nom})
                  </Link>
                ) : (
                  <Link
                    href="/prescriptions"
                    className="px-3 py-1.5 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition text-[13px]"
                  >
                    📋 Voir toutes
                  </Link>
                )}
              </div>
            </div>
            {getFilteredPrescriptions().length > 0 ? (
              <div className="space-y-3">
                {getFilteredPrescriptions().map((prescription) => (
                  <div key={prescription.id} className="p-3 bg-[#FFF5F5] border-l-4 border-[#E53E3E] rounded-lg hover:bg-[#FFF0F0] transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-[#2D3748]">{prescription.numero_observation}</div>
                      <Link
                        href={`/prescriptions/${prescription.id}`}
                        className="px-2 py-1 bg-[#4299E1] text-white rounded text-[11px] font-semibold hover:bg-[#3182CE] transition"
                      >
                        Voir →
                      </Link>
                    </div>
                    <div className="text-[14px] text-[#4A5568] mb-2 line-clamp-2">{prescription.description}</div>
                    <div className="flex gap-2 flex-wrap">
                      {prescription.cellule_reference && (
                        <span className="px-2 py-1 bg-[#E6FFFA] text-[#234E52] rounded text-[12px] font-semibold">
                          📍 {prescription.cellule_reference}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-[#FED7D7] text-[#742A2A] rounded text-[12px] font-semibold">
                        {prescription.criticite}
                      </span>
                      <span className="px-2 py-1 bg-[#BEE3F8] text-[#2C5282] rounded text-[12px] font-semibold">
                        {prescription.statut}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#718096]">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-[14px]">Aucune prescription émise</div>
              </div>
            )}
          </div>
        </div>

        {commission.notes && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-[20px] font-bold text-[#2D3748] mb-4">📝 Notes</h2>
            <div className="text-[15px] text-[#4A5568] whitespace-pre-wrap">{commission.notes}</div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg text-[15px] font-semibold hover:bg-[#E67E00] transition"
          >
            ✏️ Modifier la commission
          </button>
          <button className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[15px] font-semibold hover:bg-[#F7FAFC] transition">
            📥 Télécharger le PV
          </button>
          <button className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[15px] font-semibold hover:bg-[#F7FAFC] transition">
            📧 Envoyer par email
          </button>
          <Link
            href="/commissions"
            className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[15px] font-semibold hover:bg-[#F7FAFC] transition"
          >
            ← Retour aux commissions
          </Link>
        </div>
      </main>

      {commission && (
        <EditCommissionModal
          commission={commission}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchCommissionDetails}
        />
      )}
    </div>
  );
}
