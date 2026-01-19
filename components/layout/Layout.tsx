'use client';

// ============================================
// PREV'HUB - Layout Principal
// ============================================

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useAlertesCount, useNotifications, useRealtimeNotifications } from '@/hooks/use-data';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  FileText,
  MapPin,
  Shield,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
  roles?: string[];
}

interface LayoutProps {
  children: ReactNode;
}

// ============================================
// Configuration Navigation
// ============================================

const navigationItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Alertes',
    href: '/alertes',
    icon: AlertTriangle,
  },
  {
    label: 'Groupements',
    href: '/groupements',
    icon: Building2,
  },
  {
    label: 'Établissements',
    href: '/etablissements',
    icon: MapPin,
  },
  {
    label: 'Commissions',
    href: '/commissions',
    icon: Shield,
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: ClipboardList,
  },
  {
    label: 'Visites',
    href: '/visites',
    icon: FileCheck,
    roles: ['admin', 'secretariat', 'preventionniste'],
  },
  {
    label: 'Planning',
    href: '/planning',
    icon: Calendar,
    roles: ['admin', 'secretariat', 'preventionniste'],
  },
  {
    label: 'Vérifications',
    href: '/verifications',
    icon: Wrench,
  },
  {
    label: 'Prestataires',
    href: '/prestataires',
    icon: Users,
  },
  {
    label: 'Rapports',
    href: '/rapports',
    icon: FileText,
    roles: ['admin', 'secretariat'],
  },
  {
    label: 'Terrain (PRÉV\'FIELD)',
    href: '/field',
    icon: MapPin,
    roles: ['admin', 'preventionniste'],
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  },
];

// ============================================
// Composant Sidebar
// ============================================

function Sidebar({ 
  isOpen, 
  onClose,
  isMobile 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  isMobile: boolean;
}) {
  const pathname = usePathname();
  const { profile, hasRole } = useAuth();
  const { data: alertesCount } = useAlertesCount();

  const filteredNav = navigationItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role as any));
  });

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-gray-900">Prev'Hub</span>
          </Link>
          {isMobile && (
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-orange-500' : 'text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                {item.label === 'Prescriptions' && alertesCount && alertesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                    {alertesCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {profile?.prenom?.[0]}{profile?.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.prenom} {profile?.nom}
              </p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================
// Composant Header
// ============================================

function Header({ 
  onMenuClick,
  isMobile 
}: { 
  onMenuClick: () => void;
  isMobile: boolean;
}) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: notifications, refetch: refetchNotifications } = useNotifications();
  const { data: alertesCount } = useAlertesCount();

  // Temps réel notifications
  useRealtimeNotifications(profile?.id || '', () => {
    refetchNotifications();
  });

  const unreadCount = notifications?.filter(n => !n.lue).length || 0;

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search */}
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Alertes rapides */}
        {alertesCount && alertesCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{alertesCount} alerte{alertesCount > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notifications */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer',
                        !notif.lue && 'bg-blue-50'
                      )}
                    >
                      <p className="text-sm font-medium text-gray-900">{notif.titre}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Aucune notification
                  </div>
                )}
              </div>
              <Link
                href="/notifications"
                className="block p-3 text-center text-sm text-orange-600 hover:bg-gray-50 border-t border-gray-100"
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-orange-600">
                {profile?.prenom?.[0]}{profile?.nom?.[0]}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown user */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{profile?.prenom} {profile?.nom}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/parametres/profil"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                  Paramètres
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}

// ============================================
// Composant Layout Principal
// ============================================

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fermer sidebar au changement de route sur mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Redirection si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith('/auth')) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Pages publiques (auth)
  if (pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          isMobile={isMobile}
        />

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export { Sidebar, Header };
