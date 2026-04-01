import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsesolutions.co'
  const redirectUri = `${appUrl}/api/oauth/google/callback`

  if (!code) return NextResponse.redirect(`${appUrl}/import?error=google_denied`)

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri, grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token')

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const userData = await userRes.json()

    await supabase.from('connected_accounts').upsert({
      user_id: userId, platform: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      account_name: userData.email || 'Google Account',
      account_id: userData.id,
      expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${appUrl}/import?connected=google`)
  } catch (e: any) {
    console.error('Google OAuth error:', e)
    return NextResponse.redirect(`${appUrl}/import?error=google_failed`)
  }
}