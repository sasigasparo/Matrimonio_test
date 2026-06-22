import { useState } from 'react'
import { WEDDING_CONFIG } from '../config/wedding'

const ADMIN_TABLE_PASSWORD = WEDDING_CONFIG.admin.tablePassword
const SESSION_KEY = 'wedding_tables_auth'

export function useTableAuth() {
  const check = () => sessionStorage.getItem(SESSION_KEY) === '1'
  const grant  = () => sessionStorage.setItem(SESSION_KEY, '1')
  const revoke = () => sessionStorage.removeItem(SESSION_KEY)
  return { isGranted: check, grant, revoke }
}

export default function TableAuth({ onSuccess }) {
  const [pwd, setPwd]       = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (pwd === ADMIN_TABLE_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, '1')
        onSuccess()
      } else {
        setError('Password non corretta')
        setPwd('')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 24,
      background: 'linear-gradient(135deg, var(--ivory,#faf6f0) 0%, var(--cream,#f5ede4) 100%)',
    }}>
      <div style={{ fontSize: '2.8rem' }}>🪑</div>
      <h2 style={{
        fontFamily: 'Georgia, serif', fontSize: '1.7rem',
        color: 'var(--charcoal,#2c2420)', margin: 0, textAlign: 'center',
      }}>
        Area Tavoli
      </h2>
      <p style={{ color: 'var(--warm-gray,#9a8070)', margin: 0, textAlign: 'center', maxWidth: 300, fontSize: '0.9rem' }}>
        Inserisci la password amministratore per gestire la disposizione dei tavoli
      </p>

      <form onSubmit={handleSubmit} style={{
        width: '100%', maxWidth: 340,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--charcoal,#2c2420)' }}>
            Password admin
          </label>
          <div style={{ position: 'relative', display: 'flex' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError('') }}
              placeholder="••••••••"
              autoFocus
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 44px 12px 14px',
                border: `1.5px solid ${error ? '#fcc' : 'rgba(200,162,168,0.4)'}`,
                borderRadius: 10, fontSize: '1rem',
                fontFamily: 'inherit', outline: 'none',
                background: '#fff',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              disabled={loading}
              aria-label={showPwd ? 'Nascondi password' : 'Mostra password'}
              aria-pressed={showPwd}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 4, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent',
                color: 'var(--warm-gray,#9a8070)', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.05rem', lineHeight: 1,
                borderRadius: 8,
              }}
            >
              {showPwd ? (
                // occhio "barrato"
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                // occhio aperto
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#fee', border: '1px solid #fcc',
            borderRadius: 8, color: '#c33', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !pwd}
          style={{
            padding: '12px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#c8a2a8,#e8c4a8)',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            fontFamily: 'inherit', cursor: loading || !pwd ? 'not-allowed' : 'pointer',
            opacity: loading || !pwd ? 0.6 : 1,
            transition: 'opacity 0.2s',
            boxShadow: '0 2px 10px rgba(200,130,100,0.2)',
          }}
        >
          {loading ? '⏳ Verifico…' : '🔓 Entra'}
        </button>
      </form>
    </div>
  )
}