// ============================================
// PREV'HUB - Client Supabase Sécurisé
// ============================================

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Validation des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises'
  );
}

// ============================================
// Client Browser (côté client)
// ============================================

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}

// Singleton pour le client browser
let browserClient: ReturnType<typeof createBrowserSupabaseClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

// ============================================
// Client Server (côté serveur - Server Components)
// ============================================

export function createServerSupabaseClient(cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: any) => void;
}) {
  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // Gérer les erreurs de cookies en lecture seule
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', options);
        } catch (error) {
          // Gérer les erreurs de cookies en lecture seule
        }
      },
    },
  });
}

// ============================================
// Client Admin (avec service role key)
// ============================================

export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY est requis pour le client admin');
  }

  return createSupabaseClient<Database>(supabaseUrl!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// Types exportés
// ============================================

export type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;
export type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

// ============================================
// Utilitaires Storage
// ============================================

export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  RAPPORTS: 'rapports',
  AVATARS: 'avatars',
} as const;

export function getPublicUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const client = getSupabaseBrowserClient();
  return client.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
    .then(({ data }) => data?.signedUrl || '');
}

// ============================================
// Export par défaut (legacy compatibility)
// ============================================

export const supabase = getSupabaseBrowserClient();
export default supabase;
