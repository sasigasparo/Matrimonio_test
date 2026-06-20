import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { WEDDING_CONFIG } from '../config/wedding'
import { useEffect, useState } from 'react'

/* ── Meteo ───────────────────────────────────────────────────────── */
const WEATHER_ICONS = {
  0:  { emoji: '☀️',  label: 'Sereno' },
  1:  { emoji: '🌤️', label: 'Poco nuvoloso' },
  2:  { emoji: '⛅',  label: 'Parzialmente nuvoloso' },
  3:  { emoji: '☁️',  label: 'Nuvoloso' },
  45: { emoji: '🌫️', label: 'Nebbia' },
  48: { emoji: '🌫️', label: 'Nebbia' },
  51: { emoji: '🌦️', label: 'Pioggerella' },
  53: { emoji: '🌦️', label: 'Pioggerella' },
  55: { emoji: '🌦️', label: 'Pioggerella' },
  61: { emoji: '🌧️', label: 'Pioggia' },
  63: { emoji: '🌧️', label: 'Pioggia' },
  65: { emoji: '🌧️', label: 'Pioggia intensa' },
  80: { emoji: '🌦️', label: 'Rovesci' },
  81: { emoji: '🌧️', label: 'Rovesci forti' },
  95: { emoji: '⛈️',  label: 'Temporale' },
  99: { emoji: '⛈️',  label: 'Temporale forte' },
}

function getWeather(code) {
  return WEATHER_ICONS[code] || { emoji: '🌡️', label: 'Variabile' }
}

function fmt(timeStr) {
  return new Date(timeStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function WeatherWidget() {
  const [days, setDays]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=40.8518&longitude=14.2681' +   // Napoli
      '&daily=weathercode,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,sunrise,sunset' +
      '&timezone=Europe%2FRome&forecast_days=5'
    )
      .then(r => r.json())
      .then(data => {
        const d = data.daily
        setDays(d.time.map((t, i) => ({
          date:     new Date(t),
          code:     d.weathercode[i],
          max:      Math.round(d.temperature_2m_max[i]),
          min:      Math.round(d.temperature_2m_min[i]),
          humidity: Math.round(d.relative_humidity_2m_max[i]),
          sunrise:  fmt(d.sunrise[i]),
          sunset:   fmt(d.sunset[i]),
        })))
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const today    = new Date()
  const tomorrow = new Date(today.getTime() + 86400000)

  function dayLabel(date) {
    if (date.toDateString() === today.toDateString())    return 'Oggi'
    if (date.toDateString() === tomorrow.toDateString()) return 'Domani'
    return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--warm-gray)' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: 24, color: 'var(--warm-gray)', fontSize: '.9rem' }}>
      ⚠️ Impossibile caricare le previsioni meteo
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 8,
    }}>
      {days.map((d, i) => {
        const w       = getWeather(d.code)
        const isToday = i === 0
        return (
          <div key={i} style={{
            background: isToday ? 'rgba(200,130,106,.1)' : 'var(--ivory)',
            border: `1.5px solid ${isToday ? 'rgba(200,130,106,.35)' : 'rgba(200,162,168,.2)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 8px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{
              fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: isToday ? 'var(--rose)' : 'var(--warm-gray)',
            }}>
              {dayLabel(d.date)}
            </div>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>{w.emoji}</div>
            <div style={{ fontSize: '.7rem', color: 'var(--warm-gray)', lineHeight: 1.3 }}>{w.label}</div>
            <div style={{ fontWeight: 600, color: 'var(--charcoal)', fontSize: '.95rem' }}>
              <span style={{ color: 'var(--rose)' }}>{d.max}°</span>
              <span style={{ color: 'var(--warm-gray)', fontWeight: 400 }}> / {d.min}°</span>
            </div>
            <div style={{ fontSize: '.68rem', color: 'var(--warm-gray)' }}>💧 {d.humidity}%</div>
            <div style={{ fontSize: '.65rem', color: 'var(--warm-gray)', lineHeight: 1.5 }}>
              🌅 {d.sunrise}<br />🌇 {d.sunset}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Spotify ─────────────────────────────────────────────────────── */
function SpotifyWidget() {
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <iframe
        title="Playlist matrimonio Sofia & Marco"
        src="https://open.spotify.com/embed/playlist/04hXZMm6GPheiarj7Ib9xo?utm_source=generator&theme=1"
        width="100%"
        height="380"
        style={{ display: 'white', border: 'none' }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  )
}


/* ── Countdown ───────────────────────────────────────────────────── */
function Countdown() {
  const wedding = new Date('2025-06-14T15:00:00')
  const [diff, setDiff] = useState({})

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const ms  = wedding - now
      if (ms <= 0) { setDiff({ past: true }); return }
      setDiff({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000) / 60000),
        s: Math.floor((ms % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (diff.past) return (
<p style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
  VI ASPETTIAMO 💍
</p>
  )

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {[['Giorni', diff.d], ['Ore', diff.h], ['Minuti', diff.m], ['Secondi', diff.s]].map(([label, val]) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px', textAlign: 'center',
          border: '1px solid rgba(255,255,255,.3)', minWidth: 70,
        }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: '#fff', lineHeight: 1 }}>
            {String(val ?? 0).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.8)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 4 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Home ────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate()

  const quickLinks = [
    { icon: '✉️', label: 'Conferma presenza',  to: '/rsvp',    color: 'var(--rose)',  desc: "Rispondi all'invito" },
    { icon: '🍽️', label: 'Scopri il menù',     to: '/menu',    color: 'var(--gold)',  desc: 'La nostra selezione' },
    { icon: '📷', label: 'Galleria foto',       to: '/gallery', color: 'var(--sage)',  desc: 'Scatta e condividi' },
    { icon: '💌', label: 'Lascia un messaggio', to: '/chat',    color: 'var(--blush)', desc: 'Parla agli sposi' },
  ]

  return (
    <div className="page-enter" style={{ paddingBottom: 40 }}>

      {/* ── Hero con foto Vesuvio ── */}
      <section style={{
        minHeight: '90dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        {/* Foto di sfondo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(foto_sfondo/vesuvio.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Overlay scuro per leggibilità */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,.45) 0%, rgba(0,0,0,.25) 60%, rgba(0,0,0,.55) 100%)',
        }} />

        {/* Contenuto */}
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            color: 'rgba(255,255,255,.85)', fontSize: '1.1rem', letterSpacing: '.06em',
            marginBottom: 16,
          }}>
            Vi invitano a condividere la loro gioia
          </p>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(3rem, 10vw, 5.5rem)',
            color: '#fff', lineHeight: 1.1, marginBottom: 8,
            textShadow: '0 2px 20px rgba(0,0,0,.3)',
          }}>
            Sofia
            <span style={{ color: 'var(--blush)', fontStyle: 'italic', fontSize: '.7em', margin: '0 .3em' }}>&amp;</span>
            Marco
          </h1>

          <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,.5)', margin: '20px auto' }} />

          <p style={{ color: 'rgba(255,255,255,.9)', fontSize: '1.05rem', marginBottom: 8 }}>
            {WEDDING_CONFIG.date} · ore 15:00
          </p>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.95rem', marginBottom: 40 }}>
            📍 Napoli, con vista sul Vesuvio
          </p>

          <Countdown />

          <div style={{ marginTop: 48, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/rsvp')}>
              Conferma la tua presenza ✉️
            </button>
            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff' }}
              onClick={() => navigate('/menu')}
            >
              Scopri il menù
            </button>
          </div>
        </div>
      </section>

      {/* ── Meteo ── */}
      <section style={{ padding: '60px 20px', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 8 }}>
              🌤️ Previsioni meteo
            </h2>
            <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem' }}>
              Napoli · aggiornate in tempo reale
            </p>
          </div>
          <WeatherWidget />
        </div>
      </section>

      {/* ── Playlist ── */}
      <section style={{ padding: '60px 20px', background: 'var(--cream)' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 8 }}>
              🎵 La nostra playlist
            </h2>
            <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem' }}>
              Le canzoni che raccontano la nostra storia
            </p>
          </div>
          <SpotifyWidget />
        </div>
      </section>

      {/* ── Quick links ── */}
      <section style={{ padding: '60px 20px', background: 'var(--white)' }}>
        <div className="container">
          <div className="divider" style={{ marginBottom: 40 }}>
            <span>Le sezioni</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {quickLinks.map(l => (
              <button
                key={l.to}
                onClick={() => navigate(l.to)}
                style={{
                  background: 'var(--ivory)', border: '1.5px solid rgba(200,162,168,.2)',
                  borderRadius: 'var(--radius-lg)', padding: '28px 24px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all .3s ease', display: 'flex', flexDirection: 'column', gap: 8,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.borderColor = l.color
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = 'rgba(200,162,168,.2)'
                }}
              >
                <span style={{ fontSize: '2rem' }}>{l.icon}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--charcoal)' }}>{l.label}</span>
                <span style={{ fontSize: '.85rem', color: 'var(--warm-gray)' }}>{l.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* ── Storia ── */}
      <section style={{ padding: '80px 20px', background: 'var(--white)' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--charcoal)', marginBottom: 16 }}>
            La nostra storia
          </h2>
          <div style={{ width: 60, height: 1, background: 'var(--blush)', margin: '0 auto 24px' }} />
          <p style={{ color: 'var(--warm-gray)', lineHeight: 1.8, fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            "Ci siamo incontrati per caso, ci siamo scelti per amore.
            Ogni giorno insieme è stato un regalo, e oggi vogliamo condividere
            la più grande avventura della nostra vita con le persone che amiamo."
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { year: '2019', event: 'Il primo incontro' },
              { year: '2021', event: 'La prima estate insieme' },
              { year: '2023', event: 'La proposta' },
              { year: '2025', event: 'Il grande giorno 💍' },
            ].map(s => (
              <div key={s.year} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--rose)' }}>{s.year}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--warm-gray)', marginTop: 4 }}>{s.event}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}