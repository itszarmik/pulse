'use client'
import { useState, useEffect, useRef } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { TrendingUp, TrendingDown, Share2, Copy, Check, Zap } from 'lucide-react'

type ScoreData = {
  total: number
  grade: string
  breakdown: { label: string; score: number; max: number; desc: string }[]
  factors: { type: 'up' | 'down'; text: string }[]
  blendedROAS: number
  efficiencyRatio: number
  platforms: number
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

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['N/A']
  const [displayed, setDisplayed] = useState(0)
  const [animDone, setAnimDone] = useState(false)

  useEffect(() => {
    let start = 0
    const end = score
    const dur = 1500
    const step = 16
    const inc = (end / dur) * step
    const timer = setInterval(() => {
      start = Math.min(start + inc, end)
      setDisplayed(Math.round(start))
      if (start >= end) { clearInterval(timer); setAnimDone(true) }
    }, step)
    return () => clearInterval(timer)
  }, [score])

  const radius = 80
  const stroke = 10
  const normalised = radius - stroke / 2
  const circumference = normalised * 2 * Math.PI
  const progress = (displayed / 100) * circumference
  const gap = circumference - progress

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle cx="100" cy="100" r={normalised} fill="none" stroke="var(--bg4)" strokeWidth={stroke} />
          {/* Score arc */}
          <circle cx="100" cy="100" r={normalised} fill="none"
            stroke={cfg.color} strokeWidth={stroke}
            strokeDasharray={`${progress} ${gap}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${cfg.glow})`, transition: 'stroke-dasharray 0.05s linear' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[52px] font-black font-mono leading-none" style={{ color: cfg.color }}>
            {displayed}
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

function ScoreBar({ label, score, max, desc }: { label: string; score: number; max: number; desc: string }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? 'var(--teal)' : pct >= 40 ? 'var(--warn)' : 'var(--danger)'
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium">{label}</span>
        <span className="text-[12px] font-mono font-bold" style={{ color }}>{score}/{max}</span>
      </div>
      <div className="h-2 rounded-full mb-1" style={{ background: 'var(--bg4)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{desc}</div>
    </div>
  )
}
export default function ScorePage() {
  const { user } = useUser()
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/score').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const generateShareCard = async () => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = 800; canvas.height = 420

    // Background
    ctx.fillStyle = '#0d0f14'
    ctx.fillRect(0, 0, 800, 420)

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    for (let i = 0; i < 800; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 420); ctx.stroke() }
    for (let i = 0; i < 420; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke() }

    // Glow
    const cfg = GRADE_CONFIG[data.grade] || GRADE_CONFIG['N/A']
    const grd = ctx.createRadialGradient(200, 210, 0, 200, 210, 200)
    grd.addColorStop(0, cfg.glow)
    grd.addColorStop(1, 'transparent')
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 800, 420)

    // Score number
    ctx.fillStyle = cfg.color
    ctx.font = 'bold 120px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(data.total), 200, 240)

    // Score label
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '18px system-ui'
    ctx.fillText('PULSE SCORE', 200, 290)

    // Grade
    ctx.fillStyle = cfg.color
    ctx.font = 'bold 56px monospace'
    ctx.fillText(data.grade, 200, 360)

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(380, 60); ctx.lineTo(380, 360); ctx.stroke()

    // Right side - breakdown
    ctx.textAlign = 'left'
    ctx.fillStyle = '#e8eaf0'
    ctx.font = 'bold 22px system-ui'
    ctx.fillText('Score breakdown', 410, 100)

    data.breakdown.forEach((b, i) => {
      const y = 140 + i * 42
      const pct = b.score / b.max
      const barColor = pct >= 0.7 ? '#00d4a0' : pct >= 0.4 ? '#ffaa44' : '#ff5c5c'

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '13px system-ui'
      ctx.fillText(b.label, 410, y)

      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.beginPath(); ctx.roundRect(410, y + 6, 300, 8, 4); ctx.fill()

      ctx.fillStyle = barColor
      ctx.beginPath(); ctx.roundRect(410, y + 6, pct * 300, 8, 4); ctx.fill()

      ctx.fillStyle = barColor
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`${b.score}/${b.max}`, 770, y)
      ctx.textAlign = 'left'
    })

    // Pulse branding
    ctx.fillStyle = '#00d4a0'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('⬧ Pulse', 770, 400)

    // Copy to clipboard
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        // Fallback — download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'pulse-score.png'; a.click()
      }
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32 gap-3" style={{ color: 'var(--text2)' }}>
      <Spinner/><span>Calculating your Pulse Score...</span>
    </div>
  )

  if (!data) return null

  const cfg = GRADE_CONFIG[data.grade] || GRADE_CONFIG['N/A']
  const prevScore = data.history?.[1]?.score
  const diff = prevScore ? data.total - prevScore : null
  const hasData = data.total > 0

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <PageHeader title="Pulse Score"
        subtitle="Your agency's ad efficiency rating — updated weekly. Share it, track it, improve it.">
        <button onClick={generateShareCard}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all"
          style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
          {copied ? <><Check size={13}/> Copied!</> : <><Share2 size={13}/> Share Score</>}
        </button>
      </PageHeader>

      {!hasData && (
        <div className="mb-6 px-4 py-3 rounded-lg border flex items-center gap-2 text-[12px]"
          style={{ background: 'rgba(255,170,68,0.08)', borderColor: 'rgba(255,170,68,0.25)', color: 'var(--warn)' }}>
          <Zap size={13}/>
          Connect your ad platforms on the Import page to get your real Pulse Score.
          Currently showing a starter score.
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr] gap-6">

        {/* Left: Score gauge + summary */}
        <div className="flex flex-col gap-4 w-[280px]">

          {/* Main gauge card */}
          <div className="rounded-2xl border p-6 text-center"
            style={{ background: 'var(--bg2)', borderColor: `${cfg.color}30`, boxShadow: `0 0 40px ${cfg.glow}` }}>
            <ScoreGauge score={data.total} grade={data.grade} />
            {diff !== null && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px]"
                style={{ color: diff >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                {diff >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                {diff >= 0 ? '+' : ''}{diff} from last week
              </div>
            )}
          </div>

          {/* Factors */}
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

          {/* Industry comparison */}
          <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[12px] font-semibold mb-3">Industry comparison</div>
            {[
              { label: 'Top agencies', score: 85, color: 'var(--teal)' },
              { label: 'Average agency', score: 58, color: 'var(--warn)' },
              { label: 'Your score', score: data.total, color: cfg.color },
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

        {/* Right: Breakdown + history */}
        <div className="flex flex-col gap-4">

          {/* Score breakdown */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-bold mb-5">Score breakdown</div>
            <div className="flex flex-col gap-5">
              {data.breakdown.map((b, i) => <ScoreBar key={i} {...b} />)}
            </div>
          </div>

          {/* How to improve */}
          <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-bold mb-4">How to improve your score</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { action: 'Move budget to 3x+ ROAS campaigns', impact: '+8 pts', icon: '💰' },
                { action: 'Set up ROAS and spend alerts', impact: '+10 pts', icon: '🔔' },
                { action: 'Connect a second ad platform', impact: '+6 pts', icon: '🔗' },
                { action: 'Pause campaigns below 1.5x ROAS', impact: '+12 pts', icon: '⏸️' },
                { action: 'Run AI Spend Analysis weekly', impact: '+5 pts', icon: '🤖' },
                { action: 'Keep 80%+ of campaigns active', impact: '+8 pts', icon: '📈' },
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

          {/* History chart */}
          {data.history.length > 1 && (
            <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="text-[14px] font-bold mb-4">Score history (last 12 weeks)</div>
              <div className="flex items-end gap-2 h-24">
                {[...data.history].reverse().map((h, i) => {
                  const hcfg = GRADE_CONFIG[h.grade] || GRADE_CONFIG['N/A']
                  const height = `${(h.score / 100) * 100}%`
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: hcfg.color }}>{h.score}</div>
                      <div className="w-full rounded-t-md transition-all" style={{ height, background: hcfg.color, minHeight: 4, opacity: i === data.history.length - 1 ? 1 : 0.5 }} />
                      <div className="text-[9px]" style={{ color: 'var(--text3)' }}>
                        {new Date(h.week).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Share CTA */}
          <div className="rounded-xl border p-5 flex items-center justify-between"
            style={{ background: 'rgba(0,212,160,0.04)', borderColor: 'rgba(0,212,160,0.2)' }}>
            <div>
              <div className="text-[13px] font-bold mb-0.5">Share your Pulse Score</div>
              <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                Generate a shareable image card — perfect for LinkedIn or team updates.
              </div>
            </div>
            <button onClick={generateShareCard}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold shrink-0 ml-4"
              style={{ background: 'var(--teal)', color: '#001a12' }}>
              {copied ? <><Check size={13}/> Copied to clipboard!</> : <><Share2 size={13}/> Generate card</>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}