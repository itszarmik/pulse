'use client'
import { useState } from 'react'
import { PageHeader, Button, KpiCard, StatusBadge } from '@/components/ui'
import { CLIENT_ACCOUNTS } from '@/lib/data'
import type { ClientAccount } from '@/types'
import { Users, Layers, Star, Zap } from 'lucide-react'

function AccountRow({ account }: { account: ClientAccount }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b transition-colors hover:bg-[var(--bg3)]"
      style={{ borderColor:'var(--border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-semibold shrink-0"
        style={{ background:'var(--bg4)', color:'var(--teal)' }}>{account.initials}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{account.name}</div>
        <div className="text-[11px]" style={{ color:'var(--text2)' }}>
          {account.platforms.join(', ')} · £{account.monthlySpend.toLocaleString()}/mo spend
        </div>
      </div>
      <div className="flex gap-1.5">
        {account.platforms.map(p => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded border font-medium"
            style={{ background:'var(--bg4)', borderColor:'var(--border)', color:'var(--text2)' }}>{p}</span>
        ))}
      </div>
      <div className="text-right w-20 shrink-0">
        <div className="font-mono text-[13px] font-semibold"
          style={{ color:account.roas>=4?'var(--teal)':account.roas>=3?'var(--warn)':'var(--danger)' }}>
          {account.roas}x
        </div>
        <div className="text-[10px]" style={{ color:'var(--text3)' }}>ROAS</div>
      </div>
      <StatusBadge status={account.status} />
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm">View</Button>
        <Button size="sm">Analyse</Button>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const [showModal, setShowModal] = useState(false)
  const avgRoas = CLIENT_ACCOUNTS.reduce((s,a) => s+a.roas, 0) / CLIENT_ACCOUNTS.length
  const activePlatforms = [...new Set(CLIENT_ACCOUNTS.flatMap(a => a.platforms))].length

  return (
    <>
      <PageHeader title="Client Accounts" subtitle="Manage all your client ad accounts, platform connections, and optimisation insights.">
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Create New Client Account</Button>
      </PageHeader>
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <KpiCard label="Total Accounts" value={String(CLIENT_ACCOUNTS.length)} change={1} changeLabel="1 new this month" icon={<Users size={14} />} />
        <KpiCard label="Active Platforms" value={String(activePlatforms)} change={0} changeLabel="no change" icon={<Layers size={14} />} />
        <KpiCard label="Avg ROAS" value={`${avgRoas.toFixed(1)}x`} change={0.3} changeLabel="0.3x from last month" icon={<Star size={14} />} highlight />
        <KpiCard label="Unactioned Suggestions" value="7" change={-2} changeLabel="2 resolved this week" icon={<Zap size={14} />} />
      </div>
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[15px] font-semibold">All Client Accounts</span>
        <div className="flex gap-2">
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none"
            style={{ background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }}>
            <option>All Statuses</option><option>Active</option><option>Paused</option>
          </select>
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none"
            style={{ background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }}>
            <option>Sort: ROAS (high–low)</option>
            <option>Sort: Spend (high–low)</option>
            <option>Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
        {CLIENT_ACCOUNTS.map(account => <AccountRow key={account.id} account={account} />)}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.7)' }} onClick={() => setShowModal(false)}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{ background:'var(--bg2)', borderColor:'var(--border2)' }} onClick={e => e.stopPropagation()}>
            <div className="text-[16px] font-semibold mb-4">New Client Account</div>
            <div className="mb-3">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Client Name</label>
              <input type="text" placeholder="e.g. Acme Brand Co."
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                style={{ background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }} />
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Platforms</label>
              <div className="flex gap-2">
                {['Meta','Google','TikTok'].map(p => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer text-[13px]">
                    <input type="checkbox" className="accent-[var(--teal)]" />{p}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setShowModal(false)}>Create Account</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
