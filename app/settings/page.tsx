'use client'
import { useState, useEffect } from 'react'
import { PageHeader, Button, Spinner } from '@/components/ui'
import { useUser } from '@clerk/nextjs'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePlan } from '@/hooks/usePlan'
import { Users, Mail, Shield, Trash2, Crown, Edit, Eye, CheckCircle, Clock, AlertTriangle, Palette, Lock } from 'lucide-react'

type Member = { id: string; email: string; role: string; status: string; user_id: string | null; invited_at: string; accepted_at: string | null }
type Brand = { agency_name: string; logo_url: string; brand_color: string; footer_text: string; hide_pulse_branding: boolean }

const ROLE_COLORS: Record<string, string> = { owner: 'var(--teal)', editor: '#a78bfa', viewer: 'var(--text2)' }
const ROLE_ICONS: Record<string, any> = { owner: '♛', editor: '✏', viewer: '👁' }

function RoleBadge({ role }: { role: string }) {
  return <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
    style={{ background: ROLE_COLORS[role] + '18', color: ROLE_COLORS[role] }}>
    {ROLE_ICONS[role]} {role}
  </span>
}

const PRESET_COLORS = ['#00d4a0','#6366f1','#f43f5e','#f97316','#eab308','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#000000']

export default function SettingsPage() {
  const { user } = useUser()
  const { isOwner, role } = useWorkspace()
  const { plan } = usePlan()
  const [tab, setTab] = useState<'team' | 'branding' | 'account'>('branding')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{type:'success'|'error',text:string}|null>(null)

  // Brand state
  const [brand, setBrand] = useState<Brand>({ agency_name: '', logo_url: '', brand_color: '#00d4a0', footer_text: '', hide_pulse_branding: false })
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandSaved, setBrandSaved] = useState(false)
  const canWhiteLabel = plan === 'pro' || plan === 'agency'

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return }
      const [membersRes, brandRes] = await Promise.all([
        fetch('/api/team/invite'),
        fetch('/api/brand'),
      ])
      const membersData = await membersRes.json()
      const brandData = await brandRes.json()
      setMembers(Array.isArray(membersData) ? membersData : [])
      if (brandData?.agency_name !== undefined) setBrand({ agency_name: brandData.agency_name || '', logo_url: brandData.logo_url || '', brand_color: brandData.brand_color || '#00d4a0', footer_text: brandData.footer_text || '', hide_pulse_branding: brandData.hide_pulse_branding || false })
      setLoading(false)
    }
    load()
  }, [user])

  const handleSaveBrand = async () => {
    setBrandSaving(true)
    await fetch('/api/brand', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(brand) })
    setBrandSaved(true); setBrandSaving(false)
    setTimeout(() => setBrandSaved(false), 2500)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true); setInviteMsg(null)
    try {
      const res = await fetch('/api/team/invite', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInviteMsg({ type:'success', text:`Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      const res2 = await fetch('/api/team/invite')
      setMembers(await res2.json())
    } catch(e:any) { setInviteMsg({ type:'error', text: e.message }) }
    finally { setInviting(false) }
  }

  const handleRemove = async (memberId: string) => {
    await fetch('/api/team/invite', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ memberId }) })
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const is = { background:'var(--bg3)', borderColor:'var(--border)', color:'var(--text)' }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your workspace branding, team and account." />

      <div className="flex gap-1 mb-6 border-b" style={{ borderColor:'var(--border)' }}>
        {[{id:'branding',label:'Branding'},{id:'team',label:'Team'},{id:'account',label:'Account'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all"
            style={{ borderColor: tab===t.id?'var(--teal)':'transparent', color: tab===t.id?'var(--teal)':'var(--text2)', background:'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* BRANDING TAB */}
      {tab === 'branding' && (
        <div className="flex flex-col gap-5">
          {!canWhiteLabel && (
            <div className="rounded-xl border p-5 flex items-start gap-4" style={{ background:'rgba(167,139,250,0.06)', borderColor:'rgba(167,139,250,0.25)' }}>
              <Lock size={18} style={{ color:'#a78bfa', flexShrink:0, marginTop:2 }} />
              <div>
                <div className="text-[14px] font-bold mb-1">White-label branding — Pro & Agency</div>
                <p className="text-[12px] mb-3" style={{ color:'var(--text2)' }}>
                  Replace Pulse branding with your agency logo, colours and name on all client reports. Your clients see your brand, not ours.
                </p>
                <a href="/billing" className="text-[12px] font-semibold no-underline px-4 py-2 rounded-lg inline-block" style={{ background:'#a78bfa', color:'white' }}>
                  Upgrade to unlock →
                </a>
              </div>
            </div>
          )}

          <div className="rounded-xl border p-6" style={{ background:'var(--bg2)', borderColor:'var(--border)', opacity: canWhiteLabel ? 1 : 0.5, pointerEvents: canWhiteLabel ? 'auto' : 'none' }}>
            <div className="text-[14px] font-bold mb-5 flex items-center gap-2">
              <Palette size={15} style={{ color:'var(--teal)' }} /> Agency branding
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Agency name</label>
                <input value={brand.agency_name} onChange={e => setBrand(p => ({...p, agency_name:e.target.value}))}
                  placeholder="e.g. Acme Media Agency"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is} />
                <p className="text-[10px] mt-1" style={{ color:'var(--text3)' }}>Replaces "Pulse" in the report header</p>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Logo URL</label>
                <input value={brand.logo_url} onChange={e => setBrand(p => ({...p, logo_url:e.target.value}))}
                  placeholder="https://yoursite.com/logo.png"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is} />
                <p className="text-[10px] mt-1" style={{ color:'var(--text3)' }}>PNG or SVG, min 200px wide, transparent bg</p>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Brand colour</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setBrand(p => ({...p, brand_color:c}))}
                      className="w-7 h-7 rounded-lg border-2 transition-all"
                      style={{ background:c, borderColor: brand.brand_color===c ? 'white' : 'transparent' }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={brand.brand_color} onChange={e => setBrand(p => ({...p, brand_color:e.target.value}))}
                    className="w-10 h-8 rounded cursor-pointer border-0" />
                  <span className="text-[12px] font-mono" style={{ color:'var(--text2)' }}>{brand.brand_color}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color:'var(--text2)' }}>Footer text</label>
                <input value={brand.footer_text} onChange={e => setBrand(p => ({...p, footer_text:e.target.value}))}
                  placeholder="Prepared by Acme Media Agency"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is} />
                <p className="text-[10px] mt-1" style={{ color:'var(--text3)' }}>Appears at the bottom of every client report</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-5 pt-5 border-t" style={{ borderColor:'var(--border)' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="w-9 h-5 rounded-full transition-colors relative" style={{ background: brand.hide_pulse_branding?'var(--teal)':'var(--bg4)' }}
                  onClick={() => setBrand(p => ({...p, hide_pulse_branding:!p.hide_pulse_branding}))}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: brand.hide_pulse_branding?'calc(100% - 18px)':'2px' }} />
                </div>
                <div>
                  <div className="text-[12px] font-medium">Remove "Powered by Pulse"</div>
                  <div className="text-[11px]" style={{ color:'var(--text2)' }}>Your reports show no Pulse attribution</div>
                </div>
              </label>
              <Button variant="primary" onClick={handleSaveBrand} disabled={brandSaving}>
                {brandSaving ? <><Spinner size={13}/> Saving...</> : brandSaved ? '✓ Saved!' : 'Save branding'}
              </Button>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border p-5" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
            <div className="text-[13px] font-semibold mb-4">Report preview</div>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor:'#1e2130' }}>
              {/* Fake report header */}
              <div style={{ background:'#13161d', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1e2130' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt="" style={{ height:28, borderRadius:4, objectFit:'contain' }} onError={e => (e.currentTarget.style.display='none')} />
                  ) : (
                    <div style={{ width:28, height:28, background: brand.brand_color, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13 }}>
                      {(brand.agency_name || 'P')[0]}
                    </div>
                  )}
                  <span style={{ fontWeight:700, fontSize:14, color:'#e8eaf0' }}>{brand.agency_name || 'Your Agency'}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#e8eaf0' }}>Client Name</div>
                  <div style={{ fontSize:10, color:'#8b90a0' }}>Performance Report · Last 30 days</div>
                </div>
              </div>
              <div style={{ height:3, background:`linear-gradient(90deg, ${brand.brand_color}, ${brand.brand_color}88)` }} />
              {/* Fake KPI row */}
              <div style={{ background:'#0d0f14', padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[['Total Spend','£9,750'],['Revenue','£25,540'],['ROAS','2.62x'],['Conversions','412']].map(([l,v],i) => (
                  <div key={i} style={{ background: i===1||i===2 ? brand.brand_color+'18' : '#13161d', border:`1px solid ${i===1||i===2 ? brand.brand_color+'40' : '#1e2130'}`, borderRadius:10, padding:'14px 16px' }}>
                    <div style={{ fontSize:9, color:'#8b90a0', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</div>
                    <div style={{ fontSize:20, fontWeight:800, fontFamily:'monospace', color: i===1||i===2 ? brand.brand_color : '#e8eaf0' }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div style={{ background:'#0d0f14', padding:'12px 24px', textAlign:'center', borderTop:'1px solid #1e2130' }}>
                {brand.footer_text && <div style={{ fontSize:11, color:'#c8cad4', marginBottom:3 }}>{brand.footer_text}</div>}
                {!brand.hide_pulse_branding && <div style={{ fontSize:10, color:'#8b90a0' }}>Powered by <span style={{ color: brand.brand_color }}>Pulse</span></div>}
                {brand.hide_pulse_branding && <div style={{ fontSize:10, color:'#8b90a0' }}>Confidential — {brand.agency_name || 'Your Agency'}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEAM TAB */}
      {tab === 'team' && (
        <div className="flex flex-col gap-5">
          {!isOwner && (
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background:'rgba(167,139,250,0.06)', borderColor:'rgba(167,139,250,0.2)' }}>
              <Shield size={16} style={{ color:'#a78bfa' }} />
              <div>
                <div className="text-[13px] font-semibold">You are a team member</div>
                <div className="text-[12px]" style={{ color:'var(--text2)' }}>Your role is <span className="font-semibold" style={{ color:'#a78bfa' }}>{role}</span>. Contact the workspace owner to change permissions.</div>
              </div>
            </div>
          )}
          {isOwner && (
            <>
              <div className="rounded-xl border p-5" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="text-[14px] font-semibold mb-4">Invite team member</div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text3)' }} />
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&handleInvite()} placeholder="colleague@agency.com"
                      className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-[var(--teal)]" style={is} />
                  </div>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="rounded-lg border px-3 py-2.5 text-[13px] outline-none" style={is}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button variant="primary" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                    {inviting ? <><Spinner size={13}/> Sending...</> : 'Send Invite'}
                  </Button>
                </div>
                {inviteMsg && (
                  <div className="mt-3 px-3 py-2 rounded-lg text-[12px] flex items-center gap-2"
                    style={{ background: inviteMsg.type==='success'?'rgba(0,212,160,0.08)':'rgba(255,92,92,0.08)', color: inviteMsg.type==='success'?'var(--teal)':'var(--danger)', border:`1px solid ${inviteMsg.type==='success'?'rgba(0,212,160,0.2)':'rgba(255,92,92,0.2)'}` }}>
                    {inviteMsg.text}
                  </div>
                )}
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
                <div className="px-5 py-3 border-b" style={{ borderColor:'var(--border)' }}>
                  <span className="text-[13px] font-semibold">Team members</span>
                </div>
                <div className="flex items-center gap-4 px-5 py-3.5 border-b" style={{ borderColor:'var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background:'var(--teal)', color:'#001a12' }}>
                    {user?.firstName?.[0] || 'Y'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{user?.fullName || 'You'} <span className="text-[11px]" style={{ color:'var(--text3)' }}>(you)</span></div>
                    <div className="text-[11px]" style={{ color:'var(--text2)' }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
                  </div>
                  <RoleBadge role="owner" />
                </div>
                {loading ? <div className="flex items-center justify-center py-8 gap-2"><Spinner size={14}/></div>
                : members.length === 0 ? <div className="text-center py-8 text-[12px]" style={{ color:'var(--text3)' }}>No team members yet</div>
                : members.map(m => (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 border-b hover:bg-[var(--bg3)] transition-colors" style={{ borderColor:'var(--border)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background:'var(--bg4)', color:'var(--text2)' }}>{m.email[0].toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{m.email}</div>
                      <div className="text-[11px]" style={{ color:'var(--text3)' }}>
                        {m.status === 'accepted' ? <><CheckCircle size={10} style={{ display:'inline', color:'var(--teal)' }}/> Active</> : <><Clock size={10} style={{ display:'inline', color:'var(--warn)' }}/> Pending</>}
                        {' · '}{new Date(m.invited_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <RoleBadge role={m.role} />
                    <button onClick={() => handleRemove(m.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg4)]" style={{ color:'var(--text3)' }}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'account' && (
        <div className="rounded-xl border p-6" style={{ background:'var(--bg2)', borderColor:'var(--border)' }}>
          <div className="text-[14px] font-semibold mb-4">Account details</div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-bold" style={{ background:'var(--teal)', color:'#001a12' }}>
              {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="text-[15px] font-semibold">{user?.fullName || 'Your account'}</div>
              <div className="text-[13px]" style={{ color:'var(--text2)' }}>{user?.emailAddresses?.[0]?.emailAddress}</div>
            </div>
          </div>
          <p className="text-[12px]" style={{ color:'var(--text2)' }}>To update your name, email or password, use the account menu in the top right corner.</p>
        </div>
      )}
    </>
  )
}