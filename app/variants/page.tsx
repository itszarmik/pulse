'use client'
import { useState } from 'react'
import { PageHeader, Button, Card, Spinner } from '@/components/ui'
import type { AdVariant } from '@/types'

const ANGLE_COLORS: Record<string, string> = {
  'benefit': 'var(--teal)', 'pain-point': 'var(--danger)',
  'social-proof': 'var(--purple)', 'curiosity': 'var(--warn)', 'direct-offer': '#60a5fa',
}

function ScoreBar({ label, value, color = 'var(--teal)' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[10px] w-[68px] shrink-0" style={{ color:'var(--text3)' }}>{label}</span>
      <div className="flex-1 h-1 rounded-full" style={{ background:'var(--bg4)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${value}%`, background:color }} />
      </div>
      <span className="text-[10px] w-7 text-right" style={{ color:'var(--text2)' }}>{value}%</span>
    </div>
  )
}

function VariantCard({ variant, index }: { variant: AdVariant & { angle?: string }; index: number }) {
  const [copied, setCopied] = useState(false)
  const accentColor = ANGLE_COLORS[variant.angle || ''] || 'var(--teal)'
  const handleCopy = () => {
    navigator.clipboard.writeText(`Headline: ${variant.headline}\n\nBody: ${variant.body}\n\nCTA: ${variant.cta}`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="rounded-xl border p-4 transition-colors hover:border-[var(--border2)]"
      style={{ background:'var(--bg3)', borderColor:'var(--border)' }}>
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.5px]" style={{ color:accentColor }}>Variant {index+1}</span>
          {variant.angle && <span className="text-[10px] px-1.5 py-[2px] rounded font-medium"
            style={{ background:`${accentColor}1a`, color:accentColor }}>{variant.angle}</span>}
        </div>
        <button onClick={handleCopy} className="text-[11px] transition-colors"
          style={{ color:copied?'var(--teal)':'var(--text3)' }}>{copied?'✓ Copied':'Copy'}</button>
      </div>
      <div className="text-[14px] font-semibold mb-1.5">{variant.headline}</div>
      <div className="text-[12px] leading-relaxed mb-2.5" style={{ color:'var(--text2)' }}>{variant.body}</div>
      <span className="inline-block text-[11px] font-semibold px-2 py-1 rounded"
        style={{ background:`${accentColor}1a`, color:accentColor }}>{variant.cta}</span>
      {variant.imageDirection && (
        <div className="mt-3 pt-3 border-t text-[11px]" style={{ borderColor:'var(--border)', color:'var(--text2)' }}>
          <span style={{ color:'var(--text3)' }}>📸 Image: </span>{variant.imageDirection}
        </div>
      )}
      <div className="mt-3 pt-3 border-t" style={{ borderColor:'var(--border)' }}>
        <ScoreBar label="Engagement" value={variant.engagementScore} />
        <ScoreBar label="Clarity" value={variant.clarityScore} color="var(--purple)" />
        <ScoreBar label="Hook" value={variant.hookScore} color="var(--warn)" />
      </div>
    </div>
  )
}

export default function VariantsPage() {
  const [adCopy, setAdCopy] = useState('')
  const [imageConcept, setImageConcept] = useState('')
  const [product, setProduct] = useState('')
  const [campaignGoal, setCampaignGoal] = useState('conversions')
  const [loading, setLoading] = useState(false)
  const [variants, setVariants] = useState<(AdVariant & { angle?: string })[]>([])
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true); setError(''); setVariants([])
    try {
      const res = await fetch('/api/variants', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ adCopy, imageConceptDescription:imageConcept, product, campaignGoal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setVariants(data.variants)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--teal)] resize-none"
  const inputStyle = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  return (
    <>
      <PageHeader title="Ad Variant Generator" subtitle="Generate AI-powered ad copy variants with headlines, body text, CTAs, and image direction suggestions.">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-[12px] font-semibold"
          style={{ color:'var(--teal)', background:'var(--teal-dim)', borderColor:'var(--teal-dim2)' }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="currentColor" />
          </svg>
          AI-Powered
        </span>
      </PageHeader>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-4 text-[13px] font-semibold">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M3 4h5M3 10h6" stroke="var(--teal)" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Input Your Ad
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Current Ad Copy</label>
            <textarea rows={5} value={adCopy} onChange={e => setAdCopy(e.target.value)}
              placeholder="Paste your existing ad copy here — headline, body, and CTA..." className={inputClass} style={inputStyle} />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Product / Offer</label>
            <input type="text" value={product} onChange={e => setProduct(e.target.value)}
              placeholder="e.g. SaaS tool for marketers, 14-day free trial" className={inputClass} style={inputStyle} />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Image Concept Description</label>
            <textarea rows={3} value={imageConcept} onChange={e => setImageConcept(e.target.value)}
              placeholder="Describe the visual concept..." className={inputClass} style={inputStyle} />
          </div>
          <div className="mb-5">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Campaign Goal</label>
            <select value={campaignGoal} onChange={e => setCampaignGoal(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={inputStyle}>
              <option value="conversions">Conversions / Sales</option>
              <option value="leads">Lead Generation</option>
              <option value="traffic">Traffic / Clicks</option>
              <option value="awareness">Brand Awareness</option>
              <option value="retargeting">Retargeting</option>
            </select>
          </div>
          <Button variant="primary" className="w-full justify-center py-3" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Spinner size={14} /> Generating variants...</> : <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="currentColor" />
              </svg>
              Generate 5 Variants
            </>}
          </Button>
        </Card>
        <div>
          {loading && <div className="flex items-center gap-3 p-5 text-[13px]" style={{ color:'var(--text2)' }}>
            <Spinner /><span>Generating AI-powered variants…</span>
          </div>}
          {error && <div className="rounded-xl border p-4 text-[13px]"
            style={{ borderColor:'var(--danger)', background:'rgba(255,92,92,0.06)', color:'var(--danger)' }}>{error}</div>}
          {!loading && variants.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center" style={{ color:'var(--text3)' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="mb-3 opacity-30">
                <rect x="8" y="8" width="28" height="28" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 18h16M14 22h10M14 26h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-[13px]">Fill in the form and click Generate<br />to create AI-powered ad variants</p>
            </div>
          )}
          {variants.length > 0 && (
            <div className="flex flex-col gap-3">
              {variants.map((v, i) => <VariantCard key={i} variant={v} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
