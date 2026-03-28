'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { usePlan } from '@/hooks/usePlan'
import { UserPlus, Crown, Edit2, Eye, Trash2, Mail, Clock, CheckCircle, XCircle, Shield } from 'lucide-react'
import Link from 'next/link'

type Member = {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'accepted'
  member_user_id: string | null
  invited_at: string
  accepted_at: string | null
}

const ROLES = [
  { id: 'admin', label: 'Admin', icon: <Crown size={12}/>, desc: 'Full access — can invite, edit campaigns, generate reports', color: '#ffaa44' },
  { id: 'editor', label: 'Editor', icon: <Edit2 size={12}/>, desc: 'Can view and edit campaigns, run AI analysis', color: '#00d4a0' },
  { id: 'viewer', label: 'Viewer', icon: <Eye size={12}/>, desc: 'Read-only — can view dashboards and reports', color: '#8b90a0' },
]

const PLAN_LIMITS: Record<string, number> = { free: 0, starter: 2, pro: 10, agency: 999 }

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(x => x.id === role) || ROLES[2]
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: role==='admin'?'rgba(255,170,68,0.1)':role==='editor'?'rgba(0,212,160,0.1)':'rgba(139,144,160,0.1)', color: r.color }}>
      {r.icon}{r.label}
    </span>
  )
}

export default function TeamPage() {
  const { user } = useUser()
  const { plan } = usePlan()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin'|'editor'|'viewer'>('editor')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<string>('editor')

  const limit = PLAN_LIMITS[plan] || 0
  const accepted = members.filter(m => m.status === 'accepted').length
  const atLimit = accepted >= limit

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const res = await fetch('/api/team')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [user])

  const handleInvite = async () => {
    if (!email.trim()) return
    setInviting(true); setError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: email.trim(), role })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setMembers(prev => [data, ...prev])
      setSuccess(`Invite sent to ${email}!`)
      setEmail(''); setRole('editor'); setShowModal(false)
      setTimeout(() => setSuccess(''), 4000)
    } catch(e: any) { setError(e.message) }
    finally { setInviting(false) }
  }

  const handleRemove = async (id: string) => {
    await fetch('/api/team', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    await fetch('/api/team', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, role: newRole }) })
    setMembers(prev => prev.map(m => m.id === id ? {...m, role: newRole as any} : m))
    setEditingId(null)
  }

  const resendInvite = async (m: Member) => {
    await fetch('/api/team/invite', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: m.email, role: m.role }) })
    setSuccess(`Invite resent to ${m.email}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  if (loading) return <div className="flex items-center justify-center py-24"><Spinner/></div>

  return (
    <>
      <PageHeader title="Team Access" subtitle="Invite your team to collaborate on campaigns, reports and AI insights.">
        {plan === 'free' ? (
          <Link href="/billing" className="px-4 py-2 rounded-lg text-[13px] font-semibold no-underline" style={{ background: 'var(--teal)', color: '#001a12' }}>
            Upgrade to invite team
          </Link>
        ) : (
          <Button variant="primary" onClick={() => setShowModal(true)} disabled={atLimit}>
            <UserPlus size={14}/> {atLimit ? `Limit reached (${limit})` : 'Invite member'}
          </Button>
        )}
      </PageHeader>

      {success && (
        <div className="mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[13px]"
          style={{ background: 'rgba(0,212,160,0.08)', borderColor: 'rgba(0,212,160,0.25)', color: 'var(--teal)' }}>
          <CheckCircle size={14}/>{success}
        </div>
      )}

      {/* Plan usage */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] mb-2" style={{ color: 'var(--text2)' }}>Team members used</div>
          <div className="text-[22px] font-bold font-mono">{accepted}<span className="text-[14px] font-normal ml-1" style={{ color: 'var(--text2)' }}>/ {limit === 999 ? '∞' : limit}</span></div>
          <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--bg4)' }}>
            <div className="h-full rounded-full" style={{ width: limit > 0 ? `${Math.min((accepted/limit)*100,100)}%` : '0%', background: 'var(--teal)' }}/>
          </div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] mb-2" style={{ color: 'var(--text2)' }}>Pending invites</div>
          <div className="text-[22px] font-bold font-mono" style={{ color: 'var(--warn)' }}>{members.filter(m=>m.status==='pending').length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="text-[11px] mb-2" style={{ color: 'var(--text2)' }}>Your role</div>
          <div className="flex items-center gap-2 mt-1"><Crown size={16} style={{ color: '#ffaa44' }}/><span className="text-[14px] font-semibold">Owner</span></div>
        </div>
      </div>

      {/* Owner row */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[13px] font-semibold">Workspace members</span>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(0,212,160,0.03)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: 'var(--teal)', color: '#001a12' }}>
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'Y'}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{user?.fullName || 'You'}</div>
            <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,170,68,0.1)', color: '#ffaa44' }}>
              <Crown size={10}/> Owner
            </span>
          </div>
        </div>

        {/* Team members */}
        {members.length === 0 && plan !== 'free' ? (
          <div className="text-center py-12" style={{ color: 'var(--text3)' }}>
            <UserPlus size={24} className="mx-auto mb-3"/>
            <p className="text-[13px] mb-1 font-medium">No team members yet</p>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text3)' }}>Invite your media buyers and account managers</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>Invite first member</Button>
          </div>
        ) : plan === 'free' && members.length === 0 ? (
          <div className="text-center py-12 px-8">
            <Shield size={28} className="mx-auto mb-3" style={{ color: 'var(--teal)' }}/>
            <p className="text-[14px] font-bold mb-2">Team access requires a paid plan</p>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text2)' }}>Starter allows 2 team members · Pro allows 10 · Agency is unlimited</p>
            <Link href="/billing" className="px-5 py-2.5 rounded-lg text-[13px] font-semibold no-underline inline-block" style={{ background: 'var(--teal)', color: '#001a12' }}>Upgrade to add team members</Link>
          </div>
        ) : (
          members.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 border-b transition-colors hover:bg-[var(--bg3)]" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: m.status==='accepted'?'var(--bg4)':'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                {m.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{m.email}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: m.status==='accepted'?'var(--teal)':'var(--warn)' }}>
                    {m.status==='accepted'?<CheckCircle size={10}/>:<Clock size={10}/>}
                    {m.status==='accepted'?'Active':'Pending'}
                  </span>
                  {m.invited_at && <span className="text-[10px]" style={{ color: 'var(--text3)' }}>· Invited {new Date(m.invited_at).toLocaleDateString('en-GB')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editingId === m.id ? (
                  <div className="flex items-center gap-1.5">
                    <select value={editRole} onChange={e=>setEditRole(e.target.value)}
                      className="text-[11px] rounded-lg border px-2 py-1 outline-none" style={is}>
                      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    <button onClick={() => handleRoleChange(m.id, editRole)}
                      className="text-[11px] px-2 py-1 rounded font-semibold" style={{ background: 'var(--teal)', color: '#001a12' }}>Save</button>
                    <button onClick={() => setEditingId(null)} className="text-[11px] px-2 py-1 rounded border" style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <RoleBadge role={m.role}/>
                    <button onClick={() => { setEditingId(m.id); setEditRole(m.role) }}
                      className="p-1.5 rounded hover:bg-[var(--bg4)] transition-colors" style={{ color: 'var(--text3)' }}>
                      <Edit2 size={12}/>
                    </button>
                  </>
                )}
                {m.status === 'pending' && (
                  <button onClick={() => resendInvite(m)} className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border" style={{ borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                    <Mail size={10}/> Resend
                  </button>
                )}
                <button onClick={() => handleRemove(m.id)} className="p-1.5 rounded hover:bg-[var(--bg4)] transition-colors" style={{ color: 'var(--text3)' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Role legend */}
      <div className="rounded-xl border p-5 mt-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="text-[12px] font-semibold mb-3">Role permissions</div>
        <div className="grid grid-cols-3 gap-3">
          {ROLES.map(r => (
            <div key={r.id} className="p-3 rounded-lg" style={{ background: 'var(--bg3)' }}>
              <div className="flex items-center gap-1.5 mb-1"><span style={{ color: r.color }}>{r.icon}</span><span className="text-[12px] font-semibold">{r.label}</span></div>
              <p className="text-[11px]" style={{ color: 'var(--text2)' }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={() => { setShowModal(false); setError('') }}>
          <div className="rounded-xl border p-6 w-full max-w-md" style={{ background: 'var(--bg2)', borderColor: 'var(--border2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[17px] font-semibold mb-1">Invite team member</div>
            <p className="text-[12px] mb-5" style={{ color: 'var(--text2)' }}>They'll receive an email with a link to join your workspace.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>Email address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }} autoFocus
                  placeholder="colleague@agency.com"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is}/>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: 'var(--text2)' }}>Role</label>
                <div className="flex flex-col gap-2">
                  {ROLES.map(r => (
                    <button key={r.id} onClick={() => setRole(r.id as any)}
                      className="flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
                      style={{ background: role===r.id?'var(--teal-dim)':'var(--bg3)', borderColor: role===r.id?'rgba(0,212,160,0.4)':'var(--border)' }}>
                      <span style={{ color: r.color, marginTop: 1 }}>{r.icon}</span>
                      <div>
                        <div className="text-[12px] font-semibold" style={{ color: role===r.id?'var(--teal)':'var(--text)' }}>{r.label}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="mt-3 text-[11px] px-3 py-2 rounded-lg" style={{ background: 'rgba(255,92,92,0.08)', color: 'var(--danger)', border: '1px solid rgba(255,92,92,0.2)' }}>{error}</div>}
            <div className="flex gap-2 justify-end mt-5">
              <Button onClick={() => { setShowModal(false); setError('') }}>Cancel</Button>
              <Button variant="primary" onClick={handleInvite} disabled={inviting || !email.trim()}>
                {inviting ? <><Spinner size={13}/> Sending...</> : <><Mail size={13}/> Send invite</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}