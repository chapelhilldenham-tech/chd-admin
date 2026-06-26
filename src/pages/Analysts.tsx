import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface Analyst { id: string; name: string; title: string; bio: string | null; email_display: string | null; photo_path: string | null; coverage: string[]; sort_order: number; active: boolean }
const EMPTY = { name: '', title: '', bio: '', email_display: '', coverage: '', sort_order: 0, active: true }

export default function Analysts() {
  const [rows, setRows] = useState<Analyst[]>([])
  const [editing, setEditing] = useState<Analyst | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('analysts').select('*').order('sort_order')
    setRows((data ?? []) as Analyst[])
  }

  function openNew() { setForm(EMPTY); setEditing(null); setIsNew(true); setPhoto(null) }
  function openEdit(a: Analyst) { setForm({ name: a.name, title: a.title, bio: a.bio ?? '', email_display: a.email_display ?? '', coverage: (a.coverage ?? []).join(', '), sort_order: a.sort_order, active: a.active }); setEditing(a); setIsNew(false); setPhoto(null) }
  function close() { setEditing(null); setIsNew(false) }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    let photoPath = editing?.photo_path ?? null
    if (photo) {
      const path = `analysts/${Date.now()}-${photo.name}`
      const { error: upErr } = await supabase.storage.from('analyst-photos').upload(path, photo)
      if (!upErr) photoPath = path
    }
    const payload = { name: form.name, title: form.title, bio: form.bio, email_display: form.email_display, photo_path: photoPath, coverage: form.coverage.split(',').map(s => s.trim()).filter(Boolean), sort_order: Number(form.sort_order), active: Boolean(form.active) }
    if (isNew) {
      await supabase.from('analysts').insert(payload)
    } else if (editing) {
      await supabase.from('analysts').update(payload).eq('id', editing.id)
    }
    setMsg('Saved.'); setSaving(false); close(); load()
  }

  async function del(id: string) {
    if (!confirm('Delete this analyst?')) return
    await supabase.from('analysts').delete().eq('id', id)
    setMsg('Analyst deleted.'); load()
  }

  function set(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value })) }

  return (
    <>
      <header className="admin-top">
        <h1>Analysts</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn-bronze" onClick={openNew}>+ Add Analyst</button>
        </div>
      </header>
      {msg && <div className="success-msg">{msg}</div>}

      {(isNew || editing) && (
        <div className="admin-card" style={{ maxWidth: 700 }}>
          <div className="admin-card-head"><h3>{isNew ? 'Add analyst' : `Edit ${editing?.name}`}</h3></div>
          <form onSubmit={save}>
            <div className="admin-form-grid">
              <div className="admin-field"><label>Full name *</label><input value={form.name} onChange={set('name')} required /></div>
              <div className="admin-field"><label>Title / role *</label><input value={form.title} onChange={set('title')} placeholder="Head of Equity Research" required /></div>
              <div className="admin-field admin-form-full"><label>Bio</label><textarea value={form.bio} onChange={set('bio')} placeholder="Short professional biography…" /></div>
              <div className="admin-field"><label>Display email</label><input type="email" value={form.email_display} onChange={set('email_display')} /></div>
              <div className="admin-field"><label>Coverage sectors (comma separated)</label><input value={form.coverage} onChange={set('coverage')} placeholder="Equities, Banking, Consumer" /></div>
              <div className="admin-field"><label>Sort order</label><input type="number" value={form.sort_order} onChange={set('sort_order')} /></div>
              <div className="admin-field admin-form-full"><label>Profile photo</label><input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.7)', borderRadius: 2, padding: '8px 12px' }} /></div>
            </div>
            <div className="admin-inline-btns">
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Saving…' : 'Save analyst'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {rows.map(a => (
          <div key={a.id} className="analyst-card" style={{ display: 'grid', gridTemplateColumns: '90px 1fr', position: 'relative' }}>
            <div style={{ borderTop: '3px solid var(--chd-bronze)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
            <div className="analyst-photo" style={{ minHeight: 140, marginTop: 3 }}>
              {a.photo_path ? <img src={`/assets/img/${a.photo_path}`} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} /> : null}
              <span className="analyst-initials">{a.name.split(' ').map(p => p[0]).join('').slice(0, 2)}</span>
            </div>
            <div className="analyst-info">
              <p className="analyst-role">{a.title}</p>
              <h3>{a.name}</h3>
              <div className="analyst-coverage">{(a.coverage ?? []).map(c => <span key={c}>{c}</span>)}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(a)}>Edit</button>
                <button className="admin-icon-btn del" onClick={() => del(a.id)} title="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
