'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '£99',
    period: '/month',
    description: 'For growing agencies managing a handful of clients.',
    features: [
      'Up to 5 client accounts',
      '20 AI analysis calls / month',
      'Campaign dashboard & insights',
      'CSV data import',
      'Email support',
    ],
    cta: 'Select Starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£499',
    period: '/month',
    description: 'For serious agencies scaling their ad operations.',
    features: [
      'Up to 25 client accounts',
      '100 AI analysis calls / month',
      'Everything in Starter',
      'Ad Variant Generator',
      'ROAS benchmarking',
      'Priority support',
    ],
    cta: 'Select Pro',
    highlight: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '£1,999',
    period: '/month',
    description: 'For large agencies with high-volume needs.',
    features: [
      'Unlimited client accounts',
      'Unlimited AI calls',
      'Everything in Pro',
      'White-label reports',
      'Dedicated account manager',
      'Custom integrations',
    ],
    cta: 'Select Agency',
    highlight: false,
  },
]

function BillingContent() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (searchParams.get('success')) {
      setBanner({ type: 'success', msg: '🎉 Payment successful! Your plan is now active.' })
    } else if (searchParams.get('cancelled')) {
      setBanner({ type: 'error', msg: 'Checkout cancelled — no charge was made.' })
    }
  }, [searchParams])

  useEffect(() => {
    async function loadPlan() {
      if (!user) return
      const { data } = await supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', user.id)
        .single()
      if (data) setCurrentPlan(data.plan)
    }
    loadPlan()
  }, [user])

  const handleSelect = async (planId: string) => {
    if (!user) { router.push('/sign-in'); return }
    setLoading(planId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (err: any) {
      setBanner({ type: 'error', msg: 'Error: ' + err.message })
      setLoading(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Plans & Billing"
        subtitle="Choose the plan that fits your agency. Upgrade or downgrade anytime."
      />

      {banner && (
        <div className="mb-6 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center justify-between"
          style={{
            background: banner.type === 'success' ? 'rgba(0,212,160,0.1)' : 'rgba(255,92,92,0.1)',
            color: banner.type === 'success' ? 'var(--teal)' : 'var(--danger)',
            border: `1px solid ${banner.type === 'success' ? 'rgba(0,212,160,0.25)' : 'rgba(255,92,92,0.25)'}`,
          }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 mb-8">
        {PLANS.map(plan => {
          const isActive = currentPlan === plan.id
          const isLoading = loading === plan.id
          return (
            <div key={plan.id}
              className="rounded-xl border flex flex-col relative overflow-hidden"
              style={{
                background: plan.highlight ? 'linear-gradient(160deg, rgba(0,212,160,0.07), var(--bg2))' : 'var(--bg2)',
                borderColor: plan.highlight ? 'rgba(0,212,160,0.4)' : isActive ? 'rgba(0,212,160,0.3)' : 'var(--border)',
              }}>
              {plan.highlight && (
                <div className="absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg"
                  style={{ background: 'var(--teal)', color: '#001a12' }}>
                  MOST POPULAR
                </div>
              )}
              <div className="p-6 flex-1">
                <div className="text-[13px] font-semibold mb-1.5"
                  style={{ color: plan.highlight ? 'var(--teal)' : 'var(--text2)' }}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-[34px] font-bold leading-none">{plan.price}</span>
                  <span className="text-[13px] mb-1" style={{ color: 'var(--text2)' }}>{plan.period}</span>
                </div>
                <p className="text-[12px] mb-5 leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {plan.description}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]">
                      <span className="mt-0.5 shrink-0" style={{ color: 'var(--teal)' }}>✓</span>
                      <span style={{ color: 'var(--text2)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                {isActive ? (
                  <div className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-center border"
                    style={{ borderColor: 'var(--teal)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.id)}
                    disabled={!!loading}
                    className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all"
                    style={{
                      background: plan.highlight ? 'var(--teal)' : 'var(--bg3)',
                      color: plan.highlight ? '#001a12' : 'var(--text)',
                      border: plan.highlight ? 'none' : '1px solid var(--border2)',
                      opacity: loading && !isLoading ? 0.5 : 1,
                      cursor: loading ? 'wait' : 'pointer',
                    }}>
                    {isLoading ? '↗ Redirecting to Stripe...' : plan.cta}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border p-5 flex items-center justify-between"
        style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div>
          <div className="text-[13px] font-semibold mb-0.5">🔒 Secure payments by Stripe</div>
          <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
            All plans include a 14-day free trial. Cancel anytime — no questions asked.
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" className="h-6 opacity-60" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 opacity-60" />
        </div>
      </div>
    </>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div />}>
      <BillingContent />
    </Suspense>
  )
}
