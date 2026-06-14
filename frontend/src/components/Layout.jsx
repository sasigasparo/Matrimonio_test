import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/',        label: 'Home',           icon: '🏠', public: true },
  { to: '/menu',    label: 'Menù',           icon: '🍽️', public: true },
  { to: '/gallery', label: 'Gallery',        icon: '📷', public: true },
  { to: '/rsvp',    label: 'Sezione inviti', icon: '✉️', public: false },
  { to: '/chat',    label: 'Chat',           icon: '💬', public: false },
  { to: '/luoghi',  label: 'Luoghi',         icon: '📍', public: true },
  { to: '/faq',     label: 'FAQ',            icon: '🙋', public: true },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const visible = navItems.filter(n => {
    if (n.admin)   return user?.is_admin
    if (!n.public) return !!user
    return true
  })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,247,242,.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(200,162,168,.2)' : '1px solid transparent',
        transition: 'all .3s ease',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          <NavLink to="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.3rem',
              color: 'var(--charcoal)', letterSpacing: '.04em',
            }}>
              Sofia & Marco
            </span>
          </NavLink>

          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {visible.filter(n => !n.public || ['/menu', '/gallery'].includes(n.to)).map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                style={({ isActive }) => ({
                  padding: '6px 14px', borderRadius: 99, fontSize: '.85rem', fontWeight: 500,
                  color: isActive ? 'var(--rose)' : 'var(--warm-gray)',
                  background: isActive ? 'rgba(200,130,106,.1)' : 'transparent',
                  textDecoration: 'none', transition: 'all .2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                })}
              >
                <span className="hide-mobile">{n.label}</span>
                <span style={{ fontSize: '.95rem' }}>{n.icon}</span>
              </NavLink>
            ))}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e8c4a8&color=2c2420`}
                  alt={user.name}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--blush)' }}
                />
                <button className="btn btn-ghost btn-sm" onClick={logout}>Esci</button>
              </div>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/login')}
                style={{ marginLeft: 8 }}
              >
                Accedi 🌸
              </button>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(250,247,242,.97)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(200,162,168,.2)',
        display: 'flex', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="mobile-nav">
        {visible.map(n => {
          const isActive = location.pathname === n.to
          return (
            <NavLink
              key={n.to}
              to={n.to}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '10px 4px',
                color: isActive ? 'var(--rose)' : 'var(--warm-gray)',
                textDecoration: 'none', fontSize: '.65rem',
                fontWeight: 500, gap: 3, letterSpacing: '.03em',
                transition: 'color .2s',
              }}
            >
              <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          )
        })}
      </nav>

      <div style={{ height: 72 }} className="mobile-spacer" />

      <style>{`
        @media (min-width: 641px) {
          .mobile-nav    { display: none !important; }
          .mobile-spacer { display: none !important; }
        }
      `}</style>
    </div>
  )
}