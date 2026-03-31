'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, DollarSign, Zap, Target, BarChart2, CheckCircle, Clock, ChevronDown, ChevronUp, Sparkles, ArrowUpRight } from 'lucide-react'
import { BudgetSimulator } from '@/components/BudgetSimulator'

type Campaign = { id:string; name:string; platform:string; spend:number; revenue:number; roas:number; clicks:number; impressions:number; conversions:number; ctr:number; cpc:number; status:string }
type Rec = { type:string; campaign:string; platform:string; currentSpend:number; currentROAS:number; action:string; reason:string; impact:string; impactValue:number; confidence:number; priority:string; effort:string }
type BudgetMove = { from:string; fromPlatform:string; fromCurrentSpend:number; fromCurrentROAS:number; to:string; toPlatform:string; toCurrentSpend:number; toCurrentROAS:number; amount:number; projectedRevenueLift:number; reason:string }
type Analysis = {
  summary:string; totalWastedSpend:number; totalOpportunityGain:number;
  projectedROAS:number; projectedRevenue:number; confidence:number;
  platformInsights:{platform:string;verdict:string;score:number;spend:number;roas:number;recommendation:string}[];
  budgetPlan: BudgetMove[];
  recommendations: Rec[];
  quickWin:{title:string;description:string;action:string;impact:string;impactValue:number};
}

const MOCK:Campaign[] = [
  { id:'1', name:'Summer Sale — Broad Audience',  platform:'Meta',   spend:3200, revenue:4480,  roas:1.4, clicks:8200, impressions:142000, conversions:89,  ctr:5.77, cpc:0.39, status:'Active' },
  { id:'2', name:'Retargeting — Cart Abandoners', platform:'Meta',   spend:800,  revenue:6240,  roas:7.8, clicks:1240, impressions:18600,  conversions:156, ctr:6.67, cpc:0.65, status:'Active' },
  { id:'3', name:'Brand Awareness Q3',            platform:'Google', spend:1500, revenue:1200,  roas:0.8, clicks:3100, impressions:89000,  conversions:24,  ctr:3.48, cpc:0.48, status:'Active' },
  { id:'4', name:'Google Shopping — All Products',platform:'Google', spend:1200, revenue:5400,  roas:4.5, clicks:2800, impressions:41000,  conversions:108, ctr:6.83, cpc:0.43, status:'Active' },
  { id:'5', name:'TikTok — Product Demo Video',   platform:'TikTok', spend:2100, revenue:2520,  roas:1.2, clicks:6700, impressions:198000, conversions:63,  ctr:3.38, cpc:0.31, status:'Active' },
  { id:'6', name:'Lookalike — Past Purchasers',   platform:'Meta',   spend:950,  revenue:5700,  roas:6.0, clicks:1800, impressions:28000,  conversions:142, ctr:6.43, cpc:0.53, status:'Active' },
]

const PLATFORM_COLORS: Record<string,string> = { Meta:'#1877f2', Google:'#ea4335', TikTok:'#00d4a0' }
const EFFORT_LABELS: Record<string,string> = { immediate:'Act today', 'this-week':'This week', 'this-month':'This month' }

function ConfidenceRing({ value, size=36 }: { value:number; size?:number }) {
  const r = (size/2) - 3; const c = 2*Math.PI*r
  const col = value>=80?'var(--teal)':value>=60?'var(--warn)':'var(--danger)'
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg4)" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3}
          strokeDasharray={`${(value/100)*c} ${c-(value/100)*c}`} strokeLinecap="round"/>
      </svg>
      <span className="text-[9px] font-bold font-mono" style={{color:col,zIndex:1}}>{value}%</span>
    </div>
  )
}

function ROASBadge({ roas }: { roas:number }) {
  const col = roas>=4?'var(--teal)':roas>=2.5?'#4ade80':roas>=1.5?'var(--warn)':'var(--danger)'
  const bg = roas>=4?'rgba(0,212,160,0.1)':roas>=2.5?'rgba(74,222,128,0.1)':roas>=1.5?'rgba(255,170,68,0.1)':'rgba(255,92,92,0.1)'
  return <span className="font-mono font-bold text-[12px] px-2 py-0.5 rounded" style={{color:col,background:bg}}>{roas.toFixed(1)}x</span>
}

function ApplyButton({ applied, onClick }: { applied:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} disabled={applied}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0"
      style={{ background: applied?'rgba(0,212,160,0.1)':'var(--teal)', color: applied?'var(--teal)':'#001a12',
               border: applied?'1px solid rgba(0,212,160,0.3)':'none', cursor: applied?'default':'pointer' }}>
      {applied ? <><CheckCircle size={11}/> Applied</> : <>Apply â</>}
    </button>
  )
}

export default function SpendPage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis|null>(null)
  const [usingMock, setUsingMock] = useState(false)
  const [budget, setBudget] = useState('')
  const [applied, setApplied] = useState<Set<number>>(new Set())
  const [appliedMoves, setAppliedMoves] = useState<Set<number>>(new Set())
  const [showScenario, setShowScenario] = useState(false)
  const [scenarioFrom, setScenarioFrom] = useState('')
  const [scenarioTo, setScenarioTo] = useState('')
  const [scenarioAmount, setScenarioAmount] = useState('')
  const [expandedRec, setExpandedRec] = useState<number|null>(null)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('campaigns').select('*').eq('user_id', user.id).eq('status','Active')
      if (data?.length) { setCampaigns(data); setUsingMock(false) }
      else { setCampaigns(MOCK); setUsingMock(true) }
      setLoading(false)
    }
    load()
  }, [user])

  const totalSpend = campaigns.reduce((s,c)=>s+c.spend,0)
  const totalRevenue = campaigns.reduce((s,c)=>s+c.revenue,0)
  const avgROAS = totalSpend>0?totalRevenue/totalSpend:0

  // Apply a budget move — updates local campaign state to show projected numbers
  const applyMove = (idx:number, move:BudgetMove) => {
    setAppliedMoves(prev => new Set([...prev, idx]))
    setCampaigns(prev => prev.map(c => {
      if (c.name===move.from) return {...c, spend: c.spend-move.amount, revenue: c.revenue-(move.amount*c.roas)}
      if (c.name===move.to) {
        const newSpend = c.spend+move.amount
        const newRevenue = c.revenue+(move.amount*c.roas)
        return {...c, spend: newSpend, revenue: newRevenue, roas: newRevenue/newSpend}
      }
      return c
    }))
  }

  // Scenario calculator
  const scenarioCampaign = campaigns.find(c=>c.name===scenarioFrom)
  const scenarioTarget = campaigns.find(c=>c.name===scenarioTo)
  const scenarioAmt = parseFloat(scenarioAmount)||0
  const scenarioLift = scenarioTarget && scenarioAmt>0 ? Math.round(scenarioAmt*scenarioTarget.roas - scenarioAmt) : 0

  const runAnalysis = async () => {
    setAnalysing(true); setAnalysis(null); setApplied(new Set()); setAppliedMoves(new Set())
    try {
      const res = await fetch('/api/spend-intelligence', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ campaigns, totalBudget: parseFloat(budget)||totalSpend, currency:'GBP' })
      })
      setAnalysis(await res.json())
    } catch(e){ console.error(e) } finally { setAnalysing(false) }
  }

  // Projected totals after applying all moves
  const projectedSpend = totalSpend
  const projectedRevenue = analysis ? analysis.projectedRevenue : totalRevenue
  const projectedROAS = analysis ? analysis.projectedROAS : avgROAS

  const is = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading campaigns...</span></div>

  return (
    <>
      <PageHeader title="AI Spend Intelligence" subtitle="Claude analyses every campaign and tells you exactly where to move budget to maximise ROAS.">
        <button onClick={runAnalysis} disabled={analysing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing ? <><Spinner size={13}/> Analysing with AI...</> : <><Zap size={14}/> Run AI Analysis</>}
        </button>
      </PageHeader>

      {usingMock && (
        <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]"
          style={{background:'rgba(255,170,68,0.08)',borderColor:'rgba(255,170,68,0.25)',color:'var(--warn)'}}>
          <AlertTriangle size={13}/>Demo data shown — <a href="/import" className="underline ml-1">connect your ad platforms</a> to analyse real campaigns.
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          {label:'Monthly Spend',    value:`£${totalSpend.toLocaleString()}`,             icon:<DollarSign size={14}/>, hi:false},
          {label:'Monthly Revenue',  value:`£${totalRevenue.toLocaleString()}`,           icon:<TrendingUp size={14}/>,  hi:true},
          {label:'Blended ROAS',     value:`${avgROAS.toFixed(2)}x`,                     icon:<BarChart2 size={14}/>,   hi:avgROAS>=3},
          {label:'Active Campaigns', value:campaigns.length,                                icon:<Target size={14}/>,      hi:false},
        ].map((c,i)=>(
          <div key={i} className="rounded-xl border p-4" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px]" style={{color:'var(--text2)'}}>{c.label}</span>
              <span style={{color:c.hi?'var(--teal)':'var(--text3)'}}>{c.icon}</span>
            </div>
            <div className="text-[24px] font-bold font-mono" style={{color:c.hi?'var(--teal)':'var(--text)'}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Campaign table with signal indicators */}
      <div className="rounded-xl border overflow-hidden mb-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{borderColor:'var(--border)'}}>
          <div className="text-[13px] font-semibold">Campaign overview</div>
          <div className="text-[11px]" style={{color:'var(--text3)'}}>Sorted by ROAS — highest first</div>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Campaign','Platform','Spend','Revenue','ROAS','CPC','Signal'].map(h=>(
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]" style={{color:'var(--text2)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[...campaigns].sort((a,b)=>b.roas-a.roas).map(c=>{
              const sig = c.roas>=4?{l:'Scale ↑',c:'var(--teal)',bg:'rgba(0,212,160,0.1)'}
                        : c.roas>=2.5?{l:'Maintain',c:'var(--warn)',bg:'rgba(255,170,68,0.1)'}
                        : {l:'Review ↓',c:'var(--danger)',bg:'rgba(255,92,92,0.1)'}
              return (
                <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}} className="hover:bg-[var(--bg3)] transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[220px]"><div className="truncate">{c.name}</div></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:PLATFORM_COLORS[c.platform]||'#888'}}/>
                      {c.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">£{c.spend.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono" style={{color:'var(--teal)'}}>£{c.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3"><ROASBadge roas={c.roas}/></td>
                  <td className="px-4 py-3 font-mono" style={{color:'var(--text2)'}}>£{c.cpc.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{background:sig.bg,color:sig.c}}>{sig.l}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Budget input + run */}
      <div className="rounded-xl border p-5 mb-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-[12px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Monthly budget to optimise</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{color:'var(--text2)'}}>£</span>
              <input type="number" value={budget} onChange={e=>setBudget(e.target.value)}
                placeholder={totalSpend.toLocaleString()}
                className="w-full rounded-lg border pl-7 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is}/>
            </div>
          </div>
          <button onClick={runAnalysis} disabled={analysing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
            style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
            {analysing?<><Spinner size={13}/> Analysing...</>:<><Zap size={14}/> Run AI Analysis</>}
          </button>
          <button onClick={()=>setShowScenario(!showScenario)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-all"
            style={{borderColor:'var(--border2)',color:'var(--text2)',background:'transparent'}}>
            <BarChart2 size={14}/> What-if scenario {showScenario?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
          </button>
        </div>

        {/* Scenario calculator */}
        {showScenario && (
          <div className="mt-4 pt-4 border-t" style={{borderColor:'var(--border)'}}>
            <div className="text-[12px] font-semibold mb-3" style={{color:'var(--text2)'}}>What if I moved budget from one campaign to another?</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] mb-1" style={{color:'var(--text3)'}}>Move FROM</label>
                <select value={scenarioFrom} onChange={e=>setScenarioFrom(e.target.value)} className="rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
                  <option value="">Select campaign</option>
                  {campaigns.map(c=><option key={c.id} value={c.name}>{c.name} ({c.roas.toFixed(1)}x)</option>)}
                </select>
              </div>
              <ArrowRight size={16} style={{color:'var(--text3)',marginTop:16}}/>
              <div>
                <label className="block text-[10px] mb-1" style={{color:'var(--text3)'}}>Move TO</label>
                <select value={scenarioTo} onChange={e=>setScenarioTo(e.target.value)} className="rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
                  <option value="">Select campaign</option>
                  {campaigns.filter(c=>c.name!==scenarioFrom).map(c=><option key={c.id} value={c.name}>{c.name} ({c.roas.toFixed(1)}x)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] mb-1" style={{color:'var(--text3)'}}>Amount (£)</label>
                <input type="number" value={scenarioAmount} onChange={e=>setScenarioAmount(e.target.value)} placeholder="500" className="w-28 rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}/>
              </div>
              {scenarioAmt>0 && scenarioTarget && (
                <div className="rounded-lg px-4 py-2 border" style={{background:scenarioLift>0?'rgba(0,212,160,0.08)':'rgba(255,92,92,0.08)',borderColor:scenarioLift>0?'rgba(0,212,160,0.3)':'rgba(255,92,92,0.3)',marginTop:16}}>
                  <div className="text-[10px] font-medium" style={{color:'var(--text3)'}}>Projected revenue lift</div>
                  <div className="text-[16px] font-bold font-mono" style={{color:scenarioLift>0?'var(--teal)':'var(--danger)'}}>
                    {scenarioLift>0?'+':''}£{Math.abs(scenarioLift).toLocaleString()}/mo
                  </div>
                  <div className="text-[10px]" style={{color:'var(--text3)'}}>Based on {scenarioTarget.name}'s {scenarioTarget.roas.toFixed(1)}x ROAS</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BUDGET SIMULATOR — always visible */}
      <div className="mb-5">
        <BudgetSimulator campaigns={campaigns} />
      </div>

      {/* ANALYSIS RESULTS */}
      {analysis && (
        <div className="flex flex-col gap-5">

          {/* Quick win banner */}
          {analysis.quickWin && (
            <div className="rounded-xl border p-5 flex items-start gap-4"
              style={{background:'linear-gradient(135deg, rgba(0,212,160,0.08), rgba(0,212,160,0.03))',borderColor:'rgba(0,212,160,0.3)'}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'var(--teal)'}}>
                <Sparkles size={18} color="#001a12"/>
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{color:'var(--teal)'}}>â¡ Biggest quick win</div>
                <div className="text-[15px] font-bold mb-1">{analysis.quickWin.title}</div>
                <div className="text-[12px] mb-2" style={{color:'var(--text2)'}}>{analysis.quickWin.description}</div>
                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-semibold px-3 py-1.5 rounded-lg" style={{background:'var(--teal)',color:'#001a12'}}>
                    {analysis.quickWin.action}
                  </div>
                  <div className="text-[14px] font-bold font-mono" style={{color:'var(--teal)'}}>{analysis.quickWin.impact}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary + projected outcome */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{color:'var(--teal)'}}/>
                <span className="text-[13px] font-bold">AI Summary</span>
                <ConfidenceRing value={analysis.confidence} size={32}/>
              </div>
              <p className="text-[12px] leading-relaxed mb-4" style={{color:'var(--text2)'}}>{analysis.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{background:'rgba(255,92,92,0.08)',border:'1px solid rgba(255,92,92,0.2)'}}>
                  <div className="text-[9px] uppercase font-bold mb-1" style={{color:'var(--danger)'}}>Wasted spend</div>
                  <div className="text-[20px] font-bold font-mono" style={{color:'var(--danger)'}}>£{analysis.totalWastedSpend?.toLocaleString()}/mo</div>
                </div>
                <div className="rounded-lg p-3" style={{background:'rgba(0,212,160,0.08)',border:'1px solid rgba(0,212,160,0.2)'}}>
                  <div className="text-[9px] uppercase font-bold mb-1" style={{color:'var(--teal)'}}>Revenue opportunity</div>
                  <div className="text-[20px] font-bold font-mono" style={{color:'var(--teal)'}}>+£{analysis.totalOpportunityGain?.toLocaleString()}/mo</div>
                </div>
              </div>
            </div>

            {/* Before / after projection */}
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="text-[13px] font-bold mb-4 flex items-center gap-2">
                <ArrowUpRight size={14} style={{color:'var(--teal)'}}/>
                Projected outcome (after all recommendations)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:'Current ROAS',     val:`${avgROAS.toFixed(2)}x`,           proj:`${projectedROAS.toFixed(2)}x`,   good:projectedROAS>avgROAS},
                  {label:'Current Revenue',  val:`£${totalRevenue.toLocaleString()}`, proj:`£${projectedRevenue?.toLocaleString()}`, good:projectedRevenue>totalRevenue},
                ].map((row,i)=>(
                  <div key={i} className="rounded-lg p-3" style={{background:'var(--bg3)'}}>
                    <div className="text-[10px] mb-2" style={{color:'var(--text3)'}}>{row.label}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-mono line-through" style={{color:'var(--text3)'}}>{row.val}</div>
                      <ArrowRight size={10} style={{color:'var(--text3)'}}/>
                      <div className="text-[15px] font-bold font-mono" style={{color:row.good?'var(--teal)':'var(--danger)'}}>{row.proj}</div>
                    </div>
                    {row.good && <div className="text-[9px] mt-1" style={{color:'var(--teal)'}}>↑ Improvement projected</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget reallocation plan */}
          {analysis.budgetPlan?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="text-[14px] font-bold mb-1 flex items-center gap-2">
                <DollarSign size={15} style={{color:'var(--teal)'}}/>
                Budget reallocation plan
              </div>
              <p className="text-[12px] mb-4" style={{color:'var(--text3)'}}>Move budget from underperforming campaigns to your star performers. Apply moves individually or all at once.</p>
              <div className="flex flex-col gap-3">
                {analysis.budgetPlan.map((move,i)=>(
                  <div key={i} className="rounded-lg border p-4" style={{background:'var(--bg3)',borderColor:appliedMoves.has(i)?'rgba(0,212,160,0.3)':'var(--border)'}}>
                    <div className="flex items-center gap-3 mb-2">
                      {/* FROM */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium uppercase mb-1" style={{color:'var(--danger)'}}>↓ Remove from</div>
                        <div className="text-[12px] font-semibold truncate">{move.from}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px]" style={{color:'var(--text3)'}}>{move.fromPlatform}</span>
                          <ROASBadge roas={move.fromCurrentROAS||0}/>
                          <span className="text-[10px] font-mono" style={{color:'var(--text3)'}}>£{move.fromCurrentSpend?.toLocaleString()}/mo</span>
                        </div>
                      </div>
                      {/* AMOUNT */}
                      <div className="shrink-0 text-center px-3">
                        <div className="text-[10px] mb-1" style={{color:'var(--text3)'}}>Move</div>
                        <div className="text-[18px] font-bold font-mono" style={{color:'var(--teal)'}}>£{move.amount?.toLocaleString()}</div>
                        <ArrowRight size={14} style={{color:'var(--text3)',margin:'2px auto'}}/>
                      </div>
                      {/* TO */}
                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-[10px] font-medium uppercase mb-1" style={{color:'var(--teal)'}}>↑ Add to</div>
                        <div className="text-[12px] font-semibold truncate">{move.to}</div>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className="text-[10px]" style={{color:'var(--text3)'}}>{move.toPlatform}</span>
                          <ROASBadge roas={move.toCurrentROAS||0}/>
                          <span className="text-[10px] font-mono" style={{color:'var(--text3)'}}>£{move.toCurrentSpend?.toLocaleString()}/mo</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t" style={{borderColor:'var(--border)'}}>
                      <div>
                        <span className="text-[11px]" style={{color:'var(--text2)'}}>{move.reason}</span>
                        {move.projectedRevenueLift>0 && (
                          <span className="ml-2 text-[11px] font-bold" style={{color:'var(--teal)'}}>
                            · Projected +£{move.projectedRevenueLift?.toLocaleString()}/mo
                          </span>
                        )}
                      </div>
                      <ApplyButton applied={appliedMoves.has(i)} onClick={()=>applyMove(i,move)}/>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.budgetPlan.length>1 && (
                <button
                  onClick={()=>analysis.budgetPlan.forEach((m,i)=>{ if(!appliedMoves.has(i)) applyMove(i,m) })}
                  className="mt-3 w-full py-2.5 rounded-lg text-[13px] font-bold border transition-all"
                  style={{borderColor:'rgba(0,212,160,0.3)',color:'var(--teal)',background:'rgba(0,212,160,0.06)'}}>
                  Apply all {analysis.budgetPlan.length} moves at once â
                </button>
              )}
            </div>
          )}

          {/* Platform scores */}
          {analysis.platformInsights?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="text-[14px] font-bold mb-4">Platform efficiency scores</div>
              <div className="grid grid-cols-3 gap-4">
                {analysis.platformInsights.map((p,i)=>{
                  const recColors:any = {scale:'var(--teal)',maintain:'var(--warn)',cut:'var(--danger)',diversify:'#a78bfa'}
                  const col = recColors[p.recommendation]||'var(--text2)'
                  return (
                    <div key={i} className="rounded-lg border p-4" style={{background:'var(--bg3)',borderColor:'var(--border)'}}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{background:PLATFORM_COLORS[p.platform]||'#888'}}/>
                          <span className="text-[13px] font-semibold">{p.platform}</span>
                        </div>
                        <ConfidenceRing value={p.score} size={40}/>
                      </div>
                      <div className="h-1.5 rounded-full mb-2" style={{background:'var(--bg4)'}}>
                        <div className="h-full rounded-full transition-all" style={{width:`${p.score}%`,background:p.score>=70?'var(--teal)':p.score>=40?'var(--warn)':'var(--danger)'}}/>
                      </div>
                      <div className="text-[11px] mb-2" style={{color:'var(--text2)'}}>{p.verdict}</div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{background:col+'18',color:col}}>
                        {p.recommendation}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Campaign recommendations */}
          {analysis.recommendations?.length>0 && (
            <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{borderColor:'var(--border)'}}>
                <div className="text-[14px] font-bold">Campaign recommendations</div>
                <div className="text-[11px]" style={{color:'var(--text3)'}}>{analysis.recommendations.length} actions identified</div>
              </div>
              {analysis.recommendations.map((r,i)=>{
                const typeColor = r.type==='scale'?'var(--teal)':r.type==='cut'||r.type==='pause'?'var(--danger)':r.type==='reallocate'?'#a78bfa':'var(--warn)'
                const expanded = expandedRec===i
                const effortColor = r.effort==='immediate'?'var(--danger)':r.effort==='this-week'?'var(--warn)':'var(--text3)'
                return (
                  <div key={i} style={{borderBottom:'1px solid var(--border)'}}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg3)] cursor-pointer transition-colors"
                      onClick={()=>setExpandedRec(expanded?null:i)}>
                      <ConfidenceRing value={r.confidence||75} size={36}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[13px] font-semibold truncate max-w-[280px]">{r.campaign}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{background:'var(--bg4)',color:'var(--text3)'}}>{r.platform}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                            style={{background:r.priority==='high'?'rgba(255,92,92,0.1)':r.priority==='medium'?'rgba(255,170,68,0.1)':'rgba(0,212,160,0.1)',
                                    color:r.priority==='high'?'var(--danger)':r.priority==='medium'?'var(--warn)':'var(--teal)'}}>
                            {r.priority}
                          </span>
                        </div>
                        <div className="text-[13px] font-semibold" style={{color:typeColor}}>{r.action}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[14px] font-bold font-mono" style={{color:typeColor}}>{r.impact}</div>
                        <div className="text-[10px] mt-0.5" style={{color:effortColor}}>
                          <Clock size={9} style={{display:'inline',marginRight:3}}/>{EFFORT_LABELS[r.effort]||r.effort}
                        </div>
                      </div>
                      <ApplyButton applied={applied.has(i)} onClick={(e:any)=>{ e.stopPropagation(); setApplied(prev=>new Set([...prev,i])) }}/>
                      {expanded?<ChevronUp size={14} style={{color:'var(--text3)',shrink:0}}/>:<ChevronDown size={14} style={{color:'var(--text3)',shrink:0}}/>}
                    </div>
                    {expanded && (
                      <div className="px-5 pb-4 pt-0 ml-[52px]">
                        <div className="rounded-lg p-3 text-[12px]" style={{background:'var(--bg3)'}}>
                          <div className="font-semibold mb-1" style={{color:'var(--text2)'}}>Why this recommendation?</div>
                          <div style={{color:'var(--text2)'}}>{r.reason}</div>
                          {r.currentROAS&&<div className="mt-1.5 text-[11px]" style={{color:'var(--text3)'}}>Current ROAS: <span className="font-mono">{r.currentROAS?.toFixed(1)}x</span> · Current spend: <span className="font-mono">£{r.currentSpend?.toLocaleString()}</span></div>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
