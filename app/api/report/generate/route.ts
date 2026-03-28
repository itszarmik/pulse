import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { clientId, clientName, dateRange = '30 days' } = await req.json()

    // Get campaigns for this client (or all if no clientId)
    const query = supabase.from('campaigns').select('*').eq('user_id', userId)
    const { data: campaigns } = await query

    // Get client account info
    const { data: clientAccount } = clientId
      ? await supabase.from('client_accounts').select('*').eq('id', clientId).single()
      : { data: null }

    const camps = campaigns || []
    const totalSpend = camps.reduce((s, c) => s + (c.spend || 0), 0)
    const totalRevenue = camps.reduce((s, c) => s + (c.revenue || 0), 0)
    const totalClicks = camps.reduce((s, c) => s + (c.clicks || 0), 0)
    const totalConversions = camps.reduce((s, c) => s + (c.conversions || 0), 0)
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const avgCTR = camps.length > 0 ? camps.reduce((s, c) => s + (c.ctr || 0), 0) / camps.length : 0

    // Generate AI summary
    const aiRes = await client.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Write a professional 3-paragraph client-facing ad performance summary for the past ${dateRange}.
Client: ${clientName || clientAccount?.name || 'Client'}
Total spend: £${totalSpend.toLocaleString()}
Total revenue: £${totalRevenue.toLocaleString()}
ROAS: ${blendedROAS.toFixed(2)}x
Clicks: ${totalClicks.toLocaleString()}
Conversions: ${totalConversions}
Campaigns: ${JSON.stringify(camps.map(c => ({ name: c.name, platform: c.platform, roas: c.roas, spend: c.spend })))}

Write in a professional but accessible tone. No markdown. Highlight wins, explain any underperformance, and end with 2-3 specific recommendations for next month. This will be shown directly to the client.`
      }]
    })

    const aiSummary = aiRes.content[0].type === 'text' ? aiRes.content[0].text : ''

    // Create shareable report token
    const token = crypto.randomBytes(16).toString('hex')
    const reportData = {
      user_id: userId,
      client_id: clientId || null,
      client_name: clientName || clientAccount?.name || 'Campaign Report',
      token,
      date_range: dateRange,
      data: {
        totalSpend, totalRevenue, totalClicks, totalConversions,
        blendedROAS: parseFloat(blendedROAS.toFixed(2)),
        avgCTR: parseFloat(avgCTR.toFixed(2)),
        campaigns: camps,
        aiSummary,
        generatedAt: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    }

    await supabase.from('client_reports').insert(reportData)

    return NextResponse.json({ token, reportUrl: `/report/${token}` })
  } catch (err: any) {
    console.error('Report error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}