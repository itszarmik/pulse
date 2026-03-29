'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, Link2, Trash2, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

type Integration = {
  id: string
  platform: string
  shop_domain: string
  webhook_secret: string
  connected_at: string
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all shrink-0"
      style={{ borderColor: copied ? 'rgba(0,212,160,0.4)' : 'var(--border2)', color: copied ? 'var(--teal)' : 'var(--text2)', background: copied ? 'var(--teal-dim)' : 'transparent' }}>
      {copied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg p-3 text-[11px] font-mono break-all" style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>
      {code}
    </div>
  )
}
const APP_URL = 'https://pulse-ruddy-psi.vercel.app'

const PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    logo: '🛍️',
    color: '#96bf48',
    desc: 'Automatically track orders from your Shopify store to UGC campaigns',
    webhookPath: '/api/integrations/shopify/webhook',
    steps: [
      { title: 'Enter your store domain', desc: 'Add your Shopify store URL below (e.g. mystore.myshopify.com)' },
      { title: 'Add the webhook in Shopify', desc: 'Go to Settings → Notifications → Webhooks in your Shopify admin' },
      { title: 'Configure the webhook', desc: 'Set Event to "Order payment", Format to "JSON", and paste your webhook URL' },
      { title: 'Add UTM tracking to your theme', desc: 'Your theme needs to capture ?ref= URL params and store them in order note_attributes' },
    ],
    themeCode: `{% comment %} Add to theme.liquid before </head> {% endcomment %}
<script>
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) {
    sessionStorage.setItem('pulse_ref', ref);
    document.cookie = 'pulse_ref=' + ref + ';path=/;max-age=2592000';
  }
</script>`,
    checkoutCode: `{% comment %} Add to checkout.liquid or order notes {% endcomment %}
<input type="hidden" name="attributes[ref]" 
  value="{{ shop.metafields.pulse.ref }}" />`,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    logo: '🛒',
    color: '#7f54b3',
    desc: 'Connect your WooCommerce store to automatically track influencer conversions',
    webhookPath: '/api/integrations/woocommerce/webhook',
    steps: [
      { title: 'Enter your store domain', desc: 'Add your WordPress/WooCommerce store URL below' },
      { title: 'Add the webhook in WooCommerce', desc: 'Go to WooCommerce → Settings → Advanced → Webhooks' },
      { title: 'Create a new webhook', desc: 'Set Topic to "Order updated", Status to "Active", and paste your webhook URL' },
      { title: 'Install the UTM tracking plugin', desc: 'Install "UTM Tracker for WooCommerce" or add the custom code below' },
    ],
    phpCode: `<?php
// Add to functions.php or a custom plugin
add_action('woocommerce_checkout_create_order', function($order) {
  $ref = sanitize_text_field($_COOKIE['pulse_ref'] ?? '');
  if ($ref) {
    $order->update_meta_data('ref', $ref);
  }
});

// Set cookie from URL param
add_action('init', function() {
  if (isset($_GET['ref'])) {
    setcookie('pulse_ref', sanitize_text_field($_GET['ref']), time() + 2592000, '/');
  }
});`,
  },
]

export default function IntegrationsPage() {
  const { user } = useUser()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [domains, setDomains] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const res = await fetch('/api/integrations')
      const data = await res.json()
      setIntegrations(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [user])

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform)

  const handleConnect = async (platform: string) => {
    const domain = domains[platform]?.trim()
    if (!domain) return
    setSaving(platform)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, shop_domain: domain })
      })
      const data = await res.json()
      if (data.id) {
        setIntegrations(prev => [...prev.filter(i => i.platform !== platform), data])
        setExpanded(platform)
      }
    } catch(e) { console.error(e) }
    finally { setSaving(null) }
  }

  const handleDisconnect = async (platform: string) => {
    await fetch('/api/integrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    })
    setIntegrations(prev => prev.filter(i => i.platform !== platform))
  }

  if (loading) return <div className="flex items-center justify-center py-24"><Spinner/></div>

  return (
    <>
      <PageHeader title="Integrations"
        subtitle="Connect your ecommerce store to automatically track influencer-driven sales in the UGC tracker." />

      <div className="flex flex-col gap-5">
        {PLATFORMS.map(platform => {
          const integration = getIntegration(platform.id)
          const isConnected = !!integration
          const isExpanded = expanded === platform.id
          const webhookUrl = `${APP_URL}${platform.webhookPath}`

          return (
            <div key={platform.id} className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--bg2)', borderColor: isConnected ? `${platform.color}40` : 'var(--border)' }}>

              {/* Header */}
              <div className="flex items-center gap-4 p-5">
                <div className="text-[28px] w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                  style={{ background: 'var(--bg3)' }}>
                  {platform.logo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold">{platform.name}</span>
                    {isConnected && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,212,160,0.1)', color: 'var(--teal)' }}>
                        <CheckCircle size={9}/> Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--text2)' }}>{platform.desc}</p>
                  {isConnected && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>
                      Store: {integration.shop_domain} · Connected {new Date(integration.connected_at).toLocaleDateString('en-GB')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isConnected ? (
                    <>
                      <button onClick={() => setExpanded(isExpanded ? null : platform.id)}
                        className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border transition-all"
                        style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                        Setup guide {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </button>
                      <button onClick={() => handleDisconnect(platform.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-[var(--bg4)]" style={{ color: 'var(--text3)' }}>
                        <Trash2 size={14}/>
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setExpanded(isExpanded ? null : platform.id)}
                      className="flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-lg font-semibold"
                      style={{ background: platform.color, color: 'white' }}>
                      <Link2 size={13}/> Connect {platform.name}
                    </button>
                  )}
                </div>
              </div>

              {/* Setup panel */}
              {isExpanded && (
                <div className="border-t p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg3)' }}>

                  {/* Connect form if not connected */}
                  {!isConnected && (
                    <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div className="text-[13px] font-semibold mb-3">Step 1 — Enter your store domain</div>
                      <div className="flex gap-3">
                        <input
                          value={domains[platform.id] || ''}
                          onChange={e => setDomains(prev => ({ ...prev, [platform.id]: e.target.value }))}
                          placeholder={platform.id === 'shopify' ? 'mystore.myshopify.com' : 'mystore.com'}
                          className="flex-1 rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                          style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        />
                        <button onClick={() => handleConnect(platform.id)} disabled={!domains[platform.id]?.trim() || saving === platform.id}
                          className="px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2"
                          style={{ background: platform.color, color: 'white', opacity: !domains[platform.id]?.trim() ? 0.5 : 1 }}>
                          {saving === platform.id ? <><Spinner size={13}/> Connecting...</> : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Webhook URL */}
                  {isConnected && (
                    <div className="mb-6">
                      <div className="text-[13px] font-semibold mb-2">Your webhook URL</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg px-3 py-2 text-[11px] font-mono break-all"
                          style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>
                          {webhookUrl}
                        </div>
                        <CopyBtn text={webhookUrl} />
                      </div>
                      {integration && (
                        <div className="mt-2">
                          <div className="text-[12px] mb-1.5" style={{ color: 'var(--text2)' }}>Webhook secret (use for signature verification)</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-lg px-3 py-2 text-[11px] font-mono"
                              style={{ background: 'var(--bg4)', color: 'var(--text2)', filter: 'blur(4px)' }}
                              onMouseEnter={e => (e.currentTarget.style.filter = 'none')}
                              onMouseLeave={e => (e.currentTarget.style.filter = 'blur(4px)')}>
                              {integration.webhook_secret}
                            </div>
                            <CopyBtn text={integration.webhook_secret} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Steps */}
                  <div className="text-[13px] font-semibold mb-3">Setup steps</div>
                  <div className="flex flex-col gap-3 mb-5">
                    {platform.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                          style={{ background: isConnected && i === 0 ? 'var(--teal)' : 'var(--bg4)', color: isConnected && i === 0 ? '#001a12' : 'var(--text2)' }}>
                          {isConnected && i === 0 ? '✓' : i + 1}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold">{step.title}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Code snippets */}
                  {platform.id === 'shopify' && (
                    <div>
                      <div className="text-[12px] font-semibold mb-2">Add to your Shopify theme (theme.liquid)</div>
                      <div className="relative">
                        <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: 'var(--bg4)', color: '#7dd3fc' }}>
                          <code>{platform.themeCode}</code>
                        </pre>
                        <div className="absolute top-2 right-2"><CopyBtn text={platform.themeCode}/></div>
                      </div>
                    </div>
                  )}

                  {platform.id === 'woocommerce' && (
                    <div>
                      <div className="text-[12px] font-semibold mb-2">Add to your functions.php</div>
                      <div className="relative">
                        <pre className="rounded-lg p-3 text-[10px] overflow-x-auto" style={{ background: 'var(--bg4)', color: '#7dd3fc' }}>
                          <code>{platform.phpCode}</code>
                        </pre>
                        <div className="absolute top-2 right-2"><CopyBtn text={platform.phpCode}/></div>
                      </div>
                    </div>
                  )}

                  {/* How it works */}
                  <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(0,212,160,0.05)', border: '1px solid rgba(0,212,160,0.15)' }}>
                    <div className="text-[12px] font-semibold mb-2" style={{ color: 'var(--teal)' }}>How it works</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                      When a customer visits your store via an influencer's link (e.g. <span className="font-mono" style={{ color: 'var(--teal)' }}>yourstore.com?ref=emma_tiktok_x4k2</span>),
                      the tracking code saves the ref code. When they place an order, {platform.name} sends a webhook to Pulse.
                      Pulse matches the ref code to the influencer campaign and automatically updates their clicks, orders and revenue — no manual entry needed.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* How tracking works summary */}
      <div className="mt-6 rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="text-[13px] font-semibold mb-3">End-to-end tracking flow</div>
        <div className="flex items-center gap-2 flex-wrap text-[12px]">
          {[
            '1. Influencer posts with their link (?ref=code)',
            '→',
            '2. Customer clicks and lands on your store',
            '→',
            '3. Ref code is saved in browser',
            '→',
            '4. Customer buys — order sent to Pulse',
            '→',
            '5. UGC campaign updates automatically',
          ].map((step, i) => (
            <span key={i} style={{ color: step === '→' ? 'var(--text3)' : 'var(--text2)' }}>{step}</span>
          ))}
        </div>
      </div>
    </>
  )
}