'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { Bell, BellOff, Plus, Trash2, TrendingDown, TrendingUp, DollarSign, Target, CheckCheck, RefreshCw } from 'lucide-react'

type Rule = { id: string; type: string; threshold: number; campaign_id: string | null; campaign_name: string | null; notify_email: string | null; enabled: boolean; created_at: string }
type Alert = { id: string; type: string; message: string; value: number; read: boolean; triggered_at: string }

const RULE_TYPES = [
  { id: 'roas_drop', label: 'ROAS drops below', icon: TrendingDown, color: 'var(--danger)', unit: 'x', placeholder: '2.0', desc: 'Alert when ROAS falls below threshold' },
  { id: 'roas_spike', label: 'ROAS spikes above', icon: TrendingUp, color: 'var(--teal)', unit: 'x', placeholder: '6.0', desc: 'Alert when a campaign is performing exceptionally well' },
  { id: 'spend_threshold', label: 'Spend exceeds', icon: DollarSign, color: 'var(--warn)', unit: '£', placeholder: '5000', desc: 'Alert when monthly spend hits a limit' },
  { id: 'cpa_high', label: 'CPA exceeds', icon: Target, color: '#a78bfa', unit: '£', placeholder: '25', desc: 'Alert when cost per acquisition gets too high' },
]

function TypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const t = RULE_TYPES.find(r => r.id === type)
  if (!t) return null
  const Icon = t.icon
  return <Icon size={size} style={{ color: t.color }} />
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}
export default function AlertsPage() {
  const { user } = useUser()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [ruleType, setRuleType] = useState('roas_drop')
  const [threshold, setThreshold] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')

  const unreadCount = alerts.filter(a => !a.read).length

  useEffect(() => {
    load()
    // Auto-set email from user
    if (user?.primaryEmailAddress?.emailAddress) {
      setNotifyEmail(user.primaryEmailAddress.emailAddress)
    }
  }, [user])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/alerts')
      const data = await res.json()
      setAlerts(data.alerts || [])
      setRules(data.rules || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleCheck = async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/alerts/check', { method: 'POST' })
      const data = await res.json()
      if (data.triggered?.length > 0) await load()
    } catch(e) { console.error(e) }
    finally { setChecking(false) }
  }

  const handleCreate = async () => {
    if (!threshold) return
    setSaving(true)
    try {
      await fetch('/api/alerts', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'create_rule', rule: { type: ruleType, threshold: parseFloat(threshold), notify_email: notifyEmail || null, enabled: true, campaign_id: null, campaign_name: null } })
      })
      await load()
      setShowModal(false)
      setThreshold('')
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleToggle = async (rule: Rule) => {
    await fetch('/api/alerts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'toggle_rule', id: rule.id, enabled: !rule.enabled }) })
    setRules(prev => prev.map(r => r.id === rule.id ? {...r, enabled: !r.enabled} : r))
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/alerts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete_rule', id }) })
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const handleMarkRead = async (id: string) => {
    await fetch('/api/alerts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'mark_read', id }) })
    setAlerts(prev => prev.map(a => a.id === id ? {...a, read: true} : a))
  }

  const handleMarkAllRead = async () => {
    await fetch('/api/alerts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'mark_all_read' }) })
    setAlerts(prev => prev.map(a => ({...a, read: true})))
  }

  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }
  const selectedType = RULE_TYPES.find(r => r.id === ruleType)

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/><span>Loading alerts...</span></div>

  return (
    <>
      <PageHeader title="Real-time Alerts"
        subtitle="Get notified instantly when ROAS drops, spend spikes, or a campaign needs attention.">
        <div className="flex gap-2">
          <button onClick={handleCheck} disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border"
            style={{borderColor:'var(--border2)',color:'var(--text2)'}}>
            <RefreshCw size={13} className={checking ? 'animate-spin' : ''}/>
            {checking ? 'Checking...' : 'Check now'}
          </button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={13}/> New Alert Rule
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {label:'Active Rules', value:rules.filter(r=>r.enabled).length, icon:<Bell size={14}/>, color:'var(--teal)'},
          {label:'Unread Alerts', value:unreadCount, icon:<Bell size={14}/>, color:unreadCount>0?'var(--danger)':'var(--text2)'},
          {label:'Total Triggered', value:alerts.length, icon:<Target size={14}/>, color:'var(--text2)'},
        ].map((s,i) => (
          <div key={i} className="rounded-xl border p-4" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px]" style={{color:'var(--text2)'}}>{s.label}</span>
              <span style={{color:s.color}}>{s.icon}</span>
            </div>
            <div className="text-[28px] font-bold font-mono" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-5">

        {/* Alert Rules */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[14px] font-semibold">Alert Rules</span>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-[12px]" style={{color:'var(--teal)'}}>
              <Plus size={12}/> Add rule
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            {rules.length === 0 ? (
              <div className="text-center py-12" style={{color:'var(--text3)'}}>
                <Bell size={28} className="mx-auto mb-3 opacity-30"/>
                <p className="text-[13px] mb-1">No alert rules yet</p>
                <p className="text-[12px] mb-4">Create rules to get notified when campaigns need attention</p>
                <Button variant="primary" onClick={() => setShowModal(true)}>Create first rule</Button>
              </div>
            ) : (
              rules.map(rule => {
                const t = RULE_TYPES.find(r => r.id === rule.type)
                return (
                  <div key={rule.id} className="flex items-center gap-3 px-4 py-3 border-b hover:bg-[var(--bg3)] transition-colors"
                    style={{borderColor:'var(--border)',opacity:rule.enabled?1:0.5}}>
                    <TypeIcon type={rule.type} size={16}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium">
                        {t?.label} <span className="font-mono font-bold" style={{color:t?.color}}>{t?.unit === '£' ? '£' : ''}{rule.threshold}{t?.unit === 'x' ? 'x' : ''}</span>
                      </div>
                      <div className="text-[11px]" style={{color:'var(--text3)'}}>
                        {rule.notify_email ? `Email: ${rule.notify_email}` : 'In-app only'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(rule)}
                        className="w-8 h-4 rounded-full transition-colors relative"
                        style={{background:rule.enabled?'var(--teal)':'var(--bg4)'}}>
                        <span className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                          style={{left:rule.enabled?'calc(100% - 14px)':'2px'}}/>
                      </button>
                      <button onClick={() => handleDelete(rule.id)}
                        className="p-1 rounded transition-colors hover:bg-[var(--bg4)]"
                        style={{color:'var(--text3)'}}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Alert Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold">Alert Feed</span>
              {unreadCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{background:'var(--danger)',color:'white'}}>{unreadCount}</span>}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-[12px]" style={{color:'var(--text2)'}}>
                <CheckCheck size={12}/> Mark all read
              </button>
            )}
          </div>
          <div className="rounded-xl border overflow-hidden" style={{background:'var(--bg2)',borderColor:'var(--border)'}}>
            {alerts.length === 0 ? (
              <div className="text-center py-12" style={{color:'var(--text3)'}}>
                <BellOff size={28} className="mx-auto mb-3 opacity-30"/>
                <p className="text-[13px] mb-1">No alerts yet</p>
                <p className="text-[12px]">Alerts will appear here when your rules are triggered</p>
              </div>
            ) : (
              alerts.map(alert => {
                const isPositive = alert.type === 'roas_spike'
                const borderCol = isPositive ? 'rgba(0,212,160,0.15)' : 'rgba(255,92,92,0.1)'
                return (
                  <div key={alert.id}
                    className="flex items-start gap-3 px-4 py-3 border-b transition-colors cursor-pointer hover:bg-[var(--bg3)]"
                    style={{borderColor:'var(--border)',opacity:alert.read?0.6:1}}
                    onClick={() => !alert.read && handleMarkRead(alert.id)}>
                    <div className="mt-0.5 shrink-0">
                      <TypeIcon type={alert.type} size={15}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-relaxed" style={{color:'var(--text)'}}>{alert.message}</p>
                      <span className="text-[11px]" style={{color:'var(--text3)'}}>{timeAgo(alert.triggered_at)}</span>
                    </div>
                    {!alert.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{background:'var(--teal)'}}/>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Create rule modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.65)'}}
          onClick={() => setShowModal(false)}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{background:'var(--bg2)',borderColor:'var(--border2)'}}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">New Alert Rule</div>
            <p className="text-[12px] mb-5" style={{color:'var(--text2)'}}>Get notified when a campaign crosses a threshold.</p>

            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-2" style={{color:'var(--text2)'}}>Alert type</label>
              <div className="flex flex-col gap-2">
                {RULE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setRuleType(t.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                    style={{background:ruleType===t.id?'var(--teal-dim)':'var(--bg3)',borderColor:ruleType===t.id?'rgba(0,212,160,0.3)':'var(--border)'}}>
                    <t.icon size={14} style={{color:t.color,flexShrink:0}}/>
                    <div>
                      <div className="text-[12px] font-medium">{t.label}</div>
                      <div className="text-[11px]" style={{color:'var(--text3)'}}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Threshold value</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{color:'var(--text2)'}}>
                  {selectedType?.unit === '£' ? '£' : ''}
                </span>
                <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                  placeholder={selectedType?.placeholder}
                  className="w-full rounded-lg border pl-7 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                  style={is} autoFocus/>
                {selectedType?.unit === 'x' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]" style={{color:'var(--text2)'}}>x ROAS</span>}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[11px] font-medium mb-1.5" style={{color:'var(--text2)'}}>Email notifications (optional)</label>
              <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                style={is}/>
              <p className="text-[11px] mt-1" style={{color:'var(--text3)'}}>Leave empty for in-app alerts only</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving || !threshold}>
                {saving ? <><Spinner size={13}/> Saving...</> : 'Create Rule'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}