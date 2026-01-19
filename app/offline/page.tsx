// ============================================
// PREV'HUB - Page Hors-ligne
// ============================================

import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-orange-600" />
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-gray-600 mb-8">
          Vérifiez votre connexion internet et réessayez.
          Certaines fonctionnalités restent disponibles en mode hors ligne.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl text-left">
          <h3 className="font-medium text-blue-900 mb-2">Fonctionnalités hors ligne :</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Consulter les visites en cache</li>
            <li>• Créer des observations (sync automatique)</li>
            <li>• Prendre des photos pour les rapports</li>
            <li>• Consulter les données téléchargées</li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">
          Prev'Hub v1.0 • PRÉVÉRIS
        </p>
      </div>
    </div>
  );
}
