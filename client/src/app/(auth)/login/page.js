'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      setError(err.message || 'Sign in failed. Check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '32px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '22px', fontWeight: 500, color: '#185FA5', marginBottom: '6px' }}>PayRush</div>
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#111827' }}>Welcome back</div>
          <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Sign in to your account</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ width: '100%', height: '40px', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '0 12px', fontSize: '14px', color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', height: '40px', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '0 12px', fontSize: '14px', color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
            />
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6B7280' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#185FA5', fontWeight: 500, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>

      </div>
    </div>
  )
}
