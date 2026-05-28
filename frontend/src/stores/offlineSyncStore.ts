import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Dexie, { Table } from 'dexie';

// Dexie database for offline-first storage
export class OfflineDB extends Dexie {
  products!: Table;
  categories!: Table;
  transactions!: Table;

  constructor() {
    super('KasirDB');
    this.version(1).stores({
      products: '++id, sku, barcode, &tenant_id',
      categories: '++id, &tenant_id',
      transactions: '++id, status, &tenant_id, created_at',
    });
  }
}

export const db = new OfflineDB();

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: Date;
  pendingTransactions: number;
  syncError?: string;
  masterDataCached: boolean;
}

interface SyncActions {
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: Date) => void;
  setPendingTransactions: (count: number) => void;
  setSyncError: (error?: string) => void;
  setMasterDataCached: (cached: boolean) => void;
  pullMasterData: (tenantId: number) => Promise<void>;
  pushPendingTransactions: (tenantId: number, accessToken: string) => Promise<void>;
  retryFailedSync: (accessToken: string) => Promise<void>;
}

export const useOfflineSyncStore = create<SyncState & SyncActions>()(
  devtools((set, get) => {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => set({ isOnline: true }));
      window.addEventListener('offline', () => set({ isOnline: false }));
    }

    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncTime: undefined,
      pendingTransactions: 0,
      syncError: undefined,
      masterDataCached: false,

      setOnline: (online) => set({ isOnline: online }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setPendingTransactions: (count) => set({ pendingTransactions: count }),
      setSyncError: (error) => set({ syncError: error }),
      setMasterDataCached: (cached) => set({ masterDataCached: cached }),

      /**
       * Pull master data (products, categories) from server and cache in Dexie
       * Used on app startup and after network reconnection
       */
      pullMasterData: async (tenantId: number) => {
        set({ isSyncing: true, syncError: undefined });

        try {
          const response = await fetch('/api/v1/sync/master-data', {
            headers: {
              'X-Tenant-ID': String(tenantId),
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to pull master data: ${response.statusText}`);
          }

          const { data } = await response.json();

          // Store in Dexie for offline access
          await db.transaction('rw', db.products, db.categories, async () => {
            // Clear old data
            await db.products.clear();
            await db.categories.clear();

            // Store new data
            if (data.categories?.length > 0) {
              await db.categories.bulkAdd(data.categories);
            }
            if (data.products?.length > 0) {
              await db.products.bulkAdd(data.products);
            }
          });

          set({
            masterDataCached: true,
            lastSyncTime: new Date(),
            isSyncing: false,
          });
        } catch (error: any) {
          set({
            isSyncing: false,
            syncError: error.message,
          });
          throw error;
        }
      },

      /**
       * Push pending offline transactions to server
       * Called when network is available and transactions are pending
       */
      pushPendingTransactions: async (tenantId: number, accessToken: string) => {
        set({ isSyncing: true, syncError: undefined });

        try {
          const transactions = await db.transactions
            .where('status')
            .equals('PENDING_SYNC')
            .toArray();

          if (transactions.length === 0) {
            set({ isSyncing: false });
            return;
          }

          // Send in batches to prevent timeout
          const batchSize = 10;
          for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);

            const response = await fetch('/api/v1/sync/transactions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': String(tenantId),
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ transactions: batch }),
            });

            if (!response.ok) {
              throw new Error(`Failed to push transactions: ${response.statusText}`);
            }

            const { synced_ids } = await response.json();

            // Mark synced transactions as done
            await db.transactions.bulkUpdate(
              synced_ids.map((id: number) => ({
                key: id,
                changes: { status: 'SYNCED', synced_at: new Date() },
              }))
            );
          }

          // Recount pending
          const pending = await db.transactions
            .where('status')
            .equals('PENDING_SYNC')
            .count();

          set({
            isSyncing: false,
            lastSyncTime: new Date(),
            pendingTransactions: pending,
          });
        } catch (error: any) {
          set({
            isSyncing: false,
            syncError: error.message,
          });
          throw error;
        }
      },

      /**
       * Retry sync with exponential backoff
       */
      retryFailedSync: async (accessToken: string) => {
        // Get tenant ID from session or auth store
        const tenantId = parseInt(
          localStorage.getItem('tenant_id') || '1',
          10
        );

        let delay = 1000;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          try {
            if (get().isOnline) {
              await get().pushPendingTransactions(tenantId, accessToken);
              return; // Success
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            attempts++;
          } catch (error) {
            // Continue retry loop
            attempts++;
          }
        }

        set({
          syncError: `Failed to sync after ${maxAttempts} attempts`,
        });
      },
    };
  })
);
