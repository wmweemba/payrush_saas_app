'use client'

import dynamic from 'next/dynamic'

const InvoiceList = dynamic(
  () => import('@/components/invoices/InvoiceList'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }} />
    ),
  }
)

export default function InvoicesPage() {
  return <InvoiceList />
}
