import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// Industry ROAS benchmarks
const ROAS_BENCHMARKS: Record<string, number> = {
  Meta: 3.2, Google: 2.8, TikTok: 2.1, default: 2.5
}

function calcScore(campaigns: any[], alerts: any[], triggers: any[]) {
  if (!campaigns.length) return { total: 0, breakdown: [], grade: 'N/A', factors: [] }

  const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0)
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0)
  const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // 1. ROAS vs benchmark (30 pts)
  const avgBenchmark = 2.8
  const roasRatio = Math.min(blendedROAS / avgBenchmark, 1.5)
  const roasScore = Math.round(roasRatio * 30)

  // 2. Budget efficiency - % spend on campaigns above 3x ROAS (25 pts)
  const highROASSpend = campaigns.filter(c => c.roas >= 3).reduce((s, c) => s + (c.spend || 0), 0)
  const efficiencyRatio = totalSpend > 0 ? highROASSpend / totalSpend : 0
  const efficiencyScore = Math.round(efficiencyRatio * 25)

  // 3. Platform diversification (10 pts)
  const platforms = [...new Set(campaigns.map(c => c.platform))].length
  const divScore = Math.min(platforms * 4, 10)

  // 4. ROAS trend - improving? (15 pts)
  const sortedByROAS = [...campaigns].sort((a, b) => b.roas - a.roas)
  const topHalfROAS = sortedByROAS.slice(0, Math.ceil(sortedByROAS.length / 2)).reduce((s, c) => s + c.roas, 0) / Math.ceil(sortedByROAS.length / 2)
  const trendScore = topHalfROAS >= avgBenchmark ? 15 : Math.round((topHalfROAS / avgBenchmark) * 15)

  // 5. Alert coverage (10 pts)
  const alertScore = Math.min(alerts.length * 3, 10)

  // 6. No dead campaigns (10 pts)
  const activeCamps = campaigns.filter(c => c.status === 'Active').length
  const activeRatio = campaigns.length > 0 ? activeCamps / campaigns.length : 0
  const activeScore = Math.round(activeRatio * 10)

  const total = Math.min(roasScore + efficiencyScore + divScore + trendScore + alertScore + activeScore, 100)
  const grade = total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : total >= 40 ? 'D' : 'F'

  const breakdown = [
    { label: 'ROAS Performance', score: roasScore, max: 30, desc: blendedROAS > 0 ? `${blendedROAS.toFixed(2)}x blended ROAS` : 'No campaign data yet' },
    { label: 'Budget Efficiency', score: efficiencyScore, max: 25, desc: `${Math.round(efficiencyRatio * 100)}% of spend on 3x+ campaigns` },
    { label: 'Platform Diversity', score: divScore, max: 10, desc: `${platforms} platform${platforms !== 1 ? 's' : ''} active` },
    { label: 'Campaign Quality', score: trendScore, max: 15, desc: `Top campaigns avg ${topHalfROAS.toFixed(1)}x ROAS` },
    { label: 'Alert Coverage', score: alertScore, max: 10, desc: `${alerts.length} alert${alerts.length !== 1 ? 's' : ''} configured` },
    { label: 'Active Campaigns', score: activeScore, max: 10, desc: `${activeCamps} of ${campaigns.length} campaigns active` },
  ]

  // What's pulling score down
  const sorted = [...breakdown].sort((a, b) => (a.score / a.max) - (b.score / b.max))
  const weakest = sorted.slice(0, 2).filter(x => x.score < x.max * 0.7)
  
  const factors = [
    ...weakest.map(w => ({ type: 'down' as const, text: `${w.label} is below target (${w.score}/${w.max})` })),
    ...(blendedROAS >= avgBenchmark ? [{ type: 'up' as const, text: `Strong blended ROAS of ${blendedROAS.toFixed(2)}x` }] : []),
    ...(efficiencyRatio >= 0.6 ? [{ type: 'up' as const, text: `${Math.round(efficiencyRatio * 100)}% of budget on high-ROAS campaigns` }] : []),
  ]

  return { total, grade, breakdown, factors, blendedROAS, efficiencyRatio, platforms }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: campaigns }, { data: alerts }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('user_id', userId),
    supabase.from('alerts').select('*').eq('user_id', userId).eq('enabled', true),
  ])

  const score = calcScore(campaigns || [], alerts || [], [])

  // Save score snapshot
  await supabase.from('pulse_scores').upsert({
    user_id: userId,
    score: score.total,
    grade: score.grade,
    breakdown: score.breakdown,
    week: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,week' })

  // Get historical scores
  const { data: history } = await supabase
    .from('pulse_scores')
    .select('score, grade, week')
    .eq('user_id', userId)
    .order('week', { ascending: false })
    .limit(12)

  return NextResponse.json({ ...score, history: history || [] })
}