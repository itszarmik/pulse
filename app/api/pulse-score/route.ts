import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export type ScoreBreakdown = {
  total: number
  grade: string
  label: string
  change: number | null
  components: {
    name: string
    score: number
    max: number
    insight: string
    status: 'good' | 'warning' | 'poor'
  }[]
  topIssue: string
  topWin: string
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

function getLabel(score: number): string {
  if (score >= 85) return 'Elite'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Average'
  if (score >= 40) return 'Needs Work'
  return 'At Risk'
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [
      { data: campaigns },
      { data: ugcCampaigns },
      { data: alerts },
      { data: alertTriggers },
      { data: connectedAccounts },
    ] = await Promise.all([
      supabase.from('campaigns').select('*').eq('user_id', userId),
      supabase.from('ugc_campaigns').select('*').eq('user_id', userId),
      supabase.from('alerts').select('*').eq('user_id', userId),
      supabase.from('alert_triggers').select('*').eq('user_id', userId).order('triggered_at', { ascending: false }).limit(20),
      supabase.from('connected_accounts').select('*').eq('user_id', userId),
    ])

    const camps = campaigns || []
    const ugc = ugcCampaigns || []
    const alts = alerts || []
    const triggers = alertTriggers || []
    const connections = connectedAccounts || []

    // --- Component 1: ROAS Efficiency (0-25 points) ---
    let roasScore = 0
    let roasInsight = ''
    let roasStatus: 'good' | 'warning' | 'poor' = 'poor'
    if (camps.length === 0) {
      roasScore = 5
      roasInsight = 'Connect ad platforms to start tracking ROAS'
      roasStatus = 'poor'
    } else {
      const totalSpend = camps.reduce((s, c) => s + (c.spend || 0), 0)
      const totalRevenue = camps.reduce((s, c) => s + (c.revenue || 0), 0)
      const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
      const activeCamps = camps.filter(c => c.status === 'Active')
      const underperforming = activeCamps.filter(c => c.roas < 2 && c.spend > 0)
      const ratio = activeCamps.length > 0 ? underperforming.length / activeCamps.length : 0

      if (blendedROAS >= 4) roasScore = 25
      else if (blendedROAS >= 3) roasScore = 20
      else if (blendedROAS >= 2) roasScore = 14
      else if (blendedROAS >= 1) roasScore = 8
      else roasScore = 3

      if (ratio > 0.5) roasScore = Math.max(roasScore - 5, 0)

      roasStatus = roasScore >= 18 ? 'good' : roasScore >= 10 ? 'warning' : 'poor'
      roasInsight = blendedROAS >= 3
        ? `Blended ROAS of ${blendedROAS.toFixed(1)}x — strong portfolio performance`
        : underperforming.length > 0
          ? `${underperforming.length} campaign${underperforming.length > 1 ? 's' : ''} below 2x ROAS dragging your score`
          : `Blended ROAS of ${blendedROAS.toFixed(1)}x — room to improve`
    }

    // --- Component 2: Budget Allocation (0-20 points) ---
    let budgetScore = 0
    let budgetInsight = ''
    let budgetStatus: 'good' | 'warning' | 'poor' = 'poor'
    if (camps.length < 2) {
      budgetScore = 5
      budgetInsight = 'Add more campaigns to analyse budget allocation'
      budgetStatus = 'poor'
    } else {
      const platforms = [...new Set(camps.map(c => c.platform))]
      const totalSpend = camps.reduce((s, c) => s + (c.spend || 0), 0)
      // Check if budget is concentrated on low-ROAS campaigns
      const highROAS = camps.filter(c => c.roas >= 3)
      const highROASSpend = highROAS.reduce((s, c) => s + (c.spend || 0), 0)
      const highROASPct = totalSpend > 0 ? highROASSpend / totalSpend : 0

      if (platforms.length >= 2) budgetScore += 5
      if (highROASPct >= 0.6) budgetScore += 10
      else if (highROASPct >= 0.4) budgetScore += 6
      else budgetScore += 2
      if (camps.length >= 4) budgetScore += 5

      budgetStatus = budgetScore >= 15 ? 'good' : budgetScore >= 9 ? 'warning' : 'poor'
      budgetInsight = highROASPct >= 0.6
        ? `${Math.round(highROASPct * 100)}% of budget on high-ROAS campaigns — great allocation`
        : platforms.length < 2
          ? 'Diversify across platforms to reduce risk'
          : `Only ${Math.round(highROASPct * 100)}% of spend on campaigns above 3x ROAS — rebalance needed`
    }

    // --- Component 3: Alert Coverage (0-15 points) ---
    let alertScore = 0
    let alertInsight = ''
    let alertStatus: 'good' | 'warning' | 'poor' = 'poor'
    const enabledAlerts = alts.filter(a => a.enabled)
    if (enabledAlerts.length === 0) {
      alertScore = 0
      alertInsight = 'No alerts set — you could be missing ROAS drops right now'
      alertStatus = 'poor'
    } else if (enabledAlerts.length >= 3) {
      alertScore = 15
      alertInsight = `${enabledAlerts.length} alerts active — well monitored`
      alertStatus = 'good'
    } else {
      alertScore = 8
      alertInsight = `${enabledAlerts.length} alert${enabledAlerts.length > 1 ? 's' : ''} active — add more coverage`
      alertStatus = 'warning'
    }

    // --- Component 4: UGC & Influencer Tracking (0-20 points) ---
    let ugcScore = 0
    let ugcInsight = ''
    let ugcStatus: 'good' | 'warning' | 'poor' = 'poor'
    const activeUGC = ugc.filter(u => u.status === 'Active')
    const ugcWithRevenue = ugc.filter(u => u.revenue > 0)
    if (ugc.length === 0) {
      ugcScore = 0
      ugcInsight = 'No influencer campaigns tracked — UGC is a growth lever'
      ugcStatus = 'poor'
    } else {
      ugcScore += Math.min(ugc.length * 3, 10)
      if (ugcWithRevenue.length > 0) ugcScore += 10
      ugcStatus = ugcScore >= 15 ? 'good' : ugcScore >= 8 ? 'warning' : 'poor'
      ugcInsight = ugcWithRevenue.length > 0
        ? `${ugcWithRevenue.length} influencer${ugcWithRevenue.length > 1 ? 's' : ''} driving revenue — tracking is working`
        : `${ugc.length} influencer campaign${ugc.length > 1 ? 's' : ''} set up — connect Shopify/WooCommerce to track revenue`
    }

    // --- Component 5: Platform Connectivity (0-20 points) ---
    let connectScore = 0
    let connectInsight = ''
    let connectStatus: 'good' | 'warning' | 'poor' = 'poor'
    const connectedPlatforms = connections.filter(c => c.access_token)
    if (connectedPlatforms.length === 0) {
      connectScore = 0
      connectInsight = 'No ad platforms connected — all data is simulated'
      connectStatus = 'poor'
    } else if (connectedPlatforms.length >= 3) {
      connectScore = 20
      connectInsight = 'All major platforms connected — full data visibility'
      connectStatus = 'good'
    } else {
      connectScore = connectedPlatforms.length * 7
      connectInsight = `${connectedPlatforms.length} platform${connectedPlatforms.length > 1 ? 's' : ''} connected — connect more for a complete picture`
      connectStatus = 'warning'
    }

    const total = roasScore + budgetScore + alertScore + ugcScore + connectScore
    const clamped = Math.min(Math.max(total, 0), 100)

    // Find top issue and top win
    const components = [
      { name: 'ROAS Efficiency', score: roasScore, max: 25, insight: roasInsight, status: roasStatus },
      { name: 'Budget Allocation', score: budgetScore, max: 20, insight: budgetInsight, status: budgetStatus },
      { name: 'Alert Coverage', score: alertScore, max: 15, insight: alertInsight, status: alertStatus },
      { name: 'UGC & Influencer Tracking', score: ugcScore, max: 20, insight: ugcInsight, status: ugcStatus },
      { name: 'Platform Connectivity', score: connectScore, max: 20, insight: connectInsight, status: connectStatus },
    ]

    const worstComponent = [...components].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0]
    const bestComponent = [...components].sort((a, b) => (b.score / b.max) - (a.score / a.max))[0]

    // Save score to history
    await supabase.from('pulse_scores').insert({
      user_id: userId,
      score: clamped,
      breakdown: components,
      calculated_at: new Date().toISOString(),
    }).then(() => {}) // Don't fail if table doesn't exist yet

    const result: ScoreBreakdown = {
      total: clamped,
      grade: getGrade(clamped),
      label: getLabel(clamped),
      change: null,
      components,
      topIssue: worstComponent.insight,
      topWin: bestComponent.insight,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Pulse Score error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}