'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'
import { usePlan } from '@/hooks/usePlan'
import clsx from 'clsx'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/import', label: 'Import' },
  { href: '/spend', label: 'AI Spend' },
  { href: '/creative', label: 'Creative' },
  { href: '/variants', label: 'Variants' },
  { href: '/ugc', label: 'UGC' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/reports', label: 'Reports' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
]

const PLAN_LABELS = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const { plan } = usePlan()

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-0.5 px-4 h-[52px] border-b overflow-x-auto"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)', scrollbarWidth: 'none' }}>
      <Link href="/" className="flex items-center gap-1.5 mr-4 no-underline shrink-0">
        <div className="w-6 h-6 rounded-[6px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
            <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
          </svg>
        </div>
        <span className="font-mono font-bold text-[14px]" style={{ color: 'var(--text)' }}>Pulse</span>
      </Link>

      {isSignedIn && NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href}
            className={clsx('px-2 py-1 rounded-md text-[11px] font-medium transition-all no-underline whitespace-nowrap shrink-0',
              active ? 'text-[var(--teal)] bg-[var(--teal-dim)]' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
            {label}
          </Link>
        )
      })}

      <div className="ml-auto flex items-center gap-2 shrink-0 pl-3">
        {isSignedIn ? (
          <>
            <Link href="/billing"
              className="text-[10px] font-semibold px-2 py-[3px] rounded-full border no-underline hover:opacity-80 whitespace-nowrap shrink-0"
              style={{ color: 'var(--teal)', background: 'var(--teal-dim)', borderColor: 'var(--teal-dim2)' }}>
              {PLAN_LABELS[plan] || 'Free'}
            </Link>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium border whitespace-nowrap"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'transparent' }}>
                Log In
              </button>
            </SignInButton>
            <Link href="/sign-up" className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold no-underline whitespace-nowrap"
              style={{ background: 'var(--teal)', color: '#001a12' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}