'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconFileInvoice } from '@tabler/icons-react'
import { useSession } from '@/lib/auth-client'
import { formatAmount, getInitials, formatDate, getInvoiceTotal } from '@/lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getLast7Days() {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: labels[d.getDay()],
      date: d.toISOString().slice(0, 10),
      isToday: i === 6,
    }
  })
}

// ─── Skeleton primitive ───────────────────────────────────────────────────────

function Skel({ width, height, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 4, ...style }} />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardHome() {
  const { data: session, isPending: sessionLoading } = useSession()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
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

  // ── Derived stats ──────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  const collectedThisMonth = invoices
    .filter(inv => {
      if (inv.status !== 'paid') return false
      const d = new Date(inv.paidAt || inv.createdAt)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)

  const collectedLastMonth = invoices
    .filter(inv => {
      if (inv.status !== 'paid') return false
      const d = new Date(inv.paidAt || inv.createdAt)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)

  const changePercent = collectedLastMonth > 0
    ? Math.round(((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100)
    : 0
  const changeArrow = changePercent >= 0 ? '↑' : '↓'

  const sentCount = invoices.filter(inv => {
    const d = new Date(inv.createdAt)
    return inv.status === 'sent' && d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length
  const awaitingCount = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length

  const currency = invoices[0]?.currency || 'ZMW'

  // ── Chart data ─────────────────────────────────────────────────────────────
  const last7Days = getLast7Days()
  const chartData = last7Days.map(day => {
    const total = invoices
      .filter(inv => (inv.createdAt || '').slice(0, 10) === day.date)
      .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
    return { ...day, total }
  })
  const maxTotal = Math.max(...chartData.map(d => d.total), 1)

  // ── Recent invoices ────────────────────────────────────────────────────────
  const recentInvoices = invoices.slice(0, 5)

  const px = { paddingLeft: 20, paddingRight: 20 }

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Section 1: Greeting ─────────────────────────────────────────────── */}
      <div style={{ ...px }}>
        {sessionLoading ? (
          <Skel width={120} height={16} />
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {getGreeting()},{' '}
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {session?.user?.name?.split(' ')[0] || 'there'}
            </span>
          </p>
        )}
      </div>

      {/* ── Section 2: Hero card ────────────────────────────────────────────── */}
      <div style={{ ...px }}>
        <div style={{ background: 'var(--color-action)', borderRadius: 16, padding: 20, color: '#fff' }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Collected this month
            </span>
            <span style={{ fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 10px', cursor: 'default' }}>
              This month ▾
            </span>
          </div>

          {/* Hero amount */}
          {loading ? (
            <Skel width={160} height={30} style={{ marginTop: 6, background: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <p style={{ margin: '6px 0 0', fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>
              {formatAmount(collectedThisMonth, currency)}
            </p>
          )}

          {/* Change indicator */}
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {changeArrow} {Math.abs(changePercent)}% from last month
          </p>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Sent', value: sentCount },
              { label: 'Awaiting', value: awaitingCount },
              { label: 'Overdue', value: overdueCount },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {loading ? (
                  <>
                    <Skel width="60%" height={10} style={{ background: 'rgba(255,255,255,0.2)' }} />
                    <Skel width="40%" height={14} style={{ marginTop: 4, background: 'rgba(255,255,255,0.2)' }} />
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: 7-day chart ──────────────────────────────────────────── */}
      <div style={{ ...px }}>
        <div style={{ background: 'var(--color-card-bg)', border: '0.5px solid var(--color-border)', borderRadius: 16, padding: 18 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Last 7 days
          </p>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 4 }}>
              {[40, 30, 50, 20, 60, 45, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <Skel width="100%" height={h} style={{ borderRadius: '4px 4px 0 0' }} />
                  <Skel width={24} height={10} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 4 }}>
              {chartData.map((day) => {
                const barH = day.total > 0 ? Math.max(4, (day.total / maxTotal) * 80) : 4
                return (
                  <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: barH,
                        borderRadius: '4px 4px 0 0',
                        background: day.isToday ? 'var(--color-action)' : 'var(--color-accent-100)',
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6, textAlign: 'center' }}>
                      {day.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Recent invoices ──────────────────────────────────────── */}
      <div style={{ ...px }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Recent invoices
          </span>
          <Link href="/dashboard/invoices" style={{ fontSize: 13, color: 'var(--color-action)' }}>
            See all
          </Link>
        </div>

        <div style={{ background: 'var(--color-card-bg)', border: '0.5px solid var(--color-border)', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            [0, 1, 2].map(i => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}
              >
                <Skel width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skel width="55%" height={13} />
                  <Skel width="40%" height={11} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <Skel width={70} height={13} />
                  <Skel width={44} height={18} style={{ borderRadius: 999 }} />
                </div>
              </div>
            ))
          ) : recentInvoices.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
              <IconFileInvoice size={32} style={{ color: 'var(--color-accent-100)' }} stroke={1.5} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                No invoices yet
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 220 }}>
                Create your first invoice and get paid faster.
              </p>
            </div>
          ) : (
            recentInvoices.map((inv, idx) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: idx < recentInvoices.length - 1 ? '1px solid var(--color-border)' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--color-accent-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-action)',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(inv.customerName)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.customerName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {inv.invoiceNumber} · {formatDate(inv.createdAt)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
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

      {/* ── Section 5: New invoice CTA ──────────────────────────────────────── */}
      <div style={{ ...px, marginTop: 8, marginBottom: 24 }}>
        <button
          onClick={() => router.push('/dashboard/invoices/new')}
          style={{
            width: '100%',
            height: 48,
            background: 'var(--color-action)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + New Invoice
        </button>
      </div>
    </div>
  )
}
