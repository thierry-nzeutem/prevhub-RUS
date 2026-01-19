'use client';

// ============================================
// PREV'HUB - Page Détail Groupement
// ============================================

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGroupement, useEtablissements, usePrescriptions } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingSpinner,
  PrescriptionStatusBadge,
  PrioriteBadge,
} from '@/components/shared';
import { cn, formatDate, getDaysUntil } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Building2,
  Building,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ChevronRight,
  Clock,
  Download,
  Settings,
  Shield,
  Wrench,
  Eye,
} from 'lucide-react';

// ============================================
// Composants internes
// ============================================

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  href,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
}) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-orange-100 text-orange-600',
    danger: 'bg-red-100 text-red-600',
  };

  const Content = () => (
    <div className="flex items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', variantStyles[variant])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="hover:border-orange-200 hover:shadow-md transition-all cursor-pointer">
          <Content />
        </Card>
      </Link>
    );
  }

  return (
    <Card>
      <Content />
    </Card>
  );
}

function EtablissementMiniCard({ etablissement }: { etablissement: any }) {
  const prescriptionsActives = etablissement.prescriptions?.filter(
    (p: any) => !['leve', 'valide'].includes(p.statut)
  ).length || 0;

  return (
    <Link
      href={`/etablissements/${etablissement.id}`}
      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-200 hover:shadow-sm transition-all"
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border',
        etablissement.categorie_erp === 5 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
      )}>
        {etablissement.categorie_erp || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{etablissement.nom_commercial}</h4>
        <p className="text-sm text-gray-500 truncate">
          Type {etablissement.type_erp} • {etablissement.ville}
        </p>
      </div>
      {prescriptionsActives > 0 && (
        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          {prescriptionsActives}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}

function PrescriptionMiniRow({ prescription }: { prescription: any }) {
  const joursRestants = prescription.date_limite_conformite
    ? getDaysUntil(prescription.date_limite_conformite)
    : null;
  const isEnRetard = joursRestants !== null && joursRestants < 0;

  return (
    <Link
      href={`/prescriptions/${prescription.id}`}
      className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-4 px-4 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {prescription.description_reformulee || prescription.description_complete}
        </p>
        <p className="text-xs text-gray-500">
          {prescription.etablissement?.nom_commercial} • {prescription.numero_prescription}
        </p>
      </div>
      <PrioriteBadge priorite={prescription.priorite} />
      <PrescriptionStatusBadge statut={prescription.statut} />
      {joursRestants !== null && (
        <span className={cn(
          'text-xs font-medium',
          isEnRetard ? 'text-red-600' : joursRestants <= 7 ? 'text-orange-600' : 'text-gray-500'
        )}>
          {isEnRetard ? `${Math.abs(joursRestants)}j retard` : `${joursRestants}j`}
        </span>
      )}
    </Link>
  );
}

function CommissionMiniCard({ commission }: { commission: any }) {
  const joursRestants = commission.date ? getDaysUntil(commission.date) : null;
  const isPast = joursRestants !== null && joursRestants < 0;

  return (
    <Link
      href={`/commissions/${commission.id}`}
      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        isPast ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-600'
      )}>
        <Calendar className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{formatDate(commission.date)}</p>
        <p className="text-sm text-gray-500">
          {commission.type || 'Sécurité'} • {commission.etablissement?.nom_commercial || 'Groupement'}
        </p>
      </div>
      {commission.avis && (
        <Badge
          variant={
            commission.avis === 'favorable' ? 'success' :
            commission.avis === 'defavorable' ? 'danger' : 'warning'
          }
          size="sm"
        >
          {commission.avis}
        </Badge>
      )}
    </Link>
  );
}

// ============================================
// Page principale
// ============================================

export default function GroupementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupementId = params.id as string;

  const { data: groupement, isLoading } = useGroupement(groupementId);
  const { data: etablissements } = useEtablissements({ groupement_id: groupementId });
  const { data: prescriptions } = usePrescriptions({ groupement_id: groupementId });

  // Stats calculées
  const stats = useMemo(() => {
    if (!groupement) return null;

    const etablissementsCount = etablissements?.length || 0;
    const prescriptionsActives = prescriptions?.filter((p) => !['leve', 'valide'].includes(p.statut)).length || 0;
    const prescriptionsEnRetard = prescriptions?.filter((p) => {
      if (!p.date_limite_conformite || ['leve', 'valide'].includes(p.statut)) return false;
      return getDaysUntil(p.date_limite_conformite) < 0;
    }).length || 0;
    const commissionsAVenir = groupement.commissions?.filter((c: any) => 
      c.date && getDaysUntil(c.date) >= 0
    ).length || 0;

    return {
      etablissementsCount,
      prescriptionsActives,
      prescriptionsEnRetard,
      commissionsAVenir,
    };
  }, [groupement, etablissements, prescriptions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!groupement) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Groupement non trouvé</h2>
        <p className="text-gray-500 mt-1">Ce groupement n'existe pas ou a été supprimé.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{groupement.nom}</h1>
              {groupement.code_groupement && (
                <p className="text-gray-500">Code: {groupement.code_groupement}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download}>
            Exporter
          </Button>
          <Link href={`/groupements/${groupementId}/modifier`}>
            <Button variant="primary" size="sm" icon={Edit}>
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Établissements"
          value={stats?.etablissementsCount || 0}
          icon={Building}
          href={`/etablissements?groupement_id=${groupementId}`}
        />
        <StatCard
          title="Prescriptions actives"
          value={stats?.prescriptionsActives || 0}
          subtitle={stats?.prescriptionsEnRetard ? `${stats.prescriptionsEnRetard} en retard` : undefined}
          icon={FileText}
          variant={stats?.prescriptionsEnRetard ? 'danger' : 'default'}
          href={`/prescriptions?groupement_id=${groupementId}`}
        />
        <StatCard
          title="Commissions à venir"
          value={stats?.commissionsAVenir || 0}
          icon={Calendar}
          variant={stats?.commissionsAVenir ? 'warning' : 'default'}
          href={`/commissions?groupement_id=${groupementId}`}
        />
        <StatCard
          title="Taux conformité"
          value={stats?.prescriptionsActives
            ? `${Math.round(((prescriptions?.filter((p) => p.statut === 'leve').length || 0) / prescriptions!.length) * 100)}%`
            : '100%'}
          icon={Shield}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Établissements */}
          <Card title="Établissements" padding="none">
            <div className="p-4">
              {etablissements && etablissements.length > 0 ? (
                <div className="space-y-3">
                  {etablissements.slice(0, 5).map((etab) => (
                    <EtablissementMiniCard key={etab.id} etablissement={etab} />
                  ))}
                  {etablissements.length > 5 && (
                    <Link
                      href={`/etablissements?groupement_id=${groupementId}`}
                      className="block text-center py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Voir les {etablissements.length - 5} autres →
                    </Link>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Building}
                  title="Aucun établissement"
                  description="Ce groupement n'a pas encore d'établissements."
                  action={{ label: 'Ajouter un établissement', href: `/etablissements/nouveau?groupement_id=${groupementId}` }}
                />
              )}
            </div>
          </Card>

          {/* Prescriptions actives */}
          <Card title="Prescriptions actives" padding="none">
            <div className="p-4">
              {prescriptions && prescriptions.filter((p) => !['leve', 'valide'].includes(p.statut)).length > 0 ? (
                <div>
                  {prescriptions
                    .filter((p) => !['leve', 'valide'].includes(p.statut))
                    .slice(0, 5)
                    .map((prescription) => (
                      <PrescriptionMiniRow key={prescription.id} prescription={prescription} />
                    ))}
                  {prescriptions.filter((p) => !['leve', 'valide'].includes(p.statut)).length > 5 && (
                    <Link
                      href={`/prescriptions?groupement_id=${groupementId}`}
                      className="block text-center py-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Voir toutes les prescriptions →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-600">Aucune prescription active</p>
                  <p className="text-sm">Toutes les prescriptions sont à jour !</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations */}
          <Card title="Informations">
            <div className="space-y-4">
              {groupement.type && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-medium text-gray-900 capitalize">{groupement.type}</p>
                  </div>
                </div>
              )}

              {(groupement.adresse || groupement.ville) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="text-gray-900">{groupement.adresse}</p>
                    <p className="text-gray-900">{groupement.code_postal} {groupement.ville}</p>
                  </div>
                </div>
              )}

              {groupement.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <a href={`tel:${groupement.telephone}`} className="text-gray-900 hover:text-orange-600">
                      {groupement.telephone}
                    </a>
                  </div>
                </div>
              )}

              {groupement.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${groupement.email}`} className="text-gray-900 hover:text-orange-600">
                      {groupement.email}
                    </a>
                  </div>
                </div>
              )}

              {groupement.contact_principal && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Contact principal</p>
                    <p className="text-gray-900">{groupement.contact_principal}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Prochaines commissions */}
          <Card title="Prochaines commissions">
            {groupement.commissions?.filter((c: any) => c.date && getDaysUntil(c.date) >= 0).length > 0 ? (
              <div className="space-y-3">
                {groupement.commissions
                  .filter((c: any) => c.date && getDaysUntil(c.date) >= 0)
                  .slice(0, 3)
                  .map((commission: any) => (
                    <CommissionMiniCard key={commission.id} commission={commission} />
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Aucune commission à venir</p>
            )}
          </Card>

          {/* Actions rapides */}
          <Card title="Actions">
            <div className="space-y-2">
              <Link
                href={`/visites/nouvelle?groupement_id=${groupementId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Planifier une visite</p>
                  <p className="text-xs text-gray-500">Organiser une visite de prévention</p>
                </div>
              </Link>
              <Link
                href={`/commissions/nouvelle?groupement_id=${groupementId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Saisir une commission</p>
                  <p className="text-xs text-gray-500">Enregistrer une nouvelle commission</p>
                </div>
              </Link>
              <Link
                href={`/rapports/synthese?groupement_id=${groupementId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Générer un rapport</p>
                  <p className="text-xs text-gray-500">Synthèse des prescriptions</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
