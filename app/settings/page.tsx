'use client'
import { useState } from 'react'
import { PageHeader, Button, Card, Toggle } from '@/components/ui'

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor:'var(--border)' }}>
      <div>
        <div className="text-[13px]">{label}</div>
        {desc && <div className="text-[11px] mt-0.5" style={{ color:'var(--text2)' }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoAnalyse: true, weeklyDigest: true, roasAlert: false,
    emailNotifs: true, slackIntegration: false, csvAutoMap: true, showROASAsCurrency: false,
  })
  const toggle = (key: keyof typeof settings) => setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  const [currency, setCurrency] = useState('GBP')
  const [attribution, setAttribution] = useState('7-day click')
  const selectStyle = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure your Pulse workspace and integrations." />
      <Card className="mb-4">
        <div className="text-[13px] font-semibold mb-3 pb-3 border-b" style={{ borderColor:'var(--border)' }}>Workspace</div>
        <SettingRow label="Workspace name">
          <input type="text" defaultValue="My Pulse Workspace"
            className="rounded-lg border px-3 py-1.5 text-[13px] outline-none focus:border-[var(--teal)] w-52" style={selectStyle} />
        </SettingRow>
        <SettingRow label="Currency" desc="Used across all dashboards and reports">
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-[13px] outline-none focus:border-[var(--teal)] w-36" style={selectStyle}>
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </SettingRow>
        <SettingRow label="Attribution window" desc="Click-through and view-through attribution window">
          <select value={attribution} onChange={e => setAttribution(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-[13px] outline-none focus:border-[var(--teal)] w-36" style={selectStyle}>
            <option>7-day click</option><option>1-day view</option><option>28-day click</option><option>1-day click</option>
          </select>
        </SettingRow>
      </Card>
      <Card className="mb-4">
        <div className="text-[13px] font-semibold mb-3 pb-3 border-b" style={{ borderColor:'var(--border)' }}>AI & Analysis</div>
        <SettingRow label="Auto-run AI analysis on import" desc="Automatically analyse campaigns when new data is imported">
          <Toggle on={settings.autoAnalyse} onChange={() => toggle('autoAnalyse')} />
        </SettingRow>
        <SettingRow label="Weekly performance digest" desc="Receive a weekly AI summary of your campaign performance">
          <Toggle on={settings.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
        </SettingRow>
        <SettingRow label="ROAS alert threshold" desc="Notify when ROAS drops below your target">
          <div className="flex items-center gap-2">
            <Toggle on={settings.roasAlert} onChange={() => toggle('roasAlert')} />
            {settings.roasAlert && <input type="number" defaultValue={3.0} step={0.1}
              className="rounded-lg border px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--teal)] w-20" style={selectStyle} />}
          </div>
        </SettingRow>
        <SettingRow label="Show ROAS as currency multiplier" desc="Display as 4.2x instead of 420%">
          <Toggle on={settings.showROASAsCurrency} onChange={() => toggle('showROASAsCurrency')} />
        </SettingRow>
      </Card>
      <Card className="mb-4">
        <div className="text-[13px] font-semibold mb-3 pb-3 border-b" style={{ borderColor:'var(--border)' }}>Notifications</div>
        <SettingRow label="Email notifications" desc="Send alerts and weekly reports to your email">
          <Toggle on={settings.emailNotifs} onChange={() => toggle('emailNotifs')} />
        </SettingRow>
        {settings.emailNotifs && (
          <div className="py-2">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Notification email</label>
            <input type="email" placeholder="you@company.com"
              className="rounded-lg border px-3 py-2 text-[13px] outline-none focus:border-[var(--teal)] w-72" style={selectStyle} />
          </div>
        )}
        <SettingRow label="Slack integration" desc="Send campaign alerts to a Slack channel">
          <div className="flex items-center gap-2">
            <Toggle on={settings.slackIntegration} onChange={() => toggle('slackIntegration')} />
            {!settings.slackIntegration && <Button size="sm">Connect Slack</Button>}
          </div>
        </SettingRow>
      </Card>
      <Card className="mb-4">
        <div className="text-[13px] font-semibold mb-3 pb-3 border-b" style={{ borderColor:'var(--border)' }}>Data & Import</div>
        <SettingRow label="Auto-map CSV columns" desc="Automatically detect and map CSV column headers on import">
          <Toggle on={settings.csvAutoMap} onChange={() => toggle('csvAutoMap')} />
        </SettingRow>
        <SettingRow label="Clear all data" desc="Permanently delete all campaign data from your workspace">
          <Button size="sm"><span style={{ color:'var(--danger)' }}>Clear Data</span></Button>
        </SettingRow>
      </Card>
      <div className="flex justify-end gap-2 mt-6">
        <Button>Discard Changes</Button>
        <Button variant="primary">Save Settings</Button>
      </div>
    </>
  )
}
