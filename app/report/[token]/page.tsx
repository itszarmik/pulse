import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function ReportPage({ params }: { params: { token: string } }) {
  const { data: report } = await supabase
    .from('client_reports').select('*').eq('token', params.token).single()
  if (!report) return notFound()

  // Load brand settings for the report owner
  const { data: brand } = await supabase
    .from('brand_settings').select('*').eq('user_id', report.user_id).single()

  const d = report.data
  const generatedDate = new Date(d.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const camps = d.campaigns || []
  const topCamps = [...camps].sort((a: any, b: any) => b.roas - a.roas).slice(0, 8)

  // Brand config — use agency settings or Pulse defaults
  const agencyName = brand?.agency_name || 'Pulse'
  const brandColor = brand?.brand_color || '#00d4a0'
  const logoUrl = brand?.logo_url || ''
  const footerText = brand?.footer_text || ''
  const hidePulse = brand?.hide_pulse_branding || false
  const brandColorDim = brandColor + '22'

  return (
    <div style={{ background: '#0d0f14', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#e8eaf0' }}>

      {/* Header */}
      <div style={{ background: '#13161d', borderBottom: '1px solid #1e2130', padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {logoUrl ? (
            <img src={logoUrl} alt={agencyName} style={{ height: 36, width: 'auto', borderRadius: 6, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 36, height: 36, background: brandColor, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#001a12' }}>
              {agencyName[0]}
            </div>
          )}
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px' }}>{agencyName}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{report.client_name}</div>
          <div style={{ fontSize: 12, color: '#8b90a0', marginTop: 3 }}>
            Performance Report · {report.date_range} · Generated {generatedDate}
          </div>
        </div>
      </div>

      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${brandColor}, ${brandColor}88)` }} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 40px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Total Ad Spend', value: `£${(d.totalSpend || 0).toLocaleString()}`, color: '#e8eaf0', highlight: false },
            { label: 'Revenue Generated', value: `£${(d.totalRevenue || 0).toLocaleString()}`, color: brandColor, highlight: true },
            { label: 'Return on Ad Spend', value: `${(d.blendedROAS || 0).toFixed(2)}x`, color: (d.blendedROAS || 0) >= 3 ? brandColor : (d.blendedROAS || 0) >= 2 ? '#ffaa44' : '#ff5c5c', highlight: true },
            { label: 'Total Conversions', value: (d.totalConversions || 0).toLocaleString(), color: '#e8eaf0', highlight: false },
          ].map((kpi, i) => (
            <div key={i} style={{
              background: kpi.highlight ? brandColorDim : '#13161d',
              border: `1px solid ${kpi.highlight ? brandColor + '40' : '#1e2130'}`,
              borderRadius: 14, padding: '22px 24px'
            }}>
              <div style={{ fontSize: 11, color: '#8b90a0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: kpi.color, letterSpacing: '-1px' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        {d.aiSummary && (
          <div style={{ background: '#13161d', border: `1px solid ${brandColor}30`, borderLeft: `4px solid ${brandColor}`, borderRadius: 14, padding: '28px 32px', marginBottom: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: brandColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✦ Performance Summary
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.85, color: '#c8cad4', whiteSpace: 'pre-wrap', margin: 0 }}>{d.aiSummary}</p>
          </div>
        )}

        {/* Campaign Table */}
        {topCamps.length > 0 && (
          <div style={{ background: '#13161d', border: '1px solid #1e2130', borderRadius: 14, overflow: 'hidden', marginBottom: 36 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e2130', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Campaign Performance</div>
              <div style={{ fontSize: 11, color: '#8b90a0' }}>{topCamps.length} campaigns</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2130' }}>
                  {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'Clicks', 'CVR'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 10, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCamps.map((c: any, i: number) => {
                  const roasColor = c.roas >= 4 ? brandColor : c.roas >= 2 ? '#ffaa44' : '#ff5c5c'
                  const cvr = c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(1) : '—'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1e2130', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '13px 20px', fontWeight: 600, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '13px 20px', color: '#8b90a0' }}>{c.platform}</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'monospace' }}>£{(c.spend || 0).toLocaleString()}</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: brandColor }}>£{(c.revenue || 0).toLocaleString()}</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'monospace', fontWeight: 700, color: roasColor }}>{Number(c.roas || 0).toFixed(1)}x</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: '#8b90a0' }}>{(c.clicks || 0).toLocaleString()}</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: '#8b90a0' }}>{cvr}{cvr !== '—' ? '%' : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#8b90a0', fontSize: 12, paddingTop: 28, borderTop: '1px solid #1e2130' }}>
          {footerText && <div style={{ marginBottom: 6, color: '#c8cad4', fontWeight: 500 }}>{footerText}</div>}
          {!hidePulse && (
            <div style={{ marginBottom: 6 }}>
              Powered by <span style={{ color: brandColor, fontWeight: 600 }}>Pulse</span> · AI-powered campaign analytics
            </div>
          )}
          <div>{new Date(d.generatedAt).toLocaleString('en-GB')}</div>
        </div>
      </div>
    </div>
  )
}