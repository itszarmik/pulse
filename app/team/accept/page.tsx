'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui'
import Link from 'next/link'
import { Suspense } from 'react'

function AcceptContent() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'login'>('loading')
  const [error, setError] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setStatus('login'); return }
    acceptInvite()
  }, [user, isLoaded])

  const acceptInvite = async () => {
    if (!token) { setStatus('error'); setError('Invalid invite link'); return }
    setStatus('accepting')
    try {
      // Find and accept the invite
      const { data: invite, error: fetchErr } = await supabase
        .from('team_members').select('*').eq('invite_token', token).single()
      if (fetchErr || !invite) { setStatus('error'); setError('Invite not found or already used'); return }
      if (invite.status === 'accepted') { router.push('/'); return }

      await supabase.from('team_members').update({
        status: 'accepted', member_user_id: user?.id, accepted_at: new Date().toISOString()
      }).eq('invite_token', token)

      setStatus('success')
      setTimeout(() => router.push('/'), 2500)
    } catch(e: any) { setStatus('error'); setError(e.message) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--teal)' }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
        </div>
        {status === 'loading' || status === 'accepting' ? (
          <><div className="text-[18px] font-bold mb-2">Accepting your invite...</div><Spinner/></>
        ) : status === 'success' ? (
          <><div className="text-[18px] font-bold mb-2" style={{ color: 'var(--teal)' }}>✓ Invite accepted!</div><p className="text-[13px]" style={{ color: 'var(--text2)' }}>Redirecting to your workspace...</p></>
        ) : status === 'login' ? (
          <><div className="text-[18px] font-bold mb-3">Sign in to accept your invite</div><p className="text-[13px] mb-5" style={{ color: 'var(--text2)' }}>You need a Pulse account to accept this invitation.</p><Link href={"/sign-up?redirect_url=" + encodeURIComponent("/team/accept?token=" + token)} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold no-underline" style={{ background: 'var(--teal)', color: '#001a12' }}>Create account & accept →</Link></>
        ) : (
          <><div className="text-[18px] font-bold mb-2" style={{ color: 'var(--danger)' }}>Invite error</div><p className="text-[13px]" style={{ color: 'var(--text2)' }}>{error}</p></>
        )}
      </div>
    </div>
  )
}

export default function AcceptPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner/></div>}><AcceptContent/></Suspense>
}