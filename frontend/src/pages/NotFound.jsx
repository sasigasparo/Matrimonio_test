import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from '../components/LanguageSwitch'

export default function NotFound() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 24, position: 'relative',
      background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
    }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitch />
      </div>
      <div style={{ fontSize: '3.2rem', marginBottom: 6 }}>🥀</div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '5rem', lineHeight: 1,
        color: 'var(--rose)', opacity: .85,
      }}>
        404
      </div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--charcoal)', margin: '14px 0 8px' }}>
        {t('notFound.title')}
      </h2>
      <p style={{ color: 'var(--warm-gray)', maxWidth: 360, margin: '0 0 28px', lineHeight: 1.6 }}>
        {t('notFound.text')}
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        {t('notFound.button')}
      </button>
    </div>
  )
}
