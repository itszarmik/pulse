'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Zap, TrendingUp, Bell, FileText, ArrowRight, Check, Sparkles, Users, Target, BarChart2 } from 'lucide-react'
import type { Platform } from '@/types'

const STEPS = [
  { num: 1, title: 'Welcome to Pulse', sub: 'Tell us about your agency' },
  { num: 2, title: 'What platforms do you run?', sub: 'Select all that apply' },
  { num: 3, title: 'Add your first client', sub: 'Optional — skip if you prefer' },
  { num: 4, title: 'Your first AI insight', sub: 'See what Pulse just found' },
]

const PLATFORMS: { id: Platform; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'Meta', label: 'Meta Ads', color: '#1877f2', icon: 'f', desc: 'Facebook & Instagram' },
  { id: 'Google', label: 'Google Ads', color: '#ea4335', icon: 'G', desc: 'Search, Shopping & Display' },
  { id: 'TikTok', label: 'TikTok Ads', color: '#00d4a0', icon: '\u266a', desc: 'TikTok & social video' },
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
  const [agencyName, setAgencyName] = useState('')
  const [role, setRole] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [clientName, setClientName] = useState('')
  const [clientSpend, setClientSpend] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [analysisError, setAnalysisError] = useState(false)
  const [alertSet, setAlertSet] = useState(false)

  // Skip if already onboarded
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('pulse_onboarded') === 'true') {
      router.replace('/spend')
    }
  }, [router])

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
      setAiResult(await res.json())
    } catch {
      setAnalysisError(true)
    } finally {
      setAnalysing(false)
    }
  }

  const canNext = () => {
    if (step === 1) return agencyName.trim().length > 0
    if (step === 2) return selectedPlatforms.length > 0
    return true
  }

  const handleNext = async () => {
    if (step === 3) {
      setSaving(true)
      try {
        if (user) {
          // Save agency name to brand_settings
          if (agencyName.trim()) {
            await supabase.from('brand_settings').upsert({
              user_id: user.id,
              agency_name: agencyName.trim(),
              brand_color: '#00d4a0',
              hide_pulse_branding: false,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
          }
          // Save first client if provided
          if (clientName.trim()) {
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
        }
      } catch (e) { console.error(e) }
      setSaving(false)
      setStep(4)
      return
    }

    if (step === 4) {
      if (typeof window !== 'undefined') localStorage.setItem('pulse_onboarded', 'true')
      router.push('/spend')
      return
    }

    setStep(s => s + 1)
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="fixed inset-0 z-[200] flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel - branding + progress */}
      <div className="hidden lg:flex flex-col justify-between w-[340px] shrink-0 border-r p-10" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
                <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
              </svg>
            </div>
            <span className="font-mono font-bold text-[17px]">Pulse</span>
          </div>

          {/* Steps list */}
          <div className="flex flex-col gap-1">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                style={{ background: step === s.num ? 'rgba(0,212,160,0.08)' : 'transparent' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                  style={{
                    background: step > s.num ? 'var(--teal)' : step === s.num ? 'rgba(0,212,160,0.2)' : 'var(--bg3)',
                    color: step > s.num ? '#001a12' : step === s.num ? 'var(--teal)' : 'var(--text3)',
                    border: step === s.num ? '1px solid rgba(0,212,160,0.4)' : '1px solid var(--border)',
                  }}>
                  {step > s.num ? <Check size={11}/> : s.num}
                </div>
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: step === s.num ? 'var(--teal)' : step > s.num ? 'var(--text)' : 'var(--text3)' }}>{s.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom promise */}
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-semibold mb-3" style={{ color: 'var(--text2)' }}>What you get on the other side</div>
          {[
            { icon: <Zap size={12}/>, text: 'AI finds wasted spend instantly', col: '#00d4a0' },
            { icon: <FileText size={12}/>, text: 'Branded client reports in 1 click', col: '#6366f1' },
            { icon: <Bell size={12}/>, text: 'Real-time ROAS alerts', col: '#f97316' },
            { icon: <BarChart2 size={12}/>, text: 'Budget reallocation simulator', col: '#06b6d4' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] mb-2" style={{ color: 'var(--text2)' }}>
              <span style={{ color: item.col }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
              <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
            </svg>
          </div>
          <span className="font-mono font-bold text-[16px]">Pulse</span>
        </div>

        {/* Mobile progress bar */}
        <div className="w-full max-w-md mb-6 lg:hidden">
          <div className="flex justify-between text-[11px] mb-2" style={{ color: 'var(--text3)' }}>
            <span>Step {step} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--bg3)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--teal)' }}/>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold leading-tight mb-2">{STEPS[step-1].title}</h1>
            <p className="text-[14px]" style={{ color: 'var(--text2)' }}>{STEPS[step-1].sub}</p>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Agency / Company name *</label>
                <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)}
                  placeholder="e.g. Acme Media Agency"
                  className="w-full rounded-xl border px-4 py-3 text-[14px] outline-none focus:border-[var(--teal)] transition-colors"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                  autoFocus onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()} />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Your role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-[14px] outline-none transition-colors"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', color: 'var(--text)' }}>
                  <option value="">Select your role...</option>
                  <option>Agency Owner</option>
                  <option>Media Buyer</option>
                  <option>Performance Marketer</option>
                  <option>Marketing Manager</option>
                  <option>Freelancer</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Team size</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Solo', '2–5', '6–20', '20+'].map(s => (
                    <button key={s} onClick={() => setTeamSize(s)}
                      className="py-2.5 rounded-xl border text-[13px] font-semibold transition-all"
                      style={{
                        background: teamSize === s ? 'rgba(0,212,160,0.1)' : 'var(--bg2)',
                        borderColor: teamSize === s ? 'rgba(0,212,160,0.4)' : 'var(--border2)',
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
              <p className="text-[13px] mb-2" style={{ color: 'var(--text3)' }}>You can connect the actual APIs later. Just tell us what you manage.</p>
              {PLATFORMS.map(p => {
                const sel = selectedPlatforms.includes(p.id)
                return (
                  <button key={p.id} onClick={() => setSelectedPlatforms(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: sel ? 'rgba(0,212,160,0.05)' : 'var(--bg2)',
                      borderColor: sel ? 'rgba(0,212,160,0.35)' : 'var(--border2)',
                      boxShadow: sel ? '0 0 0 1px rgba(0,212,160,0.2)' : 'none',
                    }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[16px] shrink-0"
                      style={{ background: p.color }}>{p.icon}</div>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold">{p.label}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: 'var(--text3)' }}>{p.desc}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all"
                      style={{ borderColor: sel ? 'var(--teal)' : 'var(--border2)', background: sel ? 'var(--teal)' : 'transparent' }}>
                      {sel && <Check size={11} color="#001a12"/>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(0,212,160,0.05)', borderColor: 'rgba(0,212,160,0.2)' }}>
                <p className="text-[13px]" style={{ color: 'var(--teal)' }}>
                  <Check size={13} style={{ display:'inline', marginRight: 6 }}/>
                  Optional — you can add clients anytime from the Accounts page.
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Client name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Nike UK, Zara, Local Gym"
                  className="w-full rounded-xl border px-4 py-3 text-[14px] outline-none focus:border-[var(--teal)] transition-colors"
                  style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', color: 'var(--text)' }}
                  autoFocus />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Monthly ad spend (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: 'var(--text2)' }}>£</span>
                  <input type="number" value={clientSpend} onChange={e => setClientSpend(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-xl border pl-9 pr-4 py-3 text-[14px] outline-none focus:border-[var(--teal)] transition-colors"
                    style={{ background: 'var(--bg2)', borderColor: 'var(--border2)', color: 'var(--text)' }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — AHA MOMENT */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              {analysing && (
                <div className="flex flex-col items-center py-10 gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(0,212,160,0.15)', animation: 'pulse 2s infinite' }}>
                    <Sparkles size={30} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[16px] font-bold mb-2">Claude is analysing your campaigns...</div>
                    <div className="text-[13px]" style={{ color: 'var(--text2)' }}>Finding wasted spend and opportunities</div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--teal)', animation: `bounce 1s infinite ${i * 0.15}s` }}/>
                    ))}
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="text-center py-6">
                  <div className="text-[13px] mb-4" style={{ color: 'var(--text2)' }}>Couldn't load the analysis right now.</div>
                  <button onClick={runAnalysis} className="px-5 py-2 rounded-xl text-[13px] font-semibold"
                    style={{ background: 'var(--teal)', color: '#001a12' }}>Try again</button>
                </div>
              )}

              {aiResult && !analysing && (
                <>
                  {/* The big moment */}
                  <div className="rounded-xl border p-5" style={{ background: 'linear-gradient(135deg, rgba(0,212,160,0.1), rgba(0,212,160,0.03))', borderColor: 'rgba(0,212,160,0.3)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--teal)' }}>
                        <Zap size={15} color="#001a12"/>
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--teal)' }}>Claude just found this</div>
                    </div>
                    <div className="text-[15px] font-bold mb-1.5">{aiResult.quickWin?.title || 'Budget reallocation opportunity'}</div>
                    <div className="text-[12px] leading-relaxed mb-3" style={{ color: 'var(--text2)' }}>{aiResult.quickWin?.description}</div>
                    <div className="text-[14px] font-bold" style={{ color: 'var(--teal)' }}>{aiResult.quickWin?.impact}</div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,92,92,0.07)', borderColor: 'rgba(255,92,92,0.2)' }}>
                      <div className="text-[10px] uppercase font-bold mb-1.5" style={{ color: 'var(--danger)' }}>Wasted spend</div>
                      <div className="text-[24px] font-bold font-mono" style={{ color: 'var(--danger)' }}>
                        £{(aiResult.totalWastedSpend || 0).toLocaleString()}
                        <span className="text-[11px] font-normal">/mo</span>
                      </div>
                    </div>
                    <div className="rounded-xl p-4 border" style={{ background: 'rgba(0,212,160,0.07)', borderColor: 'rgba(0,212,160,0.2)' }}>
                      <div className="text-[10px] uppercase font-bold mb-1.5" style={{ color: 'var(--teal)' }}>Revenue opportunity</div>
                      <div className="text-[24px] font-bold font-mono" style={{ color: 'var(--teal)' }}>
                        +£{(aiResult.totalOpportunityGain || 0).toLocaleString()}
                        <span className="text-[11px] font-normal">/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick alert */}
                  <div className="rounded-xl border p-4 transition-all" style={{ background: 'var(--bg2)', borderColor: alertSet ? 'rgba(0,212,160,0.3)' : 'var(--border2)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell size={16} style={{ color: alertSet ? 'var(--teal)' : 'var(--text2)', flexShrink: 0 }}/>
                        <div>
                          <div className="text-[13px] font-semibold">Alert me when ROAS drops below 2x</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>Catch issues before they cost you</div>
                        </div>
                      </div>
                      <button onClick={() => setAlertSet(true)} disabled={alertSet}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 ml-3"
                        style={{
                          background: alertSet ? 'rgba(0,212,160,0.1)' : 'var(--teal)',
                          color: alertSet ? 'var(--teal)' : '#001a12',
                          border: alertSet ? '1px solid rgba(0,212,160,0.3)' : 'none',
                          cursor: alertSet ? 'default' : 'pointer',
                        }}>
                        {alertSet ? <><Check size={11} style={{ display:'inline', marginRight: 3 }}/>Set!</> : 'Set alert'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[12px] text-center" style={{ color: 'var(--text3)' }}>
                    This is demo data. Connect Meta, Google or TikTok on the Import page to analyse your real campaigns.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => step > 1 ? setStep(s => s - 1) : null}
              className="text-[13px] px-4 py-2 rounded-lg transition-colors"
              style={{ color: step === 1 ? 'transparent' : 'var(--text2)', cursor: step === 1 ? 'default' : 'pointer' }}>
              ← Back
            </button>

            <div className="flex items-center gap-3">
              {step === 3 && (
                <button onClick={handleNext}
                  className="text-[13px] px-4 py-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text2)' }}>
                  Skip
                </button>
              )}
              <button onClick={handleNext}
                disabled={!canNext() || saving || (step === 4 && analysing)}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold transition-all flex items-center gap-2"
                style={{
                  background: canNext() && !saving && !(step === 4 && analysing) ? 'var(--teal)' : 'var(--bg3)',
                  color: canNext() && !saving && !(step === 4 && analysing) ? '#001a12' : 'var(--text3)',
                  cursor: canNext() && !saving && !(step === 4 && analysing) ? 'pointer' : 'not-allowed',
                }}>
                {saving ? 'Saving...'
                  : step === 4 && analysing ? 'Analysing...'
                  : step === 4 ? <>Open dashboard <ArrowRight size={14}/></>
                  : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
