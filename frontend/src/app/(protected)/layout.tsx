'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LockScreen } from '@/components/shared/lock-screen';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLocked, user, lastActivity, cashierPermissions, updateLastActivity, lock, checkSessionExpiry } = useAuthStore();

  // Check session expiry on mount and redirect if expired
  useEffect(() => {
    if (isAuthenticated) {
      checkSessionExpiry();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Idle timeout
  useEffect(() => {
    if (!isAuthenticated || !cashierPermissions.quick_lock_enabled) return;

    const checkIdle = () => {
      const idleMs = cashierPermissions.auto_logout_minutes * 60 * 1000;
      if (Date.now() - lastActivity > idleMs) {
        lock();
      }
    };

    const interval = setInterval(checkIdle, 30000); // Check every 30s

    const resetActivity = () => updateLastActivity();
    window.addEventListener('mousedown', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('touchstart', resetActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
    };
  }, [isAuthenticated, cashierPermissions, lastActivity, lock, updateLastActivity]);

  if (isLocked && user) {
    return <LockScreen />;
  }

  return <>{children}</>;
}
