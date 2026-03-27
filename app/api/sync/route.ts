import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

async function syncMeta(accessToken: string, userId: string) {
  // Get ad accounts
  const accsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`)
  const accsData = await accsRes.json()
  if (!accsData.data?.length) return []

  const campaigns = []
  for (const account of accsData.data.slice(0, 5)) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const until = new Date().toISOString().split('T')[0]
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${account.id}/campaigns?fields=id,name,status,insights{spend,clicks,impressions,actions,cpm,cpc,ctr}&time_range={\"since\":\"${since}\",\"until\":\"${until}\"}&access_token=${accessToken}`
    )
    const insightsData = await insightsRes.json()
    if (insightsData.data) {
      for (const c of insightsData.data) {
        const ins = c.insights?.data?.[0] || {}
        const conversions = ins.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0
        const spend = parseFloat(ins.spend || '0')
        const revenue = conversions * 50 // estimate if no pixel data
        campaigns.push({
          user_id: userId,
          platform: 'Meta',
          external_id: c.id,
          name: c.name,
          status: c.status === 'ACTIVE' ? 'Active' : c.status === 'PAUSED' ? 'Paused' : 'Ended',
          spend: Math.round(spend),
          clicks: parseInt(ins.clicks || '0'),
          impressions: parseInt(ins.impressions || '0'),
          conversions: parseInt(conversions),
          revenue: Math.round(revenue),
          roas: spend > 0 ? parseFloat((revenue / spend).toFixed(2)) : 0,
          ctr: parseFloat(ins.ctr || '0'),
          cpc: parseFloat(ins.cpc || '0'),
          synced_at: new Date().toISOString(),
        })
      }
    }
  }
  return campaigns
}

async function syncGoogle(accessToken: string, userId: string) {
  // Google Ads API requires developer token header
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) return []

  // This is a simplified version - real implementation uses Google Ads API client
  return [] // Placeholder until developer token approved
}

async function syncTikTok(accessToken: string, userId: string) {
  const advertiserRes = await fetch(`https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?access_token=${accessToken}&app_id=${process.env.TIKTOK_APP_ID}&secret=${process.env.TIKTOK_APP_SECRET}`)
  const advertiserData = await advertiserRes.json()
  const advertisers = advertiserData?.data?.list || []
  if (!advertisers.length) return []

  const campaigns = []
  for (const adv of advertisers.slice(0, 3)) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '')
    const until = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const campRes = await fetch(`https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${adv.advertiser_id}&access_token=${accessToken}`)
    const campData = await campRes.json()
    for (const c of (campData?.data?.list || []).slice(0, 10)) {
      campaigns.push({
        user_id: userId,
        platform: 'TikTok',
        external_id: c.campaign_id,
        name: c.campaign_name,
        status: c.operation_status === 'ENABLE' ? 'Active' : 'Paused',
        spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0, roas: 0, ctr: 0, cpc: 0,
        synced_at: new Date().toISOString(),
      })
    }
  }
  return campaigns
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: connections } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', userId)

    if (!connections?.length) return NextResponse.json({ synced: 0 })

    let allCampaigns: any[] = []
    for (const conn of connections) {
      if (conn.platform === 'meta') {
        const camps = await syncMeta(conn.access_token, userId)
        allCampaigns = [...allCampaigns, ...camps]
      } else if (conn.platform === 'google') {
        const camps = await syncGoogle(conn.access_token, userId)
        allCampaigns = [...allCampaigns, ...camps]
      } else if (conn.platform === 'tiktok') {
        const camps = await syncTikTok(conn.access_token, userId)
        allCampaigns = [...allCampaigns, ...camps]
      }
    }

    if (allCampaigns.length > 0) {
      await supabase.from('campaigns').upsert(allCampaigns, { onConflict: 'user_id,external_id' })
    }

    // Update last_synced_at for each connection
    await supabase.from('connected_accounts').update({ last_synced_at: new Date().toISOString() }).eq('user_id', userId)

    return NextResponse.json({ synced: allCampaigns.length })
  } catch (e: any) {
    console.error('Sync error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}