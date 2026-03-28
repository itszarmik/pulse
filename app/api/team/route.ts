import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('team_members').select('*').eq('workspace_owner_id', userId).order('invited_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('team_members').delete().eq('id', id).eq('workspace_owner_id', userId)
  return NextResponse.json({ deleted: true })
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, role } = await req.json()
  const { data } = await supabase.from('team_members').update({ role }).eq('id', id).eq('workspace_owner_id', userId).select().single()
  return NextResponse.json(data)
}