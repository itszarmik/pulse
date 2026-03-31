'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, UserButton, SignInButton } from '@clerk/nextjs'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Zap, Palette, Hash, Calculator, FileText, Bell, Settings, Users, CreditCard, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

// Primary nav — always visible
const PRIMARY_LINKS = [
  { href: '/spend', label: 'AI Spend' },
  { href: '/reports', label: 'Reports' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/accounts', label: 'Clients' },
]

// Tools dropdown
const TOOL_LINKS = [
  { href: '/creative', label: 'Creative Intelligence', icon: Palette, desc: 'What ad styles convert best' },
  { href: '/variants', label: 'Ad Variant Generator', icon: Zap, desc: 'AI-written ad copy' },
  { href: '/ugc', label: 'UGC Tracker', icon: Hash, desc: 'Influencer campaign ROI' },
  { href: '/calculator', label: 'ROI Calculator', icon: Calculator, desc: 'Project campaign performance' },
  { href: '/score', label: 'Pulse Score', icon: FileText, desc: 'Your agency efficiency rating' },
  { href: '/import', label: 'Import Data', icon: ArrowRight, desc: 'Connect platforms or upload CSV' },
  { href: '/integrations', label: 'Integrations', icon: ArrowRight, desc: 'Shopify & WooCommerce' },
]

export function Navbar() {
  const pathname = usePathname()
  const { isSignedIn } = useUser()
  const [toolsOpen, setToolsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setToolsOpen(false) }, [pathname])

  const toolsActive = TOOL_LINKS.some(l => pathname === l.href)

  return (
    <nav
      className="sticky top-0 z-50 flex items-center gap-1 px-6 h-[52px] border-b"
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <Link href="/spend" className="flex items-center gap-2 mr-6 no-underline shrink-0">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white" />
            <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14" />
          </svg>
        </div>
        <span className="font-mono font-bold text-[15px]" style={{ color: 'var(--text)' }}>Pulse</span>
      </Link>

      {/* Primary nav */}
      {isSignedIn && (
        <>
          {PRIMARY_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-[13px] font-medium transition-all no-underline whitespace-nowrap',
                  active
                    ? 'text-[var(--teal)] bg-[var(--teal-dim)]'
                    : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]'
                )}>
                {label}
              </Link>
            )
          })}

          {/* Tools dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setToolsOpen(o => !o)}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
                toolsActive || toolsOpen
                  ? 'text-[var(--teal)] bg-[var(--teal-dim)]'
                  : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]'
              )}>
              Tools
              <ChevronDown size={13} className={clsx('transition-transform', toolsOpen && 'rotate-180')} />
            </button>

            {toolsOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 rounded-xl border overflow-hidden z-50"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', width: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Tools & Features</span>
                </div>
                {TOOL_LINKS.map(({ href, label, icon: Icon, desc }) => {
                  const active = pathname === href
                  return (
                    <Link key={href} href={href}
                      className={clsx(
                        'flex items-start gap-3 px-3 py-2.5 no-underline transition-colors',
                        active ? 'bg-[var(--teal-dim)]' : 'hover:bg-[var(--bg3)]'
                      )}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: active ? 'rgba(0,212,160,0.2)' : 'var(--bg3)' }}>
                        <Icon size={13} style={{ color: active ? 'var(--teal)' : 'var(--text2)' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold" style={{ color: active ? 'var(--teal)' : 'var(--text)' }}>{label}</div>
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{desc}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {isSignedIn ? (
          <>
            {/* Settings + Billing as icon links */}
            <Link href="/billing"
              className={clsx('p-1.5 rounded-lg transition-colors no-underline', pathname === '/billing' ? 'text-[var(--teal)] bg-[var(--teal-dim)]' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
              <CreditCard size={15} />
            </Link>
            <Link href="/settings"
              className={clsx('p-1.5 rounded-lg transition-colors no-underline mr-1', pathname === '/settings' ? 'text-[var(--teal)] bg-[var(--teal-dim)]' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
              <Settings size={15} />
            </Link>

            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          </>
        ) : (
          <>
            <SignInButton mode="modal">
              <button className="px-3 py-1.5 rounded-[7px] text-[13px] font-medium transition-colors border"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)', background: 'transparent' }}>
                Log in
              </button>
            </SignInButton>
            <Link href="/sign-up"
              className="px-4 py-1.5 rounded-[7px] text-[13px] font-semibold no-underline"
              style={{ background: 'var(--teal)', color: '#001a12' }}>
              Get started →
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
