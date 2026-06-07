'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconUsers, IconSearch } from '@tabler/icons-react'
import { getInitials } from '@/lib/utils'
import { ClientFormModal } from './ClientFormModal'

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputBase = {
  height: 40,
  border: '0.5px solid var(--color-border)',
  borderRadius: 8,
  padding: '0 12px',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const NEW_CLIENT_DEFAULTS = { name: '', email: '', phone: '', address: '', currency: 'ZMW' }

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/clients?status=all')
      .then(r => r.json())
      .then(({ data }) => {
        setClients(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function fireToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleSaved(newClient) {
    setClients(prev => [newClient, ...prev])
    setModalOpen(false)
    fireToast('Client saved')
  }

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  }, [clients, query])

  // ── Summary metrics ────────────────────────────────────────────────────────
  const totalCount = clients.length
  const activeCount = clients.filter(c => c.status === 'active').length
  const archivedCount = clients.filter(c => c.status === 'archived').length

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
          Clients
        </h1>
        <button
          onClick={() => setModalOpen(true)}
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
          New Client
        </button>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div style={{ ...px, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <IconSearch
            size={16}
            stroke={1.5}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)', pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients..."
            style={{ ...inputBase, paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────────── */}
      {!loading && clients.length > 0 && (
        <div style={{ ...px, display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Total', value: totalCount },
            { label: 'Active', value: activeCount },
            { label: 'Archived', value: archivedCount },
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

      {/* ── Client list ─────────────────────────────────────────────────────── */}
      <div style={{ ...px }}>
        {loading ? (
          /* Skeleton rows */
          [0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 64, borderRadius: 12, marginBottom: 8 }}
            />
          ))
        ) : clients.length === 0 ? (
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
            <IconUsers
              size={40}
              stroke={1.5}
              style={{ color: 'var(--color-accent-100)' }}
            />
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              No clients yet
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 240 }}>
              Add your first client to start sending invoices.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                height: 40, padding: '0 18px', background: 'var(--color-action)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <IconPlus size={14} stroke={2} />
              Add Client
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* No search matches */
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              No clients match &ldquo;{query}&rdquo;.
            </p>
          </div>
        ) : (
          /* Client rows */
          filtered.map(client => (
            <div
              key={client.id}
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
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
                {getInitials(client.name)}
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
                  {client.name}
                </p>
                <p style={{
                  margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {client.email || client.phone || '—'}
                </p>
              </div>

              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <span style={{
                  background: 'var(--color-accent-50)', color: 'var(--color-action)',
                  borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 11,
                }}>
                  {client.currency || 'ZMW'}
                </span>
                {client.status === 'archived' && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    Archived
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── New client modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <ClientFormModal
          title="New Client"
          submitLabel="Save Client"
          initialValues={NEW_CLIENT_DEFAULTS}
          onClose={() => setModalOpen(false)}
          onSubmit={async (form) => {
            const res = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            })
            const json = await res.json()
            if (res.ok && json.data) {
              handleSaved(json.data)
            } else {
              throw new Error('Failed to save client')
            }
          }}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
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
