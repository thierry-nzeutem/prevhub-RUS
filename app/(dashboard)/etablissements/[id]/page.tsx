'use client';

// ============================================
// PREV'HUB - Page Détail Établissement
// ============================================

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEtablissement, usePrescriptions, useVerifications } from '@/hooks/use-data';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  LoadingSpinner,
  PrescriptionStatusBadge,
  PrioriteBadge,
  AlertBanner,
} from '@/components/shared';
import { cn, formatDate, getDaysUntil } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Building,
  Building2,
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
  Users,
  Flame,
  Wind,
  Zap,
  ExternalLink,
  Map,
  Navigation,
} from 'lucide-react';

// ============================================
// Types
// ============================================

const TYPE_ERP_LABELS: Record<string, string> = {
  J: 'Structures d\'accueil pour personnes âgées et handicapées',
  L: 'Salles d\'audition, de conférences, de réunions, de spectacles',
  M: 'Magasins de vente, centres commerciaux',
  N: 'Restaurants et débits de boissons',
  O: 'Hôtels et pensions de famille',
  P: 'Salles de danse et salles de jeux',
  R: 'Établissements d\'éveil, d\'enseignement, de formation',
  S: 'Bibliothèques, centres de documentation',
  T: 'Salles d\'expositions',
  U: 'Établissements sanitaires',
  V: 'Établissements de culte',
  W: 'Administrations, banques, bureaux',
  X: 'Établissements sportifs couverts',
  Y: 'Musées',
  PA: 'Établissements de plein air',
  CTS: 'Chapiteaux, tentes et structures',
  SG: 'Structures gonflables',
  PS: 'Parcs de stationnement couverts',
  GA: 'Gares accessibles au public',
  OA: 'Hôtels-restaurants d\'altitude',
  EF: 'Établissements flottants',
  REF: 'Refuges de montagne',
};

const INSTALLATION_ICONS: Record<string, React.ElementType> = {
  extincteurs: Flame,
  desenfumage: Wind,
  alarme: Zap,
  eclairage_securite: Zap,
  default: Wrench,
};

// ============================================
// Composants internes
// ============================================

function InfoCard({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: React.ReactNode; 
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-gray-500" />
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

function InstallationCard({ installation }: { installation: any }) {
  const Icon = INSTALLATION_ICONS[installation.type_installation] || INSTALLATION_ICONS.default;
  const prochaineVerif = installation.verifications_periodiques?.[0]?.date_prochaine_verification;
  const joursRestants = prochaineVerif ? getDaysUntil(prochaineVerif) : null;
  const isEnRetard = joursRestants !== null && joursRestants < 0;
  const isUrgent = joursRestants !== null && joursRestants >= 0 && joursRestants <= 30;

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-all',
      isEnRetard ? 'border-red-200 bg-red-50' :
      isUrgent ? 'border-orange-200 bg-orange-50' :
      'border-gray-200 bg-gray-50'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isEnRetard ? 'bg-red-100' : isUrgent ? 'bg-orange-100' : 'bg-gray-100'
          )}>
            <Icon className={cn(
              'w-5 h-5',
              isEnRetard ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'
            )} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{installation.nom}</p>
            <p className="text-xs text-gray-500 capitalize">
              {installation.type_installation?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        {prochaineVerif && (
          <div className="text-right">
            <p className={cn(
              'text-xs font-medium',
              isEnRetard ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-500'
            )}>
              {isEnRetard ? 'En retard' : isUrgent ? 'À prévoir' : 'Prochaine vérif.'}
            </p>
            <p className="text-sm text-gray-900">{formatDate(prochaineVerif)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionRow({ prescription }: { prescription: any }) {
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
        <p className="text-sm font-medium text-gray-900 line-clamp-1">
          {prescription.description_reformulee || prescription.description_complete}
        </p>
        <p className="text-xs text-gray-500">{prescription.numero_prescription}</p>
      </div>
      <PrioriteBadge priorite={prescription.priorite} />
      <PrescriptionStatusBadge statut={prescription.statut} />
      {joursRestants !== null && (
        <span className={cn(
          'text-xs font-medium whitespace-nowrap',
          isEnRetard ? 'text-red-600' : joursRestants <= 7 ? 'text-orange-600' : 'text-gray-500'
        )}>
          {isEnRetard ? `${Math.abs(joursRestants)}j retard` : `J-${joursRestants}`}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </Link>
  );
}

// ============================================
// Page principale
// ============================================

export default function EtablissementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const etablissementId = params.id as string;

  const { data: etablissement, isLoading } = useEtablissement(etablissementId);
  const { data: prescriptions } = usePrescriptions({ etablissement_id: etablissementId });

  // Stats calculées
  const stats = useMemo(() => {
    if (!etablissement) return null;

    const prescriptionsActives = prescriptions?.filter((p) => !['leve', 'valide'].includes(p.statut)).length || 0;
    const prescriptionsEnRetard = prescriptions?.filter((p) => {
      if (!p.date_limite_conformite || ['leve', 'valide'].includes(p.statut)) return false;
      return getDaysUntil(p.date_limite_conformite) < 0;
    }).length || 0;
    
    const installationsCount = etablissement.installations_techniques?.length || 0;
    const verificationsEnRetard = etablissement.installations_techniques?.filter((i: any) => {
      const prochaine = i.verifications_periodiques?.[0]?.date_prochaine_verification;
      if (!prochaine) return false;
      return getDaysUntil(prochaine) < 0;
    }).length || 0;

    return {
      prescriptionsActives,
      prescriptionsEnRetard,
      installationsCount,
      verificationsEnRetard,
    };
  }, [etablissement, prescriptions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!etablissement) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Établissement non trouvé</h2>
        <p className="text-gray-500 mt-1">Cet établissement n'existe pas ou a été supprimé.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  const CATEGORIE_COLORS: Record<string, string> = {
    '1': 'bg-red-100 text-red-700 border-red-200',
    '2': 'bg-orange-100 text-orange-700 border-orange-200',
    '3': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '4': 'bg-blue-100 text-blue-700 border-blue-200',
    '5': 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border',
              CATEGORIE_COLORS[etablissement.categorie_erp || '5'] || 'bg-gray-100 text-gray-600'
            )}>
              {etablissement.categorie_erp || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {etablissement.nom_commercial || etablissement.enseigne}
              </h1>
              <p className="text-gray-500">
                Type {etablissement.type_erp} • Catégorie {etablissement.categorie_erp}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download}>
            Exporter
          </Button>
          <Link href={`/etablissements/${etablissementId}/modifier`}>
            <Button variant="primary" size="sm" icon={Edit}>
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      {/* Alertes */}
      {(stats?.prescriptionsEnRetard || 0) > 0 && (
        <AlertBanner type="error">
          <strong>{stats?.prescriptionsEnRetard} prescription{(stats?.prescriptionsEnRetard || 0) > 1 ? 's' : ''}</strong> en retard !
          Action immédiate requise.
        </AlertBanner>
      )}
      {(stats?.verificationsEnRetard || 0) > 0 && (
        <AlertBanner type="warning">
          <strong>{stats?.verificationsEnRetard} vérification{(stats?.verificationsEnRetard || 0) > 1 ? 's' : ''}</strong> technique{(stats?.verificationsEnRetard || 0) > 1 ? 's' : ''} à planifier.
        </AlertBanner>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{etablissement.effectif_public || '-'}</p>
              <p className="text-sm text-gray-500">Capacité public</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              stats?.prescriptionsEnRetard ? 'bg-red-100' : 'bg-orange-100'
            )}>
              <FileText className={cn(
                'w-5 h-5',
                stats?.prescriptionsEnRetard ? 'text-red-600' : 'text-orange-600'
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.prescriptionsActives || 0}</p>
              <p className="text-sm text-gray-500">Prescriptions actives</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              stats?.verificationsEnRetard ? 'bg-orange-100' : 'bg-gray-100'
            )}>
              <Wrench className={cn(
                'w-5 h-5',
                stats?.verificationsEnRetard ? 'text-orange-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.installationsCount || 0}</p>
              <p className="text-sm text-gray-500">Installations techniques</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.prescriptionsActives === 0 ? '✓' : `${stats?.prescriptionsActives}`}
              </p>
              <p className="text-sm text-gray-500">
                {stats?.prescriptionsActives === 0 ? 'Conforme' : 'À traiter'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prescriptions actives */}
          <Card title="Prescriptions actives" padding="none">
            <div className="p-4">
              {prescriptions && prescriptions.filter((p) => !['leve', 'valide'].includes(p.statut)).length > 0 ? (
                <div>
                  {prescriptions
                    .filter((p) => !['leve', 'valide'].includes(p.statut))
                    .slice(0, 5)
                    .map((prescription) => (
                      <PrescriptionRow key={prescription.id} prescription={prescription} />
                    ))}
                  {prescriptions.filter((p) => !['leve', 'valide'].includes(p.statut)).length > 5 && (
                    <Link
                      href={`/prescriptions?etablissement_id=${etablissementId}`}
                      className="block text-center py-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Voir toutes les prescriptions →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-600">Aucune prescription active</p>
                  <p className="text-sm text-gray-500">Cet établissement est en conformité !</p>
                </div>
              )}
            </div>
          </Card>

          {/* Installations techniques */}
          <Card title="Installations techniques">
            {etablissement.installations_techniques?.length > 0 ? (
              <div className="space-y-3">
                {etablissement.installations_techniques.map((installation: any) => (
                  <InstallationCard key={installation.id} installation={installation} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wrench}
                title="Aucune installation"
                description="Aucune installation technique n'est enregistrée."
                action={{ label: 'Ajouter une installation', href: `/installations/nouvelle?etablissement_id=${etablissementId}` }}
              />
            )}
          </Card>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Informations ERP */}
          <Card title="Informations ERP">
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Type {etablissement.type_erp}</p>
                <p className="text-sm text-gray-900">
                  {TYPE_ERP_LABELS[etablissement.type_erp] || 'Type inconnu'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  label="Effectif public"
                  value={etablissement.effectif_public}
                  icon={Users}
                />
                <InfoCard
                  label="Effectif personnel"
                  value={etablissement.effectif_personnel}
                  icon={Users}
                />
              </div>

              {etablissement.surface && (
                <InfoCard
                  label="Surface"
                  value={`${etablissement.surface} m²`}
                />
              )}

              {etablissement.nombre_niveaux && (
                <InfoCard
                  label="Nombre de niveaux"
                  value={etablissement.nombre_niveaux}
                />
              )}
            </div>
          </Card>

          {/* Localisation */}
          <Card title="Localisation">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-900">{etablissement.adresse}</p>
                  <p className="text-gray-900">{etablissement.code_postal} {etablissement.ville}</p>
                </div>
              </div>

              {etablissement.latitude && etablissement.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${etablissement.latitude},${etablissement.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                >
                  <Navigation className="w-4 h-4" />
                  Ouvrir dans Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </Card>

          {/* Groupement */}
          {etablissement.groupement && (
            <Card title="Groupement">
              <Link
                href={`/groupements/${etablissement.groupement.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Building2 className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{etablissement.groupement.nom}</p>
                  {etablissement.groupement.type && (
                    <p className="text-xs text-gray-500 capitalize">{etablissement.groupement.type}</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </Card>
          )}

          {/* Actions rapides */}
          <Card title="Actions">
            <div className="space-y-2">
              <Link
                href={`/visites/nouvelle?etablissement_id=${etablissementId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Planifier une visite</p>
                  <p className="text-xs text-gray-500">Organiser une visite</p>
                </div>
              </Link>
              <Link
                href={`/rapports/visite?etablissement_id=${etablissementId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Générer un rapport</p>
                  <p className="text-xs text-gray-500">Rapport de visite PDF</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
