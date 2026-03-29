'use client'
import { useState, useEffect, useRef } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Calculator, TrendingUp, DollarSign, Target, Zap, Download, Share2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Snapchat Ads', 'Pinterest Ads']
const OBJECTIVES = ['Brand Awareness', 'Lead Generation', 'E-commerce Sales', 'App Installs', 'Video Views', 'Website Traffic']
const INDUSTRIES = ['Fashion / Apparel', 'Beauty / Cosmetics', 'Health / Wellness', 'Electronics / Tech', 'Food / Beverage', 'Home / Living', 'Travel / Hospitality', 'Finance / Insurance', 'SaaS / Software', 'Education', 'Fitness', 'Automotive', 'Other']

// Industry benchmarks
const BENCHMARKS: Record<string, { ctr: number; cvr: number; cpc: number; roas: number }> = {
  'Fashion / Apparel':    { ctr: 1.24, cvr: 2.7,  cpc: 0.52, roas: 2.8 },
  'Beauty / Cosmetics':  { ctr: 1.61, cvr: 3.2,  cpc: 0.44, roas: 3.4 },
  'Health / Wellness':   { ctr: 1.79, cvr: 2.9,  cpc: 0.63, roas: 2.6 },
  'Electronics / Tech':  { ctr: 1.02, cvr: 1.8,  cpc: 0.79, roas: 2.1 },
  'Food / Beverage':     { ctr: 1.47, cvr: 2.1,  cpc: 0.41, roas: 2.3 },
  'Home / Living':       { ctr: 1.33, cvr: 2.4,  cpc: 0.57, roas: 2.5 },
  'Travel / Hospitality':{ ctr: 1.55, cvr: 1.9,  cpc: 0.71, roas: 2.2 },
  'Finance / Insurance': { ctr: 0.89, cvr: 1.4,  cpc: 1.24, roas: 1.8 },
  'SaaS / Software':     { ctr: 0.94, cvr: 1.6,  cpc: 1.08, roas: 1.9 },
  'Education':           { ctr: 1.11, cvr: 2.2,  cpc: 0.58, roas: 2.0 },
  'Fitness':             { ctr: 1.68, cvr: 3.1,  cpc: 0.49, roas: 3.1 },
  'Automotive':          { ctr: 0.77, cvr: 1.1,  cpc: 0.89, roas: 1.6 },
  'Other':               { ctr: 1.20, cvr: 2.0,  cpc: 0.65, roas: 2.2 },
}

function Slider({ label, value, min, max, step, onChange, prefix = '', suffix = '', color = 'var(--teal)' }: any) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>{label}</label>
        <span className="text-[13px] font-bold font-mono" style={{ color }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
        <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        <div className="absolute w-3.5 h-3.5 rounded-full border-2 -mt-1 -ml-1.5 transition-all"
          style={{ left: `${pct}%`, top: '50%', transform: 'translateY(-50%)', borderColor: color, background: 'var(--bg2)' }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{prefix}{min.toLocaleString()}{suffix}</span>
        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  )
}

function ResultCard({ label, value, sub, color = 'var(--text)', bg = 'var(--bg2)', highlight = false }: any) {
  return (
    <div className="rounded-xl border p-4 transition-all"
      style={{ background: highlight ? 'rgba(0,212,160,0.06)' : bg, borderColor: highlight ? 'rgba(0,212,160,0.3)' : 'var(--border)' }}>
      <div className="text-[11px] font-medium mb-2 uppercase tracking-[0.5px]" style={{ color: 'var(--text2)' }}>{label}</div>
      <div className="text-[24px] font-bold font-mono leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] mt-1.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
    </div>
  )
}
export default function ROICalculatorPage() {
  const { user } = useUser()
  const [platform, setPlatform] = useState('Meta Ads')
  const [objective, setObjective] = useState('E-commerce Sales')
  const [industry, setIndustry] = useState('Fashion / Apparel')
  const [budget, setBudget] = useState(5000)
  const [productPrice, setProductPrice] = useState(65)
  const [targetROAS, setTargetROAS] = useState(3.5)
  const [ctr, setCtr] = useState(1.5)
  const [cvr, setCvr] = useState(2.5)
  const [cpc, setCpc] = useState(0.55)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAdvice, setAiAdvice] = useState('')
  const [showBenchmarks, setShowBenchmarks] = useState(true)
  const [historicalROAS, setHistoricalROAS] = useState<number | null>(null)

  // Load user's historical ROAS from their campaigns
  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('campaigns').select('spend,revenue').eq('user_id', user.id)
      if (data?.length) {
        const spend = data.reduce((s, c) => s + (c.spend || 0), 0)
        const revenue = data.reduce((s, c) => s + (c.revenue || 0), 0)
        if (spend > 0) setHistoricalROAS(parseFloat((revenue / spend).toFixed(2)))
      }
    }
    load()
  }, [user])

  // Apply benchmark when industry changes
  useEffect(() => {
    const b = BENCHMARKS[industry]
    if (b && showBenchmarks) { setCtr(b.ctr); setCvr(b.cvr); setCpc(b.cpc); setTargetROAS(b.roas) }
  }, [industry, showBenchmarks])

  // Calculations
  const impressions = Math.round(budget / cpc * (100 / ctr))
  const clicks = Math.round(budget / cpc)
  const conversions = Math.round(clicks * cvr / 100)
  const revenue = conversions * productPrice
  const actualROAS = budget > 0 ? revenue / budget : 0
  const profit = revenue - budget
  const cpa = conversions > 0 ? budget / conversions : 0
  const breakEvenROAS = 1
  const revenueNeeded = budget * targetROAS
  const conversionsNeeded = Math.ceil(revenueNeeded / productPrice)
  const cvrNeeded = clicks > 0 ? (conversionsNeeded / clicks) * 100 : 0
  const roasDiff = actualROAS - targetROAS
  const isProfit = profit > 0
  const roasColor = actualROAS >= targetROAS ? 'var(--teal)' : actualROAS >= 1.5 ? 'var(--warn)' : 'var(--danger)'
  const benchmark = BENCHMARKS[industry]

  const runAI = async () => {
    setAiLoading(true); setAiAdvice('')
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roi_calculator',
          data: { platform, objective, industry, budget, productPrice, targetROAS, ctr, cvr, cpc, projectedROAS: actualROAS.toFixed(2), projectedRevenue: revenue, projectedConversions: conversions, projectedProfit: profit, historicalROAS, benchmark },
          prompt: `You are an expert paid media strategist. A user is planning a ${platform} campaign with £${budget} budget selling a £${productPrice} product in the ${industry} industry. Their projected ROAS is ${actualROAS.toFixed(2)}x against a target of ${targetROAS}x. Industry benchmark CTR is ${benchmark?.ctr}%, CVR is ${benchmark?.cvr}%, CPC is £${benchmark?.cpc}. ${historicalROAS ? `Their historical ROAS on Pulse is ${historicalROAS}x.` : ''} Give 3-4 specific, actionable recommendations to improve their projected ROAS and hit their target. Include specific tactics for ${platform}, realistic expectations, and what to test first. Be direct and use numbers.`
        })
      })
      const d = await res.json()
      setAiAdvice(d.analysis || d.message || 'No analysis returned')
    } catch(e) { setAiAdvice('Analysis failed. Please try again.') }
    finally { setAiLoading(false) }
  }

  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Campaign ROI Calculator"
        subtitle="Project your campaign performance before you spend a penny. Model budget, ROAS and break-even scenarios.">
        <button onClick={runAI} disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border"
          style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
          {aiLoading ? <><Spinner size={13}/> Analysing...</> : <><Zap size={13}/> Get AI Recommendations</>}
        </button>
      </PageHeader>

      {/* Historical ROAS banner */}
      {historicalROAS && (
        <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]"
          style={{ background: 'rgba(0,212,160,0.06)', borderColor: 'rgba(0,212,160,0.2)', color: 'var(--teal)' }}>
          <TrendingUp size={13}/>
          Your historical blended ROAS from connected campaigns is <strong className="ml-1">{historicalROAS}x</strong>
          <button onClick={() => setTargetROAS(historicalROAS)} className="ml-2 underline text-[11px]">Use as target</button>
        </div>
      )}

      <div className="grid grid-cols-[380px_1fr] gap-6">

        {/* Left: Inputs */}
        <div className="flex flex-col gap-4">

          {/* Campaign setup */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[13px] font-semibold mb-4">Campaign setup</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Platform</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Objective</label>
                <select value={objective} onChange={e => setObjective(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
                  {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Industry</label>
                <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px]" style={{ color: 'var(--text2)' }}>Apply industry benchmarks</span>
                <button onClick={() => setShowBenchmarks(!showBenchmarks)}
                  className="w-9 h-5 rounded-full transition-colors relative"
                  style={{ background: showBenchmarks ? 'var(--teal)' : 'var(--bg4)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: showBenchmarks ? 'calc(100% - 18px)' : '2px' }}/>
                </button>
              </div>
            </div>
          </div>

          {/* Budget & product */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[13px] font-semibold mb-4">Budget & product</div>
            <div className="flex flex-col gap-5">
              <Slider label="Monthly Budget" value={budget} min={500} max={50000} step={500} onChange={setBudget} prefix="£" color="var(--teal)" />
              <Slider label="Product / Order Value" value={productPrice} min={5} max={500} step={5} onChange={setProductPrice} prefix="£" color="#a78bfa" />
              <Slider label="Target ROAS" value={targetROAS} min={1} max={10} step={0.1} onChange={setTargetROAS} suffix="x" color="var(--warn)" />
            </div>
          </div>

          {/* Performance metrics */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold">Performance metrics</div>
              {showBenchmarks && benchmark && (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--teal-dim)', color: 'var(--teal)' }}>
                  Industry benchmarks applied
                </span>
              )}
            </div>
            <div className="flex flex-col gap-5">
              <Slider label="Click-Through Rate (CTR)" value={ctr} min={0.1} max={8} step={0.1} onChange={setCtr} suffix="%" color="var(--teal)" />
              <Slider label="Conversion Rate (CVR)" value={cvr} min={0.1} max={15} step={0.1} onChange={setCvr} suffix="%" color="#a78bfa" />
              <Slider label="Cost Per Click (CPC)" value={cpc} min={0.05} max={5} step={0.05} onChange={setCpc} prefix="£" color="var(--warn)" />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex flex-col gap-4">

          {/* Main results */}
          <div className="grid grid-cols-2 gap-3">
            <ResultCard label="Projected Revenue" value={`£${revenue.toLocaleString()}`} sub={`From ${conversions.toLocaleString()} conversions`} color="var(--teal)" highlight />
            <ResultCard label="Projected ROAS" value={`${actualROAS.toFixed(2)}x`}
              sub={roasDiff >= 0 ? `✓ ${roasDiff.toFixed(1)}x above target` : `${Math.abs(roasDiff).toFixed(1)}x below target`}
              color={roasColor} highlight={actualROAS >= targetROAS} />
            <ResultCard label="Projected Profit / Loss" value={`${profit >= 0 ? '+' : '-'}£${Math.abs(profit).toLocaleString()}`}
              sub={profit >= 0 ? 'After ad spend' : 'Loss after ad spend'} color={profit >= 0 ? 'var(--teal)' : 'var(--danger)'} />
            <ResultCard label="Cost Per Acquisition" value={`£${cpa.toFixed(2)}`} sub={`£${productPrice} product price`} />
          </div>

          {/* Reach funnel */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[13px] font-semibold mb-4">Projected reach funnel</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Impressions', value: impressions.toLocaleString(), pct: 100, color: 'var(--bg4)' },
                { label: 'Clicks', value: clicks.toLocaleString(), pct: (clicks/impressions)*100, color: '#a78bfa' },
                { label: 'Conversions', value: conversions.toLocaleString(), pct: (conversions/impressions)*100, color: 'var(--teal)' },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1 text-[12px]">
                    <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                    <span className="font-mono font-semibold">{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--bg4)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.max(row.pct, 0.5)}%`, background: row.color }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Break-even & targets */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[13px] font-semibold mb-4">Break-even & target analysis</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                <div className="text-[10px] uppercase font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Break-even revenue</div>
                <div className="text-[16px] font-bold font-mono">£{budget.toLocaleString()}</div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>Need {Math.ceil(budget/productPrice)} sales at 1x ROAS</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                <div className="text-[10px] uppercase font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Target revenue</div>
                <div className="text-[16px] font-bold font-mono" style={{ color: 'var(--warn)' }}>£{revenueNeeded.toLocaleString()}</div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>For {targetROAS}x ROAS target</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                <div className="text-[10px] uppercase font-medium mb-1.5" style={{ color: 'var(--text2)' }}>CVR needed</div>
                <div className="text-[16px] font-bold font-mono" style={{ color: cvrNeeded <= cvr ? 'var(--teal)' : 'var(--danger)' }}>{cvrNeeded.toFixed(1)}%</div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>{cvrNeeded <= cvr ? '✓ Below your current CVR' : `${(cvrNeeded - cvr).toFixed(1)}% above current`}</div>
              </div>
            </div>

            {/* Gap analysis */}
            {actualROAS < targetROAS && (
              <div className="mt-4 p-3 rounded-lg flex items-start gap-2.5"
                style={{ background: 'rgba(255,170,68,0.08)', border: '1px solid rgba(255,170,68,0.2)' }}>
                <AlertTriangle size={13} style={{ color: 'var(--warn)', marginTop: 2, flexShrink: 0 }} />
                <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--warn)' }}>Gap to target: {Math.abs(roasDiff).toFixed(1)}x ROAS.</strong>{' '}
                  To hit {targetROAS}x you need {conversionsNeeded.toLocaleString()} conversions ({cvrNeeded.toFixed(1)}% CVR) or reduce CPC to £{(budget / (impressions * ctr / 100)).toFixed(2)}.
                </div>
              </div>
            )}
          </div>

          {/* Industry comparison */}
          {benchmark && (
            <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="text-[13px] font-semibold mb-4">{industry} industry benchmarks</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Avg CTR', yours: ctr, bench: benchmark.ctr, suffix: '%' },
                  { label: 'Avg CVR', yours: cvr, bench: benchmark.cvr, suffix: '%' },
                  { label: 'Avg CPC', yours: cpc, bench: benchmark.cpc, prefix: '£' },
                  { label: 'Avg ROAS', yours: actualROAS, bench: benchmark.roas, suffix: 'x' },
                ].map((b, i) => {
                  const better = b.label === 'Avg CPC' ? b.yours <= b.bench : b.yours >= b.bench
                  return (
                    <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg3)' }}>
                      <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text2)' }}>{b.label}</div>
                      <div className="text-[15px] font-bold font-mono" style={{ color: better ? 'var(--teal)' : 'var(--warn)' }}>
                        {b.prefix || ''}{b.yours.toFixed(2)}{b.suffix || ''}
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>
                        Bench: {b.prefix || ''}{b.bench}{b.suffix || ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Advice */}
          {aiAdvice && (
            <div className="rounded-xl border p-5" style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: 'var(--teal)' }} />
                <span className="text-[14px] font-bold">AI Recommendations</span>
              </div>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text2)' }}>{aiAdvice}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}