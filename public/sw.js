// ============================================
// PREV'HUB - Service Worker
// Mode hors-ligne et synchronisation
// ============================================

const CACHE_NAME = 'prevhub-v1';
const OFFLINE_URL = '/offline';

// Ressources à mettre en cache immédiatement
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Patterns d'URLs à mettre en cache dynamiquement
const CACHE_PATTERNS = [
  /\/_next\/static\/.*/,
  /\/api\/.*/, // Cache API responses
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:js|css)$/,
];

// ============================================
// Installation
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des ressources statiques');
      return cache.addAll(PRECACHE_URLS);
    })
  );

  // Forcer l'activation immédiate
  self.skipWaiting();
});

// ============================================
// Activation
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activation');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Prendre le contrôle immédiatement
  self.clients.claim();
});

// ============================================
// Fetch - Stratégie de cache
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers d'autres domaines (sauf Supabase)
  if (url.origin !== location.origin && !url.hostname.includes('supabase')) {
    return;
  }

  // Stratégie selon le type de ressource
  if (url.pathname.startsWith('/api/')) {
    // API: Network first, cache fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaticAsset(url.pathname)) {
    // Assets statiques: Cache first
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // Pages HTML: Stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// ============================================
// Stratégies de cache
// ============================================

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retourner une réponse d'erreur JSON pour les API
    return new Response(
      JSON.stringify({ error: 'Hors ligne', offline: true }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Ressource non disponible hors ligne', { status: 503 });
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => {
      // Si hors ligne et pas de cache, retourner la page offline
      return caches.match(OFFLINE_URL);
    });

  return cachedResponse || fetchPromise;
}

// ============================================
// Background Sync
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-observations') {
    event.waitUntil(syncObservations());
  }

  if (event.tag === 'sync-visites') {
    event.waitUntil(syncVisites());
  }
});

async function syncObservations() {
  try {
    // Récupérer les observations en attente depuis IndexedDB
    const db = await openDatabase();
    const pendingObservations = await getAllFromStore(db, 'pending-observations');

    for (const observation of pendingObservations) {
      try {
        const response = await fetch('/api/observations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(observation.data),
        });

        if (response.ok) {
          // Supprimer de la file d'attente
          await deleteFromStore(db, 'pending-observations', observation.id);
          console.log('[SW] Observation synchronisée:', observation.id);
        }
      } catch (error) {
        console.error('[SW] Erreur sync observation:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Erreur sync observations:', error);
  }
}

async function syncVisites() {
  try {
    const db = await openDatabase();
    const pendingVisites = await getAllFromStore(db, 'pending-visites');

    for (const visite of pendingVisites) {
      try {
        const response = await fetch('/api/visites', {
          method: visite.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visite.data),
        });

        if (response.ok) {
          await deleteFromStore(db, 'pending-visites', visite.id);
          console.log('[SW] Visite synchronisée:', visite.id);
        }
      } catch (error) {
        console.error('[SW] Erreur sync visite:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Erreur sync visites:', error);
  }
}

// ============================================
// Push Notifications
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push reçu');

  let data = { title: 'Prev\'Hub', body: 'Nouvelle notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'voir', title: 'Voir' },
      { action: 'fermer', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.action);

  event.notification.close();

  if (event.action === 'fermer') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ============================================
// Helpers
// ============================================

function isStaticAsset(pathname) {
  return CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('prevhub-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-observations')) {
        db.createObjectStore('pending-observations', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending-visites')) {
        db.createObjectStore('pending-visites', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
