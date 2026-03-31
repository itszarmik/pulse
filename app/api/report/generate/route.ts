import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'

const client = new Anthropic()

const MOCK_CAMPAIGNS = [
  { id:'1', name:'Summer Sale — Broad Audience', platform:'Meta', spend:3200, revenue:4480, roas:1.4, clicks:8200, impressions:142000, conversions:89, ctr:5.77, cpc:0.39, status:'Active' },
  { id:'2', name:'Retargeting — Cart Abandoners', platform:'Meta', spend:800, revenue:6240, roas:7.8, clicks:1240, impressions:18600, conversions:156, ctr:6.67, cpc:0.65, status:'Active' },
  { id:'3', name:'Brand Awareness Q3', platform:'Google', spend:1500, revenue:1200, roas:0.8, clicks:3100, impressions:89000, conversions:24, ctr:3.48, cpc:0.48, status:'Active' },
  { id:'4', name:'Google Shopping — All Products', platform:'Google', spend:1200, revenue:5400, roas:4.5, clicks:2800, impressions:41000, conversions:108, ctr:6.83, cpc:0.43, status:'Active' },
  { id:'5', name:'TikTok — Product Demo Video', platform:'TikTok', spend:2100, revenue:2520, roas:1.2, clicks:6700, impressions:198000, conversions:63, ctr:3.38, cpc:0.31, status:'Active' },
  { id:'6', name:'Lookalike — Past Purchasers', platform:'Meta', spend:950, revenue:5700, roas:6.0, clicks:1800, impressions:28000, conversions:142, ctr:6.43, cpc:0.53, status:'Active' },
]

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { clientId, clientName, dateRange = 'Last 30 days' } = await req.json()

    // Get real campaigns from Supabase, fall back to mock if none exist
    const { data: realCampaigns } = await supabase
      .from('campaigns').select('*').eq('user_id', userId)
    const camps = (realCampaigns && realCampaigns.length > 0) ? realCampaigns : MOCK_CAMPAIGNS
    const usingMock = !realCampaigns || realCampaigns.length === 0

    // Get client account info
    const { data: clientAccount } = clientId
      ? await supabase.from('client_accounts').select('*').eq('id', clientId).single()
      : { data: null }

    const totalSpend = camps.reduce((s: number, c: any) => s + (c.spend || 0), 0)
    const totalRevenue = camps.reduce((s: number, c: any) => s + (c.revenue || 0), 0)
    const totalClicks = camps.reduce((s: number, c: any) => s + (c.clicks || 0), 0)
    const totalConversions = camps.reduce((s: number, c: any) => s + (c.conversions || 0), 0)
    const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
    const avgCTR = camps.length > 0
      ? camps.reduce((s: number, c: any) => s + (c.ctr || 0), 0) / camps.length : 0

    const resolvedClientName = clientName || clientAccount?.name || 'Campaign Report'

    // Top & bottom performers
    const sorted = [...camps].sort((a: any, b: any) => b.roas - a.roas)
    const topCampaign = sorted[0]
    const bottomCampaign = sorted[sorted.length - 1]

    // Generate AI summary
    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: `Write a professional 3-paragraph client-facing ad performance summary for ${resolvedClientName} covering ${dateRange}.

Key metrics:
- Total ad spend: £${totalSpend.toLocaleString()}
- Total revenue generated: £${totalRevenue.toLocaleString()}
- Return on ad spend (ROAS): ${blendedROAS.toFixed(2)}x
- Total clicks: ${totalClicks.toLocaleString()}
- Total conversions: ${totalConversions.toLocaleString()}
- Top performer: ${topCampaign?.name} (${topCampaign?.roas?.toFixed(1)}x ROAS)
- Needs attention: ${bottomCampaign?.name} (${bottomCampaign?.roas?.toFixed(1)}x ROAS)

Rules: Professional but readable tone. No markdown, no bullet points — flowing paragraphs only. Paragraph 1: celebrate wins with specific numbers. Paragraph 2: honest assessment of what needs work. Paragraph 3: exactly 2 concrete recommendations for next month. Write as if you're the agency sending this to their client.` }]
    })
    const aiSummary = aiRes.content[0].type === 'text' ? aiRes.content[0].text : ''

    // Build report token + save to Supabase
    const reportToken = crypto.randomBytes(16).toString('hex')
    const reportData = {
      user_id: userId,
      client_id: clientId || null,
      client_name: resolvedClientName,
      token: reportToken,
      date_range: dateRange,
      data: {
        totalSpend,
        totalRevenue,
        totalClicks,
        totalConversions,
        blendedROAS: parseFloat(blendedROAS.toFixed(2)),
        avgCTR: parseFloat(avgCTR.toFixed(2)),
        campaigns: camps,
        aiSummary,
        generatedAt: new Date().toISOString(),
        usingMockData: usingMock,
      },
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('client_reports').insert(reportData)
    if (insertError) throw new Error(insertError.message)

    return NextResponse.json({ token: reportToken, reportUrl: `/report/${reportToken}` })
  } catch (err: any) {
    console.error('Report generate error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
