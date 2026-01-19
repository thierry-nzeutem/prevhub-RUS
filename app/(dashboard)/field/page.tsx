'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Mobile App
// Page principale pour les préventionnistes terrain
// ============================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useVisites } from '@/hooks/use-visites';
import { cn, formatDate } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Clock,
  Camera,
  FileText,
  CheckCircle2,
  Play,
  ChevronRight,
  Navigation,
  WifiOff,
  Wifi,
  RefreshCw,
  Building2,
  AlertTriangle,
  Plus,
  Clipboard,
  User,
  Settings,
  Home,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface VisiteTerrainProps {
  visite: {
    id: string;
    date: string;
    heure_debut: string;
    statut: string;
    etablissement?: {
      id: string;
      nom_commercial: string;
      adresse: string;
      ville: string;
      type_erp: string;
      categorie_erp: number;
    };
    groupement?: {
      nom: string;
    };
  };
}

// ============================================
// Composants
// ============================================

function VisiteCard({ visite }: VisiteTerrainProps) {
  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'planifiee':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planifiée' };
      case 'en_cours':
        return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En cours' };
      case 'terminee':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Terminée' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: statut };
    }
  };

  const style = getStatutStyle(visite.statut);

  return (
    <Link
      href={`/field/visite/${visite.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-4 shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', style.bg, style.text)}>
              {style.label}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {visite.heure_debut}
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1">
            {visite.etablissement?.nom_commercial || 'Établissement'}
          </h3>

          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {visite.etablissement?.adresse}, {visite.etablissement?.ville}
          </p>

          {visite.groupement && (
            <p className="text-xs text-gray-400 mt-1">
              {visite.groupement.nom}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {visite.etablissement?.categorie_erp && (
            <span className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white',
              visite.etablissement.categorie_erp === 1 ? 'bg-red-500' :
              visite.etablissement.categorie_erp === 2 ? 'bg-orange-500' :
              visite.etablissement.categorie_erp === 3 ? 'bg-yellow-500' :
              visite.etablissement.categorie_erp === 4 ? 'bg-blue-500' :
              'bg-green-500'
            )}>
              {visite.etablissement.categorie_erp}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {visite.statut === 'planifiee' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">
            <Play className="w-4 h-4" />
            Démarrer
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">
            <Navigation className="w-4 h-4" />
            Itinéraire
          </button>
        </div>
      )}
    </Link>
  );
}

function QuickAction({ 
  icon: Icon, 
  label, 
  href, 
  color = 'orange' 
}: { 
  icon: any; 
  label: string; 
  href: string;
  color?: string;
}) {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-200 active:scale-95 transition-transform"
    >
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color as keyof typeof colorClasses])}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
    </Link>
  );
}

// ============================================
// Page principale
// ============================================

export default function PrevFieldPage() {
  const { user, profile } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [date, setDate] = useState(new Date());

  // Récupérer les visites du jour
  const { data: visites, isLoading, refetch } = useVisites({
    date: date.toISOString().split('T')[0],
    preventionniste_id: user?.id,
  });

  // Détecter le statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const visitesAujourdhui = visites || [];
  const visitesEnCours = visitesAujourdhui.filter(v => v.statut === 'en_cours');
  const visitesPlanifiees = visitesAujourdhui.filter(v => v.statut === 'planifiee');
  const visitesTerminees = visitesAujourdhui.filter(v => v.statut === 'terminee');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 pt-12 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">Bonjour,</p>
            <h1 className="text-xl font-bold">
              {profile?.prenom || 'Préventionniste'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-600/50 rounded-lg">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs">Hors ligne</span>
              </div>
            )}
            <button
              onClick={() => refetch()}
              className="p-2 bg-white/10 rounded-xl"
            >
              <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-orange-100">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {date.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </span>
        </div>

        {/* Stats du jour */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{visitesPlanifiees.length}</p>
            <p className="text-xs text-orange-100">Planifiées</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{visitesEnCours.length}</p>
            <p className="text-xs text-orange-100">En cours</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{visitesTerminees.length}</p>
            <p className="text-xs text-orange-100">Terminées</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-4 gap-3">
          <QuickAction
            icon={Camera}
            label="Photo"
            href="/field/photo"
            color="orange"
          />
          <QuickAction
            icon={Clipboard}
            label="Observation"
            href="/field/observation"
            color="blue"
          />
          <QuickAction
            icon={AlertTriangle}
            label="Prescription"
            href="/field/prescription"
            color="purple"
          />
          <QuickAction
            icon={FileText}
            label="Rapport"
            href="/field/rapport"
            color="green"
          />
        </div>
      </div>

      {/* Visite en cours */}
      {visitesEnCours.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Visite en cours
          </h2>
          <div className="space-y-3">
            {visitesEnCours.map((visite) => (
              <VisiteCard key={visite.id} visite={visite} />
            ))}
          </div>
        </div>
      )}

      {/* Visites planifiées */}
      {visitesPlanifiees.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Prochaines visites
          </h2>
          <div className="space-y-3">
            {visitesPlanifiees.map((visite) => (
              <VisiteCard key={visite.id} visite={visite} />
            ))}
          </div>
        </div>
      )}

      {/* Visites terminées */}
      {visitesTerminees.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Terminées aujourd'hui
          </h2>
          <div className="space-y-3">
            {visitesTerminees.map((visite) => (
              <VisiteCard key={visite.id} visite={visite} />
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {visitesAujourdhui.length === 0 && !isLoading && (
        <div className="px-4 mt-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Aucune visite programmée</p>
          <p className="text-sm text-gray-400 mt-1">Profitez de votre journée !</p>
        </div>
      )}

      {/* Navigation mobile bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <Link
            href="/field"
            className="flex flex-col items-center gap-1 p-2 text-orange-600"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Accueil</span>
          </Link>
          <Link
            href="/field/planning"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs">Planning</span>
          </Link>
          <Link
            href="/field/photo"
            className="flex flex-col items-center justify-center -mt-4"
          >
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </Link>
          <Link
            href="/field/etablissements"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Building2 className="w-6 h-6" />
            <span className="text-xs">Sites</span>
          </Link>
          <Link
            href="/field/profil"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
