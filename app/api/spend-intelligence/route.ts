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
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const budget = totalBudget || totalSpend

    const prompt = `You are the world's best paid media strategist with 15 years experience managing £100M+ in ad spend.
Analyse these campaigns and return ONLY valid JSON — no markdown, no preamble.

CAMPAIGNS DATA:
${JSON.stringify(campaigns, null, 2)}

PORTFOLIO SUMMARY:
- Total monthly spend: ${symbol}${totalSpend.toLocaleString()}
- Total monthly revenue: ${symbol}${totalRevenue.toLocaleString()}
- Blended ROAS: ${blendedROAS.toFixed(2)}x
- Available budget to reallocate: ${symbol}${budget.toLocaleString()}

ANALYSIS RULES:
- ROAS < 1.5x = bleeding money, immediate action needed
- ROAS 1.5–2.5x = underperforming, optimise or cut
- ROAS 2.5–4x = healthy, maintain
- ROAS > 4x = star campaign, scale aggressively
- Always identify the single biggest quick win first
- Budget reallocation: move FROM low ROAS TO high ROAS
- Be brutally specific with numbers — reference actual spend/ROAS figures
- Projected impact must be calculated: (reallocated_spend × target_campaign_roas) - reallocated_spend

Return ONLY this exact JSON:
{
  "summary": "2-3 sentence executive summary with specific numbers",
  "totalWastedSpend": <number>,
  "totalOpportunityGain": <number>,
  "projectedROAS": <number - what blended ROAS would be after all recommendations>,
  "projectedRevenue": <number - projected monthly revenue after all recommendations>,
  "confidence": <number 0-100 - how confident you are in these recommendations>,
  "platformInsights": [
    {
      "platform": "platform name",
      "verdict": "one specific sentence with numbers",
      "score": <0-100>,
      "spend": <current spend number>,
      "roas": <current roas number>,
      "recommendation": "scale|maintain|cut|diversify"
    }
  ],
  "budgetPlan": [
    {
      "from": "exact campaign name",
      "fromPlatform": "platform",
      "fromCurrentSpend": <number>,
      "fromCurrentROAS": <number>,
      "to": "exact campaign name",
      "toPlatform": "platform",
      "toCurrentSpend": <number>,
      "toCurrentROAS": <number>,
      "amount": <number to move>,
      "projectedRevenueLift": <number>,
      "reason": "specific data-driven reason"
    }
  ],
  "recommendations": [
    {
      "type": "scale|cut|pause|reallocate|watch|optimise",
      "campaign": "exact campaign name",
      "platform": "platform",
      "currentSpend": <number>,
      "currentROAS": <number>,
      "action": "specific action e.g. Increase budget by £800/month",
      "reason": "data-driven reason with actual numbers",
      "impact": "e.g. +${symbol}2,400/mo revenue",
      "impactValue": <number - the £ value of the impact>,
      "confidence": <0-100>,
      "priority": "high|medium|low",
      "effort": "immediate|this-week|this-month"
    }
  ],
  "quickWin": {
    "title": "single biggest quick win title",
    "description": "specific description with numbers",
    "action": "exact action to take",
    "impact": "projected impact",
    "impactValue": <number>
  }
}`

    const message = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Spend intelligence error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
