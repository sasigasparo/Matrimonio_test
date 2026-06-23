import { useLanguage } from '../hooks/useLanguage'

export default function LanguageSwitch({ style }) {
  const { lang, toggleLang } = useLanguage()
  const isItalian = lang === 'it'

  return (
    <button
      onClick={toggleLang}
      aria-label={isItalian ? 'Switch to English' : 'Passa all’italiano'}
      title={isItalian ? 'Switch to English' : 'Passa all’italiano'}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 78,
        height: 36,
        padding: 4,
        borderRadius: 999,
        border: '1px solid rgba(207,165,181,0.35)',
        background: 'rgba(199,107,139,0.08)',
        cursor: 'pointer',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* 🇮🇹 IT */}
      <span
        style={{
          zIndex: 2,
          opacity: isItalian ? 1 : 0.35,
          transition: '0.2s',
        }}
      >
        <svg width="20" height="14" viewBox="0 0 3 2">
          <rect width="1" height="2" x="0" fill="#009246" />
          <rect width="1" height="2" x="1" fill="#ffffff" />
          <rect width="1" height="2" x="2" fill="#ce2b37" />
        </svg>
      </span>

      {/* 🇬🇧 GB */}
      <span
        style={{
          zIndex: 2,
          opacity: !isItalian ? 1 : 0.35,
          transition: '0.2s',
        }}
      >
        <svg width="20" height="14" viewBox="0 0 60 30">
          <rect width="60" height="30" fill="#012169" />

          <path d="M0,0L60,30M60,0L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0L60,30M60,0L0,30" stroke="#C8102E" strokeWidth="4" />

          <path d="M30,0v30M0,15h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0v30M0,15h60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      </span>

      {/* knob */}
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          transform: isItalian ? 'translateX(0)' : 'translateX(42px)',
          transition: 'transform 0.25s ease',
        }}
      />
    </button>
  )
}