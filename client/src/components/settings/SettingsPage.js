'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { IconUpload, IconLogout } from '@tabler/icons-react'
import { useSession, signOut } from '@/lib/auth-client'
import { formatDate } from '@/lib/utils'

// ─── Shared styles ────────────────────────────────────────────────────────────

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  marginBottom: 12,
  border: '0.5px solid var(--color-border)',
}

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

function Field({ label, children }) {
  return (
    <div>
      <label style={labelBase}>{label}</label>
      {children}
    </div>
  )
}

function saveButtonStyle() {
  return {
    height: 40,
    padding: '0 20px',
    background: 'var(--color-action)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
  }
}

function DetailRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: last ? 'none' : '0.5px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [branding, setBranding] = useState(null)
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState({ businessName: '', phone: '', website: '' })
  const [payment, setPayment] = useState({
    bankName: '', accountName: '', accountNumber: '', mobileMoneyNumber: '', paymentInstructions: '',
  })
  const [saving, setSaving] = useState({ profile: false, payment: false })
  const [toast, setToast] = useState(null)

  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    fetch('/api/branding')
      .then(r => r.json())
      .then(({ data }) => {
        setBranding(data || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (branding) {
      setProfile({
        businessName: branding.businessName || session?.user?.name || '',
        phone: branding.phone || '',
        website: branding.website || '',
      })
      setPayment({
        bankName: branding.bankName || '',
        accountName: branding.accountName || '',
        accountNumber: branding.accountNumber || '',
        mobileMoneyNumber: branding.mobileMoneyNumber || '',
        paymentInstructions: branding.paymentInstructions || '',
      })
    } else if (session?.user) {
      setProfile(prev => ({ ...prev, businessName: prev.businessName || session.user.name || '' }))
    }
  }, [branding, session])

  function fireToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function saveSection(key, fields, successMsg) {
    setSaving(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setBranding(json.data)
        fireToast(successMsg)
      } else {
        fireToast('Failed to save. Please try again.')
      }
    } catch {
      fireToast('Failed to save. Please try again.')
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  function handleLogoClick() {
    fileInputRef.current?.click()
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      fireToast('Logo must be a PNG or JPG image.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      fireToast('Logo must be 2MB or smaller.')
      e.target.value = ''
      return
    }

    // TODO: upload to Cloudflare R2 once file storage is wired up (post-launch
    // per claude.md). For now we just preview the selected file locally.
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleRemoveLogo() {
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const px = { paddingLeft: 20, paddingRight: 20 }
  const currentLogoUrl = logoPreview || branding?.logoUrl

  return (
    <div style={{ background: 'var(--color-page-bg)', minHeight: '100vh' }}>

      {/* ── Mobile sticky top bar ───────────────────────────────────────────── */}
      <div className="flex lg:hidden" style={{
        position: 'sticky', top: 0, zIndex: 10, height: 56,
        background: '#fff', borderBottom: '0.5px solid var(--color-border)',
        alignItems: 'center', padding: '0 16px',
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Settings
        </span>
      </div>

      <div style={{ ...px, maxWidth: 640, margin: '0 auto', paddingTop: 16, paddingBottom: 96 }} className="lg:px-6">

        {/* ── Desktop page title ────────────────────────────────────────────── */}
        <div className="hidden lg:flex" style={{ marginBottom: 20, paddingTop: 24, alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Settings
          </h1>
        </div>

        {loading ? (
          <>
            <div className="skeleton" style={{ height: 220, borderRadius: 16, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 320, borderRadius: 16, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          </>
        ) : (
          <>
            {/* ── Section 1: Business profile ───────────────────────────────── */}
            <div style={card}>
              <div className="section-label">BUSINESS PROFILE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <Field label="Business name*">
                  <input
                    type="text"
                    value={profile.businessName}
                    onChange={e => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                    style={inputBase}
                    placeholder="Your business name"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    style={inputBase}
                    placeholder="+260 ..."
                  />
                </Field>
                <Field label="Website">
                  <input
                    type="url"
                    value={profile.website}
                    onChange={e => setProfile(prev => ({ ...prev, website: e.target.value }))}
                    style={inputBase}
                    placeholder="https://yourbusiness.com"
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  onClick={() => saveSection('profile', profile, 'Profile saved')}
                  disabled={saving.profile}
                  style={{ ...saveButtonStyle(), opacity: saving.profile ? 0.7 : 1 }}
                  className="w-full lg:w-auto"
                >
                  {saving.profile ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>

            {/* ── Section 2: Business logo ──────────────────────────────────── */}
            <div style={card}>
              <div className="section-label">BUSINESS LOGO</div>
              <div style={{ marginTop: 12 }}>
                {currentLogoUrl ? (
                  <div>
                    <img
                      src={currentLogoUrl}
                      alt="Business logo"
                      style={{
                        width: 80, height: 80, objectFit: 'contain', borderRadius: 12,
                        border: '0.5px solid var(--color-border)', display: 'block',
                      }}
                    />
                    <button
                      onClick={handleRemoveLogo}
                      style={{
                        marginTop: 10, background: 'transparent', border: 'none',
                        color: 'var(--color-overdue-text)', fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleLogoClick}
                    style={{
                      border: '1.5px dashed var(--color-border)', borderRadius: 12,
                      padding: 24, textAlign: 'center', background: 'var(--color-page-bg)',
                      cursor: 'pointer',
                    }}
                  >
                    <IconUpload size={24} stroke={1.5} style={{ color: 'var(--color-accent-100)' }} />
                    <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--color-action)' }}>
                      Upload logo
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      PNG or JPG, max 2MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* ── Section 3: Payment details ────────────────────────────────── */}
            <div style={card}>
              <div className="section-label">PAYMENT DETAILS</div>
              <p style={{ margin: '6px 0 16px', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                These appear on every invoice you send.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Bank name">
                  <input
                    type="text"
                    value={payment.bankName}
                    onChange={e => setPayment(prev => ({ ...prev, bankName: e.target.value }))}
                    style={inputBase}
                  />
                </Field>
                <Field label="Account name">
                  <input
                    type="text"
                    value={payment.accountName}
                    onChange={e => setPayment(prev => ({ ...prev, accountName: e.target.value }))}
                    style={inputBase}
                  />
                </Field>
                <Field label="Account number">
                  <input
                    type="text"
                    value={payment.accountNumber}
                    onChange={e => setPayment(prev => ({ ...prev, accountNumber: e.target.value }))}
                    style={inputBase}
                  />
                </Field>
                <Field label="Mobile money number">
                  <input
                    type="tel"
                    value={payment.mobileMoneyNumber}
                    onChange={e => setPayment(prev => ({ ...prev, mobileMoneyNumber: e.target.value }))}
                    style={inputBase}
                    placeholder="+260 97 000 0000"
                  />
                </Field>
                <Field label="Payment instructions (optional)">
                  <textarea
                    value={payment.paymentInstructions}
                    onChange={e => setPayment(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                    style={{ ...inputBase, height: 'auto', minHeight: 80, padding: '10px 12px', resize: 'vertical' }}
                    placeholder="Any additional payment instructions for your clients..."
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  onClick={() => saveSection('payment', payment, 'Payment details saved')}
                  disabled={saving.payment}
                  style={{ ...saveButtonStyle(), opacity: saving.payment ? 0.7 : 1 }}
                  className="w-full lg:w-auto"
                >
                  {saving.payment ? 'Saving…' : 'Save Payment Details'}
                </button>
              </div>
            </div>

            {/* ── Section 4: Account ────────────────────────────────────────── */}
            <div style={card}>
              <div className="section-label">ACCOUNT</div>
              <div style={{ marginTop: 12 }}>
                <DetailRow label="Email" value={session?.user?.email || '—'} />
                <DetailRow label="Member since" value={formatDate(session?.user?.createdAt) || '—'} last />
              </div>
              <div style={{ borderTop: '0.5px solid var(--color-border)', marginTop: 4, paddingTop: 16 }}>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%', height: 40, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    background: 'var(--color-overdue-bg)', color: 'var(--color-overdue-text)',
                    border: '0.5px solid rgba(163,45,45,0.2)', borderRadius: 10,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <IconLogout size={16} stroke={1.5} />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', borderLeft: '3px solid var(--color-action)',
          borderRadius: 8, padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: 13, color: 'var(--color-text-primary)',
          zIndex: 100, whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
