import { useState, useEffect } from 'react'
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
import Tables   from './pages/Tables'   
import Quiz from './pages/Quiz'

// nel RequireAuth routes:

/* ── Redirect al login se non autenticato ───────────────────────── */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100dvh' }}>
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
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <div className="spinner" />
    </div>
  )
  if (!user?.is_admin) return (
    <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--warm-gray)' }}>
      <div style={{ fontSize:'3rem', marginBottom:16 }}>🔒</div>
      <h2 style={{ fontFamily:'Georgia, serif', color:'var(--charcoal)', marginBottom:12 }}>Accesso riservato</h2>
      <p>Questa sezione è disponibile solo per gli amministratori.</p>
      <button className="btn btn-primary" style={{ marginTop:20 }} onClick={() => navigate('/')}>Torna alla home</button>
    </div>
  )
  return children
}

/* ── Nav items ──────────────────────────────────────────────────── */
const NAV = [
  { to:'/',        icon:'🏠', label:'Home'   },
  { to:'/chat',    icon:'💬', label:'Chat'   },
  { to:'/gallery', icon:'🎞', label:'Gallery'},
  { to:'/menu',    icon:'🍽️', label:'Menù'   },
  { to:'/luoghi',  icon:'📍', label:'Luoghi' },
  { to:'/faq',     icon:'🙋', label:'FAQ'    },
  { to:'/rsvp',    icon:'✉️',  label:'Inviti' },
  { to:'/tables',  icon:'🍽️', label:'Tavoli' },
  { to:'/quiz', icon:'🎮', label:'Quiz' },
]

/* ── Stili globali: loader iniziale + transizione tra pagine ──────── */
function GlobalTransitionStyles() {
  return (
    <style>{`
      .wedding-loader {
        position: fixed;
        inset: 0;
        background: #fdf7f2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: var(--charcoal, #2c2420);
        text-align: center;
        padding: 20px;
      }
      .wedding-loader h2 {
        font-family: var(--font-serif, Georgia, serif);
        font-size: 1.4rem;
        margin: 4px 0 6px;
        letter-spacing: .02em;
      }
      .wedding-loader p {
        font-size: .9rem;
        color: var(--warm-gray, #8a7a72);
        margin: 0;
      }
      .ring {
        font-size: 56px;
        line-height: 1;
        animation: ring-spin 2s linear infinite;
        margin-bottom: 14px;
      }
      @keyframes ring-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      .transition-overlay {
        position: fixed;
        inset: 0;
        background: rgba(253,247,242,0.96);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-serif, Georgia, serif);
        font-size: 1.05rem;
        color: var(--charcoal, #2c2420);
        z-index: 9999;
        animation: overlay-fade .2s ease;
        pointer-events: none;
      }
      @keyframes overlay-fade {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ring { animation: none; }
        .transition-overlay { animation: none; }
      }
    `}</style>
  )
}

/* ── Drawer (mobile) ────────────────────────────────────────────── */
function Drawer({ open, onClose, onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const go = (to) => { onNavigate(to, navigate); onClose() }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:'fixed', inset:0, zIndex:300,
          background:'rgba(44,36,32,0.45)',
          backdropFilter:'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition:'opacity 0.25s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, zIndex:310,
        width:272, maxWidth:'80vw',
        background:'rgba(255,255,255,0.98)',
        backdropFilter:'blur(16px)',
        boxShadow:'4px 0 32px rgba(0,0,0,0.12)',
        display:'flex', flexDirection:'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform 0.28s cubic-bezier(.4,0,.2,1)',
        overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{
          padding:'24px 20px 20px',
          borderBottom:'1px solid rgba(200,162,168,0.2)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.2rem', color:'var(--charcoal)', lineHeight:1.2 }}>
              Sofia &amp; Marco
            </div>
            <div style={{ fontSize:'.72rem', color:'var(--warm-gray)', marginTop:3, letterSpacing:'.04em' }}>
              14 Giugno 2026
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:'1.4rem', color:'var(--warm-gray)',
              lineHeight:1, padding:4, borderRadius:6,
            }}
          >✕</button>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'12px 10px' }}>
          {NAV.map(item => {
            const active = location.pathname === item.to
            return (
              <button
                key={item.to}
                onClick={() => go(item.to)}
                style={{
                  display:'flex', alignItems:'center', gap:14,
                  width:'100%', padding:'13px 14px',
                  border:'none', borderRadius:10, cursor:'pointer',
                  background: active ? 'rgba(200,130,106,.1)' : 'transparent',
                  color: active ? 'var(--rose)' : 'var(--charcoal)',
                  fontFamily:'inherit', fontSize:'.97rem',
                  fontWeight: active ? 600 : 400,
                  textAlign:'left', transition:'background 0.15s',
                  marginBottom:2,
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background='rgba(200,162,168,0.08)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent' }}
              >
                <span style={{ fontSize:'1.2rem', width:26, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span style={{
                    marginLeft:'auto', width:6, height:6, borderRadius:'50%',
                    background:'var(--rose)', flexShrink:0,
                  }} />
                )}
              </button>
            )
          })}

          {/* Admin link */}
          {user?.is_admin && (
            <>
              <div style={{ height:1, background:'rgba(200,162,168,0.2)', margin:'10px 4px' }} />
              <button
                onClick={() => go('/admin')}
                style={{
                  display:'flex', alignItems:'center', gap:14,
                  width:'100%', padding:'13px 14px',
                  border:'none', borderRadius:10, cursor:'pointer',
                  background: location.pathname === '/admin' ? 'rgba(138,158,140,.12)' : 'transparent',
                  color:'#5a7a5c', fontFamily:'inherit',
                  fontSize:'.97rem', fontWeight:600, textAlign:'left',
                }}
              >
                <span style={{ fontSize:'1.2rem', width:26, textAlign:'center' }}>⚙️</span>
                <span>Admin</span>
              </button>
            </>
          )}
        </nav>

        {/* User footer */}
        {user && (
          <div style={{
            padding:'16px 20px',
            borderTop:'1px solid rgba(200,162,168,0.2)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e8c4a8&color=2c2420`}
              style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--blush)', flexShrink:0 }}
            />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.85rem', fontWeight:600, color:'var(--charcoal)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--warm-gray)' }}>
                {user.is_admin ? 'Amministratore' : 'Ospite'}
              </div>
            </div>
            <button
              onClick={() => { logout(); onClose() }}
              style={{
                background:'none', border:'1px solid rgba(200,162,168,0.35)',
                borderRadius:8, cursor:'pointer', padding:'5px 10px',
                color:'var(--warm-gray)', fontSize:'.78rem', flexShrink:0,
              }}
            >
              Esci
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Top nav bar ────────────────────────────────────────────────── */
function NavBar({ onMenuOpen, onNavigate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  if (location.pathname === '/login') return null

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:210,
      background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)',
      borderBottom:'1px solid rgba(200,162,168,0.2)',
      boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
      display:'flex', alignItems:'center',
      padding:'0 12px', height:56,
    }}>
      {/* Hamburger — visible only on mobile */}
      <button
        onClick={onMenuOpen}
        className="hide-desktop"
        style={{
          background:'none', border:'none', cursor:'pointer',
          fontSize:'1.3rem', color:'var(--charcoal)',
          padding:'6px 8px', marginRight:4, borderRadius:8,
          lineHeight:1, flexShrink:0,
        }}
      >
        ☰
      </button>

      {/* Logo */}
      <button
        onClick={() => onNavigate('/', navigate)}
        style={{
          background:'none', border:'none', cursor:'pointer',
          fontFamily:'var(--font-serif)', fontSize:'1.1rem',
          color:'var(--charcoal)', letterSpacing:'.04em',
          flexShrink:0, padding:'0 8px 0 0', marginRight:8,
          whiteSpace:'nowrap',
        }}
      >
        Sofia &amp; Marco
      </button>

      {/* Nav links — desktop only */}
      <div
        className="hide-mobile"
        style={{
          display:'flex', alignItems:'center', gap:2,
          overflowX:'auto', flex:1,
          scrollbarWidth:'none', msOverflowStyle:'none',
        }}
      >
        {NAV.map(item => {
          const active = location.pathname === item.to
          return (
            <button
              key={item.to}
              onClick={() => onNavigate(item.to, navigate)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:2, padding:'6px 10px', border:'none',
                cursor:'pointer', flexShrink:0, borderRadius:8,
                color: active ? 'var(--rose)' : 'var(--warm-gray)',
                background: active ? 'rgba(200,130,106,.08)' : 'transparent',
                transition:'all 0.2s',
              }}
            >
              <span style={{ fontSize:18, lineHeight:1 }}>{item.icon}</span>
              <span style={{ fontSize:9, fontWeight: active ? 600 : 400, letterSpacing:'.02em', whiteSpace:'nowrap' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Spacer on mobile */}
      <div className="hide-desktop" style={{ flex:1 }} />

      {/* User area */}
      {user && (
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          flexShrink:0, marginLeft:8, paddingLeft:8,
          borderLeft:'1px solid rgba(200,162,168,0.25)',
        }}>
          {user.is_admin && (
            <button
              onClick={() => onNavigate('/admin', navigate)}
              className="hide-mobile"
              style={{
                padding:'4px 10px', borderRadius:99,
                background:'rgba(138,158,140,0.15)', border:'1px solid rgba(138,158,140,0.3)',
                color:'#5a7a5c', fontSize:10, fontWeight:600, cursor:'pointer',
                whiteSpace:'nowrap',
              }}
            >
              ⚙ Admin
            </button>
          )}
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e8c4a8&color=2c2420`}
            style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--blush)' }}
          />
          <button
            onClick={logout}
            className="hide-mobile"
            style={{
              background:'none', border:'none', cursor:'pointer',
              fontSize:11, color:'var(--warm-gray)', padding:0, whiteSpace:'nowrap',
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [appLoading, setAppLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  // Loader iniziale: si mostra una sola volta al primo avvio dell'app
  useEffect(() => {
    const timer = setTimeout(() => setAppLoading(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  // Naviga con una breve dissolvenza invece dello scatto istantaneo
  const navigateWithTransition = (to, navigate) => {
    if (to === location.pathname) return
    setTransitioning(true)
    setTimeout(() => {
      navigate(to)
      setTransitioning(false)
    }, 350)
  }

  if (appLoading) {
    return (
      <>
        <GlobalTransitionStyles />
        <div className="wedding-loader">
          <div className="ring">💍</div>
          <h2>Sofia &amp; Marco</h2>
          <p>Prepariamo un giorno speciale...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <GlobalTransitionStyles />
      <NavBar onMenuOpen={() => setDrawerOpen(true)} onNavigate={navigateWithTransition} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onNavigate={navigateWithTransition} />
      {location.pathname !== '/login' && <div style={{ height:56 }} />}

      {transitioning && (
        <div className="transition-overlay">
          💐 Prepariamo il prossimo momento...
        </div>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/"         element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/chat"     element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/rsvp"     element={<RequireAuth><Rsvp /></RequireAuth>} />
        <Route path="/menu"     element={<RequireAuth><MenuPage /></RequireAuth>} />
        <Route path="/gallery"  element={<RequireAuth><Gallery /></RequireAuth>} />
        <Route path="/luoghi"   element={<RequireAuth><Luoghi /></RequireAuth>} />
        <Route path="/faq"      element={<RequireAuth><FAQ /></RequireAuth>} />
        <Route path="/admin"    element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/tables"  element={<RequireAuth><Tables /></RequireAuth>} />  {/* ← tavoli con password propria */}
        <Route path="/messages" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
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