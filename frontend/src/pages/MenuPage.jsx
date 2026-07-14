import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'
import { useLanguage } from '../hooks/useLanguage'
import { WEDDING_CONFIG } from "../config/wedding";



const [_dd, _mm, _yyyy] = WEDDING_CONFIG.date.split('-')
const WEDDING_TIME = new Date(`${_yyyy}-${_mm}-${_dd}T${WEDDING_CONFIG.venue.ceremony.time}:00`)
const UNLOCK_PASSWORD = WEDDING_CONFIG.admin.menuPassword
const SESSION_KEY = 'wedding_menu_auth'

function useCountdown() {
  const calc = () => {
    const ms = WEDDING_TIME - new Date()
    if (ms <= 0) return { past: true, d: 0, h: 0, m: 0, s: 0 }
    return {
      past: false,
      d: Math.floor(ms / 86400000),
      h: Math.floor((ms % 86400000) / 3600000),
      m: Math.floor((ms % 3600000) / 60000),
      s: Math.floor((ms % 60000) / 1000),
    }
  }
  const [diff, setDiff] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setDiff(calc()), 1000)
    return () => clearInterval(id)
  }, [])
  return diff
}

/* ── Eye icon toggle (mostra/nascondi password) ───────────────────── */
function EyeToggleButton({ visible, onClick, dark = false }) {
  const color = dark ? 'rgba(255,255,255,0.5)' : 'var(--warm-gray,#9a8070)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? 'Nascondi password' : 'Mostra password'}
      aria-pressed={visible}
      tabIndex={-1}
      style={{
        position: 'absolute',
        right: 4, top: '50%', transform: 'translateY(-50%)',
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'transparent',
        color, cursor: 'pointer', borderRadius: 8,
      }}
    >
      {visible ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

/* ── Countdown gate with password unlock ─────────────────────────── */
function MenuCountdownGate({ diff, onUnlock }) {
  const { t } = useLanguage()
  const pad = v => String(v ?? 0).padStart(2, '0')
  const [pwd, setPwd]     = useState('')
  const [error, setError] = useState(false)
  const [open, setOpen]   = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const tryUnlock = () => {
    if (pwd === UNLOCK_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
      setPwd('')
      setTimeout(() => setError(false), 1800)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0, zIndex: 100,
      background: 'linear-gradient(155deg, #241019 0%, #3a1d2c 50%, #241019 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(199,107,139,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(67,160,71,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 20, filter: 'drop-shadow(0 0 24px rgba(199,107,139,0.45))' }}>
          🍽️
        </div>

        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          color: 'rgba(255,255,255,0.4)', fontSize: '.9rem',
          letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          {t('menu.revealNotice')}
        </p>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontWeight: 300,
          fontSize: 'clamp(1.8rem, 6vw, 3rem)',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '.05em', marginBottom: 8,
        }}>
          {WEDDING_CONFIG.couple.displayName}
        </h1>

        <p style={{
          color: 'rgba(199,107,139,0.7)', fontFamily: 'Georgia, serif',
          fontStyle: 'italic', fontSize: '.95rem', marginBottom: 48,
        }}>
          {t('menu.dateLocation', { date: WEDDING_CONFIG.date })}
        </p>

        {/* Countdown */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          {[
            { label: t('menu.days'),    val: diff.d },
            { label: t('menu.hours'),   val: diff.h },
            { label: t('menu.minutes'), val: diff.m },
            { label: t('menu.seconds'), val: diff.s },
          ].map(b => (
            <div key={b.label} style={{
              minWidth: 76, padding: '18px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(199,107,139,0.25)',
              borderRadius: 14,
            }}>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
                color: 'rgba(199,107,139,0.95)',
                lineHeight: 1,
                textShadow: '0 0 30px rgba(199,107,139,0.3)',
              }}>
                {pad(b.val)}
              </div>
              <div style={{
                fontSize: '.6rem', color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase', letterSpacing: '.12em', marginTop: 8,
              }}>
                {b.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: 40, height: 1, background: 'rgba(199,107,139,0.2)', margin: '0 auto 40px' }} />

        {/* Password unlock */}
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.15)', cursor: 'pointer',
              padding: '5px 16px', borderRadius: 99, fontSize: '.68rem',
              letterSpacing: '.08em', transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(199,107,139,0.3)'
              e.currentTarget.style.color = 'rgba(199,107,139,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.15)'
            }}
          >
            {t('menu.previewLabel')}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 200 }}>
              <input
                autoFocus
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={e => { setPwd(e.target.value); setError(false) }}
                onKeyDown={e => e.key === 'Enter' && tryUnlock()}
                placeholder={t('menu.passwordPlaceholder')}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 38px 10px 16px', borderRadius: 8, fontSize: '1rem',
                  border: `1.5px solid ${error ? '#c97a7a' : 'rgba(199,107,139,0.35)'}`,
                  background: 'rgba(255,255,255,0.07)', color: '#fff',
                  outline: 'none', textAlign: 'center',
                  transition: 'border-color 0.2s',
                }}
              />
              <EyeToggleButton visible={showPwd} onClick={() => setShowPwd(v => !v)} dark />
            </div>
            {error && (
              <p style={{ color: '#c97a7a', fontSize: '.8rem', margin: 0 }}>{t('menu.wrongPassword')}</p>
            )}
            <button
              onClick={tryUnlock}
              style={{
                padding: '8px 24px', borderRadius: 99,
                background: 'rgba(199,107,139,0.2)',
                border: '1px solid rgba(199,107,139,0.4)',
                color: 'rgba(199,107,139,0.9)', cursor: 'pointer',
                fontSize: '.85rem', letterSpacing: '.06em',
              }}
            >
              {t('menu.unlock')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Course icon map ──────────────────────────────────────────────── */
const COURSE_ICONS = {
  'Benvenuto': { icon: '🥂', color: '#C76B8B', bg: 'rgba(199,107,139,.1)' },
  'Antipasto': { icon: '🥗', color: '#43A047', bg: 'rgba(67,160,71,.1)' },
  'Primo':     { icon: '🍝', color: '#C9A36A', bg: 'rgba(200,169,106,.1)' },
  'Secondo':   { icon: '🥩', color: '#a05840', bg: 'rgba(160,88,64,.1)'   },
  'Dessert':   { icon: '🎂', color: '#C76B8B', bg: 'rgba(199,107,139,.1)' },
  'Drink':     { icon: '🍷', color: '#43A047', bg: 'rgba(67,160,71,.1)' },
}

function DietBadge({ isVegan, isGlutenFree }) {
  const { t } = useLanguage()
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {isVegan      && <span className="badge" style={{ background: '#d4edda', color: '#2d6a4f', fontSize: '.7rem' }}>{t('menu.vegan')}</span>}
      {isGlutenFree && <span className="badge" style={{ background: '#fff3cd', color: '#7a5820', fontSize: '.7rem' }}>{t('menu.glutenFree')}</span>}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function MenuPage() {
  const { user } = useAuth()
  const toast = useToast()
  const countdown = useCountdown()
  const { t } = useLanguage()

  // Admin bypasses the gate entirely
  const isAdmin = !!user?.is_admin
  const checkSession = () => sessionStorage.getItem('wedding_menu_auth') === '1'
  const [unlocked, setUnlocked] = useState(checkSession)
  const menuLocked = !isAdmin && !countdown.past && !unlocked

  const [menu, setMenu]     = useState({ courses: {}, items: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMenu() }, [])

  const loadMenu = async () => {
    try {
      const data = await api.getMenu()
      setMenu(data)
    } catch { toast.error(t('menu.loadError')) }
    setLoading(false)
  }

  const courseOrder  = ['Benvenuto', 'Antipasto', 'Primo', 'Secondo', 'Dessert', 'Drink']
  const visibleCourses = courseOrder.filter(c => menu.courses[c])

  return (
    <div className="page-enter" style={{ paddingBottom: 100 }}>
      {/* Gate overlay */}
      {menuLocked && (
        <MenuCountdownGate diff={countdown} onUnlock={() => {
          sessionStorage.setItem('wedding_menu_auth', '1')
          setUnlocked(true)
        }} />
      )}

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--charcoal) 0%, #46243a 100%)',
        padding: '80px 20px 60px', textAlign: 'center', color: 'var(--white)',
        position: 'relative',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🍽️</div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem,6vw,3.5rem)',
          fontWeight: 300, letterSpacing: '.05em', marginBottom: 12,
        }}>
          {t('menu.title')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.1rem' }}>
          {t('menu.subtitle')}
        </p>
        {isAdmin && !countdown.past && (
          <div style={{
            marginTop: 20, display: 'inline-block',
            background: 'rgba(67,160,71,0.2)', border: '1px solid rgba(67,160,71,0.4)',
            borderRadius: 99, padding: '5px 16px',
            color: 'rgba(67,160,71,0.9)', fontSize: '.78rem', letterSpacing: '.06em',
          }}>
            {t('menu.adminPreview')}
          </div>
        )}
      </div>

      {/* Menu courses — read only */}
      <div className="container" style={{ padding: '48px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : visibleCourses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--warm-gray)', padding: 60 }}>
            {t('menu.notAvailable')}
          </p>
        ) : visibleCourses.map((course, ci) => {
          const info  = COURSE_ICONS[course] || { icon: '🍴', color: 'var(--rose)', bg: 'rgba(199,107,139,.1)' }
          const items = menu.courses[course] || []
          return (
            <div key={course} style={{ marginBottom: 48 }}>
              {/* Course header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: info.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                }}>
                  {info.icon}
                </div>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)', fontSize: '1.8rem',
                    color: 'var(--charcoal)', fontWeight: 400,
                  }}>
                    {t(`menu.courses.${course}`)}
                  </h2>
                  <div style={{ height: 2, width: 40, background: info.color, borderRadius: 99, marginTop: 4 }} />
                </div>
              </div>

              {/* Items — read only cards */}
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid rgba(207,165,181,.15)',
                      padding: '18px 20px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-serif)', fontSize: '1.15rem',
                        color: 'var(--charcoal)', fontWeight: 400, margin: 0,
                      }}>
                        {item.name}
                      </h3>
                      <DietBadge isVegan={item.is_vegan} isGlutenFree={item.is_gluten_free} />
                    </div>
                    {item.description && (
                      <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem', marginTop: 6, lineHeight: 1.6, margin: '6px 0 0' }}>
                        {item.description}
                      </p>
                    )}
                    {item.allergens && (
                      <p style={{ color: 'var(--blush)', fontSize: '.78rem', marginTop: 6, margin: '6px 0 0' }}>
                        {t('menu.allergens', { list: item.allergens })}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {ci < visibleCourses.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 32, opacity: .3 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
                  <span style={{ fontSize: '1.2rem' }}>✿</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--blush)' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}