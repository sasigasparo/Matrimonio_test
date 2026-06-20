import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 24,
      background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
    }}>
      <div style={{ fontSize: '3.2rem', marginBottom: 6 }}>🥀</div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontSize: '5rem', lineHeight: 1,
        color: 'var(--rose)', opacity: .85,
      }}>
        404
      </div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--charcoal)', margin: '14px 0 8px' }}>
        Questa pagina non è nella lista degli invitati
      </h2>
      <p style={{ color: 'var(--warm-gray)', maxWidth: 360, margin: '0 0 28px', lineHeight: 1.6 }}>
        Forse hai seguito un link sbagliato, o questa pagina non esiste più. Ti riportiamo noi al sicuro.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Torna alla home 💍
      </button>
    </div>
  )
}
