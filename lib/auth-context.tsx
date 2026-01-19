'use client';

// ============================================
// PREV'HUB - Contexte d'Authentification
// ============================================

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { UserRole } from '@/types';

// ============================================
// Types
// ============================================

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  prenom: string;
  nom: string;
  telephone?: string;
  avatar_url?: string;
  societe_id?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications_email: boolean;
    notifications_sms: boolean;
    notifications_push: boolean;
    langue: string;
    timezone: string;
  };
  is_active: boolean;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  refreshProfile: () => Promise<void>;
}

// ============================================
// Contexte
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Charger le profil utilisateur
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Erreur fetchProfile:', error);
      return null;
    }
  }, [supabase]);

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user?.id, fetchProfile]);

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const profileData = await fetchProfile(initialSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          setProfile(profileData);

          // Mettre à jour last_login
          if (event === 'SIGNED_IN') {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', newSession.user.id);
          }
        } else {
          setProfile(null);
        }

        // Rediriger selon l'événement
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, router]);

  // Connexion email/password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Connexion Magic Link
  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Inscription
  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Réinitialiser mot de passe
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Mettre à jour mot de passe
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) {
      return { error: new Error('Non authentifié') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        await refreshProfile();
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Vérifier le rôle
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return rolesArray.includes(profile.role);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user && !!profile,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

// ============================================
// HOC de protection des routes
// ============================================

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, profile } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login');
      }

      if (!isLoading && isAuthenticated && allowedRoles && profile) {
        if (!allowedRoles.includes(profile.role)) {
          router.push('/unauthorized');
        }
      }
    }, [isLoading, isAuthenticated, profile, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// ============================================
// Exports
// ============================================

export default AuthProvider;
