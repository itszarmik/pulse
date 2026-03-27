'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, KpiCard, StatusBadge, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useUser } from '@clerk/nextjs'
import type { Platform } from '@/types'
import { Users, Layers, Star, Zap } from 'lucide-react'

type Account = {
  id: string
  name: string
  initials: string
  platforms: Platform[]
  monthly_spend: number
  status: string
  campaigns: number
  roas: number
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function AccountRow({ account: a }: { account: Account }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b transition-colors hover:bg-[var(--bg3)]"
      style={{ borderColor: 'var(--border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[14px] font-semibold shrink-0"
        style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>
        {a.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold">{a.name}</div>
        <div className="text-[11px]" style={{ color: 'var(--text2)' }}>
          {a.platforms.join(', ')} · £{a.monthly_spend.toLocaleString()}/mo spend
        </div>
      </div>
      <div className="flex gap-1.5">
        {a.platforms.map(p => (
          <span key={p} className="text-[10px] px-2 py-0.5 rounded border font-medium"
            style={{ background: 'var(--bg4)', borderColor: 'var(--border)', color: 'var(--text2)' }}>{p}</span>
        ))}
      </div>
      <div className="text-right w-20 shrink-0">
        <div className="font-mono text-[13px] font-semibold"
          style={{ color: a.roas >= 4 ? 'var(--teal)' : a.roas >= 3 ? 'var(--warn)' : a.roas > 0 ? 'var(--danger)' : 'var(--text3)' }}>
          {a.roas > 0 ? `${a.roas}x` : '—'}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text3)' }}>ROAS</div>
      </div>
      <StatusBadge status={a.status as any} />
      <div className="flex gap-1.5 shrink-0">
        <Button size="sm">View</Button>
        <Button size="sm">Analyse</Button>
      </div>
    </div>
  )
}

const PLATFORM_OPTIONS: Platform[] = ['Meta', 'Google', 'TikTok']

export default function AccountsPage() {
  const { user, isLoaded } = useUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPlatforms, setNewPlatforms] = useState<Platform[]>([])
  const [newSpend, setNewSpend] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!isLoaded || !user) { setLoading(false); return }
      try {
        const { data, error: dbError } = await supabase
          .from('client_accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (dbError) throw dbError
        setAccounts(data || [])
      } catch (e) {
        setAccounts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, isLoaded])

  const avgRoas = accounts.length > 0 ? accounts.reduce((s, a) => s + Number(a.roas), 0) / accounts.length : 0
  const activePlatforms = [...new Set(accounts.flatMap(a => a.platforms))].length
  const activeCount = accounts.filter(a => a.status === 'Active').length

  const handleCreate = async () => {
    if (!newName.trim()) { setError('Please enter a client name'); return }
    if (newPlatforms.length === 0) { setError('Please select at least one platform'); return }
    if (!user) return
    setSaving(true); setError('')
    const spend = parseInt(newSpend.replace(/[^0-9]/g, '')) || 0
    try {
      const { data, error: dbError } = await supabase
        .from('client_accounts')
        .insert({
          name: newName.trim(),
          initials: getInitials(newName.trim()),
          platforms: newPlatforms,
          monthly_spend: spend,
          status: 'Active',
          campaigns: 0,
          roas: 0,
          user_id: user.id,
        })
        .select()
        .single()
      if (dbError) throw dbError
      setAccounts(prev => [...prev, data])
    } catch (e: any) {
      setError('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
      if (!error) {
        setShowModal(false)
        setNewName(''); setNewPlatforms([]); setNewSpend('')
      }
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setNewName(''); setNewPlatforms([]); setNewSpend(''); setError('')
  }

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Client Accounts"
        subtitle="Manage all your client ad accounts, platform connections and optimisation insights.">
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Create New Client Account</Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <KpiCard label="Total Accounts" value={String(accounts.length)} change={0} changeLabel="your accounts" icon={<Users size={14} />} />
        <KpiCard label="Active Platforms" value={String(activePlatforms)} change={0} changeLabel="platforms in use" icon={<Layers size={14} />} />
        <KpiCard label="Avg ROAS" value={avgRoas > 0 ? `${avgRoas.toFixed(1)}x` : '—'} change={0} changeLabel="across accounts" icon={<Star size={14} />} highlight />
        <KpiCard label="Active Accounts" value={String(activeCount)} change={0} changeLabel="currently active" icon={<Zap size={14} />} />
      </div>

      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[15px] font-semibold">All Client Accounts</span>
        <div className="flex gap-2">
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none" style={inputStyle}>
            <option>All Statuses</option><option>Active</option><option>Paused</option>
          </select>
          <select className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none" style={inputStyle}>
            <option>Sort: ROAS (high–low)</option>
            <option>Sort: Spend (high–low)</option>
            <option>Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: 'var(--text2)' }}>
            <Spinner /><span className="text-[13px]">Loading your accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
            <div className="text-[32px] mb-3">🏢</div>
            <p className="text-[13px] mb-4">No client accounts yet.</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>Create your first account</Button>
          </div>
        ) : (
          accounts.map(a => <AccountRow key={a.id} account={a} />)
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)' }} onClick={handleClose}>
          <div className="rounded-xl border p-6 w-full max-w-md"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">New Client Account</div>
            <div className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>
              Saved to your account — only visible to you.
            </div>
            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Client Name *</label>
              <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setError('') }}
                placeholder="e.g. Acme Brand Co."
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                style={inputStyle} autoFocus />
            </div>
            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Ad Platforms *</label>
              <div className="flex gap-2">
                {PLATFORM_OPTIONS.map(p => {
                  const sel = newPlatforms.includes(p)
                  return (
                    <button key={p} onClick={() => setNewPlatforms(prev => sel ? prev.filter(x => x !== p) : [...prev, p])}
                      className="flex-1 py-2 rounded-lg border text-[12px] font-medium transition-all"
                      style={{ background: sel ? 'var(--teal-dim)' : 'var(--bg3)', borderColor: sel ? 'rgba(0,212,160,0.4)' : 'var(--border)', color: sel ? 'var(--teal)' : 'var(--text2)' }}>
                      {sel ? '✓ ' : ''}{p}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Monthly Ad Spend (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: 'var(--text2)' }}>£</span>
                <input type="number" value={newSpend} onChange={e => setNewSpend(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-lg border pl-7 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                  style={inputStyle} />
              </div>
            </div>
            {error && (
              <div className="text-[11px] mb-3 px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,92,92,0.08)', color: 'var(--danger)', border: '1px solid rgba(255,92,92,0.2)' }}>
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><Spinner size={13} /> Saving...</> : 'Create Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
