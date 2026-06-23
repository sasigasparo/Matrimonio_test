import { useState, useRef, useEffect } from 'react'
import { Share2, Check, Link as LinkIcon, MessageCircle } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { WEDDING_CONFIG } from '../config/wedding'

/*
 * Share the invite. Uses the native Web Share API when available (mobile),
 * otherwise falls back to a small menu (WhatsApp + copy link).
 */
export default function ShareButton({ variant = 'default', className = '', style }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  const url = WEDDING_CONFIG.app?.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const shareText = t('actions.shareText', { couple: WEDDING_CONFIG.couple.displayName, date: WEDDING_CONFIG.dateLabel })

  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: WEDDING_CONFIG.couple.displayName, text: shareText, url })
        return
      } catch { /* user cancelled — fall through to nothing */ return }
    }
    setOpen(o => !o)
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${shareText} ${url}`) } catch {}
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1400)
  }

  const light = variant === 'light'
  const triggerStyle = light
    ? { background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,.45)', color: '#fff' }
    : { background: '#fff', border: '1.5px solid var(--hairline)', color: 'var(--charcoal)', boxShadow: 'var(--shadow-sm)' }

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
    textAlign: 'left', color: 'var(--charcoal)', fontSize: '.92rem', fontFamily: 'inherit',
    textDecoration: 'none', transition: 'background .15s',
  }
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`

  return (
    <div ref={ref} className={className} style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button className="btn" onClick={handleClick} aria-haspopup="menu" aria-expanded={open} style={triggerStyle}>
        <Share2 size={18} /> {t('actions.share')}
      </button>

      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          minWidth: 220, zIndex: 'var(--z-dropdown)',
          background: '#fff', borderRadius: 'var(--radius-md)', overflow: 'hidden',
          border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp .2s var(--ease-out-quart)',
        }}>
          <a role="menuitem" href={waUrl} target="_blank" rel="noopener noreferrer" style={itemStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            onClick={() => setOpen(false)}>
            <MessageCircle size={18} style={{ color: '#25D366' }} />
            <span>{t('actions.shareWhatsApp')}</span>
          </a>
          <div style={{ height: 1, background: 'var(--hairline)' }} />
          <button role="menuitem" style={itemStyle} onClick={copy}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            {copied ? <Check size={18} style={{ color: 'var(--sage)' }} /> : <LinkIcon size={18} style={{ color: 'var(--rose-deep)' }} />}
            <span>{copied ? t('actions.shareCopied') : t('actions.shareCopy')}</span>
          </button>
        </div>
      )}
    </div>
  )
}
