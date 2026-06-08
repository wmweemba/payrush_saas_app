import { PublicInvoiceView } from '@/components/invoices/PublicInvoiceView'

export async function generateMetadata({ params }) {
  const { token } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  try {
    const res = await fetch(`${baseUrl}/api/invoice/${token}`, { cache: 'no-store' })
    const { data } = await res.json()
    if (!data) return { title: 'Invoice — PayRush' }
    const isQuote = data.documentType === 'quote'
    const docLabel = isQuote ? 'Quotation' : 'Invoice'
    return {
      title: `${docLabel} ${data.invoiceNumber} — PayRush`,
      description: `${docLabel} for ${data.customerName}.`,
      openGraph: {
        title: `${docLabel} ${data.invoiceNumber}`,
        description: `${docLabel} for ${data.customerName} — view and download via PayRush.`,
      },
    }
  } catch {
    return { title: 'Invoice — PayRush' }
  }
}

export default async function PublicInvoicePage({ params }) {
  const { token } = await params

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const res = await fetch(`${baseUrl}/api/invoice/${token}`, { cache: 'no-store' })

  if (!res.ok) {
    return <NotFound />
  }

  const { data } = await res.json()
  return <PublicInvoiceView invoice={data} branding={data.branding} />
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-page-bg)',
      padding: '24px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
        Invoice not found
      </p>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
        This link may be invalid or the invoice may have been removed.
      </p>
    </div>
  )
}
