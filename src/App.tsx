import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AdminNav from './components/AdminNav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import ReportEdit from './pages/ReportEdit'
import Analysts from './pages/Analysts'
import Categories from './pages/Categories'
import MarketData from './pages/MarketData'
import PriceLists from './pages/PriceLists'
import Subscribers from './pages/Subscribers'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'
import AuditLog from './pages/AuditLog'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user || !isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="admin-main">{children}</main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <Guard>
          <Shell>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/new" element={<ReportEdit />} />
              <Route path="reports/:id" element={<ReportEdit />} />
              <Route path="analysts" element={<Analysts />} />
              <Route path="categories" element={<Categories />} />
              <Route path="market-data" element={<MarketData />} />
              <Route path="price-lists" element={<PriceLists />} />
              <Route path="subscribers" element={<Subscribers />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="settings" element={<Settings />} />
              <Route path="audit" element={<AuditLog />} />
            </Routes>
          </Shell>
        </Guard>
      } />
    </Routes>
  )
}
