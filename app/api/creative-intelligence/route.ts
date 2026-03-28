import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { campaigns, industry, product, audience } = await req.json()

    const prompt = `You are an expert creative strategist. Analyse these ad campaigns and return ONLY valid JSON.

CAMPAIGNS:
${JSON.stringify(campaigns, null, 2)}

Industry: ${industry || 'E-commerce'}
Product: ${product || 'General products'}
Audience: ${audience || 'General consumers'}

Return ONLY this JSON, no other text:
{
  "topFormats": [
    { "format": "string", "performanceScore": <1-10>, "avgROAS": <number>, "whyItWorks": "string", "recommendation": "string" }
  ],
  "winningHooks": [
    { "hookType": "string", "effectiveness": <1-10>, "example": "string", "audienceMatch": "string" }
  ],
  "topTones": [
    { "tone": "string", "conversionRate": <number>, "bestFor": "string", "sampleCopy": "string" }
  ],
  "audienceInsights": {
    "bestConvertingSegment": "string",
    "peakEngagementTime": "string",
    "platformPreference": "string",
    "contentConsumption": "string"
  },
  "creativeFatigue": {
    "status": "Fresh|Warning|Fatigued",
    "message": "string",
    "recommendation": "string"
  },
  "topRecommendation": "string",
  "nextCreativeTests": ["string", "string", "string"]
}

Be specific with numbers from the actual campaign data.`

    const message = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|\n```|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}