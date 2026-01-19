'use client';

// ============================================
// PREV'HUB - Dashboard Principal
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  useDashboardKPIs,
  usePrescriptions,
  useCommissionsAPreparer,
  useVerificationsAlertes,
  useVisitesDuJour,
  useRealtimeAlertes,
} from '@/hooks/use-data';
import {
  KPICard,
  Card,
  Badge,
  PrescriptionStatusBadge,
  PrioriteBadge,
  AvisCommissionBadge,
  VerificationStatusBadge,
  EmptyState,
  LoadingCard,
  Button,
  AlertBanner,
  PageHeader,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  ClipboardList,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  FileCheck,
  Wrench,
  TrendingUp,
  ArrowRight,
  Bell,
  MapPin,
  Shield,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { Alerte, Prescription } from '@/types';

// ============================================
// Composants internes
// ============================================

function AlerteItem({ alerte }: { alerte: Alerte }) {
  const niveauConfig = {
    critique: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
    urgent: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500' },
    attention: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
  };

  const config = niveauConfig[alerte.niveau] || niveauConfig.info;

  return (
    <div className={cn('p-3 rounded-lg border flex items-start gap-3', config.bg, config.border)}>
      <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.icon)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">{alerte.titre}</p>
        {alerte.description && (
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{alerte.description}</p>
        )}
        {alerte.jours_restants !== null && alerte.jours_restants !== undefined && (
          <p className="text-xs text-gray-500 mt-1">
            {alerte.jours_restants < 0
              ? `En retard de ${Math.abs(alerte.jours_restants)} jours`
              : alerte.jours_restants === 0
              ? "Échéance aujourd'hui"
              : `${alerte.jours_restants} jours restants`}
          </p>
        )}
      </div>
    </div>
  );
}

function PrescriptionRow({ prescription }: { prescription: Prescription }) {
  const joursRestants = prescription.date_limite_conformite
    ? Math.ceil(
        (new Date(prescription.date_limite_conformite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Link
      href={`/prescriptions/${prescription.id}`}
      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">
          {prescription.description_complete}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {prescription.etablissement?.nom_commercial || prescription.groupement?.nom}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PrioriteBadge priorite={prescription.priorite} />
        {joursRestants !== null && (
          <span
            className={cn(
              'text-xs font-medium',
              joursRestants < 0
                ? 'text-red-600'
                : joursRestants <= 7
                ? 'text-orange-600'
                : 'text-gray-500'
            )}
          >
            {joursRestants < 0
              ? `+${Math.abs(joursRestants)}j`
              : joursRestants === 0
              ? "Aujourd'hui"
              : `${joursRestants}j`}
          </span>
        )}
      </div>
    </Link>
  );
}

function CommissionRow({ commission }: { commission: any }) {
  const joursAvant = commission.jours_avant;

  return (
    <Link
      href={`/commissions/${commission.id}`}
      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          joursAvant <= 15 ? 'bg-red-100' : joursAvant <= 30 ? 'bg-orange-100' : 'bg-blue-100'
        )}
      >
        <Calendar
          className={cn(
            'w-5 h-5',
            joursAvant <= 15 ? 'text-red-600' : joursAvant <= 30 ? 'text-orange-600' : 'text-blue-600'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm">
          {commission.groupement_nom || commission.etablissement_nom}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(commission.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>
      <Badge
        variant={joursAvant <= 15 ? 'danger' : joursAvant <= 30 ? 'warning' : 'info'}
        size="sm"
      >
        J-{joursAvant}
      </Badge>
    </Link>
  );
}

function VerificationRow({ verification }: { verification: any }) {
  return (
    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Wrench className="w-5 h-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{verification.installation_nom}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {verification.etablissement_nom || verification.groupement_nom}
        </p>
      </div>
      <VerificationStatusBadge statut={verification.statut_alerte} />
    </div>
  );
}

// ============================================
// Page Dashboard
// ============================================

export default function DashboardPage() {
  const { profile } = useAuth();
  const [newAlertes, setNewAlertes] = useState<Alerte[]>([]);

  // Données
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useDashboardKPIs();
  const { data: prescriptionsUrgentes, isLoading: loadingPrescriptions } = usePrescriptions({
    statut: ['nouveau', 'en_cours'],
    priorite: ['urgent', 'haute'],
  });
  const { data: commissions, isLoading: loadingCommissions } = useCommissionsAPreparer();
  const { data: verifications, isLoading: loadingVerifications } = useVerificationsAlertes();
  const { data: visitesJour } = useVisitesDuJour(profile?.id || '');

  // Écoute temps réel des alertes
  useRealtimeAlertes((alerte) => {
    setNewAlertes((prev) => [alerte, ...prev].slice(0, 5));
  });

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {profile?.prenom} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Voici le résumé de votre activité pour aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetchKpis()}>
            Actualiser
          </Button>
          {profile?.role === 'preventionniste' && (
            <Button variant="primary" size="sm" icon={Plus}>
              Nouvelle visite
            </Button>
          )}
        </div>
      </div>

      {/* Alertes temps réel */}
      {newAlertes.length > 0 && (
        <AlertBanner type="warning" title="Nouvelles alertes">
          {newAlertes.length} nouvelle(s) alerte(s) reçue(s)
        </AlertBanner>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingKpis ? (
          <>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </>
        ) : (
          <>
            <KPICard
              title="Prescriptions urgentes"
              value={kpis?.prescriptions_urgentes || 0}
              subtitle={`${kpis?.prescriptions_en_cours || 0} en cours au total`}
              icon={ClipboardList}
              variant={kpis?.prescriptions_urgentes > 0 ? 'danger' : 'default'}
              href="/prescriptions?statut=urgent"
            />
            <KPICard
              title="Commissions à préparer"
              value={kpis?.commissions_a_preparer || 0}
              subtitle="Dans les 45 prochains jours"
              icon={Shield}
              variant={kpis?.commissions_a_preparer > 3 ? 'warning' : 'default'}
              href="/commissions?a_preparer=true"
            />
            <KPICard
              title="Vérifications en retard"
              value={kpis?.verifications_retard || 0}
              subtitle={`${kpis?.verifications_a_prevoir || 0} à prévoir`}
              icon={Wrench}
              variant={kpis?.verifications_retard > 0 ? 'danger' : 'success'}
              href="/verifications?statut=retard"
            />
            <KPICard
              title="Visites ce mois"
              value={kpis?.visites_mois || 0}
              subtitle={`${kpis?.prescriptions_levees_mois || 0} prescriptions levées`}
              icon={FileCheck}
              variant="success"
              trend={{
                value: 12,
                label: 'vs mois dernier',
                isPositive: true,
              }}
            />
          </>
        )}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescriptions urgentes */}
        <Card
          title="Prescriptions prioritaires"
          subtitle="À traiter en priorité"
          actions={
            <Link href="/prescriptions" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Voir tout
            </Link>
          }
          padding="none"
          className="lg:col-span-2"
        >
          {loadingPrescriptions ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : prescriptionsUrgentes && prescriptionsUrgentes.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {prescriptionsUrgentes.slice(0, 5).map((prescription) => (
                <PrescriptionRow key={prescription.id} prescription={prescription} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Aucune prescription urgente"
              description="Toutes les prescriptions prioritaires ont été traitées."
              className="py-8"
            />
          )}
        </Card>

        {/* Commissions à venir */}
        <Card
          title="Commissions à préparer"
          subtitle="Prochaines échéances"
          actions={
            <Link href="/commissions" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Voir tout
            </Link>
          }
          padding="none"
        >
          {loadingCommissions ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : commissions && commissions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {commissions.slice(0, 5).map((commission) => (
                <CommissionRow key={commission.id} commission={commission} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Aucune commission proche"
              description="Pas de commission prévue dans les 45 jours."
              className="py-8"
            />
          )}
        </Card>
      </div>

      {/* Vérifications et activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vérifications en alerte */}
        <Card
          title="Vérifications techniques"
          subtitle="Échéances proches ou dépassées"
          actions={
            <Link href="/verifications" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Voir tout
            </Link>
          }
          padding="none"
        >
          {loadingVerifications ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : verifications && verifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {verifications.slice(0, 5).map((verification) => (
                <VerificationRow key={verification.id} verification={verification} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Toutes les vérifications à jour"
              description="Aucune vérification en retard ou à prévoir."
              className="py-8"
            />
          )}
        </Card>

        {/* Visites du jour (pour préventionnistes) */}
        {profile?.role === 'preventionniste' && (
          <Card
            title="Vos visites aujourd'hui"
            subtitle={`${visitesJour?.length || 0} visite(s) planifiée(s)`}
            actions={
              <Link href="/planning" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Voir planning
              </Link>
            }
            padding="none"
          >
            {visitesJour && visitesJour.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {visitesJour.map((visite) => (
                  <Link
                    key={visite.id}
                    href={`/visites/${visite.id}`}
                    className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {visite.etablissement?.nom_commercial || visite.groupement?.nom}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {visite.heure_debut} - {visite.etablissement?.ville}
                      </p>
                    </div>
                    <Badge
                      variant={
                        visite.statut === 'terminee'
                          ? 'success'
                          : visite.statut === 'en_cours'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {visite.statut === 'terminee'
                        ? 'Terminée'
                        : visite.statut === 'en_cours'
                        ? 'En cours'
                        : 'Planifiée'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="Pas de visite prévue"
                description="Aucune visite planifiée pour aujourd'hui."
                action={{
                  label: 'Planifier une visite',
                  href: '/visites/nouvelle',
                }}
                className="py-8"
              />
            )}
          </Card>
        )}

        {/* Accès rapides (pour secrétariat/admin) */}
        {(profile?.role === 'admin' || profile?.role === 'secretariat') && (
          <Card title="Accès rapides" subtitle="Actions fréquentes">
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/prescriptions/nouvelle"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <ClipboardList className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Nouvelle prescription</span>
              </Link>
              <Link
                href="/commissions/nouvelle"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <Shield className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Nouvelle commission</span>
              </Link>
              <Link
                href="/commandes/nouvelle"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <FileCheck className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Commander intervention</span>
              </Link>
              <Link
                href="/rapports"
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
              >
                <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">Générer rapport</span>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
