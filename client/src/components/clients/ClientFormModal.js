'use client'

import { useState } from 'react'
import { IconX } from '@tabler/icons-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['ZMW', 'USD', 'EUR', 'GBP', 'ZAR', 'KES', 'UGX', 'TZS', 'NGN']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

const labelBase = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 5,
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-overdue-text)' }}>
      {msg}
    </p>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
//
// Shared by the "new client" and "edit client" flows. `onSubmit` receives the
// validated form values and must perform the API call — it should throw to
// surface an inline error, or resolve to close the modal on success.

export function ClientFormModal({ title, submitLabel, initialValues, onClose, onSubmit }) {
  const [form, setForm] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch {
      setFormError('Failed to save client. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '#fff', borderRadius: 16, padding: 24,
          maxWidth: 440, width: 'calc(100% - 32px)', zIndex: 100,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <IconX size={20} stroke={1.5} style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelBase}>Name*</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                style={inputBase}
                placeholder="Client name"
              />
              <FieldError msg={errors.name} />
            </div>

            <div>
              <label style={labelBase}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                style={inputBase}
                placeholder="client@example.com"
              />
              <FieldError msg={errors.email} />
            </div>

            <div>
              <label style={labelBase}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                style={inputBase}
                placeholder="+260 ..."
              />
            </div>

            <div>
              <label style={labelBase}>Address</label>
              <textarea
                value={form.address}
                onChange={e => update('address', e.target.value)}
                style={{ ...inputBase, height: 'auto', minHeight: 60, padding: '10px 12px', resize: 'vertical' }}
                placeholder="Business address"
              />
            </div>

            <div>
              <label style={labelBase}>Currency</label>
              <select
                value={form.currency}
                onChange={e => update('currency', e.target.value)}
                style={{ ...inputBase, cursor: 'pointer' }}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <FieldError msg={formError} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40, padding: '0 20px', background: 'transparent',
                border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 10,
                fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: 40, padding: '0 20px', background: 'var(--color-action)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontSize: 14, fontWeight: 500,
                cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
