import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

// Verify Shopify webhook signature
function verifyShopifyWebhook(body: string, hmac: string, secret: string): boolean {
  if (!secret || !hmac) return true // Skip verification in dev
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac))
}

// Extract UTM ref from order note_attributes or landing_site
function extractUTMRef(order: any): string | null {
  // Check note_attributes (set by Shopify theme from URL params)
  const attrs = order.note_attributes || []
  const refAttr = attrs.find((a: any) => a.name === 'ref' || a.name === 'utm_ref' || a.name === '_ref')
  if (refAttr?.value) return refAttr.value

  // Check landing_site URL
  if (order.landing_site) {
    const url = new URL('https://placeholder.com' + order.landing_site)
    const ref = url.searchParams.get('ref')
    if (ref) return ref
  }

  // Check referring_site
  if (order.referring_site) {
    try {
      const url = new URL(order.referring_site)
      const ref = url.searchParams.get('ref')
      if (ref) return ref
    } catch {}
  }

  // Check order tags
  if (order.tags) {
    const tags = order.tags.split(',').map((t: string) => t.trim())
    const refTag = tags.find((t: string) => t.startsWith('ref:'))
    if (refTag) return refTag.replace('ref:', '')
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const hmac = req.headers.get('x-shopify-hmac-sha256') || ''
    const topic = req.headers.get('x-shopify-topic') || ''
    const shopDomain = req.headers.get('x-shopify-shop-domain') || ''

    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id, webhook_secret')
      .eq('platform', 'shopify')
      .eq('shop_domain', shopDomain)
      .single()

    if (!integration) {
      console.log('No integration found for shop:', shopDomain)
      return NextResponse.json({ ok: true }) // Silently accept
    }

    // Verify signature
    if (!verifyShopifyWebhook(body, hmac, integration.webhook_secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const order = JSON.parse(body)

    // Only process paid orders
    if (topic !== 'orders/paid' && topic !== 'orders/create') {
      return NextResponse.json({ ok: true, skipped: topic })
    }

    const ref = extractUTMRef(order)
    if (!ref) return NextResponse.json({ ok: true, skipped: 'no_ref' })

    const orderValue = parseFloat(order.total_price || '0')
    const orderItems = order.line_items?.length || 1

    // Find matching UGC campaign
    const { data: campaign } = await supabase
      .from('ugc_campaigns')
      .select('*')
      .eq('user_id', integration.user_id)
      .eq('utm_code', ref)
      .single()

    if (!campaign) return NextResponse.json({ ok: true, skipped: 'no_campaign_match' })

    // Update campaign metrics
    await supabase
      .from('ugc_campaigns')
      .update({
        orders: (campaign.orders || 0) + 1,
        revenue: (campaign.revenue || 0) + orderValue,
      })
      .eq('id', campaign.id)

    // Log the conversion
    await supabase.from('ugc_conversions').insert({
      campaign_id: campaign.id,
      user_id: integration.user_id,
      platform: 'shopify',
      order_id: String(order.id),
      order_value: orderValue,
      items: orderItems,
      customer_email: order.email || null,
      shop_domain: shopDomain,
      raw_ref: ref,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, campaign: campaign.influencer_name, revenue: orderValue })
  } catch (err: any) {
    console.error('Shopify webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}