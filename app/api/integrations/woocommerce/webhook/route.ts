import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

function verifyWooSignature(body: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return true
  const hash = crypto.createHmac('sha256', secret).update(body).digest('base64')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

function extractUTMRef(order: any): string | null {
  // WooCommerce stores meta_data as array of {key, value} objects
  const meta = order.meta_data || []
  
  const keys = ['ref', '_ref', 'utm_ref', '_ga_ref', 'landing_page_ref']
  for (const key of keys) {
    const m = meta.find((m: any) => m.key === key)
    if (m?.value) return m.value
  }

  // Check order note
  if (order.customer_note) {
    const match = order.customer_note.match(/ref[=:]([\w_-]+)/i)
    if (match) return match[1]
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-wc-webhook-signature') || ''
    const topic = req.headers.get('x-wc-webhook-topic') || ''
    const source = req.headers.get('x-wc-webhook-source') || ''

    // Extract domain from source URL
    let shopDomain = source
    try { shopDomain = new URL(source).hostname } catch {}

    // Find integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id, webhook_secret')
      .eq('platform', 'woocommerce')
      .eq('shop_domain', shopDomain)
      .single()

    if (!integration) return NextResponse.json({ ok: true })

    if (!verifyWooSignature(body, signature, integration.webhook_secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const order = JSON.parse(body)

    // Only process completed/processing orders
    if (!['processing', 'completed'].includes(order.status)) {
      return NextResponse.json({ ok: true, skipped: order.status })
    }

    const ref = extractUTMRef(order)
    if (!ref) return NextResponse.json({ ok: true, skipped: 'no_ref' })

    const orderValue = parseFloat(order.total || '0')

    const { data: campaign } = await supabase
      .from('ugc_campaigns')
      .select('*')
      .eq('user_id', integration.user_id)
      .eq('utm_code', ref)
      .single()

    if (!campaign) return NextResponse.json({ ok: true, skipped: 'no_campaign_match' })

    await supabase.from('ugc_campaigns').update({
      orders: (campaign.orders || 0) + 1,
      revenue: (campaign.revenue || 0) + orderValue,
    }).eq('id', campaign.id)

    await supabase.from('ugc_conversions').insert({
      campaign_id: campaign.id,
      user_id: integration.user_id,
      platform: 'woocommerce',
      order_id: String(order.id),
      order_value: orderValue,
      items: order.line_items?.length || 1,
      customer_email: order.billing?.email || null,
      shop_domain: shopDomain,
      raw_ref: ref,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, campaign: campaign.influencer_name, revenue: orderValue })
  } catch (err: any) {
    console.error('WooCommerce webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}