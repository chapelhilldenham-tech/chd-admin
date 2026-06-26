import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface Cat { id: string; slug: string; label: string; description: string | null; sort_order: number; visible: boolean }
const EMPTY = { slug: '', label: '', description: '', sort_order: 0, visible: true }

export default function Categories() {
  const [rows, setRows] = useState<Cat[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<Cat | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('research_categories').select('*').order('sort_order')
    setRows((data ?? []) as Cat[])
  }

  function openNew() { setForm(EMPTY); setEditing(null); setIsNew(true) }
  function openEdit(c: Cat) { setForm({ slug: c.slug, label: c.label, description: c.description ?? '', sort_order: c.sort_order, visible: c.visible }); setEditing(c); setIsNew(false) }
  function close() { setEditing(null); setIsNew(false) }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { slug: form.slug, label: form.label, description: form.description, sort_order: Number(form.sort_order), visible: form.visible }
    if (isNew) await supabase.from('research_categories').insert(payload)
    else if (editing) await supabase.from('research_categories').update(payload).eq('id', editing.id)
    setMsg('Saved.'); setSaving(false); close(); load()
  }

  async function del(id: string) {
    if (!confirm('Delete this category?')) return
    await supabase.from('research_categories').delete().eq('id', id)
    setMsg('Deleted.'); load()
  }

  function set(field: string) { return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value })) }

  return (
    <>
      <header className="admin-top">
        <h1>Categories</h1>
        <div className="admin-topbar-actions">
          <button className="admin-btn admin-btn-bronze" onClick={openNew}>+ Add Category</button>
        </div>
      </header>
      {msg && <div className="success-msg">{msg}</div>}
      {(isNew || editing) && (
        <div className="admin-card" style={{ maxWidth: 560, marginBottom: 20 }}>
          <div className="admin-card-head"><h3>{isNew ? 'Add category' : `Edit ${editing?.label}`}</h3></div>
          <form onSubmit={save}>
            <div className="admin-form-grid">
              <div className="admin-field"><label>Label *</label><input value={form.label} onChange={set('label')} required /></div>
              <div className="admin-field"><label>Slug *</label><input value={form.slug} onChange={set('slug')} placeholder="equity" required /></div>
              <div className="admin-field admin-form-full"><label>Description</label><textarea value={form.description} onChange={set('description')} style={{ minHeight: 60 }} /></div>
              <div className="admin-field"><label>Sort order</label><input type="number" value={form.sort_order} onChange={set('sort_order')} /></div>
              <div className="admin-field" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--chd-bronze)' }} />
                <label style={{ color: 'rgba(255,255,255,.7)', textTransform: 'none', letterSpacing: 0, fontSize: 13, marginBottom: 0 }}>Visible on public site</label>
              </div>
            </div>
            <div className="admin-inline-btns">
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Cancel</button>
              <button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Label</th><th>Slug</th><th>Sort</th><th>Visible</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.label}</td>
                <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{c.slug}</td>
                <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 12 }}>{c.sort_order}</td>
                <td><span className={`admin-pill ${c.visible ? 'pill-pub' : 'pill-draft'}`}>{c.visible ? 'Yes' : 'No'}</span></td>
                <td><div className="admin-td-actions"><button className="admin-icon-btn" onClick={() => openEdit(c)}>✎</button><button className="admin-icon-btn del" onClick={() => del(c.id)}>✕</button></div></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 24 }}>No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
