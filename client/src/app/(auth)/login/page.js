'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IconAlertCircle } from '@tabler/icons-react'
import { signIn } from '@/lib/auth-client'

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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function clearError() {
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
    })
    if (err) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', border: '0.5px solid var(--color-border)', borderRadius: '20px', padding: '32px 28px' }}>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-action)' }}>PayRush</div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Invoice faster. Get paid sooner.</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="section-label" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label className="section-label">Password</label>
              <Link href="#" style={{ fontSize: '12px', color: 'var(--color-action)' }}>Forgot password?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-overdue-text)', padding: '10px 12px', background: 'var(--color-overdue-bg)', borderRadius: '8px' }}>
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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--color-action)' }}>
            Sign up
          </Link>
        </div>

      </div>
    </div>
  )
}
