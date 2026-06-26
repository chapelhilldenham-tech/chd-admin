import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Report { id: string; uuid: string; title: string; category: string; publish_status: string; access_level: string; published_at: string | null; created_at: string }

const PILL: Record<string, string> = { published: 'pill-pub', staged: 'pill-staged', draft: 'pill-draft', archived: 'pill-arch' }

export default function Reports() {
  const [rows, setRows] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('research_reports')
      .select('id,uuid,title,category,publish_status,access_level,published_at,created_at')
      .order('created_at', { ascending: false })
    setRows((data ?? []) as Report[])
    setLoading(false)
  }

  async function setPublishStatus(uuid: string, newStatus: string) {
    const { error } = await supabase.from('research_reports').update({ publish_status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }).eq('uuid', uuid)
    if (!error) { setMsg(`Report ${newStatus}.`); load() }
  }

  async function deleteReport(uuid: string) {
    if (!confirm('Delete this report permanently?')) return
    const { error } = await supabase.from('research_reports').delete().eq('uuid', uuid)
    if (!error) { setMsg('Report deleted.'); load() }
  }

  const filtered = rows.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !status || r.publish_status === status
    const matchCat = !category || r.category === category
    return matchSearch && matchStatus && matchCat
  })

  return (
    <>
      <header className="admin-top">
        <h1>Research Library</h1>
        <div className="admin-topbar-actions">
          <Link to="/reports/new" className="admin-btn admin-btn-bronze">+ Upload Research</Link>
        </div>
      </header>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="admin-filter-row">
        <input type="text" placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 280 }} />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="staged">Staged</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="equity">Equity Research</option>
          <option value="fixed_income">Fixed Income</option>
          <option value="macro">Macro</option>
          <option value="sector">Sector</option>
          <option value="index">Paramount Index</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,.4)', fontFamily: '"IBM Plex Mono",monospace' }}>{filtered.length} reports</span>
      </div>
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <p style={{ padding: 20, color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</p> : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Access</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td><div className="admin-td-title">{r.title}</div></td>
                  <td><div className="admin-td-cat">{r.category}</div></td>
                  <td style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{r.access_level}</td>
                  <td><span className={`admin-pill ${PILL[r.publish_status] ?? 'pill-draft'}`}>{r.publish_status}</span></td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{(r.published_at ?? r.created_at)?.slice(0, 10)}</td>
                  <td>
                    <div className="admin-td-actions">
                      <Link to={`/reports/${r.uuid}`} className="admin-icon-btn" title="Edit">✎</Link>
                      {r.publish_status === 'staged' && (
                        <button className="admin-btn admin-btn-bronze admin-btn-sm" onClick={() => setPublishStatus(r.uuid, 'published')}>Publish</button>
                      )}
                      {r.publish_status === 'published' && (
                        <button className="admin-icon-btn" title="Archive" onClick={() => setPublishStatus(r.uuid, 'archived')}>◷</button>
                      )}
                      <button className="admin-icon-btn del" title="Delete" onClick={() => deleteReport(r.uuid)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,.35)', padding: 28 }}>No reports match your filter.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
