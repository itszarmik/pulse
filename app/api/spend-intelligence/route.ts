import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { campaigns, totalBudget, currency = 'GBP' } = await req.json()
    if (!campaigns?.length) return NextResponse.json({ error: 'No campaigns' }, { status: 400 })

    const symbol = currency === 'GBP' ? '£' : '$'
    const totalSpend = campaigns.reduce((s: number, c: any) => s + c.spend, 0)
    const totalRevenue = campaigns.reduce((s: number, c: any) => s + c.revenue, 0)

    const prompt = `You are an expert paid media strategist. Analyse these ad campaigns and return ONLY valid JSON.

CAMPAIGNS:
${JSON.stringify(campaigns, null, 2)}

Total monthly spend: ${symbol}${totalSpend.toLocaleString()}
Total revenue: ${symbol}${totalRevenue.toLocaleString()}
Blended ROAS: ${totalSpend > 0 ? (totalRevenue/totalSpend).toFixed(2) : 0}x
${totalBudget ? `Available budget: ${symbol}${totalBudget.toLocaleString()}` : ''}

Return ONLY this JSON structure, no other text:
{
  "summary": "2-3 sentence executive summary of the portfolio performance and biggest opportunities",
  "totalWastedSpend": <number - estimated monthly spend being wasted on underperforming campaigns>,
  "totalOpportunityGain": <number - estimated additional monthly revenue if recommendations followed>,
  "platformInsights": [
    { "platform": "Meta", "verdict": "one sentence", "score": <0-100 efficiency score> }
  ],
  "budgetPlan": [
    { "from": "campaign name", "to": "campaign name", "amount": <number>, "reason": "brief reason" }
  ],
  "recommendations": [
    {
      "type": "scale|cut|pause|reallocate|watch",
      "campaign": "campaign name",
      "platform": "platform name",
      "action": "specific action e.g. Increase budget by 40%",
      "reason": "data-driven reason referencing actual numbers",
      "impact": "estimated impact e.g. +${symbol}2,400/mo revenue",
      "priority": "high|medium|low"
    }
  ]
}

Rules:
- Be specific with numbers from the data
- Flag any campaign with ROAS below 2x as underperforming
- Identify campaigns with ROAS above 4x as scale candidates
- Budget reallocation should move money FROM low ROAS TO high ROAS campaigns
- Sort recommendations by priority (high first)`

    const message = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|\n```|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Spend intelligence error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}