'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Users, Mail, Shield, Trash2, Crown, Edit, Eye, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

type Member = {
  id: string
  email: string
  role: string
  status: string
  user_id: string | null
  invited_at: string
  accepted_at: string | null
}

const ROLE_ICONS: Record<string, any> = {
  owner: <Crown size={12}/>,
  editor: <Edit size={12}/>,
  viewer: <Eye size={12}/>,
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'var(--teal)',
  editor: '#a78bfa',
  viewer: 'var(--text2)',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
      style={{ background: `${ROLE_COLORS[role]}15`, color: ROLE_COLORS[role] }}>
      {ROLE_ICONS[role]} {role}
    </span>
  )
}

function StatusBadgeSmall({ status }: { status: string }) {
  const s = status === 'accepted'
    ? { icon: <CheckCircle size={11}/>, color: 'var(--teal)', label: 'Active' }
    : { icon: <Clock size={11}/>, color: 'var(--warn)', label: 'Pending' }
  return (
    <span className="flex items-center gap-1 text-[11px]" style={{ color: s.color }}>
      {s.icon} {s.label}
    </span>
  )
}
export default function SettingsPage() {
  const { user } = useUser()
  const { isOwner, role } = useWorkspace()
  const [tab, setTab] = useState<'team' | 'account'>('team')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{type:'success'|'error', text:string}|null>(null)

  useEffect(() => {
    async function loadMembers() {
      if (!user || !isOwner) { setLoading(false); return }
      const res = await fetch('/api/team/invite')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    loadMembers()
  }, [user, isOwner])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInviteMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      // Refresh list
      const res2 = await fetch('/api/team/invite')
      setMembers(await res2.json())
    } catch(e: any) {
      setInviteMsg({ type: 'error', text: e.message })
    } finally { setInviting(false) }
  }

  const handleRemove = async (memberId: string) => {
    await fetch('/api/team/invite', {
      method: 'DELETE',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ memberId })
    })
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const is = { background: 'var(--bg3)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your workspace, team and account preferences." />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
        {[{id:'team',label:'Team'},{id:'account',label:'Account'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all"
            style={{ borderColor: tab===t.id ? 'var(--teal)' : 'transparent', color: tab===t.id ? 'var(--teal)' : 'var(--text2)', background: 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'team' && (
        <div className="flex flex-col gap-6">
          {/* Role banner for non-owners */}
          {!isOwner && (
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.2)' }}>
              <Shield size={16} style={{ color: '#a78bfa' }} />
              <div>
                <div className="text-[13px] font-semibold">You are a team member</div>
                <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                  Your role is <span className="font-semibold" style={{ color: '#a78bfa' }}>{role}</span>. Contact the workspace owner to change permissions.
                </div>
              </div>
            </div>
          )}

          {isOwner && (
            <>
              {/* Invite form */}
              <div className="rounded-xl border p-5" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <div className="text-[14px] font-semibold mb-1">Invite team member</div>
                <p className="text-[12px] mb-4" style={{ color: 'var(--text2)' }}>
                  Team members can view and manage your workspace. They'll receive an email invitation.
                </p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                    <input
                      type="email" value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="colleague@agency.com"
                      className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]"
                      style={is} />
                  </div>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="rounded-lg border px-3 py-2.5 text-[13px] outline-none" style={is}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button variant="primary" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? <><Spinner size={13}/> Sending...</> : 'Send Invite'}
                  </Button>
                </div>

                {inviteMsg && (
                  <div className="mt-3 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2"
                    style={{
                      background: inviteMsg.type === 'success' ? 'rgba(0,212,160,0.08)' : 'rgba(255,92,92,0.08)',
                      color: inviteMsg.type === 'success' ? 'var(--teal)' : 'var(--danger)',
                      border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(0,212,160,0.2)' : 'rgba(255,92,92,0.2)'}`
                    }}>
                    {inviteMsg.type === 'success' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                    {inviteMsg.text}
                  </div>
                )}

                {/* Role descriptions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { role: 'editor', desc: 'Can view all data, create reports, manage campaigns and UGC' },
                    { role: 'viewer', desc: 'Read-only access to dashboards and reports' },
                  ].map(r => (
                    <div key={r.role} className="p-3 rounded-lg" style={{ background: 'var(--bg3)' }}>
                      <div className="flex items-center gap-2 mb-1"><RoleBadge role={r.role}/></div>
                      <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team member list */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[13px] font-semibold">Team members</span>
                  <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{members.length + 1} total (including you)</span>
                </div>

                {/* Owner row */}
                <div className="flex items-center gap-4 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: 'var(--teal)', color: '#001a12' }}>
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'Y'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{user?.fullName || 'You'} <span className="text-[11px]" style={{ color: 'var(--text3)' }}>(you)</span></div>
                    <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
                  </div>
                  <RoleBadge role="owner" />
                  <StatusBadgeSmall status="accepted" />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--text2)' }}>
                    <Spinner size={14}/><span className="text-[12px]">Loading members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--text3)' }}>
                    <Users size={20} className="mx-auto mb-2" />
                    <p className="text-[12px]">No team members yet. Invite someone above.</p>
                  </div>
                ) : (
                  members.map(m => (
                    <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 border-b hover:bg-[var(--bg3)] transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ background: 'var(--bg4)', color: 'var(--text2)' }}>
                        {m.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium">{m.email}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                          Invited {new Date(m.invited_at).toLocaleDateString('en-GB')}
                          {m.accepted_at && ` · Joined ${new Date(m.accepted_at).toLocaleDateString('en-GB')}`}
                        </div>
                      </div>
                      <RoleBadge role={m.role} />
                      <StatusBadgeSmall status={m.status} />
                      <button onClick={() => handleRemove(m.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg4)]"
                        style={{ color: 'var(--text3)' }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'account' && (
        <div className="rounded-xl border p-6" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
          <div className="text-[14px] font-semibold mb-4">Account details</div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold"
              style={{ background: 'var(--teal)', color: '#001a12' }}>
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-[15px] font-semibold">{user?.fullName || 'Your account'}</div>
              <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
            </div>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--text2)' }}>
            To update your name, email or password, use the account menu in the top right corner.
          </p>
        </div>
      )}
    </>
  )
}