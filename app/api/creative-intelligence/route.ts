import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { campaigns, product, audience, industry } = await req.json()

    const totalSpend = campaigns.reduce((s: number, c: any) => s + c.spend, 0)
    const totalRevenue = campaigns.reduce((s: number, c: any) => s + c.revenue, 0)

    const prompt = `You are a creative strategist and performance marketing expert. Analyse these ad campaigns and return ONLY valid JSON.

CAMPAIGN DATA:
${JSON.stringify(campaigns, null, 2)}

Product: ${product || 'Not specified'}
Audience: ${audience || 'Not specified'}
Industry: ${industry || 'Not specified'}
Total spend: £${totalSpend.toLocaleString()} | Total revenue: £${totalRevenue.toLocaleString()}

Return ONLY this JSON structure, no other text:
{
  "summary": "2-3 sentence insight on what creative is working and the single biggest opportunity",
  "topFormats": [
    { "format": "format name", "platform": "platform", "avgROAS": <number>, "score": <0-100>, "insight": "why working" }
  ],
  "winningHooks": [
    { "hookType": "hook type e.g. Problem/Solution", "example": "example opening line for their product", "ctr": <estimated % number>, "platforms": ["platform"], "why": "reason it converts" }
  ],
  "audienceInsights": [
    { "segment": "audience segment", "performance": "high|medium|low", "cpa": <number>, "cvr": <number>, "insight": "specific actionable insight" }
  ],
  "creativeRecommendations": [
    { "type": "format|hook|angle|cta|length", "recommendation": "specific recommendation", "reason": "data reason", "expectedImpact": "e.g. +15% CTR", "priority": "high|medium|low" }
  ],
  "trendingNow": [
    { "trend": "trend name", "platform": "platform", "relevance": "why relevant", "action": "how to execute" }
  ]
}

Use actual numbers from the data. Be specific and actionable. For winningHooks, write example hooks specific to the product/industry provided.`

    const message = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err: any) {
    console.error('Creative intelligence error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}