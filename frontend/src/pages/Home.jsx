import { useNavigate } from 'react-router-dom'
import { WEDDING_CONFIG } from '../config/wedding'
import { useLanguage } from '../hooks/useLanguage'
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Mail, UtensilsCrossed, Camera, MessageCircle, MapPin, Droplets, ChevronDown } from 'lucide-react'

/* ── Reveal-on-scroll wrapper (content visible by default, motion enhances) ── */
function Reveal({ children, delay = 0, y = 24, className, style }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className} style={style}>{children}</div>
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

/* ── Meteo ───────────────────────────────────────────────────────── */
const WEATHER_API_KEY = 'fb30c9a0bd864816bba202820262106'

function fmtTime(timeStr) {
  if (!timeStr) return '--:--'
  try {
    const [time, mer] = timeStr.trim().split(' ')
    const [h, m] = time.split(':').map(Number)
    let hours = h
    if (mer === 'PM' && h !== 12) hours += 12
    if (mer === 'AM' && h === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  } catch { return '--:--' }
}

function WeatherWidget() {
  const { t } = useLanguage()
  const [days, setDays]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}` +
      `&q=${WEDDING_CONFIG.venue.weatherCoords}` +
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
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  )
  if (error) return (
    <div style={{ textAlign: 'center', padding: 24, color: 'var(--warm-gray)', fontSize: '.9rem' }}>
      {t('home.weatherError')}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {days.map((d, i) => {
        const isToday = i === 0
        return (
          <div key={i} style={{
            background: isToday ? 'linear-gradient(160deg,#FCEEF4,#FBDCE6)' : 'var(--white)',
            border: `1px solid ${isToday ? 'rgba(199,107,139,.32)' : 'var(--hairline)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 8px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            boxShadow: isToday ? '0 8px 22px rgba(199,107,139,.16)' : 'var(--shadow-sm)',
          }}>
            <div style={{
              fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
              color: isToday ? 'var(--rose-deep)' : 'var(--warm-gray)',
            }}>
              {dayLabel(d.date)}
            </div>
            <img src={d.icon} alt={d.label} style={{ width: 46, height: 46 }} />
            <div style={{ fontWeight: 700, color: 'var(--charcoal)', fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
              {d.max}°<span style={{ color: 'var(--warm-gray)', fontWeight: 500, fontSize: '.85rem' }}> {d.min}°</span>
            </div>
            <div style={{ fontSize: '.66rem', color: 'var(--warm-gray)', lineHeight: 1.3, minHeight: '1.6em' }}>{d.label}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '.66rem', color: 'var(--warm-gray)' }}>
              <Droplets size={11} /> {d.humidity}%
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
        src={`https://open.spotify.com/embed/playlist/${WEDDING_CONFIG.spotify.playlistId}?utm_source=generator&theme=0`}
        width="100%"
        height="380"
        style={{ display: 'block', border: 'none' }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  )
}

/* ── Countdown ───────────────────────────────────────────────────── */
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
      const ms = wedding - new Date()
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
    <p style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontStyle: 'italic' }}>
      {t('home.weddingPast')}
    </p>
  )

  const cells = [
    [t('home.countdownDays'), diff.d],
    [t('home.countdownHours'), diff.h],
    [t('home.countdownMinutes'), diff.m],
    [t('home.countdownSeconds'), diff.s],
  ]

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', gap: 12,
      padding: '20px 22px',
      background: 'rgba(255,255,255,0.16)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      border: '1px solid rgba(255,255,255,0.32)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 16px 40px rgba(0,0,0,.22)',
    }}>
      <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)' }}>
        {t('home.countdownTitle')}
      </div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        {cells.map(([label, val], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <div style={{ textAlign: 'center', minWidth: 44 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                fontSize: '2.1rem', color: '#fff', lineHeight: 1,
              }}>
                {String(val ?? 0).padStart(2, '0')}
              </div>
              <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.78)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 6 }}>
                {label}
              </div>
            </div>
            {i < cells.length - 1 && (
              <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '1.6rem', fontWeight: 300, transform: 'translateY(-4px)' }}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Quick actions ───────────────────────────────────────────────── */
const QUICK_LINKS_META = {
  rsvp:    { Icon: Mail,           to: '/rsvp' },
  menu:    { Icon: UtensilsCrossed, to: '/menu' },
  gallery: { Icon: Camera,         to: '/gallery' },
  chat:    { Icon: MessageCircle,  to: '/chat' },
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  const quickLinksText = t('home.quickLinks')
  const quickLinks = Object.entries(QUICK_LINKS_META).map(([key, meta]) => ({
    ...meta,
    label: quickLinksText[key]?.label,
    desc: quickLinksText[key]?.desc,
  }))

  return (
    <div className="page-enter" style={{ paddingBottom: 8 }}>

      {/* ── Hero ── */}
      <section ref={heroRef} style={{
        minHeight: '94dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        padding: '88px 24px 64px', textAlign: 'center',
      }}>
        <motion.div
          style={{
            position: 'absolute', inset: '-6% 0',
            backgroundImage: 'url(foto_sfondo/vesuvio.jpeg)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            y: reduce ? 0 : imgY, scale: reduce ? 1 : imgScale,
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(27,10,18,.42) 0%, rgba(27,10,18,.20) 45%, rgba(27,10,18,.62) 100%)',
        }} />

        <motion.div
          style={{ position: 'relative', maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            color: 'rgba(255,255,255,.92)', fontSize: '1.15rem', letterSpacing: '.04em', marginBottom: 14,
          }}>
            {t('home.heroEyebrow')}
          </p>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 500,
            fontSize: 'clamp(2.8rem, 13vw, 4.8rem)',
            color: '#fff', lineHeight: 1.04, marginBottom: 10,
            textShadow: '0 4px 30px rgba(0,0,0,.35)', letterSpacing: '-0.01em',
          }}>
            {WEDDING_CONFIG.couple.bride}
            <span style={{ color: 'var(--blush)', fontStyle: 'italic', fontWeight: 400, fontSize: '.6em', margin: '0 .26em', verticalAlign: 'middle' }}>&amp;</span>
            {WEDDING_CONFIG.couple.groom}
          </h1>

          <div style={{ width: 64, height: 1, background: 'rgba(255,255,255,.55)', margin: '14px 0 18px' }} />

          <p style={{ color: 'rgba(255,255,255,.94)', fontSize: '1.05rem', marginBottom: 6, fontWeight: 500 }}>
            {WEDDING_CONFIG.dateLabel}
          </p>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.82)', fontSize: '.92rem', marginBottom: 32 }}>
            <MapPin size={14} /> {WEDDING_CONFIG.venue.reception.name}, {WEDDING_CONFIG.venue.city}
          </p>

          <Countdown />

          <div style={{ marginTop: 34, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/rsvp')}>
              {t('home.heroCtaRsvp')}
            </button>
            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.45)', color: '#fff' }}
              onClick={() => navigate('/menu')}
            >
              {t('home.heroCtaMenu')}
            </button>
          </div>
        </motion.div>

        {!reduce && (
          <motion.div
            style={{ position: 'absolute', bottom: 22, left: '50%', x: '-50%', color: 'rgba(255,255,255,.7)' }}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={26} />
          </motion.div>
        )}
      </section>

      {/* ── Meteo ── */}
      <section style={{ padding: '56px 0 40px' }}>
        <div className="container-sm">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <h2 style={{ fontSize: '1.9rem', color: 'var(--charcoal)', marginBottom: 6 }}>{t('home.weatherTitle')}</h2>
              <p style={{ color: 'var(--warm-gray)', fontSize: '.92rem', margin: 0 }}>{t('home.weatherSubtitle')}</p>
            </div>
            <WeatherWidget />
          </Reveal>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section style={{ padding: '24px 0 48px' }}>
        <div className="container-sm">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
            {quickLinks.map((l, i) => (
              <Reveal key={l.to} delay={i * 0.06}>
                <button
                  onClick={() => navigate(l.to)}
                  className="quick-action"
                  style={{
                    width: '100%', height: '100%',
                    background: 'var(--white)', border: '1px solid var(--hairline)',
                    borderRadius: 'var(--radius-lg)', padding: '22px 20px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    boxShadow: 'var(--shadow-sm)', transition: 'transform .25s var(--ease-out-quart), box-shadow .25s var(--ease-out-quart)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                >
                  <span style={{
                    width: 46, height: 46, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(150deg,#FCEEF4,#FBDCE6)', color: 'var(--rose-deep)',
                  }}>
                    <l.Icon size={22} strokeWidth={2.1} />
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.18rem', color: 'var(--charcoal)', lineHeight: 1.15 }}>{l.label}</span>
                  <span style={{ fontSize: '.85rem', color: 'var(--warm-gray)' }}>{l.desc}</span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Playlist ── */}
      <section style={{ padding: '48px 0', background: 'var(--cream)' }}>
        <div className="container-sm">
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.9rem', color: 'var(--charcoal)', marginBottom: 6 }}>{t('home.playlistTitle')}</h2>
              <p style={{ color: 'var(--warm-gray)', fontSize: '.92rem', margin: 0 }}>{t('home.playlistSubtitle')}</p>
            </div>
            <SpotifyWidget title={t('home.playlistFrameTitle')} />
          </Reveal>
        </div>
      </section>

      {/* ── Storia ── */}
      <section style={{ padding: '64px 0 72px' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: '2.1rem', color: 'var(--charcoal)', marginBottom: 14 }}>{t('home.storyTitle')}</h2>
            <div style={{ width: 56, height: 1, background: 'var(--accent)', margin: '0 auto 22px' }} />
            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, fontSize: '1.08rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', maxWidth: 520, margin: '0 auto' }}>
              “{t('home.storyQuote')}”
            </p>
            <div style={{ marginTop: 36, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
              {t('home.timeline').map(s => (
                <div key={s.year} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--rose-deep)' }}>{s.year}</div>
                  <div style={{ fontSize: '.85rem', color: 'var(--warm-gray)', marginTop: 4 }}>{s.event}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  )
}
