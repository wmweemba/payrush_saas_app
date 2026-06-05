'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { useSession } from '@/lib/auth-client'
import { formatAmount, formatDate } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['ZMW', 'USD', 'EUR', 'GBP', 'ZAR', 'KES', 'UGX', 'TZS', 'NGN']

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function makeInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`
}

function makeItem() {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: '' }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputBase = {
  height: 40,
  border: '0.5px solid var(--color-border)',
  borderRadius: 8,
  padding: '0 10px',
  fontSize: 13,
  color: 'var(--color-text-primary)',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelBase = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 5,
}

const ghostBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-action)',
  fontSize: 13,
  padding: '4px 0',
  fontFamily: 'inherit',
}

const primaryBtn = (disabled) => ({
  width: '100%',
  height: 48,
  background: 'var(--color-action)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 500,
  cursor: disabled ? 'default' : 'pointer',
  fontFamily: 'inherit',
  opacity: disabled ? 0.7 : 1,
})

// ─── Error message ─────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-overdue-text)' }}>
      {msg}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InvoiceForm() {
  const router = useRouter()
  const { data: session } = useSession()

  const [invoiceNumber] = useState(makeInvoiceNumber)

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    currency: 'ZMW',
    dueDate: defaultDueDate(),
    notes: '',
    items: [makeItem()],
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  // Client autocomplete
  const [clientQuery, setClientQuery] = useState('')
  const [allClients, setAllClients] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Branding
  const [branding, setBranding] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(({ data }) => setAllClients(data || []))
      .catch(() => {})

    fetch('/api/branding')
      .then(r => r.json())
      .then(({ data }) => setBranding(data || null))
      .catch(() => {})
  }, [])

  // ── Derived values ─────────────────────────────────────────────────────────

  const clientMatches = useMemo(() => {
    if (!clientQuery.trim() || clientQuery.length < 2) return []
    const q = clientQuery.toLowerCase()
    return allClients.filter(c => c.name.toLowerCase().includes(q)).slice(0, 6)
  }, [clientQuery, allClients])

  const subtotal = useMemo(
    () => form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0),
    [form.items]
  )
  const total = subtotal

  const businessName = branding?.businessName || session?.user?.name || 'Your Business'
  const hasPaymentDetails = branding && (branding.bankName || branding.accountNumber || branding.mobileMoneyNumber)

  // ── State updaters ─────────────────────────────────────────────────────────

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, makeItem()] }))
  }

  function removeItem(id) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }))
  }

  function setItemField(id, field, value) {
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.id === id ? { ...i, [field]: value } : i),
    }))
    if (errors.items) setErrors(e => ({ ...e, items: null }))
  }

  // ── Validation & submit ────────────────────────────────────────────────────

  function validate() {
    const errs = {}
    if (!form.customerName.trim()) errs.customerName = 'Client name is required'
    const hasValid = form.items.some(i => i.description.trim() && parseFloat(i.unitPrice) > 0)
    if (!hasValid) errs.items = 'Add at least one item with a description and price'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail || undefined,
          currency: form.currency,
          dueDate: form.dueDate || undefined,
          paymentNotes: form.notes || undefined,
          status: 'sent',
          items: form.items
            .filter(i => i.description.trim() && parseFloat(i.unitPrice) > 0)
            .map(i => ({
              description: i.description,
              quantity: parseFloat(i.quantity) || 1,
              unitPrice: parseFloat(i.unitPrice),
            })),
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.id) {
        router.push(`/dashboard/invoices/${json.data.id}`)
      } else {
        fireToast('Failed to create invoice. Please try again.')
      }
    } catch {
      fireToast('Failed to create invoice. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function fireToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  // ── Form fields ────────────────────────────────────────────────────────────

  const formFields = (
    <>
      {/* 1 — Bill to */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelBase}>Bill To</label>
        <div style={{ position: 'relative' }}>
          <input
            style={{
              ...inputBase,
              border: errors.customerName
                ? '1px solid var(--color-overdue-text)'
                : '0.5px solid var(--color-border)',
            }}
            placeholder="Client name"
            value={clientQuery !== '' ? clientQuery : form.customerName}
            onChange={e => {
              const v = e.target.value
              setClientQuery(v)
              setField('customerName', v)
              setShowDropdown(true)
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            onFocus={() => clientQuery.length >= 2 && setShowDropdown(true)}
          />
          <FieldError msg={errors.customerName} />

          {showDropdown && clientMatches.length > 0 && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#fff', border: '0.5px solid var(--color-border)',
                borderRadius: 8, maxHeight: 200, overflowY: 'auto',
                zIndex: 20, marginTop: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              {clientMatches.map(c => (
                <div
                  key={c.id}
                  onMouseDown={() => {
                    setField('customerName', c.name)
                    setField('customerEmail', c.email || '')
                    setClientQuery(c.name)
                    setShowDropdown(false)
                  }}
                  style={{ padding: '10px 12px', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-50)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </div>
                  {c.email && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{c.email}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2 — Line items */}
      <div style={{ marginBottom: 8 }}>
        <label style={labelBase}>Line Items</label>

        {form.items.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
            <input
              style={{ ...inputBase, flex: 1 }}
              placeholder="Description"
              value={item.description}
              onChange={e => setItemField(item.id, 'description', e.target.value)}
            />
            <input
              style={{ ...inputBase, width: 56, flexShrink: 0, textAlign: 'right', padding: '0 8px' }}
              placeholder="1"
              type="number"
              min="0"
              value={item.quantity}
              onChange={e => setItemField(item.id, 'quantity', e.target.value)}
            />
            <input
              style={{ ...inputBase, width: 88, flexShrink: 0, textAlign: 'right', padding: '0 8px' }}
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={e => setItemField(item.id, 'unitPrice', e.target.value)}
            />
            <button
              onClick={() => removeItem(item.id)}
              aria-label="Remove item"
              style={{
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0,
                opacity: form.items.length === 1 ? 0 : 1,
                pointerEvents: form.items.length === 1 ? 'none' : 'auto',
              }}
            >
              <IconTrash size={16} stroke={1.5} style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          </div>
        ))}

        <FieldError msg={errors.items} />

        <button onClick={addItem} style={{ ...ghostBtn, marginTop: 4 }}>
          <IconPlus size={14} stroke={2} />
          Add line item
        </button>
      </div>

      {/* 3 — Totals */}
      <div style={{ borderTop: '0.5px solid var(--color-border)', paddingTop: 12, marginTop: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Subtotal</span>
          <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
            {formatAmount(subtotal, form.currency)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Total</span>
          <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-action)' }}>
            {formatAmount(total, form.currency)}
          </span>
        </div>
      </div>

      {/* 4 — Currency + Due date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={labelBase}>Currency</label>
          <select
            style={{ ...inputBase, cursor: 'pointer' }}
            value={form.currency}
            onChange={e => setField('currency', e.target.value)}
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelBase}>Due Date</label>
          <input
            type="date"
            style={inputBase}
            value={form.dueDate}
            onChange={e => setField('dueDate', e.target.value)}
          />
        </div>
      </div>

      {/* 5 — Notes (collapsible) */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setNotesOpen(o => !o)} style={ghostBtn}>
          {notesOpen
            ? <IconChevronUp size={14} stroke={2} />
            : <IconChevronDown size={14} stroke={2} />}
          {notesOpen ? 'Hide note' : 'Add a note'}
        </button>
        {notesOpen && (
          <textarea
            style={{
              ...inputBase,
              height: 'auto',
              minHeight: 80,
              padding: '10px 12px',
              resize: 'vertical',
              marginTop: 8,
            }}
            placeholder="Payment instructions, thank you note, or any other details..."
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
          />
        )}
      </div>
    </>
  )

  // ── Preview card ───────────────────────────────────────────────────────────

  const previewCard = (
    <div
      style={{
        background: '#fff', borderRadius: 12, padding: 32,
        border: '0.5px solid var(--color-border)', maxWidth: 480, margin: '0 auto',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {businessName}
        </span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Invoice
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 2 }}>
            {invoiceNumber}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '0.5px solid var(--color-border)', margin: '16px 0' }} />

      {/* Billed to */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 6 }}>Billed To</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {form.customerName || (
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>Client name</span>
          )}
        </div>
        {form.customerEmail && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {form.customerEmail}
          </div>
        )}
        {form.dueDate && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Due: {formatDate(form.dueDate)}
          </div>
        )}
      </div>

      {/* Line items table */}
      <div style={{ marginTop: 16 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 40px 80px',
          paddingBottom: 6, borderBottom: '0.5px solid var(--color-border)',
        }}>
          {['Description', 'Qty', 'Amount'].map((h, i) => (
            <span
              key={h}
              style={{
                fontSize: 10, color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: i > 0 ? 'right' : 'left',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {form.items.map(item => {
          const amt = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
          return (
            <div
              key={item.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 40px 80px',
                padding: '5px 0',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                {item.description || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                {item.quantity}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-primary)', textAlign: 'right' }}>
                {amt > 0 ? formatAmount(amt, form.currency) : '—'}
              </span>
            </div>
          )
        })}

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderTop: '0.5px solid var(--color-border)',
          paddingTop: 10, marginTop: 4,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-action)' }}>
            {formatAmount(total, form.currency)}
          </span>
        </div>
      </div>

      {/* Payment details */}
      {hasPaymentDetails && (
        <div style={{ background: 'var(--color-page-bg)', borderRadius: 8, padding: 12, marginTop: 16 }}>
          {[
            { key: 'bankName', label: 'Bank' },
            { key: 'accountName', label: 'Account Name' },
            { key: 'accountNumber', label: 'Account Number' },
          ].map(({ key, label }) =>
            branding[key] ? (
              <div key={key} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                  {branding[key]}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative' }}>

      {/* Mobile top bar */}
      <div
        className="lg:hidden"
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          height: 56, background: '#fff',
          borderBottom: '0.5px solid var(--color-border)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <IconArrowLeft size={20} stroke={1.5} style={{ color: 'var(--color-text-primary)' }} />
        </button>
        <span
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          New Invoice
        </span>
      </div>

      {/* Content wrapper: mobile=single col, desktop=flex row */}
      <div className="lg:flex" style={{ minHeight: 'calc(100vh - 56px)' }}>

        {/* Form panel */}
        <div
          className="invoice-form-panel lg:border-r lg:overflow-y-auto lg:sticky lg:top-0 lg:h-screen"
          style={{
            background: '#fff',
            padding: '20px 20px 120px',
          }}
        >
          {/* Desktop breadcrumb */}
          <div className="hidden lg:block" style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <Link href="/dashboard/invoices" style={{ color: 'var(--color-text-secondary)' }}>
                Invoices
              </Link>
              {' › New'}
            </span>
          </div>

          {formFields}

          {/* Desktop submit button (inline, not sticky) */}
          <div className="hidden lg:block" style={{ marginTop: 8 }}>
            <button onClick={handleSubmit} disabled={submitting} style={primaryBtn(submitting)}>
              {submitting ? 'Sending…' : 'Send Invoice'}
            </button>
          </div>
        </div>

        {/* Preview panel — desktop only */}
        <div
          className="hidden lg:block lg:flex-1 lg:overflow-y-auto"
          style={{ background: 'var(--color-page-bg)', padding: 24 }}
        >
          <p
            style={{
              fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16,
            }}
          >
            Preview
          </p>
          {previewCard}
        </div>
      </div>

      {/* Mobile sticky submit */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderTop: '0.5px solid var(--color-border)',
          padding: '12px 20px 24px', zIndex: 10,
        }}
      >
        <button onClick={handleSubmit} disabled={submitting} style={primaryBtn(submitting)}>
          {submitting ? 'Sending…' : 'Send Invoice'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
            background: '#fff', borderLeft: '3px solid var(--color-overdue-text)',
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
