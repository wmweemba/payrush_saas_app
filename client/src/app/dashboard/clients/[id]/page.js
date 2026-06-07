'use client'

import dynamic from 'next/dynamic'

const ClientDetail = dynamic(
  () => import('@/components/clients/ClientDetail'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }} />
    ),
  }
)

export default function ClientDetailPage() {
  return <ClientDetail />
}
