'use client';

// ============================================
// PREV'HUB - Détail Prescription
// ============================================

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrescription, useUpdatePrescription } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  PrescriptionStatusBadge,
  PrioriteBadge,
  CriticiteBadge,
  LoadingSpinner,
  AlertBanner,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Send,
  Download,
  Trash2,
  Clock,
  Calendar,
  Building2,
  FileText,
  User,
  History,
  MessageSquare,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Euro,
  Phone,
  Mail,
} from 'lucide-react';
import type { StatutPrescription } from '@/types';

// ============================================
// Composants
// ============================================

function StatusTimeline({ historique }: { historique: any[] }) {
  if (!historique || historique.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Aucun historique disponible
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {historique.map((entry, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                index === 0 ? 'bg-orange-500' : 'bg-gray-300'
              )}
            />
            {index < historique.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-gray-900">{entry.action}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(entry.created_at).toLocaleString('fr-FR')}
              {entry.auteur && ` • ${entry.auteur.prenom} ${entry.auteur.nom}`}
            </p>
            {entry.commentaire && (
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                {entry.commentaire}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangeStatusModal({
  currentStatus,
  onClose,
  onConfirm,
  isLoading,
}: {
  currentStatus: StatutPrescription;
  onClose: () => void;
  onConfirm: (status: StatutPrescription, commentaire?: string) => void;
  isLoading: boolean;
}) {
  const [newStatus, setNewStatus] = useState<StatutPrescription>(currentStatus);
  const [commentaire, setCommentaire] = useState('');

  const statuses: { value: StatutPrescription; label: string; description: string }[] = [
    { value: 'nouveau', label: 'Nouveau', description: 'Prescription venant d\'être créée' },
    { value: 'en_cours', label: 'En cours', description: 'Traitement en cours' },
    { value: 'commande_envoyee', label: 'Commandé', description: 'Intervention commandée au prestataire' },
    { value: 'planifie', label: 'Planifié', description: 'Date d\'intervention fixée' },
    { value: 'realise', label: 'Réalisé', description: 'Intervention effectuée' },
    { value: 'en_attente_validation', label: 'À valider', description: 'En attente de validation' },
    { value: 'leve', label: 'Levé', description: 'Prescription levée' },
    { value: 'valide', label: 'Validé', description: 'Validé par la commission' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Changer le statut</h2>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau statut</label>
            <div className="space-y-2">
              {statuses.map((status) => (
                <label
                  key={status.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    newStatus === status.value
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={newStatus === status.value}
                    onChange={() => setNewStatus(status.value)}
                    className="mt-0.5 w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{status.label}</p>
                    <p className="text-xs text-gray-500">{status.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onConfirm(newStatus, commentaire)}
            loading={isLoading}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prescriptionId = params.id as string;

  const { data: prescription, isLoading, refetch } = usePrescription(prescriptionId);
  const updatePrescription = useUpdatePrescription();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: StatutPrescription, commentaire?: string) => {
    setIsUpdating(true);
    try {
      await updatePrescription.mutateAsync({
        id: prescriptionId,
        statut: newStatus,
        commentaire_resolution: commentaire,
      });
      refetch();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Erreur changement statut:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <AlertBanner type="error">Prescription non trouvée</AlertBanner>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  const joursRestants = prescription.date_limite_conformite
    ? Math.ceil(
        (new Date(prescription.date_limite_conformite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isEnRetard = joursRestants !== null && joursRestants < 0;
  const isUrgent = joursRestants !== null && joursRestants >= 0 && joursRestants <= 7;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux prescriptions
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {prescription.numero_prescription || `Prescription #${prescription.id.slice(0, 8)}`}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <PrescriptionStatusBadge statut={prescription.statut} />
            <PrioriteBadge priorite={prescription.priorite} />
            {prescription.criticite && <CriticiteBadge criticite={prescription.criticite} />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download}>
            PDF
          </Button>
          <Button variant="outline" size="sm" icon={Edit} onClick={() => setShowStatusModal(true)}>
            Statut
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Send}
            onClick={() => router.push(`/commandes/nouvelle?prescription_id=${prescription.id}`)}
          >
            Commander
          </Button>
        </div>
      </div>

      {/* Alerte retard */}
      {isEnRetard && (
        <AlertBanner type="error" icon={AlertTriangle}>
          Cette prescription est en retard de <strong>{Math.abs(joursRestants!)} jours</strong>.
          Action immédiate requise.
        </AlertBanner>
      )}

      {isUrgent && !isEnRetard && (
        <AlertBanner type="warning" icon={Clock}>
          Échéance dans <strong>{joursRestants} jours</strong>. Pensez à planifier l'intervention.
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card title="Description">
            <p className="text-gray-700 whitespace-pre-wrap">
              {prescription.description_complete}
            </p>

            {prescription.description_reformulee && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Reformulation IA</span>
                </div>
                <p className="text-sm text-purple-800">{prescription.description_reformulee}</p>
              </div>
            )}

            {prescription.articles_reglementaires && prescription.articles_reglementaires.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Références réglementaires</h4>
                <div className="flex flex-wrap gap-2">
                  {prescription.articles_reglementaires.map((article, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                    >
                      {article}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Informations */}
          <Card title="Informations">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Date limite
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {prescription.date_limite_conformite
                    ? new Date(prescription.date_limite_conformite).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Non définie'}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  Établissement
                </dt>
                <dd className="mt-1">
                  {prescription.etablissement ? (
                    <Link
                      href={`/etablissements/${prescription.etablissement.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {prescription.etablissement.nom_commercial}
                    </Link>
                  ) : prescription.groupement ? (
                    <Link
                      href={`/groupements/${prescription.groupement.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {prescription.groupement.nom}
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Commission
                </dt>
                <dd className="mt-1">
                  {prescription.commission ? (
                    <Link
                      href={`/commissions/${prescription.commission.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700"
                    >
                      {new Date(prescription.commission.date).toLocaleDateString('fr-FR')}
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Responsable suivi
                </dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {prescription.responsable_suivi
                    ? `${prescription.responsable_suivi.prenom} ${prescription.responsable_suivi.nom}`
                    : 'Non assigné'}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Photos */}
          {(prescription.photos_avant?.length || prescription.photos_apres?.length) && (
            <Card title="Photos">
              <div className="grid grid-cols-2 gap-4">
                {prescription.photos_avant?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Avant intervention</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {prescription.photos_avant.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Avant ${i + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {prescription.photos_apres?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Après intervention</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {prescription.photos_apres.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Après ${i + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Estimation coût */}
          {(prescription.cout_estime_min || prescription.cout_estime_max) && (
            <Card title="Estimation coût" icon={Euro}>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {prescription.cout_estime_min?.toLocaleString('fr-FR')} €
                  {prescription.cout_estime_max && prescription.cout_estime_max !== prescription.cout_estime_min && (
                    <span className="text-gray-500"> - {prescription.cout_estime_max.toLocaleString('fr-FR')} €</span>
                  )}
                </p>
                {prescription.score_confiance_ia && (
                  <p className="text-sm text-gray-500 mt-1">
                    Confiance IA : {Math.round(prescription.score_confiance_ia * 100)}%
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Prestataire recommandé */}
          {prescription.prestataire_recommande && (
            <Card title="Prestataire recommandé" icon={Sparkles}>
              <div className="space-y-3">
                <p className="font-medium text-gray-900">
                  {prescription.prestataire_recommande.raison_sociale}
                </p>
                {prescription.raison_recommendation && (
                  <p className="text-sm text-gray-600">{prescription.raison_recommendation}</p>
                )}
                <div className="flex flex-col gap-2">
                  {prescription.prestataire_recommande.telephone && (
                    <a
                      href={`tel:${prescription.prestataire_recommande.telephone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Phone className="w-4 h-4" />
                      {prescription.prestataire_recommande.telephone}
                    </a>
                  )}
                  {prescription.prestataire_recommande.email && (
                    <a
                      href={`mailto:${prescription.prestataire_recommande.email}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Mail className="w-4 h-4" />
                      {prescription.prestataire_recommande.email}
                    </a>
                  )}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={Send}
                  onClick={() =>
                    router.push(
                      `/commandes/nouvelle?prescription_id=${prescription.id}&prestataire_id=${prescription.prestataire_recommande!.id}`
                    )
                  }
                >
                  Commander
                </Button>
              </div>
            </Card>
          )}

          {/* Prestataire effectif */}
          {prescription.prestataire_effectif && (
            <Card title="Prestataire assigné">
              <p className="font-medium text-gray-900">
                {prescription.prestataire_effectif.raison_sociale}
              </p>
              <div className="flex flex-col gap-2 mt-3">
                {prescription.prestataire_effectif.telephone && (
                  <a
                    href={`tel:${prescription.prestataire_effectif.telephone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Phone className="w-4 h-4" />
                    {prescription.prestataire_effectif.telephone}
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Historique */}
          <Card title="Historique" icon={History}>
            <StatusTimeline historique={prescription.historique || []} />
          </Card>
        </div>
      </div>

      {/* Modal changement statut */}
      {showStatusModal && (
        <ChangeStatusModal
          currentStatus={prescription.statut}
          onClose={() => setShowStatusModal(false)}
          onConfirm={handleStatusChange}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
