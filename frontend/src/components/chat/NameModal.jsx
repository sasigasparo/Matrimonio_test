import { useState } from 'react'

export default function NameModal({ onDone, isEditing = false, currentName = '' }) {
  const [name, setName] = useState(currentName)
  const [err, setErr] = useState('')

  const submit = () => {
    if (name.trim().length < 2) { setErr('Inserisci almeno 2 caratteri'); return }
    localStorage.setItem('wedding_guest_name', name.trim())
    onDone(name.trim())
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(44,36,32,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 20, padding: 32,
        maxWidth: 360, width: '100%', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>{isEditing ? '✏️' : '💍'}</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', marginBottom: 8, color: 'var(--charcoal)' }}>
          {isEditing ? 'Cambia il tuo nome' : 'Come ti chiami?'}
        </h2>
        <p style={{ color: 'var(--warm-gray)', fontSize: 14, marginBottom: 24 }}>
          {isEditing
            ? 'I tuoi prossimi messaggi appariranno con questo nuovo nome.'
            : 'Il tuo nome apparirà accanto ai tuoi messaggi e foto nella chat del matrimonio.'}
        </p>
        <input
          className="input"
          placeholder="Il tuo nome completo"
          value={name}
          onChange={e => { setName(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          style={{ marginBottom: err ? 8 : 16, textAlign: 'center', fontSize: 16 }}
        />
        {err && <p style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={submit}>
          {isEditing ? '✓ Salva nome' : 'Entra nella chat 💌'}
        </button>
      </div>
    </div>
  )
}
