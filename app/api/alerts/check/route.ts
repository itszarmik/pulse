import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { sendAlertEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get user's alert rules
    const { data: rules } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)

    if (!rules?.length) return NextResponse.json({ triggered: [] })

    // Get latest campaign data
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Active')

    const triggered: any[] = []

    for (const rule of rules) {
      let shouldFire = false
      let message = ''
      let value = 0

      const campaign = rule.campaign_id
        ? campaigns?.find(c => c.id === rule.campaign_id)
        : null

      const targetCampaigns = campaign ? [campaign] : (campaigns || [])

      for (const c of targetCampaigns) {
        if (rule.type === 'roas_drop' && c.roas <= rule.threshold) {
          shouldFire = true
          value = c.roas
          message = `ROAS Alert: "${c.name}" ROAS dropped to ${c.roas.toFixed(1)}x (threshold: ${rule.threshold}x)`
          break
        }
        if (rule.type === 'spend_threshold' && c.spend >= rule.threshold) {
          shouldFire = true
          value = c.spend
          message = `Spend Alert: "${c.name}" spend reached £${c.spend.toLocaleString()} (threshold: £${rule.threshold.toLocaleString()})`
          break
        }
        if (rule.type === 'roas_spike' && c.roas >= rule.threshold) {
          shouldFire = true
          value = c.roas
          message = `🚀 Top performer: "${c.name}" hit ${c.roas.toFixed(1)}x ROAS — consider scaling budget!`
          break
        }
        if (rule.type === 'cpa_high' && c.conversions > 0 && (c.spend / c.conversions) >= rule.threshold) {
          shouldFire = true
          value = c.spend / c.conversions
          message = `CPA Alert: "${c.name}" CPA reached £${value.toFixed(2)} (threshold: £${rule.threshold})`
          break
        }
      }

      if (shouldFire) {
        // Save triggered alert
        const { data: alert } = await supabase.from('alerts').insert({
          user_id: userId,
          rule_id: rule.id,
          type: rule.type,
          message,
          value,
          read: false,
          triggered_at: new Date().toISOString(),
        }).select().single()

        if (alert) triggered.push(alert)

        // Send email if enabled
        if (rule.notify_email) {
          const { data: userData } = await supabase.from('user_plans').select('*').eq('user_id', userId).single()
          // Get email from Clerk via the request
          await sendAlertEmail(rule.notify_email, message).catch(console.error)
        }
      }
    }

    return NextResponse.json({ triggered })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}