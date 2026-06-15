'use client';

import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@/store/ui-store';
import { ToastContainer } from '@/components/ui/toast';
import { AdminPinModal } from '@/components/shared/admin-pin-modal';

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
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
