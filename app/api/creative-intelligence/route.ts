import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { campaigns, product, audience, industry } = await req.json()

    const campSummary = campaigns.map((c: any) => ({
      name: c.name, platform: c.platform,
      roas: c.roas, ctr: c.ctr, cpc: c.cpc,
      spend: c.spend, revenue: c.revenue,
      conversions: c.conversions, clicks: c.clicks,
      cvr: c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : 0,
    }))

    const prompt = `You are an expert creative strategist. Analyse these ad campaigns and return ONLY valid JSON.

CAMPAIGNS: ${JSON.stringify(campSummary)}
Product: ${product || 'ecommerce product'}
Audience: ${audience || 'general consumers'}
Industry: ${industry || 'ecommerce'}

Return ONLY this JSON:
{
  "summary": "2-3 sentences on what creative patterns are working and why",
  "topFormats": [{"format":"string","score":0,"avgROAS":0,"avgCTR":0,"verdict":"string","platforms":["string"]}],
  "winningHooks": [{"type":"string","description":"string","example":"string","effectiveness":"high|medium|low","bestFor":"string"}],
  "messagingInsights": [{"insight":"string","evidence":"string","recommendation":"string"}],
  "audienceInsights": [{"segment":"string","behaviour":"string","ctr":0,"recommendation":"string"}],
  "avoidList": [{"pattern":"string","reason":"string","evidence":"string"}],
  "nextCreativeIdeas": [{"concept":"string","description":"string","platform":"string","expectedROAS":0,"reasoning":"string"}]
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}