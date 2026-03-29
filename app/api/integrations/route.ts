import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('integrations').select('*').eq('user_id', userId)
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { platform, shop_domain } = await req.json()
  if (!platform || !shop_domain) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const webhook_secret = crypto.randomBytes(24).toString('hex')
  const { data, error } = await supabase.from('integrations').upsert({
    user_id: userId, platform,
    shop_domain: shop_domain.replace(/https?:\/\//, '').replace(/\/$/, ''),
    webhook_secret,
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { platform } = await req.json()
  await supabase.from('integrations').delete().eq('user_id', userId).eq('platform', platform)
  return NextResponse.json({ ok: true })
}