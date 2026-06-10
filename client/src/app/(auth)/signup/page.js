'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { IconAlertCircle } from '@tabler/icons-react'
import { signUp } from '@/lib/auth-client'

const inputStyle = {
  width: '100%',
  height: '40px',
  border: '0.5px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '14px',
  color: 'var(--color-text-primary)',
  background: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
}

export default function SignupPage() {
  const [form, setForm] = useState({ businessName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const errorRef = useRef(null)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  function showError(message) {
    setError(message)
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ block: 'nearest' })
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.businessName || !form.email || !form.password || !form.confirmPassword) {
      showError('Please fill in all fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      showError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      showError('Password must be at least 8 characters.')
      return
    }

    setError('')
    setLoading(true)
    const { error: err } = await signUp.email({
      email: form.email,
      password: form.password,
      name: form.businessName,
      businessName: form.businessName,
      callbackURL: '/dashboard',
    })
    if (err) {
      setLoading(false)
      showError(err.message || 'Sign up failed. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: '20px', padding: '32px 28px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-action)' }}>BazaBooks</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Work. Invoice. Get paid.</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: '5px' }}>Business name</label>
            <input name="businessName" type="text" value={form.businessName} onChange={handleChange} placeholder="Acme Consulting" style={inputStyle} />
          </div>

          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={inputStyle} />
          </div>

          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" style={inputStyle} />
          </div>

          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: '5px' }}>Confirm password</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" style={inputStyle} />
          </div>

          {error && (
            <div ref={errorRef} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-overdue-text)', padding: '10px 12px', background: 'var(--color-overdue-bg)', borderRadius: '8px' }}>
              <IconAlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '48px',
              background: loading ? 'rgba(24,95,165,0.6)' : 'var(--color-action)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '20px',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-action)' }}>
            Sign in
          </Link>
        </div>

      </div>
    </div>
  )
}
