'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EditPrescriptionModal from '@/components/modals/EditPrescriptionModal';

interface Prescription {
  id: string;
  numero_observation: string;
  description: string;
  criticite: string;
  statut: string;
  statut_detaille: string;
  priorite: string;
  delai_jours: number;
  date_echeance: string;
  date_resolution_effective: string | null;
  responsable_nom: string;
  responsable_email: string;
  prestataire_id: string | null;
  cout_previsionnel: number;
  cout_reel: number | null;
  notes_internes: string;
  groupement_id: string;
  etablissement_id: string;
  cellule_reference: string;
  commission_id: string;
  created_at: string;
  updated_at: string;
}

interface HistoriqueItem {
  id: string;
  action: string;
  statut_avant: string;
  statut_apres: string;
  commentaire: string;
  auteur_nom: string;
  created_at: string;
}

interface Document {
  id: string;
  nom_fichier: string;
  type_document: string;
  description: string;
  url_fichier: string;
  created_at: string;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [historique, setHistorique] = useState<HistoriqueItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [commission, setCommission] = useState<any>(null);
  const [etablissement, setEtablissement] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupement, setGroupement] = useState<any>(null);
  const [prestataire, setPrestataire] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [params.id]);

  async function fetchPrescriptionDetails() {
    try {
      const { data: prescData } = await supabase
        .from('observations')
        .select('*')
        .eq('id', params.id)
        .eq('type', 'prescription')
        .maybeSingle();

      if (prescData) {
        setPrescription(prescData as any);

        if ((prescData as any).commission_id) {
          const { data: commData } = await supabase
            .from('commissions')
            .select('*')
            .eq('id', (prescData as any).commission_id)
            .maybeSingle();
          setCommission(commData);
        }

        if ((prescData as any).etablissement_id) {
          const { data: etabData } = await supabase
            .from('etablissements')
            .select('*')
            .eq('id', (prescData as any).etablissement_id)
            .maybeSingle();
          setEtablissement(etabData);
        }

        if ((prescData as any).groupement_id) {
          const { data: groupData } = await supabase
            .from('groupements')
            .select('*')
            .eq('id', (prescData as any).groupement_id)
            .maybeSingle();
          setGroupement(groupData);
        }

        if ((prescData as any).prestataire_id) {
          const { data: prestData } = await supabase
            .from('prestataires')
            .select('*')
            .eq('id', (prescData as any).prestataire_id)
            .maybeSingle();
          setPrestataire(prestData);
        }

        const { data: histData } = await supabase
          .from('prescription_historique')
          .select('*')
          .eq('prescription_id', params.id)
          .order('created_at', { ascending: false });
        setHistorique(histData || []);

        const { data: docsData } = await supabase
          .from('prescription_documents')
          .select('*')
          .eq('prescription_id', params.id)
          .order('created_at', { ascending: false });
        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatut(newStatut: string) {
    if (!prescription) return;
    alert(`Mise à jour du statut vers: ${newStatut}`);
  }

  function getStatutBadge(statut: string) {
    const badges: Record<string, { label: string; bg: string; color: string }> = {
      nouveau: { label: '🆕 Nouveau', bg: '#BEE3F8', color: '#2C5282' },
      en_cours: { label: '⚙️ En cours', bg: '#FEEBC8', color: '#7C2D12' },
      en_attente_validation: { label: '⏳ En attente validation', bg: '#FAF089', color: '#744210' },
      leve: { label: '✓ Levé', bg: '#C6F6D5', color: '#22543D' },
      valide: { label: '✓✓ Validé', bg: '#9AE6B4', color: '#22543D' },
      annule: { label: '✗ Annulé', bg: '#FED7D7', color: '#742A2A' },
    };
    const badge = badges[statut] || badges.nouveau;
    return <span className="px-4 py-2 rounded-xl text-[15px] font-bold inline-block" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>;
  }

  function getPrioriteBadge(priorite: string) {
    const badges: Record<string, { label: string; bg: string; color: string }> = {
      urgent: { label: '🔴 URGENT', bg: '#FED7D7', color: '#742A2A' },
      haute: { label: '🟠 Haute', bg: '#FEEBC8', color: '#7C2D12' },
      normale: { label: '🟢 Normale', bg: '#C6F6D5', color: '#22543D' },
      basse: { label: '🔵 Basse', bg: '#BEE3F8', color: '#2C5282' },
    };
    const badge = badges[priorite] || badges.normale;
    return <span className="px-3 py-1 rounded-lg text-[13px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>;
  }

  function getCriticiteBadge(criticite: string) {
    const badges: Record<string, { bg: string; color: string }> = {
      critique: { bg: '#E53E3E', color: 'white' },
      majeure: { bg: '#DD6B20', color: 'white' },
      mineure: { bg: '#718096', color: 'white' },
    };
    const badge = badges[criticite] || badges.mineure;
    return <span className="px-3 py-1 rounded-lg text-[13px] font-bold" style={{ background: badge.bg, color: badge.color }}>{criticite}</span>;
  }

  function getDelaiColor() {
    if (!prescription?.date_echeance) return '#718096';
    const today = new Date();
    const echeance = new Date(prescription.date_echeance);
    const diff = Math.ceil((echeance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return '#E53E3E';
    if (diff <= 7) return '#DD6B20';
    return '#38A169';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Prescription introuvable</div>
          <Link href="/prescriptions" className="text-[#4299E1] hover:underline">
            Retour aux prescriptions
          </Link>
        </div>
      </div>
    );
  }

  const delaiColor = getDelaiColor();
  const joursRestants = prescription.date_echeance
    ? Math.ceil((new Date(prescription.date_echeance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

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
              <Link href="/prescriptions" className="text-[#4299E1] hover:underline">Prescriptions</Link>
              <span>›</span>
              <span>{prescription.numero_observation}</span>
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
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-[28px] font-bold text-[#2D3748]">{prescription.numero_observation}</h1>
                {getPrioriteBadge(prescription.priorite)}
                {getCriticiteBadge(prescription.criticite)}
              </div>
              <p className="text-[18px] text-[#4A5568] mb-4">{prescription.description}</p>
              <div className="flex items-center gap-4">
                {getStatutBadge(prescription.statut_detaille)}
                {prescription.date_echeance && (
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-[#718096]">Échéance:</span>
                    <span className="px-3 py-1 rounded-lg text-[13px] font-bold" style={{ background: delaiColor + '20', color: delaiColor }}>
                      {new Date(prescription.date_echeance).toLocaleDateString('fr-FR')}
                      {joursRestants !== null && (
                        <span className="ml-2">
                          ({joursRestants > 0 ? `${joursRestants}j restants` : `${Math.abs(joursRestants)}j de retard`})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            {groupement && (
              <div>
                <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Groupement</div>
                <Link href={`/groupements/${groupement.id}`} className="text-[15px] font-semibold text-[#4299E1] hover:underline">
                  {groupement.nom}
                </Link>
              </div>
            )}
            {etablissement && (
              <div>
                <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Cellule</div>
                <Link href={`/etablissements/${etablissement.id}`} className="text-[15px] font-semibold text-[#4299E1] hover:underline">
                  {etablissement.nom_commercial}
                </Link>
              </div>
            )}
            {prescription.cellule_reference && (
              <div>
                <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Référence cellule</div>
                <div className="text-[15px] text-[#2D3748]">{prescription.cellule_reference}</div>
              </div>
            )}
          </div>

          {commission && (
            <div className="p-4 bg-[#EBF4FF] rounded-lg mb-6">
              <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Commission d'origine</div>
              <Link href={`/commissions/${commission.id}`} className="text-[15px] font-semibold text-[#4299E1] hover:underline">
                📅 Commission du {new Date(commission.date).toLocaleDateString('fr-FR')}
                {commission.reference && ` - ${commission.reference}`}
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Responsable suivi</div>
              <div className="text-[15px] text-[#2D3748]">{prescription.responsable_nom || '-'}</div>
              {prescription.responsable_email && (
                <div className="text-[13px] text-[#718096]">{prescription.responsable_email}</div>
              )}
            </div>
            {prestataire && (
              <div>
                <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Prestataire assigné</div>
                <div className="text-[15px] font-semibold text-[#2D3748]">{prestataire.nom}</div>
                <div className="text-[13px] text-[#718096]">
                  {prestataire.specialite} • {prestataire.telephone}
                </div>
              </div>
            )}
          </div>

          {(prescription.cout_previsionnel || prescription.cout_reel) && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              {prescription.cout_previsionnel && (
                <div>
                  <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Coût prévisionnel</div>
                  <div className="text-[20px] font-bold text-[#2D3748]">
                    {prescription.cout_previsionnel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              )}
              {prescription.cout_reel && (
                <div>
                  <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Coût réel</div>
                  <div className="text-[20px] font-bold text-[#38A169]">
                    {prescription.cout_reel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              )}
            </div>
          )}

          {prescription.notes_internes && (
            <div className="p-4 bg-[#FFFAF0] border-l-4 border-[#FF8C00] rounded-lg">
              <div className="text-[12px] font-bold text-[#718096] uppercase mb-2">Notes internes</div>
              <div className="text-[14px] text-[#4A5568]">{prescription.notes_internes}</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <button
            onClick={() => updateStatut('en_cours')}
            disabled={prescription.statut_detaille === 'en_cours'}
            className="px-4 py-3 bg-[#FEEBC8] text-[#7C2D12] rounded-lg font-semibold hover:bg-[#FBD38D] transition disabled:opacity-50"
          >
            ⚙️ Marquer en cours
          </button>
          <button
            onClick={() => updateStatut('en_attente_validation')}
            disabled={prescription.statut_detaille === 'en_attente_validation'}
            className="px-4 py-3 bg-[#FAF089] text-[#744210] rounded-lg font-semibold hover:bg-[#F6E05E] transition disabled:opacity-50"
          >
            ⏳ En attente validation
          </button>
          <button
            onClick={() => updateStatut('leve')}
            disabled={prescription.statut_detaille === 'leve'}
            className="px-4 py-3 bg-[#C6F6D5] text-[#22543D] rounded-lg font-semibold hover:bg-[#9AE6B4] transition disabled:opacity-50"
          >
            ✓ Marquer comme levé
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-[20px] font-bold text-[#2D3748] mb-4">📋 Historique ({historique.length})</h2>
            {historique.length > 0 ? (
              <div className="space-y-3">
                {historique.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-[#F7FAFC] rounded-lg border-l-4 border-[#4299E1]">
                    <div className="flex-1">
                      <div className="font-semibold text-[#2D3748] text-[14px]">{item.action}</div>
                      {item.commentaire && (
                        <div className="text-[13px] text-[#718096] mt-1">{item.commentaire}</div>
                      )}
                      <div className="text-[12px] text-[#A0AEC0] mt-2 flex items-center gap-2">
                        <span>👤 {item.auteur_nom}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#718096]">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-[14px]">Aucun historique</div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-[20px] font-bold text-[#2D3748] mb-4">📎 Documents ({documents.length})</h2>
            {documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-[#F7FAFC] rounded-lg hover:bg-[#EDF2F7] transition">
                    <div className="text-2xl">
                      {doc.type_document === 'photo_avant' && '📷'}
                      {doc.type_document === 'photo_apres' && '✅'}
                      {doc.type_document === 'devis' && '💰'}
                      {doc.type_document === 'facture' && '🧾'}
                      {doc.type_document === 'rapport' && '📄'}
                      {doc.type_document === 'autre' && '📎'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#2D3748] text-[14px]">{doc.nom_fichier}</div>
                      {doc.description && (
                        <div className="text-[13px] text-[#718096]">{doc.description}</div>
                      )}
                      <div className="text-[12px] text-[#A0AEC0] mt-1">
                        {new Date(doc.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#718096]">
                <div className="text-3xl mb-2">📁</div>
                <div className="text-[14px]">Aucun document</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition"
          >
            ✏️ Modifier la prescription
          </button>
          <button className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg font-semibold hover:bg-[#F7FAFC] transition">
            📎 Ajouter un document
          </button>
          <Link
            href="/prescriptions"
            className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg font-semibold hover:bg-[#F7FAFC] transition"
          >
            ← Retour aux prescriptions
          </Link>
        </div>
      </main>

      {prescription && (
        <EditPrescriptionModal
          prescription={prescription}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchPrescriptionDetails}
        />
      )}
    </div>
  );
}
