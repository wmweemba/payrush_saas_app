'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconHome,
  IconFileInvoice,
  IconUser,
  IconSettings,
} from '@tabler/icons-react'

const navItems = [
  { label: 'Home', href: '/dashboard', icon: IconHome },
  { label: 'Invoices', href: '/dashboard/invoices', icon: IconFileInvoice },
  { label: 'Clients', href: '/dashboard/clients', icon: IconUser },
  { label: 'Settings', href: '/dashboard/settings', icon: IconSettings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#FFFFFF',
        borderTop: '1px solid var(--color-border)',
        height: '64px',
        padding: '8px 0 12px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 50,
      }}
      className="lg:hidden"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              color: active ? 'var(--color-action)' : 'var(--color-text-tertiary)',
              textDecoration: 'none',
              minWidth: '44px',
              minHeight: '44px',
              justifyContent: 'center',
              padding: '4px 8px',
              transition: 'color 150ms ease',
            }}
          >
            <Icon size={20} stroke={1.5} />
            <span style={{ fontSize: '10px', lineHeight: 1 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
