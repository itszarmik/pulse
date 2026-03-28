'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, StatusBadge, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, Users, DollarSign, MousePointer, ShoppingBag, Copy, Check, Sparkles } from 'lucide-react'

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

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'Snapchat', 'Other']

function getROAS(c: Campaign) {
  return c.fee > 0 ? c.revenue / c.fee : 0
}
function getCPA(c: Campaign) {
  return c.orders > 0 ? c.fee / c.orders : 0
}
function getCVR(c: Campaign) {
  return c.clicks > 0 ? (c.orders / c.clicks) * 100 : 0
}
function getPlatformColor(p: string) {
  const colors: Record<string, string> = {
    TikTok: '#00d4a0', Instagram: '#e1306c', YouTube: '#ff0000',
    'Twitter/X': '#1da1f2', Snapchat: '#fffc00', Other: '#888'
  }
  return colors[p] || '#888'
}

function StatCard({ label, value, sub, icon, highlight }: any) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ color: highlight ? 'var(--teal)' : 'var(--text3)' }}>{icon}</span>
      </div>
      <div className="text-[24px] font-bold font-mono" style={{ color: highlight ? 'var(--teal)' : 'var(--text)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}

function UTMLink({ utm_code }: { utm_code: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://pulse-ruddy-psi.vercel.app?ref=${utm_code}`
  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>
        ?ref={utm_code}
      </code>
      <button onClick={handleCopy} className="p-1 rounded transition-colors hover:bg-[var(--bg4)]"
        style={{ color: copied ? 'var(--teal)' : 'var(--text3)' }}>
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </div>
  )
}

export default function UGCPage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Form
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [product, setProduct] = useState('')
  const [fee, setFee] = useState('')
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')

  // Edit mode - metric updates
  const [editingMetrics, setEditingMetrics] = useState<string | null>(null)
  const [editClicks, setEditClicks] = useState('')
  const [editOrders, setEditOrders] = useState('')
  const [editRevenue, setEditRevenue] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from('ugc_campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setCampaigns(data || []); setLoading(false) })
  }, [user])

  const generateUTM = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) + '_' + Math.random().toString(36).slice(2, 6)

  const handleCreate = async () => {
    if (!name.trim() || !product.trim() || !user) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('ugc_campaigns').insert({
        user_id: user.id,
        influencer_name: name.trim(),
        handle: handle.trim() || null,
        platform,
        product: product.trim(),
        fee: parseFloat(fee) || 0,
        utm_code: generateUTM(name),
        clicks: 0, orders: 0, revenue: 0,
        status: 'Active',
        notes: notes.trim() || null,
        start_date: startDate || null,
      }).select().single()
      if (error) throw error
      setCampaigns(prev => [data, ...prev])
      setShowModal(false)
      resetForm()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleUpdateMetrics = async (id: string) => {
    const { data } = await supabase.from('ugc_campaigns').update({
      clicks: parseInt(editClicks) || 0,
      orders: parseInt(editOrders) || 0,
      revenue: parseFloat(editRevenue) || 0,
    }).eq('id', id).select().single()
    if (data) setCampaigns(prev => prev.map(c => c.id === id ? data : c))
    setEditingMetrics(null)
  }

  const handleStatusToggle = async (c: Campaign) => {
    const newStatus = c.status === 'Active' ? 'Paused' : 'Active'
    await supabase.from('ugc_campaigns').update({ status: newStatus }).eq('id', c.id)
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('ugc_campaigns').delete().eq('id', id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
    setSelectedId(null)
  }

  const handleAIAnalysis = async () => {
    if (!campaigns.length) return
    setAiLoading(true)
    setAiInsight('')
    try {
      const summary = campaigns.map(c => ({
        name: c.influencer_name, platform: c.platform, product: c.product,
        fee: c.fee, clicks: c.clicks, orders: c.orders, revenue: c.revenue,
        roas: getROAS(c).toFixed(2), cpa: getCPA(c).toFixed(2), cvr: getCVR(c).toFixed(2),
        status: c.status,
      }))
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ugc',
          data: summary,
          prompt: `Analyse these UGC influencer campaigns and give specific, actionable recommendations. For each influencer tell me: whether to increase their budget, pause them, or renegotiate their rate. Identify who is the top performer and why. Identify who is underperforming. Be direct and specific with numbers.`,
        }),
      })
      const result = await res.json()
      setAiInsight(result.analysis || result.message || 'Analysis complete.')
    } catch (e) { setAiInsight('Analysis failed. Try again.') }
    finally { setAiLoading(false) }
  }

  const resetForm = () => { setName(''); setHandle(''); setPlatform('TikTok'); setProduct(''); setFee(''); setStartDate(''); setNotes('') }

  // Aggregate stats
  const totalFee = campaigns.reduce((s, c) => s + c.fee, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalOrders = campaigns.reduce((s, c) => s + c.orders, 0)
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0)
  const overallROAS = totalFee > 0 ? totalRevenue / totalFee : 0
  const topPerformer = campaigns.length > 0 ? campaigns.reduce((best, c) => getROAS(c) > getROAS(best) ? c : best, campaigns[0]) : null

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  const selected = campaigns.find(c => c.id === selectedId)

  return (
    <>
      <PageHeader title="UGC & Influencer Tracker"
        subtitle="Track every influencer campaign. See exactly who drives clicks, orders and revenue.">
        <div className="flex gap-2">
          <button onClick={handleAIAnalysis} disabled={aiLoading || campaigns.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all"
            style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
            <Sparkles size={14} />
            {aiLoading ? 'Analysing...' : 'AI Analysis'}
          </button>
          <Button variant="primary" onClick={() => setShowModal(true)}>+ Add Influencer</Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Influencers" value={campaigns.length} icon={<Users size={14} />} />
        <StatCard label="Total Spent" value={`£${totalFee.toLocaleString()}`} icon={<DollarSign size={14} />} />
        <StatCard label="Total Revenue" value={`£${totalRevenue.toLocaleString()}`} icon={<TrendingUp size={14} />} highlight />
        <StatCard label="Total Orders" value={totalOrders.toLocaleString()} icon={<ShoppingBag size={14} />} />
        <StatCard label="Overall ROAS" value={`${overallROAS.toFixed(1)}x`} sub="revenue per £ spent" icon={<TrendingUp size={14} />} highlight={overallROAS >= 2} />
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: 'var(--teal)' }} />
            <span className="text-[13px] font-semibold">AI Analysis</span>
          </div>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text2)' }}>{aiInsight}</p>
        </div>
      )}

      {/* Top performer banner */}
      {topPerformer && getROAS(topPerformer) > 0 && (
        <div className="rounded-xl border p-4 mb-6 flex items-center justify-between"
          style={{ background: 'rgba(0,212,160,0.05)', borderColor: 'rgba(0,212,160,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[18px]"
              style={{ background: 'var(--teal-dim)' }}>🏆</div>
            <div>
              <div className="text-[12px] font-semibold" style={{ color: 'var(--teal)' }}>Top performer</div>
              <div className="text-[13px] font-bold">{topPerformer.influencer_name} <span style={{ color: 'var(--text2)' }}>on {topPerformer.platform}</span></div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[20px] font-bold" style={{ color: 'var(--teal)' }}>{getROAS(topPerformer).toFixed(1)}x ROAS</div>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>£{topPerformer.revenue.toLocaleString()} revenue · {topPerformer.orders} orders</div>
          </div>
        </div>
      )}

      {/* Campaign table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: 'var(--text2)' }}>
            <Spinner /><span>Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
            <div className="text-[40px] mb-3">🎬</div>
            <p className="text-[14px] font-medium mb-1">No influencer campaigns yet</p>
            <p className="text-[12px] mb-5" style={{ color: 'var(--text3)' }}>Add your first influencer to start tracking performance</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>+ Add Influencer</Button>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Influencer', 'Platform', 'Product', 'Fee', 'Clicks', 'Orders', 'Revenue', 'ROAS', 'CPA', 'CVR', 'UTM Link', 'Status', ''].map(col => (
                  <th key={col} className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]"
                    style={{ color: 'var(--text2)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const roas = getROAS(c)
                const cpa = getCPA(c)
                const cvr = getCVR(c)
                const roasColor = roas >= 3 ? 'var(--teal)' : roas >= 1.5 ? 'var(--warn)' : roas > 0 ? 'var(--danger)' : 'var(--text3)'
                return (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--bg3)] cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{c.influencer_name}</div>
                      {c.handle && <div className="text-[11px]" style={{ color: 'var(--text3)' }}>@{c.handle}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: getPlatformColor(c.platform) }} />
                        <span style={{ color: 'var(--text2)' }}>{c.platform}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--text2)' }}>{c.product}</td>
                    <td className="px-3 py-3 font-mono">£{c.fee.toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono">{c.clicks.toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono">{c.orders.toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--teal)' }}>£{c.revenue.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className="font-mono font-bold" style={{ color: roasColor }}>
                        {roas > 0 ? `${roas.toFixed(1)}x` : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--text2)' }}>
                      {cpa > 0 ? `£${cpa.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--text2)' }}>
                      {cvr > 0 ? `${cvr.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <UTMLink utm_code={c.utm_code} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={c.status as any} />
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        className="text-[11px] px-2 py-1 rounded border transition-colors"
                        style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}
                        onClick={() => { setEditingMetrics(c.id); setEditClicks(String(c.clicks)); setEditOrders(String(c.orders)); setEditRevenue(String(c.revenue)) }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expanded row detail */}
      {selected && (
        <div className="mt-4 rounded-xl border p-5 grid grid-cols-2 gap-5"
          style={{ background: 'var(--bg2)', borderColor: 'rgba(0,212,160,0.2)' }}>
          <div>
            <div className="text-[14px] font-bold mb-3">{selected.influencer_name}
              {selected.handle && <span className="text-[12px] font-normal ml-2" style={{ color: 'var(--text3)' }}>@{selected.handle}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Platform', value: selected.platform },
                { label: 'Product', value: selected.product },
                { label: 'Campaign fee', value: `£${selected.fee.toLocaleString()}` },
                { label: 'Start date', value: selected.start_date || 'Not set' },
                { label: 'ROAS', value: getROAS(selected) > 0 ? `${getROAS(selected).toFixed(2)}x` : '—' },
                { label: 'CPA', value: getCPA(selected) > 0 ? `£${getCPA(selected).toFixed(2)}` : '—' },
                { label: 'CVR', value: getCVR(selected) > 0 ? `${getCVR(selected).toFixed(1)}%` : '—' },
                { label: 'Profit / Loss', value: selected.revenue > 0 ? `£${(selected.revenue - selected.fee).toFixed(0)}` : '—' },
              ].map((item, i) => (
                <div key={i} className="rounded-lg p-2.5" style={{ background: 'var(--bg3)' }}>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text3)' }}>{item.label}</div>
                  <div className="text-[13px] font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[13px] font-semibold mb-3">UTM Tracking Link</div>
            <div className="rounded-lg p-3 mb-3 text-[12px] break-all" style={{ background: 'var(--bg3)', color: 'var(--teal)' }}>
              https://pulse-ruddy-psi.vercel.app?ref={selected.utm_code}
            </div>
            <p className="text-[11px] mb-4 leading-relaxed" style={{ color: 'var(--text2)' }}>
              Give this link to the influencer to use in their bio, posts or stories. All traffic from this link is automatically attributed to them.
            </p>
            {selected.notes && (
              <div>
                <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>Notes</div>
                <div className="text-[12px] p-3 rounded-lg" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>{selected.notes}</div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleStatusToggle(selected)}
                className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                {selected.status === 'Active' ? 'Pause campaign' : 'Activate campaign'}
              </button>
              <button onClick={() => handleDelete(selected.id)}
                className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: 'rgba(255,92,92,0.3)', color: 'var(--danger)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit metrics modal */}
      {editingMetrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setEditingMetrics(null)}>
          <div className="rounded-xl border p-6 w-full max-w-sm" style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[16px] font-semibold mb-4">Update Performance Metrics</div>
            <div className="flex flex-col gap-3 mb-5">
              {[
                { label: 'Total Clicks', value: editClicks, set: setEditClicks },
                { label: 'Total Orders', value: editOrders, set: setEditOrders },
                { label: 'Total Revenue (£)', value: editRevenue, set: setEditRevenue },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>{f.label}</label>
                  <input type="number" value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--teal)]"
                    style={inputStyle} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setEditingMetrics(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => handleUpdateMetrics(editingMetrics)}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add influencer modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => { setShowModal(false); resetForm() }}>
          <div className="rounded-xl border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">Add Influencer Campaign</div>
            <div className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>A unique tracking link will be generated automatically.</div>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Influencer name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Emma Watson"
                    className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} autoFocus />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Handle (optional)</label>
                  <input type="text" value={handle} onChange={e => setHandle(e.target.value)} placeholder="@emmawatson"
                    className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Platform *</label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className="px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all"
                      style={{ background: platform === p ? 'var(--teal-dim)' : 'var(--bg3)', borderColor: platform === p ? 'rgba(0,212,160,0.4)' : 'var(--border)', color: platform === p ? 'var(--teal)' : 'var(--text2)' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Product being promoted *</label>
                <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Running Shoes, Summer Collection"
                  className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Campaign fee (£)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'var(--text2)' }}>£</span>
                    <input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="500"
                      className="w-full rounded-lg border pl-7 pr-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Start date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Contract terms, content requirements, etc."
                  className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)] resize-none"
                  style={inputStyle} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button onClick={() => { setShowModal(false); resetForm() }}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving || !name.trim() || !product.trim()}>
                {saving ? <><Spinner size={13} /> Adding...</> : 'Add Campaign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}