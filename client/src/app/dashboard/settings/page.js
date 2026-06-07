'use client'

import dynamic from 'next/dynamic'

const SettingsPage = dynamic(
  () => import('@/components/settings/SettingsPage'),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: 'var(--color-page-bg)' }} />
    ),
  }
)

export default function Settings() {
  return <SettingsPage />
}
