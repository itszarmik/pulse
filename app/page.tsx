'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Zap, BarChart2, Target, Bell, Users, FileText, TrendingUp, Check, ChevronRight, Star, Shield, Clock } from 'lucide-react'

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

const FEATURES = [
  {
    icon: <Zap size={20} />,
    title: 'AI Budget Reallocation',
    desc: 'Claude analyses every campaign and tells you exactly where to move budget. Drag sliders to see projected revenue update in real time.',
    color: '#00d4a0',
    stat: '+£12,400/mo average revenue lift',
  },
  {
    icon: <BarChart2 size={20} />,
    title: 'Spend Intelligence',
    desc: 'Instantly identify wasted spend and scale winners. Get a full reallocation plan with confidence scores and one-click apply.',
    color: '#6366f1',
    stat: '85% AI confidence on recommendations',
  },
  {
    icon: <FileText size={20} />,
    title: 'White-label Client Reports',
    desc: 'One click generates a branded performance report with AI narrative. Share a link — clients see your logo, not ours.',
    color: '#f97316',
    stat: '4 hours saved per client per month',
  },
  {
    icon: <Bell size={20} />,
    title: 'Real-time Alerts',
    desc: 'Set ROAS, spend and CPA thresholds. Get notified the moment a campaign needs attention — before it costs you.',
    color: '#eab308',
    stat: 'Catch issues in minutes, not days',
  },
  {
    icon: <Target size={20} />,
    title: 'Creative Intelligence',
    desc: 'Discover which ad formats, copy styles and audiences convert best across all your clients. Pattern recognition at scale.',
    color: '#ec4899',
    stat: 'Across 3 platforms simultaneously',
  },
  {
    icon: <Users size={20} />,
    title: 'Multi-client Workspace',
    desc: 'Manage every client account in one dashboard. Invite team members with role-based access. Built for agencies from day one.',
    color: '#06b6d4',
    stat: 'Unlimited clients on Agency plan',
  },
]

const PLANS = [
  {
    name: 'Starter', price: '£99', per: '/month',
    desc: 'For growing agencies managing a handful of clients.',
    features: ['Up to 5 client accounts', '20 AI analysis calls/month', 'Campaign dashboard & insights', 'CSV data import', 'Client reports'],
    cta: 'Get started', href: '/sign-up', featured: false,
  },
  {
    name: 'Pro', price: '£499', per: '/month',
    desc: 'For serious agencies scaling their ad operations.',
    features: ['Up to 25 client accounts', '100 AI analysis calls/month', 'AI Budget Reallocation', 'Ad Variant Generator', 'White-label reports', 'Priority support'],
    cta: 'Get started', href: '/sign-up', featured: true,
  },
  {
    name: 'Agency', price: '£1,999', per: '/month',
    desc: 'For large agencies with high-volume needs.',
    features: ['Unlimited client accounts', 'Unlimited AI calls', 'Custom white-label domain', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
    cta: 'Contact us', href: '/sign-up', featured: false,
  },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Head of Paid Media, Forge Digital', quote: 'Pulse found £3,200 in wasted spend in our first analysis. Paid for itself in 6 days.', stars: 5 },
  { name: 'James T.', role: 'Founder, Apex Growth Agency', quote: 'The white-label reports alone save me 2 days a month. My clients think I built something custom.', stars: 5 },
  { name: 'Priya K.', role: 'Performance Director, Scale Co.', quote: 'The budget simulator is insane. I can show clients exactly what moving £500 will do before touching anything.', stars: 5 },
]

// Fake live campaign data for hero demo
const DEMO_CAMPAIGNS = [
  { name: 'Retargeting — Cart Abandoners', platform: 'Meta', spend: '£800', roas: '7.8x', signal: 'Scale ↑', signalColor: '#00d4a0' },
  { name: 'Google Shopping — All Products', platform: 'Google', spend: '£1,200', roas: '4.5x', signal: 'Scale ↑', signalColor: '#00d4a0' },
  { name: 'Summer Sale — Broad Audience', platform: 'Meta', spend: '£3,200', roas: '1.4x', signal: 'Review ↓', signalColor: '#ff5c5c' },
  { name: 'TikTok — Product Demo Video', platform: 'TikTok', spend: '£2,100', roas: '1.2x', signal: 'Review ↓', signalColor: '#ff5c5c' },
]

const PLATFORM_COLORS: Record<string,string> = { Meta: '#1877f2', Google: '#ea4335', TikTok: '#00d4a0' }

export default function LandingPage() {
  const [statsVisible, setStatsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
    const el = document.getElementById('stats-section')
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % FEATURES.length), 3500)
    return () => clearInterval(t)
  }, [])

  const roas = useCounter(42, 1800, statsVisible)
  const spend = useCounter(24, 2000, statsVisible)
  const clients = useCounter(98, 1600, statsVisible)

  return (
    <div style={{ background: '#0d0f14', color: '#e8eaf0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 60, background: 'rgba(13,15,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#00d4a0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16 }}>Pulse</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, color: '#8b90a0' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }} onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'}) }}>Features</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }} onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}) }}>Pricing</a>
          <Link href="/sign-in" style={{ color: '#8b90a0', textDecoration: 'none' }}>Log in</Link>
        </div>
        <Link href="/sign-up" style={{ background: '#00d4a0', color: '#001a12', padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Get started →
        </Link>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: 'center', maxWidth: 900, margin: '0 auto', padding: '140px 48px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,160,0.1)', border: '1px solid rgba(0,212,160,0.25)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#00d4a0', marginBottom: 32, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, background: '#00d4a0', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 2s infinite' }}/>
          Now available — join agencies already using Pulse
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: 24 }}>
          Your ad spend is<br/>
          <span style={{ color: '#00d4a0' }}>leaking money.</span><br/>
          We stop it.
        </h1>
        <p style={{ fontSize: 20, color: '#8b90a0', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Pulse is the AI-powered campaign dashboard that tells agencies exactly where to move budget, what to cut, and how to grow ROAS — automatically.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ background: '#00d4a0', color: '#001a12', padding: '14px 32px', borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            Get started <ArrowRight size={18}/>
          </Link>
          <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'}) }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8eaf0', padding: '14px 32px', borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
            See how it works
          </a>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: '#8b90a0' }}>
          <Check size={13} style={{ display: 'inline', color: '#00d4a0', marginRight: 6 }}/>Instant access
          <Check size={13} style={{ display: 'inline', color: '#00d4a0', marginRight: 6, marginLeft: 16 }}/>Secure payment
          <Check size={13} style={{ display: 'inline', color: '#00d4a0', marginRight: 6, marginLeft: 16 }}/>Cancel anytime
        </p>
      </section>

      {/* HERO DASHBOARD PREVIEW */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px 100px' }}>
        <div style={{ background: '#13161d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,160,0.1)' }}>
          {/* Window chrome */}
          <div style={{ background: '#0d0f14', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }}/>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }}/>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }}/>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '4px 12px', marginLeft: 8, fontSize: 12, color: '#8b90a0', textAlign: 'center' }}>pulsesolutions.co/spend</div>
          </div>
          {/* AI insight banner */}
          <div style={{ background: 'rgba(0,212,160,0.08)', borderBottom: '1px solid rgba(0,212,160,0.15)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: '#00d4a0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={16} color="#001a12"/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4a0' }}>⚡ Biggest quick win identified</div>
              <div style={{ fontSize: 12, color: '#c8cad4', marginTop: 2 }}>Move £2,400 from Summer Sale (1.4x) → Retargeting (7.8x) · Projected <strong style={{ color: '#00d4a0' }}>+£14,280/mo revenue</strong></div>
            </div>
            <button style={{ marginLeft: 'auto', background: '#00d4a0', color: '#001a12', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Apply →</button>
          </div>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(255,255,255,0.04)', padding: '0' }}>
            {[['Monthly Spend','£9,750',''],['Monthly Revenue','£25,540','#00d4a0'],['Blended ROAS','2.62x','#00d4a0'],['Active Campaigns','6','']].map(([label,val,col],i) => (
              <div key={i} style={{ background: '#13161d', padding: '20px 24px' }}>
                <div style={{ fontSize: 10, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: col || '#e8eaf0' }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Campaign table */}
          <div style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Campaign','Platform','Spend','ROAS','Signal'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 24px', fontSize: 10, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CAMPAIGNS.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 24px', fontWeight: 600, color: '#e8eaf0' }}>{c.name}</td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b90a0' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[c.platform], flexShrink: 0 }}/>
                        {c.platform}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', fontFamily: 'monospace', color: '#c8cad4' }}>{c.spend}</td>
                    <td style={{ padding: '12px 24px', fontFamily: 'monospace', fontWeight: 700, color: parseFloat(c.roas) >= 3 ? '#00d4a0' : '#ff5c5c' }}>{c.roas}</td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ background: c.signalColor + '18', color: c.signalColor, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.signal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats-section" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '60px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40, textAlign: 'center' }}>
          {[
            { value: roas > 0 ? `${roas/10}x` : '0x', label: 'Average ROAS improvement' },
            { value: spend > 0 ? `£${spend/10}M` : '£0M', label: 'Ad spend analysed' },
            { value: clients > 0 ? `${clients}%` : '0%', label: 'Customer satisfaction' },
            { value: '3 min', label: 'Average setup time' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'monospace', color: '#00d4a0', letterSpacing: '-2px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#8b90a0', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4a0', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Features</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Everything your agency needs.<br/>
            <span style={{ color: '#00d4a0' }}>Nothing it doesn't.</span>
          </h2>
          <p style={{ fontSize: 18, color: '#8b90a0', marginTop: 16, maxWidth: 480, margin: '16px auto 0' }}>
            Built specifically for ad agencies managing multiple clients across Meta, Google and TikTok.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} onMouseEnter={() => setActiveFeature(i)}
              style={{ background: activeFeature === i ? 'rgba(255,255,255,0.04)' : '#13161d', border: `1px solid ${activeFeature === i ? f.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '28px 28px 24px', cursor: 'default', transition: 'all 0.2s', boxShadow: activeFeature === i ? `0 0 30px ${f.color}18` : 'none' }}>
              <div style={{ width: 40, height: 40, background: f.color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 16 }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: '#8b90a0', lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
              <div style={{ fontSize: 11, fontWeight: 600, color: f.color, background: f.color + '12', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>{f.stat}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: '#0a0c11', padding: '80px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4a0', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>What agencies say</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px' }}>Agencies are switching from spreadsheets</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#13161d', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array(t.stars).fill(0).map((_,j) => <Star key={j} size={14} fill="#00d4a0" color="#00d4a0"/>)}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#c8cad4', marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#8b90a0', marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '100px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#00d4a0', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 16 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 17, color: '#8b90a0', marginTop: 12 }}>Start free for 14 days. Instant access required.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {PLANS.map((plan, i) => (
            <div key={i} style={{ background: plan.featured ? 'rgba(0,212,160,0.06)' : '#13161d', border: `1px solid ${plan.featured ? '#00d4a0' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '32px', position: 'relative', boxShadow: plan.featured ? '0 0 60px rgba(0,212,160,0.12)' : 'none' }}>
              {plan.featured && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#00d4a0', color: '#001a12', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 100 }}>MOST POPULAR</div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, color: plan.featured ? '#00d4a0' : '#e8eaf0', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 40, fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-2px', color: plan.featured ? '#00d4a0' : '#e8eaf0' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: '#8b90a0' }}>{plan.per}</span>
              </div>
              <p style={{ fontSize: 13, color: '#8b90a0', marginBottom: 24, lineHeight: 1.5 }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <Check size={14} color="#00d4a0" style={{ flexShrink: 0 }}/>
                    <span style={{ color: '#c8cad4' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ display: 'block', textAlign: 'center', background: plan.featured ? '#00d4a0' : 'rgba(255,255,255,0.07)', color: plan.featured ? '#001a12' : '#e8eaf0', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                {plan.cta} {plan.featured ? '→' : ''}
              </Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, fontSize: 13, color: '#8b90a0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} color="#00d4a0"/> Secured by Stripe</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="#00d4a0"/> Cancel anytime</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={14} color="#00d4a0"/> GDPR compliant</span>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 48px 120px', textAlign: 'center', background: 'linear-gradient(180deg, #0d0f14 0%, #0a0c11 100%)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 20 }}>
            Stop guessing.<br/>
            <span style={{ color: '#00d4a0' }}>Start growing.</span>
          </h2>
          <p style={{ fontSize: 18, color: '#8b90a0', marginBottom: 36, lineHeight: 1.6 }}>
            Join agencies already using Pulse to find wasted spend, scale winners, and deliver better results for their clients.
          </p>
          <Link href="/sign-up" style={{ background: '#00d4a0', color: '#001a12', padding: '16px 40px', borderRadius: 12, fontWeight: 800, fontSize: 17, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            Get started today <ArrowRight size={20}/>
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: '#8b90a0' }}>Instant access required · Set up in minutes</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, background: '#00d4a0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14 }}>Pulse</span>
          <span style={{ fontSize: 13, color: '#8b90a0', marginLeft: 8 }}>AI-powered campaign analytics for agencies</span>
        </div>
        <div style={{ fontSize: 12, color: '#8b90a0' }}>© 2026 Pulse. All rights reserved.</div>
      </footer>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
