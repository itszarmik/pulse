'use client'
import { useState } from 'react'
import { PageHeader, Button, KpiCard, StatusBadge } from '@/components/ui'
import { CLIENT_ACCOUNTS } from '@/lib/data'
import type { ClientAccount, Platform } from '@/types'
import { Users, Layers, Star, Zap } from 'lucide-react'

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function AccountRow({ account }: { account: ClientAccount }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b transition-colors hover:bg-[var(--bg3)]"
      style={{ borderColor: 'var(--border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-semibold shrink-0"
        style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>
        {account.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{account.name}</div>
        <div className="text-[11px]" style={{ color: 'var(--text2)' }}>
          {account.platforms.join(', ')} · £{account.monthlySpend.toLocaleString()}/mo spend
        </div>
      </div>
      <div className="flex gap-1.5">
        {account.platforms.map(p => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded border font-medium"
            style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
            {p}
          </span>
        ))}
      </div>
      <div className="text-right w-20 shrink-0">
        <div className="font-mono text-[13px] font-semibold"
          style={{ color: account.roas >= 4 ? 'var(--teal)' : account.roas >= 3 ? 'var(--warn)' : 'var(--danger)' }}>
          {account.roas}x
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text3)' }}>ROAS</div>
      </div>
      <StatusBadge status={account.status} />
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm">View</Button>
        <Button size="sm">Analyse</Button>
      </div>
    </div>
  )
}

const PLATFORM_OPTIONS: Platform[] = ['Meta', 'Google', 'TikTok']

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ClientAccount[]>(CLIENT_ACCOUNTS)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [newName, setNewName] = useState('')
  const [newPlatforms, setNewPlatforms] = useState<Platform[]>([])
  const [newSpend, setNewSpend] = useState('')
  const [nameError, setNameError] = useState('')

  const avgRoas = accounts.reduce((s, a) => s + a.roas, 0) / (accounts.length || 1)
  const activePlatforms = [...new Set(accounts.flatMap(a => a.platforms))].length
  const activeCount = accounts.filter(a => a.status === 'Active').length

  const handleTogglePlatform = (p: Platform) => {
    setNewPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleCreate = () => {
    if (!newName.trim()) {
      setNameError('Please enter a client name')
      return
    }
    if (newPlatforms.length === 0) {
      setNameError('Please select at least one platform')
      return
    }

    const newAccount: ClientAccount = {
      id: String(Date.now()),
      name: newName.trim(),
      initials: getInitials(newName.trim()),
      platforms: newPlatforms,
      monthlySpend: newSpend ? parseInt(newSpend.replace(/[^0-9]/g, '')) || 0 : 0,
      status: 'Active',
      campaigns: 0,
      roas: 0,
    }

    setAccounts(prev => [...prev, newAccount])
    setShowModal(false)
    setNewName('')
    setNewPlatforms([])
    setNewSpend('')
    setNameError('')
  }

  const handleClose = () => {
    setShowModal(false)
    setNewName('')
    setNewPlatforms([])
    setNewSpend('')
    setNameError('')
  }

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Client Accounts"
        subtitle="Manage all your client ad accounts, platform connections, and optimisation insights.">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Create New Client Account
        </Button>
      </PageHeader>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <KpiCard label="Total Accounts" value={String(accounts.length)} change={1} changeLabel="1 new this month" icon={<Users size={14} />} />
        <KpiCard label="Active Platforms" value={String(activePlatforms)} change={0} changeLabel="no change" icon={<Layers size={14} />} />
        <KpiCard label="Avg ROAS" value={`${avgRoas.toFixed(1)}x`} change={0.3} changeLabel="0.3x from last month" icon={<Star size={14} />} highlight />
        <KpiCard label="Active Accounts" value={String(activeCount)} change={0} changeLabel="no change" icon={<Zap size={14} />} />
      </div>

      {/* Accounts list */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[15px] font-semibold">All Client Accounts</span>
        <div className="flex gap-2">
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none"
            style={inputStyle}>
            <option>All Statuses</option><option>Active</option><option>Paused</option>
          </select>
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none"
            style={inputStyle}>
            <option>Sort: ROAS (high–low)</option>
            <option>Sort: Spend (high–low)</option>
            <option>Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {accounts.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
            <div className="text-[32px] mb-3">🏢</div>
            <p className="text-[13px]">No client accounts yet. Create your first one above.</p>
          </div>
        ) : (
          accounts.map(account => <AccountRow key={account.id} account={account} />)
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={handleClose}>
          <div className="rounded-xl border p-6 w-full max-w-md"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>

            <div className="text-[17px] font-semibold mb-1">New Client Account</div>
            <div className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>
              Fill in the details below to add a new client to your workspace.
            </div>

            {/* Client name */}
            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                Client Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameError('') }}
                placeholder="e.g. Acme Brand Co."
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                style={inputStyle}
                autoFocus
              />
            </div>

            {/* Platforms */}
            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>
                Ad Platforms *
              </label>
              <div className="flex gap-2">
                {PLATFORM_OPTIONS.map(p => {
                  const selected = newPlatforms.includes(p)
                  return (
                    <button
                      key={p}
                      onClick={() => handleTogglePlatform(p)}
                      className="flex-1 py-2 rounded-lg border text-[12px] font-medium transition-all"
                      style={{
                        background: selected ? 'var(--teal-dim)' : 'var(--bg3)',
                        borderColor: selected ? 'rgba(0,212,160,0.4)' : 'var(--border)',
                        color: selected ? 'var(--teal)' : 'var(--text2)',
                      }}>
                      {selected ? '✓ ' : ''}{p}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Monthly spend */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
                Monthly Ad Spend (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'var(--text2)' }}>£</span>
                <input
                  type="number"
                  value={newSpend}
                  onChange={e => setNewSpend(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-lg border pl-7 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Error */}
            {nameError && (
              <div className="text-[11px] mb-3 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,92,92,0.08)', color: 'var(--danger)', border: '1px solid rgba(255,92,92,0.2)' }}>
                {nameError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate}>
                Create Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
