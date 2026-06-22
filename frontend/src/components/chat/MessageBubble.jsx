import { useState, useEffect } from 'react'
import AudioBubble from './AudioBubble'

export function DateSep({ date }) {
  const label = new Date(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(200,162,168,0.3)' }} />
      <span style={{
        fontSize: 11, color: 'var(--warm-gray)', background: 'rgba(245,237,228,0.9)',
        padding: '3px 10px', borderRadius: 99, fontWeight: 500,
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(200,162,168,0.3)' }} />
    </div>
  )
}

export default function MessageBubble({ msg, myId, isAdmin, onDelete }) {
  const isMe = String(msg.guest_id) === String(myId)
  const outgoing = isMe

  const [withinWindow, setWithinWindow] = useState(() => {
    return Date.now() - new Date(msg.created_at).getTime() < 3 * 60 * 1000
  })
  useEffect(() => {
    if (!isMe || !withinWindow) return
    const remaining = 3 * 60 * 1000 - (Date.now() - new Date(msg.created_at).getTime())
    if (remaining <= 0) { setWithinWindow(false); return }
    const t = setTimeout(() => setWithinWindow(false), remaining)
    return () => clearTimeout(t)
  }, [isMe, msg.created_at])

  const name = msg.guest_name && msg.guest_name !== 'Ospite' ? msg.guest_name : (msg.guest_name || '?')
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const bubbleStyle = {
    borderRadius: outgoing ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
    background: outgoing ? 'var(--rose)' : 'var(--white)',
    color: outgoing ? '#fff' : 'var(--charcoal)',
    border: outgoing ? 'none' : '1px solid rgba(200,162,168,0.2)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'min(320px, 75vw)',
    wordBreak: 'break-word',
  }

  const timeStr = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      display: 'flex',
      flexDirection: outgoing ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      animation: 'msgIn 0.2s ease-out',
      maxWidth: '100%',
      minWidth: 0,
    }}>
      {!outgoing && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--blush)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 600,
          color: 'var(--charcoal)', overflow: 'hidden',
          border: '2px solid var(--cream)',
        }}>
          {msg.avatar_url
            ? <img src={msg.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : initials}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: outgoing ? 'flex-end' : 'flex-start', gap: 2 }}>
        {!outgoing && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sage)', paddingLeft: 4 }}>{name}</span>
        )}

        <div style={{ ...bubbleStyle, padding: 0, overflow: 'hidden' }}>
          {msg.photo_url && (
            <div style={{ position: 'relative', width: 'min(300px, 75vw)' }}>
              <img
                src={msg.photo_url}
                alt="Foto"
                style={{
                  width: '100%',
                  maxWidth: 300,
                  maxHeight: 400,
                  display: 'block',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: outgoing ? '0 4px 0 0' : '4px 0 0 0'
                }}
                onClick={() => window.open(msg.photo_url, '_blank')}
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex')
                }}
              />
              <div style={{
                display: 'none', width: 200, height: 120,
                alignItems: 'center', justifyContent: 'center',
                background: 'rgba(200,162,168,0.15)', borderRadius: 8,
                color: 'var(--warm-gray)', fontSize: 13, gap: 6,
                flexDirection: 'column',
              }}>
                <span style={{ fontSize: 28 }}>🖼️</span>
                <span>Immagine non disponibile</span>
              </div>
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                opacity: 0, transition: 'opacity 0.2s',
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '50%',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                onClick={() => window.open(msg.photo_url, '_blank')}
              >🔍</div>
            </div>
          )}

          {msg.type === 'video' && msg.content && (
            <a
              href={msg.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', textDecoration: 'none',
                color: outgoing ? '#fff' : 'var(--charcoal)',
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>🎬</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Video caricato su Drive</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Tocca per aprire →</div>
              </div>
            </a>
          )}

          {msg.audio_path && (
            <div style={{ padding: '8px 12px' }}>
              <AudioBubble src={msg.audio_path} outgoing={outgoing} />
            </div>
          )}

          {msg.content && msg.type !== 'audio' && (
            <p style={{
              padding: msg.photo_url ? '6px 12px 10px' : msg.audio_path ? '6px 12px 8px' : '10px 14px',
              margin: 0, fontSize: 14, lineHeight: 1.5,
              fontFamily: 'Georgia, serif',
              fontStyle: msg.photo_url ? 'normal' : 'italic',
              borderTop: msg.photo_url ? '1px solid rgba(200,162,168,0.15)' : 'none',
            }}>
              {msg.content}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: outgoing ? 0 : 4, paddingRight: outgoing ? 4 : 0 }}>
          <span style={{ fontSize: 10, color: 'var(--warm-gray)' }}>{timeStr}</span>
          {outgoing && <span style={{ fontSize: 11, color: '#53bdeb', fontWeight: 700, letterSpacing: '-1px' }}>✓✓</span>}
          {(isAdmin || (isMe && withinWindow)) && (
            <button
              onClick={() => onDelete(msg.id, msg.created_at, msg.type)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 10, color: 'var(--warm-gray)', padding: '0 2px',
                opacity: 0.6, transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
            >
              🗑
            </button>
          )}
        </div>
        {outgoing && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--rose)', paddingRight: 4, opacity: 0.8 }}>{name}</span>
        )}
      </div>
    </div>
  )
}
