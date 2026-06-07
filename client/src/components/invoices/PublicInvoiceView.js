'use client'

import { useState } from 'react'
import {
  IconCopy,
  IconCheck,
  IconDownload,
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconMail,
} from '@tabler/icons-react'
import { formatAmount, getInitials, formatDate, getInvoiceTotal } from '@/lib/utils'
import { downloadInvoicePDF } from '@/lib/pdf/invoicePDF'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapInvoiceForPDF(invoice, branding) {
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

function shareLink() {
  return typeof window !== 'undefined' ? window.location.href : ''
}

function whatsappUrl(invoice) {
  const msg = encodeURIComponent(`Hi, please find invoice ${invoice.invoiceNumber} here: ${shareLink()}`)
  return `https://wa.me/?text=${msg}`
}

function telegramUrl(invoice) {
  const msg = encodeURIComponent(`Invoice ${invoice.invoiceNumber}: ${shareLink()}`)
  return `https://t.me/share/url?url=${msg}`
}

function emailUrl(invoice) {
  const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)
  const body = encodeURIComponent(`Please find invoice ${invoice.invoiceNumber} here: ${shareLink()}`)
  return `mailto:${invoice.customerEmail || ''}?subject=${subject}&body=${body}`
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyBtn({ value, copyKey, activeKey, onCopy }) {
  const done = activeKey === copyKey
  return (
    <button
      onClick={() => onCopy(value, copyKey)}
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

function DetailRow({ label, value, copyKey, copied, onCopy, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <span className="section-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value}</span>
        {copyKey && <CopyBtn value={value} copyKey={copyKey} activeKey={copied} onCopy={onCopy} />}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublicInvoiceView({ invoice, branding }) {
  const [copied, setCopied] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const businessName = branding?.businessName || 'Your Business'
  const total = getInvoiceTotal(invoice)
  const subtotal = total
  const isOverdue = invoice.status === 'overdue'
  const hasPaymentDetails = branding && (branding.bankName || branding.accountNumber || branding.mobileMoneyNumber)

  function copyToClipboard(value, key) {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      const mapped = mapInvoiceForPDF(invoice, branding)
      await downloadInvoicePDF(mapped, { business_name: businessName })
    } finally {
      setPdfLoading(false)
    }
  }

  const card = {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    border: '0.5px solid var(--color-border)',
  }

  const shareBtn = {
    flex: 1,
    height: 48,
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-action)' }}>PayRush</span>
          <span className={`badge badge-${invoice.status || 'draft'}`}>{invoice.status || 'draft'}</span>
        </div>

        {/* Main card */}
        <div style={card}>
          {/* Business identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Business logo"
                style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--color-accent-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 500, color: 'var(--color-action)',
              }}>
                {getInitials(businessName)}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {businessName}
              </p>
              {branding?.website && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {branding.website}
                </p>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '16px 0' }} />

          {/* Invoice / date meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span className="section-label">Invoice</span>
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {invoice.invoiceNumber}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="section-label">Date Issued</span>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-primary)' }}>
                {formatDate(invoice.createdAt)}
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '16px 0' }} />

          {/* Billed to */}
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>Billed To</span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {invoice.customerName}
          </p>
          {invoice.customerEmail && (
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {invoice.customerEmail}
            </p>
          )}
          {invoice.dueDate && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: isOverdue ? 'var(--color-overdue-text)' : 'var(--color-text-secondary)' }}>
              Due: {formatDate(invoice.dueDate)}
            </p>
          )}

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '16px 0' }} />

          {/* Line items */}
          <div style={{ display: 'flex' }}>
            <span className="section-label" style={{ flex: 1 }}>Description</span>
            <span className="section-label" style={{ width: 40, textAlign: 'right' }}>Qty</span>
            <span className="section-label" style={{ width: 88, textAlign: 'right' }}>Amount</span>
          </div>
          {(invoice.items || []).map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'flex', padding: '9px 0',
                borderBottom: idx < invoice.items.length - 1 ? '0.5px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{item.description}</span>
              <span style={{ width: 40, textAlign: 'right', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {parseFloat(item.quantity) || 1}
              </span>
              <span style={{ width: 88, textAlign: 'right', fontSize: 13, color: 'var(--color-text-primary)' }}>
                {formatAmount(parseFloat(item.amount) || 0, invoice.currency)}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{formatAmount(subtotal, invoice.currency)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-action)' }}>{formatAmount(total, invoice.currency)}</span>
            </div>
          </div>

          {/* Payment details */}
          {hasPaymentDetails && (
            <div style={{ background: 'var(--color-page-bg)', borderRadius: 10, padding: 14, marginTop: 20 }}>
              <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>Payment Details</span>

              {branding.bankName && (
                <DetailRow label="Bank" value={branding.bankName} copied={copied} onCopy={copyToClipboard} />
              )}
              {branding.accountName && (
                <DetailRow label="Account Name" value={branding.accountName} copied={copied} onCopy={copyToClipboard} />
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
                  <span className="section-label" style={{ display: 'block', marginBottom: 4 }}>Mobile Money</span>
                  <DetailRow label="Number" value={branding.mobileMoneyNumber} copyKey="mobileMoney" copied={copied} onCopy={copyToClipboard} last />
                </>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'var(--color-action)', color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 500, cursor: pdfLoading ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: pdfLoading ? 0.7 : 1,
            }}
          >
            <IconDownload size={16} stroke={1.5} />
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={shareBtn} onClick={() => window.open(whatsappUrl(invoice), '_blank')}>
              <IconBrandWhatsapp size={18} stroke={1.5} style={{ color: '#25D366' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>WhatsApp</span>
            </button>
            <button style={shareBtn} onClick={() => window.open(telegramUrl(invoice), '_blank')}>
              <IconBrandTelegram size={18} stroke={1.5} style={{ color: '#229ED9' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Telegram</span>
            </button>
            <button style={shareBtn} onClick={() => window.open(emailUrl(invoice), '_blank')}>
              <IconMail size={18} stroke={1.5} style={{ color: 'var(--color-action)' }} />
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Email</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          Powered by PayRush
        </p>
      </div>
    </div>
  )
}
