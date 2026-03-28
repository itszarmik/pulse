'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Sparkles, TrendingUp, AlertTriangle, Zap, Target, Eye, MessageSquare, Users } from 'lucide-react'

type Campaign = { id:string; name:string; platform:string; spend:number; revenue:number; roas:number; clicks:number; impressions:number; conversions:number; ctr:number; cpc:number; status:string }
type CI = {
  summary: string
  topFormats: { format:string; platform:string; avgROAS:number; score:number; insight:string }[]
  winningHooks: { hookType:string; example:string; ctr:number; platforms:string[]; why:string }[]
  audienceInsights: { segment:string; performance:string; cpa:number; cvr:number; insight:string }[]
  creativeRecommendations: { type:string; recommendation:string; reason:string; expectedImpact:string; priority:string }[]
  trendingNow: { trend:string; platform:string; relevance:string; action:string }[]
}

const MOCK:Campaign[] = [
  { id:'1', name:'Summer Sale — Broad Audience', platform:'Meta', spend:3200, revenue:4480, roas:1.4, clicks:8200, impressions:142000, conversions:89, ctr:5.77, cpc:0.39, status:'Active' },
  { id:'2', name:'Retargeting — Cart Abandoners', platform:'Meta', spend:800, revenue:6240, roas:7.8, clicks:1240, impressions:18600, conversions:156, ctr:6.67, cpc:0.65, status:'Active' },
  { id:'3', name:'Brand Awareness Q3', platform:'Google', spend:1500, revenue:1200, roas:0.8, clicks:3100, impressions:89000, conversions:24, ctr:3.48, cpc:0.48, status:'Active' },
  { id:'4', name:'Google Shopping — All Products', platform:'Google', spend:1200, revenue:5400, roas:4.5, clicks:2800, impressions:41000, conversions:108, ctr:6.83, cpc:0.43, status:'Active' },
  { id:'5', name:'TikTok — Product Demo Video', platform:'TikTok', spend:2100, revenue:2520, roas:1.2, clicks:6700, impressions:198000, conversions:63, ctr:3.38, cpc:0.31, status:'Active' },
  { id:'6', name:'Lookalike — Past Purchasers', platform:'Meta', spend:950, revenue:5700, roas:6.0, clicks:1800, impressions:28000, conversions:142, ctr:6.43, cpc:0.53, status:'Active' },
]

function ScoreRing({ score }: { score:number }) {
  const color = score>=70?'#00d4a0':score>=40?'#ffaa44':'#ff5c5c'
  const r = 20, circ = 2*Math.PI*r
  const dash = (score/100)*circ
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--bg4)" strokeWidth="4"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 28 28)"/>
      </svg>
      <span className="text-[13px] font-bold" style={{color}}>{score}</span>
    </div>
  )
}

function PriorityDot({ p }:{p:string}) {
  const c = p==='high'?'var(--danger)':p==='medium'?'var(--warn)':'var(--teal)'
  return <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{background:c}}/>
}
export default function CreativePage() {
  const { user } = useUser()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [ci, setCi] = useState<CI | null>(null)
  const [usingMock, setUsingMock] = useState(false)
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [industry, setIndustry] = useState('')

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

  const run = async () => {
    setAnalysing(true); setCi(null)
    try {
      const res = await fetch('/api/creative-intelligence', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ campaigns, product, audience, industry })
      })
      setCi(await res.json())
    } catch(e) { console.error(e) }
    finally { setAnalysing(false) }
  }

  const inputStyle = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }
  const platColors:any = { Meta:'#1877f2', Google:'#ea4335', TikTok:'#00d4a0' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading...</span></div>

  return (
    <>
      <PageHeader title="Creative Intelligence"
        subtitle="Discover which ad formats, hooks and styles are converting best for your product and audience.">
        <button onClick={run} disabled={analysing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing?<><Spinner size={13}/> Analysing...</>:<><Sparkles size={14}/> Analyse Creative</>}
        </button>
      </PageHeader>

      {usingMock && <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]" style={{background:'rgba(255,170,68,0.08)',borderColor:'rgba(255,170,68,0.25)',color:'var(--warn)'}}><AlertTriangle size={13}/>Demo data — connect ad platforms on the Import page for real creative insights.</div>}

      {/* Context inputs */}
      <div className="rounded-xl border p-5 mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="text-[13px] font-semibold mb-1">Tell Claude about your business</div>
        <p className="text-[12px] mb-4" style={{color:'var(--text2)'}}>The more context you give, the more specific and accurate the creative insights.</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Product / Service</label>
            <input type="text" value={product} onChange={e=>setProduct(e.target.value)}
              placeholder="e.g. Running shoes, SaaS tool, Skincare"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Target Audience</label>
            <input type="text" value={audience} onChange={e=>setAudience(e.target.value)}
              placeholder="e.g. Women 25-40 interested in fitness"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Industry</label>
            <input type="text" value={industry} onChange={e=>setIndustry(e.target.value)}
              placeholder="e.g. E-commerce, Fashion, B2B SaaS"
              className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle}/>
          </div>
        </div>
        <button onClick={run} disabled={analysing}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
          style={{background:analysing?'var(--bg4)':'var(--teal)',color:analysing?'var(--text3)':'#001a12'}}>
          {analysing?<><Spinner size={13}/> Analysing creative...</>:<><Sparkles size={14}/> Analyse Creative</>}
        </button>
      </div>

      {/* Campaign signals */}
      <div className="rounded-xl border overflow-hidden mb-6" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'var(--border)'}}>
          <span className="text-[13px] font-semibold">Campaign creative signals</span>
          <span className="text-[11px]" style={{color:'var(--text3)'}}>Sorted by CTR</span>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Campaign','Platform','CTR','CPC','ROAS','Impressions','Signal'].map(h=><th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.5px]" style={{color:'var(--text2)'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[...campaigns].sort((a,b)=>b.ctr-a.ctr).map(c=>{
              const sig = c.ctr>=6?{l:'High CTR ✦',c:'var(--teal)',bg:'rgba(0,212,160,0.1)'}:c.ctr>=4?{l:'Average',c:'var(--warn)',bg:'rgba(255,170,68,0.1)'}:{l:'Low CTR',c:'var(--danger)',bg:'rgba(255,92,92,0.1)'}
              return <tr key={c.id} style={{borderBottom:'1px solid var(--border)'}} className="hover:bg-[var(--bg3)] transition-colors">
                <td className="px-4 py-3 font-medium"><div className="max-w-[200px] truncate">{c.name}</div></td>
                <td className="px-4 py-3"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{background:platColors[c.platform]||'#888'}}/><span style={{color:'var(--text2)'}}>{c.platform}</span></span></td>
                <td className="px-4 py-3 font-mono font-bold" style={{color:c.ctr>=6?'var(--teal)':c.ctr>=4?'var(--warn)':'var(--danger)'}}>{c.ctr.toFixed(2)}%</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--text2)'}}>£{c.cpc.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono font-bold" style={{color:c.roas>=4?'var(--teal)':c.roas>=2?'var(--warn)':'var(--danger)'}}>{c.roas.toFixed(1)}x</td>
                <td className="px-4 py-3 font-mono" style={{color:'var(--text3)'}}>{c.impressions.toLocaleString()}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{background:sig.bg,color:sig.c}}>{sig.l}</span></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      {/* AI Results */}
      {ci && (
        <div className="flex flex-col gap-5">

          {/* Summary */}
          <div className="rounded-xl border p-6" style={{background:'rgba(0,212,160,0.04)',borderColor:'rgba(0,212,160,0.2)'}}>
            <div className="flex items-center gap-2 mb-3"><Sparkles size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Creative Summary</span></div>
            <p className="text-[13px] leading-relaxed" style={{color:'var(--text2)'}}>{ci.summary}</p>
          </div>

          {/* Top formats */}
          {ci.topFormats?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Eye size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Top performing formats</span></div>
              <div className="grid grid-cols-2 gap-3">
                {ci.topFormats.map((f,i)=>(
                  <div key={i} className="rounded-lg p-4 flex gap-4 items-start" style={{background:'var(--bg3)'}}>
                    <ScoreRing score={f.score}/>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] mb-0.5">{f.format}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded mr-2" style={{background:platColors[f.platform]||'#888',color:'white'}}>{f.platform}</span>
                      <span className="text-[11px] font-mono" style={{color:'var(--teal)'}}>~{f.avgROAS?.toFixed(1)}x ROAS</span>
                      <p className="text-[11px] mt-1.5 leading-relaxed" style={{color:'var(--text2)'}}>{f.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winning hooks */}
          {ci.winningHooks?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><MessageSquare size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Winning hooks & openers</span></div>
              <div className="flex flex-col gap-3">
                {ci.winningHooks.map((h,i)=>(
                  <div key={i} className="rounded-lg p-4" style={{background:'var(--bg3)'}}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold" style={{color:'var(--teal)'}}>{h.hookType}</span>
                      <div className="flex items-center gap-2">
                        {h.platforms?.map((p:string)=><span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{background:platColors[p]||'#555',color:'white'}}>{p}</span>)}
                        <span className="font-mono text-[11px] font-bold" style={{color:'var(--warn)'}}>~{h.ctr?.toFixed(1)}% CTR</span>
                      </div>
                    </div>
                    <div className="text-[13px] font-medium italic mb-1.5 px-3 py-2 rounded" style={{background:'var(--bg4)',color:'var(--text)'}}>
                      "{h.example}"
                    </div>
                    <p className="text-[11px]" style={{color:'var(--text2)'}}>{h.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audience insights */}
          {ci.audienceInsights?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><Users size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Audience insights</span></div>
              <div className="grid grid-cols-2 gap-3">
                {ci.audienceInsights.map((a,i)=>{
                  const perfColor = a.performance==='high'?'var(--teal)':a.performance==='medium'?'var(--warn)':'var(--danger)'
                  return (
                    <div key={i} className="rounded-lg p-4" style={{background:'var(--bg3)'}}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-semibold">{a.segment}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:`${perfColor}22`,color:perfColor}}>{a.performance}</span>
                      </div>
                      <div className="flex gap-4 mb-2 text-[11px] font-mono">
                        <span style={{color:'var(--text3)'}}>CPA: <span style={{color:'var(--text)'}}>£{a.cpa?.toFixed(2)}</span></span>
                        <span style={{color:'var(--text3)'}}>CVR: <span style={{color:'var(--text)'}}>{a.cvr?.toFixed(1)}%</span></span>
                      </div>
                      <p className="text-[11px]" style={{color:'var(--text2)'}}>{a.insight}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trending now */}
          {ci.trendingNow?.length>0 && (
            <div className="rounded-xl border p-5" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Trending now in performance ads</span></div>
              <div className="grid grid-cols-2 gap-3">
                {ci.trendingNow.map((t,i)=>(
                  <div key={i} className="rounded-lg p-4" style={{background:'var(--bg3)'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[13px] font-bold">🔥 {t.trend}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{background:platColors[t.platform]||'#555',color:'white'}}>{t.platform}</span>
                    </div>
                    <p className="text-[11px] mb-1.5" style={{color:'var(--text2)'}}>{t.relevance}</p>
                    <p className="text-[11px] font-medium" style={{color:'var(--teal)'}}>{t.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {ci.creativeRecommendations?.length>0 && (
            <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <div className="px-5 py-4 border-b" style={{borderColor:'var(--border)'}}><div className="flex items-center gap-2"><Target size={15} style={{color:'var(--teal)'}}/><span className="text-[14px] font-bold">Creative action plan</span></div></div>
              {ci.creativeRecommendations.map((r,i)=>(
                <div key={i} className="flex items-start gap-3 p-4 border-b hover:bg-[var(--bg3)] transition-colors" style={{borderColor:'var(--border)'}}>
                  <PriorityDot p={r.priority}/>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold" style={{background:'var(--bg4)',color:'var(--text3)'}}>{r.type}</span>
                    </div>
                    <div className="text-[13px] font-semibold mb-0.5">{r.recommendation}</div>
                    <div className="text-[12px]" style={{color:'var(--text2)'}}>{r.reason}</div>
                  </div>
                  <div className="text-[12px] font-bold shrink-0" style={{color:'var(--teal)'}}>{r.expectedImpact}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}