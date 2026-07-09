'use client';

import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@/store/ui-store';
import { ToastContainer } from '@/components/ui/toast';
import { AdminPinModal } from '@/components/shared/admin-pin-modal';
import { seedInitialData } from '@/lib/firebase-service';

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // A10: Automatically handle ChunkLoadErrors by reloading the page
  useEffect(() => {
    const handleChunkError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'reason' in e ? e.reason : e.error;
      const errorMessage = error?.message || error?.toString() || '';
      
      if (
        errorMessage.includes('ChunkLoadError') || 
        errorMessage.includes('Loading chunk') || 
        errorMessage.includes('Failed to fetch') ||
        (error && error.name === 'ChunkLoadError')
      ) {
        const lastReload = sessionStorage.getItem('last_chunk_error_reload');
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 5000) {
          sessionStorage.setItem('last_chunk_error_reload', now.toString());
          console.warn('ChunkLoadError detected, reloading...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  useEffect(() => {
    // Seed initial data to Supabase if database tables are empty
    seedInitialData().catch(err => {
      console.error('Failed to seed initial data:', err);
    });
    // Register Service Worker for offline support and background sync (Only in Production)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const handleRegister = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('Service Worker registered successfully with scope:', reg.scope);
            // If background sync API is available, register a sync event
            if ('sync' in reg) {
              // @ts-ignore - sync is not standard in some TS declarations but is standard on chromium
              reg.sync.register('sync-transactions').catch((err: any) => {
                console.error('Background sync registration failed:', err);
              });
            }
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        handleRegister();
      } else {
        window.addEventListener('load', handleRegister);
      }

      // Listen for background sync trigger from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TRIGGER_SYNC') {
          import('@/utils/sync-manager').then(({ syncPendingTransactions }) => {
            syncPendingTransactions();
          });
        }
      });
    }

    // Initialize synchronization event listeners
    import('@/utils/sync-manager').then(({ initSyncManager }) => {
      initSyncManager();
    });
  }, []);

  return (
    <>
      {children}
      <ToastContainer />
      <AdminPinModal />
    </>
  );
}
