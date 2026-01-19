// ============================================
// PREV'HUB - Service de Synchronisation Offline
// ============================================

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================
// Types
// ============================================

interface PrevHubDB extends DBSchema {
  'pending-actions': {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: string;
      data: any;
      timestamp: number;
      retries: number;
      lastError?: string;
    };
    indexes: { 'by-timestamp': number };
  };
  'cached-visites': {
    key: string;
    value: {
      id: string;
      data: any;
      cachedAt: number;
    };
  };
  'cached-etablissements': {
    key: string;
    value: {
      id: string;
      data: any;
      cachedAt: number;
    };
  };
  'cached-prescriptions': {
    key: string;
    value: {
      id: string;
      data: any;
      cachedAt: number;
    };
  };
  'pending-photos': {
    key: string;
    value: {
      id: string;
      dataUrl: string;
      entity_type: string;
      entity_id: string;
      type: string;
      location?: {
        latitude: number;
        longitude: number;
        accuracy: number;
      };
      timestamp: number;
    };
    indexes: { 'by-entity': string };
  };
}

// ============================================
// Service
// ============================================

class OfflineSyncService {
  private db: IDBPDatabase<PrevHubDB> | null = null;
  private syncInProgress = false;

  async init() {
    if (this.db) return;

    this.db = await openDB<PrevHubDB>('prevhub-offline', 1, {
      upgrade(db) {
        // Store pour les actions en attente
        const pendingStore = db.createObjectStore('pending-actions', {
          keyPath: 'id',
        });
        pendingStore.createIndex('by-timestamp', 'timestamp');

        // Stores pour le cache
        db.createObjectStore('cached-visites', { keyPath: 'id' });
        db.createObjectStore('cached-etablissements', { keyPath: 'id' });
        db.createObjectStore('cached-prescriptions', { keyPath: 'id' });

        // Store pour les photos en attente
        const photosStore = db.createObjectStore('pending-photos', {
          keyPath: 'id',
        });
        photosStore.createIndex('by-entity', 'entity_id');
      },
    });

    // Écouter les événements de connexion
    window.addEventListener('online', () => this.syncPendingActions());
  }

  // ============================================
  // Actions en attente
  // ============================================

  async queueAction(type: 'create' | 'update' | 'delete', entity: string, data: any) {
    await this.init();
    if (!this.db) return;

    const action = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    await this.db.put('pending-actions', action);

    // Tenter la sync si en ligne
    if (navigator.onLine) {
      this.syncPendingActions();
    }

    return action.id;
  }

  async getPendingActions() {
    await this.init();
    if (!this.db) return [];

    return this.db.getAllFromIndex('pending-actions', 'by-timestamp');
  }

  async removePendingAction(id: string) {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pending-actions', id);
  }

  async syncPendingActions() {
    if (this.syncInProgress || !navigator.onLine) return;

    this.syncInProgress = true;

    try {
      await this.init();
      if (!this.db) return;

      const actions = await this.getPendingActions();

      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.removePendingAction(action.id);
        } catch (error) {
          // Mettre à jour le compteur de retries
          action.retries += 1;
          action.lastError = error instanceof Error ? error.message : 'Unknown error';

          // Abandonner après 5 tentatives
          if (action.retries >= 5) {
            console.error('Action abandonnée après 5 tentatives:', action);
            await this.removePendingAction(action.id);
          } else {
            await this.db.put('pending-actions', action);
          }
        }
      }

      // Synchroniser les photos en attente
      await this.syncPendingPhotos();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeAction(action: { type: string; entity: string; data: any }) {
    const endpoint = `/api/${action.entity}`;
    
    let method: string;
    let body: any = action.data;

    switch (action.type) {
      case 'create':
        method = 'POST';
        break;
      case 'update':
        method = 'PATCH';
        break;
      case 'delete':
        method = 'DELETE';
        body = undefined;
        break;
      default:
        throw new Error(`Type d'action inconnu: ${action.type}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur synchronisation');
    }

    return response.json();
  }

  // ============================================
  // Cache des données
  // ============================================

  async cacheVisite(visite: any) {
    await this.init();
    if (!this.db) return;

    await this.db.put('cached-visites', {
      id: visite.id,
      data: visite,
      cachedAt: Date.now(),
    });
  }

  async getCachedVisite(id: string) {
    await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('cached-visites', id);
    return cached?.data || null;
  }

  async getAllCachedVisites() {
    await this.init();
    if (!this.db) return [];

    const all = await this.db.getAll('cached-visites');
    return all.map((item) => item.data);
  }

  async cacheEtablissement(etablissement: any) {
    await this.init();
    if (!this.db) return;

    await this.db.put('cached-etablissements', {
      id: etablissement.id,
      data: etablissement,
      cachedAt: Date.now(),
    });
  }

  async getCachedEtablissement(id: string) {
    await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('cached-etablissements', id);
    return cached?.data || null;
  }

  async cachePrescription(prescription: any) {
    await this.init();
    if (!this.db) return;

    await this.db.put('cached-prescriptions', {
      id: prescription.id,
      data: prescription,
      cachedAt: Date.now(),
    });
  }

  async getCachedPrescription(id: string) {
    await this.init();
    if (!this.db) return null;

    const cached = await this.db.get('cached-prescriptions', id);
    return cached?.data || null;
  }

  // ============================================
  // Photos en attente
  // ============================================

  async queuePhoto(photo: {
    dataUrl: string;
    entity_type: string;
    entity_id: string;
    type: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  }) {
    await this.init();
    if (!this.db) return;

    const pendingPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...photo,
      timestamp: Date.now(),
    };

    await this.db.put('pending-photos', pendingPhoto);

    // Tenter la sync si en ligne
    if (navigator.onLine) {
      this.syncPendingPhotos();
    }

    return pendingPhoto.id;
  }

  async getPendingPhotos(entityId?: string) {
    await this.init();
    if (!this.db) return [];

    if (entityId) {
      return this.db.getAllFromIndex('pending-photos', 'by-entity', entityId);
    }

    return this.db.getAll('pending-photos');
  }

  async removePendingPhoto(id: string) {
    await this.init();
    if (!this.db) return;

    await this.db.delete('pending-photos', id);
  }

  private async syncPendingPhotos() {
    await this.init();
    if (!this.db) return;

    const photos = await this.getPendingPhotos();

    for (const photo of photos) {
      try {
        // Convertir dataUrl en Blob
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `photo-${photo.id}.jpg`, { type: 'image/jpeg' });

        // Upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'photos');
        formData.append('entite_type', photo.entity_type);
        formData.append('entite_id', photo.entity_id);
        formData.append('description', `Photo ${photo.type}`);

        const uploadResponse = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          await this.removePendingPhoto(photo.id);
        }
      } catch (error) {
        console.error('Erreur sync photo:', error);
      }
    }
  }

  // ============================================
  // Nettoyage
  // ============================================

  async clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000) {
    await this.init();
    if (!this.db) return;

    const now = Date.now();

    // Nettoyer les visites
    const visites = await this.db.getAll('cached-visites');
    for (const visite of visites) {
      if (now - visite.cachedAt > maxAgeMs) {
        await this.db.delete('cached-visites', visite.id);
      }
    }

    // Nettoyer les établissements
    const etablissements = await this.db.getAll('cached-etablissements');
    for (const etab of etablissements) {
      if (now - etab.cachedAt > maxAgeMs) {
        await this.db.delete('cached-etablissements', etab.id);
      }
    }

    // Nettoyer les prescriptions
    const prescriptions = await this.db.getAll('cached-prescriptions');
    for (const presc of prescriptions) {
      if (now - presc.cachedAt > maxAgeMs) {
        await this.db.delete('cached-prescriptions', presc.id);
      }
    }
  }

  async clearAll() {
    await this.init();
    if (!this.db) return;

    await this.db.clear('pending-actions');
    await this.db.clear('cached-visites');
    await this.db.clear('cached-etablissements');
    await this.db.clear('cached-prescriptions');
    await this.db.clear('pending-photos');
  }

  // ============================================
  // Stats
  // ============================================

  async getStats() {
    await this.init();
    if (!this.db) return null;

    const [
      pendingActions,
      pendingPhotos,
      cachedVisites,
      cachedEtablissements,
      cachedPrescriptions,
    ] = await Promise.all([
      this.db.count('pending-actions'),
      this.db.count('pending-photos'),
      this.db.count('cached-visites'),
      this.db.count('cached-etablissements'),
      this.db.count('cached-prescriptions'),
    ]);

    return {
      pendingActions,
      pendingPhotos,
      cachedVisites,
      cachedEtablissements,
      cachedPrescriptions,
    };
  }
}

// ============================================
// Export singleton
// ============================================

export const offlineSync = new OfflineSyncService();
export default offlineSync;
