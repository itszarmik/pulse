'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { FileText, Copy, Check, Plus, ExternalLink, Trash2, Clock } from 'lucide-react'

type Report = {
  id: string
  client_name: string
  date_range: string
  token: string
  created_at: string
  data: any
}

type Client = { id: string; name: string; initials: string }

function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/report/${token}`
  const copy = () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all"
      style={{ borderColor: copied ? 'rgba(0,212,160,0.4)' : 'var(--border2)', color: copied ? 'var(--teal)' : 'var(--text2)', background: copied ? 'var(--teal-dim)' : 'transparent' }}>
      {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Copy link</>}
    </button>
  )
}

export default function ReportsPage() {
  const { user } = useUser()
  const [reports, setReports] = useState<Report[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [customName, setCustomName] = useState('')
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [newReport, setNewReport] = useState<Report | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const [{ data: r }, { data: c }] = await Promise.all([
        supabase.from('client_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('client_accounts').select('id,name,initials').eq('user_id', user.id),
      ])
      setReports(r || [])
      setClients(c || [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const client = clients.find(c => c.id === selectedClient)
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient || null,
          clientName: customName || client?.name || 'Campaign Report',
          dateRange,
        })
      })
      const data = await res.json()
      if (data.token) {
        const { data: r } = await supabase.from('client_reports').select('*').eq('token', data.token).single()
        if (r) { setReports(prev => [r, ...prev]); setNewReport(r) }
        setShowModal(false); setCustomName(''); setSelectedClient('')
      }
    } catch(e) { console.error(e) }
    finally { setGenerating(false) }
  }

  const deleteReport = async (id: string) => {
    await supabase.from('client_reports').delete().eq('id', id)
    setReports(prev => prev.filter(r => r.id !== id))
  }

  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24 gap-3" style={{color:'var(--text2)'}}><Spinner/></div>

  return (
    <>
      <PageHeader title="Client Reports"
        subtitle="Generate one-click shareable performance reports for your clients. They get a professional view — you get 4 hours back.">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={14}/> Generate Report
        </Button>
      </PageHeader>

      {/* New report banner */}
      {newReport && (
        <div className="mb-6 p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'rgba(0,212,160,0.06)', borderColor: 'rgba(0,212,160,0.3)' }}>
          <div>
            <div className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--teal)' }}>✓ Report generated for {newReport.client_name}</div>
            <div className="text-[12px]" style={{ color: 'var(--text2)' }}>Share this link directly with your client — no login required</div>
          </div>
          <div className="flex items-center gap-2">
            <CopyLink token={newReport.token} />
            <a href={`/report/${newReport.token}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border no-underline"
              style={{ borderColor: 'rgba(0,212,160,0.3)', color: 'var(--teal)', background: 'var(--teal-dim)' }}>
              <ExternalLink size={11}/> Preview
            </a>
          </div>
        </div>
      )}

      {/* How it works */}
      {reports.length === 0 && (
        <div className="rounded-xl border p-8 text-center mb-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <FileText size={32} className="mx-auto mb-4" style={{ color: 'var(--text3)' }} />
          <div className="text-[16px] font-bold mb-2">Generate your first client report</div>
          <p className="text-[13px] max-w-md mx-auto mb-6" style={{ color: 'var(--text2)' }}>
            One click generates a professional, branded performance report with AI analysis. Share a link directly with your client — no login needed.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
            {[
              { num: '1', title: 'Click Generate', desc: 'Select a client and date range' },
              { num: '2', title: 'AI writes the summary', desc: 'Claude analyses and writes a professional narrative' },
              { num: '3', title: 'Share the link', desc: 'Client sees a branded report instantly' },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--bg3)' }}>
                <div className="text-[20px] font-bold mb-2" style={{ color: 'var(--teal)' }}>{s.num}</div>
                <div className="text-[12px] font-semibold mb-1">{s.title}</div>
                <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>Generate first report</Button>
        </div>
      )}

      {/* Reports list */}
      {reports.length > 0 && (
        <div className="flex flex-col gap-3">
          {reports.map(report => {
            const d = report.data
            return (
              <div key={report.id} className="rounded-xl border p-5 flex items-center gap-5"
                style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--bg3)' }}>
                  <FileText size={18} style={{ color: 'var(--teal)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{report.client_name}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px]" style={{ color: 'var(--text2)' }}>
                    <span>{report.date_range}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={10}/> {new Date(report.created_at).toLocaleDateString('en-GB')}</span>
                    {d?.blendedROAS > 0 && <><span>·</span><span className="font-mono" style={{ color: 'var(--teal)' }}>{d.blendedROAS?.toFixed(1)}x ROAS</span></>}
                    {d?.totalSpend > 0 && <><span>·</span><span>£{d.totalSpend?.toLocaleString()} spend</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CopyLink token={report.token} />
                  <a href={`/report/${report.token}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border no-underline"
                    style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                    <ExternalLink size={11}/> View
                  </a>
                  <button onClick={() => deleteReport(report.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg4)] transition-colors" style={{ color: 'var(--text3)' }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => setShowModal(false)}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">Generate Client Report</div>
            <p className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>Claude will write a professional performance summary and create a shareable link.</p>

            <div className="flex flex-col gap-4">
              {clients.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Client account (optional)</label>
                  <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none" style={is}>
                    <option value="">All campaigns</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Report name</label>
                <input value={customName} onChange={e => setCustomName(e.target.value)} autoFocus
                  placeholder={clients.find(c => c.id === selectedClient)?.name || 'e.g. Nike UK — July Report'}
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is}/>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Date range</label>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none" style={is}>
                  {['Last 7 days', 'Last 30 days', 'Last 90 days', 'This month', 'Last month', 'This quarter'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg" style={{ background: 'var(--bg3)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--teal)' }}>What gets included:</strong> KPI summary, AI-written performance narrative, campaign breakdown table, and recommendations for next month.
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerate} disabled={generating}>
                {generating ? <><Spinner size={13}/> Generating with AI...</> : '✦ Generate Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}