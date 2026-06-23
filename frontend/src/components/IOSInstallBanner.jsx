import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

function isIOSSafari() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isStandalone = window.navigator.standalone === true
  const isChrome = /CriOS/.test(ua)
  const isFirefox = /FxiOS/.test(ua)
  return isIOS && !isStandalone && !isChrome && !isFirefox
}

const DISMISSED_KEY = 'ios_install_banner_dismissed'

export default function IOSInstallBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isIOSSafari() && !localStorage.getItem(DISMISSED_KEY)) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const txt = t('home.iosInstall')

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: 480,
      zIndex: 999,
      background: 'var(--white)',
      border: '1px solid var(--hairline)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      padding: '20px 20px 20px 18px',
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      animation: 'slideUp .35s var(--ease-out-quart)',
    }}>
      {/* iOS share icon */}
      <div style={{
        flexShrink: 0,
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'linear-gradient(150deg,#FCEEF4,#FBDCE6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--rose-deep)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.05rem',
          color: 'var(--charcoal)',
          marginBottom: 8,
          lineHeight: 1.3,
        }}>
          {txt.title}
        </p>
        <ol style={{
          margin: 0,
          paddingLeft: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <li style={{ fontSize: '.88rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            {txt.step0}
          </li>
          <li style={{ fontSize: '.88rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            {txt.step1pre}
            {' '}
            <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginTop: -2 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </span>
            {' '}
            {txt.step1post}
          </li>
          <li style={{ fontSize: '.88rem', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
            {txt.step2}
          </li>
        </ol>
      </div>

      <button
        onClick={dismiss}
        aria-label="Chiudi"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--warm-gray)',
          padding: 2,
          lineHeight: 1,
          marginTop: -2,
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
