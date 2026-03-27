'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import type { Platform } from '@/types'

const STEPS = [
  { num: 1, title: 'Welcome to Pulse', sub: 'Tell us about your agency' },
  { num: 2, title: 'Connect your platforms', sub: 'Which ad platforms do you manage?' },
  { num: 3, title: 'Create your first client', sub: 'Add your first client account to get started' },
]

const PLATFORMS: { id: Platform; label: string; color: string; icon: string }[] = [
  { id: 'Meta', label: 'Meta Ads', color: '#1877f2', icon: 'f' },
  { id: 'Google', label: 'Google Ads', color: '#ea4335', icon: 'G' },
  { id: 'TikTok', label: 'TikTok Ads', color: '#00d4a0', icon: '♪' },
]

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 fields
  const [agencyName, setAgencyName] = useState('')
  const [role, setRole] = useState('')
  const [teamSize, setTeamSize] = useState('')

  // Step 2 fields
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])

  // Step 3 fields
  const [clientName, setClientName] = useState('')
  const [clientSpend, setClientSpend] = useState('')

  const canNext = () => {
    if (step === 1) return agencyName.trim().length > 0
    if (step === 2) return selectedPlatforms.length > 0
    if (step === 3) return true // client is optional
    return false
  }

  const handleNext = async () => {
    if (step < 3) { setStep(s => s + 1); return }
    // Final step - save everything and redirect
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
      // Mark onboarding complete in localStorage
      localStorage.setItem('pulse_onboarded', 'true')
      router.push('/')
    } catch (e) {
      router.push('/')
    } finally {
      setSaving(false)
    }
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
                <div className="flex-1 h-px" style={{ background: step > s.num ? 'var(--teal)' : 'var(--border)' }} />
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

          {/* Step 1 */}
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
                  <option>Agency Owner</option>
                  <option>Media Buyer</option>
                  <option>Performance Marketer</option>
                  <option>Marketing Manager</option>
                  <option>Freelancer</option>
                  <option>Other</option>
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
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] mb-2" style={{ color: 'var(--text3)' }}>Select all that apply — you can connect more later.</p>
              {PLATFORMS.map(p => {
                const sel = selectedPlatforms.includes(p.id)
                return (
                  <button key={p.id}
                    onClick={() => setSelectedPlatforms(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: sel ? 'rgba(0,212,160,0.05)' : 'var(--bg3)',
                      borderColor: sel ? 'rgba(0,212,160,0.35)' : 'var(--border)',
                    }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[15px] shrink-0"
                      style={{ background: p.color }}>
                      {p.icon}
                    </div>
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

          {/* Step 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4 border mb-2"
                style={{ background: 'rgba(0,212,160,0.05)', borderColor: 'rgba(0,212,160,0.2)' }}>
                <p className="text-[12px]" style={{ color: 'var(--teal)' }}>
                  ✓ You can always add clients later from the Accounts page. This step is optional.
                </p>
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

          {/* Footer */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : null}
              className="text-[13px] px-4 py-2 rounded-lg transition-colors"
              style={{ color: step === 1 ? 'transparent' : 'var(--text2)', cursor: step === 1 ? 'default' : 'pointer' }}>
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext() || saving}
              className="px-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                background: canNext() && !saving ? 'var(--teal)' : 'var(--bg4)',
                color: canNext() && !saving ? '#001a12' : 'var(--text3)',
                cursor: canNext() && !saving ? 'pointer' : 'not-allowed',
              }}>
              {saving ? 'Setting up...' : step === 3 ? (clientName ? 'Create account & go to dashboard →' : 'Skip & go to dashboard →') : 'Continue →'}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text3)' }}>
          Takes less than 2 minutes. You can change everything later in settings.
        </p>
      </div>
    </div>
  )
}