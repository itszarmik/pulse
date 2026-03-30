'use client'
import { useState, useEffect, useRef } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { TrendingUp, TrendingDown, Share2, Check, Zap, Download } from 'lucide-react'

type ScoreData = {
  total: number
  grade: string
  breakdown: { label: string; score: number; max: number; desc: string }[]
  factors: { type: 'up' | 'down'; text: string }[]
  history: { score: number; grade: string; week: string }[]
}

const GRADE_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  'A+': { color: '#00d4a0', glow: 'rgba(0,212,160,0.4)', label: 'Elite' },
  'A':  { color: '#00d4a0', glow: 'rgba(0,212,160,0.3)', label: 'Excellent' },
  'B':  { color: '#4ade80', glow: 'rgba(74,222,128,0.3)', label: 'Good' },
  'C':  { color: '#ffaa44', glow: 'rgba(255,170,68,0.3)', label: 'Average' },
  'D':  { color: '#ff7844', glow: 'rgba(255,120,68,0.3)', label: 'Below average' },
  'F':  { color: '#ff5c5c', glow: 'rgba(255,92,92,0.3)', label: 'Needs work' },
  'N/A':{ color: '#8b90a0', glow: 'rgba(139,144,160,0.2)', label: 'No data yet' },
}

const PLACEHOLDER_BREAKDOWN = [
  { label: 'ROAS Performance',   score: 0, max: 30, desc: 'Connect campaigns to score ROAS efficiency' },
  { label: 'Budget Allocation',  score: 0, max: 25, desc: 'Shows how well spend is distributed' },
  { label: 'Platform Diversity', score: 0, max: 20, desc: 'Running on 2+ platforms scores higher' },
  { label: 'Campaign Health',    score: 0, max: 15, desc: 'Active vs paused campaign ratio' },
  { label: 'Alert Coverage',     score: 0, max: 10, desc: 'ROAS and spend alerts configured' },
]

// Stable random heights for placeholder history bars (seeded so they don't jump)
const PLACEHOLDER_HEIGHTS = [22, 35, 18, 42, 28, 15, 38, 25, 45, 32, 20, 40]

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['N/A']
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    if (score === 0) return
    let s = 0; const dur = 1200; const step = 16
    const inc = (score / dur) * step
    const t = setInterval(() => {
      s = Math.min(s + inc, score)
      setDisplayed(Math.round(s))
      if (s >= score) clearInterval(t)
    }, step)
    return () => clearInterval(t)
  }, [score])
  const r = 80, sw = 10, nr = r - sw / 2
  const circ = nr * 2 * Math.PI
  const prog = (displayed / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={nr} fill="none" stroke="var(--bg4)" strokeWidth={sw} />
          <circle cx="100" cy="100" r={nr} fill="none" stroke={cfg.color} strokeWidth={sw}
            strokeDasharray={`${prog} ${circ - prog}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${cfg.glow})`, transition: 'stroke-dasharray 0.05s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[52px] font-black font-mono leading-none" style={{ color: cfg.color }}>
            {score === 0 ? '0' : displayed}
          </div>
          <div className="text-[13px] font-semibold mt-1" style={{ color: 'var(--text2)' }}>out of 100</div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="text-[28px] font-black" style={{ color: cfg.color }}>{grade}</div>
        <div>
          <div className="text-[14px] font-bold">{cfg.label}</div>
          <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Pulse Score</div>
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, max, desc, empty }: { label: string; score: number; max: number; desc: string; empty?: boolean }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  const color = empty ? 'var(--bg4)' : pct >= 70 ? 'var(--teal)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium" style={{ color: empty ? 'var(--text2)' : 'var(--text)' }}>{label}</span>
        <span className="text-[12px] font-mono font-bold" style={{ color: empty ? 'var(--text3)' : color }}>
          {empty ? '—' : `${score}/${max}`}
        </span>
      </div>
      <div className="h-2 rounded-full mb-1 overflow-hidden" style={{ background: 'var(--bg4)' }}>
        {!empty && pct > 0 && (
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        )}
      </div>
      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{desc}</div>
    </div>
  )
}

export default function ScorePage() {
  const { user } = useUser()
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cardState, setCardState] = useState<'idle' | 'generating' | 'done'>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/score').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const generateShareCard = async () => {
    if (!data || !canvasRef.current) return
    setCardState('generating')

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = 800; canvas.height = 420
    const cfg = GRADE_CONFIG[data.grade] || GRADE_CONFIG['N/A']

    // Background
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, 800, 420)

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1
    for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,420); ctx.stroke() }
    for (let i = 0; i < 420; i += 40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(800,i); ctx.stroke() }

    // Glow behind score
    const grd = ctx.createRadialGradient(200, 210, 0, 200, 210, 200)
    grd.addColorStop(0, cfg.glow); grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 800, 420)

    // Score number
    ctx.fillStyle = cfg.color; ctx.font = 'bold 120px monospace'; ctx.textAlign = 'center'
    ctx.fillText(String(data.total), 200, 240)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '16px system-ui'
    ctx.fillText('PULSE SCORE', 200, 285)
    ctx.fillStyle = cfg.color; ctx.font = 'bold 52px monospace'
    ctx.fillText(data.grade, 200, 355)

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(380, 40); ctx.lineTo(380, 380); ctx.stroke()

    // Breakdown
    const breakdown = data.breakdown.length > 0 ? data.breakdown : PLACEHOLDER_BREAKDOWN
    ctx.textAlign = 'left'; ctx.fillStyle = '#e8eaf0'; ctx.font = 'bold 20px system-ui'
    ctx.fillText('Score breakdown', 410, 90)

    breakdown.slice(0, 5).forEach((b, i) => {
      const y = 128 + i * 46
      const pct = b.max > 0 ? b.score / b.max : 0
      const barColor = pct >= 0.7 ? '#00d4a0' : pct >= 0.4 ? '#ffaa44' : pct === 0 ? '#2a2d3a' : '#ff5c5c'
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '13px system-ui'; ctx.textAlign = 'left'
      ctx.fillText(b.label, 410, y)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath(); ctx.roundRect(410, y+6, 300, 8, 4); ctx.fill()
      if (pct > 0) { ctx.fillStyle = barColor; ctx.beginPath(); ctx.roundRect(410, y+6, pct*300, 8, 4); ctx.fill() }
      ctx.fillStyle = pct === 0 ? 'rgba(255,255,255,0.25)' : barColor
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'right'
      ctx.fillText(pct === 0 ? '—' : `${b.score}/${b.max}`, 760, y)
    })

    // Pulse branding
    ctx.fillStyle = '#00d4a0'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'right'
    ctx.fillText('⬧ Pulse', 760, 405)

    // Wait a frame for canvas to finish painting, then download
    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) { setCardState('idle'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `pulse-score-${data.grade}-${data.total}.png`
        document.body.appendChild(a); a.click()
        setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a) }, 1000)
        setCardState('done')
        setTimeout(() => setCardState('idle'), 3000)
      }, 'image/png')
    }, 100)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3" style={{ color: 'var(--text2)' }}>
      <Spinner/><span>Calculating your Pulse Score...</span>
    </div>
  )
  if (!data) return null

  const cfg = GRADE_CONFIG[data.grade] || GRADE_CONFIG['N/A']
  const hasData = data.total > 0
  const breakdown = data.breakdown.length > 0 ? data.breakdown : PLACEHOLDER_BREAKDOWN
  const prevScore = data.history?.[1]?.score
  const diff = (prevScore !== undefined && hasData) ? data.total - prevScore : null

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <PageHeader title="Pulse Score" subtitle="Your agency's ad efficiency rating — updated weekly. Share it, track it, improve it.">
        <button onClick={generateShareCard} disabled={cardState === 'generating'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all"
          style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
          {cardState === 'generating' ? <><Spinner size={13}/> Generating...</>
           : cardState === 'done' ? <><Check size={13}/> Downloaded!</>
           : <><Download size={13}/> Download card</>}
        </button>
      </PageHeader>

      {!hasData && (
        <div className="mb-6 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]"
          style={{ background: 'rgba(255,170,68,0.08)', borderColor: 'rgba(255,170,68,0.25)', color: 'var(--warn)' }}>
          <Zap size={13}/> Connect your ad platforms on the <a href="/import" className="underline ml-1">Import page</a> to get your real Pulse Score. Currently showing a starter score.
        </div>
      )}

      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--bg2)', borderColor: `${cfg.color}30`, boxShadow: `0 0 40px ${cfg.glow}` }}>
            <ScoreGauge score={data.total} grade={data.grade} />
            {diff !== null && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px]"
                style={{ color: diff >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                {diff >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                {diff >= 0 ? '+' : ''}{diff} from last week
              </div>
            )}
          </div>

          {data.factors.length > 0 && (
            <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="text-[12px] font-semibold mb-3">What's affecting your score</div>
              <div className="flex flex-col gap-2">
                {data.factors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="shrink-0 mt-0.5" style={{ color: f.type === 'up' ? 'var(--teal)' : 'var(--danger)' }}>
                      {f.type === 'up' ? '↑' : '↓'}
                    </span>
                    <span style={{ color: 'var(--text2)' }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[12px] font-semibold mb-3">Industry comparison</div>
            {[
              { label: 'Top agencies',   score: 85, color: 'var(--teal)' },
              { label: 'Average agency', score: 58, color: 'var(--warn)' },
              { label: 'Your score',     score: data.total, color: cfg.color },
            ].map((row, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text2)' }}>
                  <span>{row.label}</span><span className="font-mono">{row.score}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
                  <div className="h-full rounded-full" style={{ width: `${row.score}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Score breakdown */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-[14px] font-bold">Score breakdown</div>
              {!hasData && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,170,68,0.1)', color: 'var(--warn)', border: '1px solid rgba(255,170,68,0.2)' }}>
                  No data yet — connect campaigns to score
                </span>
              )}
            </div>
            <div className="flex flex-col gap-5">
              {breakdown.map((b, i) => <ScoreBar key={i} {...b} empty={!hasData} />)}
            </div>
            {!hasData && (
              <div className="mt-4 pt-4 border-t text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
                Connect Meta, Google, or TikTok on the <a href="/import" style={{ color: 'var(--teal)' }}>Import page</a> to calculate your real score.
              </div>
            )}
          </div>

          {/* How to improve */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-bold mb-4">How to improve your score</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { action: 'Move budget to 3x+ ROAS campaigns', impact: '+8 pts',  icon: '💰' },
                { action: 'Set up ROAS and spend alerts',       impact: '+10 pts', icon: '🔔' },
                { action: 'Connect a second ad platform',       impact: '+6 pts',  icon: '🔗' },
                { action: 'Pause campaigns below 1.5x ROAS',   impact: '+12 pts', icon: '⏸️' },
                { action: 'Run AI Spend Analysis weekly',       impact: '+5 pts',  icon: '🤖' },
                { action: 'Keep 80%+ of campaigns active',     impact: '+8 pts',  icon: '📈' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg3)' }}>
                  <span className="text-[18px]">{tip.icon}</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium">{tip.action}</div>
                    <div className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--teal)' }}>{tip.impact} potential</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score history */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-bold mb-4">Score history (last 12 weeks)</div>
            <div className="flex items-end gap-1.5 h-28">
              {!hasData
                ? PLACEHOLDER_HEIGHTS.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: 'var(--bg4)', minHeight: 4 }} />
                      {i % 3 === 0 && <div className="text-[9px]" style={{ color: 'var(--text3)' }}>—</div>}
                    </div>
                  ))
                : [...data.history].reverse().map((h, i, arr) => {
                    const hcfg = GRADE_CONFIG[h.grade] || GRADE_CONFIG['N/A']
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-1.5 py-0.5 rounded z-10"
                          style={{ background: 'var(--bg3)', color: hcfg.color }}>
                          {h.score} · {h.grade}
                        </div>
                        <div className="w-full rounded-t-sm transition-all" style={{
                          height: `${Math.max((h.score / 100) * 100, 4)}%`,
                          background: hcfg.color,
                          opacity: i === arr.length - 1 ? 1 : 0.45,
                          minHeight: 4
                        }} />
                        {i % 3 === 0 && (
                          <div className="text-[9px]" style={{ color: 'var(--text3)' }}>
                            {new Date(h.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                    )
                  })
              }
            </div>
          </div>

          {/* Download card CTA */}
          <div className="rounded-xl border p-5 flex items-center justify-between"
            style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.2)' }}>
            <div>
              <div className="text-[13px] font-bold mb-0.5">Share your Pulse Score</div>
              <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                Download a shareable image card — perfect for LinkedIn or team updates.
              </div>
            </div>
            <button onClick={generateShareCard} disabled={cardState === 'generating'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold shrink-0 ml-4 transition-all"
              style={{ background: 'var(--teal)', color: '#001a12', opacity: cardState === 'generating' ? 0.7 : 1 }}>
              {cardState === 'generating' ? <><Spinner size={13}/> Generating...</>
               : cardState === 'done' ? <><Check size={13}/> Downloaded!</>
               : <><Download size={13}/> Download card</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
