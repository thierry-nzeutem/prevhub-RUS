// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Prescription {
  id: string;
  numero_observation: string;
  description: string;
  criticite: string;
  statut_detaille: string;
  priorite: string;
  delai_jours: number;
  responsable_nom: string;
  responsable_email: string;
  prestataire_id: string | null;
  cout_previsionnel: number;
  cout_reel: number | null;
  notes_internes: string;
}

interface Prestataire {
  id: string;
  nom: string;
  specialite: string;
}

interface EditPrescriptionModalProps {
  prescription: Prescription;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPrescriptionModal({ prescription, isOpen, onClose, onSuccess }: EditPrescriptionModalProps) {
  const [formData, setFormData] = useState<Prescription>(prescription);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(prescription);
    fetchPrestataires();
  }, [prescription]);

  async function fetchPrestataires() {
    const { data } = await supabase
      .from('prestataires')
      .select('id, nom, specialite')
      .eq('actif', true)
      .order('nom');
    setPrestataires(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('observations')
        .update({
          description: formData.description,
          criticite: formData.criticite,
          statut_detaille: formData.statut_detaille,
          priorite: formData.priorite,
          delai_jours: formData.delai_jours,
          responsable_nom: formData.responsable_nom,
          responsable_email: formData.responsable_email,
          prestataire_id: formData.prestataire_id,
          cout_previsionnel: formData.cout_previsionnel,
          cout_reel: formData.cout_reel,
          notes_internes: formData.notes_internes,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', prescription.id);

      if (error) throw error;

      await supabase.from('prescription_historique').insert({
        prescription_id: prescription.id,
        action: 'Modification de la prescription',
        statut_avant: prescription.statut_detaille,
        statut_apres: formData.statut_detaille,
        commentaire: 'Prescription modifiée manuellement',
        auteur_nom: formData.responsable_nom,
        auteur_email: formData.responsable_email
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex justify-between items-center">
          <h2 className="text-[24px] font-bold text-[#2D3748]">✏️ Modifier la prescription</h2>
          <button
            onClick={onClose}
            className="text-[#718096] hover:text-[#2D3748] text-[24px] font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-[#EBF4FF] p-4 rounded-lg">
            <div className="font-bold text-[#2C5282]">📋 {formData.numero_observation}</div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Criticité *
              </label>
              <select
                value={formData.criticite}
                onChange={(e) => setFormData({ ...formData, criticite: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              >
                <option value="critique">Critique</option>
                <option value="majeure">Majeure</option>
                <option value="mineure">Mineure</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Priorité *
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="haute">🟠 Haute</option>
                <option value="normale">🟢 Normale</option>
                <option value="basse">🔵 Basse</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Statut *
              </label>
              <select
                value={formData.statut_detaille}
                onChange={(e) => setFormData({ ...formData, statut_detaille: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              >
                <option value="nouveau">🆕 Nouveau</option>
                <option value="en_cours">⚙️ En cours</option>
                <option value="en_attente_validation">⏳ En attente validation</option>
                <option value="leve">✓ Levé</option>
                <option value="valide">✓✓ Validé</option>
                <option value="annule">✗ Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Délai réglementaire (jours) *
            </label>
            <input
              type="number"
              value={formData.delai_jours}
              onChange={(e) => setFormData({ ...formData, delai_jours: parseInt(e.target.value) })}
              required
              min="0"
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Responsable du suivi *
              </label>
              <input
                type="text"
                value={formData.responsable_nom}
                onChange={(e) => setFormData({ ...formData, responsable_nom: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Email du responsable *
              </label>
              <input
                type="email"
                value={formData.responsable_email}
                onChange={(e) => setFormData({ ...formData, responsable_email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Prestataire assigné
            </label>
            <select
              value={formData.prestataire_id || ''}
              onChange={(e) => setFormData({ ...formData, prestataire_id: e.target.value || null })}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            >
              <option value="">Aucun prestataire</option>
              {prestataires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} - {p.specialite}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Coût prévisionnel (€)
              </label>
              <input
                type="number"
                value={formData.cout_previsionnel}
                onChange={(e) => setFormData({ ...formData, cout_previsionnel: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Coût réel (€)
              </label>
              <input
                type="number"
                value={formData.cout_reel || ''}
                onChange={(e) => setFormData({ ...formData, cout_reel: e.target.value ? parseFloat(e.target.value) : null })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Notes internes
            </label>
            <textarea
              value={formData.notes_internes}
              onChange={(e) => setFormData({ ...formData, notes_internes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              placeholder="Notes pour le suivi interne..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-[#E67E00] transition disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : '✓ Enregistrer les modifications'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg font-semibold hover:bg-[#F7FAFC] transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
