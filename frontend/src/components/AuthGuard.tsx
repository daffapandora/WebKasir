'use client';

import { useAuth } from '@/lib/auth/context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children, requireRole }: { children: React.ReactNode, requireRole?: string[] }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requireRole && !hasRole(...requireRole as any)) {
        router.push('/pos'); // Fallback route if unauthorized
      }
    }
  }, [isAuthenticated, isLoading, router, requireRole, hasRole, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '4px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: '#6366f1',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requireRole && !hasRole(...requireRole as any)) return null;

  return <>{children}</>;
}
