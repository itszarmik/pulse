import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function ReportPage({ params }: { params: { token: string } }) {
  const { data: report } = await supabase
    .from('client_reports')
    .select('*')
    .eq('token', params.token)
    .single()

  if (!report) return notFound()

  const d = report.data
  const generatedDate = new Date(d.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const camps = d.campaigns || []
  const topCamps = [...camps].sort((a: any, b: any) => b.roas - a.roas).slice(0, 5)

  return (
    <div style={{ background: '#0d0f14', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#e8eaf0' }}>

      {/* Header */}
      <div style={{ background: '#13161d', borderBottom: '1px solid #1e2130', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#00d4a0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
          </div>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>Pulse</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{report.client_name}</div>
          <div style={{ fontSize: 12, color: '#8b90a0', marginTop: 2 }}>Performance Report · {report.date_range} · Generated {generatedDate}</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 40px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Ad Spend', value: `£${d.totalSpend?.toLocaleString() || 0}`, color: '#e8eaf0' },
            { label: 'Revenue Generated', value: `£${d.totalRevenue?.toLocaleString() || 0}`, color: '#00d4a0' },
            { label: 'Return on Ad Spend', value: `${d.blendedROAS?.toFixed(2) || 0}x`, color: d.blendedROAS >= 3 ? '#00d4a0' : d.blendedROAS >= 2 ? '#ffaa44' : '#ff5c5c' },
            { label: 'Total Conversions', value: (d.totalConversions || 0).toLocaleString(), color: '#e8eaf0' },
          ].map((kpi, i) => (
            <div key={i} style={{ background: '#13161d', border: '1px solid #1e2130', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: '#8b90a0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace', color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        {d.aiSummary && (
          <div style={{ background: '#13161d', border: '1px solid rgba(0,212,160,0.2)', borderRadius: 12, padding: '28px 32px', marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#00d4a0' }}>✦</span> Performance Summary
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: '#c8cad4', whiteSpace: 'pre-wrap', margin: 0 }}>{d.aiSummary}</p>
          </div>
        )}

        {/* Campaign breakdown */}
        {topCamps.length > 0 && (
          <div style={{ background: '#13161d', border: '1px solid #1e2130', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e2130' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Campaign Performance</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2130' }}>
                  {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'Clicks'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCamps.map((c: any, i: number) => {
                  const roasColor = c.roas >= 4 ? '#00d4a0' : c.roas >= 2 ? '#ffaa44' : '#ff5c5c'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e2130' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 500, maxWidth: 200 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div></td>
                      <td style={{ padding: '12px 20px', color: '#8b90a0' }}>{c.platform}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace' }}>£{(c.spend || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#00d4a0' }}>£{(c.revenue || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontWeight: 700, color: roasColor }}>{Number(c.roas || 0).toFixed(1)}x</td>
                      <td style={{ padding: '12px 20px', fontFamily: 'monospace', color: '#8b90a0' }}>{(c.clicks || 0).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#8b90a0', fontSize: 12, paddingTop: 24, borderTop: '1px solid #1e2130' }}>
          <div style={{ marginBottom: 6 }}>Report generated by <span style={{ color: '#00d4a0', fontWeight: 600 }}>Pulse</span> · AI-powered campaign analytics</div>
          <div>{new Date(d.generatedAt).toLocaleString('en-GB')}</div>
        </div>
      </div>
    </div>
  )
}