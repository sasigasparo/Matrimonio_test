import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!password) { setError('La password è obbligatoria'); return }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/simple-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Password non valida')
      }

      const data = await response.json()
      localStorage.setItem('wedding_token', data.access_token)
      login(data.guest)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Password non valida')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24,
      background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
      padding: 24,
    }}>
      <div style={{ fontSize: '3rem' }}>🌸</div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'var(--charcoal)', margin: 0 }}>
        Benvenuto
      </h2>
      <p style={{ color: 'var(--warm-gray)', maxWidth: 320, textAlign: 'center', margin: 0 }}>
        Inserisci la password ricevuta per accedere al sito del matrimonio
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--charcoal)' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="Inserisci la password"
            style={{
              padding: 12,
              border: `1px solid ${error ? '#fcc' : 'rgba(200,162,168,.3)'}`,
              borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', outline: 'none',
            }}
            disabled={loading}
            autoFocus
          />
        </div>

        {error && (
          <div style={{ padding: 12, background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? '⏳ Accesso in corso...' : 'Entra 🌸'}
        </button>
      </form>
    </div>
  )
}
