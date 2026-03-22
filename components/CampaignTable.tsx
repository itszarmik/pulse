'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { StatusBadge } from '@/components/ui'
import { CAMPAIGNS } from '@/lib/data'
import type { Campaign, Platform } from '@/types'

const PLATFORM_DOTS: Record<Platform, string> = {
  Meta: '#1877f2', Google: '#ea4335', TikTok: '#00d4a0', CSV: '#888'
}

const PLATFORM_BENCHMARKS: Record<Platform, number> = {
  Meta: 3.5, Google: 4.0, TikTok: 2.5, CSV: 3.0
}

function RoasValue({ roas }: { roas: number }) {
  const color = roas >= 4 ? 'var(--teal)' : roas >= 2.5 ? 'var(--warn)' : 'var(--danger)'
  return <span className="font-mono text-[12px] font-semibold" style={{ color }}>{roas.toFixed(1)}x</span>
}

function getInsights(c: Campaign) {
  const benchmark = PLATFORM_BENCHMARKS[c.platform]
  const roasDiff = ((c.roas - benchmark) / benchmark) * 100
  const insights: { type: string; title: string; body: string }[] = []

  if (c.roas >= benchmark * 1.2) {
    insights.push({ type: 'success', title: 'Strong ROAS — consider scaling', body: `At ${c.roas}x, this campaign is ${Math.abs(roasDiff).toFixed(0)}% above the ${c.platform} benchmark of ${benchmark}x. This is a strong signal to increase daily budget by 15–25% while efficiency holds.` })
  } else if (c.roas < benchmark * 0.8) {
    insights.push({ type: 'danger', title: 'ROAS below benchmark — review spend', body: `At ${c.roas}x, this is ${Math.abs(roasDiff).toFixed(0)}% below the ${c.platform} average of ${benchmark}x. Consider reducing budget by 30% and reallocating to stronger campaigns until creative is refreshed.` })
  } else {
    insights.push({ type: 'warn', title: 'ROAS near benchmark — room to improve', body: `At ${c.roas}x you are close to the ${c.platform} average of ${benchmark}x. Test new ad creative and tighten your audience to push above ${(benchmark * 1.2).toFixed(1)}x.` })
  }

  if (c.ctr > 3.5) {
    insights.push({ type: 'success', title: 'High click-through rate', body: `CTR of ${c.ctr}% is strong — your creative and targeting are resonating well. The algorithm has good signal to optimise against.` })
  } else if (c.ctr < 1.5) {
    insights.push({ type: 'warn', title: 'Low CTR — refresh your creative', body: `CTR of ${c.ctr}% suggests ad fatigue or weak creative. Try new headlines and visuals — use the Variants Generator to test different angles.` })
  }

  if (c.conversions < 100 && c.status === 'Active') {
    insights.push({ type: 'warn', title: 'Low conversion volume', body: `Only ${c.conversions} conversions recorded. The algorithm may still be in the learning phase. Avoid making major changes — give it at least 50 more conversions before optimising.` })
  } else if (c.conversions > 400) {
    insights.push({ type: 'success', title: 'Strong conversion data', body: `${c.conversions.toLocaleString()} conversions gives the algorithm excellent data to optimise against. Trust the bidding strategy and avoid frequent manual changes.` })
  }

  if (c.status === 'Paused') {
    insights.push({ type: 'info', title: 'Campaign is paused', body: c.roas >= benchmark ? `Historical ROAS of ${c.roas}x is solid. Consider reactivating with a refreshed creative and a modest budget to retrigger learning.` : `Underperformed at ${c.roas}x ROAS. Before reactivating, overhaul the creative and narrow the audience targeting.` })
  }

  if (c.status === 'Ended') {
    insights.push({ type: 'info', title: 'Apply these learnings', body: c.roas >= benchmark ? `This campaign performed well at ${c.roas}x ROAS. Use the same audience and creative structure as a template for your next ${c.platform} campaign.` : `Review what underperformed here. The audience or creative likely needed work — address both before rerunning.` })
  }

  const targetCpc = c.platform === 'Google' ? 0.45 : c.platform === 'Meta' ? 0.22 : 0.12
  if (c.cpc > targetCpc * 1.6) {
    insights.push({ type: 'warn', title: 'CPC running high', body: `Cost per click of £${c.cpc.toFixed(2)} is above average for ${c.platform}. Review your bid strategy — switching to a cost cap may reduce wastage.` })
  }

  return insights.slice(0, 4)
}

const INSIGHT_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  success: { border: 'var(--teal)', bg: 'rgba(0,212,160,0.06)', dot: 'var(--teal)' },
  warn:    { border: 'var(--warn)', bg: 'rgba(255,170,68,0.06)', dot: 'var(--warn)' },
  danger:  { border: 'var(--danger)', bg: 'rgba(255,92,92,0.06)', dot: 'var(--danger)' },
  info:    { border: '#9b6dff', bg: 'rgba(155,109,255,0.06)', dot: '#9b6dff' },
}

function CampaignDrawer({ campaign: c, onClose }: { campaign: Campaign; onClose: () => void }) {
  const benchmark = PLATFORM_BENCHMARKS[c.platform]
  const roasDiff = ((c.roas - benchmark) / benchmark) * 100
  const insights = getInsights(c)
  const allCampaigns = CAMPAIGNS
  const maxClicks = Math.max(...allCampaigns.map(x => x.clicks))
  const maxConv = Math.max(...allCampaigns.map(x => x.conversions))
  const maxRevenue = Math.max(...allCampaigns.map(x => x.revenue))
  const cpa = c.spend / Math.max(c.conversions, 1)

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 overflow-y-auto flex flex-col"
        style={{ width: '460px', background: 'var(--bg2)', borderLeft: '1px solid var(--border2)' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between p-5 border-b" style={{ background: 'var(--bg2)', borderColor: 'var(--border)', zIndex: 10 }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_DOTS[c.platform] }} />
              <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{c.platform}</span>
              <StatusBadge status={c.status} />
            </div>
            <h2 className="text-[16px] font-semibold leading-snug">{c.name}</h2>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
              {c.objective} · From {new Date(c.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {c.endDate ? ` to ${new Date(c.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--bg3)] text-[var(--text2)]"
            style={{ fontSize: '18px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'ROAS', val: `${c.roas}x`, sub: `Benchmark: ${benchmark}x`, color: c.roas >= benchmark ? 'var(--teal)' : 'var(--danger)' },
              { label: 'Revenue', val: `£${c.revenue.toLocaleString()}`, sub: `Spend: £${c.spend.toLocaleString()}`, color: 'var(--text)' },
              { label: 'Conversions', val: c.conversions.toLocaleString(), sub: `CPA: £${cpa.toFixed(2)}`, color: 'var(--text)' },
              { label: 'CTR', val: `${c.ctr}%`, sub: `CPC: £${c.cpc.toFixed(2)}`, color: c.ctr > 2.5 ? 'var(--teal)' : c.ctr < 1.5 ? 'var(--warn)' : 'var(--text)' },
            ].map((kpi, i) => (
              <div key={i} className="rounded-lg p-3 border" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                <div className="text-[11px] mb-1.5 font-medium" style={{ color: 'var(--text2)' }}>{kpi.label}</div>
                <div className="font-mono text-[22px] font-semibold" style={{ color: kpi.color }}>{kpi.val}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ROAS vs benchmark */}
          <div className="rounded-lg p-4 border" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold">ROAS vs {c.platform} benchmark</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: roasDiff >= 0 ? 'rgba(0,212,160,0.12)' : 'rgba(255,92,92,0.12)',
                  color: roasDiff >= 0 ? 'var(--teal)' : 'var(--danger)'
                }}>
                {roasDiff >= 0 ? '+' : ''}{roasDiff.toFixed(0)}%
              </span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  width: `${Math.min((c.roas / (benchmark * 2)) * 100, 100)}%`,
                  background: c.roas >= benchmark ? 'var(--teal)' : 'var(--warn)'
                }}
              />
              <div
                className="absolute top-0 h-full w-px"
                style={{ left: '50%', background: 'rgba(255,255,255,0.3)' }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text3)' }}>
              <span>0x</span>
              <span>Benchmark {benchmark}x</span>
              <span>{(benchmark * 2).toFixed(0)}x</span>
            </div>
          </div>

          {/* Relative performance */}
          <div className="rounded-lg p-4 border" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
            <div className="text-[12px] font-semibold mb-3">Performance vs other campaigns</div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Clicks', val: c.clicks, max: maxClicks, fmt: `${(c.clicks/1000).toFixed(1)}K`, color: '#1877f2' },
                { label: 'Conversions', val: c.conversions, max: maxConv, fmt: c.conversions.toString(), color: 'var(--teal)' },
                { label: 'Revenue', val: c.revenue, max: maxRevenue, fmt: `£${(c.revenue/1000).toFixed(1)}k`, color: '#9b6dff' },
              ].map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-1" style={{ color: 'var(--text2)' }}>
                    <span>{bar.label}</span>
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{bar.fmt}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(bar.val / bar.max) * 100}%`, background: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="var(--teal)" />
              </svg>
              <span className="text-[13px] font-semibold">Recommendations</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {insights.map((ins, i) => {
                const s = INSIGHT_COLORS[ins.type] || INSIGHT_COLORS.info
                return (
                  <div key={i} className="rounded-lg p-3.5 border-l-[3px]" style={{ background: s.bg, borderLeftColor: s.border }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                      <span className="text-[12px] font-semibold">{ins.title}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed pl-3.5" style={{ color: 'var(--text2)' }}>{ins.body}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg p-4 border" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
            <div className="text-[12px] font-semibold mb-3">Quick actions</div>
            <div className="flex flex-wrap gap-2">
              <button
                className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg4)]"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}
              >
                {c.status === 'Active' ? '⏸ Pause campaign' : '▶ Activate campaign'}
              </button>
              <button
                className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg4)]"
                style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}
              >
                💰 Adjust budget
              </button>
              <a
                href="/variants"
                className="text-[12px] px-3 py-1.5 rounded-lg font-medium no-underline"
                style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(0,212,160,0.3)' }}
              >
                ✨ Generate new variants →
              </a>
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
  const [selected, setSelected] = useState<Campaign | null>(null)

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

  const sel = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[15px] font-semibold">All Campaigns</span>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={sel}>
              <option value="">All Statuses</option>
              <option>Active</option><option>Paused</option><option>Ended</option>
            </select>
            <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setActiveTab(e.target.value) }}
              className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={sel}>
              <option value="">All Platforms</option>
              <option>Meta</option><option>Google</option><option>TikTok</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1 mb-3">
          {tabs.map(t => (
            <button key={t.value}
              onClick={() => { setActiveTab(t.value); setPlatformFilter(t.value) }}
              className={clsx('flex items-center gap-1.5 px-3 py-[5px] rounded-md text-[12px] font-medium border transition-all',
                activeTab === t.value
                  ? 'text-[var(--teal)] bg-[var(--teal-dim)] border-[var(--teal-dim2)]'
                  : 'text-[var(--text2)] border-transparent hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
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
                  {['Campaign', 'Platform', 'Status', 'Spend', 'Clicks', 'Conv.', 'ROAS', 'Actions'].map(col => (
                    <th key={col} className="text-left px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color: 'var(--text2)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}
                    className="transition-colors hover:bg-[var(--bg3)] cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setSelected(c)}>
                    <td className="px-3 py-3 font-medium">{c.name}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_DOTS[c.platform] }} />
                        {c.platform}
                      </span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3">£{c.spend.toLocaleString()}</td>
                    <td className="px-3 py-3">{(c.clicks / 1000).toFixed(1)}K</td>
                    <td className="px-3 py-3">{c.conversions.toLocaleString()}</td>
                    <td className="px-3 py-3"><RoasValue roas={c.roas} /></td>
                    <td className="px-3 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(c) }}
                        className="px-2.5 py-1 rounded-[5px] text-[11px] font-medium transition-colors hover:opacity-80"
                        style={{ background: 'var(--teal-dim)', color: 'var(--teal)', border: '1px solid rgba(0,212,160,0.25)' }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && <CampaignDrawer campaign={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
