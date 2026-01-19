'use client';

// ============================================
// PREV'HUB - Application Providers
// ============================================

import { ReactNode, useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Éviter le flash de contenu non hydraté
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            padding: '1rem',
          },
          className: 'shadow-lg',
        }}
      />
    </AuthProvider>
  );
}

export default Providers;
