'use client'

import { useSession } from '@/lib/auth-client'

export default function DashboardPage() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', padding: '40px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111827', marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>Phase 3 complete. Auth and API routes are working.</p>
      {session && (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '20px', maxWidth: '400px' }}>
          <p style={{ fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>Signed in as</p>
          <p style={{ fontSize: '14px', color: '#111827', marginBottom: '4px' }}>{session.user.name}</p>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{session.user.email}</p>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>{session.user.businessName}</p>
        </div>
      )}
    </div>
  )
}
