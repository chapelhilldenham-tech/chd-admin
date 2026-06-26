import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid credentials or insufficient access permissions.')
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--chd-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, padding: '36px', width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 28 }}>
          <img src="/assets/img/logo-white-transparent.png" alt="Chapel Hill Denham" style={{ width: 180 }} />
        </div>
        <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Admin Access</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 22 }}>Sign in with your admin account to continue.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div className="admin-field">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@chapelhilldenham.com" required autoFocus />
          </div>
          <div className="admin-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-bronze" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
