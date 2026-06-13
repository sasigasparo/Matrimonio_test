import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'


/* ── Wedding countdown ───────────────────────────────────────────── */
// Aggiorna questa data con quella reale del matrimonio
const WEDDING_TIME = new Date('2026-06-14T15:00:00')

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

function MenuCountdownGate({ diff, onUnlock, previewItem }) {
  const pad = v => String(v ?? 0).padStart(2, '0')
  const item = previewItem || {
    course: 'Benvenuto',
    name: 'Cocktail di benvenuto',
    description: 'Prosecco, succhi freschi e stuzzichini misti',
  }
  return (
    <div style={{
      position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 100,
      background: 'linear-gradient(155deg, #1a0e0b 0%, #2c1a14 50%, #1a0e0b 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      pointerEvents: 'auto',
    }}>
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,130,106,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '5%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(138,158,140,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
        <div style={{
          fontSize: '3.5rem', marginBottom: 20,
          filter: 'drop-shadow(0 0 24px rgba(200,130,106,0.45))',
        }}>🍽️</div>

        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          color: 'rgba(255,255,255,0.4)', fontSize: '.9rem',
          letterSpacing: '.12em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          il menù sarà svelato il giorno del matrimonio
        </p>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontWeight: 300,
          fontSize: 'clamp(1.8rem, 6vw, 3rem)',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '.05em', marginBottom: 8,
        }}>
          Sofia &amp; Marco
        </h1>

        <p style={{
          color: 'rgba(200,130,106,0.7)', fontFamily: 'Georgia, serif',
          fontStyle: 'italic', fontSize: '.95rem', marginBottom: 48,
        }}>
          14 Giugno 2026 · Villa Belvedere, Toscana
        </p>

        {/* Countdown boxes */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          {[
            { label: 'Giorni',  val: diff.d },
            { label: 'Ore',     val: diff.h },
            { label: 'Minuti',  val: diff.m },
            { label: 'Secondi', val: diff.s },
          ].map(b => (
            <div key={b.label} style={{
              minWidth: 76, padding: '18px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(200,130,106,0.25)',
              borderRadius: 14,
            }}>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
                color: 'rgba(200,130,106,0.95)',
                lineHeight: 1,
                textShadow: '0 0 30px rgba(200,130,106,0.3)',
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

        <div style={{ width: 40, height: 1, background: 'rgba(200,130,106,0.2)', margin: '0 auto 32px' }} />

        <p style={{
          color: 'rgba(255,255,255,0.2)', fontSize: '.75rem',
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          maxWidth: 260, lineHeight: 1.8, margin: '0 auto 40px',
        }}>
          "Una selezione di sapori per celebrare insieme"
        </p>

        <div style={{
          margin: '0 auto 36px', maxWidth: 440,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 24, padding: 24, textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>{item.course}</span>
            <span style={{ fontSize: '1.1rem' }}>🥂</span>
          </div>
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '1.9rem',
            color: '#fff', margin: 0, lineHeight: 1.1,
          }}>{item.name}</h2>
          {item.description && (
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, lineHeight: 1.7 }}>
              {item.description}
            </p>
          )}
        </div>

        {/* Hidden admin unlock */}
        <button
          onClick={onUnlock}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.15)', cursor: 'pointer',
            padding: '5px 16px', borderRadius: 99, fontSize: '.68rem',
            letterSpacing: '.08em', transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(200,130,106,0.3)'
            e.currentTarget.style.color = 'rgba(200,130,106,0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.15)'
          }}
        >
          anteprima
        </button>
      </div>
    </div>
  )
}

const COURSE_ICONS = {
  'Benvenuto':  { icon:'🥂', color:'#c8826a', bg:'rgba(200,130,106,.1)' },
  'Antipasto':  { icon:'🥗', color:'#8a9e8c', bg:'rgba(138,158,140,.1)' },
  'Primo':      { icon:'🍝', color:'#c8a96a', bg:'rgba(200,169,106,.1)' },
  'Secondo':    { icon:'🥩', color:'#a05840', bg:'rgba(160,88,64,.1)'   },
  'Dessert':    { icon:'🎂', color:'#c8826a', bg:'rgba(200,130,106,.1)' },
  'Drink':      { icon:'🍷', color:'#8a9e8c', bg:'rgba(138,158,140,.1)' },
}

function DietBadge({ isVegan, isGlutenFree }) {
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {isVegan      && <span className="badge" style={{ background:'#d4edda', color:'#2d6a4f', fontSize:'.7rem' }}>🌱 Vegano</span>}
      {isGlutenFree && <span className="badge" style={{ background:'#fff3cd', color:'#7a5820', fontSize:'.7rem' }}>🌾 Senza glutine</span>}
    </div>
  )
}

export default function MenuPage() {
  const { user, login } = useAuth()
  const toast = useToast()
  const countdown = useCountdown()
  const [menuUnlocked, setMenuUnlocked] = useState(false)
  const [menuPreview, setMenuPreview] = useState(false)
  // Gate: locked until wedding date OR manually unlocked (admin preview)
  // ?locked=1 in URL forces the gate even after the date (useful for testing)
  const forceLocked = new URLSearchParams(window.location.search).get('locked') === '1'
  const fullMenuUnlocked = menuUnlocked || countdown.past
  const menuLocked = (forceLocked || !countdown.past) && !fullMenuUnlocked && !menuPreview
  const [menu, setMenu]       = useState({ courses:{}, items:[] })
  const [choices, setChoices] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    loadMenu()
    if (user) loadChoices()
  }, [user])

  const loadMenu = async () => {
    try {
      const data = await api.getMenu()
      setMenu(data)
    } catch(e) { toast.error('Errore caricamento menù') }
    setLoading(false)
  }

  const loadChoices = async () => {
    try {
      const data = await api.myChoices()
      setChoices(new Set(data.item_ids))
    } catch {}
  }

  const toggleChoice = (id) => {
    if (!user) { login(); return }
    setChoices(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setSaved(false)
  }

  const saveChoices = async () => {
    if (!user) { login(); return }
    setSaving(true)
    try {
      await api.saveChoices([...choices])
      setSaved(true)
      toast.success('✓ Preferenze menù salvate!')
    } catch(e) { toast.error('Errore: ' + e.message) }
    setSaving(false)
  }

  const courseOrder = ['Benvenuto', 'Antipasto', 'Primo', 'Secondo', 'Dessert', 'Drink']
  const orderedCourses = courseOrder.filter(c => menu.courses[c])
  const previewOnly = menuPreview && !countdown.past
  const visibleCourses = orderedCourses

  const previewItem = menu.courses?.Benvenuto?.[0] || {
    course: 'Benvenuto',
    name: 'Cocktail di benvenuto',
    description: 'Prosecco, succhi freschi e stuzzichini misti',
  }

  return (
    <div className="page-enter" style={{ paddingBottom:100 }}>
      {menuLocked && (
        <MenuCountdownGate diff={countdown} onUnlock={() => {
          if (countdown.past) setMenuUnlocked(true)
          else setMenuPreview(true)
        }} previewItem={previewItem} />
      )}
      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg, var(--charcoal) 0%, #3d2d28 100%)',
        padding:'80px 20px 60px', textAlign:'center', color:'var(--white)',
      }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>🍽️</div>
        <h1 style={{
          fontFamily:'var(--font-serif)', fontSize:'clamp(2rem,6vw,3.5rem)',
          fontWeight:300, letterSpacing:'.05em', marginBottom:12
        }}>
          Il Menù del Matrimonio
        </h1>
        <p style={{ color:'rgba(255,255,255,.6)', fontFamily:'var(--font-serif)', fontStyle:'italic', fontSize:'1.1rem' }}>
          Una selezione di sapori per celebrare insieme
        </p>

        {previewOnly && (
          <div style={{ margin:'22px auto 0', maxWidth:520, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.14)', borderRadius:18, padding:20 }}>
            <p style={{ color:'rgba(255,255,255,.85)', margin:0, fontSize:'0.95rem' }}>
              Anteprima: per ora è visibile solo la sezione <strong>Benvenuto</strong>. Le altre portate saranno svelate al termine del conto alla rovescia.
            </p>
          </div>
        )}

        {user && (
          <div style={{
            marginTop:28,
            background:'rgba(255,255,255,.08)',
            borderRadius:'var(--radius-md)',
            padding:'12px 24px', display:'inline-flex', gap:12, alignItems:'center'
          }}>
            <span style={{ color:'rgba(255,255,255,.7)', fontSize:'.9rem' }}>
              {choices.size} piatt{choices.size === 1 ? 'o' : 'i'} selezionat{choices.size === 1 ? 'o' : 'i'}
            </span>
            <button
              className="btn btn-sm"
              onClick={saveChoices}
              disabled={saving || choices.size === 0}
              style={{ background:'var(--rose)', color:'#fff' }}
            >
              {saving ? 'Salvo…' : saved ? '✓ Salvato' : 'Salva preferenze'}
            </button>
          </div>
        )}
      </div>

      {/* Menu courses */}
      <div className="container" style={{ padding:'48px 20px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
        ) : visibleCourses.map((course, ci) => {
          const info  = COURSE_ICONS[course] || { icon:'🍴', color:'var(--rose)', bg:'rgba(200,130,106,.1)' }
          const items = menu.courses[course] || []
          return (
            <div key={course} style={{ marginBottom:48 }}>
              {/* Course header */}
              <div style={{
                display:'flex', alignItems:'center', gap:16,
                marginBottom:24
              }}>
                <div style={{
                  width:52, height:52, borderRadius:'50%',
                  background:info.bg, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  fontSize:'1.6rem', flexShrink:0
                }}>
                  {info.icon}
                </div>
                <div>
                  <h2 style={{
                    fontFamily:'var(--font-serif)', fontSize:'1.8rem',
                    color:'var(--charcoal)', fontWeight:400
                  }}>{course}</h2>
                  <div style={{ height:2, width:40, background:info.color, borderRadius:99, marginTop:4 }} />
                </div>
              </div>

              {/* Items */}
              <div style={{ display:'grid', gap:12 }}>
                {items.map(item => {
                  const selected = choices.has(item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChoice(item.id)}
                      style={{
                        background:'var(--white)',
                        borderRadius:'var(--radius-md)',
                        border:`2px solid ${selected ? info.color : 'rgba(200,162,168,.15)'}`,
                        padding:'18px 20px',
                        cursor: user ? 'pointer' : 'default',
                        transition:'all .2s',
                        display:'flex', alignItems:'flex-start', gap:16,
                        boxShadow: selected ? `0 4px 16px ${info.color}22` : 'none',
                        transform: selected ? 'scale(1.01)' : '',
                      }}
                    >
                      {user && (
                        <div style={{
                          width:22, height:22, borderRadius:'50%',
                          border:`2px solid ${selected ? info.color : 'var(--blush)'}`,
                          background: selected ? info.color : 'transparent',
                          flexShrink:0, marginTop:2,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          transition:'all .2s',
                        }}>
                          {selected && <span style={{ color:'#fff', fontSize:'.7rem' }}>✓</span>}
                        </div>
                      )}
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                          <h3 style={{
                            fontFamily:'var(--font-serif)', fontSize:'1.15rem',
                            color:'var(--charcoal)', fontWeight:400
                          }}>{item.name}</h3>
                          <DietBadge isVegan={item.is_vegan} isGlutenFree={item.is_gluten_free} />
                        </div>
                        {item.description && (
                          <p style={{ color:'var(--warm-gray)', fontSize:'.9rem', marginTop:4, lineHeight:1.5 }}>
                            {item.description}
                          </p>
                        )}
                        {item.allergens && (
                          <p style={{ color:'var(--blush)', fontSize:'.78rem', marginTop:6 }}>
                            ⚠️ Allergeni: {item.allergens}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {ci < visibleCourses.length - 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:32, opacity:.3 }}>
                  <div style={{ flex:1, height:1, background:'var(--blush)' }} />
                  <span style={{ fontSize:'1.2rem' }}>✿</span>
                  <div style={{ flex:1, height:1, background:'var(--blush)' }} />
                </div>
              )}
            </div>
          )
        })}

        {!user && (
          <div style={{
            background:'linear-gradient(135deg, rgba(200,130,106,.08), rgba(138,158,140,.08))',
            borderRadius:'var(--radius-lg)', padding:'32px', textAlign:'center',
            border:'1px solid rgba(200,162,168,.2)', marginTop:32
          }}>
            <p style={{ color:'var(--warm-gray)', marginBottom:16 }}>
              Accedi per selezionare le tue preferenze di menù
            </p>
            <button className="btn btn-primary" onClick={login}>
              Accedi con Google
            </button>
          </div>
        )}

        {user && choices.size > 0 && (
          <div style={{ textAlign:'center', marginTop:32 }}>
            <button className="btn btn-primary btn-lg" onClick={saveChoices} disabled={saving}>
              {saving ? 'Salvataggio…' : saved ? '✓ Preferenze salvate!' : `Salva le mie ${choices.size} preferenze`}
            </button>
          </div>
        )}
      </div>

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}