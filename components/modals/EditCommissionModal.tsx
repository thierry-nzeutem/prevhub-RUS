// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Commission {
  id: string;
  date: string;
  heure: string | null;
  type: string;
  objet: string;
  objet_details: string | null;
  reference: string | null;
  affaire: string | null;
  avis: string | null;
  notes: string | null;
  date_convocation: string | null;
}

interface EditCommissionModalProps {
  commission: Commission;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCommissionModal({ commission, isOpen, onClose, onSuccess }: EditCommissionModalProps) {
  const [formData, setFormData] = useState<Commission>(commission);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(commission);
  }, [commission]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          date: formData.date,
          heure: formData.heure,
          type: formData.type,
          objet: formData.objet,
          objet_details: formData.objet_details,
          reference: formData.reference,
          affaire: formData.affaire,
          avis: formData.avis,
          notes: formData.notes,
          date_convocation: formData.date_convocation,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', commission.id);

      if (error) throw error;

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
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex justify-between items-center">
          <h2 className="text-[24px] font-bold text-[#2D3748]">✏️ Modifier la commission</h2>
          <button
            onClick={onClose}
            className="text-[#718096] hover:text-[#2D3748] text-[24px] font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Heure
              </label>
              <input
                type="time"
                value={formData.heure || ''}
                onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            >
              <option value="securite">Sécurité</option>
              <option value="accessibilite">Accessibilité</option>
              <option value="mixte">Mixte</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Objet *
            </label>
            <select
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              required
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            >
              <option value="visite_periodique">Visite périodique</option>
              <option value="visite_reception">Visite de réception</option>
              <option value="visite_inopinee">Visite inopinée</option>
              <option value="controle_travaux">Contrôle de travaux</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Détails de l'objet
            </label>
            <input
              type="text"
              value={formData.objet_details || ''}
              onChange={(e) => setFormData({ ...formData, objet_details: e.target.value })}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              placeholder="Ex: Visite périodique triennale"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference || ''}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                placeholder="Ex: CS-2024-001"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
                Affaire
              </label>
              <input
                type="text"
                value={formData.affaire || ''}
                onChange={(e) => setFormData({ ...formData, affaire: e.target.value })}
                className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
                placeholder="Ex: AFF-2024-123"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Avis
            </label>
            <select
              value={formData.avis || ''}
              onChange={(e) => setFormData({ ...formData, avis: e.target.value })}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            >
              <option value="">Non renseigné</option>
              <option value="favorable">Favorable</option>
              <option value="defavorable">Défavorable</option>
              <option value="avis_suspendu">Avis suspendu</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Date de convocation
            </label>
            <input
              type="date"
              value={formData.date_convocation || ''}
              onChange={(e) => setFormData({ ...formData, date_convocation: e.target.value })}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#718096] uppercase mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4299E1]"
              placeholder="Notes internes..."
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
