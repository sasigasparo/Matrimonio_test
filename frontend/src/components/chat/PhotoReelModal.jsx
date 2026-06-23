import { useState, useEffect } from 'react'
import { API, getToken, resolvePhotoUrl, tenantHeaders } from './chatHelpers'

export default function PhotoReelModal({ onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const token = getToken()
    const headers = { ...tenantHeaders() }
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(`${API}/photos/`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPhotos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') selected ? setSelected(null) : onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [selected, onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: '#0e0a09',
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.25s cubic-bezier(.4,0,.2,1)',
    }}>
      <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>

      <div style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', fontSize: 22, lineHeight: 1,
          display: 'flex', alignItems: 'center', padding: '4px 2px',
        }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: 16 }}>
            Rullino foto
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            {loading ? '…' : `${photos.length} foto condivise`}
          </div>
        </div>
        <span style={{ fontSize: 20 }}>📷</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ borderColor: 'rgba(200,130,106,0.3)', borderTopColor: 'var(--rose)' }} />
        </div>
      ) : photos.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📷</div>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Nessuna foto ancora</p>
        </div>
      ) : (
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
          padding: 2, alignContent: 'start',
        }}>
          {photos.map((p) => {
            const url = resolvePhotoUrl(p)
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  aspectRatio: '1', overflow: 'hidden', cursor: 'pointer',
                  position: 'relative', background: 'rgba(255,255,255,0.04)',
                }}
                onMouseEnter={e => e.currentTarget.querySelector('img').style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.querySelector('img').style.opacity = '1'}
              >
                <img
                  src={url}
                  alt={p.caption || ''}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s' }}
                />
                {p.caption && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '14px 6px 4px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                    color: '#fff', fontSize: 10, fontStyle: 'italic',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.caption}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <img
            src={resolvePhotoUrl(selected)}
            alt={selected.caption}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '72dvh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 0 60px rgba(0,0,0,0.6)' }}
          />
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', marginTop: 16, maxWidth: 400 }}>
            {selected.caption && (
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#fff', fontSize: 14, marginBottom: 6 }}>
                "{selected.caption}"
              </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
              📷 {selected.guest_name || 'Ospite'}
              {selected.created_at && (
                <span style={{ marginLeft: 8 }}>
                  · {new Date(selected.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </p>
            <button
              onClick={() => setSelected(null)}
              style={{
                marginTop: 12, background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', padding: '6px 20px', borderRadius: 99, cursor: 'pointer', fontSize: 13,
              }}
            >✕ Chiudi</button>
          </div>
        </div>
      )}
    </div>
  )
}
