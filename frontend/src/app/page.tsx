'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'cashier') {
        router.replace('/pos');
      } else {
        router.replace('/admin/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="animate-pulse-subtle">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
