import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, prompt, campaigns, data, totalSpend, totalRevenue, overallROAS, byPlatform } = body

    let systemPrompt = 'You are an expert digital marketing strategist and media buyer with deep expertise in Meta, Google and TikTok advertising.'
    let userMessage = ''

    if (type === 'spend_intelligence') {
      systemPrompt += ' You give highly specific, data-driven budget reallocation recommendations. Always reference exact numbers and percentages.'
      userMessage = `${prompt}

Campaign data:
${JSON.stringify(campaigns, null, 2)}

Account summary:
- Total monthly spend: £${totalSpend}
- Total revenue: £${totalRevenue}
- Overall ROAS: ${overallROAS}x
- By platform: ${JSON.stringify(byPlatform, null, 2)}`

    } else if (type === 'ugc') {
      systemPrompt += ' You specialise in influencer marketing ROI analysis and UGC campaign optimisation.'
      userMessage = `${prompt}

Influencer campaign data:
${JSON.stringify(data, null, 2)}`

    } else {
      // Standard campaign analysis
      userMessage = prompt || `Analyse these campaigns and provide actionable insights:
${JSON.stringify(data || campaigns, null, 2)}`
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const analysis = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ analysis })

  } catch (err: any) {
    console.error('Analyse error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}