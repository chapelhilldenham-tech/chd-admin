import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Stats { reports: number; published: number; staged: number; subscribers: number; contacts: number }
interface RecentReport { id: string; uuid: string; title: string; category: string; publish_status: string; created_at: string }
interface Activity { id: string; action: string; table_name: string; record_id: string; created_at: string; admin_email: string | null }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ reports: 0, published: 0, staged: 0, subscribers: 0, contacts: 0 })
  const [staged, setStaged] = useState<RecentReport[]>([])
  const [activity, setActivity] = useState<Activity[]>([])

  useEffect(() => {
    async function load() {
      const [rAll, rPub, rStaged, subs, contacts, stagReports, auditRows] = await Promise.all([
        supabase.from('research_reports').select('id', { count: 'exact', head: true }),
        supabase.from('research_reports').select('id', { count: 'exact', head: true }).eq('publish_status', 'published'),
        supabase.from('research_reports').select('id', { count: 'exact', head: true }).eq('publish_status', 'staged'),
        supabase.from('admin_users').select('id', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('research_reports').select('id,uuid,title,category,publish_status,created_at').eq('publish_status', 'staged').order('created_at', { ascending: false }).limit(5),
        supabase.from('audit_log').select('id,action,table_name,record_id,created_at,admin_email').order('created_at', { ascending: false }).limit(6),
      ])
      setStats({
        reports: rAll.count ?? 0,
        published: rPub.count ?? 0,
        staged: rStaged.count ?? 0,
        subscribers: subs.count ?? 0,
        contacts: contacts.count ?? 0,
      })
      setStaged((stagReports.data ?? []) as RecentReport[])
      setActivity((auditRows.data ?? []) as Activity[])
    }
    load()
  }, [])

  const statusPill = (s: string) => {
    const map: Record<string, string> = { published: 'pill-pub', staged: 'pill-staged', draft: 'pill-draft', archived: 'pill-arch' }
    return <span className={`admin-pill ${map[s] ?? 'pill-draft'}`}>{s}</span>
  }

  return (
    <>
      <header className="admin-top">
        <h1>Dashboard</h1>
        <div className="admin-topbar-actions">
          <Link to="/reports/new" className="admin-btn admin-btn-bronze">+ Upload Research</Link>
        </div>
      </header>

      <div className="admin-kpi-grid">
        <div className="admin-kpi"><span className="admin-kpi-label">Total reports</span><strong className="admin-kpi-val">{stats.reports}</strong><span className="admin-kpi-sub">{stats.published} published</span></div>
        <div className="admin-kpi"><span className="admin-kpi-label">Pending review</span><strong className="admin-kpi-val">{stats.staged}</strong><span className="admin-kpi-sub">Staged, awaiting publish</span></div>
        <div className="admin-kpi"><span className="admin-kpi-label">Admin users</span><strong className="admin-kpi-val">{stats.subscribers}</strong></div>
        <div className="admin-kpi"><span className="admin-kpi-label">New enquiries</span><strong className="admin-kpi-val">{stats.contacts}</strong><span className="admin-kpi-sub">Unread in inbox</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Reports by category</h3>
          </div>
          <div className="bar-row">
            {[['Equity', 82, '72%'], ['Fixed Inc.', 47, '46%'], ['Macro', 21, '21%'], ['Sectors', 11, '11%'], ['Index', 5, '5%']].map(([lbl, val, h]) => (
              <div key={String(lbl)} className="bar-col" style={{ height: String(h) }}>
                <span className="bar-val">{String(val)}</span>
                <span className="bar-lbl">{String(lbl)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-head"><h3>Recent activity</h3></div>
          <div>
            {activity.length === 0 && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>No recent activity.</p>}
            {activity.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ width: 30, height: 30, background: 'rgba(185,114,49,.2)', color: 'var(--chd-bronze)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, fontSize: 13, flexShrink: 0 }}>
                  {a.action === 'INSERT' ? '+' : a.action === 'DELETE' ? '×' : '✎'}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}><strong>{a.action}</strong> on {a.table_name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', fontFamily: '"IBM Plex Mono",monospace', marginTop: 2 }}>{a.created_at?.slice(0, 16).replace('T', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {staged.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Staged — awaiting publish</h3>
            <Link to="/reports" className="admin-btn admin-btn-outline admin-btn-sm">View all →</Link>
          </div>
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {staged.map(r => (
                <tr key={r.id}>
                  <td><div className="admin-td-title">{r.title}</div></td>
                  <td><div className="admin-td-cat">{r.category}</div></td>
                  <td>{statusPill(r.publish_status)}</td>
                  <td style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{r.created_at?.slice(0, 10)}</td>
                  <td>
                    <div className="admin-td-actions">
                      <Link to={`/reports/${r.uuid}`} className="admin-btn admin-btn-sm admin-btn-outline">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
