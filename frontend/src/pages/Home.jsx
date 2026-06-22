import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { WEDDING_CONFIG } from '../config/wedding'
import { useLanguage } from '../hooks/useLanguage'
import { useEffect, useState } from 'react'

/* ── Meteo ───────────────────────────────────────────────────────── */
// Provider: WeatherAPI.com (https://www.weatherapi.com/)
// - testo condizioni già localizzato via "lang=it"
// - icone fornite direttamente dall'API (niente mapping manuale)
// - piano gratuito: max 3 giorni di forecast
const WEATHER_API_KEY = 'fb30c9a0bd864816bba202820262106' // 👈 incolla qui la key di weatherapi.com

function fmtTime(timeStr) {
  // WeatherAPI restituisce orari tipo "05:31 AM", li convertiamo in formato 24h
  return new Date(`2000-01-01 ${timeStr}`).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function WeatherWidget() {
  const { t } = useLanguage()

  const [days, setDays]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}` +
      '&q=40.8518,14.2681' +   // Napoli
      '&days=3&lang=it&aqi=no&alerts=no'
    )
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error.message)
        setDays(data.forecast.forecastday.map(d => ({
          date:     new Date(d.date + 'T00:00:00'),
          icon:     `https:${d.day.condition.icon}`,
          label:    d.day.condition.text,
          max:      Math.round(d.day.maxtemp_c),
          min:      Math.round(d.day.mintemp_c),
          humidity: Math.round(d.day.avghumidity),
          sunrise:  fmtTime(d.astro.sunrise),
          sunset:   fmtTime(d.astro.sunset),
        })))
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const today    = new Date()
  const tomorrow = new Date(today.getTime() + 86400000)

  function dayLabel(date) {
    if (date.toDateString() === today.toDateString())    return t('home.today')
    if (date.toDateString() === tomorrow.toDateString()) return t('home.tomorrow')
    return date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--warm-gray)' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: 24, color: 'var(--warm-gray)', fontSize: '.9rem' }}>
      {t('home.weatherError')}
    </div>
  )

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    }}>
      {days.map((d, i) => {
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
            <img src={d.icon} alt={d.label} style={{ width: 48, height: 48, margin: '0 auto' }} />
            <div style={{ fontSize: '.7rem', color: 'var(--warm-gray)', lineHeight: 1.3 }}>{d.label}</div>
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
function SpotifyWidget({ title }) {
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
      <iframe
        title={title}
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
// WEDDING_CONFIG.date è in formato "GG-MM-AAAA": il parsing va fatto a
// mano perché new Date("14-06-2027") non è uno standard ISO e il
// risultato cambia da browser a browser.
function parseWeddingDateTime(dateStr, timeStr) {
  const [day, month, year] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute)
}

function Countdown() {
  const { t } = useLanguage()
  const wedding = parseWeddingDateTime(WEDDING_CONFIG.date, WEDDING_CONFIG.venue.ceremony.time)
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
  {t('home.weddingPast')}
</p>
  )

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {[
        [t('home.countdownDays'), diff.d],
        [t('home.countdownHours'), diff.h],
        [t('home.countdownMinutes'), diff.m],
        [t('home.countdownSeconds'), diff.s],
      ].map(([label, val]) => (
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
// icona/colore/rotta non sono testo da tradurre, restano qui;
// label/desc arrivano da translations.js (home.quickLinks).
const QUICK_LINKS_META = {
  rsvp:    { icon: '✉️', to: '/rsvp',    color: 'var(--rose)' },
  menu:    { icon: '🍽️', to: '/menu',    color: 'var(--gold)' },
  gallery: { icon: '📷', to: '/gallery', color: 'var(--sage)' },
  chat:    { icon: '💌', to: '/chat',    color: 'var(--blush)' },
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const quickLinksText = t('home.quickLinks')
  const quickLinks = Object.entries(QUICK_LINKS_META).map(([key, meta]) => ({
    ...meta,
    label: quickLinksText[key]?.label,
    desc: quickLinksText[key]?.desc,
  }))

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
            {t('home.heroEyebrow')}
          </p>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 300,
            fontSize: 'clamp(3rem, 10vw, 5.5rem)',
            color: '#fff', lineHeight: 1.1, marginBottom: 8,
            textShadow: '0 2px 20px rgba(0,0,0,.3)',
          }}>
            {WEDDING_CONFIG.couple.bride}
            <span style={{ color: 'var(--blush)', fontStyle: 'italic', fontSize: '.7em', margin: '0 .3em' }}>&amp;</span>
            {WEDDING_CONFIG.couple.groom}
          </h1>

          <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,.5)', margin: '20px auto' }} />

          <p style={{ color: 'rgba(255,255,255,.9)', fontSize: '1.05rem', marginBottom: 8 }}>
            {t('home.heroTime', { date: WEDDING_CONFIG.date, time: WEDDING_CONFIG.venue.ceremony.time })}
          </p>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.95rem', marginBottom: 40 }}>
            {t('home.heroLocation')}
          </p>

          <Countdown />

          <div style={{ marginTop: 48, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/rsvp')}>
              {t('home.heroCtaRsvp')}
            </button>
            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff' }}
              onClick={() => navigate('/menu')}
            >
              {t('home.heroCtaMenu')}
            </button>
          </div>
        </div>
      </section>

      {/* ── Meteo ── */}
      <section style={{ padding: '60px 20px', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: 8 }}>
              {t('home.weatherTitle')}
            </h2>
            <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem' }}>
              {t('home.weatherSubtitle')}
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
              {t('home.playlistTitle')}
            </h2>
            <p style={{ color: 'var(--warm-gray)', fontSize: '.9rem' }}>
              {t('home.playlistSubtitle')}
            </p>
          </div>
          <SpotifyWidget title={t('home.playlistFrameTitle')} />
        </div>
      </section>

      {/* ── Quick links ── */}
      <section style={{ padding: '60px 20px', background: 'var(--white)' }}>
        <div className="container">
          <div className="divider" style={{ marginBottom: 40 }}>
            <span>{t('home.sectionsDivider')}</span>
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
            {t('home.storyTitle')}
          </h2>
          <div style={{ width: 60, height: 1, background: 'var(--blush)', margin: '0 auto 24px' }} />
          <p style={{ color: 'var(--warm-gray)', lineHeight: 1.8, fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            "{t('home.storyQuote')}"
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {t('home.timeline').map(s => (
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