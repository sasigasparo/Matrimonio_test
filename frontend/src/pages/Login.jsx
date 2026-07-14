import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { WEDDING_CONFIG } from '../config/wedding'

const API_URL = (import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!password) { setError(t('login.passwordRequired')); return }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/simple-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Matrimonio-Slug': WEDDING_CONFIG.slug },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || t('login.invalidPassword'))
      }

      const data = await response.json()
      localStorage.setItem('wedding_token', data.access_token)
      login(data.guest)
      navigate('/')
    } catch (err) {
      setError(err.message || t('login.invalidPassword'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="login-page"
      style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .login-page::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 640px; height: 640px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(199,107,139,0.12) 0%, rgba(199,107,139,0) 70%);
          pointer-events: none;
        }
        .login-card { animation: login-rise .6s cubic-bezier(.22,1,.36,1) both; }
        .login-badge { animation: login-breathe 4s ease-in-out infinite; }
        @keyframes login-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes login-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        @keyframes login-spin { to { transform: rotate(360deg); } }
        @keyframes login-fade { from { opacity: 0; } to { opacity: 1; } }
        .login-input { transition: border-color .15s ease, box-shadow .15s ease; }
        .login-input:focus {
          border-color: var(--rose) !important;
          box-shadow: 0 0 0 3px rgba(199,107,139,0.15);
          outline: none;
        }
        .login-eye-btn { transition: color .15s ease; }
        .login-eye-btn:hover { color: var(--charcoal) !important; }
        .login-submit { transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease; }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(199,107,139,0.38);
        }
        .login-error { animation: login-fade .25s ease; }
        @media (prefers-reduced-motion: reduce) {
          .login-card, .login-badge, .login-error { animation: none; }
        }
      `}</style>

      <div
        className="login-card"
        style={{
          position: 'relative',
          width: '100%', maxWidth: 400,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(207,165,181,0.25)',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(44,36,32,0.14)',
          padding: 'clamp(32px, 6vw, 48px) clamp(24px, 6vw, 40px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          textAlign: 'center',
        }}
      >
        {/* Decorative corner flourishes */}
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"
          style={{ position: 'absolute', top: 16, left: 16, opacity: .3, pointerEvents: 'none' }}>
          <path d="M4 36 C4 16 16 4 36 4" stroke="var(--rose)" strokeWidth="1" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="4" r="2" fill="var(--rose)" />
        </svg>
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"
          style={{ position: 'absolute', bottom: 16, right: 16, opacity: .3, transform: 'rotate(180deg)', pointerEvents: 'none' }}>
          <path d="M4 36 C4 16 16 4 36 4" stroke="var(--rose)" strokeWidth="1" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="4" r="2" fill="var(--rose)" />
        </svg>

        <div className="login-badge" style={{
          width: 64, height: 64, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem',
          background: 'linear-gradient(135deg, var(--blush) 0%, rgba(199,107,139,.25) 100%)',
          border: '1px solid rgba(199,107,139,.3)',
          marginBottom: 8,
        }}>
          💍
        </div>

        <div style={{
          fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'var(--rose)', fontWeight: 600,
        }}>
          {t('login.eyebrow', { date: WEDDING_CONFIG.dateLabel })}
        </div>

        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.9rem', color: 'var(--charcoal)', margin: '4px 0 2px' }}>
          {t('login.title')}
        </h2>

        <p style={{ color: 'var(--warm-gray)', fontSize: '.92rem', maxWidth: 300, margin: '0 0 22px', lineHeight: 1.5 }}>
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
            <label htmlFor="login-password" style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--charcoal)' }}>
              {t('login.passwordLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warm-gray)" strokeWidth="2" aria-hidden="true"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <input
                id="login-password"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
                aria-invalid={!!error}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 44px',
                  border: `1px solid ${error ? 'rgba(196,90,79,.4)' : 'rgba(207,165,181,.3)'}`,
                  borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit',
                  background: '#fff',
                }}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--warm-gray)', padding: 6, display: 'flex',
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert" style={{
              padding: '10px 12px', background: 'rgba(196,90,79,0.08)',
              border: '1px solid rgba(196,90,79,0.25)', borderRadius: 10,
              color: '#a0453c', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span aria-hidden="true">⚠️</span><span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-submit"
            aria-busy={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px', border: 'none', borderRadius: 10,
              background: loading ? 'rgba(199,107,139,.6)' : 'linear-gradient(135deg, var(--rose) 0%, var(--rose-deep) 100%)',
              color: '#fff', fontSize: '.97rem', fontWeight: 600, fontFamily: 'inherit',
              cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 8px 20px rgba(199,107,139,.3)',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
                  display: 'inline-block', animation: 'login-spin .7s linear infinite',
                }} />
                {t('login.submitting')}
              </>
            ) : (
              <>{t('login.submit')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
