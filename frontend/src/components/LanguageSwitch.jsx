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
        width: 76,
        height: 36,
        padding: 4,
        borderRadius: 999,
        border: '1px solid rgba(200,162,168,0.35)',
        background: 'rgba(200,130,106,0.08)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: 'background .2s ease',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(200,130,106,0.16)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(200,130,106,0.08)'
      }}
    >
      {/* 🇮🇹 */}
      <span
        style={{
          fontSize: 16,
          zIndex: 2,
          opacity: isItalian ? 1 : 0.35,
          transition: 'opacity .2s ease',
        }}
      >
        🇮🇹
      </span>

      {/* 🇬🇧 */}
      <span
        style={{
          fontSize: 16,
          zIndex: 2,
          opacity: !isItalian ? 1 : 0.35,
          transition: 'opacity .2s ease',
        }}
      >
        🇬🇧
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
          transform: isItalian ? 'translateX(0)' : 'translateX(40px)',
          transition: 'transform 0.25s ease',
        }}
      />
    </button>
  )
}