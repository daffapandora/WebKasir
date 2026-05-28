// ============================================
// KasirPro — Sync Hook
// Real-time sync status for UI components
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncEngine } from '../lib/db/sync';
import { getPendingSyncCount } from '../lib/db/dexie';

export function useSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    getPendingSyncCount().then(setPendingSyncCount);

    // Initialize sync engine
    syncEngine.init();

    // Listen to sync events
    const unsubs = [
      syncEngine.on('online', () => setIsOnline(true)),
      syncEngine.on('offline', () => setIsOnline(false)),
      syncEngine.on('sync:start', () => setIsSyncing(true)),
      syncEngine.on('sync:complete', (data) => {
        setIsSyncing(false);
        const result = data as { synced: number; errors: number };
        setLastSyncResult(result);
        getPendingSyncCount().then(setPendingSyncCount);
      }),
      syncEngine.on('sync:error', () => {
        setIsSyncing(false);
      }),
    ];

    // Refresh pending count every 10 seconds
    const interval = setInterval(() => {
      getPendingSyncCount().then(setPendingSyncCount);
    }, 10000);

    return () => {
      unsubs.forEach(unsub => unsub());
      clearInterval(interval);
      syncEngine.destroy();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    const result = await syncEngine.syncAll();
    return result;
  }, [isOnline, isSyncing]);

  const pullMasterData = useCallback(async () => {
    return syncEngine.pullMasterData();
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingSyncCount,
    lastSyncResult,
    triggerSync,
    pullMasterData,
  };
}
