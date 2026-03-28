'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Bell, BellOff, TrendingDown, DollarSign, AlertTriangle, Plus, Trash2, CheckCircle, XCircle, Zap, Mail } from 'lucide-react'

type Alert = {
  id: string
  type: 'roas_drop' | 'spend_threshold' | 'cpa_spike'
  name: string
  threshold: number
  campaign_id: string | null
  enabled: boolean
  email_notify: boolean
  created_at: string
}

type Trigger = {
  id: string
  alert_id: string
  message: string
  value: number
  triggered_at: string
}

const ALERT_TYPES = [
  { id: 'roas_drop', label: 'ROAS Drop', icon: <TrendingDown size={14}/>, desc: 'Alert when ROAS falls below a threshold', unit: 'x', placeholder: '2.0', color: 'var(--danger)' },
  { id: 'spend_threshold', label: 'Spend Threshold', icon: <DollarSign size={14}/>, desc: 'Alert when total spend exceeds a limit', unit: '£', placeholder: '5000', color: 'var(--warn)' },
  { id: 'cpa_spike', label: 'CPA Spike', icon: <AlertTriangle size={14}/>, desc: 'Alert when cost per acquisition spikes', unit: '£', placeholder: '25', color: '#a78bfa' },
]

const MOCK_TRIGGERS: Trigger[] = [
  { id:'1', alert_id:'a1', message:'ROAS alert: "TikTok — Product Demo Video" is at 1.2x (threshold: 2.0x)', value:1.2, triggered_at: new Date(Date.now()-1000*60*45).toISOString() },
  { id:'2', alert_id:'a2', message:'Spend alert: Total spend is £9,750 (threshold: £9,000)', value:9750, triggered_at: new Date(Date.now()-1000*60*60*3).toISOString() },
  { id:'3', alert_id:'a1', message:'ROAS alert: "Brand Awareness Q3" is at 0.8x (threshold: 2.0x)', value:0.8, triggered_at: new Date(Date.now()-1000*60*60*24).toISOString() },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff/60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins/60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs/24)}d ago`
}

function AlertTypeCard({ type, selected, onClick }: any) {
  const t = ALERT_TYPES.find(x => x.id === type)!
  return (
    <button onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all w-full"
      style={{
        background: selected ? 'var(--teal-dim)' : 'var(--bg3)',
        borderColor: selected ? 'rgba(0,212,160,0.4)' : 'var(--border)',
      }}>
      <span style={{ color: selected ? 'var(--teal)' : t.color, marginTop: 2 }}>{t.icon}</span>
      <div>
        <div className="text-[13px] font-semibold" style={{ color: selected ? 'var(--teal)' : 'var(--text)' }}>{t.label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>{t.desc}</div>
      </div>
    </button>
  )
}
export default function AlertsPage() {
  const { user } = useUser()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [triggers, setTriggers] = useState<Trigger[]>(MOCK_TRIGGERS)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [alertType, setAlertType] = useState<string>('roas_drop')
  const [alertName, setAlertName] = useState('')
  const [threshold, setThreshold] = useState('')
  const [emailNotify, setEmailNotify] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setAlerts(data || [])
      const { data: t } = await supabase.from('alert_triggers').select('*').eq('user_id', user.id).order('triggered_at', { ascending: false }).limit(20)
      if (t?.length) setTriggers(t)
      setLoading(false)
    }
    load()
  }, [user])

  const handleCreate = async () => {
    if (!alertName.trim() || !threshold || !user) return
    setSaving(true)
    try {
      const body = {
        type: alertType, name: alertName.trim(),
        threshold: parseFloat(threshold),
        campaign_id: null, enabled: true,
        email_notify: emailNotify,
      }
      const res = await fetch('/api/alerts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const data = await res.json()
      setAlerts(prev => [data, ...prev])
      setShowModal(false)
      setAlertName(''); setThreshold(''); setAlertType('roas_drop')
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const toggleAlert = async (alert: Alert) => {
    const updated = { ...alert, enabled: !alert.enabled }
    await fetch('/api/alerts', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: alert.id, enabled: updated.enabled }) })
    setAlerts(prev => prev.map(a => a.id === alert.id ? updated : a))
  }

  const deleteAlert = async (id: string) => {
    await fetch('/api/alerts', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const checkNow = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/alerts/check', { method: 'POST' })
      const data = await res.json()
      if (data.triggered?.length) {
        const { data: t } = await supabase.from('alert_triggers').select('*').eq('user_id', user?.id).order('triggered_at', { ascending: false }).limit(20)
        if (t?.length) setTriggers(t)
      }
    } catch(e) { console.error(e) }
    finally { setChecking(false) }
  }

  const typeInfo = (type: string) => ALERT_TYPES.find(t => t.id === type) || ALERT_TYPES[0]
  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading alerts...</span></div>

  return (
    <>
      <PageHeader title="Real-time Alerts"
        subtitle="Set thresholds for ROAS, spend and CPA. Get notified the moment something needs your attention.">
        <div className="flex gap-2">
          <button onClick={checkNow} disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all"
            style={{borderColor:'rgba(0,212,160,0.3)',color:'var(--teal)',background:'var(--teal-dim)'}}>
            {checking ? <><Spinner size={12}/> Checking...</> : <><Zap size={13}/> Check Now</>}
          </button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={14}/> New Alert
          </Button>
        </div>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active Alerts', value: alerts.filter(a=>a.enabled).length, icon: <Bell size={14}/>, color: 'var(--teal)' },
          { label: 'Triggered Today', value: triggers.filter(t => new Date(t.triggered_at) > new Date(Date.now()-86400000)).length, icon: <AlertTriangle size={14}/>, color: 'var(--warn)' },
          { label: 'Total Alerts', value: alerts.length, icon: <BellOff size={14}/>, color: 'var(--text2)' },
        ].map((s,i) => (
          <div key={i} className="rounded-xl border p-4 flex items-center gap-3" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:'var(--bg3)'}}><span style={{color:s.color}}>{s.icon}</span></div>
            <div><div className="text-[22px] font-bold font-mono">{s.value}</div><div className="text-[11px]" style={{color:'var(--text2)'}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* Left: Alert list */}
        <div>
          <div className="text-[13px] font-semibold mb-3">Your alerts</div>
          {alerts.length === 0 ? (
            <div className="rounded-xl border p-10 text-center" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
              <Bell size={28} className="mx-auto mb-3" style={{color:'var(--text3)'}}/>
              <p className="text-[13px] font-medium mb-1">No alerts set up yet</p>
              <p className="text-[12px] mb-4" style={{color:'var(--text3)'}}>Create your first alert to get notified when campaigns need attention</p>
              <Button variant="primary" onClick={() => setShowModal(true)}>Create first alert</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {alerts.map(alert => {
                const t = typeInfo(alert.type)
                return (
                  <div key={alert.id} className="rounded-xl border p-4 flex items-center gap-4 transition-all"
                    style={{background:'var(--bg2)',borderColor:alert.enabled?'rgba(0,212,160,0.2)':'var(--border)',opacity:alert.enabled?1:0.6}}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:'var(--bg3)'}}>
                      <span style={{color:t.color}}>{t.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">{alert.name}</div>
                      <div className="text-[11px] mt-0.5" style={{color:'var(--text2)'}}>
                        {t.label} · Threshold: <span className="font-mono">{alert.type === 'roas_drop' ? `${alert.threshold}x` : `£${alert.threshold.toLocaleString()}`}</span>
                        {alert.email_notify && <span className="ml-2 inline-flex items-center gap-1"><Mail size={10}/> Email on</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleAlert(alert)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                        style={{borderColor:alert.enabled?'rgba(0,212,160,0.3)':'var(--border2)',color:alert.enabled?'var(--teal)':'var(--text3)',background:alert.enabled?'var(--teal-dim)':'transparent'}}>
                        {alert.enabled ? <><CheckCircle size={11}/> Active</> : <><XCircle size={11}/> Paused</>}
                      </button>
                      <button onClick={() => deleteAlert(alert.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg4)]" style={{color:'var(--text3)'}}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Trigger log */}
        <div>
          <div className="text-[13px] font-semibold mb-3">Alert history</div>
          <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            {triggers.length === 0 ? (
              <div className="p-8 text-center"><CheckCircle size={22} className="mx-auto mb-2" style={{color:'var(--teal)'}}/><p className="text-[12px]" style={{color:'var(--text2)'}}>No alerts triggered yet</p></div>
            ) : (
              <div className="flex flex-col">
                {triggers.map((t,i) => {
                  const isROAS = t.message.toLowerCase().includes('roas')
                  const isSpend = t.message.toLowerCase().includes('spend')
                  const color = isROAS ? 'var(--danger)' : isSpend ? 'var(--warn)' : '#a78bfa'
                  const bg = isROAS ? 'rgba(255,92,92,0.1)' : isSpend ? 'rgba(255,170,68,0.1)' : 'rgba(167,139,250,0.1)'
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 border-b" style={{borderColor:'var(--border)'}}>
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{background:bg}}>
                        <AlertTriangle size={11} style={{color}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] leading-snug" style={{color:'var(--text2)'}}>{t.message}</p>
                        <p className="text-[10px] mt-1" style={{color:'var(--text3)'}}>{timeAgo(t.triggered_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div className="mt-4 rounded-xl border p-4" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="text-[12px] font-semibold mb-3">Quick add presets</div>
            {[
              { name: 'ROAS below 2x', type: 'roas_drop', threshold: 2 },
              { name: 'Spend over £10k', type: 'spend_threshold', threshold: 10000 },
              { name: 'CPA over £50', type: 'cpa_spike', threshold: 50 },
            ].map((p,i) => (
              <button key={i} onClick={async () => {
                if (!user) return
                const res = await fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...p, campaign_id: null, enabled: true, email_notify: true }) })
                const data = await res.json()
                if (data.id) setAlerts(prev => [data, ...prev])
              }}
                className="flex items-center justify-between w-full p-2.5 rounded-lg border mb-2 text-left transition-colors hover:bg-[var(--bg3)]"
                style={{borderColor:'var(--border)',background:'var(--bg3)'}}>
                <span className="text-[12px] font-medium">{p.name}</span>
                <Plus size={13} style={{color:'var(--teal)'}}/>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create alert modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.65)'}}
          onClick={() => setShowModal(false)}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{background:'var(--bg2)',borderColor:'var(--border2)'}}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">New Alert</div>
            <p className="text-[12px] mb-5" style={{color:'var(--text2)'}}>Get notified when a metric crosses your threshold.</p>

            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-2" style={{color:'var(--text2)'}}>Alert type</label>
              <div className="flex flex-col gap-2">
                {ALERT_TYPES.map(t => <AlertTypeCard key={t.id} type={t.id} selected={alertType===t.id} onClick={() => setAlertType(t.id)}/>)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Alert name</label>
              <input value={alertName} onChange={e=>setAlertName(e.target.value)} autoFocus
                placeholder={`e.g. ${ALERT_TYPES.find(t=>t.id===alertType)?.label} Alert`}
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is}/>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>
                Threshold ({ALERT_TYPES.find(t=>t.id===alertType)?.unit})
              </label>
              <div className="relative">
                {alertType !== 'roas_drop' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{color:'var(--text2)'}}>£</span>}
                <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)}
                  placeholder={ALERT_TYPES.find(t=>t.id===alertType)?.placeholder}
                  className={`w-full rounded-lg border ${alertType!=='roas_drop'?'pl-7':'pl-3'} pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]`} style={is}/>
                {alertType === 'roas_drop' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]" style={{color:'var(--text2)'}}>x ROAS</span>}
              </div>
            </div>

            <label className="flex items-center gap-2.5 mb-5 cursor-pointer">
              <div className="w-9 h-5 rounded-full transition-colors relative shrink-0"
                style={{background:emailNotify?'var(--teal)':'var(--bg4)'}}
                onClick={()=>setEmailNotify(!emailNotify)}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow" style={{left:emailNotify?'calc(100% - 18px)':'2px'}}/>
              </div>
              <div>
                <div className="text-[12px] font-medium">Email notifications</div>
                <div className="text-[11px]" style={{color:'var(--text2)'}}>Send an email when this alert triggers</div>
              </div>
            </label>

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving || !alertName.trim() || !threshold}>
                {saving ? <><Spinner size={13}/> Saving...</> : 'Create Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}