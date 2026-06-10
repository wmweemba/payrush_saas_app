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
]

const bottomItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: IconSettings },
]

function NavItem({ href, label, Icon, pathname }) {
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '40px',
        padding: active ? '9px 18px' : '9px 18px',
        marginLeft: active ? '8px' : '0',
        marginRight: active ? '8px' : '0',
        fontSize: '13px',
        fontWeight: 400,
        borderRadius: active ? '8px' : '0',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        transition: 'background 150ms ease, color 150ms ease',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <Icon size={16} stroke={1.5} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        background: 'var(--color-sidebar)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo area */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 500, lineHeight: 1.2 }}>
          BazaBooks
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '3px' }}>
          Work. Invoice. Get paid.
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, paddingTop: '8px' }}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} pathname={pathname} />
        ))}
      </nav>

      {/* Bottom-pinned items */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '12px 0' }}>
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} pathname={pathname} />
        ))}
      </div>
    </aside>
  )
}
