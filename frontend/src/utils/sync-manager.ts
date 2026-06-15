import { db } from '@/lib/dexie-db';
import { apiClient } from '@/lib/api-client';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors?: string[];
}

/**
 * Scans IndexedDB for pending or failed transactions and sends them in batch
 * to the Laravel REST API.
 */
export async function syncPendingTransactions(): Promise<SyncResult> {
  if (typeof window === 'undefined') {
    return { success: false, syncedCount: 0, failedCount: 0 };
  }

  // Check network connection first
  if (!navigator.onLine) {
    return { 
      success: false, 
      syncedCount: 0, 
      failedCount: 0, 
      errors: ['Koneksi internet terputus. Tidak dapat melakukan sinkronisasi.'] 
    };
  }

  // Retrieve all pending or failed transactions
  const pendingTransactions = await db.transactionsQueue
    .where('status')
    .anyOf('pending', 'failed')
    .toArray();

  if (pendingTransactions.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  // Update status in local DB to syncing to avoid parallel sync runs
  const ids = pendingTransactions.map((t) => t.id).filter((id): id is number => id !== undefined);
  await db.transactionsQueue.where('id').anyOf(ids).modify({ status: 'syncing' });

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    // Structure payload for the bulk sync API
    const batchPayload = pendingTransactions.map((t) => ({
      uuid: t.uuid,
      invoice_number: t.invoice_number,
      completed_at_client: t.completed_at_client,
      customerId: t.payload.customerId,
      customerName: t.payload.customerName,
      items: t.payload.items,
      payments: t.payload.payments,
      subtotal: t.payload.subtotal,
      discountAmount: t.payload.discountAmount,
      taxAmount: t.payload.taxAmount,
      serviceCharge: t.payload.serviceCharge,
      total: t.payload.total,
      change: t.payload.change,
      notes: t.payload.notes,
      shift_id: t.payload.shift_id,
    }));

    // Post data to Laravel REST API sync endpoint
    const response = await apiClient.post<{ success: boolean; synced: string[]; message?: string }>(
      '/pos/transactions/sync',
      { transactions: batchPayload }
    );

    if (response.data && response.data.success) {
      const serverSyncedUuids = response.data.synced || [];
      
      // Update IndexedDB statuses based on server feedback
      for (const t of pendingTransactions) {
        // If the server confirms syncing or if overall request was successful
        if (serverSyncedUuids.includes(t.uuid) || serverSyncedUuids.length === 0) {
          await db.transactionsQueue.where('uuid').equals(t.uuid).modify({
            status: 'synced',
            error_message: undefined,
          });
          syncedCount++;
        } else {
          // If server didn't include this uuid, it failed to sync on server side
          await db.transactionsQueue.where('uuid').equals(t.uuid).modify({
            status: 'failed',
            error_message: 'Ditolak oleh server (validasi gagal)',
          });
          failedCount++;
        }
      }

      // Record successful sync timestamp
      localStorage.setItem('tokopos_last_sync_time', new Date().toISOString());
    } else {
      throw new Error(response.data.message || 'Gagal mengirim antrean sinkronisasi ke server.');
    }
  } catch (err: any) {
    console.error('Auto sync error:', err);
    // Revert syncing transactions to failed state
    for (const t of pendingTransactions) {
      await db.transactionsQueue.where('uuid').equals(t.uuid).modify((item) => {
        item.status = 'failed';
        item.sync_attempts += 1;
        item.error_message = err.message || 'Koneksi API Gagal';
      });
      failedCount++;
    }
    errors.push(err.message || 'Koneksi API terputus');
  }

  // Dispatch global event for live UI reaction in components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tokopos-sync-status', {
        detail: {
          syncedCount,
          failedCount,
          lastSync: new Date().toISOString(),
        },
      })
    );
  }

  return {
    success: errors.length === 0,
    syncedCount,
    failedCount,
    errors,
  };
}

/**
 * Initializes listeners for online status and starts background periodic check.
 */
export function initSyncManager() {
  if (typeof window === 'undefined') return;

  // Sync automatically when network returns
  window.addEventListener('online', () => {
    console.log('[SyncManager] Koneksi internet kembali. Mengirim transaksi luring...');
    syncPendingTransactions();
  });

  // Sync every 60 seconds if online
  setInterval(() => {
    if (navigator.onLine) {
      syncPendingTransactions();
    }
  }, 60000);
}
