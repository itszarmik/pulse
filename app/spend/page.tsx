'use client'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { PageHeader, Spinner } from '@/components/ui'
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Zap, DollarSign, Target, BarChart2 } from 'lucide-react'

type Campaign = {
  id: string
  name: string
  platform: string
  spend: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number
  cpc: number
  status: string
}

type Recommendation = {
  type: 'increase' | 'decrease' | 'pause' | 'reallocate' | 'opportunity'
  priority: 'high' | 'medium' | 'low'
  campaign?: string
  platform?: string
  title: string
  reason: string
  action: string
  impact: string
  amount?: number
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Summer Sale — Retargeting', platform: 'Meta', spend: 3200, clicks: 8400, conversions: 142, revenue: 18600, roas: 5.8, ctr: 3.2, cpc: 0.38, status: 'Active' },
  { id: '2', name: 'Brand Awareness Q3', platform: 'Meta', spend: 4800, clicks: 12000, conversions: 48, revenue: 5760, roas: 1.2, ctr: 1.1, cpc: 0.40, status: 'Active' },
  { id: '3', name: 'Google Shopping — All Products', platform: 'Google', spend: 2100, clicks: 5600, conversions: 98, revenue: 11760, roas: 5.6, ctr: 4.2, cpc: 0.37, status: 'Active' },
  { id: '4', name: 'TikTok UGC — Gen Z', platform: 'TikTok', spend: 3600, clicks: 9200, conversions: 31, revenue: 3720, roas: 1.03, ctr: 2.1, cpc: 0.39, status: 'Active' },
  { id: '5', name: 'Google Search — Brand', platform: 'Google', spend: 890, clicks: 4200, conversions: 156, revenue: 9360, roas: 10.5, ctr: 8.1, cpc: 0.21, status: 'Active' },
  { id: '6', name: 'Meta Prospecting — Lookalike', platform: 'Meta', spend: 2400, clicks: 6100, conversions: 62, revenue: 7440, roas: 3.1, ctr: 2.4, cpc: 0.39, status: 'Active' },
]

function priorityColor(p: string) {
  return p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warn)' : 'var(--teal)'
}
function priorityBg(p: string) {
  return p === 'high' ? 'rgba(255,92,92,0.1)' : p === 'medium' ? 'rgba(255,170,68,0.1)' : 'rgba(0,212,160,0.1)'
}
function typeIcon(t: string) {
  if (t === 'increase') return <TrendingUp size={16} />
  if (t === 'decrease') return <TrendingDown size={16} />
  if (t === 'pause') return <AlertTriangle size={16} />
  if (t === 'reallocate') return <ArrowRight size={16} />
  return <Zap size={16} />
}

export default function SpendIntelPage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [summary, setSummary] = useState('')
  const [totalSavings, setTotalSavings] = useState(0)
  const [totalUpside, setTotalUpside] = useState(0)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Active')
      if (data && data.length > 0) {
        setCampaigns(data)
      } else {
        // Use mock data for demo
        setCampaigns(MOCK_CAMPAIGNS)
      }
      setLoading(false)
    }
    load()
  }, [user])

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const byPlatform = campaigns.reduce((acc, c) => {
    if (!acc[c.platform]) acc[c.platform] = { spend: 0, revenue: 0, conversions: 0 }
    acc[c.platform].spend += c.spend
    acc[c.platform].revenue += c.revenue
    acc[c.platform].conversions += c.conversions
    return acc
  }, {} as Record<string, { spend: number; revenue: number; conversions: number }>)

  const handleAnalyse = async () => {
    setAnalysing(true)
    setRecs([])
    setSummary('')
    try {
      const campaignData = campaigns.map(c => ({
        name: c.name, platform: c.platform,
        spend: c.spend, revenue: c.revenue, roas: c.roas,
        ctr: c.ctr, cpc: c.cpc, conversions: c.conversions,
        clicks: c.clicks,
      }))

      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'spend_intelligence',
          campaigns: campaignData,
          totalSpend,
          totalRevenue,
          overallROAS: overallROAS.toFixed(2),
          byPlatform,
          prompt: `You are an expert media buyer. Analyse these ad campaigns and return a JSON object with:
{
  "summary": "2-3 sentence executive summary of the overall account health and biggest opportunity",
  "totalPotentialSavings": number (monthly £ that can be cut from underperforming campaigns),
  "totalPotentialUpside": number (monthly £ additional revenue if budget is reallocated optimally),
  "recommendations": [
    {
      "type": "increase|decrease|pause|reallocate|opportunity",
      "priority": "high|medium|low",
      "campaign": "campaign name",
      "platform": "platform name",
      "title": "short action title",
      "reason": "specific data-driven reason why",
      "action": "specific action to take with exact numbers",
      "impact": "expected outcome in £ or % terms",
      "amount": optional number representing £ to move
    }
  ]
}
Return ONLY valid JSON. Be specific with numbers. Prioritise highest-impact recommendations first. Max 6 recommendations.`,
        }),
      })
      const data = await res.json()
      const text = data.analysis || data.message || ''

      try {
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        setRecs(parsed.recommendations || [])
        setSummary(parsed.summary || '')
        setTotalSavings(parsed.totalPotentialSavings || 0)
        setTotalUpside(parsed.totalPotentialUpside || 0)
      } catch {
        setSummary(text)
      }
    } catch (e) {
      setSummary('Analysis failed. Please try again.')
    } finally {
      setAnalysing(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3" style={{ color: 'var(--text2)' }}>
      <Spinner /><span>Loading campaigns...</span>
    </div>
  )

  return (
    <>
      <PageHeader
        title="AI Spend Intelligence"
        subtitle="Claude analyses your campaigns and tells you exactly where to move budget to maximise ROAS.">
        <button onClick={handleAnalyse} disabled={analysing || campaigns.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
          style={{
            background: analysing ? 'var(--bg3)' : 'var(--teal)',
            color: analysing ? 'var(--text2)' : '#001a12',
            cursor: analysing ? 'wait' : 'pointer',
          }}>
          {analysing ? <><Spinner size={13} /> Analysing your spend...</> : <><Zap size={14} /> Run AI Analysis</>}
        </button>
      </PageHeader>

      {/* Overview KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Monthly Spend', value: `£${totalSpend.toLocaleString()}`, icon: <DollarSign size={14} />, color: 'var(--text)' },
          { label: 'Total Revenue', value: `£${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={14} />, color: 'var(--teal)' },
          { label: 'Overall ROAS', value: `${overallROAS.toFixed(2)}x`, icon: <Target size={14} />, color: overallROAS >= 3 ? 'var(--teal)' : overallROAS >= 2 ? 'var(--warn)' : 'var(--danger)' },
          { label: 'Active Campaigns', value: campaigns.length, icon: <BarChart2 size={14} />, color: 'var(--text)' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px]" style={{ color: 'var(--text2)' }}>{k.label}</span>
              <span style={{ color: 'var(--text3)' }}>{k.icon}</span>
            </div>
            <div className="text-[24px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="text-[13px] font-semibold mb-4">Spend & ROAS by Platform</div>
        <div className="flex flex-col gap-3">
          {Object.entries(byPlatform).sort((a, b) => b[1].spend - a[1].spend).map(([platform, stats]) => {
            const roas = stats.spend > 0 ? stats.revenue / stats.spend : 0
            const pct = totalSpend > 0 ? (stats.spend / totalSpend) * 100 : 0
            const roasColor = roas >= 4 ? 'var(--teal)' : roas >= 2 ? 'var(--warn)' : 'var(--danger)'
            return (
              <div key={platform}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium">{platform}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
                      style={{ background: roas >= 4 ? 'rgba(0,212,160,0.1)' : roas >= 2 ? 'rgba(255,170,68,0.1)' : 'rgba(255,92,92,0.1)', color: roasColor }}>
                      {roas.toFixed(1)}x ROAS
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[12px]">£{stats.spend.toLocaleString()}</span>
                    <span className="text-[10px] ml-2" style={{ color: 'var(--text3)' }}>{pct.toFixed(0)}% of budget</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: roas >= 4 ? 'var(--teal)' : roas >= 2 ? 'var(--warn)' : 'var(--danger)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Analysis results */}
      {(summary || recs.length > 0) && (
        <>
          {/* Savings/upside banner */}
          {(totalSavings > 0 || totalUpside > 0) && (
            <div className="grid grid-cols-2 gap-4 mb-5">
              {totalSavings > 0 && (
                <div className="rounded-xl border p-4 flex items-center gap-3"
                  style={{ background: 'rgba(255,92,92,0.06)', borderColor: 'rgba(255,92,92,0.2)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,92,92,0.15)' }}>
                    <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--danger)' }}>Wasted spend identified</div>
                    <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--danger)' }}>£{totalSavings.toLocaleString()}/mo</div>
                  </div>
                </div>
              )}
              {totalUpside > 0 && (
                <div className="rounded-xl border p-4 flex items-center gap-3"
                  style={{ background: 'rgba(0,212,160,0.06)', borderColor: 'rgba(0,212,160,0.2)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--teal-dim)' }}>
                    <TrendingUp size={18} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--teal)' }}>Potential additional revenue</div>
                    <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--teal)' }}>+£{totalUpside.toLocaleString()}/mo</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="rounded-xl border p-5 mb-5"
              style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} style={{ color: 'var(--teal)' }} />
                <span className="text-[13px] font-semibold">Executive Summary</span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>{summary}</p>
            </div>
          )}

          {/* Recommendations */}
          {recs.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-[14px] font-semibold">Recommendations ({recs.length})</div>
              {recs.map((rec, i) => (
                <div key={i} className="rounded-xl border p-5"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: priorityBg(rec.priority), color: priorityColor(rec.priority) }}>
                      {typeIcon(rec.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[14px] font-semibold">{rec.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: priorityBg(rec.priority), color: priorityColor(rec.priority) }}>
                          {rec.priority} priority
                        </span>
                        {rec.platform && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>
                            {rec.platform}
                          </span>
                        )}
                      </div>
                      {rec.campaign && (
                        <div className="text-[11px] mb-2 font-mono" style={{ color: 'var(--text3)' }}>
                          📊 {rec.campaign}
                        </div>
                      )}
                      <p className="text-[13px] mb-3 leading-relaxed" style={{ color: 'var(--text2)' }}>{rec.reason}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                          <div className="text-[10px] mb-1 font-medium" style={{ color: 'var(--text3)' }}>ACTION</div>
                          <div className="text-[12px]" style={{ color: 'var(--text)' }}>{rec.action}</div>
                        </div>
                        <div className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                          <div className="text-[10px] mb-1 font-medium" style={{ color: 'var(--teal)' }}>EXPECTED IMPACT</div>
                          <div className="text-[12px] font-semibold" style={{ color: 'var(--teal)' }}>{rec.impact}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty state — before analysis */}
      {!summary && recs.length === 0 && !analysing && (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--teal-dim)', border: '1px solid rgba(0,212,160,0.2)' }}>
            <Zap size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 className="text-[18px] font-bold mb-2">AI Spend Intelligence</h3>
          <p className="text-[14px] max-w-md mx-auto mb-6 leading-relaxed" style={{ color: 'var(--text2)' }}>
            Claude will analyse your campaign data across all platforms and tell you exactly where you're wasting budget and where you should invest more.
          </p>
          <div className="flex justify-center gap-6 mb-8">
            {[
              { icon: '🎯', text: 'Budget reallocation recommendations' },
              { icon: '💸', text: 'Identify wasted spend' },
              { icon: '📈', text: 'Find scaling opportunities' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text2)' }}>
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
          <button onClick={handleAnalyse} disabled={analysing}
            className="px-6 py-2.5 rounded-lg text-[14px] font-semibold"
            style={{ background: 'var(--teal)', color: '#001a12' }}>
            <Zap size={14} className="inline mr-2" />
            Run AI Analysis
          </button>
        </div>
      )}

      {/* Campaign table */}
      <div className="rounded-xl border overflow-hidden mt-6" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        <div className="px-5 py-3.5 border-b text-[13px] font-semibold" style={{ borderColor: 'var(--border)' }}>
          All Campaigns
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'Conversions', 'CPC', 'CTR'].map(col => (
                <th key={col} className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]"
                  style={{ color: 'var(--text2)' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => {
              const roasColor = c.roas >= 4 ? 'var(--teal)' : c.roas >= 2 ? 'var(--warn)' : 'var(--danger)'
              return (
                <tr key={c.id} className="transition-colors hover:bg-[var(--bg3)]"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text2)' }}>{c.platform}</td>
                  <td className="px-4 py-3 font-mono">£{c.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--teal)' }}>£{c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold" style={{ color: roasColor }}>{c.roas.toFixed(1)}x</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{c.conversions}</td>
                  <td className="px-4 py-3 font-mono">£{c.cpc.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono">{c.ctr.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}