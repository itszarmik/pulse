'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

type Connection = {
  platform: string
  account_name: string
  connected_at: string
  last_synced_at: string | null
}

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta Ads',
    desc: 'Facebook & Instagram campaigns',
    color: '#1877f2',
    icon: 'f',
    oauthPath: '/api/oauth/meta',
    docsUrl: 'https://developers.facebook.com/apps',
    envVars: ['META_APP_ID', 'META_APP_SECRET'],
  },
  {
    id: 'google',
    name: 'Google Ads',
    desc: 'Search, Display & Shopping campaigns',
    color: '#ea4335',
    icon: 'G',
    oauthPath: '/api/oauth/google',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/get-started/introduction',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    desc: 'TikTok & social video campaigns',
    color: '#00d4a0',
    icon: '♪',
    oauthPath: '/api/oauth/tiktok',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
    envVars: ['TIKTOK_APP_ID', 'TIKTOK_APP_SECRET'],
  },
]

function ImportContent() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) setBanner({ type: 'success', msg: `✓ ${connected.charAt(0).toUpperCase() + connected.slice(1)} Ads connected successfully! Click "Sync Now" to pull your campaigns.` })
    if (error) setBanner({ type: 'error', msg: `Failed to connect ${error.replace('_denied', '').replace('_failed', '')}. Please try again.` })
  }, [searchParams])

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('connected_accounts').select('platform,account_name,connected_at,last_synced_at').eq('user_id', user.id)
      setConnections(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setBanner({ type: 'success', msg: `✓ Synced ${data.synced} campaigns from your connected accounts.` })
      // Refresh connections to update last_synced_at
      const { data: conns } = await supabase.from('connected_accounts').select('platform,account_name,connected_at,last_synced_at').eq('user_id', user?.id)
      setConnections(conns || [])
    } catch (e: any) {
      setBanner({ type: 'error', msg: 'Sync failed: ' + e.message })
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    await supabase.from('connected_accounts').delete().eq('user_id', user?.id).eq('platform', platform)
    setConnections(prev => prev.filter(c => c.platform !== platform))
    setBanner({ type: 'info', msg: `${platform} disconnected.` })
  }

  const isConnected = (id: string) => connections.some(c => c.platform === id)
  const getConnection = (id: string) => connections.find(c => c.platform === id)

  return (
    <>
      <PageHeader title="Connect Ad Platforms"
        subtitle="Connect your ad accounts to pull real-time campaign data into Pulse.">
        {connections.length > 0 && (
          <Button variant="primary" onClick={handleSync} disabled={syncing}>
            {syncing ? <><Spinner size={13} /> Syncing...</> : '↻ Sync Now'}
          </Button>
        )}
      </PageHeader>

      {banner && (
        <div className="mb-6 px-4 py-3 rounded-lg text-[13px] font-medium flex items-center justify-between"
          style={{
            background: banner.type === 'success' ? 'rgba(0,212,160,0.1)' : banner.type === 'error' ? 'rgba(255,92,92,0.1)' : 'rgba(255,170,68,0.1)',
            color: banner.type === 'success' ? 'var(--teal)' : banner.type === 'error' ? 'var(--danger)' : 'var(--warn)',
            border: `1px solid ${banner.type === 'success' ? 'rgba(0,212,160,0.25)' : banner.type === 'error' ? 'rgba(255,92,92,0.25)' : 'rgba(255,170,68,0.25)'}`,
          }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Platform connection cards */}
      <div className="flex flex-col gap-4 mb-8">
        {PLATFORMS.map(p => {
          const connected = isConnected(p.id)
          const conn = getConnection(p.id)
          return (
            <div key={p.id} className="rounded-xl border p-5 flex items-center gap-5"
              style={{ background: 'var(--bg2)', borderColor: connected ? 'rgba(0,212,160,0.3)' : 'var(--border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shrink-0"
                style={{ background: p.color }}>
                {p.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-semibold">{p.name}</span>
                  {connected && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,212,160,0.15)', color: 'var(--teal)' }}>
                      ✓ Connected
                    </span>
                  )}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                  {connected
                    ? `${conn?.account_name} · Last synced: ${conn?.last_synced_at ? new Date(conn.last_synced_at).toLocaleDateString('en-GB') : 'Never'}`
                    : p.desc
                  }
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {connected ? (
                  <>
                    <Button onClick={() => window.location.href = p.oauthPath} size="sm">Reconnect</Button>
                    <button onClick={() => handleDisconnect(p.id)}
                      className="text-[12px] px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--bg4)]"
                      style={{ borderColor: 'rgba(255,92,92,0.3)', color: 'var(--danger)' }}>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <a href={p.oauthPath}
                    className="px-4 py-1.5 rounded-lg text-[13px] font-semibold no-underline"
                    style={{ background: p.color, color: 'white' }}>
                    Connect {p.name}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Setup guide */}
      <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="text-[14px] font-semibold mb-1">Before you connect</div>
        <p className="text-[13px] mb-4" style={{ color: 'var(--text2)' }}>
          Each platform requires you to create a developer app and get API approval. This is a one-time setup.
          Once approved, add the credentials to your Vercel environment variables.
        </p>
        <div className="flex flex-col gap-3">
          {PLATFORMS.map(p => (
            <div key={p.id} className="flex items-start gap-3 p-3.5 rounded-lg" style={{ background: 'var(--bg3)' }}>
              <div className="w-6 h-6 rounded flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5"
                style={{ background: p.color }}>{p.icon}</div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold mb-1">{p.name}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text2)' }}>
                  Add to Vercel: {p.envVars.map(v => <code key={v} className="px-1 rounded text-[10px]" style={{ background: 'var(--bg4)', color: 'var(--teal)' }}>{v}</code>).reduce((a: any, b: any) => [a, ' · ', b])}
                </div>
              </div>
              <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                className="text-[11px] no-underline shrink-0"
                style={{ color: 'var(--teal)' }}>
                Apply for API →
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Spinner /></div>}>
      <ImportContent />
    </Suspense>
  )
}