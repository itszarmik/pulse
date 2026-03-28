'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'
import { usePlan } from '@/hooks/usePlan'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/import', label: 'Import' },
  { href: '/spend', label: 'AI Spend' },
  { href: '/creative', label: 'Creative' },
  { href: '/variants', label: 'Variants' },
  { href: '/ugc', label: 'UGC' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/billing', label: 'Billing' },
  { href: '/settings', label: 'Settings' },
]

const PLAN_LABELS = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' }

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const { plan } = usePlan()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('alerts').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('read', false)
      .then(({ count }) => setUnread(count || 0))
  }, [user])

  return (
    <nav className="sticky top-0 z-50 flex items-center gap-0.5 px-6 h-[52px] border-b"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <Link href="/" className="flex items-center gap-2 mr-4 no-underline shrink-0">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
            <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
          </svg>
        </div>
        <span className="font-mono font-bold text-[15px]" style={{ color: 'var(--text)' }}>Pulse</span>
      </Link>

      {isSignedIn && NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href}
            className={clsx('px-2 py-1.5 rounded-md text-[12px] font-medium transition-all no-underline whitespace-nowrap relative',
              active ? 'text-[var(--teal)] bg-[var(--teal-dim)]' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
            {label}
            {label === 'Alerts' && unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                style={{ background: 'var(--danger)', color: 'white' }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </Link>
        )
      })}

      <div className="ml-auto flex items-center gap-2 shrink-0 pl-2">
        {isSignedIn ? (
          <>
            <Link href="/billing"
              className="text-[11px] font-semibold px-2.5 py-[3px] rounded-full border no-underline hover:opacity-80 whitespace-nowrap"
              style={{ color: 'var(--teal)', background: 'var(--teal-dim)', borderColor: 'var(--teal-dim2)' }}>
              {PLAN_LABELS[plan] || 'Free'} Plan
            </Link>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-[7px] text-[12px] font-medium border whitespace-nowrap"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'transparent' }}>
                Log In
              </button>
            </SignInButton>
            <Link href="/sign-up" className="px-3 py-1.5 rounded-[7px] text-[12px] font-semibold no-underline whitespace-nowrap"
              style={{ background: 'var(--teal)', color: '#001a12' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}