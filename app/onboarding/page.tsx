'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Zap, TrendingUp, Bell, FileText, ArrowRight, Check, Sparkles } from 'lucide-react'
import type { Platform } from '@/types'

const STEPS = [
  { num: 1, title: 'Welcome to Pulse', sub: 'Tell us about your agency' },
  { num: 2, title: 'Connect your platforms', sub: 'Which ad platforms do you manage?' },
  { num: 3, title: 'Add your first client', sub: 'Optional — you can add more later' },
  { num: 4, title: 'Your first insight', sub: 'See Pulse in action with demo data' },
]

const PLATFORMS: { id: Platform; label: string; color: string; icon: string }[] = [
  { id: 'Meta', label: 'Meta Ads', color: '#1877f2', icon: 'f' },
  { id: 'Google', label: 'Google Ads', color: '#ea4335', icon: 'G' },
  { id: 'TikTok', label: 'TikTok Ads', color: '#00d4a0', icon: '♪' },
]

const MOCK_CAMPAIGNS = [
  { id:'1', name:'Summer Sale — Broad Audience', platform:'Meta', spend:3200, revenue:4480, roas:1.4, clicks:8200, impressions:142000, conversions:89, ctr:5.77, cpc:0.39, status:'Active' },
  { id:'2', name:'Retargeting — Cart Abandoners', platform:'Meta', spend:800, revenue:6240, roas:7.8, clicks:1240, impressions:18600, conversions:156, ctr:6.67, cpc:0.65, status:'Active' },
  { id:'3', name:'Brand Awareness Q3', platform:'Google', spend:1500, revenue:1200, roas:0.8, clicks:3100, impressions:89000, conversions:24, ctr:3.48, cpc:0.48, status:'Active' },
  { id:'4', name:'Google Shopping — All Products', platform:'Google', spend:1200, revenue:5400, roas:4.5, clicks:2800, impressions:41000, conversions:108, ctr:6.83, cpc:0.43, status:'Active' },
  { id:'5', name:'TikTok — Product Demo Video', platform:'TikTok', spend:2100, revenue:2520, roas:1.2, clicks:6700, impressions:198000, conversions:63, ctr:3.38, cpc:0.31, status:'Active' },
  { id:'6', name:'Lookalike — Past Purchasers', platform:'Meta', spend:950, revenue:5700, roas:6.0, clicks:1800, impressions:28000, conversions:142, ctr:6.43, cpc:0.53, status:'Active' },
]

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

type AiResult = {
  quickWin?: { title: string; description: string; action: string; impact: string }
  totalWastedSpend?: number
  totalOpportunityGain?: number
  projectedROAS?: number
  summary?: string
}

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [agencyName, setAgencyName] = useState('')
  const [role, setRole] = useState('')
  const [teamSize, setTeamSize] = useState('')

  // Step 2
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  // Step 3
  const [clientName, setClientName] = useState('')
  const [clientSpend, setClientSpend] = useState('')

  // Step 4 — AI aha moment
  const [analysing, setAnalysing] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [analysisError, setAnalysisError] = useState(false)
  const [alertSet, setAlertSet] = useState(false)

  // Auto-run analysis when step 4 mounts
  useEffect(() => {
    if (step !== 4 || aiResult || analysing) return
    runAnalysis()
  }, [step])

  const runAnalysis = async () => {
    setAnalysing(true)
    setAnalysisError(false)
    try {
      const res = await fetch('/api/spend-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: MOCK_CAMPAIGNS, totalBudget: 9750, currency: 'GBP' }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setAiResult(data)
    } catch {
      setAnalysisError(true)
    } finally {
      setAnalysing(false)
    }
  }

  const canNext = () => {
    if (step === 1) return agencyName.trim().length > 0
    if (step === 2) return selectedPlatforms.length > 0
    if (step === 3) return true
    if (step === 4) return true
    return false
  }

  const handleNext = async () => {
    if (step < 4) {
      if (step === 3) {
        // Save client + move to step 4
        setSaving(true)
        try {
          if (clientName.trim() && user) {
            await supabase.from('client_accounts').insert({
              name: clientName.trim(),
              initials: getInitials(clientName.trim()),
              platforms: selectedPlatforms,
              monthly_spend: parseInt(clientSpend) || 0,
              status: 'Active',
              campaigns: 0,
              roas: 0,
              user_id: user.id,
            })
          }
        } catch {}
        setSaving(false)
      }
      setStep(s => s + 1)
      return
    }

    // Final step — go to dashboard
    localStorage.setItem('pulse_onboarded', 'true')
    router.push('/spend')
  }

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
              <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
            </svg>
          </div>
          <span className="font-mono font-bold text-[17px]">Pulse</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold shrink-0 transition-all"
                style={{
                  background: step >= s.num ? 'var(--teal)' : 'var(--bg3)',
                  color: step >= s.num ? '#001a12' : 'var(--text3)',
                  border: step === s.num ? 'none' : '1px solid var(--border)',
                }}>
                {step > s.num ? '✓' : s.num}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px transition-all" style={{ background: step > s.num ? 'var(--teal)' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}>
          <div className="mb-6">
            <h1 className="text-[22px] font-bold mb-1">{STEPS[step-1].title}</h1>
            <p className="text-[13px]" style={{ color: 'var(--text2)' }}>{STEPS[step-1].sub}</p>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Agency / Company name *</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)}
                  placeholder="e.g. Acme Media Agency"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                  style={inputStyle} autoFocus />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Your role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none" style={inputStyle}>
                  <option value="">Select your role...</option>
                  <option>Agency Owner</option><option>Media Buyer</option>
                  <option>Performance Marketer</option><option>Marketing Manager</option>
                  <option>Freelancer</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Team size</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Solo', '2–5', '6–20', '20+'].map(s => (
                    <button key={s} onClick={() => setTeamSize(s)}
                      className="py-2 rounded-lg border text-[12px] font-medium transition-all"
                      style={{
                        background: teamSize === s ? 'var(--teal-dim)' : 'var(--bg3)',
                        borderColor: teamSize === s ? 'rgba(0,212,160,0.4)' : 'var(--border)',
                        color: teamSize === s ? 'var(--teal)' : 'var(--text2)',
                      }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] mb-1" style={{ color: 'var(--text3)' }}>Select all that apply — you can connect more later.</p>
              {PLATFORMS.map(p => {
                const sel = selectedPlatforms.includes(p.id)
                return (
                  <button key={p.id} onClick={() => setSelectedPlatforms(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                    style={{ background: sel ? 'rgba(0,212,160,0.05)' : 'var(--bg3)', borderColor: sel ? 'rgba(0,212,160,0.35)' : 'var(--border)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[15px] shrink-0"
                      style={{ background: p.color }}>{p.icon}</div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{p.label}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                        {p.id === 'Meta' && 'Facebook & Instagram ads'}
                        {p.id === 'Google' && 'Search, Display & Shopping'}
                        {p.id === 'TikTok' && 'TikTok & social video ads'}
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                      style={{ borderColor: sel ? 'var(--teal)' : 'var(--border)', background: sel ? 'var(--teal)' : 'transparent' }}>
                      {sel && <span className="text-[10px] font-bold" style={{ color: '#001a12' }}>✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4 border mb-1" style={{ background: 'rgba(0,212,160,0.05)', borderColor: 'rgba(0,212,160,0.2)' }}>
                <p className="text-[12px]" style={{ color: 'var(--teal)' }}>✓ Optional — you can always add clients later from the Accounts page.</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Client name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Nike UK"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                  style={inputStyle} autoFocus />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Monthly ad spend (optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text2)' }}>£</span>
                  <input type="number" value={clientSpend} onChange={e => setClientSpend(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-lg border pl-8 pr-3.5 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                    style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — AHA MOMENT */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              {analysing && (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'rgba(0,212,160,0.15)' }}>
                    <Sparkles size={28} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[14px] font-bold mb-1">Claude is analysing your campaigns...</div>
                    <div className="text-[12px]" style={{ color: 'var(--text2)' }}>Finding wasted spend and scaling opportunities</div>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--teal)', animationDelay: `${i * 0.15}s` }}/>
                    ))}
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="text-center py-4">
                  <div className="text-[13px] mb-3" style={{ color: 'var(--text2)' }}>Couldn't load analysis right now.</div>
                  <button onClick={runAnalysis} className="text-[12px] px-4 py-2 rounded-lg" style={{ background: 'var(--teal)', color: '#001a12', fontWeight: 600 }}>Try again</button>
                </div>
              )}

              {aiResult && !analysing && (
                <>
                  {/* Big win banner */}
                  <div className="rounded-xl border p-4 flex items-start gap-3"
                    style={{ background: 'linear-gradient(135deg, rgba(0,212,160,0.1), rgba(0,212,160,0.04))', borderColor: 'rgba(0,212,160,0.35)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--teal)' }}>
                      <Zap size={16} color="#001a12" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--teal)' }}>⚡ Claude just found this</div>
                      <div className="text-[13px] font-bold mb-1">{aiResult.quickWin?.title || 'Budget reallocation opportunity'}</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>{aiResult.quickWin?.description}</div>
                      <div className="mt-2 text-[12px] font-bold" style={{ color: 'var(--teal)' }}>{aiResult.quickWin?.impact}</div>
                    </div>
                  </div>

                  {/* Two stat pills */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg p-3 border" style={{ background: 'rgba(255,92,92,0.08)', borderColor: 'rgba(255,92,92,0.2)' }}>
                      <div className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--danger)' }}>Wasted spend found</div>
                      <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--danger)' }}>
                        £{(aiResult.totalWastedSpend || 0).toLocaleString()}<span className="text-[11px]">/mo</span>
                      </div>
                    </div>
                    <div className="rounded-lg p-3 border" style={{ background: 'rgba(0,212,160,0.08)', borderColor: 'rgba(0,212,160,0.2)' }}>
                      <div className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--teal)' }}>Revenue opportunity</div>
                      <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--teal)' }}>
                        +£{(aiResult.totalOpportunityGain || 0).toLocaleString()}<span className="text-[11px]">/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick alert setup */}
                  <div className="rounded-xl border p-4" style={{ background: 'var(--bg3)', borderColor: alertSet ? 'rgba(0,212,160,0.3)' : 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={14} style={{ color: alertSet ? 'var(--teal)' : 'var(--text2)' }} />
                        <div>
                          <div className="text-[12px] font-semibold">Get alerted when ROAS drops below 2x</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>Never miss a campaign going off the rails</div>
                        </div>
                      </div>
                      <button onClick={() => setAlertSet(true)} disabled={alertSet}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ml-3"
                        style={{ background: alertSet ? 'rgba(0,212,160,0.1)' : 'var(--teal)', color: alertSet ? 'var(--teal)' : '#001a12', border: alertSet ? '1px solid rgba(0,212,160,0.3)' : 'none' }}>
                        {alertSet ? <><Check size={11} style={{ display: 'inline', marginRight: 4 }}/>Set</> : 'Set alert'}
                      </button>
                    </div>
                  </div>

                  {/* What's waiting */}
                  <div className="rounded-xl border p-4" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                    <div className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text2)' }}>What's waiting for you inside →</div>
                    <div className="flex flex-col gap-2">
                      {[
                        { icon: <TrendingUp size={12}/>, text: 'Full AI budget reallocation plan with apply buttons', col: '#00d4a0' },
                        { icon: <FileText size={12}/>, text: 'One-click branded client reports — share in seconds', col: '#6366f1' },
                        { icon: <Bell size={12}/>, text: 'Real-time alerts when campaigns need attention', col: '#f97316' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text2)' }}>
                          <span style={{ color: item.col }}>{item.icon}</span>
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-8">
            <button onClick={() => step > 1 ? setStep(s => s - 1) : null}
              className="text-[13px] px-4 py-2 rounded-lg transition-colors"
              style={{ color: step === 1 ? 'transparent' : 'var(--text2)', cursor: step === 1 ? 'default' : 'pointer' }}>
              ← Back
            </button>
            <button onClick={handleNext} disabled={!canNext() || saving || (step === 4 && analysing)}
              className="px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-2"
              style={{
                background: canNext() && !saving && !(step === 4 && analysing) ? 'var(--teal)' : 'var(--bg4)',
                color: canNext() && !saving && !(step === 4 && analysing) ? '#001a12' : 'var(--text3)',
                cursor: canNext() && !saving && !(step === 4 && analysing) ? 'pointer' : 'not-allowed',
              }}>
              {saving ? 'Saving...' :
               step === 4 && analysing ? 'Analysing...' :
               step === 4 ? <>Go to dashboard <ArrowRight size={14}/></> :
               step === 3 ? (clientName ? 'Save & continue →' : 'Skip & continue →') :
               'Continue →'}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text3)' }}>
          Takes less than 2 minutes · Everything can be changed later in Settings
        </p>
      </div>
    </div>
  )
}
