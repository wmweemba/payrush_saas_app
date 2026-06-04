'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/auth-client'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', businessName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signUp.email({
      name: form.name,
      businessName: form.businessName,
      email: form.email,
      password: form.password,
      callbackURL: '/dashboard',
    })
    if (err) {
      setError(err.message || 'Sign up failed. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    height: '40px',
    border: '0.5px solid rgba(0,0,0,0.12)',
    borderRadius: '8px',
    padding: '0 12px',
    fontSize: '14px',
    color: '#111827',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '32px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#185FA5', marginBottom: '6px' }}>PayRush</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#111827' }}>Create your account</div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Invoice faster. Get paid sooner.</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input name="name" type="text" value={form.name} onChange={handleChange} required placeholder="Jane Banda" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Business name</label>
            <input name="businessName" type="text" value={form.businessName} onChange={handleChange} required placeholder="Banda Consulting" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Minimum 8 characters" minLength={8} style={inputStyle} />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: '#A32D2D', padding: '10px 12px', background: '#FCEBEB', borderRadius: '8px', border: '0.5px solid rgba(163,45,45,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ height: '44px', background: loading ? 'rgba(24,95,165,0.6)' : '#185FA5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6B7280' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#185FA5', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>

      </div>
    </div>
  )
}
