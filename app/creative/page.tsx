'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Sparkles, Zap, AlertTriangle, CheckCircle, TrendingUp, Eye, MessageSquare, Users } from 'lucide-react'

const MOCK = [
  { name:'Retargeting — Cart Abandoners', platform:'Meta', spend:800, revenue:6240, roas:7.8, clicks:1240, impressions:18600, conversions:156, ctr:6.67, cpc:0.65 },
  { name:'Lookalike — Past Purchasers', platform:'Meta', spend:950, revenue:5700, roas:6.0, clicks:1800, impressions:28000, conversions:142, ctr:6.43, cpc:0.53 },
  { name:'Google Shopping — All Products', platform:'Google', spend:1200, revenue:5400, roas:4.5, clicks:2800, impressions:41000, conversions:108, ctr:6.83, cpc:0.43 },
  { name:'Summer Sale — Broad Audience', platform:'Meta', spend:3200, revenue:4480, roas:1.4, clicks:8200, impressions:142000, conversions:89, ctr:5.77, cpc:0.39 },
  { name:'TikTok — Product Demo Video', platform:'TikTok', spend:2100, revenue:2520, roas:1.2, clicks:6700, impressions:198000, conversions:63, ctr:3.38, cpc:0.31 },
  { name:'Brand Awareness Q3', platform:'Google', spend:1500, revenue:1200, roas:0.8, clicks:3100, impressions:89000, conversions:24, ctr:3.48, cpc:0.48 },
]

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 7 ? 'var(--teal)' : score >= 4 ? 'var(--warn)' : 'var(--danger)'
  const r = 28; const circ = 2 * Math.PI * r
  const offset = circ - (score / 10) * circ
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--bg4)" strokeWidth="5"/>
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{transition:'stroke-dashoffset 0.8s ease'}}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[15px] font-bold font-mono" style={{color}}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-center" style={{color:'var(--text3)'}}>{label}</span>
    </div>
  )
}

function FatigueIndicator({ status, message }: { status: string; message: string }) {
  const cfg: any = {
    Fresh: { color: 'var(--teal)', bg: 'rgba(0,212,160,0.08)', border: 'rgba(0,212,160,0.2)', icon: <CheckCircle size={14}/> },
    Warning: { color: 'var(--warn)', bg: 'rgba(255,170,68,0.08)', border: 'rgba(255,170,68,0.2)', icon: <AlertTriangle size={14}/> },
    Fatigued: { color: 'var(--danger)', bg: 'rgba(255,92,92,0.08)', border: 'rgba(255,92,92,0.2)', icon: <AlertTriangle size={14}/> },
  }
  const s = cfg[status] || cfg.Fresh
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg border" style={{background:s.bg,borderColor:s.border}}>
      <span style={{color:s.color,marginTop:1}}>{s.icon}</span>
      <div>
        <div className="text-[12px] font-bold mb-0.5" style={{color:s.color}}>{status}</div>
        <div className="text-[11px]" style={{color:'var(--text2)'}}>{message}</div>
      </div>
    </div>
  )
}
export default function CreativePage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState(MOCK)
  const [usingMock, setUsingMock] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [industry, setIndustry] = useState('')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase.from('campaigns').select('*').eq('user_id', user.id)
      if (data?.length) { setCampaigns(data); setUsingMock(false) }
    }
    load()
  }, [user])

  const run = async () => {
    setAnalysing(true); setResult(null)
    try {
      const res = await fetch('/api/creative-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns, industry, product, audience }),
      })
      setResult(await res.json())
    } catch (e) { console.error(e) }
    finally { setAnalysing(false) }
  }

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Creative Intelligence"
        subtitle="Discover what ad formats, hooks and tones are converting best for your audience.">
        <button onClick={run} disabled={analysing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing ? <><Spinner size={13}/> Analysing creatives...</> : <><Sparkles size={14}/> Analyse Creatives</>}
        </button>
      </PageHeader>

      {usingMock && (
        <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]"
          style={{background:'rgba(255,170,68,0.08)',borderColor:'rgba(255,170,68,0.25)',color:'var(--warn)'}}>
          <AlertTriangle size={13}/> Demo data — connect ad platforms to analyse your real creative performance.
        </div>
      )}

      {/* Context inputs */}
      <div className="rounded-xl border p-5 mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="text-[13px] font-semibold mb-3">Help Claude understand your business (optional)</div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Industry</label>
            <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Fashion, SaaS, Fitness"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Product</label>
            <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="e.g. Running shoes, CRM software"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Target audience</label>
            <input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. Men 25-40, fitness enthusiasts"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
        </div>
      </div>

      {/* Pre-analysis — campaign CTR/engagement overview */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="px-5 py-3 border-b" style={{borderColor:'var(--border)'}}>
          <span className="text-[13px] font-semibold">Creative performance snapshot</span>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Campaign','Platform','CTR','CPC','Conv. Rate','ROAS','Creative Signal'].map(h=>(
              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]" style={{color:'var(--text2)'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[...campaigns].sort((a:any,b:any)=>b.ctr-a.ctr).map((c:any,i) => {
              const cvr = c.clicks>0?((c.conversions/c.clicks)*100).toFixed(1):'0'
              const ctrColor = c.ctr>=5?'var(--teal)':c.ctr>=3?'var(--warn)':'var(--danger)'
              const signal = c.ctr>=5&&c.roas>=3?{l:'🔥 High Performer',c:'var(--teal)'}:c.ctr>=3&&c.roas>=2?{l:'✓ Solid',c:'var(--text2)'}:c.ctr<3&&c.roas<2?{l:'⚠ Creative Fatigue',c:'var(--danger)'}:{l:'→ Monitor',c:'var(--warn)'}
              return <tr key={i} style={{borderBottom:'1px solid var(--border)'}} className="hover:bg-[var(--bg3)] transition-colors">
                <td className="px-4 py-3 font-medium"><div className="truncate max-w-[180px]">{c.name}</div></td>
                <td className="px-4 py-3" style={{color:'var(--text2)'}}>{c.platform}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{color:ctrColor}}>{c.ctr?.toFixed(2)}%</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--text2)'}}>£{c.cpc?.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--text2)'}}>{cvr}%</td>
                <td className="px-4 py-3 font-mono font-bold" style={{color:c.roas>=4?'var(--teal)':c.roas>=2?'var(--warn)':'var(--danger)'}}>{c.roas?.toFixed(1)}x</td>
                <td className="px-4 py-3 text-[11px] font-semibold" style={{color:signal.c}}>{signal.l}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      {/* AI Results */}
      {result && !result.error && (
        <div className="flex flex-col gap-5">

          {/* Top recommendation */}
          <div className="rounded-xl border p-5" style={{background:'rgba(0,212,160,0.04)',borderColor:'rgba(0,212,160,0.25)'}}>
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Top recommendation</span></div>
            <p className="text-[14px] leading-relaxed font-medium" style={{color:'var(--text)'}}>{result.topRecommendation}</p>
          </div>

          {/* Format performance */}
          <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="flex items-center gap-2 mb-5"><Eye size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Format performance</span></div>
            <div className="grid grid-cols-3 gap-4">
              {result.topFormats?.map((f:any,i:number) => (
                <div key={i} className="rounded-xl border p-4" style={{background:'var(--bg3)',borderColor:'var(--border)'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-[13px] font-semibold leading-tight">{f.format}</div>
                    <ScoreRing score={f.performanceScore} label="score"/>
                  </div>
                  <div className="text-[12px] font-mono font-bold mb-2" style={{color:'var(--teal)'}}>{f.avgROAS?.toFixed(1)}x avg ROAS</div>
                  <div className="text-[11px] mb-2 leading-relaxed" style={{color:'var(--text2)'}}>{f.whyItWorks}</div>
                  <div className="text-[11px] px-2 py-1.5 rounded" style={{background:'var(--bg4)',color:'var(--text2)'}}>{f.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Winning hooks */}
          <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="flex items-center gap-2 mb-4"><MessageSquare size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Winning hook styles</span></div>
            <div className="flex flex-col gap-3">
              {result.winningHooks?.map((h:any,i:number) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg" style={{background:'var(--bg3)'}}>
                  <div className="shrink-0 text-center">
                    <div className="text-[20px] font-bold font-mono" style={{color:h.effectiveness>=7?'var(--teal)':h.effectiveness>=5?'var(--warn)':'var(--text3)'}}>{h.effectiveness}</div>
                    <div className="text-[9px] uppercase" style={{color:'var(--text3)'}}>/ 10</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold mb-1">{h.hookType}</div>
                    <div className="text-[12px] italic mb-1.5 px-2 py-1 rounded" style={{background:'var(--bg4)',color:'var(--text2)'}}>&ldquo;{h.example}&rdquo;</div>
                    <div className="text-[11px]" style={{color:'var(--text3)'}}>{h.audienceMatch}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tones + Audience insights side by side */}
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Zap size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Best performing tones</span></div>
              {result.topTones?.map((t:any,i:number) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold">{t.tone}</span>
                    <span className="text-[11px] font-mono font-bold" style={{color:'var(--teal)'}}>{t.conversionRate?.toFixed(1)}% CVR</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-1.5" style={{background:'var(--bg4)'}}>
                    <div className="h-full rounded-full" style={{width:`${Math.min(t.conversionRate*10,100)}%`,background:'var(--teal)'}}/>
                  </div>
                  <div className="text-[11px] mb-1" style={{color:'var(--text2)'}}>{t.bestFor}</div>
                  <div className="text-[11px] italic px-2 py-1 rounded" style={{background:'var(--bg3)',color:'var(--text2)'}}>&ldquo;{t.sampleCopy}&rdquo;</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border p-5 flex-1" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                <div className="flex items-center gap-2 mb-4"><Users size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Audience insights</span></div>
                {result.audienceInsights && Object.entries(result.audienceInsights).map(([k,v]:any,i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div className="text-[10px] uppercase font-bold mb-0.5" style={{color:'var(--text3)'}}>
                      {k.replace(/([A-Z])/g,' $1').trim()}
                    </div>
                    <div className="text-[12px]" style={{color:'var(--text2)'}}>{v}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border p-4" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
                <div className="text-[12px] font-bold mb-2">Creative fatigue status</div>
                {result.creativeFatigue && <FatigueIndicator status={result.creativeFatigue.status} message={result.creativeFatigue.message}/>}
                {result.creativeFatigue?.recommendation && (
                  <div className="text-[11px] mt-2" style={{color:'var(--text2)'}}>{result.creativeFatigue.recommendation}</div>
                )}
              </div>
            </div>
          </div>

          {/* Next tests */}
          {result.nextCreativeTests?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Next A/B tests to run</span></div>
              <div className="flex flex-col gap-2.5">
                {result.nextCreativeTests.map((test:string,i:number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{background:'var(--bg3)'}}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{background:'var(--teal-dim)',color:'var(--teal)'}}>{i+1}</span>
                    <span className="text-[12px]" style={{color:'var(--text2)'}}>{test}</span>
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