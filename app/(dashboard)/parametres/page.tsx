'use client';

// ============================================
// PREV'HUB - Page Paramètres
// ============================================

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  AlertBanner,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Check,
  X,
  AlertTriangle,
  LogOut,
  Building2,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'security';

// ============================================
// Composants internes
// ============================================

function SettingsNav({
  activeSection,
  onChange,
}: {
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const sections = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Apparence', icon: Palette },
    { id: 'security' as const, label: 'Sécurité', icon: Shield },
  ];

  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onChange(section.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
            activeSection === section.id
              ? 'bg-orange-50 text-orange-600'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          <section.icon className="w-5 h-5" />
          <span className="font-medium">{section.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileSettings() {
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: profile?.prenom || '',
    nom: profile?.nom || '',
    telephone: profile?.telephone || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Informations personnelles">
        <div className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-orange-600">
                {profile?.prenom?.[0]}{profile?.nom?.[0]}
              </span>
            </div>
            <div>
              <Button variant="outline" size="sm">
                Changer la photo
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG max 2 Mo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contactez l'administrateur pour modifier votre email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="06 XX XX XX XX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        </div>
      </Card>

      <Card title="Informations professionnelles">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  profile?.role === 'admin' ? 'danger' :
                  profile?.role === 'preventionniste' ? 'warning' : 'info'
                }
              >
                {profile?.role === 'admin' && 'Administrateur'}
                {profile?.role === 'secretariat' && 'Secrétariat'}
                {profile?.role === 'preventionniste' && 'Préventionniste'}
                {profile?.role === 'client' && 'Client'}
                {profile?.role === 'exploitant' && 'Exploitant'}
              </Badge>
            </div>
          </div>

          {profile?.societe && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Société
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{profile.societe.raison_sociale}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  const { profile, updateProfile } = useAuth();
  const [preferences, setPreferences] = useState(profile?.preferences?.notifications || {
    email_alertes: true,
    email_recap_hebdo: true,
    push_alertes: true,
    push_prescriptions: true,
    sms_urgences: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        preferences: {
          ...profile?.preferences,
          notifications: preferences,
        },
      });
      toast.success('Préférences mises à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePreference = (key: string) => {
    setPreferences({ ...preferences, [key]: !preferences[key as keyof typeof preferences] });
  };

  return (
    <div className="space-y-6">
      <Card title="Notifications par email">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Alertes importantes</p>
              <p className="text-sm text-gray-500">Prescriptions urgentes, commissions à préparer</p>
            </div>
            <button
              onClick={() => togglePreference('email_alertes')}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                preferences.email_alertes ? 'bg-orange-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  preferences.email_alertes ? 'right-1' : 'left-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Récapitulatif hebdomadaire</p>
              <p className="text-sm text-gray-500">Résumé de l'activité chaque lundi</p>
            </div>
            <button
              onClick={() => togglePreference('email_recap_hebdo')}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                preferences.email_recap_hebdo ? 'bg-orange-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  preferences.email_recap_hebdo ? 'right-1' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card title="Notifications push">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Alertes en temps réel</p>
              <p className="text-sm text-gray-500">Notifications instantanées sur votre navigateur</p>
            </div>
            <button
              onClick={() => togglePreference('push_alertes')}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                preferences.push_alertes ? 'bg-orange-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  preferences.push_alertes ? 'right-1' : 'left-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Mises à jour prescriptions</p>
              <p className="text-sm text-gray-500">Changements de statut des prescriptions</p>
            </div>
            <button
              onClick={() => togglePreference('push_prescriptions')}
              className={cn(
                'w-12 h-6 rounded-full transition-colors relative',
                preferences.push_prescriptions ? 'bg-orange-500' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  preferences.push_prescriptions ? 'right-1' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card title="SMS (urgences uniquement)">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Alertes SMS critiques</p>
            <p className="text-sm text-gray-500">Uniquement pour les situations d'urgence absolue</p>
          </div>
          <button
            onClick={() => togglePreference('sms_urgences')}
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              preferences.sms_urgences ? 'bg-orange-500' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                preferences.sms_urgences ? 'right-1' : 'left-1'
              )}
            />
          </button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" icon={Save} loading={isLoading} onClick={handleSave}>
          Enregistrer les préférences
        </Button>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { profile, updateProfile } = useAuth();
  const [theme, setTheme] = useState(profile?.preferences?.theme || 'light');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        preferences: {
          ...profile?.preferences,
          theme,
        },
      });
      toast.success('Thème mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Thème">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Clair', icon: Sun },
            { id: 'dark', label: 'Sombre', icon: Moon },
            { id: 'system', label: 'Système', icon: Globe },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={cn(
                'p-4 rounded-xl border-2 transition-colors text-center',
                theme === option.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <option.icon className={cn(
                'w-8 h-8 mx-auto mb-2',
                theme === option.id ? 'text-orange-600' : 'text-gray-400'
              )} />
              <p className={cn(
                'font-medium',
                theme === option.id ? 'text-orange-600' : 'text-gray-900'
              )}>
                {option.label}
              </p>
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Le thème sombre sera bientôt disponible
        </p>
      </Card>

      <Card title="Langue">
        <select
          defaultValue="fr"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="en" disabled>🇬🇧 English (bientôt)</option>
        </select>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" icon={Save} loading={isLoading} onClick={handleSave}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const { signOut, resetPassword, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      await resetPassword(user.email);
      toast.success('Email de réinitialisation envoyé');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Mot de passe">
        <p className="text-gray-600 mb-4">
          Pour changer votre mot de passe, cliquez sur le bouton ci-dessous. 
          Vous recevrez un email avec un lien de réinitialisation.
        </p>
        <Button
          variant="outline"
          icon={Key}
          loading={isLoading}
          onClick={handlePasswordReset}
        >
          Réinitialiser mon mot de passe
        </Button>
      </Card>

      <Card title="Sessions actives">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-800">Session actuelle</p>
            <p className="text-sm text-green-600">Connecté maintenant</p>
          </div>
        </div>
      </Card>

      <Card title="Déconnexion">
        <AlertBanner type="warning">
          La déconnexion vous redirigera vers la page de connexion. 
          Toutes vos données non sauvegardées seront perdues.
        </AlertBanner>
        <div className="mt-4">
          <Button variant="danger" icon={LogOut} onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// Page principale
// ============================================

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        subtitle="Gérez vos préférences et votre compte"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <SettingsNav activeSection={activeSection} onChange={setActiveSection} />
        </Card>

        {/* Contenu */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && <ProfileSettings />}
          {activeSection === 'notifications' && <NotificationSettings />}
          {activeSection === 'appearance' && <AppearanceSettings />}
          {activeSection === 'security' && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}
