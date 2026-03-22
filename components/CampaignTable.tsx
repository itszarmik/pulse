'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { StatusBadge } from '@/components/ui'
import { CAMPAIGNS } from '@/lib/data'
import type { Platform } from '@/types'

const PLATFORM_DOTS: Record<Platform, string> = { Meta:'#1877f2', Google:'#ea4335', TikTok:'#00d4a0', CSV:'#888' }

function RoasValue({ roas }: { roas: number }) {
  const color = roas >= 4 ? 'var(--teal)' : roas >= 2.5 ? 'var(--warn)' : 'var(--danger)'
  return <span className="font-mono text-[12px] font-semibold" style={{ color }}>{roas.toFixed(1)}x</span>
}

export function CampaignTable() {
  const [platformFilter, setPlatformFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('')

  const filtered = CAMPAIGNS.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    const pf = activeTab || platformFilter
    if (pf && c.platform !== pf) return false
    return true
  })

  const tabs = [
    { label: 'All Platforms', value: '' },
    { label: 'Meta Ads', value: 'Meta', dot: '#1877f2' },
    { label: 'Google Ads', value: 'Google', dot: '#ea4335' },
    { label: 'TikTok Ads', value: 'TikTok', dot: '#00d4a0' },
  ]

  const selectStyle = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[15px] font-semibold">All Campaigns</span>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={selectStyle}>
            <option value="">All Statuses</option>
            <option>Active</option><option>Paused</option><option>Ended</option>
          </select>
          <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setActiveTab(e.target.value) }}
            className="text-[12px] px-2.5 py-1.5 rounded-[7px] border outline-none focus:border-[var(--teal)]" style={selectStyle}>
            <option value="">All Platforms</option>
            <option>Meta</option><option>Google</option><option>TikTok</option>
          </select>
        </div>
      </div>
      <div className="flex gap-1 mb-3">
        {tabs.map(t => (
          <button key={t.value} onClick={() => { setActiveTab(t.value); setPlatformFilter(t.value) }}
            className={clsx('flex items-center gap-1.5 px-3 py-[5px] rounded-md text-[12px] font-medium border transition-all',
              activeTab === t.value ? 'text-[var(--teal)] bg-[var(--teal-dim)] border-[var(--teal-dim2)]' : 'text-[var(--text2)] border-transparent hover:text-[var(--text)] hover:bg-[var(--bg3)]')}>
            {(t as any).dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: (t as any).dot }} />}
            {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg2)' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text3)' }}>No campaigns match your filters.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Campaign','Platform','Status','Spend','Clicks','Conv.','ROAS','Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color: 'var(--text2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="transition-colors hover:bg-[var(--bg3)]" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-3 py-3 font-medium">{c.name}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_DOTS[c.platform] }} />
                      {c.platform}
                    </span>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3">£{c.spend.toLocaleString()}</td>
                  <td className="px-3 py-3">{(c.clicks/1000).toFixed(1)}K</td>
                  <td className="px-3 py-3">{c.conversions.toLocaleString()}</td>
                  <td className="px-3 py-3"><RoasValue roas={c.roas} /></td>
                  <td className="px-3 py-3">
                    <button className="px-2.5 py-1 rounded-[5px] border text-[11px] transition-colors"
                      style={{ borderColor:'var(--border)', background:'transparent', color:'var(--text2)' }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--bg3)'; e.currentTarget.style.color='var(--text)' }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text2)' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
