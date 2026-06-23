import { useState, useRef, useEffect } from 'react'
import { CalendarPlus, Apple } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { downloadICS, googleCalendarUrl } from '../utils/calendar'

/*
 * "Add to calendar" — opens a tiny menu (Apple/.ics download + Google Calendar).
 * variant="light" for use over dark hero imagery.
 */
export default function AddToCalendar({ variant = 'default', className = '', style }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const light = variant === 'light'
  const triggerStyle = light
    ? { background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.45)', color: '#fff' }
    : { background: '#fff', border: '1.5px solid var(--hairline)', color: 'var(--charcoal)', boxShadow: 'var(--shadow-sm)' }

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
    textAlign: 'left', color: 'var(--charcoal)', fontSize: '.92rem', fontFamily: 'inherit',
    transition: 'background .15s',
  }

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button
        className="btn"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={triggerStyle}
      >
        <CalendarPlus size={18} /> {t('actions.addToCalendar')}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
            minWidth: 230, zIndex: 'var(--z-dropdown)',
            background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden',
            border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-lg)',
            animation: 'slideUp .2s var(--ease-out-quart)',
          }}
        >
          <button
            role="menuitem"
            style={itemStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => { downloadICS(); setOpen(false) }}
          >
            <Apple size={18} style={{ color: 'var(--charcoal)' }} />
            <span>{t('actions.calendarApple')}</span>
          </button>
          <div style={{ height: 1, background: 'var(--hairline)' }} />
          <a
            role="menuitem"
            href={googleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...itemStyle, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true" style={{
              width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, color: '#4285F4',
            }}>G</span>
            <span>{t('actions.calendarGoogle')}</span>
          </a>
        </div>
      )}
    </div>
  )
}
