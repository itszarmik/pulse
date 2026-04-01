import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect('/sign-in')

  const code = req.nextUrl.searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsesolutions.co'
  const redirectUri = `${appUrl}/api/oauth/meta/callback`

  if (!code) return NextResponse.redirect(`${appUrl}/import?error=meta_denied`)

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`)
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error('No access token')

    // Get long-lived token
    const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`)
    const longData = await longRes.json()

    // Get user info
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${longData.access_token || tokenData.access_token}`)
    const userData = await userRes.json()

    // Save to Supabase
    await supabase.from('connected_accounts').upsert({
      user_id: userId,
      platform: 'meta',
      access_token: longData.access_token || tokenData.access_token,
      account_name: userData.name || 'Meta Account',
      account_id: userData.id,
      expires_at: longData.expires_in ? new Date(Date.now() + longData.expires_in * 1000).toISOString() : null,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${appUrl}/import?connected=meta`)
  } catch (e: any) {
    console.error('Meta OAuth error:', e)
    return NextResponse.redirect(`${appUrl}/import?error=meta_failed`)
  }
}