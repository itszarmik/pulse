import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}
        className="sticky top-0 z-50 flex items-center justify-between px-8 h-[56px]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
              <path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/>
            </svg>
          </div>
          <span className="font-mono font-bold text-[15px]">Pulse</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-[13px] no-underline" style={{ color: 'var(--text2)' }}>Features</Link>
          <Link href="#pricing" className="text-[13px] no-underline" style={{ color: 'var(--text2)' }}>Pricing</Link>
          <Link href="/sign-in" className="text-[13px] no-underline" style={{ color: 'var(--text2)' }}>Log in</Link>
          <Link href="/sign-up"
            className="px-4 py-1.5 rounded-[7px] text-[13px] font-semibold no-underline"
            style={{ background: 'var(--teal)', color: '#001a12' }}>
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-8 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-8 border"
          style={{ background: 'var(--teal-dim)', borderColor: 'rgba(0,212,160,0.25)', color: 'var(--teal)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--teal)' }} />
          Now in beta — 14-day free trial, no credit card required
        </div>
        <h1 className="text-[58px] font-bold leading-[1.1] mb-6 max-w-3xl"
          style={{ letterSpacing: '-0.03em' }}>
          The AI-powered dashboard for{' '}
          <span style={{ color: 'var(--teal)' }}>ad agencies</span>
        </h1>
        <p className="text-[18px] max-w-xl mb-10 leading-relaxed" style={{ color: 'var(--text2)' }}>
          Track ROAS across Meta, Google and TikTok. Get AI-powered campaign insights.
          Generate high-converting ad variants. All in one place.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/sign-up"
            className="px-7 py-3 rounded-[10px] text-[15px] font-semibold no-underline"
            style={{ background: 'var(--teal)', color: '#001a12' }}>
            Get started free →
          </Link>
          <Link href="/sign-in"
            className="px-7 py-3 rounded-[10px] text-[15px] font-medium no-underline border"
            style={{ borderColor: 'var(--border2)', color: 'var(--text)' }}>
            View demo
          </Link>
        </div>
        <div className="flex items-center gap-6 mt-8" style={{ color: 'var(--text3)' }}>
          {['No credit card required', '14-day free trial', 'Cancel anytime'].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[12px]">
              <span style={{ color: 'var(--teal)' }}>✓</span> {t}
            </span>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="px-8 pb-24 flex justify-center">
        <div className="w-full max-w-5xl rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(0,212,160,0.2)', background: 'var(--bg2)', boxShadow: '0 0 80px rgba(0,212,160,0.08)' }}>
          <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg3)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }}/>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warn)' }}/>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--teal)' }}/>
            <span className="ml-3 text-[11px]" style={{ color: 'var(--text3)' }}>pulse-ruddy-psi.vercel.app/dashboard</span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'ROAS', value: '4.2x', change: '+0.4x', color: 'var(--teal)' },
                { label: 'Total Spend', value: '£24,830', change: '-3.2%', color: 'var(--danger)' },
                { label: 'Clicks', value: '142K', change: '+12.1%', color: 'var(--teal)' },
                { label: 'Conversions', value: '2,194', change: '+8.7%', color: 'var(--teal)' },
              ].map((kpi, i) => (
                <div key={i} className="rounded-lg p-3.5" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] mb-2" style={{ color: 'var(--text2)' }}>{kpi.label}</div>
                  <div className="text-[22px] font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--text3)' }}>{kpi.change} from last period</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
              <div className="text-[12px] font-semibold mb-3">All Campaigns</div>
              {[
                { name: 'Summer Sale 2025', platform: 'Meta', roas: '5.1x', status: 'Active', color: '#1877f2' },
                { name: 'Brand Awareness Q2', platform: 'Google', roas: '3.8x', status: 'Active', color: '#ea4335' },
                { name: 'Retargeting — Cart Abandoners', platform: 'Meta', roas: '6.2x', status: 'Active', color: '#1877f2' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t text-[12px]" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-medium">{c.name}</span>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }}/>
                    {c.platform}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'rgba(0,212,160,0.1)', color: 'var(--teal)' }}>{c.status}</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--teal)' }}>{c.roas}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-8 py-12 border-y" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-center gap-16 flex-wrap max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-[32px] font-bold" style={{ color: 'var(--teal)' }}>4.2x</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text2)' }}>Average ROAS improvement</div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-bold" style={{ color: 'var(--teal)' }}>£2.4M</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text2)' }}>Ad spend managed</div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-bold" style={{ color: 'var(--teal)' }}>3 min</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text2)' }}>Average setup time</div>
          </div>
          <div className="text-center">
            <div className="text-[32px] font-bold" style={{ color: 'var(--teal)' }}>98%</div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--text2)' }}>Customer satisfaction</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--teal)' }}>Features</div>
          <h2 className="text-[38px] font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>
            Everything your agency needs
          </h2>
          <p className="text-[16px] max-w-lg mx-auto" style={{ color: 'var(--text2)' }}>
            From real-time ROAS tracking to AI-generated ad copy, Pulse has the tools to scale your campaigns.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {[
            {
              icon: '📊',
              title: 'Live campaign dashboard',
              desc: 'Track ROAS, spend, clicks and conversions across Meta, Google and TikTok in a single view. Filter by platform, status and date range.',
            },
            {
              icon: '🤖',
              title: 'AI campaign analysis',
              desc: 'Get actionable recommendations from Claude AI. Know exactly which campaigns to scale, pause or optimise — before you waste budget.',
            },
            {
              icon: '✨',
              title: 'Ad variant generator',
              desc: 'Generate 5 high-converting ad copy variants in seconds. Specify your platform, audience, tone and objective — Claude does the rest.',
            },
            {
              icon: '🏢',
              title: 'Multi-client accounts',
              desc: 'Manage all your clients from one workspace. Each account gets its own campaigns, reports and performance insights.',
            },
            {
              icon: '📈',
              title: 'ROAS benchmarking',
              desc: 'See how each campaign performs against platform benchmarks. Instant signal on what's underperforming before it costs you.',
            },
            {
              icon: '📥',
              title: 'CSV & platform import',
              desc: 'Connect Meta, Google and TikTok directly or import via CSV. Get up and running in minutes with your existing data.',
            },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="text-[28px] mb-3">{f.icon}</div>
              <div className="text-[14px] font-semibold mb-2">{f.title}</div>
              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-24" style={{ background: 'var(--bg2)' }}>
        <div className="text-center mb-16 max-w-5xl mx-auto">
          <div className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--teal)' }}>Pricing</div>
          <h2 className="text-[38px] font-bold mb-4" style={{ letterSpacing: '-0.02em' }}>Simple, transparent pricing</h2>
          <p className="text-[16px]" style={{ color: 'var(--text2)' }}>Start free for 14 days. No credit card required.</p>
        </div>
        <div className="grid grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { name: 'Starter', price: '£99', period: '/mo', features: ['5 client accounts', '20 AI calls/month', 'Campaign dashboard', 'CSV import', 'Email support'], highlight: false },
            { name: 'Pro', price: '£499', period: '/mo', features: ['25 client accounts', '100 AI calls/month', 'Everything in Starter', 'Ad Variant Generator', 'ROAS benchmarking', 'Priority support'], highlight: true },
            { name: 'Agency', price: '£1,999', period: '/mo', features: ['Unlimited accounts', 'Unlimited AI calls', 'Everything in Pro', 'White-label reports', 'Dedicated manager', 'Custom integrations'], highlight: false },
          ].map((plan, i) => (
            <div key={i} className="rounded-xl border flex flex-col relative overflow-hidden"
              style={{
                background: plan.highlight ? 'linear-gradient(160deg, rgba(0,212,160,0.07), var(--bg2))' : 'var(--bg)',
                borderColor: plan.highlight ? 'rgba(0,212,160,0.4)' : 'var(--border)',
              }}>
              {plan.highlight && (
                <div className="absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg"
                  style={{ background: 'var(--teal)', color: '#001a12' }}>MOST POPULAR</div>
              )}
              <div className="p-6 flex-1">
                <div className="text-[13px] font-semibold mb-2" style={{ color: plan.highlight ? 'var(--teal)' : 'var(--text2)' }}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-[34px] font-bold">{plan.price}</span>
                  <span className="text-[13px] mb-1" style={{ color: 'var(--text2)' }}>{plan.period}</span>
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px]">
                      <span style={{ color: 'var(--teal)' }}>✓</span>
                      <span style={{ color: 'var(--text2)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <Link href="/sign-up"
                  className="block w-full py-2.5 rounded-lg text-[13px] font-semibold text-center no-underline"
                  style={{
                    background: plan.highlight ? 'var(--teal)' : 'var(--bg3)',
                    color: plan.highlight ? '#001a12' : 'var(--text)',
                    border: plan.highlight ? 'none' : '1px solid var(--border2)',
                  }}>
                  Start free trial
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center max-w-3xl mx-auto">
        <h2 className="text-[42px] font-bold mb-5" style={{ letterSpacing: '-0.02em' }}>
          Ready to grow your agency?
        </h2>
        <p className="text-[17px] mb-8" style={{ color: 'var(--text2)' }}>
          Join agencies already using Pulse to track performance, cut wasted spend and generate better ad copy.
        </p>
        <Link href="/sign-up"
          className="inline-block px-8 py-3.5 rounded-[10px] text-[15px] font-semibold no-underline"
          style={{ background: 'var(--teal)', color: '#001a12' }}>
          Get started free — no credit card needed
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t px-8 py-8 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[5px] flex items-center justify-center" style={{ background: 'var(--teal)' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/>
            </svg>
          </div>
          <span className="font-mono font-semibold text-[13px]">Pulse</span>
        </div>
        <div className="text-[12px]" style={{ color: 'var(--text3)' }}>© 2025 Pulse. All rights reserved.</div>
        <div className="flex gap-5">
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <Link key={l} href="#" className="text-[12px] no-underline" style={{ color: 'var(--text3)' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}