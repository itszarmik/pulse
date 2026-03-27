'use client'
import { useState } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { usePlan } from '@/hooks/usePlan'
import Link from 'next/link'

const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn']
const OBJECTIVES = ['Brand awareness', 'Lead generation', 'Conversions', 'Retargeting']

function UpgradeWall() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--teal-dim)', border: '1px solid rgba(0,212,160,0.2)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--teal)" strokeWidth="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-[22px] font-bold mb-2">Pro Feature</h2>
      <p className="text-[14px] max-w-sm mb-6" style={{ color: 'var(--text2)' }}>
        The Ad Variant Generator is available on the Pro and Agency plans. Upgrade to generate AI-powered ad copy variants.
      </p>
      <div className="flex gap-3">
        <Link href="/billing" className="px-6 py-2.5 rounded-lg text-[13px] font-semibold no-underline"
          style={{ background: 'var(--teal)', color: '#001a12' }}>
          Upgrade to Pro
        </Link>
        <Link href="/" className="px-6 py-2.5 rounded-lg text-[13px] font-medium no-underline border"
          style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default function VariantsPage() {
  const { plan, loading, hasAccess } = usePlan()
  const [platform, setPlatform] = useState('Meta')
  const [objective, setObjective] = useState('Conversions')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('Professional')
  const [generating, setGenerating] = useState(false)
  const [variants, setVariants] = useState([])
  const [copied, setCopied] = useState(null)

  if (loading) return (
    <div className="flex items-center justify-center py-24 gap-3" style={{ color: 'var(--text2)' }}>
      <Spinner /><span>Loading...</span>
    </div>
  )

  if (!hasAccess('pro')) return (
    <>
      <PageHeader title="Ad Variant Generator" subtitle="Generate AI-powered ad copy variants tested across platforms." />
      <UpgradeWall />
    </>
  )

  const handleGenerate = async () => {
    if (!product.trim()) return
    setGenerating(true); setVariants([])
    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, objective, product, audience, tone }),
      })
      const data = await res.json()
      setVariants(data.variants || [])
    } catch (err) { console.error(err) }
    finally { setGenerating(false) }
  }

  const handleCopy = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopied(i); setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Ad Variant Generator" subtitle="Generate AI-powered ad copy variants tested across platforms.">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
          style={{ color: 'var(--teal)', background: 'var(--teal-dim)', borderColor: 'rgba(0,212,160,0.3)' }}>
          Pro Plan
        </span>
      </PageHeader>
      <div className="grid grid-cols-[360px_1fr] gap-6">
        <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="text-[13px] font-semibold mb-4">Campaign brief</div>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={inputStyle}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Objective</label>
              <select value={objective} onChange={e => setObjective(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={inputStyle}>
                {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Product / Service *</label>
              <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. Running shoes"
                className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Target Audience</label>
              <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Men 25-40, fitness enthusiasts"
                className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--teal)]" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-[12px] outline-none" style={inputStyle}>
                {['Professional', 'Casual', 'Urgent', 'Playful', 'Inspirational'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Button variant="primary" onClick={handleGenerate} disabled={generating || !product.trim()}>
              {generating ? 'Generating...' : 'Generate 5 Variants'}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {generating && <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--text2)' }}><Spinner /><span>Claude is writing your variants...</span></div>}
          {!generating && variants.length === 0 && <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text3)' }}><div className="text-[32px] mb-3">✨</div><p className="text-[13px]">Fill in your brief and click Generate</p></div>}
          {variants.map((v, i) => (
            <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>Variant {i+1}</span>
                  {v.score && <span className="text-[11px] px-2 py-0.5 rounded font-semibold"
                    style={{ background: v.score >= 8 ? 'rgba(0,212,160,0.1)' : 'rgba(255,170,68,0.1)', color: v.score >= 8 ? 'var(--teal)' : 'var(--warn)' }}>
                    {v.score}/10
                  </span>}
                </div>
                <button onClick={() => handleCopy(v.body || v.copy || v.text || '', i)}
                  className="text-[11px] px-2.5 py-1 rounded border" style={{ borderColor: 'var(--border2)', color: copied === i ? 'var(--teal)' : 'var(--text2)' }}>
                  {copied === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {v.headline && <div className="text-[13px] font-semibold mb-1">{v.headline}</div>}
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text2)' }}>{v.body || v.copy || v.text}</p>
              {v.cta && <div className="mt-2 text-[11px] font-medium" style={{ color: 'var(--teal)' }}>CTA: {v.cta}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}