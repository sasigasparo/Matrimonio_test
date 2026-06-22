export default function RecordingPill({ secs, onStop, onCancel }) {
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', background: 'var(--cream)',
      borderTop: '1px solid rgba(200,162,168,0.2)',
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%', background: 'var(--rose)',
        animation: 'pulse 1s infinite',
      }} />
      <span style={{ fontSize: 13, color: 'var(--charcoal)', fontWeight: 500 }}>
        Registrazione… {fmt(secs)}
      </span>
      <div style={{ flex: 1 }} />
      <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', fontSize: 13 }}>
        Annulla
      </button>
      <button onClick={onStop} className="btn btn-primary btn-sm" style={{ borderRadius: 99 }}>
        ⏹ Invia
      </button>
    </div>
  )
}
