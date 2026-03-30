import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({})
  const { data } = await supabase.from('brand_settings').select('*').eq('user_id', userId).single()
  return NextResponse.json(data || {})
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabase.from('brand_settings').upsert({
    user_id: userId,
    agency_name: body.agency_name || '',
    logo_url: body.logo_url || '',
    brand_color: body.brand_color || '#00d4a0',
    footer_text: body.footer_text || '',
    hide_pulse_branding: body.hide_pulse_branding || false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}