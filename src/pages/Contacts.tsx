import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Contact { id: string; name: string; email: string; organisation: string | null; phone: string | null; message: string; status: string; created_at: string; enquiry_type: string | null }

export default function Contacts() {
  const [rows, setRows] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false })
    setRows((data ?? []) as Contact[])
    setLoading(false)
  }

  async function markRead(id: string) {
    await supabase.from('contact_submissions').update({ status: 'read' }).eq('id', id)
    setMsg('Marked as read.'); load()
  }

  async function markResolved(id: string) {
    await supabase.from('contact_submissions').update({ status: 'resolved' }).eq('id', id)
    setSelected(null); setMsg('Marked as resolved.'); load()
  }

  async function del(id: string) {
    if (!confirm('Delete this message?')) return
    await supabase.from('contact_submissions').delete().eq('id', id)
    setSelected(null); setMsg('Deleted.'); load()
  }

  const filtered = rows.filter(r => !statusFilter || r.status === statusFilter)
  const unreadCount = rows.filter(r => r.status === 'new').length

  return (
    <>
      <header className="admin-top">
        <h1>Contact Inbox {unreadCount > 0 && <span className="admin-nav-badge" style={{ marginLeft: 10 }}>{unreadCount} new</span>}</h1>
      </header>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="admin-filter-row">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All messages</option>
          <option value="new">Unread</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <p style={{ padding: 20, color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading…</p> : (
            <>
              {filtered.map(c => (
                <div key={c.id} className="admin-inbox-item" onClick={() => { setSelected(c); if (c.status === 'new') markRead(c.id) }}>
                  <div className={`admin-inbox-dot${c.status !== 'new' ? ' read' : ''}`} />
                  <div>
                    <div style={{ fontWeight: c.status === 'new' ? 700 : 400, fontSize: 13, color: '#fff' }}>{c.name} <span style={{ fontWeight: 400, fontSize: 11, color: 'rgba(255,255,255,.4)' }}>— {c.organisation ?? c.email}</span></div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2, lineHeight: 1.4 }}>{c.message.slice(0, 90)}{c.message.length > 90 ? '…' : ''}</div>
                  </div>
                  <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{c.created_at?.slice(0, 10)}</div>
                  <div><span className={`admin-pill ${c.status === 'new' ? 'pill-staged' : c.status === 'resolved' ? 'pill-pub' : 'pill-draft'}`} style={{ fontSize: 9 }}>{c.status}</span></div>
                </div>
              ))}
              {filtered.length === 0 && <p style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13 }}>No messages.</p>}
            </>
          )}
        </div>
        {selected && (
          <div className="admin-card">
            <div className="admin-card-head">
              <h3>{selected.name}</h3>
              <button className="admin-icon-btn" onClick={() => setSelected(null)} title="Close">✕</button>
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}><strong style={{ color: 'var(--chd-bronze-soft)' }}>Email:</strong> {selected.email}</div>
              {selected.organisation && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}><strong style={{ color: 'var(--chd-bronze-soft)' }}>Organisation:</strong> {selected.organisation}</div>}
              {selected.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}><strong style={{ color: 'var(--chd-bronze-soft)' }}>Phone:</strong> {selected.phone}</div>}
              {selected.enquiry_type && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}><strong style={{ color: 'var(--chd-bronze-soft)' }}>Enquiry:</strong> {selected.enquiry_type}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontFamily: '"IBM Plex Mono",monospace' }}>{selected.created_at?.slice(0, 16).replace('T', ' ')}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 2, padding: '12px 14px', fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, marginBottom: 16 }}>{selected.message}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`mailto:${selected.email}`} className="admin-btn admin-btn-bronze admin-btn-sm">Reply by email</a>
              <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => markResolved(selected.id)}>Mark resolved</button>
              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => del(selected.id)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
