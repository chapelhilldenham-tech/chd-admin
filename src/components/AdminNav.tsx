import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  href: string
  label: string
  badge?: string | number
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/reports', label: 'Research Library' },
  { href: '/reports/new', label: 'Upload Research' },
  { href: '/analysts', label: 'Analysts' },
  { href: '/categories', label: 'Categories' },
  { href: '/market-data', label: 'Market Data' },
  { href: '/price-lists', label: 'Price Lists' },
  { href: '/subscribers', label: 'Subscribers' },
  { href: '/contacts', label: 'Contact Inbox' },
  { href: '/settings', label: 'Settings' },
  { href: '/audit', label: 'Audit Log' },
]

export default function AdminNav() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="admin-sidebar">
      <div className="brand-lockup admin-brand">
        <img src="/assets/img/logo-white-transparent.png" alt="Chapel Hill Denham" />
        <span>Research Desk</span>
      </div>
      {NAV.map(item => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          {item.label}
          {item.badge !== undefined && (
            <span className="admin-nav-badge">{item.badge}</span>
          )}
        </NavLink>
      ))}
      <button
        onClick={handleSignOut}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.55)', padding: '0 14px', minHeight: 44, textAlign: 'left', fontFamily: 'inherit', fontSize: 14, display: 'flex', alignItems: 'center', marginTop: 'auto' }}
      >
        Sign Out
      </button>
    </aside>
  )
}
