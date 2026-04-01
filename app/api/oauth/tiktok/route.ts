import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appId = process.env.TIKTOK_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsesolutions.co'
  const redirectUri = `${appUrl}/api/oauth/tiktok/callback`
  const state = Math.random().toString(36).slice(2)
  const url = `https://ads.tiktok.com/marketing_api/auth?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  return NextResponse.redirect(url)
}