import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { adCopy, imageConceptDescription, product, campaignGoal } = await req.json()
    if (!adCopy && !product) {
      return NextResponse.json({ error: 'Please provide ad copy or a product description.' }, { status: 400 })
    }
    const prompt = `You are an expert direct-response ad copywriter specialising in high-ROAS paid social campaigns.

Generate exactly 5 distinct ad copy variants for the following brief:
Product/offer: "${product || 'not specified'}"
Current ad copy: "${adCopy || 'not provided'}"
Image concept: "${imageConceptDescription || 'not specified'}"
Campaign goal: "${campaignGoal || 'conversions'}"

Each variant should use a completely different angle:
1. Benefit-led (focus on the #1 outcome)
2. Pain-point (address the core problem)
3. Social proof (credibility & numbers)
4. Curiosity/pattern interrupt (unexpected hook)
5. Direct offer (clear value proposition)

Return ONLY a valid JSON array of 5 objects. Each object must have:
- headline: string (max 8 words, punchy)
- body: string (max 30 words, persuasive)
- cta: string (max 4 words, action-oriented)
- imageDirection: string (1 sentence describing the ideal image/video)
- engagementScore: number (1-100)
- clarityScore: number (1-100)
- hookScore: number (1-100)
- angle: string (one of: benefit, pain-point, social-proof, curiosity, direct-offer)

No markdown, no preamble — ONLY the JSON array.`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.filter(b => b.type === 'text').map(b => (b as any).text).join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const variants = JSON.parse(clean)
    return NextResponse.json({ variants })
  } catch (err: any) {
    console.error('Variant generation error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate variants' }, { status: 500 })
  }
}
