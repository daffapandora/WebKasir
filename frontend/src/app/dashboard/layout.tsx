import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireRole={['owner', 'manager']}>
      <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        {/* Sidebar */}
        <aside style={{ width: '260px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '14px', color: 'white',
            }}>
              K
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>KasirPro</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', fontWeight: 600,
              textDecoration: 'none'
            }}>
              <span>📊</span> Ringkasan
            </a>
            <a href="/pos" style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '12px', color: '#64748b', fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.2s'
            }}>
              <span>🛒</span> Buka Kasir
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
