'use client'
import { useState } from 'react'
import { TrendingUp, DollarSign, MousePointer, CheckCircle } from 'lucide-react'
import { KpiCard, Button, Card, PageHeader } from '@/components/ui'
import { SpendRevenueChart } from '@/components/charts/SpendRevenueChart'
import { PlatformDonut } from '@/components/charts/PlatformDonut'
import { CampaignTable } from '@/components/CampaignTable'
import { generateDailyMetrics } from '@/lib/data'

const dailyData = generateDailyMetrics(30)

const AI_INSIGHTS = [
  { type: 'success', title: '🟢 Strong ROAS on Meta', body: 'Your Meta campaigns are returning 5.1x ROAS — 21% above benchmark. Consider increasing budget allocation by 15–20%.' },
  { type: 'warning', title: '🟡 TikTok CPM rising', body: 'TikTok CPM increased 34% this month. Creative fatigue likely. Recommend refreshing ad variants — try the Variants Generator.' },
  { type: 'info', title: '💡 Google Search underutilised', body: 'Your Google brand campaigns have only 3 active keywords. Expanding to 8–12 long-tail terms could reduce CPC by up to 22%.' },
]

const INSIGHT_STYLES: Record<string, { border: string; title: string }> = {
  success: { border: 'var(--teal)', title: 'var(--teal)' },
  warning: { border: 'var(--warn)', title: 'var(--warn)' },
  info: { border: 'var(--purple)', title: 'var(--purple)' },
}

export default function DashboardPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [dateRange, setDateRange] = useState('Last 30 days')

  const handleAnalyze = async () => {
    setAnalyzing(true)
    await new Promise(r => setTimeout(r, 2200))
    setAnalyzing(false)
    setShowInsights(true)
  }

  return (
    <>
      <PageHeader title="Campaign Dashboard" subtitle="AI-powered performance overview across all connected platforms">
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="text-[13px] px-2.5 py-2 rounded-[7px] border outline-none focus:border-[var(--teal)]"
          style={{ background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }}>
          {['Last 7 days','Last 30 days','Last 90 days','This month'].map(o => <option key={o}>{o}</option>)}
        </select>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin inline-block"
              style={{ borderColor:'var(--border2)', borderTopColor:'var(--teal)' }} />Analysing...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="currentColor" />
            </svg>Run AI Analysis</>
          )}
        </Button>
        <Button variant="primary">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Import Data
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-3.5 mb-7">
        <KpiCard label="ROAS" value="4.2x" change={0.4} changeLabel="0.4x from last period" icon={<TrendingUp size={14} />} highlight />
        <KpiCard label="Total Ad Spend" value="£24,830" change={-3.2} changeLabel="3.2% from last period" icon={<DollarSign size={14} />} />
        <KpiCard label="Total Clicks" value="142K" change={12.1} changeLabel="12.1% from last period" icon={<MousePointer size={14} />} />
        <KpiCard label="Conversions" value="2,194" change={8.7} changeLabel="8.7% from last period" icon={<CheckCircle size={14} />} />
      </div>

      {showInsights && (
        <Card className="mb-7">
          <div className="flex items-center gap-2 mb-3.5">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" fill="var(--teal)" />
            </svg>
            <span className="text-[13px] font-semibold">AI Analysis</span>
            <span className="text-[11px] font-semibold px-2 py-[2px] rounded" style={{ background:'var(--teal-dim)', color:'var(--teal)' }}>Just now</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {AI_INSIGHTS.map((insight, i) => (
              <div key={i} className="rounded-lg p-3.5 border-l-[3px]"
                style={{ background:'var(--bg3)', borderLeftColor: INSIGHT_STYLES[insight.type].border }}>
                <div className="text-[12px] font-semibold mb-1" style={{ color: INSIGHT_STYLES[insight.type].title }}>{insight.title}</div>
                <div className="text-[11px] leading-relaxed" style={{ color:'var(--text2)' }}>{insight.body}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-[2fr_1fr] gap-3.5 mb-7">
        <Card>
          <div className="text-[13px] font-semibold mb-0.5">Spend vs Revenue — {dateRange}</div>
          <div className="text-[11px] mb-4" style={{ color:'var(--text2)' }}>Daily ad spend against attributed revenue</div>
          <SpendRevenueChart data={dailyData} />
        </Card>
        <Card>
          <div className="text-[13px] font-semibold mb-0.5">Platform breakdown</div>
          <div className="text-[11px] mb-4" style={{ color:'var(--text2)' }}>Spend share by platform</div>
          <PlatformDonut />
        </Card>
      </div>

      <CampaignTable />
    </>
  )
}
