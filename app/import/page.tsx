'use client'
import { useState } from 'react'
import { PageHeader, Button, Card } from '@/components/ui'

type PlatformId = 'meta' | 'google' | 'tiktok'

const PLATFORMS = [
  { id: 'meta' as PlatformId, name: 'Meta Ads', desc: 'Facebook & Instagram', bg: '#1877f2', label: 'f' },
  { id: 'google' as PlatformId, name: 'Google Ads', desc: 'Search & Display', bg: '#fff', label: 'G', textColor: '#ea4335', border: true },
  { id: 'tiktok' as PlatformId, name: 'TikTok Ads', desc: 'Short-form Video', bg: '#010101', label: 'TT', border: true, borderColor: '#333' },
]

export default function ImportPage() {
  const [connected, setConnected] = useState<Record<PlatformId, boolean>>({ meta:false, google:false, tiktok:false })
  const [csvState, setCsvState] = useState<'idle'|'uploading'|'done'>('idle')
  const [dragging, setDragging] = useState(false)

  const handleConnect = (id: PlatformId) => setConnected(prev => ({ ...prev, [id]: !prev[id] }))
  const handleCsvClick = () => { setCsvState('uploading'); setTimeout(() => setCsvState('done'), 1400) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); handleCsvClick() }

  return (
    <>
      <PageHeader title="Data Import & Connections" subtitle="Connect ad platforms or upload campaign data via CSV to power your dashboard">
        <Button variant="primary">+ New Client Account</Button>
      </PageHeader>

      <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold" style={{ color:'var(--text2)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Connected Ad Platforms
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-7">
        {PLATFORMS.map(p => (
          <Card key={p.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg"
                  style={{ background:p.bg, color:(p as any).textColor||'white', border:(p as any).border?'1px solid '+((p as any).borderColor||'var(--border2)'):'none' }}>
                  {p.label}
                </div>
                <div>
                  <div className="text-[14px] font-semibold">{p.name}</div>
                  <div className="text-[11px]" style={{ color:'var(--text2)' }}>{p.desc}</div>
                </div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full transition-all"
                style={{ background:connected[p.id]?'var(--teal)':'var(--border2)', boxShadow:connected[p.id]?'0 0 8px rgba(0,212,160,0.4)':'none' }} />
            </div>
            {connected[p.id] && (
              <div className="text-[11px] mb-3 px-2.5 py-1.5 rounded-md" style={{ background:'var(--teal-dim)', color:'var(--teal)' }}>
                ✓ Connected — syncing data
              </div>
            )}
            <div className="flex gap-2 mt-3.5">
              <Button variant={connected[p.id]?'default':'primary'} size="sm" onClick={() => handleConnect(p.id)}>
                {connected[p.id] ? 'Disconnect' : '🔗 Connect'}
              </Button>
              {connected[p.id] && <Button size="sm">Sync Now</Button>}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold" style={{ color:'var(--text2)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 6h10M6 6v6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        CSV Import
      </div>

      <div onClick={handleCsvClick} onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)} onDrop={handleDrop}
        className="rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all"
        style={{ borderColor:dragging||csvState==='done'?'var(--teal)':'var(--border2)', background:dragging||csvState==='done'?'rgba(0,212,160,0.04)':'var(--bg2)' }}>
        {csvState==='idle' && <>
          <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 8v16M13 18l7-7 7 7M8 30h24" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="text-[15px] font-medium mb-1.5">Drag & drop your CSV file here</div>
          <div className="text-[12px]" style={{ color:'var(--text2)' }}>or click to browse your files — .csv format only</div>
        </>}
        {csvState==='uploading' && <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-t-transparent animate-spin"
            style={{ borderColor:'var(--border2)', borderTopColor:'var(--teal)' }} />
          <div className="text-[13px]" style={{ color:'var(--text2)' }}>Uploading...</div>
        </div>}
        {csvState==='done' && <>
          <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" stroke="var(--teal)" strokeWidth="2" />
            <path d="M13 20l5 5 9-9" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-[15px] font-medium mb-1" style={{ color:'var(--teal)' }}>campaigns_june_2025.csv uploaded</div>
          <div className="text-[12px]" style={{ color:'var(--text2)' }}>248 rows imported successfully · Click to upload another file</div>
        </>}
      </div>

      <Card className="mt-4">
        <div className="text-[13px] font-semibold mb-3">Expected CSV format</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['campaign_name','platform','status','spend','clicks','conversions','revenue','start_date'].map(col => (
                  <th key={col} className="text-left py-2 pr-4 font-mono" style={{ color:'var(--teal)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {['Summer Sale','meta','active','6240.00','41200','620','31824.00','2025-06-01'].map((v,i) => (
                  <td key={i} className="py-2 pr-4" style={{ color:'var(--text2)' }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3"><Button size="sm">Download template CSV</Button></div>
      </Card>
    </>
  )
}
