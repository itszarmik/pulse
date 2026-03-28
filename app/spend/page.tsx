'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, DollarSign, Zap, Target, BarChart2 } from 'lucide-react'

type Campaign = { id:string; name:string; platform:string; spend:number; revenue:number; roas:number; clicks:number; impressions:number; conversions:number; ctr:number; cpc:number; status:string }
type Rec = { type:string; campaign:string; platform:string; action:string; reason:string; impact:string; priority:string }
type Analysis = { summary:string; totalWastedSpend:number; totalOpportunityGain:number; recommendations:Rec[]; platformInsights:{platform:string;verdict:string;score:number}[]; budgetPlan:{from:string;to:string;amount:number;reason:string}[] }

const MOCK:Campaign[] = [
  { id:'1', name:'Summer Sale — Broad Audience', platform:'Meta', spend:3200, revenue:4480, roas:1.4, clicks:8200, impressions:142000, conversions:89, ctr:5.77, cpc:0.39, status:'Active' },
  { id:'2', name:'Retargeting — Cart Abandoners', platform:'Meta', spend:800, revenue:6240, roas:7.8, clicks:1240, impressions:18600, conversions:156, ctr:6.67, cpc:0.65, status:'Active' },
  { id:'3', name:'Brand Awareness Q3', platform:'Google', spend:1500, revenue:1200, roas:0.8, clicks:3100, impressions:89000, conversions:24, ctr:3.48, cpc:0.48, status:'Active' },
  { id:'4', name:'Google Shopping — All Products', platform:'Google', spend:1200, revenue:5400, roas:4.5, clicks:2800, impressions:41000, conversions:108, ctr:6.83, cpc:0.43, status:'Active' },
  { id:'5', name:'TikTok — Product Demo Video', platform:'TikTok', spend:2100, revenue:2520, roas:1.2, clicks:6700, impressions:198000, conversions:63, ctr:3.38, cpc:0.31, status:'Active' },
  { id:'6', name:'Lookalike — Past Purchasers', platform:'Meta', spend:950, revenue:5700, roas:6.0, clicks:1800, impressions:28000, conversions:142, ctr:6.43, cpc:0.53, status:'Active' },
]

function PriorityBadge({ p }:{p:string}) {
  const s:any = { high:{bg:'rgba(255,92,92,0.1)',c:'var(--danger)',b:'rgba(255,92,92,0.25)'}, medium:{bg:'rgba(255,170,68,0.1)',c:'var(--warn)',b:'rgba(255,170,68,0.25)'}, low:{bg:'rgba(0,212,160,0.1)',c:'var(--teal)',b:'rgba(0,212,160,0.25)'} }
  const x = s[p] || s.low
  return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border" style={{background:x.bg,color:x.c,borderColor:x.b}}>{p}</span>
}

function ScoreBar({ score }:{score:number}) {
  const color = score>=70?'var(--teal)':score>=40?'var(--warn)':'var(--danger)'
  return <div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full" style={{background:'var(--bg4)'}}><div className="h-full rounded-full" style={{width:`${score}%`,background:color}}/></div><span className="text-[11px] font-mono font-bold w-7 text-right" style={{color}}>{score}</span></div>
}
export default function SpendPage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [usingMock, setUsingMock] = useState(false)
  const [budget, setBudget] = useState('')

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('campaigns').select('*').eq('user_id', user.id).eq('status', 'Active')
      if (data?.length) { setCampaigns(data); setUsingMock(false) }
      else { setCampaigns(MOCK); setUsingMock(true) }
      setLoading(false)
    }
    load()
  }, [user])

  const totalSpend = campaigns.reduce((s,c) => s+c.spend, 0)
  const totalRevenue = campaigns.reduce((s,c) => s+c.revenue, 0)
  const avgROAS = totalSpend > 0 ? totalRevenue/totalSpend : 0

  const platformBreakdown = campaigns.reduce((acc:Record<string,{spend:number;revenue:number}>, c) => {
    if (!acc[c.platform]) acc[c.platform] = {spend:0,revenue:0}
    acc[c.platform].spend += c.spend; acc[c.platform].revenue += c.revenue
    return acc
  }, {})

  const runAnalysis = async () => {
    setAnalysing(true); setAnalysis(null)
    try {
      const res = await fetch('/api/spend-intelligence', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ campaigns, totalBudget: parseFloat(budget)||totalSpend, currency:'GBP' })
      })
      setAnalysis(await res.json())
    } catch(e) { console.error(e) }
    finally { setAnalysing(false) }
  }

  const inputStyle = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading...</span></div>

  return (
    <>
      <PageHeader title="AI Spend Intelligence" subtitle="Claude analyses your campaigns and tells you exactly where to move budget for maximum ROAS.">
        <button onClick={runAnalysis} disabled={analysing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing ? <><Spinner size={13}/> Analysing...</> : <><Zap size={14}/> Run Analysis</>}
        </button>
      </PageHeader>

      {usingMock && <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]" style={{background:'rgba(255,170,68,0.08)',borderColor:'rgba(255,170,68,0.25)',color:'var(--warn)'}}><AlertTriangle size={13}/>Demo data shown — connect ad platforms on the Import page to analyse your real campaigns.</div>}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {label:'Total Monthly Spend',value:`£${totalSpend.toLocaleString()}`,icon:<DollarSign size={14}/>,hi:false},
          {label:'Total Revenue',value:`£${totalRevenue.toLocaleString()}`,icon:<TrendingUp size={14}/>,hi:true},
          {label:'Blended ROAS',value:`${avgROAS.toFixed(2)}x`,icon:<BarChart2 size={14}/>,hi:avgROAS>=3},
          {label:'Active Campaigns',value:campaigns.length,icon:<Target size={14}/>,hi:false},
        ].map((c,i) => (
          <div key={i} className="rounded-xl border p-4" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px]" style={{color:'var(--text2)'}}>{c.label}</span>
              <span style={{color:c.hi?'var(--teal)':'var(--text3)'}}>{c.icon}</span>
            </div>
            <div className="text-[24px] font-bold font-mono" style={{color:c.hi?'var(--teal)':'var(--text)'}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5 mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="text-[13px] font-semibold mb-4">Spend by platform</div>
        {Object.entries(platformBreakdown).map(([platform, data]) => {
          const pct = totalSpend>0?(data.spend/totalSpend)*100:0
          const roas = data.spend>0?data.revenue/data.spend:0
          const roasColor = roas>=3?'var(--teal)':roas>=1.5?'var(--warn)':'var(--danger)'
          const col:any = {Meta:'#1877f2',Google:'#ea4335',TikTok:'#00d4a0'}
          return (
            <div key={platform} className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{background:col[platform]||'#888'}}/><span className="text-[13px] font-medium">{platform}</span></div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span style={{color:'var(--text2)'}}>£{data.spend.toLocaleString()}</span>
                  <span style={{color:'var(--text2)'}}>£{data.revenue.toLocaleString()} rev</span>
                  <span className="font-mono font-bold" style={{color:roasColor}}>{roas.toFixed(1)}x</span>
                  <span style={{color:'var(--text3)'}}>{pct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{background:'var(--bg4)'}}><div className="h-full rounded-full" style={{width:`${pct}%`,background:col[platform]||'#888'}}/></div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <table className="w-full text-[12px]">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Campaign','Platform','Spend','Revenue','ROAS','CPC','Signal'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]" style={{color:'var(--text2)'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[...campaigns].sort((a,b)=>b.roas-a.roas).map(c => {
              const roasColor = c.roas>=4?'var(--teal)':c.roas>=2?'var(--warn)':'var(--danger)'
              const sig = c.roas>=4?{l:'Scale ↑',c:'var(--teal)',bg:'rgba(0,212,160,0.1)'}:c.roas>=2?{l:'Maintain',c:'var(--warn)',bg:'rgba(255,170,68,0.1)'}:{l:'Review ↓',c:'var(--danger)',bg:'rgba(255,92,92,0.1)'}
              return <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}} className="transition-colors hover:bg-[var(--bg3)]">
                <td className="px-4 py-3 font-medium max-w-[200px]"><div className="truncate">{c.name}</div></td>
                <td className="px-4 py-3" style={{color:'var(--text2)'}}>{c.platform}</td>
                <td className="px-4 py-3 font-mono">£{c.spend.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--teal)'}}>£{c.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{color:roasColor}}>{c.roas.toFixed(1)}x</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--text2)'}}>£{c.cpc.toFixed(2)}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{background:sig.bg,color:sig.c}}>{sig.l}</span></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border p-5 mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="text-[13px] font-semibold mb-1">Total monthly budget (optional)</div>
        <p className="text-[12px] mb-3" style={{color:'var(--text2)'}}>Enter your budget and Claude will tell you exactly how to allocate it.</p>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'var(--text2)'}}>£</span>
            <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} placeholder={totalSpend.toLocaleString()}
              className="w-full rounded-lg border pl-7 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
          <button onClick={runAnalysis} disabled={analysing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
            style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
            {analysing?<><Spinner size={13}/> Analysing...</>:<><Zap size={14}/> Run AI Analysis</>}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border p-6" style={{background:'rgba(0,212,160,0.04)',borderColor:'rgba(0,212,160,0.2)'}}>
            <div className="flex items-center gap-2 mb-3"><Zap size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">AI Summary</span></div>
            <p className="text-[13px] leading-relaxed" style={{color:'var(--text2)'}}>{analysis.summary}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="rounded-lg p-3" style={{background:'rgba(255,92,92,0.08)',border:'1px solid rgba(255,92,92,0.2)'}}>
                <div className="text-[10px] uppercase font-bold mb-1" style={{color:'var(--danger)'}}>Estimated wasted spend</div>
                <div className="text-[22px] font-bold font-mono" style={{color:'var(--danger)'}}>£{analysis.totalWastedSpend?.toLocaleString()}/mo</div>
              </div>
              <div className="rounded-lg p-3" style={{background:'rgba(0,212,160,0.08)',border:'1px solid rgba(0,212,160,0.2)'}}>
                <div className="text-[10px] uppercase font-bold mb-1" style={{color:'var(--teal)'}}>Revenue opportunity</div>
                <div className="text-[22px] font-bold font-mono" style={{color:'var(--teal)'}}>+£{analysis.totalOpportunityGain?.toLocaleString()}/mo</div>
              </div>
            </div>
          </div>

          {analysis.budgetPlan?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="text-[14px] font-bold mb-4">💰 Budget reallocation plan</div>
              {analysis.budgetPlan.map((m,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg mb-2" style={{background:'var(--bg3)'}}>
                  <span className="text-[12px] font-medium flex-1 truncate" style={{color:'var(--danger)'}}>↓ {m.from}</span>
                  <div className="flex items-center gap-1.5 shrink-0"><ArrowRight size={13} style={{color:'var(--text3)'}}/><span className="font-mono font-bold text-[13px]" style={{color:'var(--teal)'}}>£{m.amount?.toLocaleString()}</span><ArrowRight size={13} style={{color:'var(--text3)'}}/></div>
                  <span className="text-[12px] font-medium flex-1 truncate text-right" style={{color:'var(--teal)'}}>↑ {m.to}</span>
                </div>
              ))}
            </div>
          )}

          {analysis.platformInsights?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="text-[14px] font-bold mb-4">📊 Platform efficiency scores</div>
              {analysis.platformInsights.map((p,i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold">{p.platform}</span>
                    <span className="text-[12px]" style={{color:'var(--text2)'}}>{p.verdict}</span>
                  </div>
                  <ScoreBar score={p.score}/>
                </div>
              ))}
            </div>
          )}

          {analysis.recommendations?.length>0 && (
            <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="px-5 py-4 border-b" style={{borderColor:'var(--border)'}}><div className="text-[14px] font-bold">🎯 Campaign recommendations</div></div>
              {analysis.recommendations.map((r,i) => {
                const typeColor = r.type==='scale'||r.type==='reallocate'?'var(--teal)':r.type==='cut'||r.type==='pause'?'var(--danger)':'var(--text2)'
                return (
                  <div key={i} className="flex items-start gap-4 p-4 border-b hover:bg-[var(--bg3)] transition-colors" style={{borderColor:'var(--border)'}}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[13px] font-semibold">{r.campaign}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:'var(--bg4)',color:'var(--text3)'}}>{r.platform}</span>
                        <PriorityBadge p={r.priority}/>
                      </div>
                      <div className="text-[13px] font-semibold mb-0.5" style={{color:typeColor}}>{r.action}</div>
                      <div className="text-[12px]" style={{color:'var(--text2)'}}>{r.reason}</div>
                    </div>
                    <div className="text-[12px] font-semibold shrink-0 text-right max-w-[140px]" style={{color:typeColor}}>{r.impact}</div>
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