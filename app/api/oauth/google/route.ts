import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ruddy-psi.vercel.app'
  const redirectUri = `${appUrl}/api/oauth/google/callback`
  const scope = 'https://www.googleapis.com/auth/adwords'
  const state = Math.random().toString(36).slice(2)
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent&state=${state}`
  return NextResponse.redirect(url)
}