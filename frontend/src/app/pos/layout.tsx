import { AuthGuard } from '@/components/AuthGuard';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
