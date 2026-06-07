'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { IconArrowLeft, IconPencil, IconUser } from '@tabler/icons-react'
import { formatAmount, getInitials, formatDate, getInvoiceTotal } from '@/lib/utils'
import { ClientFormModal } from './ClientFormModal'

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skel({ width, height, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4, ...style }} />
}

function SkeletonView() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Skel width={52} height={52} style={{ borderRadius: '50%' }} />
          <div>
            <Skel width={120} height={16} style={{ marginBottom: 6 }} />
            <Skel width={150} height={12} />
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '0.5px solid var(--color-border)' : 'none' }}>
            <Skel width={80} height={11} />
            <Skel width={120} height={13} />
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
        <Skel width={80} height={14} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Skel width="33%" height={48} style={{ borderRadius: 10 }} />
          <Skel width="33%" height={48} style={{ borderRadius: 10 }} />
          <Skel width="33%" height={48} style={{ borderRadius: 10 }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '0.5px solid var(--color-border)' : 'none' }}>
            <Skel width={32} height={32} style={{ borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Skel width={100} height={13} style={{ marginBottom: 4 }} />
              <Skel width={70} height={11} />
            </div>
            <Skel width={60} height={13} />
          </div>
        ))}
      </div>
      <Skel width="100%" height={40} style={{ borderRadius: 8 }} />
    </div>
  )
}

// ─── Shared row style ─────────────────────────────────────────────────────────

function DetailRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0',
      borderBottom: last ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClientDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [client, setClient] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
    ]).then(([clientRes, invRes]) => {
      if (clientRes.error || !clientRes.data) {
        setNotFound(true)
      } else {
        setClient(clientRes.data)
        setInvoices((invRes.data || []).filter(inv => inv.clientId === id))
      }
      setLoading(false)
    }).catch(() => {
      setNotFound(true)
      setLoading(false)
    })
  }, [id])

  function fireToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [invoices]
  )

  const currency = client?.currency || invoices[0]?.currency || 'ZMW'
  const totalBilled = invoices.reduce((s, inv) => s + getInvoiceTotal(inv), 0)
  const paidTotal = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)
  const pendingTotal = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((s, inv) => s + getInvoiceTotal(inv), 0)

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleArchive() {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        fireToast('Client archived')
        router.push('/dashboard/clients')
      } else {
        fireToast('Failed to archive client.')
      }
    } catch {
      fireToast('Failed to archive client.')
    }
  }

  // ── Card style ─────────────────────────────────────────────────────────────

  const card = {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    border: '0.5px solid var(--color-border)',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>
        <div className="flex lg:hidden" style={{
          position: 'sticky', top: 0, zIndex: 10, height: 56, background: '#fff',
          borderBottom: '0.5px solid var(--color-border)',
          alignItems: 'center', justifyContent: 'center',
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
        <IconUser size={40} stroke={1.5} style={{ color: 'var(--color-accent-100)' }} />
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>Client not found</p>
        <button
          onClick={() => router.push('/dashboard/clients')}
          style={{
            marginTop: 8, padding: '8px 20px', background: 'var(--color-action)',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Back to clients
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh', position: 'relative' }}>

      {/* ── Mobile top bar ──────────────────────────────────────────────────── */}
      <div
        className="flex lg:hidden"
        style={{
          position: 'sticky', top: 0, zIndex: 10, height: 56,
          background: '#fff', borderBottom: '0.5px solid var(--color-border)',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
        }}
      >
        <button
          onClick={() => router.push('/dashboard/clients')}
          aria-label="Back"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <IconArrowLeft size={20} stroke={1.5} style={{ color: 'var(--color-text-primary)' }} />
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          {client.name}
        </span>
        <button
          onClick={() => setEditOpen(true)}
          aria-label="Edit client"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          <IconPencil size={16} stroke={1.5} style={{ color: 'var(--color-text-primary)' }} />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }} className="lg:pt-6 lg:px-6">

        {/* Desktop breadcrumb */}
        <div className="hidden lg:flex" style={{ marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <Link href="/dashboard/clients" style={{ color: 'var(--color-text-secondary)' }}>Clients</Link>
            {' › '}{client.name}
          </span>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '0.5px solid var(--color-border)',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12,
              color: 'var(--color-text-primary)', fontFamily: 'inherit',
            }}
          >
            <IconPencil size={14} stroke={1.5} />
            Edit
          </button>
        </div>

        {/* ── Card 1: Client info ───────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--color-accent-50)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 500, color: 'var(--color-action)',
              flexShrink: 0,
            }}>
              {getInitials(client.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {client.name}
              </p>
              {client.email && (
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {client.email}
                </p>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '14px 0' }} />

          {client.phone && <DetailRow label="Phone" value={client.phone} />}
          {client.address && <DetailRow label="Address" value={client.address} />}
          <DetailRow label="Default Currency" value={client.currency || 'ZMW'} />
          <DetailRow label="Client Since" value={formatDate(client.createdAt)} last />
        </div>

        {/* ── Card 2: Invoice history ───────────────────────────────────── */}
        <div style={{ ...card, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Invoices
            </span>
            <span style={{
              background: 'var(--color-accent-50)', color: 'var(--color-action)',
              borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 11,
            }}>
              {invoices.length}
            </span>
          </div>

          {invoices.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Total Billed', value: formatAmount(totalBilled, currency) },
                { label: 'Paid', value: formatAmount(paidTotal, currency) },
                { label: 'Pending', value: formatAmount(pendingTotal, currency) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    background: 'var(--color-page-bg)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {sortedInvoices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px 0' }}>
              No invoices for this client yet.
            </p>
          ) : (
            sortedInvoices.map((inv, idx) => (
              <div
                key={inv.id}
                onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', cursor: 'pointer',
                  borderBottom: idx < sortedInvoices.length - 1 ? '0.5px solid var(--color-border)' : 'none',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--color-accent-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500, color: 'var(--color-action)',
                  flexShrink: 0,
                }}>
                  {getInitials(client.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {inv.invoiceNumber}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {formatDate(inv.createdAt)}
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

        {/* ── Card 3: Danger zone ───────────────────────────────────────── */}
        {client.status !== 'archived' && (
          <div style={{ ...card, marginBottom: 24 }}>
            {archiving ? (
              <div>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Archive this client? Their invoices will not be affected.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setArchiving(false)}
                    style={{
                      flex: 1, height: 40, background: 'transparent',
                      border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8,
                      fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleArchive}
                    style={{
                      flex: 1, height: 40, background: 'var(--color-overdue-bg)',
                      color: 'var(--color-overdue-text)', border: '0.5px solid rgba(163,45,45,0.2)',
                      borderRadius: 8, fontSize: 14, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setArchiving(true)}
                style={{
                  width: '100%', height: 40,
                  background: 'var(--color-overdue-bg)', color: 'var(--color-overdue-text)',
                  border: '0.5px solid rgba(163,45,45,0.2)', borderRadius: 8,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Archive client
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Edit client modal ───────────────────────────────────────────────── */}
      {editOpen && (
        <ClientFormModal
          title="Edit Client"
          submitLabel="Save Changes"
          initialValues={{
            name: client.name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            currency: client.currency || 'ZMW',
          }}
          onClose={() => setEditOpen(false)}
          onSubmit={async (form) => {
            const res = await fetch(`/api/clients/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            })
            const json = await res.json()
            if (res.ok && json.data) {
              setClient(json.data)
              setEditOpen(false)
              fireToast('Client updated')
            } else {
              throw new Error('Failed to update client')
            }
          }}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
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
