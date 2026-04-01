import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulsesolutions.co'}/api/oauth/meta/callback`
  const scope = 'ads_read,ads_management,business_management,read_insights'
  const state = Math.random().toString(36).slice(2)
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`
  return NextResponse.redirect(url)
}