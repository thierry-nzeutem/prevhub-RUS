'use client';

// ============================================
// PREV'HUB - PRÉV'FIELD Profil
// Page profil et paramètres pour préventionnistes
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Settings,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Download,
  Trash2,
  HelpCircle,
  FileText,
  Lock,
  Home,
  Calendar,
  Building2,
  WifiOff,
  Database,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface MenuItem {
  icon: any;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

// ============================================
// Composants
// ============================================

function MenuSection({ 
  title, 
  items 
}: { 
  title: string; 
  items: MenuItem[];
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
        {title}
      </h3>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {items.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <div className="flex items-center gap-4 px-4 py-3.5">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                item.danger ? 'bg-red-100' : 'bg-gray-100'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  item.danger ? 'text-red-500' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium',
                  item.danger ? 'text-red-600' : 'text-gray-900'
                )}>
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-sm text-gray-500">{item.description}</p>
                )}
              </div>
              {item.rightElement || (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link key={index} href={item.href} className="block hover:bg-gray-50">
                {content}
              </Link>
            );
          }

          if (item.onClick) {
            return (
              <button key={index} onClick={item.onClick} className="w-full text-left hover:bg-gray-50">
                {content}
              </button>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
}

function ToggleSwitch({ 
  enabled, 
  onToggle 
}: { 
  enabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        enabled ? 'bg-orange-500' : 'bg-gray-200'
      )}
    >
      <div className={cn(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
        enabled ? 'translate-x-5.5 left-0.5' : 'left-0.5'
      )} />
    </button>
  );
}

// ============================================
// Page principale
// ============================================

export default function FieldProfilPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simuler une synchronisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  const handleClearCache = async () => {
    if (confirm('Voulez-vous vraiment vider le cache ? Les données non synchronisées seront perdues.')) {
      // Clear IndexedDB
      const dbs = await indexedDB.databases();
      dbs.forEach(db => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
      alert('Cache vidé avec succès');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-12 pb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {profile?.prenom?.[0]}{profile?.nom?.[0]}
                </span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              {profile?.prenom} {profile?.nom}
            </h1>
            <p className="text-orange-100 text-sm capitalize">
              {profile?.role || 'Préventionniste'}
            </p>
            <p className="text-orange-200 text-sm mt-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 -mt-4">
        {/* Statistiques rapides */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Ce mois-ci</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">12</p>
              <p className="text-xs text-gray-500">Visites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">8</p>
              <p className="text-xs text-gray-500">Terminées</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">24</p>
              <p className="text-xs text-gray-500">Prescriptions</p>
            </div>
          </div>
        </div>

        {/* Mon compte */}
        <MenuSection
          title="Mon compte"
          items={[
            {
              icon: User,
              label: 'Informations personnelles',
              href: '/parametres/profil',
            },
            {
              icon: Lock,
              label: 'Mot de passe',
              href: '/parametres/securite',
            },
            {
              icon: Phone,
              label: profile?.telephone || 'Ajouter un téléphone',
              description: profile?.telephone ? 'Téléphone professionnel' : undefined,
              href: '/parametres/profil',
            },
          ]}
        />

        {/* Préférences */}
        <MenuSection
          title="Préférences"
          items={[
            {
              icon: Bell,
              label: 'Notifications',
              description: notificationsEnabled ? 'Activées' : 'Désactivées',
              onClick: () => setNotificationsEnabled(!notificationsEnabled),
              rightElement: (
                <ToggleSwitch
                  enabled={notificationsEnabled}
                  onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
                />
              ),
            },
            {
              icon: isDarkMode ? Moon : Sun,
              label: 'Mode sombre',
              description: isDarkMode ? 'Activé' : 'Désactivé',
              onClick: () => setIsDarkMode(!isDarkMode),
              rightElement: (
                <ToggleSwitch
                  enabled={isDarkMode}
                  onToggle={() => setIsDarkMode(!isDarkMode)}
                />
              ),
            },
            {
              icon: WifiOff,
              label: 'Mode hors-ligne',
              description: offlineMode ? 'Activé (données locales)' : 'Désactivé',
              onClick: () => setOfflineMode(!offlineMode),
              rightElement: (
                <ToggleSwitch
                  enabled={offlineMode}
                  onToggle={() => setOfflineMode(!offlineMode)}
                />
              ),
            },
          ]}
        />

        {/* Données */}
        <MenuSection
          title="Données"
          items={[
            {
              icon: RefreshCw,
              label: 'Synchroniser',
              description: 'Synchroniser les données avec le serveur',
              onClick: handleSync,
              rightElement: isSyncing ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : undefined,
            },
            {
              icon: Database,
              label: 'Stockage local',
              description: 'Gérer le cache et les données hors-ligne',
              href: '/parametres/stockage',
            },
            {
              icon: Trash2,
              label: 'Vider le cache',
              description: 'Supprimer les données locales',
              onClick: handleClearCache,
              danger: true,
            },
          ]}
        />

        {/* Application */}
        <MenuSection
          title="Application"
          items={[
            {
              icon: Smartphone,
              label: 'Installer l\'application',
              description: 'Ajouter à l\'écran d\'accueil',
              onClick: () => {
                // PWA install prompt
                alert('Pour installer, utilisez le menu de votre navigateur > Ajouter à l\'écran d\'accueil');
              },
            },
            {
              icon: Shield,
              label: 'Politique de confidentialité',
              href: '/legal/privacy',
            },
            {
              icon: FileText,
              label: 'Conditions d\'utilisation',
              href: '/legal/terms',
            },
            {
              icon: HelpCircle,
              label: 'Aide & Support',
              href: '/support',
            },
          ]}
        />

        {/* Déconnexion */}
        <MenuSection
          title=""
          items={[
            {
              icon: LogOut,
              label: 'Déconnexion',
              onClick: handleSignOut,
              danger: true,
            },
          ]}
        />

        {/* Version */}
        <p className="text-center text-xs text-gray-400 mt-4 mb-8">
          PREV'HUB v1.0.0 • PRÉV'FIELD
        </p>
      </div>

      {/* Navigation mobile bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          <Link
            href="/field"
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Accueil</span>
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
            className="flex flex-col items-center gap-1 p-2 text-orange-600"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
