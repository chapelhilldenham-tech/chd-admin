import { useEffect, useState, FormEvent, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Analyst { id: string; name: string }
interface ReportForm { title: string; category: string; abstract: string; publish_status: string; access_level: string; published_at: string; tags: string }

const EMPTY: ReportForm = { title: '', category: 'equity', abstract: '', publish_status: 'draft', access_level: 'subscriber', published_at: '', tags: '' }

export default function ReportEdit() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState<ReportForm>(EMPTY)
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [existingFile, setExistingFile] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('details')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('analysts').select('id,name').order('name').then(({ data }) => setAnalysts((data ?? []) as Analyst[]))
    if (!isNew) {
      setLoading(true)
      supabase.from('research_reports').select('*').eq('uuid', id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({ title: data.title ?? '', category: data.category ?? 'equity', abstract: data.abstract ?? '', publish_status: data.publish_status ?? 'draft', access_level: data.access_level ?? 'subscriber', published_at: data.published_at?.slice(0, 10) ?? '', tags: (data.tags ?? []).join(', ') })
          setExistingFile(data.file_path ?? '')
        }
        setLoading(false)
      })
      supabase.from('research_report_analysts').select('analyst_id').eq('report_uuid', id).then(({ data }) => setSelectedAnalysts((data ?? []).map((r: any) => r.analyst_id)))
    }
  }, [id, isNew])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      let filePath = existingFile
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `reports/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('research-reports').upload(path, file)
        if (uploadErr) throw new Error(uploadErr.message)
        filePath = path
      }
      const payload = {
        title: form.title, category: form.category, abstract: form.abstract,
        publish_status: form.publish_status, access_level: form.access_level,
        published_at: form.publish_status === 'published' ? (form.published_at || new Date().toISOString()) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        file_path: filePath,
      }
      if (isNew) {
        const { data, error: insErr } = await supabase.from('research_reports').insert(payload).select('uuid').single()
        if (insErr) throw new Error(insErr.message)
        if (selectedAnalysts.length && data) {
          await supabase.from('research_report_analysts').insert(selectedAnalysts.map(aid => ({ report_uuid: data.uuid, analyst_id: aid })))
        }
        navigate('/reports')
      } else {
        const { error: updErr } = await supabase.from('research_reports').update(payload).eq('uuid', id)
        if (updErr) throw new Error(updErr.message)
        await supabase.from('research_report_analysts').delete().eq('report_uuid', id)
        if (selectedAnalysts.length) {
          await supabase.from('research_report_analysts').insert(selectedAnalysts.map(aid => ({ report_uuid: id, analyst_id: aid })))
        }
        navigate('/reports')
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSaving(false)
  }

  function set(field: keyof ReportForm) { return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value })) }

  if (loading) return <div className="loading-screen">Loading…</div>

  return (
    <>
      <header className="admin-top">
        <h1>{isNew ? 'Upload Research' : 'Edit Report'}</h1>
        <div className="admin-topbar-actions">
          <Link to="/reports" className="admin-btn admin-btn-outline admin-btn-sm">← Back</Link>
        </div>
      </header>
      <form onSubmit={handleSubmit} style={{ maxWidth: 800 }}>
        <div className="admin-tabs">
          {['details', 'assignment', 'access'].map(t => (
            <button type="button" key={t} className={`admin-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="admin-card">
          {activeTab === 'details' && (
            <div className="admin-form-grid">
              <div className="admin-field admin-form-full">
                <label>Report title *</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Equities Outlook Q3 2026" required />
              </div>
              <div className="admin-field">
                <label>Category *</label>
                <select value={form.category} onChange={set('category')}>
                  <option value="equity">Equity Research</option>
                  <option value="fixed_income">Fixed Income</option>
                  <option value="macro">Macro</option>
                  <option value="sector">Sector</option>
                  <option value="index">Paramount Index</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Publish status</label>
                <select value={form.publish_status} onChange={set('publish_status')}>
                  <option value="draft">Draft</option>
                  <option value="staged">Staged</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="admin-field admin-form-full">
                <label>Abstract</label>
                <textarea value={form.abstract} onChange={set('abstract')} placeholder="2–3 sentence research summary shown to all visitors…" />
              </div>
              <div className="admin-field admin-form-full">
                <label>Tags (comma separated)</label>
                <input value={form.tags} onChange={set('tags')} placeholder="banking, tier-1, recapitalisation" />
              </div>
              <div className="admin-field admin-form-full">
                <label>PDF File {existingFile && <span style={{ color: 'var(--chd-bronze)', marginLeft: 8 }}>✓ file attached</span>}</label>
                <div className="drop-zone" onClick={() => fileRef.current?.click()}>
                  <span className="drop-zone-icon">↑</span>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
                    {file ? file.name : 'Drag & drop PDF or click to browse'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 4 }}>PDF only · Max 50 MB</div>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'assignment' && (
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 16 }}>Select one or more analysts who authored this report.</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {analysts.map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '9px 12px', background: selectedAnalysts.includes(a.id) ? 'rgba(185,114,49,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${selectedAnalysts.includes(a.id) ? 'rgba(185,114,49,.4)' : 'rgba(255,255,255,.1)'}`, borderRadius: 2 }}>
                    <input type="checkbox" checked={selectedAnalysts.includes(a.id)} onChange={e => setSelectedAnalysts(prev => e.target.checked ? [...prev, a.id] : prev.filter(x => x !== a.id))} style={{ width: 16, height: 16, accentColor: 'var(--chd-bronze)' }} />
                    <span style={{ color: '#fff', fontSize: 13 }}>{a.name}</span>
                  </label>
                ))}
                {analysts.length === 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>No analysts found. Add analysts first.</p>}
              </div>
            </div>
          )}
          {activeTab === 'access' && (
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Access level *</label>
                <select value={form.access_level} onChange={set('access_level')}>
                  <option value="public">Public (free to all)</option>
                  <option value="subscriber">Subscriber only</option>
                  <option value="director">Director only</option>
                </select>
              </div>
              <div className="admin-field">
                <label>Publish date</label>
                <input type="date" value={form.published_at} onChange={set('published_at')} />
              </div>
            </div>
          )}
          <div className="admin-inline-btns">
            <Link to="/reports" className="admin-btn admin-btn-outline">Cancel</Link>
            <button type="submit" name="status" value="staged" className="admin-btn admin-btn-outline" disabled={saving} onClick={() => setForm(f => ({ ...f, publish_status: 'staged' }))}>Stage for review</button>
            <button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Save report' : 'Update report'}</button>
          </div>
        </div>
      </form>
    </>
  )
}
