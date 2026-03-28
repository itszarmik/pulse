'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

type Campaign = {
  id: string
  influencer_name: string
  handle: string
  platform: string
  product: string
  fee: number
  utm_code: string
  clicks: number
  orders: number
  revenue: number
  status: string
  notes: string
  start_date: string
  created_at: string
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'Facebook', 'Other']
const STATUS_OPTIONS = ['Active', 'Completed', 'Paused']

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <div className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>{label}</div>
      <div className="text-[26px] font-bold font-mono" style={{ color: highlight ? 'var(--teal)' : 'var(--text)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function CampaignRow({ c, onEdit }: { c: Campaign; onEdit: (c: Campaign) => void }) {
  const roas = c.fee > 0 ? (c.revenue / c.fee).toFixed(2) : '—'
  const cpa = c.orders > 0 ? (c.fee / c.orders).toFixed(2) : '—'
  const roasNum = c.fee > 0 ? c.revenue / c.fee : 0
  const trackingUrl = `https://pulse-ruddy-psi.vercel.app/track?ref=${c.utm_code}`

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b text-[12px] hover:bg-[var(--bg3)] transition-colors"
      style={{ borderColor: 'var(--border)' }}>
      {/* Influencer */}
      <div className="w-36 shrink-0">
        <div className="font-semibold text-[13px]">{c.influencer_name}</div>
        <div style={{ color: 'var(--text2)' }}>{c.handle || '—'} · {c.platform}</div>
      </div>
      {/* Product */}
      <div className="flex-1 min-w-0">
        <div className="truncate">{c.product}</div>
      </div>
      {/* UTM */}
      <div className="w-32 shrink-0">
        <div className="font-mono text-[10px] px-1.5 py-0.5 rounded truncate"
          style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>
          {c.utm_code}
        </div>
      </div>
      {/* Stats */}
      <div className="w-16 text-right shrink-0 font-mono">{c.clicks.toLocaleString()}</div>
      <div className="w-14 text-right shrink-0 font-mono">{c.orders.toLocaleString()}</div>
      <div className="w-20 text-right shrink-0 font-mono font-semibold"
        style={{ color: 'var(--teal)' }}>
        £{c.revenue.toLocaleString()}
      </div>
      <div className="w-16 text-right shrink-0">
        <span className="font-mono font-bold"
          style={{ color: roasNum >= 3 ? 'var(--teal)' : roasNum >= 1.5 ? 'var(--warn)' : roasNum > 0 ? 'var(--danger)' : 'var(--text3)' }}>
          {roasNum > 0 ? `${roas}x` : '—'}
        </span>
      </div>
      <div className="w-16 text-right shrink-0" style={{ color: 'var(--text2)' }}>
        {cpa !== '—' ? `£${cpa}` : '—'}
      </div>
      {/* Status */}
      <div className="w-20 shrink-0">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            background: c.status === 'Active' ? 'rgba(0,212,160,0.1)' : c.status === 'Paused' ? 'rgba(255,170,68,0.1)' : 'rgba(139,144,160,0.1)',
            color: c.status === 'Active' ? 'var(--teal)' : c.status === 'Paused' ? 'var(--warn)' : 'var(--text3)',
          }}>
          {c.status}
        </span>
      </div>
      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => navigator.clipboard.writeText(trackingUrl)}
          className="text-[10px] px-2 py-1 rounded border hover:bg-[var(--bg4)] transition-colors"
          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}
          title="Copy tracking link">
          📋 Link
        </button>
        <button onClick={() => onEdit(c)}
          className="text-[10px] px-2 py-1 rounded border hover:bg-[var(--bg4)] transition-colors"
          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
          Edit
        </button>
      </div>
    </div>
  )
}

function Modal({ campaign, onClose, onSave }: { campaign: Campaign | null; onClose: () => void; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    influencer_name: campaign?.influencer_name || '',
    handle: campaign?.handle || '',
    platform: campaign?.platform || 'TikTok',
    product: campaign?.product || '',
    fee: campaign?.fee?.toString() || '',
    utm_code: campaign?.utm_code || '',
    status: campaign?.status || 'Active',
    notes: campaign?.notes || '',
    start_date: campaign?.start_date || new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  const generateUTM = () => {
    if (!form.influencer_name) return
    const slug = form.influencer_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').slice(0, 20)
    const platform = form.platform.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5)
    setForm(f => ({ ...f, utm_code: `${slug}_${platform}_${Date.now().toString(36).slice(-4)}` }))
  }

  const handleSubmit = async () => {
    if (!form.influencer_name.trim()) { setError('Influencer name is required'); return }
    if (!form.product.trim()) { setError('Product is required'); return }
    if (!form.utm_code.trim()) { setError('UTM code is required — click Generate'); return }
    setSaving(true); setError('')
    try {
      await onSave({ ...form, fee: parseFloat(form.fee) || 0 })
    } catch (e: any) {
      setError(e.message); setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }} onClick={e => e.stopPropagation()}>
        <div className="text-[17px] font-bold mb-1">{campaign ? 'Edit Campaign' : 'Add Influencer Campaign'}</div>
        <p className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>Track traffic and sales from this influencer using a unique UTM link.</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Influencer Name *</label>
            <input value={form.influencer_name} onChange={e => setForm(f => ({ ...f, influencer_name: e.target.value }))}
              placeholder="e.g. Emma Johnson" className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} autoFocus />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Handle / Username</label>
            <input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
              placeholder="@emmajohnson" className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Platform</label>
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={inputStyle}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Product / Campaign *</label>
            <input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
              placeholder="e.g. Nike Air Max Summer Drop" className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Influencer Fee (£)</label>
            <input type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))}
              placeholder="500" className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Start Date</label>
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>UTM Tracking Code *</label>
            <div className="flex gap-2">
              <input value={form.utm_code} onChange={e => setForm(f => ({ ...f, utm_code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="emma_tiktok_abc1" className="flex-1 rounded-lg border px-3 py-2 text-[12px] font-mono outline-none focus:border-[var(--teal)]" style={inputStyle} />
              <button onClick={generateUTM}
                className="px-3 py-2 rounded-lg text-[11px] font-semibold border"
                style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
                Generate
              </button>
            </div>
            {form.utm_code && (
              <div className="mt-1.5 text-[10px]" style={{ color: 'var(--text3)' }}>
                Tracking URL: <span className="font-mono" style={{ color: 'var(--teal)' }}>?ref={form.utm_code}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={inputStyle}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes..." className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
          </div>
        </div>

        {error && <div className="text-[11px] mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,92,92,0.08)', color: 'var(--danger)', border: '1px solid rgba(255,92,92,0.2)' }}>{error}</div>}

        <div className="flex gap-2 justify-end mt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Spinner size={13} /> Saving...</> : campaign ? 'Save Changes' : 'Add Campaign'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function UGCContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('revenue')

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('ugc_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setCampaigns(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleSave = async (form: any) => {
    if (!user) return
    if (editing) {
      const { data } = await supabase.from('ugc_campaigns').update({ ...form, user_id: user.id }).eq('id', editing.id).eq('user_id', user.id).select().single()
      setCampaigns(prev => prev.map(c => c.id === editing.id ? data : c))
    } else {
      const { data } = await supabase.from('ugc_campaigns').insert({ ...form, user_id: user.id, clicks: 0, orders: 0, revenue: 0 }).select().single()
      setCampaigns(prev => [data, ...prev])
    }
    setShowModal(false); setEditing(null)
  }

  const filtered = campaigns
    .filter(c => filter === 'All' || c.platform === filter || c.status === filter)
    .sort((a, b) => {
      if (sort === 'revenue') return b.revenue - a.revenue
      if (sort === 'roas') return (b.fee > 0 ? b.revenue/b.fee : 0) - (a.fee > 0 ? a.revenue/a.fee : 0)
      if (sort === 'clicks') return b.clicks - a.clicks
      if (sort === 'orders') return b.orders - a.orders
      return 0
    })

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalFees = campaigns.reduce((s, c) => s + c.fee, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0)
  const overallROAS = totalFees > 0 ? (totalRevenue / totalFees).toFixed(2) : '0'
  const activeCamps = campaigns.filter(c => c.status === 'Active').length

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="UGC & Influencer Tracker"
        subtitle="Track traffic, orders and ROI from every influencer campaign using unique UTM links.">
        <Button variant="primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          + Add Influencer
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="Active Campaigns" value={String(activeCamps)} />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Total Orders" value={totalOrders.toLocaleString()} />
        <StatCard label="Total Revenue" value={`£${totalRevenue.toLocaleString()}`} highlight />
        <StatCard label="Overall ROAS" value={`${overallROAS}x`}
          sub={`£${totalFees.toLocaleString()} in fees`} highlight={parseFloat(overallROAS) >= 2} />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {['All', 'Active', 'Completed', 'Paused', 'TikTok', 'Instagram', 'YouTube'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all"
              style={{
                background: filter === f ? 'var(--teal-dim)' : 'var(--bg2)',
                borderColor: filter === f ? 'rgba(0,212,160,0.4)' : 'var(--border)',
                color: filter === f ? 'var(--teal)' : 'var(--text2)',
              }}>
              {f}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none" style={inputStyle}>
          <option value="revenue">Sort: Revenue</option>
          <option value="roas">Sort: ROAS</option>
          <option value="clicks">Sort: Clicks</option>
          <option value="orders">Sort: Orders</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg3)' }}>
          <div className="w-36 shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Influencer</div>
          <div className="flex-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Product</div>
          <div className="w-32 shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>UTM Code</div>
          <div className="w-16 text-right shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Clicks</div>
          <div className="w-14 text-right shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Orders</div>
          <div className="w-20 text-right shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Revenue</div>
          <div className="w-16 text-right shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>ROAS</div>
          <div className="w-16 text-right shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>CPA</div>
          <div className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Status</div>
          <div className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: 'var(--text2)' }}>
            <Spinner /><span className="text-[13px]">Loading campaigns...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
            <div className="text-[40px] mb-3">🎬</div>
            <div className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text2)' }}>No influencer campaigns yet</div>
            <p className="text-[12px] mb-4">Add your first influencer to start tracking clicks, orders and ROAS.</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>+ Add Influencer</Button>
          </div>
        ) : (
          filtered.map(c => <CampaignRow key={c.id} c={c} onEdit={camp => { setEditing(camp); setShowModal(true) }} />)
        )}
      </div>

      {/* How it works */}
      <div className="mt-6 rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="text-[13px] font-semibold mb-2">How tracking works</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            ['1. Add influencer', 'Create a campaign with a unique UTM code. Each influencer gets their own tracking link.'],
            ['2. Share the link', 'Give the influencer their unique URL: yoursite.com?ref=emma_tiktok. Every click is tracked.'],
            ['3. See the results', 'Clicks, orders and revenue appear here automatically when customers use the link.'],
          ].map(([title, desc]) => (
            <div key={title} className="text-[12px]">
              <div className="font-semibold mb-1" style={{ color: 'var(--teal)' }}>{title}</div>
              <div style={{ color: 'var(--text2)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {showModal && <Modal campaign={editing} onClose={() => { setShowModal(false); setEditing(null) }} onSave={handleSave} />}
    </>
  )
}

export default function UGCPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Spinner /></div>}>
      <UGCContent />
    </Suspense>
  )
}