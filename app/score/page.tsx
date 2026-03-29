'use client'
import { useState, useEffect, useRef } from 'react'
import { PageHeader, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { Share2, RefreshCw, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle, Copy, Check } from 'lucide-react'

type Component = {
  name: string
  score: number
  max: number
  insight: string
  status: 'good' | 'warning' | 'poor'
}

type ScoreData = {
  total: number
  grade: string
  label: string
  change: number | null
  components: Component[]
  topIssue: string
  topWin: string
}

function getScoreColor(score: number) {
  if (score >= 80) return 'var(--teal)'
  if (score >= 60) return '#60a5fa'
  if (score >= 40) return 'var(--warn)'
  return 'var(--danger)'
}

function getGradeColor(grade: string) {
  if (grade.startsWith('A')) return 'var(--teal)'
  if (grade.startsWith('B')) return '#60a5fa'
  if (grade.startsWith('C')) return 'var(--warn)'
  return 'var(--danger)'
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'good') return <CheckCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
  if (status === 'warning') return <AlertTriangle size={14} style={{ color: 'var(--warn)', flexShrink: 0 }} />
  return <XCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--bg4)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={circumference - progress}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
    </svg>
  )
}

function ShareCard({ score, grade, label, userId }: { score: number; grade: string; label: string; userId: string }) {
  const [copied, setCopied] = useState(false)
  const color = getScoreColor(score)
  const shareText = `My agency just scored ${score}/100 on Pulse Score — the AI efficiency rating for ad agencies.\n\nGrade: ${grade} (${label})\n\nCheck your score at pulse-ruddy-psi.vercel.app\n\n#PulseScore #AdAgency #PaidMedia`

  const copy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border p-6 text-center" style={{
      background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)',
      borderColor: `${color}40`,
    }}>
      <div className="text-[11px] font-medium mb-3 uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
        Pulse Score
      </div>
      <div className="text-[72px] font-black font-mono leading-none mb-1" style={{ color }}>{score}</div>
      <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--text2)' }}>
        Grade <span style={{ color }}>{grade}</span> · {label}
      </div>
      <div className="text-[11px] mb-5" style={{ color: 'var(--text3)' }}>pulse-ruddy-psi.vercel.app</div>
      <button onClick={copy}
        className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all"
        style={{ borderColor: `${color}40`, color, background: `${color}10` }}>
        {copied ? <><Check size={12}/> Copied to clipboard!</> : <><Copy size={12}/> Copy to share</>}
      </button>
    </div>
  )
}
export default function PulseScorePage() {
  const { user } = useUser()
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [animScore, setAnimScore] = useState(0)

  const fetchScore = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/pulse-score')
      const d = await res.json()
      if (!d.error) {
        setData(d)
        // Animate score counting up
        setAnimScore(0)
        const duration = 1200
        const steps = 60
        const increment = d.total / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= d.total) { setAnimScore(d.total); clearInterval(timer) }
          else setAnimScore(Math.round(current))
        }, duration / steps)
      }
    } catch(e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { if (user) fetchScore() }, [user])

  const scoreColor = data ? getScoreColor(data.total) : 'var(--teal)'

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3" style={{ color: 'var(--text2)' }}>
      <Spinner/><span>Calculating your Pulse Score...</span>
    </div>
  )

  if (!data) return null

  return (
    <>
      <PageHeader title="Pulse Score"
        subtitle="Your agency's ad efficiency rating — calculated from ROAS, budget allocation, alert coverage and more.">
        <button onClick={() => fetchScore(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all"
          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''}/>
          {refreshing ? 'Recalculating...' : 'Recalculate'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-[1fr_300px] gap-6">

        {/* Left: Main score + breakdown */}
        <div className="flex flex-col gap-5">

          {/* Score hero card */}
          <div className="rounded-2xl border p-8" style={{
            background: `linear-gradient(135deg, var(--bg2) 0%, ${scoreColor}08 100%)`,
            borderColor: `${scoreColor}30`,
          }}>
            <div className="flex items-center gap-8">
              {/* Ring */}
              <div className="relative shrink-0">
                <ScoreRing score={data.total} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[42px] font-black font-mono leading-none" style={{ color: scoreColor }}>
                    {animScore}
                  </div>
                  <div className="text-[13px] font-medium mt-1" style={{ color: 'var(--text2)' }}>out of 100</div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[36px] font-black" style={{ color: getGradeColor(data.grade) }}>{data.grade}</span>
                  <div>
                    <div className="text-[18px] font-bold">{data.label}</div>
                    <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                      {data.total >= 80 ? 'Your campaigns are highly optimised'
                        : data.total >= 60 ? 'Good performance with clear improvement areas'
                        : data.total >= 40 ? 'Significant opportunities to improve efficiency'
                        : 'Critical issues need immediate attention'}
                    </div>
                  </div>
                </div>

                {data.change !== null && (
                  <div className="flex items-center gap-1.5 mb-3 text-[13px]" style={{ color: data.change >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                    {data.change > 0 ? <TrendingUp size={14}/> : data.change < 0 ? <TrendingDown size={14}/> : <Minus size={14}/>}
                    {data.change > 0 ? '+' : ''}{data.change} points from last week
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,160,0.06)', border: '1px solid rgba(0,212,160,0.15)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--teal)' }}>Top win</div>
                    <div className="text-[12px] leading-snug" style={{ color: 'var(--text2)' }}>{data.topWin}</div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,170,68,0.06)', border: '1px solid rgba(255,170,68,0.15)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--warn)' }}>Top issue</div>
                    <div className="text-[12px] leading-snug" style={{ color: 'var(--text2)' }}>{data.topIssue}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[14px] font-bold">Score breakdown</div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--text2)' }}>How each area contributes to your total score</div>
            </div>
            {data.components.map((comp, i) => {
              const pct = (comp.score / comp.max) * 100
              const color = comp.status === 'good' ? 'var(--teal)' : comp.status === 'warning' ? 'var(--warn)' : 'var(--danger)'
              return (
                <div key={i} className="px-5 py-4 border-b hover:bg-[var(--bg3)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <StatusIcon status={comp.status} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold">{comp.name}</span>
                        <span className="text-[12px] font-mono font-bold" style={{ color }}>
                          {comp.score}/{comp.max}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }}/>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] ml-[22px]" style={{ color: 'var(--text2)' }}>{comp.insight}</div>
                </div>
              )
            })}
          </div>

          {/* How to improve */}
          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[14px] font-bold mb-4">How to improve your score</div>
            <div className="flex flex-col gap-3">
              {data.components.filter(c => c.status !== 'good').map((comp, i) => {
                const action = comp.name === 'ROAS Efficiency' ? { text: 'Review low-ROAS campaigns', href: '/spend' }
                  : comp.name === 'Budget Allocation' ? { text: 'Run AI Spend Analysis', href: '/spend' }
                  : comp.name === 'Alert Coverage' ? { text: 'Set up alerts', href: '/alerts' }
                  : comp.name === 'UGC & Influencer Tracking' ? { text: 'Add influencer campaigns', href: '/ugc' }
                  : { text: 'Connect ad platforms', href: '/import' }
                const pts = comp.max - comp.score
                return (
                  <div key={i} className="flex items-center gap-4 p-3.5 rounded-lg" style={{ background: 'var(--bg3)' }}>
                    <div>
                      <div className="text-[12px] font-semibold mb-0.5">{comp.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{comp.insight}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,212,160,0.1)', color: 'var(--teal)' }}>
                        +{pts} pts possible
                      </span>
                      <a href={action.href}
                        className="text-[12px] font-semibold px-3 py-1.5 rounded-lg no-underline"
                        style={{ background: 'var(--teal)', color: '#001a12' }}>
                        {action.text} →
                      </a>
                    </div>
                  </div>
                )
              })}
              {data.components.every(c => c.status === 'good') && (
                <div className="text-center py-4 text-[13px]" style={{ color: 'var(--teal)' }}>
                  ✓ All areas are performing well — keep it up!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Share card + context */}
        <div className="flex flex-col gap-4">
          <ShareCard score={data.total} grade={data.grade} label={data.label} userId={user?.id || ''} />

          <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[13px] font-bold mb-3">What is Pulse Score?</div>
            <div className="flex flex-col gap-2.5 text-[12px]" style={{ color: 'var(--text2)' }}>
              {[
                { label: 'ROAS Efficiency', pts: '25 pts', desc: 'How well your campaigns convert spend to revenue' },
                { label: 'Budget Allocation', pts: '20 pts', desc: 'How intelligently budget is distributed' },
                { label: 'UGC Tracking', pts: '20 pts', desc: 'Influencer campaign setup and revenue attribution' },
                { label: 'Platform Connectivity', pts: '20 pts', desc: 'Real-time data from connected ad accounts' },
                { label: 'Alert Coverage', pts: '15 pts', desc: 'Monitoring for ROAS drops and spend issues' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>{item.pts}</span>
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{item.label}</span>
                    <span className="ml-1">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4 text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>Industry average</div>
            <div className="text-[28px] font-bold font-mono" style={{ color: 'var(--warn)' }}>52</div>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Your score: <span style={{ color: scoreColor }}>{data.total}</span></div>
            <div className="mt-2 text-[11px]" style={{ color: data.total >= 52 ? 'var(--teal)' : 'var(--danger)' }}>
              {data.total >= 52
                ? `${data.total - 52} points above average`
                : `${52 - data.total} points below average`}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}