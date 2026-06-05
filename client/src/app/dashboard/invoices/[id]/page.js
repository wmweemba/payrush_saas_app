'use client'

import dynamic from 'next/dynamic'

const InvoiceDetail = dynamic(
  () => import('@/components/invoices/InvoiceDetail'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }} />
    ),
  }
)

export default function InvoiceDetailPage() {
  return <InvoiceDetail />
}
