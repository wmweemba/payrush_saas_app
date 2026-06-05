'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowLeft,
  IconDotsVertical,
  IconCopy,
  IconCheck,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconMail,
  IconFileInvoice,
} from '@tabler/icons-react'
import { useSession } from '@/lib/auth-client'
import { formatAmount, getInitials, formatDate, getInvoiceTotal } from '@/lib/utils'
import { downloadInvoicePDF } from '@/lib/pdf/invoicePDF'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skel({ width, height, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4, ...style }} />
}

function SkeletonView() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Skel width={40} height={40} style={{ borderRadius: '50%' }} />
          <Skel width={56} height={22} style={{ borderRadius: 999 }} />
        </div>
        <Skel width={120} height={14} style={{ marginBottom: 8 }} />
        <Skel width={80} height={11} style={{ marginBottom: 4 }} />
        <Skel width={140} height={14} style={{ marginBottom: 16 }} />
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: 14 }}>
          <Skel width={60} height={11} style={{ marginBottom: 6 }} />
          <Skel width={160} height={28} style={{ marginBottom: 4 }} />
          <Skel width={100} height={12} />
        </div>
        <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: 14, marginTop: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '0.5px solid var(--color-border)' : 'none' }}>
              <Skel width="50%" height={13} />
              <Skel width={60} height={13} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '0.5px solid var(--color-border)' : 'none' }}>
            <Skel width={80} height={11} />
            <Skel width={120} height={13} />
          </div>
        ))}
      </div>
      <Skel width="100%" height={48} style={{ borderRadius: 12 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <Skel width="33%" height={44} style={{ borderRadius: 10 }} />
        <Skel width="33%" height={44} style={{ borderRadius: 10 }} />
        <Skel width="33%" height={44} style={{ borderRadius: 10 }} />
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapInvoiceForPDF(invoice, branding, sessionUser) {
  return {
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    customer_name: invoice.customerName,
    customer_email: invoice.customerEmail,
    currency: invoice.currency,
    status: invoice.status,
    due_date: invoice.dueDate,
    created_at: invoice.createdAt,
    amount: getInvoiceTotal(invoice),
    line_items: (invoice.items || []).map(i => ({
      description: i.description,
      quantity: parseFloat(i.quantity) || 1,
      unit_price: parseFloat(i.unitPrice) || 0,
      total: parseFloat(i.amount) || 0,
    })),
  }
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ value, copiedKey, activeKey, onCopy }) {
  const done = activeKey === copiedKey
  return (
    <button
      onClick={() => onCopy(value, copiedKey)}
      aria-label="Copy"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}
    >
      {done
        ? <IconCheck size={14} stroke={2} style={{ color: 'var(--color-action)' }} />
        : <IconCopy size={14} stroke={1.5} style={{ color: 'var(--color-text-tertiary)' }} />
      }
    </button>
  )
}

// ─── Share URL builders ───────────────────────────────────────────────────────

function shareLink(invoice) {
  return `${window.location.origin}/invoice/${invoice.publicToken}`
}

function whatsappUrl(invoice) {
  const msg = encodeURIComponent(`Hi, please find invoice ${invoice.invoiceNumber} attached. View here: ${shareLink(invoice)}`)
  return `https://wa.me/?text=${msg}`
}

function telegramUrl(invoice) {
  const msg = encodeURIComponent(`Invoice ${invoice.invoiceNumber}: ${shareLink(invoice)}`)
  return `https://t.me/share/url?url=${msg}`
}

function emailUrl(invoice) {
  const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)
  const body = encodeURIComponent(`Please find invoice ${invoice.invoiceNumber} here: ${shareLink(invoice)}`)
  return `mailto:${invoice.customerEmail || ''}?subject=${subject}&body=${body}`
}

// ─── Shared row style ─────────────────────────────────────────────────────────

function DetailRow({ label, value, copyKey, copied, onCopy, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value}</span>
        {copyKey && (
          <CopyBtn value={value} copiedKey={copyKey} activeKey={copied} onCopy={onCopy} />
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InvoiceDetail() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const id = params?.id

  const [invoice, setInvoice] = useState(null)
  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // UI state
  const [confirming, setConfirming] = useState(false) // mark-as-paid confirm
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetConfirmCancel, setSheetConfirmCancel] = useState(false)
  const [copied, setCopied] = useState(null)
  const [toast, setToast] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/invoices/${id}`).then(r => r.json()),
      fetch('/api/branding').then(r => r.json()),
    ]).then(([invRes, brandRes]) => {
      if (invRes.error || !invRes.data) {
        setNotFound(true)
      } else {
        setInvoice(invRes.data)
      }
      setBranding(brandRes.data || null)
      setLoading(false)
    }).catch(() => {
      setNotFound(true)
      setLoading(false)
    })
  }, [id])

  // ── Derived ────────────────────────────────────────────────────────────────

  const total = invoice ? getInvoiceTotal(invoice) : 0
  const subtotal = total
  const businessName = branding?.businessName || session?.user?.name || 'Your Business'
  const hasPaymentDetails = branding && (branding.bankName || branding.accountNumber || branding.mobileMoneyNumber)

  // ── Handlers ───────────────────────────────────────────────────────────────

  function copyToClipboard(value, key) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function fireToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  async function handleMarkPaid() {
    try {
      const res = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'bank_transfer' }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setInvoice(json.data)
        setConfirming(false)
      } else {
        fireToast('Failed to mark as paid. Please try again.')
      }
    } catch {
      fireToast('Failed to mark as paid. Please try again.')
    }
  }

  async function handleCancelInvoice() {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setInvoice(prev => ({ ...prev, status: 'cancelled' }))
        setSheetOpen(false)
        setSheetConfirmCancel(false)
      } else {
        fireToast('Failed to cancel invoice.')
      }
    } catch {
      fireToast('Failed to cancel invoice.')
    }
  }

  async function handleDownloadPDF() {
    if (!invoice) return
    setPdfLoading(true)
    try {
      const mapped = mapInvoiceForPDF(invoice, branding, session?.user)
      const profile = { business_name: businessName }
      await downloadInvoicePDF(mapped, profile)
    } catch {
      fireToast('Failed to generate PDF.')
    } finally {
      setPdfLoading(false)
    }
  }

  function handleCopyLink() {
    copyToClipboard(shareLink(invoice), 'link')
    setSheetOpen(false)
    fireToast('Link copied!')
  }

  // ── Card styles ────────────────────────────────────────────────────────────

  const card = {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    border: '0.5px solid var(--color-border)',
  }

  const outlinedBtn = {
    flex: 1,
    height: 44,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    border: '0.5px solid var(--color-border)',
    borderRadius: 10,
    background: '#fff',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
        <div className="lg:hidden" style={{
          position: 'sticky', top: 0, zIndex: 10, height: 56, background: '#fff',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Skel width={120} height={16} />
        </div>
        <SkeletonView />
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 12 }}>
        <IconFileInvoice size={40} stroke={1.5} style={{ color: 'var(--color-accent-100)' }} />
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>Invoice not found</p>
        <button
          onClick={() => router.push('/dashboard/invoices')}
          style={{
            marginTop: 8, padding: '8px 20px', background: 'var(--color-action)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Back to invoices
        </button>
      </div>
    )
  }

  const isPaid = invoice.status === 'paid'

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', position: 'relative' }}>

      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <div
        className="lg:hidden"
        style={{
          position: 'sticky', top: 0, zIndex: 10, height: 56,
          background: '#fff', borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <button
          onClick={() => router.push('/dashboard/invoices')}
          aria-label="Back"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <IconArrowLeft size={20} stroke={1.5} style={{ color: 'var(--color-text-primary)' }} />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          {invoice.invoiceNumber}
        </span>
        <button
          onClick={() => { setSheetOpen(true); setSheetConfirmCancel(false) }}
          aria-label="More options"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <IconDotsVertical size={16} stroke={1.5} style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }} className="lg:pt-6 lg:px-6">

        {/* Desktop breadcrumb */}
        <div className="hidden lg:block" style={{ marginBottom: 20, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <Link href="/dashboard/invoices" style={{ color: 'var(--color-text-secondary)' }}>Invoices</Link>
          {' › '}{invoice.invoiceNumber}
          <button
            onClick={() => { setSheetOpen(true); setSheetConfirmCancel(false) }}
            style={{
              marginLeft: 12, background: 'transparent', border: '0.5px solid var(--color-border)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 12,
              color: 'var(--color-text-secondary)', fontFamily: 'inherit',
            }}
          >
            ⋮ Options
          </button>
        </div>

        {/* ── Card 1: Invoice summary ────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 12 }}>
          {/* Top row: logo/initials + status badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Business logo"
                style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, border: '0.5px solid var(--color-border)' }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--color-accent-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 500, color: 'var(--color-action)',
              }}>
                {getInitials(businessName)}
              </div>
            )}
            <span className={`badge badge-${invoice.status || 'draft'}`}>
              {invoice.status || 'draft'}
            </span>
          </div>

          {/* Business name */}
          <p style={{ margin: '12px 0 0', fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {businessName}
          </p>

          {/* Billed to */}
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Billed to
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {invoice.customerName}
          </p>

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '14px 0' }} />

          {/* Amount hero */}
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Due
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
            {formatAmount(total, invoice.currency)}
          </p>
          {invoice.dueDate && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Due {formatDate(invoice.dueDate)}
            </p>
          )}

          {/* Line items */}
          {invoice.items && invoice.items.length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '14px 0' }} />

              {/* Items header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 80px', marginBottom: 4 }}>
                {['Description', 'Qty', 'Amount'].map((h, i) => (
                  <span key={h} style={{
                    fontSize: 10, color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    textAlign: i > 0 ? 'right' : 'left',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {invoice.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 40px 80px',
                    padding: '8px 0',
                    borderBottom: idx < invoice.items.length - 1 ? '0.5px solid var(--color-border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{item.description}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                    {parseFloat(item.quantity) || 1}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'right' }}>
                    {formatAmount(parseFloat(item.amount) || 0, invoice.currency)}
                  </span>
                </div>
              ))}

              {/* Totals */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{formatAmount(subtotal, invoice.currency)}</span>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Total</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-action)' }}>{formatAmount(total, invoice.currency)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Card 2: Payment details ────────────────────────────────────── */}
        {hasPaymentDetails && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Payment Details
            </p>

            {branding.bankName && (
              <DetailRow label="Bank" value={branding.bankName} last={!branding.accountName && !branding.accountNumber} copied={copied} onCopy={copyToClipboard} />
            )}
            {branding.accountName && (
              <DetailRow label="Account Name" value={branding.accountName} last={!branding.accountNumber && invoice.invoiceNumber} copied={copied} onCopy={copyToClipboard} />
            )}
            {branding.accountNumber && (
              <DetailRow label="Account Number" value={branding.accountNumber} copyKey="accountNumber" copied={copied} onCopy={copyToClipboard} />
            )}
            <DetailRow
              label="Reference"
              value={invoice.invoiceNumber}
              copyKey="reference"
              copied={copied}
              onCopy={copyToClipboard}
              last={!branding.mobileMoneyNumber}
            />

            {branding.mobileMoneyNumber && (
              <>
                <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '8px 0' }} />
                <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mobile Money
                </p>
                <DetailRow label="Number" value={branding.mobileMoneyNumber} last copied={copied} onCopy={copyToClipboard} />
              </>
            )}
          </div>
        )}

        {/* ── Card 3: Notes ─────────────────────────────────────────────── */}
        {invoice.paymentNotes && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notes
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {invoice.paymentNotes}
            </p>
          </div>
        )}

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 }}>

          {/* Primary action */}
          {!isPaid ? (
            confirming ? (
              <div style={{
                background: '#fff', borderRadius: 12, padding: '14px 16px',
                border: '0.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  Mark this invoice as paid?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setConfirming(false)}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: 'var(--color-action)', fontFamily: 'inherit', padding: '6px 12px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkPaid}
                    style={{
                      background: 'var(--color-action)', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                style={{
                  width: '100%', height: 48, background: 'var(--color-action)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Mark as Paid
              </button>
            )
          ) : (
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              style={{
                width: '100%', height: 48, background: 'var(--color-action)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 500,
                cursor: pdfLoading ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: pdfLoading ? 0.7 : 1,
              }}
            >
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
          )}

          {/* Share row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={outlinedBtn} onClick={() => window.open(whatsappUrl(invoice), '_blank')}>
              <IconBrandWhatsapp size={18} stroke={1.5} style={{ color: '#25D366' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>WhatsApp</span>
            </button>
            <button style={outlinedBtn} onClick={() => window.open(telegramUrl(invoice), '_blank')}>
              <IconBrandTelegram size={18} stroke={1.5} style={{ color: '#229ED9' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Telegram</span>
            </button>
            <button style={outlinedBtn} onClick={() => window.open(emailUrl(invoice), '_blank')}>
              <IconMail size={18} stroke={1.5} style={{ color: 'var(--color-action)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Action sheet ─────────────────────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => { setSheetOpen(false); setSheetConfirmCancel(false) }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40,
            }}
          />

          {/* Sheet */}
          <div
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: 20, zIndex: 50,
            }}
          >
            {sheetConfirmCancel ? (
              <div>
                <p style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Cancel this invoice?
                </p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  This action marks the invoice as cancelled. It cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSheetConfirmCancel(false)}
                    style={{
                      flex: 1, height: 44, background: 'transparent',
                      border: '0.5px solid var(--color-border)', borderRadius: 10,
                      fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Go back
                  </button>
                  <button
                    onClick={handleCancelInvoice}
                    style={{
                      flex: 1, height: 44, background: 'var(--color-overdue-bg)',
                      color: 'var(--color-overdue-text)', border: '0.5px solid rgba(163,45,45,0.2)',
                      borderRadius: 10, fontSize: 14, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel invoice
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  {
                    label: 'Edit invoice',
                    action: () => { setSheetOpen(false); router.push(`/dashboard/invoices/${id}/edit`) },
                  },
                  {
                    label: 'Download PDF',
                    action: () => { setSheetOpen(false); handleDownloadPDF() },
                  },
                  {
                    label: 'Copy link',
                    action: handleCopyLink,
                  },
                  {
                    label: 'Cancel invoice',
                    danger: true,
                    action: () => setSheetConfirmCancel(true),
                  },
                ].map(({ label, action, danger }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      width: '100%', height: 48, background: 'transparent', border: 'none',
                      textAlign: 'left', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                      color: danger ? 'var(--color-overdue-text)' : 'var(--color-text-primary)',
                      padding: '0 4px', borderRadius: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-page-bg)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {label}
                  </button>
                ))}

                <button
                  onClick={() => { setSheetOpen(false); setSheetConfirmCancel(false) }}
                  style={{
                    marginTop: 8, width: '100%', height: 48,
                    background: 'var(--color-page-bg)', border: 'none',
                    borderRadius: 10, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'inherit', color: 'var(--color-text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', borderLeft: '3px solid var(--color-action)',
            borderRadius: 8, padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: 13, color: 'var(--color-text-primary)',
            zIndex: 100, whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
