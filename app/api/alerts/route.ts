import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: alerts } = await supabase.from('alerts').select('*').eq('user_id', userId).order('triggered_at', { ascending: false }).limit(50)
  const { data: rules } = await supabase.from('alert_rules').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return NextResponse.json({ alerts: alerts || [], rules: rules || [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.action === 'create_rule') {
    const { data } = await supabase.from('alert_rules').insert({ ...body.rule, user_id: userId }).select().single()
    return NextResponse.json(data)
  }
  if (body.action === 'toggle_rule') {
    const { data } = await supabase.from('alert_rules').update({ enabled: body.enabled }).eq('id', body.id).eq('user_id', userId).select().single()
    return NextResponse.json(data)
  }
  if (body.action === 'delete_rule') {
    await supabase.from('alert_rules').delete().eq('id', body.id).eq('user_id', userId)
    return NextResponse.json({ deleted: true })
  }
  if (body.action === 'mark_read') {
    await supabase.from('alerts').update({ read: true }).eq('id', body.id).eq('user_id', userId)
    return NextResponse.json({ updated: true })
  }
  if (body.action === 'mark_all_read') {
    await supabase.from('alerts').update({ read: true }).eq('user_id', userId)
    return NextResponse.json({ updated: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}