import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { campaigns, dateRange } = await req.json()
    const prompt = `You are a senior paid media analyst with deep expertise in ROAS optimisation across Meta, Google, and TikTok Ads.

Analyse the following campaign data and return 3 actionable insights:

Date range: ${dateRange || 'Last 30 days'}
Campaigns:
${JSON.stringify(campaigns, null, 2)}

Return ONLY a valid JSON array of exactly 3 insight objects. Each must have:
- type: "success" | "warning" | "info"
- title: string (emoji + short title, max 6 words)
- body: string (2-3 sentences, specific and actionable with numbers where possible)
- action: string (one concrete next step, max 10 words)

Focus on: ROAS performance, budget allocation, creative fatigue, platform efficiency, and quick wins.
No markdown, no preamble — ONLY the JSON array.`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = message.content.filter(b => b.type === 'text').map(b => (b as any).text).join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const insights = JSON.parse(clean)
    return NextResponse.json({ insights })
  } catch (err: any) {
    console.error('Analysis error:', err)
    return NextResponse.json({ error: err.message || 'Failed to analyse campaigns' }, { status: 500 })
  }
}
