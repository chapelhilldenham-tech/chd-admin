import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuditEntry {
  id: string
  created_at: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  meta: Record<string, unknown> | null
  admin_email?: string
}

const ACTION_COLORS: Record<string, string> = {
  create: '#136b35',
  update: '#856404',
  delete: '#842029',
  publish: '#0c5d9e',
  archive: '#5a5a5a',
  login: '#4a3b8c',
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [noTable, setNoTable] = useState(false)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [target, setTarget] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  useEffect(() => { load() }, [page, action, target])

  async function load() {
    setLoading(true)
    let q = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)

    if (action) q = q.eq('action', action)
    if (target) q = q.eq('target_type', target)

    const { data, error } = await q
    if (error) {
      if (error.code === '42P01') setNoTable(true)
      setLoading(false)
      return
    }
    setEntries((data ?? []) as AuditEntry[])
    setLoading(false)
  }

  const filtered = search
    ? entries.filter(e =>
        e.action.includes(search) ||
        e.target_type.includes(search) ||
        (e.target_id ?? '').includes(search) ||
        (e.admin_id ?? '').includes(search)
      )
    : entries

  function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (noTable) return (
    <>
      <header className="admin-top"><h1>Audit log</h1></header>
      <div className="admin-card" style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ marginBottom: 16 }}>The <code style={{ fontFamily: '"IBM Plex Mono",monospace', background: 'rgba(255,255,255,.08)', padding: '2px 6px', borderRadius: 4 }}>audit_log</code> table does not exist yet.</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 20 }}>Run the migration below in Supabase SQL editor to create it.</p>
        <pre style={{ background: 'rgba(0,0,0,.4)', padding: 16, borderRadius: 4, textAlign: 'left', fontSize: 11, fontFamily: '"IBM Plex Mono",monospace', overflowX: 'auto', lineHeight: 1.6 }}>{`create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  admin_id    uuid references auth.users(id),
  action      text not null,
  target_type text,
  target_id   text,
  meta        jsonb
);
alter table audit_log enable row level security;
create policy "admins can read audit_log"
  on audit_log for select
  using (exists (
    select 1 from admin_users where id = auth.uid()
  ));`}</pre>
      </div>
    </>
  )

  return (
    <>
      <header className="admin-top">
        <h1>Audit log</h1>
      </header>

      <div className="admin-filter-row">
        <input
          placeholder="Search actions, targets, IDs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flexGrow: 1, maxWidth: 300 }}
        />
        <select value={action} onChange={e => { setAction(e.target.value); setPage(0) }}>
          <option value="">All actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="publish">Publish</option>
          <option value="archive">Archive</option>
          <option value="login">Login</option>
        </select>
        <select value={target} onChange={e => { setTarget(e.target.value); setPage(0) }}>
          <option value="">All targets</option>
          <option value="research_report">Reports</option>
          <option value="analyst">Analysts</option>
          <option value="category">Categories</option>
          <option value="price_list">Price lists</option>
          <option value="subscriber">Subscribers</option>
          <option value="admin_user">Admin users</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-screen">Loading…</div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>ID</th>
                <th>Admin</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,.3)' }}>No entries found</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 2,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      background: ACTION_COLORS[e.action] ?? '#444',
                      color: '#fff'
                    }}>{e.action}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{e.target_type ?? '—'}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                    {e.target_id ? e.target_id.slice(0, 8) + '…' : '—'}
                  </td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                    {e.admin_id ? e.admin_id.slice(0, 8) + '…' : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.meta ? JSON.stringify(e.meta) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 0 0' }}>
            <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ fontSize: 12, padding: '6px 0', color: 'rgba(255,255,255,.4)' }}>Page {page + 1}</span>
            <button className="admin-btn admin-btn-sm admin-btn-outline" disabled={entries.length < PER_PAGE} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </>
  )
}
