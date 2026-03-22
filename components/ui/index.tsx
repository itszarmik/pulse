import clsx from 'clsx'
import { ReactNode } from 'react'

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={clsx('rounded-xl border p-5 transition-colors', className)}
      style={{ background: 'var(--bg2)', borderColor: 'var(--border)', ...style }}>
      {children}
    </div>
  )
}

export function KpiCard({ label, value, change, changeLabel, icon, highlight }: {
  label: string; value: string; change: number; changeLabel: string; icon: ReactNode; highlight?: boolean
}) {
  const up = change >= 0
  return (
    <div className="rounded-xl border p-[18px_20px] transition-colors hover:border-[var(--border2)]"
      style={{ background: highlight ? 'linear-gradient(135deg,rgba(0,212,160,0.08),rgba(0,212,160,0.03))' : 'var(--bg2)', borderColor: highlight ? 'rgba(0,212,160,0.25)' : 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>{label}</span>
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--teal-dim)' }}>
          <span style={{ color: 'var(--teal)' }}>{icon}</span>
        </div>
      </div>
      <div className="font-mono text-[26px] font-semibold tracking-tight" style={{ color: highlight ? 'var(--teal)' : 'var(--text)' }}>{value}</div>
      <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: up ? 'var(--teal)' : 'var(--danger)' }}>
        {up ? '▲' : '▼'} {changeLabel}
      </div>
    </div>
  )
}

export function Button({ children, onClick, variant = 'default', size = 'md', disabled, className, type = 'button' }: {
  children: ReactNode; onClick?: () => void; variant?: 'default' | 'primary' | 'ghost'
  size?: 'sm' | 'md'; disabled?: boolean; className?: string; type?: 'button' | 'submit'
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer border'
  const sizes = { sm: 'px-3 py-1.5 text-[12px]', md: 'px-4 py-2 text-[13px]' }
  const variants = {
    default: 'bg-[var(--bg3)] border-[var(--border2)] text-[var(--text)] hover:bg-[var(--bg4)]',
    primary: 'bg-[var(--teal)] border-[var(--teal)] text-[#001a12] font-semibold hover:bg-[var(--teal-dark)] hover:border-[var(--teal-dark)]',
    ghost: 'bg-transparent border-transparent text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={clsx(base, sizes[size], variants[variant], disabled && 'opacity-50 cursor-not-allowed', className)}>
      {children}
    </button>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-[rgba(0,212,160,0.1)] text-[var(--teal)]',
    Paused: 'bg-[rgba(255,170,68,0.1)] text-[var(--warn)]',
    Ended: 'bg-[rgba(255,92,92,0.1)] text-[var(--danger)]',
  }
  return <span className={clsx('inline-flex items-center gap-1 px-2 py-[3px] rounded-[4px] text-[11px] font-semibold', styles[status] || styles.Ended)}>{status}</span>
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h1>
        {subtitle && <p className="text-[13px]" style={{ color: 'var(--text2)' }}>{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="w-9 h-5 rounded-[10px] border relative transition-colors"
      style={{ background: on ? 'var(--teal)' : 'var(--bg4)', borderColor: on ? 'var(--teal)' : 'var(--border2)' }}>
      <span className="absolute w-3.5 h-3.5 rounded-full bg-white top-[2px] left-[2px] transition-transform"
        style={{ transform: on ? 'translateX(16px)' : 'none' }} />
    </button>
  )
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span className="inline-block rounded-full border-2 border-t-transparent animate-spin"
      style={{ width: size, height: size, borderColor: 'var(--border2)', borderTopColor: 'var(--teal)' }} />
  )
}
