'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { StatusBadge } from '@/components/ui'
import { CAMPAIGNS } from '@/lib/data'
import type { Campaign, Platform } from '@/types'
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, BarChart2, Target, MousePointer, DollarSign } from 'lucide-react'

const PLATFORM_DOTS: Record<Platform, string> = { Meta:'#1877f2', Google:'#ea4335', TikTok:'#00d4a0', CSV:'#888' }

function RoasValue({ roas }: { roas: number }) {
  const color = roas >= 4 ? 'var(--teal)' : roas >= 2.5 ? 'var(--warn)' : 'var(--danger)'
  return <span className="font-mono text-[12px] font-semibold" style={{ color }}>{roas.toFixed(1)}x</span>
}

function getRoasBenchmark(platform: Platform) {
  const benchmarks: Record<Platform, number> = { Meta: 3.5, Google: 4.0, TikTok: 2.5, CSV: 3.0 }
  return benchmarks[platform]
}

function getInsights(c: Campaign) {
  const benchmark = getRoasBenchmark(c.platform)
  const roasDiff = ((c.roas - benchmark) / benchmark) * 100
  const insights = []

  // ROAS insight
  if (c.roas >= benchmark * 1.2) {
    insights.push({ type: 'success', icon: 'trending-up', title: 'Strong ROAS performance', body: `This campaign is returning ${c.roas}x ROAS â ${Math.abs(roasDiff).toFixed(0)}% above the ${c.platform} benchmark of ${benchmark}x. Consider increasing daily budget by 15â25% to scale revenue while efficiency holds.` })
  } else if (c.roas >= benchmark * 0.8) {
    insights.push({ type: 'warn', icon: 'target', title: 'ROAS near benchmark', body: `At ${c.roas}x, this campaign is close to the ${c.platform} average of ${benchmark}x. Focus on improving ad creative and audience targeting to push above ${(benchmark * 1.2).toFixed(1)}x.` })
  } else {
    insights.push({ type: 'danger', icon: 'trending-down', title: 'ROAS below benchmark', body: `At ${c.roas}x, this campaign is ${Math.abs(roasDiff).toFixed(0)}% below the ${c.platform} benchmark of ${benchmark}x. Consider pausing or reducing spend by 30% and reallocating budget to your stronger campaigns.` })
  }

  // CTR insight
  if (c.ctr > 3.5) {
    insights.push({ type: 'success', icon: 'check', title: 'High click-through rate', body: `CTR of ${c.ctr}% is strong â your creative and targeting are resonating. The ad copy and visuals are compelling the right audience to click.` })
  } else if (c.ctr < 1.5) {
    insights.push({ type: 'warn', icon: 'alert', title: 'Low click-through rate', body: `CTR of ${c.ctr}% suggests your creative or targeting may need refreshing. Try A/B testing new headlines or narrowing your audience. Use the Variants Generator to create new ad copy angles.` })
  }

  // CPC insight
  const targetCpc = c.platform === 'Meta' ? 0.25 : c.platform === 'Google' ? 0.50 : 0.15
  if (c.cpc > targetCpc * 1.5) {
    insights.push({ type: 'warn', icon: 'dollar', title: 'CPC running high', body: `Cost per click of Â£${c.cpc.toFixed(2)} is above the typical range for ${c.platform}. Review your bid strategy â switching to cost cap bidding may help reduce spend wastage.` })
  } else if (c.cpc < targetCpc * 0.7) {
    insights.push({ type: 'success', icon: 'check', title: 'Efficient cost per click', body: `CPC of Â£${c.cpc.toFixed(2)} is well below average for ${c.platform}. Your targeting is efficient â this is a signal to increase budget and capture more volume.` })
  }

  // Status-specific
  if (c.status === 'Paused') {
    insights.push({ type: 'info', icon: 'lightbulb', title: 'Campaign is paused', body: `This campaign has ${c.roas >= benchmark ? 'solid ROAS history â consider reactivating it, especially if you have budget from underperforming campaigns to reallocate.' : 'underperformed historically. Before reactivating, refresh the creative and tighten the target audience.'}` })
  }
  if (c.status === 'Ended') {
    insights.push({ type: 'info', icon: 'lightbulb', title: 'Learnings from this campaign', body: `This campaign generated ${c.conversions.toLocaleString()} conversions at a ${c.roas}x ROAS. ${c.roas >= benchmark ? 'The results were strong â use this as a template for future campaigns on ' + c.platform + '.' : 'Review what underperformed and apply those learnings to your next ' + c.platform + ' campaign.'}` })
  }

  // Conversion volume
  if (c.conversions > 400) {
    insights.push({ type: 'success', icon: 'check', title: 'High conversion volume', body: `${c.conversions.toLocaleString()} conversions gives the ${c.platform} algorithm strong data to optimise against. This campaign has enough signal â trust the algorithm and avoid making frequent bid changes.` })
  } else if (c.conversions < 100 && c.status === 'Active') {
    insights.push({ type: 'warn', icon: 'alert', title: 'Low conversion data', body: `Only ${c.conversions} conversions recorded. The algorithm may be in learning phase with limited data. Give it at least 50 more conversions before making major changes, or switch to a higher-funnel objective like Add to Cart.` })
  }

  return insights.slice(0, 4)
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text2)' }}>
        <span>{label}</span><span className="font-medium" style={{ color: 'var(--text)' }}>{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: { type: string; icon: string; title: string; body: string } }) {
  const styles = {
    success: { border: 'var(--teal)', bg: 'rgba(0,212,160,0.05)', icon: <CheckCircle size={14} color="var(--teal)" /> },
    warn: { border: 'var(--warn)', bg: 'rgba(255,170,68,0.05)', icon: <AlertTriangle size={14} color="var(--warn)" /> },
    danger: { border: 'var(--danger)', bg: 'rgba(255,92,92,0.05)', icon: <TrendingDown size={14} color="var(--danger)" /> },
    info: { border: 'var(--purple)', bg: 'rgba(155,109,255,0.05)', icon: <Lightbulb size={14} color="var(--purple)" /> },
  }
  const s = styles[insight.type as keyof typeof styles] || styles.info
  return (
    <div className="rounded-lg p-3.5 border-l-[3px]" style={{ background: s.bg, borderLeftColor: s.border }}>
      <div className="flex items-center gap-2 mb-1.5">
        {s.icon}
        <span className="text-[12px] font-semibold">{insight.title}</span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{insight.body}</p>
    </div>
  )
}

function CampaignDrawer({ campaign: c, onClose }: { campaign: Campaign; onClose: () => void }) {
  const benchmark = getRoasBenchmark(c.platform)
  const roasVsBenchmark = ((c.roas - benchmark) / benchmark) * 100
  const insights = getInsights(c)
  const maxClicks = Math.max(...CAMPAIGNS.map(x => x.clicks))
  const maxConversions = Math.max(...CAMPAIGNS.map(x => x.conversions))
  const maxRevenue = Math.max(...CAMPAIGNS.map(x => x.revenue))

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
        style={{ width: '480px', background: 'var(--bg2)', borderLeft: '1px solid var(--border2)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b sticky top-0" style={{ borderColor: 'var(--border)', background: 'var(--bg2)', zIndex: 10 }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_DOTS[c.platform] }} />
              <span className="text-[12px]" style={{ color: 'var(--text2)' }}>{c.platform}</span>
              <StatusBadge status={c.status} />
            </div>
            <h2 className="text-[17px] font-semibold leading-tight">{c.name}</h2>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>
              {c.objective} Â· Started {new Date(c.startDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
              {c.endDate ? ` Â· Ended ${new Date(c.endDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}` : ''}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg3)]" style={{ color: 'var(--text2)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* KPI snapshot */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'ROAS', value: `${c.roas}x`, sub: `Benchmark: ${benchmark}x`, color: c.roas >= benchmark ? 'var(--teal)' : 'var(--danger)', icon: <TrendingUp size={13} /> },
              { label: 'Revenue', value: `Â£${c.revenue.toLocaleString()}`, sub: `Spend: Â£${c.spend.toLocaleString()}`, color: 'var(--text)', icon: <DollarSign size={13} /> },
              { label: 'Conversions', value: c.conversions.toLocaleString(), sub: `CPÐ: Â£${(c.spend / c.conversions).toFixed(2)}`, color: 'var(--text)', icon: <Target size={13} /> },
              { label: 'CTR', value: `${c.ctr}%`, sub: `CPC: Â£${c.cpc.toFixed(2)}`, color: c.ctr > 2.5 ? 'var(--teal)' : c.ctr < 1.5 ? 'var(--warn)' : 'var(--text)', icon: <MousePointer size={13} /> },
            ].map((kpi, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text2)' }}>
                  {kpi.icon}
                  <span className="text-[11px] font-medium">{kpi.label}</span>
                </div>
                <div className="font-mono text-[20px] font-semibold" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ROAS vs benchmark bar */}
          <div className="rounded-lg p-4" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold">ROAS vs {c.platform} benchmark</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ background: roasDiff >= 0 ? 'rgba(0,212,160,0.1)' : 'rgba(255,92,92,0.1)', color: roasDiff >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                {roasDiff >= 0 ? '+' : ''}{roasDiff.toFixed(0)}% vs benchmark
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
              <div className="absolute h-full rounded-full transition-all"
                style={{ width: `${Math.min((c.roas / (benchmark * 2)) * 100, 100)}%`, background: c.roas >= benchmark ? 'var(--teal)' : 'var(--warn)' }} />
              {/* Benchmark marker */}
              <div className="absolute top-0 h-full w-0.5" style={{ left: `${(benchmark / (benchmark * 2)) * 100}%`, background: 'var(--border2)' }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text3)' }}>
              <span>0x</span>
              <span>Benchmark {benchmark}x â</span>
              <span>{(benchmark * 2).toFixed(0)}x</span>
            </div>
          </div>

          {/* Relative performance bars */}
          <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <span className="text-[12px] font-semibold">Performance vs other campaigns</span>
            <ScoreBar label="Clicks" value={c.clicks} max={maxClicks} color="#1877f2" />
            <ScoreBar label="Conversions" value={c.conversions} max={maxConversions} color="var(--teal)" />
            <ScoreBar label="Revenue" value={c.revenue} max={maxRevenue} color="var(--purple)" />
          </div>

          {/* AI Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="var(--teal)" />
              </svg>
              <span className="text-[13px] font-semibold">AI Insights & Recommendations</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-lg p-4" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            <span className="text-[12px] font-semibold block mb-3">Quick actions</span>
            <div className="flex flex-wrap gap-2">
              <button className="text-[12px] px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-[var(--bg4)]"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                {c.status === 'Active' ? 'Pause campaign' : 'Activate campaign'}
              </button>
              <button className="text-[12px] px-3 py-1.5 rounded-lg border font-medium transition-colors hover:bg-[var(--bg4)]"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                Adjust budget
              </button>
              <button className="text-[12px] px-3 py-1.5 rounded-lg border font-medium transition-colors"
                style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}
                onClick={() => { const a = document.createElement('a'); a.href = '/variants'; a.click(); }}>
                Generate new variants â
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export function CampaignTable() {
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const filtered = CAMPAIGNS.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    const pf = activeTab || platformFilter
    if (pf && c.platform !== pf) return false
    return true
  })

  const tabs = [
    { label: 'All Platforms', value: '' },
    { label: 'Meta Ads', value: 'Meta', dot: '#1877f2' },
    { label: 'Google Ads', value: 'Google', dot: '#ea4335' },
    { label: 'TikTok Ads', value: 'TikTok', dot: '#00d4a0' },
  ]

  const selectStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[15px] font-semibold">All Campaigns</span>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={selectStyle}>
              <option value="">All Statuses</option>
              <option>Active</option><option>Paused</option><option>Ended</option>
            </select>
            <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setActiveTab(e.target.value) }}
              className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={selectStyle}>
              <option value="">All Platforms</option>
              <option>Meta</option><option>Google</option><option>TikTok</option>
            </select>
          </div>
        </div>
        <div className="flex gap-1 mb-3">
          {tabs.map(t => (
            <button key={t.value} onClick={() => { setActiveTab(t.value); setPlatformFilter(t.value) }}
              className={clsx('flex items-center gap-1.5 px-3 py-[5px] rounded-md text-[12px] font-medium border transition-all',
                activeTab === t.value ? 'text-[var(--teal)] bg-[var(--teal-dim)] border-[var(--teal-dim2)]' : 'text-[var(--text2)] border-transparent hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
              {(t as any).dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: (t as any).dot }} />}
              {t.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text3)' }}>No campaigns match your filters.</div>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Campaign','Platform','Status','Spend','Clicks','Conv.','ROAS','Actions'].map(col => (
                    <th key={col} className="text-left px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color: 'var(--text2)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--bg3)] cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setSelectedCampaign(c)}>
                    <td className="px-3 py-3 font-medium">{c.name}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_DOTS[c.platform] }} />
                        {c.platform}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3">Â£{c.spend.toLocaleString()}</td>
                    <td className="px-3 py-3">{(c.clicks/1000).toFixed(1)}K</td>
                    <td className="px-3 py-3">{c.conversions.toLocaleString()}</td>
                    <td className="px-3 py-3"><RoasValue roas={c.roas} /></td>
                    <td className="px-3 py-3">
                      <button
                        className="px-2.5 py-1 rounded-[5px] border text-[11px] transition-colors"
                        style={{ borderColor:'var(--teal-dim2)', background:'var(--teal-dim)', color:'var(--teal)' }}
                        onClick={e => { e.stopPropagation(); setSelectedCampaign(c) }}>
                        View â
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedCampaign && (
        <CampaignDrawer campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      )}
    </>
  )
}
