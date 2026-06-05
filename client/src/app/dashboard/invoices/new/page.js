'use client'

import dynamic from 'next/dynamic'

const InvoiceForm = dynamic(
  () => import('@/components/invoices/InvoiceForm'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: '#fff' }} />
    ),
  }
)

export default function NewInvoicePage() {
  return <InvoiceForm />
}
