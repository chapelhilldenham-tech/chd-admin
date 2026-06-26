import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface AdminUser { id: string; full_name: string | null; role: string; created_at: string }

export default function Settings() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('reviewer')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [siteConfig, setSiteConfig] = useState({ site_name: 'CHD Research Portal', contact_email: 'research@chapelhilldenham.com', address: '10 Bankole Oki Road, Ikoyi, Lagos, Nigeria', meta_description: 'Institutional research for Africa\'s capital markets.' })

  useEffect(() => { loadAdmins() }, [])

  async function loadAdmins() {
    const { data } = await supabase.from('admin_users').select('id,full_name,role,created_at').order('created_at')
    setAdmins((data ?? []) as AdminUser[])
  }

  async function inviteAdmin(e: FormEvent) {
    e.preventDefault(); setSaving(true); setErr(''); setMsg('')
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail)
    if (error) {
      // Fall back: create a placeholder record if inviteUserByEmail not available on anon key
      setErr('Invite requires service-role key. Record the user manually after they sign up via Supabase Auth.')
    } else if (data?.user) {
      await supabase.from('admin_users').insert({ id: data.user.id, role: inviteRole, full_name: null })
      setMsg(`Invite sent to ${inviteEmail}.`)
      setInviteEmail('')
      loadAdmins()
    }
    setSaving(false)
  }

  async function removeAdmin(id: string) {
    if (id === user?.id) { setErr('Cannot remove yourself.'); return }
    if (!confirm('Remove this admin user?')) return
    await supabase.from('admin_users').delete().eq('id', id)
    setMsg('Admin removed.'); loadAdmins()
  }

  async function updateRole(id: string, role: string) {
    await supabase.from('admin_users').update({ role }).eq('id', id)
    setMsg('Role updated.'); loadAdmins()
  }

  async function saveConfig(e: FormEvent) {
    e.preventDefault()
    // In production, store in a site_config table or use env vars
    setMsg('Site configuration saved (UI only — connect a site_config table to persist).')
  }

  return (
    <>
      <header className="admin-top"><h1>Settings</h1></header>
      {msg && <div className="success-msg">{msg}</div>}
      {err && <div className="error-msg">{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="admin-card">
          <div className="admin-card-head"><h3>Site configuration</h3></div>
          <form onSubmit={saveConfig}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="admin-field"><label>Site name</label><input value={siteConfig.site_name} onChange={e => setSiteConfig(c => ({ ...c, site_name: e.target.value }))} /></div>
              <div className="admin-field"><label>Contact email</label><input type="email" value={siteConfig.contact_email} onChange={e => setSiteConfig(c => ({ ...c, contact_email: e.target.value }))} /></div>
              <div className="admin-field"><label>Address</label><textarea value={siteConfig.address} onChange={e => setSiteConfig(c => ({ ...c, address: e.target.value }))} style={{ minHeight: 60 }} /></div>
              <div className="admin-field"><label>Meta description</label><textarea value={siteConfig.meta_description} onChange={e => setSiteConfig(c => ({ ...c, meta_description: e.target.value }))} style={{ minHeight: 60 }} /></div>
            </div>
            <div className="admin-inline-btns"><button type="submit" className="admin-btn admin-btn-bronze">Save configuration</button></div>
          </form>
        </div>

        <div>
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="admin-card-head"><h3>Admin team</h3></div>
            <table className="admin-table" style={{ marginBottom: 0 }}>
              <thead><tr><th>Name / ID</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.full_name ?? 'Unnamed'}</div>
                      <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,255,255,.3)' }}>{a.id.slice(0, 8)}…</div>
                    </td>
                    <td>
                      <select value={a.role} onChange={e => updateRole(a.id, e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--chd-bronze-soft)', fontFamily: 'inherit', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                        <option value="admin">Admin</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="director">Director</option>
                      </select>
                    </td>
                    <td>
                      {a.id !== user?.id && <button className="admin-icon-btn del" onClick={() => removeAdmin(a.id)}>✕</button>}
                      {a.id === user?.id && <span style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>You</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><h3>Invite admin user</h3></div>
            <form onSubmit={inviteAdmin}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div className="admin-field"><label>Email address</label><input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@chapelhilldenham.com" required /></div>
                <div className="admin-field"><label>Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                    <option value="director">Director</option>
                  </select>
                </div>
              </div>
              <div className="admin-inline-btns"><button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Inviting…' : 'Send invite'}</button></div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
