'use client';

import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@/store/ui-store';
import { ToastContainer } from '@/components/ui/toast';
import { AdminPinModal } from '@/components/shared/admin-pin-modal';

export function Providers({ children }: { children: ReactNode }) {
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Seed initial mock data into Firebase if collections are empty
    import('@/lib/firebase-service').then(({ seedInitialData }) => {
      seedInitialData();
    });
  }, [theme]);

  return (
    <>
      {children}
      <ToastContainer />
      <AdminPinModal />
    </>
  );
}
