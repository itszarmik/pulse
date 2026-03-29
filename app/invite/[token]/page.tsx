'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui'

export default function InvitePage({ params }: { params: { token: string } }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'accepting' | 'success' | 'error' | 'expired'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function check() {
      const { data: invite } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('invite_token', params.token)
        .single()

      if (!invite) { setStatus('error'); setMsg('Invite not found or already used.'); return }
      if (new Date(invite.expires_at) < new Date()) { setStatus('expired'); setMsg('This invite has expired.'); return }
      if (invite.status === 'accepted') { setStatus('success'); setMsg('Already accepted! Redirecting...'); setTimeout(() => router.push('/'), 2000); return }

      setStatus('accepting')
      setMsg(`You've been invited as ${invite.role}. Sign in to accept.`)
    }
    if (isLoaded) check()
  }, [isLoaded, params.token])

  const handleAccept = async () => {
    if (!user) { router.push(`/sign-up?redirect=/invite/${params.token}`); return }
    setStatus('loading')
    try {
      await supabase.from('workspace_members').update({
        user_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        invite_token: null,
      }).eq('invite_token', params.token)

      setStatus('success')
      setMsg('Invitation accepted! Redirecting to dashboard...')
      setTimeout(() => router.push('/'), 2000)
    } catch (e) {
      setStatus('error')
      setMsg('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="rounded-2xl border p-10 w-full max-w-md text-center" style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--teal)' }}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
        </div>
        <h1 className="text-[22px] font-bold mb-2">Join Pulse Workspace</h1>
        <p className="text-[14px] mb-6" style={{ color: 'var(--text2)' }}>{msg || 'Checking invitation...'}</p>

        {status === 'loading' && <Spinner />}

        {status === 'accepting' && (
          <button onClick={handleAccept}
            className="w-full py-3 rounded-lg text-[14px] font-semibold"
            style={{ background: 'var(--teal)', color: '#001a12' }}>
            {user ? 'Accept Invitation' : 'Sign in to Accept'}
          </button>
        )}

        {status === 'success' && (
          <div className="flex items-center justify-center gap-2" style={{ color: 'var(--teal)' }}>
            <span className="text-[20px]">✓</span>
            <span className="text-[14px] font-medium">Success!</span>
          </div>
        )}

        {(status === 'error' || status === 'expired') && (
          <div style={{ color: 'var(--danger)' }}>
            <span className="text-[14px]">{msg}</span>
          </div>
        )}
      </div>
    </div>
  )
}