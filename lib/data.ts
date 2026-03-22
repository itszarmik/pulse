import type { Campaign, KpiData, DailyMetric, ClientAccount } from '@/types'

export const CAMPAIGNS: Campaign[] = [
  { id:'1', name:'Summer Sale 2025', platform:'Meta', status:'Active', spend:6240, clicks:41200, conversions:620, revenue:31824, roas:5.1, ctr:3.2, cpc:0.15, cpm:4.8, objective:'Conversions', startDate:'2025-06-01' },
  { id:'2', name:'Brand Awareness Q2', platform:'Google', status:'Active', spend:4800, clicks:28400, conversions:340, revenue:18240, roas:3.8, ctr:2.1, cpc:0.17, cpm:3.6, objective:'Awareness', startDate:'2025-04-01' },
  { id:'3', name:'Q4 UGC Push', platform:'TikTok', status:'Active', spend:3100, clicks:38600, conversions:290, revenue:8990, roas:2.9, ctr:4.8, cpc:0.08, cpm:2.1, objective:'Traffic', startDate:'2025-10-01' },
  { id:'4', name:'Retargeting — Cart Abandoners', platform:'Meta', status:'Active', spend:2900, clicks:14300, conversions:480, revenue:17980, roas:6.2, ctr:5.1, cpc:0.2, cpm:7.2, objective:'Conversions', startDate:'2025-03-01' },
  { id:'5', name:'Google Shopping — Core', platform:'Google', status:'Paused', spend:5400, clicks:12800, conversions:310, revenue:16740, roas:3.1, ctr:1.4, cpc:0.42, cpm:5.9, objective:'Sales', startDate:'2025-01-15' },
  { id:'6', name:'Creator Collab April', platform:'TikTok', status:'Ended', spend:2390, clicks:7100, conversions:154, revenue:4541, roas:1.9, ctr:2.9, cpc:0.34, cpm:4.4, objective:'Conversions', startDate:'2025-04-01', endDate:'2025-04-30' },
]

export const KPI_DATA: KpiData = { roas:4.2, roasChange:0.4, totalSpend:24830, spendChange:-3.2, totalClicks:142400, clicksChange:12.1, conversions:2194, conversionsChange:8.7 }

export function generateDailyMetrics(days = 30): DailyMetric[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const spend = 600 + Math.random() * 600
    const roas = 3.5 + Math.random() * 2
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      spend: Math.round(spend),
      revenue: Math.round(spend * roas),
      clicks: Math.round(3000 + Math.random() * 3000),
      conversions: Math.round(40 + Math.random() * 80),
    }
  })
}

export const CLIENT_ACCOUNTS: ClientAccount[] = [
  { id:'1', name:'NovaBrew Coffee', initials:'NB', platforms:['Meta','Google'], monthlySpend:12400, status:'Active', campaigns:4, roas:4.8 },
  { id:'2', name:'FlexLoop Fitness', initials:'FL', platforms:['Meta','TikTok'], monthlySpend:6200, status:'Active', campaigns:3, roas:3.9 },
  { id:'3', name:'Veldt Design Studio', initials:'VD', platforms:['Google'], monthlySpend:3100, status:'Paused', campaigns:2, roas:2.7 },
  { id:'4', name:'Orbit Skincare', initials:'OS', platforms:['Meta','Google','TikTok'], monthlySpend:8900, status:'Active', campaigns:6, roas:5.2 },
]

export function formatCurrency(n: number, currency = '£') {
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`
  return `${currency}${n.toLocaleString()}`
}

export function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n.toLocaleString()
}
