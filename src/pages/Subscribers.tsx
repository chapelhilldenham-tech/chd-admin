import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Sub { id: string; full_name: string | null; email: string; plan: string | null; status: string; expires_at: string | null; created_at: string }

export default function Subscribers() {
  const [rows, setRows] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    // Try subscribers table; fall back to admin_users if not found
    const { data, error } = await supabase.from('subscribers').select('id,full_name,email,plan,status,expires_at,created_at').order('created_at', { ascending: false })
    if (!error) setRows((data ?? []) as Sub[])
    else {
      // Fallback: admin_users
      const { data: adminData } = await supabase.from('admin_users').select('id,full_name,role,created_at')
      setRows((adminData ?? []).map((u: any) => ({ id: u.id, full_name: u.full_name, email: '—', plan: u.role, status: 'active', expires_at: null, created_at: u.created_at })) as Sub[])
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('subscribers').update({ status }).eq('id', id)
    setMsg('Status updated.'); load()
  }

  const filtered = rows.filter(r => {
    const matchSearch = !search || (r.email + ' ' + (r.full_name ?? '')).toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <>
      <header className="admin-top">
        <h1>Subscribers</h1>
        <div className="admin-topbar-actions">
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontFamily: '"IBM Plex Mono",monospace' }}>{rows.length} total</span>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => {
            const csv = ['Name,Email,Plan,Status,Expires', ...filtered.map(r => `${r.full_name ?? ''},${r.email},${r.plan ?? ''},${r.status},${r.expires_at ?? ''}`)].join('\n')
            const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'subscribers.csv'; a.click()
          }}>↓ Export CSV</button>
        </div>
      </header>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="admin-filter-row">
        <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 280 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <p style={{ padding: 20, color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</p> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.full_name ?? '—'}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11 }}>{r.email}</td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{r.plan ?? '—'}</td>
                  <td><span className={`admin-pill ${r.status === 'active' ? 'pill-active' : r.status === 'expired' ? 'pill-staged' : 'pill-draft'}`}>{r.status}</span></td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{r.expires_at?.slice(0, 10) ?? '—'}</td>
                  <td>
                    <div className="admin-td-actions">
                      {r.status !== 'active' && <button className="admin-btn admin-btn-bronze admin-btn-sm" onClick={() => updateStatus(r.id, 'active')}>Renew</button>}
                      {r.status === 'active' && <button className="admin-icon-btn del" title="Suspend" onClick={() => updateStatus(r.id, 'cancelled')}>⊘</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 24 }}>No subscribers found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
