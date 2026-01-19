'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
  etablissements_concernes?: string[];
}

interface Arrete {
  id: string;
  numero: string;
  date: string;
  type: string;
  objet: string;
  statut: string;
}

interface CommissionsTabProps {
  etablissementId?: string;
  groupementId?: string;
  etablissementNom?: string;
}

export default function CommissionsTab({ etablissementId, groupementId, etablissementNom }: CommissionsTabProps) {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [arretes, setArretes] = useState<Arrete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissions();
  }, [etablissementId, groupementId]);

  async function fetchCommissions() {
    try {
      let query = supabase
        .from('commissions')
        .select('*')
        .order('date', { ascending: false });

      if (etablissementId) {
        query = query.eq('etablissement_id', etablissementId);
      } else if (groupementId) {
        query = query.eq('groupement_id', groupementId);
      }

      const { data: commissionsData } = await query;

      if (commissionsData) {
        const commissionsWithEtabs = await Promise.all(
          commissionsData.map(async (commission: any) => {
            const { data: etablissements } = await supabase
              .from('commission_etablissements')
              .select('etablissement:etablissements(nom_commercial)')
              .eq('commission_id', commission.id);

            const etabsNoms = etablissements?.map((e: any) => e.etablissement?.nom_commercial).filter(Boolean) || [];

            if (commission.etablissement_id) {
              const { data: etabPrincipal } = await supabase
                .from('etablissements')
                .select('nom_commercial')
                .eq('id', commission.etablissement_id)
                .maybeSingle();

              const etab = etabPrincipal as any;
              if (etab?.nom_commercial && !etabsNoms.includes(etab.nom_commercial)) {
                etabsNoms.unshift(etab.nom_commercial);
              }
            }

            return {
              ...commission,
              etablissements_concernes: etabsNoms,
            };
          })
        );

        setCommissions(commissionsWithEtabs);
      }

      let arretesQuery = supabase
        .from('arretes')
        .select('*')
        .order('date', { ascending: false });

      if (etablissementId) {
        arretesQuery = arretesQuery.eq('etablissement_id', etablissementId);
      } else if (groupementId) {
        arretesQuery = arretesQuery.eq('groupement_id', groupementId);
      }

      const { data: arretesData } = await arretesQuery;
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

  if (loading) {
    return (
      <div className="text-center py-12 text-[#718096]">
        <div className="text-[14px]">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-[20px] font-bold text-[#1A202C] mb-2">⚖️ Historique administratif</h2>
          <p className="text-[14px] text-[#718096]">
            Commissions de sécurité et d'accessibilité, arrêtés municipaux
            {etablissementNom && ` concernant ${etablissementNom}`}
          </p>
        </div>
        <Link
          href="/commissions"
          className="px-4 py-2 bg-[#FF8C00] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E67E00] transition"
        >
          Voir toutes les commissions
        </Link>
      </div>

      {commissions.length === 0 && arretes.length === 0 ? (
        <div className="text-center py-12 text-[#718096]">
          <div className="text-5xl mb-4">⚖️</div>
          <div className="text-[18px] font-semibold text-[#2D3748] mb-2">Aucune commission ou arrêté</div>
          <div className="text-[14px]">
            Les commissions et arrêtés seront affichés ici
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {commissions.length > 0 && (
            <div>
              <h3 className="text-[16px] font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                📅 Commissions ({commissions.length})
              </h3>
              <div className="space-y-3">
                {commissions.map((commission) => {
                  const typeInfo = getTypeLabel(commission.type);
                  const isFuture = new Date(commission.date) > new Date();

                  return (
                    <div
                      key={commission.id}
                      className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg p-4 hover:border-[#FF8C00] transition cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`font-semibold ${isFuture ? 'text-[#4299E1]' : 'text-[#2D3748]'}`}>
                            {new Date(commission.date).toLocaleDateString('fr-FR')}
                            {commission.heure && ` à ${commission.heure}`}
                          </div>
                          <span className="flex items-center gap-1.5 font-semibold text-[13px]" style={{ color: typeInfo.color }}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </div>
                        {getAvisBadge(commission.avis)}
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {commission.objet_details && (
                            <div className="text-[15px] font-semibold text-[#2D3748] mb-1">
                              {commission.objet_details}
                            </div>
                          )}

                          {commission.etablissements_concernes && commission.etablissements_concernes.length > 0 && (
                            <div className="text-[13px] text-[#718096] mb-2">
                              <span className="font-semibold">Cellule(s) concernée(s) :</span>{' '}
                              {commission.etablissements_concernes.join(', ')}
                            </div>
                          )}

                          {commission.reference && (
                            <div className="text-[13px] text-[#718096]">
                              <span className="font-semibold">Référence :</span> {commission.reference}
                              {commission.affaire && ` • ${commission.affaire}`}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/commissions/${commission.id}`}
                          className="ml-4 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[12px] font-semibold hover:bg-[#F7FAFC] transition"
                        >
                          Voir détails
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {arretes.length > 0 && (
            <div>
              <h3 className="text-[16px] font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                📄 Arrêtés ({arretes.length})
              </h3>
              <div className="space-y-3">
                {arretes.map((arrete) => (
                  <div
                    key={arrete.id}
                    className="bg-[#F7FAFC] border border-[#E2E8F0] rounded-lg p-4 hover:border-[#FF8C00] transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-[#2D3748]">{arrete.numero}</div>
                          <span className="px-2 py-1 bg-[#C6F6D5] text-[#22543D] rounded text-[12px] font-semibold capitalize">
                            {arrete.type}
                          </span>
                          <span className="text-[13px] text-[#718096]">
                            {new Date(arrete.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-[14px] text-[#4A5568]">{arrete.objet}</div>
                      </div>
                      <button className="ml-4 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#2D3748] rounded-lg text-[12px] font-semibold hover:bg-[#F7FAFC] transition">
                        Consulter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
