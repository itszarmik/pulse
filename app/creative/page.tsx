'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Target, Eye, Zap, ThumbsDown } from 'lucide-react'

const MOCK_CAMPAIGNS = [
  { name:'Retargeting — Cart Abandoners', platform:'Meta', roas:7.8, ctr:6.67, cpc:0.65, spend:800, revenue:6240, conversions:156, clicks:1240 },
  { name:'Lookalike — Past Purchasers', platform:'Meta', roas:6.0, ctr:6.43, cpc:0.53, spend:950, revenue:5700, conversions:142, clicks:1800 },
  { name:'Google Shopping — All Products', platform:'Google', roas:4.5, ctr:6.83, cpc:0.43, spend:1200, revenue:5400, conversions:108, clicks:2800 },
  { name:'Summer Sale — Broad Audience', platform:'Meta', roas:1.4, ctr:5.77, cpc:0.39, spend:3200, revenue:4480, conversions:89, clicks:8200 },
  { name:'Brand Awareness Q3', platform:'Google', roas:0.8, ctr:3.48, cpc:0.48, spend:1500, revenue:1200, conversions:24, clicks:3100 },
  { name:'TikTok — Product Demo Video', platform:'TikTok', roas:1.2, ctr:3.38, cpc:0.31, spend:2100, revenue:2520, conversions:63, clicks:6700 },
]

const INDUSTRIES = ['Ecommerce / Fashion','Ecommerce / Beauty','Ecommerce / Health','Ecommerce / Electronics','SaaS / B2B','SaaS / B2C','Food & Beverage','Fitness & Wellness','Home & Living','Travel','Finance','Education','Other']

function ScorePill({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--teal)' : score >= 40 ? 'var(--warn)' : 'var(--danger)'
  const bg = score >= 70 ? 'rgba(0,212,160,0.1)' : score >= 40 ? 'rgba(255,170,68,0.1)' : 'rgba(255,92,92,0.1)'
  return <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded" style={{background:bg,color}}>{score}/100</span>
}

function EffBadge({ e }: { e: string }) {
  const c = e==='high'?'var(--teal)':e==='medium'?'var(--warn)':'var(--danger)'
  const b = e==='high'?'rgba(0,212,160,0.1)':e==='medium'?'rgba(255,170,68,0.1)':'rgba(255,92,92,0.1)'
  return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{background:b,color:c}}>{e}</span>
}
export default function CreativePage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [usingMock, setUsingMock] = useState(false)
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [industry, setIndustry] = useState('Ecommerce / Fashion')

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('campaigns').select('*').eq('user_id', user.id)
      if (data?.length) { setCampaigns(data); setUsingMock(false) }
      else { setCampaigns(MOCK_CAMPAIGNS); setUsingMock(true) }
      setLoading(false)
    }
    load()
  }, [user])

  const run = async () => {
    setAnalysing(true); setResult(null)
    try {
      const res = await fetch('/api/creative-intelligence', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ campaigns, product, audience, industry })
      })
      setResult(await res.json())
    } catch(e) { console.error(e) }
    finally { setAnalysing(false) }
  }

  const is = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading...</span></div>

  return (
    <>
      <PageHeader title="Creative Intelligence"
        subtitle="Claude analyses your campaign data to identify what ad styles, hooks and formats convert best for your product.">
        <button onClick={run} disabled={analysing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing?<><Spinner size={13}/> Analysing...</>:<><Sparkles size={14}/> Analyse Creative</>}
        </button>
      </PageHeader>

      {usingMock && <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]" style={{background:'rgba(255,170,68,0.08)',borderColor:'rgba(255,170,68,0.25)',color:'var(--warn)'}}><AlertTriangle size={13}/>Demo data — connect ad platforms on Import to analyse your real campaigns.</div>}

      {/* Context inputs */}
      <div className="rounded-xl border p-5 mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="text-[13px] font-semibold mb-3">Help Claude understand your context</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Product / Service</label>
            <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Premium running shoes"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={is}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Target Audience</label>
            <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. Women 25-40 interested in fitness"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={is}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Industry</label>
            <select value={industry} onChange={e=>setIndustry(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={is}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={run} disabled={analysing}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold"
            style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
            {analysing?<><Spinner size={13}/> Analysing your creative...</>:<><Sparkles size={14}/> Analyse Creative</>}
          </button>
        </div>
      </div>

      {/* Campaign data preview */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
          <span className="text-[13px] font-semibold">Campaign performance data</span>
          <span className="text-[11px]" style={{color:'var(--text3)'}}>{campaigns.length} campaigns</span>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Campaign','Platform','ROAS','CTR','CPC','Revenue','Signal'].map(h => <th key={h} className="text-left px-4 py-2 text-[10px] uppercase font-medium tracking-[0.5px]" style={{color:'var(--text2)'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[...campaigns].sort((a,b)=>b.roas-a.roas).map((c,i) => {
              const rc = c.roas>=4?'var(--teal)':c.roas>=2?'var(--warn)':'var(--danger)'
              const sig = c.roas>=4?{l:'High performer',c:'var(--teal)',bg:'rgba(0,212,160,0.1)'}:c.roas>=2?{l:'Mid performer',c:'var(--warn)',bg:'rgba(255,170,68,0.1)'}:{l:'Low performer',c:'var(--danger)',bg:'rgba(255,92,92,0.1)'}
              return <tr key={i} style={{borderBottom:'1px solid var(--border)'}} className="hover:bg-[var(--bg3)] transition-colors">
                <td className="px-4 py-2.5 font-medium max-w-[200px]"><div className="truncate">{c.name}</div></td>
                <td className="px-4 py-2.5" style={{color:'var(--text2)'}}>{c.platform}</td>
                <td className="px-4 py-2.5 font-mono font-bold" style={{color:rc}}>{Number(c.roas).toFixed(1)}x</td>
                <td className="px-4 py-2.5 font-mono" style={{color:'var(--text2)'}}>{Number(c.ctr).toFixed(2)}%</td>
                <td className="px-4 py-2.5 font-mono" style={{color:'var(--text2)'}}>£{Number(c.cpc).toFixed(2)}</td>
                <td className="px-4 py-2.5 font-mono" style={{color:'var(--teal)'}}>£{Number(c.revenue).toLocaleString()}</td>
                <td className="px-4 py-2.5"><span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{background:sig.bg,color:sig.c}}>{sig.l}</span></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      {/* Results */}
      {result && !result.error && (
        <div className="flex flex-col gap-5">

          {/* Summary */}
          <div className="rounded-xl border p-6" style={{background:'rgba(0,212,160,0.04)',borderColor:'rgba(0,212,160,0.2)'}}>
            <div className="flex items-center gap-2 mb-3"><Sparkles size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Creative Summary</span></div>
            <p className="text-[13px] leading-relaxed" style={{color:'var(--text2)'}}>{result.summary}</p>
          </div>

          {/* Top formats */}
          {result.topFormats?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Top performing formats</span></div>
              <div className="grid grid-cols-2 gap-3">
                {result.topFormats.map((f:any, i:number) => (
                  <div key={i} className="rounded-lg p-4" style={{background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold">{f.format}</span>
                      <ScorePill score={f.score}/>
                    </div>
                    <div className="flex gap-3 text-[11px] mb-2" style={{color:'var(--text2)'}}>
                      <span>ROAS: <span className="font-mono font-bold" style={{color:'var(--teal)'}}>{Number(f.avgROAS).toFixed(1)}x</span></span>
                      <span>CTR: <span className="font-mono">{Number(f.avgCTR).toFixed(2)}%</span></span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{color:'var(--text2)'}}>{f.verdict}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {f.platforms?.map((p:string) => <span key={p} className="text-[10px] px-2 py-0.5 rounded" style={{background:'var(--bg4)',color:'var(--text3)'}}>{p}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winning hooks */}
          {result.winningHooks?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Zap size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Winning hooks & angles</span></div>
              <div className="flex flex-col gap-3">
                {result.winningHooks.map((h:any, i:number) => (
                  <div key={i} className="p-4 rounded-lg" style={{background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold">{h.type}</span>
                      <div className="flex items-center gap-2"><EffBadge e={h.effectiveness}/><span className="text-[11px]" style={{color:'var(--text3)'}}>{h.bestFor}</span></div>
                    </div>
                    <p className="text-[12px] mb-2" style={{color:'var(--text2)'}}>{h.description}</p>
                    <div className="text-[11px] px-3 py-2 rounded" style={{background:'var(--bg4)',color:'var(--teal)',fontStyle:'italic'}}>
                      "{h.example}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to avoid */}
          {result.avoidList?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><ThumbsDown size={15} style={{color:'var(--danger)'}}/><span className="text-[14px] font-bold">What to stop doing</span></div>
              <div className="flex flex-col gap-2.5">
                {result.avoidList.map((a:any, i:number) => (
                  <div key={i} className="flex gap-3 p-3.5 rounded-lg" style={{background:'rgba(255,92,92,0.05)',border:'1px solid rgba(255,92,92,0.15)'}}>
                    <span style={{color:'var(--danger)',flexShrink:0}}>✗</span>
                    <div>
                      <div className="text-[13px] font-semibold mb-0.5" style={{color:'var(--danger)'}}>{a.pattern}</div>
                      <div className="text-[12px]" style={{color:'var(--text2)'}}>{a.reason}</div>
                      <div className="text-[11px] mt-1" style={{color:'var(--text3)'}}>{a.evidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next creative ideas */}
          {result.nextCreativeIdeas?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Lightbulb size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Next creative ideas to test</span></div>
              <div className="grid grid-cols-2 gap-3">
                {result.nextCreativeIdeas.map((idea:any, i:number) => (
                  <div key={i} className="p-4 rounded-lg" style={{background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold">{idea.concept}</span>
                      <span className="text-[11px] font-mono font-bold" style={{color:'var(--teal)'}}>~{Number(idea.expectedROAS).toFixed(1)}x ROAS</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded mb-2 inline-block" style={{background:'var(--bg4)',color:'var(--text3)'}}>{idea.platform}</span>
                    <p className="text-[12px] mb-1.5" style={{color:'var(--text2)'}}>{idea.description}</p>
                    <p className="text-[11px]" style={{color:'var(--text3)'}}>{idea.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience insights */}
          {result.audienceInsights?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Target size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Audience insights</span></div>
              <div className="grid grid-cols-2 gap-3">
                {result.audienceInsights.map((a:any, i:number) => (
                  <div key={i} className="p-4 rounded-lg" style={{background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div className="text-[13px] font-semibold mb-1">{a.segment}</div>
                    <p className="text-[12px] mb-2" style={{color:'var(--text2)'}}>{a.behaviour}</p>
                    <p className="text-[11px] font-medium" style={{color:'var(--teal)'}}>{a.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messaging insights */}
          {result.messagingInsights?.length > 0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Eye size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Messaging insights</span></div>
              <div className="flex flex-col gap-3">
                {result.messagingInsights.map((m:any, i:number) => (
                  <div key={i} className="p-4 rounded-lg" style={{background:'var(--bg3)',border:'1px solid var(--border)'}}>
                    <div className="text-[13px] font-semibold mb-1">{m.insight}</div>
                    <p className="text-[12px] mb-1" style={{color:'var(--text2)'}}>{m.evidence}</p>
                    <p className="text-[12px] font-medium" style={{color:'var(--teal)'}}>→ {m.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )
}