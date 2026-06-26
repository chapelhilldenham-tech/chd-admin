import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface Plan { id: string; name: string; price_naira: number; period: string; features: string[]; active: boolean; sort_order: number; description: string | null }
const EMPTY = { name: '', price_naira: '', period: 'annual', features: '', active: true, sort_order: 0, description: '' }

export default function PriceLists() {
  const [rows, setRows] = useState<Plan[]>([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('price_lists').select('*').order('sort_order')
    setRows((data ?? []) as Plan[])
  }

  function openNew() { setForm(EMPTY); setEditing(null); setIsNew(true) }
  function openEdit(p: Plan) { setForm({ name: p.name, price_naira: String(p.price_naira), period: p.period, features: (p.features ?? []).join('\n'), active: p.active, sort_order: p.sort_order, description: p.description ?? '' }); setEditing(p); setIsNew(false) }
  function close() { setEditing(null); setIsNew(false) }

  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    const payload = { name: form.name, price_naira: Number(form.price_naira), period: form.period, features: form.features.split('\n').map(s => s.trim()).filter(Boolean), active: form.active, sort_order: Number(form.sort_order), description: form.description }
    if (isNew) await supabase.from('price_lists').insert(payload)
    else if (editing) await supabase.from('price_lists').update(payload).eq('id', editing.id)
    setMsg('Saved.'); setSaving(false); close(); load()
  }

  async function del(id: string) {
    if (!confirm('Delete this plan?')) return
    await supabase.from('price_lists').delete().eq('id', id)
    setMsg('Deleted.'); load()
  }

  return (
    <>
      <header className="admin-top">
        <h1>Price Lists</h1>
        <div className="admin-topbar-actions"><button className="admin-btn admin-btn-bronze" onClick={openNew}>+ Add Plan</button></div>
      </header>
      {msg && <div className="success-msg">{msg}</div>}
      {(isNew || editing) && (
        <div className="admin-card" style={{ maxWidth: 600, marginBottom: 20 }}>
          <div className="admin-card-head"><h3>{isNew ? 'New plan' : `Edit ${editing?.name}`}</h3></div>
          <form onSubmit={save}>
            <div className="admin-form-grid">
              <div className="admin-field admin-form-full"><label>Plan name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="admin-field"><label>Price (₦) *</label><input type="number" value={form.price_naira} onChange={e => setForm(f => ({ ...f, price_naira: e.target.value }))} required /></div>
              <div className="admin-field"><label>Period</label><select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}><option value="annual">Annual</option><option value="monthly">Monthly</option></select></div>
              <div className="admin-field admin-form-full"><label>Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="admin-field admin-form-full"><label>Features (one per line)</label><textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="All equity research&#10;Sector notes & updates&#10;PDF downloads" style={{ minHeight: 100 }} /></div>
              <div className="admin-field"><label>Sort order</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
              <div className="admin-field" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--chd-bronze)' }} />
                <label style={{ color: 'rgba(255,255,255,.7)', textTransform: 'none', letterSpacing: 0, fontSize: 13, marginBottom: 0 }}>Active / visible on public site</label>
              </div>
            </div>
            <div className="admin-inline-btns"><button type="button" className="admin-btn admin-btn-outline" onClick={close}>Cancel</button><button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</button></div>
          </form>
        </div>
      )}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead><tr><th>Plan name</th><th>Price (₦)</th><th>Period</th><th>Features</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 13 }}>{p.price_naira.toLocaleString()}</td>
                <td style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{p.period}</td>
                <td style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{(p.features ?? []).slice(0, 2).join(' · ')}{(p.features ?? []).length > 2 ? '…' : ''}</td>
                <td><span className={`admin-pill ${p.active ? 'pill-pub' : 'pill-draft'}`}>{p.active ? 'Active' : 'Inactive'}</span></td>
                <td><div className="admin-td-actions"><button className="admin-icon-btn" onClick={() => openEdit(p)}>✎</button><button className="admin-icon-btn del" onClick={() => del(p.id)}>✕</button></div></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 24 }}>No pricing plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
