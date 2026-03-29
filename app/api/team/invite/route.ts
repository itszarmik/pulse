import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role = 'editor' } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', userId)
      .eq('email', email)
      .single()

    if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 })

    // Create invite token
    const token = crypto.randomBytes(20).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('workspace_members').insert({
      workspace_id: userId,
      email,
      role,
      invite_token: token,
      status: 'pending',
      expires_at: expiresAt,
      invited_at: new Date().toISOString(),
    })

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ruddy-psi.vercel.app'
    await resend.emails.send({
      from: 'Pulse <onboarding@resend.dev>',
      to: email,
      subject: "You've been invited to join a Pulse workspace",
      html: `
<div style="background:#0d0f14;font-family:-apple-system,sans-serif;padding:40px;max-width:560px;margin:0 auto;border-radius:16px;border:1px solid #1e2130;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="width:44px;height:44px;background:#00d4a0;border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
    </div>
    <h1 style="color:#e8eaf0;font-size:22px;font-weight:700;margin:0;">You're invited to Pulse</h1>
    <p style="color:#8b90a0;font-size:14px;margin:8px 0 0;">You've been invited as a team member</p>
  </div>
  <div style="background:#13161d;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="color:#c8cad4;font-size:14px;line-height:1.6;margin:0;">
      You've been invited to collaborate on a Pulse workspace as an <strong style="color:#00d4a0;">${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.
      Click below to accept the invitation and get access to the campaign dashboard.
    </p>
  </div>
  <div style="text-align:center;margin-bottom:24px;">
    <a href="${appUrl}/invite/${token}" style="display:inline-block;background:#00d4a0;color:#001a12;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Accept Invitation →</a>
  </div>
  <p style="color:#8b90a0;font-size:12px;text-align:center;margin:0;">This invite expires in 7 days. If you didn't expect this, you can ignore it.</p>
</div>`
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('workspace_members').select('*').eq('workspace_id', userId).order('invited_at', { ascending: false })
  return NextResponse.json(data || [])
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { memberId } = await req.json()
  await supabase.from('workspace_members').delete().eq('id', memberId).eq('workspace_id', userId)
  return NextResponse.json({ success: true })
}