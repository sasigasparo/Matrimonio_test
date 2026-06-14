import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Home     from './pages/Home'
import Chat     from './pages/Chat'
import Gallery  from './pages/Gallery'
import Rsvp     from './pages/RSVP'
import MenuPage from './pages/MenuPage'
import Admin    from './pages/Admin'
import Login    from './pages/Login'
import Luoghi   from './pages/Luoghi'
import FAQ      from './pages/FAQ'
import Tables   from './pages/Tables'   // ← nuovo

/* ── Redirect al login se non autenticato ───────────────────────── */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  return children
}

/* ── Protected route (admin only) ───────────────────────────────── */
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" />
    </div>
  )
  if (!user?.is_admin) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--warm-gray)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'Georgia, serif', color: 'var(--charcoal)', marginBottom: 12 }}>
          Accesso riservato
        </h2>
        <p>Questa sezione è disponibile solo per gli amministratori.</p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
          Torna alla home
        </button>
      </div>
    )
  }
  return children
}

/* ── Top nav bar ────────────────────────────────────────────────── */
function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  if (location.pathname === '/login') return null

  const nav = [
    { to: '/',        icon: '🏠', label: 'Home' },
    { to: '/chat',    icon: '💬', label: 'Chat' },
    { to: '/gallery', icon: '🎞', label: 'Gallery' },
    { to: '/menu',    icon: '🍽️', label: 'Menù' },
    { to: '/luoghi',  icon: '📍', label: 'Luoghi' },
    { to: '/faq',     icon: '🙋', label: 'FAQ' },
    { to: '/rsvp',    icon: '✉️',  label: 'Inviti' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 210,
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(200,162,168,0.2)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 12px',
      height: 56,
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
          color: 'var(--charcoal)', letterSpacing: '.04em',
          flexShrink: 0, padding: '0 8px 0 0', marginRight: 8,
          whiteSpace: 'nowrap',
        }}
      >
        Sofia & Marco
      </button>

      {/* Nav links */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        overflowX: 'auto', flex: 1,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {nav.map(item => {
          const active = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 10px', border: 'none',
                cursor: 'pointer', flexShrink: 0, borderRadius: 8,
                color: active ? 'var(--rose)' : 'var(--warm-gray)',
                background: active ? 'rgba(200,130,106,.08)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Utente + logout */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0, marginLeft: 8, paddingLeft: 8,
          borderLeft: '1px solid rgba(200,162,168,0.25)',
        }}>
          {user.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: '4px 10px', borderRadius: 99,
                background: 'rgba(138,158,140,0.15)', border: '1px solid rgba(138,158,140,0.3)',
                color: '#5a7a5c', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⚙ Admin
            </button>
          )}
          {user.is_admin && (
            <button
              onClick={() => navigate('/tables')}
              style={{
                padding: '4px 10px', borderRadius: 99,
                background: 'rgba(200,162,168,0.12)', border: '1px solid rgba(200,162,168,0.3)',
                color: '#9a6070', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              🪑 Tavoli
            </button>
          )}
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e8c4a8&color=2c2420`}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--blush)' }}
          />
          <button
            onClick={logout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--warm-gray)', padding: 0, whiteSpace: 'nowrap',
            }}
          >
            Esci
          </button>
        </div>
      )}
    </nav>
  )
}

/* ── App shell ──────────────────────────────────────────────────── */
function AppShell() {
  const location = useLocation()

  return (
    <>
      <NavBar />
      {location.pathname !== '/login' && <div style={{ height: 56 }} />}

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/"        element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/chat"    element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/rsvp"    element={<RequireAuth><Rsvp /></RequireAuth>} />
        <Route path="/menu"    element={<RequireAuth><MenuPage /></RequireAuth>} />
        <Route path="/gallery" element={<RequireAuth><Gallery /></RequireAuth>} />
        <Route path="/luoghi"  element={<RequireAuth><Luoghi /></RequireAuth>} />
        <Route path="/faq"     element={<RequireAuth><FAQ /></RequireAuth>} />
        <Route path="/admin"   element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/tables"  element={<AdminRoute><Tables /></AdminRoute>} />  {/* ← nuovo */}
        <Route path="/messages" element={<RequireAuth><Chat /></RequireAuth>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
