import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface Series { id: string; series_key: string; label: string; category: string; unit: string | null }
interface DataPoint { id: string; series_id: string; effective_date: string; value: number }

export default function MarketData() {
  const [series, setSeries] = useState<Series[]>([])
  const [points, setPoints] = useState<DataPoint[]>([])
  const [tab, setTab] = useState<'series' | 'points'>('series')
  const [newSeries, setNewSeries] = useState({ series_key: '', label: '', category: 'equity', unit: '' })
  const [newPoint, setNewPoint] = useState({ series_id: '', effective_date: '', value: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('market_data_series').select('*').order('category').then(({ data }) => setSeries((data ?? []) as Series[]))
    supabase.from('market_data_points').select('*').order('effective_date', { ascending: false }).limit(50).then(({ data }) => setPoints((data ?? []) as DataPoint[]))
  }, [msg])

  async function addSeries(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    await supabase.from('market_data_series').insert({ series_key: newSeries.series_key.toUpperCase(), label: newSeries.label, category: newSeries.category, unit: newSeries.unit || null })
    setMsg('Series added.'); setSaving(false); setNewSeries({ series_key: '', label: '', category: 'equity', unit: '' })
  }

  async function addPoint(e: FormEvent) {
    e.preventDefault(); setSaving(true)
    await supabase.from('market_data_points').insert({ series_id: newPoint.series_id, effective_date: newPoint.effective_date, value: parseFloat(newPoint.value) })
    setMsg('Data point added.'); setSaving(false); setNewPoint({ series_id: '', effective_date: '', value: '' })
  }

  async function delSeries(id: string) {
    if (!confirm('Delete this series and all its data points?')) return
    await supabase.from('market_data_points').delete().eq('series_id', id)
    await supabase.from('market_data_series').delete().eq('id', id)
    setMsg('Deleted.')
  }

  async function delPoint(id: string) {
    await supabase.from('market_data_points').delete().eq('id', id)
    setMsg('Point deleted.')
  }

  function seriesLabel(id: string) { return series.find(s => s.id === id)?.label ?? id }

  return (
    <>
      <header className="admin-top"><h1>Market Data</h1></header>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'series' ? ' active' : ''}`} onClick={() => setTab('series')}>Series</button>
        <button className={`admin-tab${tab === 'points' ? ' active' : ''}`} onClick={() => setTab('points')}>Data Points</button>
      </div>

      {tab === 'series' && (
        <>
          <div className="admin-card" style={{ maxWidth: 640 }}>
            <div className="admin-card-head"><h3>Add series</h3></div>
            <form onSubmit={addSeries}>
              <div className="admin-form-grid">
                <div className="admin-field"><label>Series key *</label><input value={newSeries.series_key} onChange={e => setNewSeries(f => ({ ...f, series_key: e.target.value }))} placeholder="NGX_ASI" required style={{ fontFamily: '"IBM Plex Mono",monospace' }} /></div>
                <div className="admin-field"><label>Label *</label><input value={newSeries.label} onChange={e => setNewSeries(f => ({ ...f, label: e.target.value }))} placeholder="NGX All-Share Index" required /></div>
                <div className="admin-field"><label>Category</label>
                  <select value={newSeries.category} onChange={e => setNewSeries(f => ({ ...f, category: e.target.value }))}>
                    <option value="equity">Equity</option><option value="fixed_income">Fixed Income</option><option value="macro">Macro</option><option value="fund">Fund</option>
                  </select>
                </div>
                <div className="admin-field"><label>Unit</label><input value={newSeries.unit} onChange={e => setNewSeries(f => ({ ...f, unit: e.target.value }))} placeholder="NGN, %, bps" /></div>
              </div>
              <div className="admin-inline-btns"><button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Adding…' : 'Add series'}</button></div>
            </form>
          </div>
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            {series.map(s => (
              <div key={s.id} className="admin-series-row">
                <div><div className="admin-series-key">{s.series_key}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>{s.label}</div></div>
                <div><span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.4)' }}>{s.category}</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>{s.unit ?? '—'}</div>
                <div><button className="admin-icon-btn del" onClick={() => delSeries(s.id)}>✕</button></div>
              </div>
            ))}
            {series.length === 0 && <p style={{ padding: 20, color: 'rgba(255,255,255,.35)', fontSize: 13 }}>No series yet.</p>}
          </div>
        </>
      )}

      {tab === 'points' && (
        <>
          <div className="admin-card" style={{ maxWidth: 540 }}>
            <div className="admin-card-head"><h3>Add data point</h3></div>
            <form onSubmit={addPoint}>
              <div className="admin-form-grid">
                <div className="admin-field admin-form-full"><label>Series *</label>
                  <select value={newPoint.series_id} onChange={e => setNewPoint(f => ({ ...f, series_id: e.target.value }))} required>
                    <option value="">— select series —</option>
                    {series.map(s => <option key={s.id} value={s.id}>{s.label} ({s.series_key})</option>)}
                  </select>
                </div>
                <div className="admin-field"><label>Effective date *</label><input type="date" value={newPoint.effective_date} onChange={e => setNewPoint(f => ({ ...f, effective_date: e.target.value }))} required /></div>
                <div className="admin-field"><label>Value *</label><input type="number" step="any" value={newPoint.value} onChange={e => setNewPoint(f => ({ ...f, value: e.target.value }))} required /></div>
              </div>
              <div className="admin-inline-btns"><button type="submit" className="admin-btn admin-btn-bronze" disabled={saving}>{saving ? 'Saving…' : 'Add point'}</button></div>
            </form>
          </div>
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table">
              <thead><tr><th>Series</th><th>Date</th><th>Value</th><th></th></tr></thead>
              <tbody>
                {points.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12 }}>{seriesLabel(p.series_id)}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 12 }}>{p.effective_date}</td>
                    <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 13, fontWeight: 600 }}>{p.value.toLocaleString()}</td>
                    <td><button className="admin-icon-btn del" onClick={() => delPoint(p.id)}>✕</button></td>
                  </tr>
                ))}
                {points.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 24 }}>No data points.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
