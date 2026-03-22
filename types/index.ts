export type Platform = 'Meta' | 'Google' | 'TikTok' | 'CSV'
export type CampaignStatus = 'Active' | 'Paused' | 'Ended'

export interface Campaign {
  id: string
  name: string
  platform: Platform
  status: CampaignStatus
  spend: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number
  cpc: number
  cpm: number
  objective: string
  startDate: string
  endDate?: string
}

export interface KpiData {
  roas: number
  roasChange: number
  totalSpend: number
  spendChange: number
  totalClicks: number
  clicksChange: number
  conversions: number
  conversionsChange: number
}

export interface DailyMetric {
  date: string
  spend: number
  revenue: number
  clicks: number
  conversions: number
}

export interface AdVariant {
  headline: string
  body: string
  cta: string
  imageDirection: string
  engagementScore: number
  clarityScore: number
  hookScore: number
}

export interface ClientAccount {
  id: string
  name: string
  initials: string
  platforms: Platform[]
  monthlySpend: number
  status: CampaignStatus
  campaigns: number
  roas: number
}

export interface AIInsight {
  type: 'success' | 'warning' | 'info'
  title: string
  body: string
  action?: string
}
