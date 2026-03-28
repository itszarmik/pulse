import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { sendAlertEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's alerts
  const { data: alerts } = await supabase
    .from('alerts').select('*').eq('user_id', userId).eq('enabled', true)
  if (!alerts?.length) return NextResponse.json({ triggered: [] })

  // Get user's campaigns
  const { data: campaigns } = await supabase
    .from('campaigns').select('*').eq('user_id', userId)

  const triggered: any[] = []

  for (const alert of alerts) {
    let shouldFire = false
    let message = ''
    let value = 0

    if (alert.type === 'roas_drop' && campaigns) {
      const camp = alert.campaign_id
        ? campaigns.find(c => c.id === alert.campaign_id)
        : null
      const checkCamps = camp ? [camp] : campaigns
      for (const c of checkCamps) {
        if (c.roas < alert.threshold) {
          shouldFire = true
          value = c.roas
          message = `ROAS alert: "${c.name}" is at ${c.roas.toFixed(1)}x (threshold: ${alert.threshold}x)`
          break
        }
      }
    }

    if (alert.type === 'spend_threshold' && campaigns) {
      const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0)
      if (totalSpend >= alert.threshold) {
        shouldFire = true
        value = totalSpend
        message = `Spend alert: Total spend is £${totalSpend.toLocaleString()} (threshold: £${alert.threshold.toLocaleString()})`
      }
    }

    if (alert.type === 'cpa_spike' && campaigns) {
      for (const c of campaigns) {
        const cpa = c.conversions > 0 ? c.spend / c.conversions : 0
        if (cpa > alert.threshold && cpa > 0) {
          shouldFire = true
          value = cpa
          message = `CPA alert: "${c.name}" CPA is £${cpa.toFixed(2)} (threshold: £${alert.threshold})`
          break
        }
      }
    }

    if (shouldFire) {
      // Record trigger
      await supabase.from('alert_triggers').insert({
        alert_id: alert.id, user_id: userId,
        message, value, triggered_at: new Date().toISOString()
      })
      // Send email if enabled
      if (alert.email_notify) {
        const { data: profile } = await supabase.from('user_plans').select('*').eq('user_id', userId).single()
        // We'd get email from Clerk - skip for now, log it
        console.log('Alert triggered:', message)
      }
      triggered.push({ alert_id: alert.id, message, value })
    }
  }

  return NextResponse.json({ triggered })
}