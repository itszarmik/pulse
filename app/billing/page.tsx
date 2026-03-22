'use client'
import { PageHeader, Button, Card } from '@/components/ui'
import { Check, X } from 'lucide-react'

const PLANS = [
  { id:'starter', name:'Starter', badge:'Entry Level', badgeColor:'var(--text2)', price:99, desc:'Perfect for solo DTC brand owners getting started with AI ad analytics.', featured:false, current:false, cta:'Select Starter',
    features:[{l:'Up to 5 connected campaigns',on:true},{l:'20 AI analysis calls/month',on:true},{l:'Meta & Google Ads integration',on:true},{l:'CSV data import',on:true},{l:'Multi-client management',on:false},{l:'Ad variant generator',on:false},{l:'AI optimisation suggestions',on:false}] },
  { id:'pro', name:'Pro', badge:'Most Popular', badgeColor:'var(--teal)', price:499, desc:'Built for marketing managers scaling spend across multiple platforms.', featured:true, current:true, cta:'Current Plan',
    features:[{l:'Up to 25 connected campaigns',on:true},{l:'100 AI analysis calls/month',on:true},{l:'Meta, Google & TikTok',on:true},{l:'CSV data import',on:true},{l:'Ad variant generator',on:true},{l:'AI optimisation suggestions',on:true},{l:'Multi-client management',on:false}] },
  { id:'agency', name:'Agency', badge:'Enterprise', badgeColor:'var(--warn)', price:1999, desc:'For digital agencies managing multiple clients at scale.', featured:false, current:false, cta:'Select Agency',
    features:[{l:'Unlimited campaigns',on:true},{l:'Unlimited AI calls',on:true},{l:'All platform integrations',on:true},{l:'Multi-client management',on:true},{l:'White-label exports',on:true},{l:'Priority support & onboarding',on:true},{l:'Custom integrations & API',on:true}] },
]

const USAGE = [{ label:'Campaigns', used:4, total:25 },{ label:'AI Calls', used:14, total:100 },{ label:'Data syncs', used:22, total:50 }]

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Subscription & Billing" subtitle="Manage your plan, track usage, and review payment history.">
        <Button>Manage Settings</Button>
      </PageHeader>
      <Card className="mb-7">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[11px] mb-1" style={{ color:'var(--text2)' }}>Current Plan</div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                style={{ background:'rgba(0,212,160,0.1)', color:'var(--teal)' }}>● Active</span>
              <span className="font-mono text-[22px] font-bold">Pro</span>
              <span className="text-[13px]" style={{ color:'var(--text2)' }}>$499 / month</span>
            </div>
            <div className="text-[12px] mt-1" style={{ color:'var(--text2)' }}>Next billing date: April 22, 2026</div>
          </div>
          <Button size="sm">Download Invoice</Button>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {USAGE.map(u => (
            <div key={u.label}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span style={{ color:'var(--text2)' }}>{u.label}</span>
                <span><span className="font-medium">{u.used}</span><span style={{ color:'var(--text2)' }}> of {u.total}</span></span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background:'var(--bg4)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${(u.used/u.total)*100}%`, background:u.used/u.total>0.8?'var(--warn)':'var(--teal)' }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="text-[15px] font-semibold mb-1.5">Choose Your Plan</div>
      <div className="text-[13px] mb-5" style={{ color:'var(--text2)' }}>Scale your AI-powered ad intelligence as your ad spend grows.</div>
      <div className="grid grid-cols-3 gap-3.5 mb-7">
        {PLANS.map(plan => (
          <div key={plan.id} className="rounded-xl border p-5 relative"
            style={{ background:'var(--bg2)', borderColor:plan.featured?'var(--teal)':'var(--border)' }}>
            {plan.featured && <div className="absolute -top-px right-4 text-[10px] font-bold px-2.5 py-1 rounded-b-md"
              style={{ background:'var(--teal)', color:'#001a12' }}>Most Popular</div>}
            <div className="flex items-start justify-between mb-1">
              <div className="text-[16px] font-bold" style={{ color:plan.featured?'var(--teal)':'var(--text)' }}>{plan.name}</div>
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                style={{ background:`${plan.badgeColor}1a`, color:plan.badgeColor }}>{plan.badge}</span>
            </div>
            <div className="font-mono text-[28px] font-bold mt-2">${plan.price.toLocaleString()}</div>
            <div className="text-[11px] mb-2" style={{ color:'var(--text2)' }}>/month</div>
            <div className="text-[12px] mb-4 leading-relaxed" style={{ color:'var(--text2)' }}>{plan.desc}</div>
            <ul className="mb-5 space-y-2">
              {plan.features.map((f,i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color:f.on?'var(--text)':'var(--text3)' }}>
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background:f.on?'var(--teal-dim)':'var(--bg4)' }}>
                    {f.on ? <Check size={8} color="var(--teal)" /> : <X size={8} color="var(--text3)" />}
                  </span>
                  {f.l}
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-lg border text-[13px] font-medium transition-all"
              style={plan.current ? { background:'var(--teal-dim)', borderColor:'var(--teal-dim2)', color:'var(--teal)' }
                : plan.featured ? { background:'var(--teal)', borderColor:'var(--teal)', color:'#001a12', fontWeight:600 }
                : { background:'var(--bg3)', borderColor:'var(--border2)', color:'var(--text)' }}
              disabled={plan.current}>{plan.cta}</button>
          </div>
        ))}
      </div>
      <div className="text-[15px] font-semibold mb-3.5">Payment History</div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor:'var(--border)', background:'var(--bg2)' }}>
        <table className="w-full border-collapse text-[13px]">
          <thead><tr style={{ borderBottom:'1px solid var(--border)' }}>
            {['Date','Description','Amount','Status',''].map(col => (
              <th key={col} className="text-left px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color:'var(--text2)' }}>{col}</th>
            ))}
          </tr></thead>
          <tbody>
            {[{date:'Mar 22, 2026',desc:'Pro Plan — Monthly',amount:'$499.00'},{date:'Feb 22, 2026',desc:'Pro Plan — Monthly',amount:'$499.00'},{date:'Jan 22, 2026',desc:'Pro Plan — Monthly',amount:'$499.00'}].map((row,i) => (
              <tr key={i} className="border-b" style={{ borderColor:'var(--border)' }}>
                <td className="px-4 py-3" style={{ color:'var(--text2)' }}>{row.date}</td>
                <td className="px-4 py-3">{row.desc}</td>
                <td className="px-4 py-3 font-mono">{row.amount}</td>
                <td className="px-4 py-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded"
                  style={{ background:'rgba(0,212,160,0.1)', color:'var(--teal)' }}>Paid</span></td>
                <td className="px-4 py-3"><Button size="sm">Download</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
