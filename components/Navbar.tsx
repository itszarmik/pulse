'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/import', label: 'Import' },
  { href: '/variants', label: 'Variants' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-50 flex items-center gap-1 px-7 h-[52px] border-b"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <Link href="/" className="flex items-center gap-2 mr-7 no-underline">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: 'var(--teal)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white" />
            <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14" />
          </svg>
        </div>
        <span className="font-mono font-bold text-[15px]" style={{ color: 'var(--text)' }}>Pulse</span>
      </Link>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} className={clsx(
            'px-3 py-1.5 rounded-md text-[13px] font-medium transition-all no-underline',
            active ? 'text-[var(--teal)] bg-[var(--teal-dim)]' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]'
          )}>{label}</Link>
        )
      })}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[11px] font-semibold px-2.5 py-[3px] rounded-full border"
          style={{ color: 'var(--teal)', background: 'var(--teal-dim)', borderColor: 'var(--teal-dim2)' }}>
          Pro Plan
        </span>
        <button className="px-4 py-1.5 rounded-[7px] text-[13px] font-semibold transition-colors"
          style={{ background: 'var(--teal)', color: '#001a12' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-dark)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--teal)')}>
          Log In
        </button>
      </div>
    </nav>
  )
}
