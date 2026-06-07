'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconFileInvoice } from '@tabler/icons-react'
import { formatAmount, getInitials, formatDate, getInvoiceTotal } from '@/lib/utils'

// ─── Skeleton primitive ───────────────────────────────────────────────────────

function Skel({ width, height, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 4, ...style }} />
  )
}

// ─── Filter tab definitions ───────────────────────────────────────────────────

const TABS = ['All', 'Sent', 'Paid', 'Overdue', 'Draft', 'Quotes']

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(({ data }) => {
        setInvoices(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Filtering & sorting ────────────────────────────────────────────────────
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const filtered = activeTab === 'Quotes'
    ? sorted.filter(inv => inv.documentType === 'quote')
    : activeTab === 'All'
    ? sorted.filter(inv => inv.documentType !== 'quote')
    : sorted.filter(inv => inv.documentType !== 'quote' && inv.status === activeTab.toLowerCase())

  // ── Summary metrics (All tab only, invoices only) ──────────────────────────
  const invoiceOnly = invoices.filter(inv => inv.documentType !== 'quote')
  const currency = invoiceOnly[0]?.currency || 'ZMW'

  const totalCount = invoiceOnly.length
  const paidTotal = invoiceOnly
    .filter(inv => inv.status === 'paid')
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
  const pendingTotal = invoiceOnly
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)

  const px = { paddingLeft: 20, paddingRight: 20 }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 96 }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...px,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Invoices
        </h1>
        <button
          onClick={() => router.push('/dashboard/invoices/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 14px',
            background: 'var(--color-action)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <IconPlus size={14} stroke={2} />
          New
        </button>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <div
        className="no-scrollbar"
        style={{
          ...px,
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {TABS.map(tab => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                border: active ? 'none' : '0.5px solid var(--color-border)',
                background: active ? 'var(--color-action)' : 'var(--color-card-bg)',
                color: active ? '#fff' : 'var(--color-text-secondary)',
                transition: 'background 150ms ease, color 150ms ease',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Summary bar (All tab, has invoices) ─────────────────────────────── */}
      {!loading && activeTab === 'All' && invoiceOnly.length > 0 && (
        <div style={{ ...px, display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Total', value: totalCount },
            { label: 'Paid', value: formatAmount(paidTotal, currency) },
            { label: 'Pending', value: formatAmount(pendingTotal, currency) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: 'var(--color-card-bg)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Invoice list ─────────────────────────────────────────────────────── */}
      <div style={{ ...px }}>
        {loading ? (
          /* Skeleton rows */
          [0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 64, borderRadius: 12, marginBottom: 8 }}
            />
          ))
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '48px 0',
              gap: 8,
            }}
          >
            <IconFileInvoice
              size={40}
              stroke={1.5}
              style={{ color: 'var(--color-accent-100)' }}
            />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              No invoices
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 240 }}>
              {activeTab === 'All'
                ? 'Create your first invoice and get paid faster.'
                : 'No invoices match this filter.'}
            </p>
          </div>
        ) : (
          /* Invoice rows */
          filtered.map(inv => (
            <div
              key={inv.id}
              onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--color-card-bg)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--color-accent-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-action)',
                  flexShrink: 0,
                }}
              >
                {getInitials(inv.customerName)}
              </div>

              {/* Middle */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {inv.customerName}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {inv.invoiceNumber}
                  {inv.dueDate ? ` · ${formatDate(inv.dueDate)}` : ''}
                </p>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {formatAmount(getInvoiceTotal(inv), inv.currency)}
                </span>
                <span className={`badge badge-${inv.status || 'draft'}`}>
                  {inv.status || 'draft'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
