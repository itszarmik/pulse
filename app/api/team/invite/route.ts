import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, role } = await req.json()
  if (!email || !role) return NextResponse.json({ error: 'Email and role required' }, { status: 400 })

  // Check if already invited
  const { data: existing } = await supabase
    .from('team_members').select('id').eq('workspace_owner_id', userId).eq('email', email).single()
  if (existing) return NextResponse.json({ error: 'This email has already been invited' }, { status: 400 })

  // Check plan limits
  const { data: plan } = await supabase.from('user_plans').select('plan').eq('user_id', userId).single()
  const { count } = await supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('workspace_owner_id', userId)
  const limits: Record<string, number> = { free: 0, starter: 2, pro: 10, agency: 999 }
  const userPlan = plan?.plan || 'free'
  if ((count || 0) >= (limits[userPlan] || 0)) {
    return NextResponse.json({ error: `Your ${userPlan} plan allows ${limits[userPlan]} team members. Upgrade to add more.` }, { status: 403 })
  }

  const inviteToken = crypto.randomBytes(20).toString('hex')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulse-ruddy-psi.vercel.app'

  const { data, error } = await supabase.from('team_members').insert({
    workspace_owner_id: userId,
    email: email.toLowerCase().trim(),
    role,
    invite_token: inviteToken,
    status: 'pending',
    invited_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send invite email via Resend
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Pulse <onboarding@resend.dev>',
      to: email,
      subject: 'You have been invited to join a Pulse workspace',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:40px auto;background:#13161d;border-radius:12px;padding:40px;border:1px solid #1e2130;color:#e8eaf0">
        <div style="text-align:center;margin-bottom:24px">
          <div style="width:40px;height:40px;background:#00d4a0;border-radius:10px;display:inline-flex;align-items:center;justify-content:center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/></svg>
          </div>
          <div style="font-size:18px;font-weight:700;margin-top:12px">You're invited to Pulse</div>
        </div>
        <p style="color:#c8cad4;font-size:14px;line-height:1.6">You've been invited to join a workspace on Pulse as a <strong style="color:#00d4a0">${role}</strong>. Click below to accept your invite and access the dashboard.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${appUrl}/team/accept?token=${inviteToken}" style="background:#00d4a0;color:#001a12;padding:14px 32px;border-radius:10px;font-weight:600;text-decoration:none;font-size:14px">Accept Invitation →</a>
        </div>
        <p style="color:#8b90a0;font-size:12px;text-align:center">This invite expires in 7 days.</p>
      </div>`
    })
  } catch(e) { console.error('Email error:', e) }

  return NextResponse.json(data)
}