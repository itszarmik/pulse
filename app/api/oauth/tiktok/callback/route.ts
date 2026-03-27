import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('auth_code') || req.nextUrl.searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ruddy-psi.vercel.app'
  const redirectUri = `${appUrl}/api/oauth/tiktok/callback`

  if (!code) return NextResponse.redirect(`${appUrl}/import?error=tiktok_denied`)

  try {
    const tokenRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: process.env.TIKTOK_APP_ID, secret: process.env.TIKTOK_APP_SECRET, auth_code: code }),
    })
    const tokenData = await tokenRes.json()
    const token = tokenData?.data?.access_token
    if (!token) throw new Error('No access token')

    await supabase.from('connected_accounts').upsert({
      user_id: userId, platform: 'tiktok',
      access_token: token,
      account_name: 'TikTok Ads Account',
      account_id: tokenData?.data?.advertiser_ids?.[0] || '',
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${appUrl}/import?connected=tiktok`)
  } catch (e: any) {
    console.error('TikTok OAuth error:', e)
    return NextResponse.redirect(`${appUrl}/import?error=tiktok_failed`)
  }
}