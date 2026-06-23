import { useState, useEffect } from 'react'
import { CheckCheck, Trash2, Film, ZoomIn, ImageOff } from 'lucide-react'
import AudioBubble from './AudioBubble'

export function DateSep({ date }) {
  const label = new Date(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 4px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
      <span style={{
        fontSize: 11, color: 'var(--warm-gray)', background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(6px)', padding: '4px 12px', borderRadius: 99, fontWeight: 600,
        textTransform: 'capitalize', boxShadow: 'var(--shadow-sm)',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
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

  // Sent = soft pink, dark text. Received = white. (per the mockup)
  const bubbleStyle = {
    borderRadius: outgoing ? '20px 7px 20px 20px' : '7px 20px 20px 20px',
    background: outgoing ? 'linear-gradient(160deg, #FDE0EB 0%, #FBCBDD 100%)' : 'var(--white)',
    color: 'var(--charcoal)',
    border: outgoing ? '1px solid rgba(199,107,139,0.18)' : '1px solid var(--hairline)',
    boxShadow: outgoing ? '0 2px 10px rgba(199,107,139,0.16)' : '0 2px 8px rgba(27,27,27,0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 'min(330px, 76vw)',
    wordBreak: 'break-word',
  }

  const timeStr = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      display: 'flex',
      flexDirection: outgoing ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      animation: 'msgIn 0.24s var(--ease-out-quart)',
      maxWidth: '100%',
      minWidth: 0,
    }}>
      {!outgoing && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(150deg, var(--blush), #F6B9CD)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'var(--rose-deep)', overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(199,107,139,0.18)',
        }}>
          {msg.avatar_url
            ? <img src={msg.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : initials}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: outgoing ? 'flex-end' : 'flex-start', gap: 3 }}>
        {!outgoing && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--rose-deep)', paddingLeft: 6 }}>{name}</span>
        )}

        <div style={{ ...bubbleStyle, padding: 0 }}>
          {msg.photo_url && (
            <div style={{ position: 'relative', width: 'min(300px, 76vw)' }}>
              <img
                src={msg.photo_url}
                alt={`Foto di ${name}`}
                loading="lazy"
                style={{
                  width: '100%', maxWidth: 300, maxHeight: 400,
                  display: 'block', objectFit: 'cover', cursor: 'pointer',
                }}
                onClick={() => window.open(msg.photo_url, '_blank')}
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex')
                }}
              />
              <div style={{
                display: 'none', width: 220, height: 130,
                alignItems: 'center', justifyContent: 'center',
                background: 'var(--cream)', color: 'var(--warm-gray)',
                fontSize: 13, gap: 8, flexDirection: 'column',
              }}>
                <ImageOff size={26} /><span>Immagine non disponibile</span>
              </div>
              <div
                role="button"
                aria-label="Ingrandisci foto"
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  background: 'rgba(27,27,27,0.55)', backdropFilter: 'blur(6px)',
                  borderRadius: '50%', width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
                onClick={() => window.open(msg.photo_url, '_blank')}
              ><ZoomIn size={18} /></div>
            </div>
          )}

          {msg.type === 'video' && msg.content && (
            <a
              href={msg.content} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', textDecoration: 'none', color: 'var(--charcoal)',
              }}
            >
              <span style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(199,107,139,0.16)', color: 'var(--rose-deep)',
              }}><Film size={20} /></span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>Video su Drive</div>
                <div style={{ fontSize: 11.5, color: 'var(--warm-gray)', marginTop: 1 }}>Tocca per aprire →</div>
                {msg._waitMinutes && (
                  <div style={{ fontSize: 10.5, color: 'var(--warm-gray)', marginTop: 3 }}>
                    ⏳ Se non parte, attendi ~{msg._waitMinutes} min
                  </div>
                )}
              </div>
            </a>
          )}

          {msg.audio_path && (
            <div style={{ padding: '10px 12px' }}>
              <AudioBubble src={msg.audio_path} outgoing={outgoing} />
            </div>
          )}

          {msg.content && msg.type !== 'audio' && (
            <p style={{
              padding: msg.photo_url ? '8px 14px 11px' : msg.audio_path ? '4px 12px 8px' : '10px 15px',
              margin: 0, fontSize: 14.5, lineHeight: 1.5,
              fontFamily: 'var(--font-sans)',
              borderTop: msg.photo_url ? '1px solid rgba(199,107,139,0.12)' : 'none',
            }}>
              {msg.content}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: outgoing ? 0 : 6, paddingRight: outgoing ? 6 : 0 }}>
          <span style={{ fontSize: 10.5, color: 'var(--warm-gray)' }}>{timeStr}</span>
          {outgoing && <CheckCheck size={13} style={{ color: 'var(--rose-deep)' }} aria-label="Inviato" />}
          {(isAdmin || (isMe && withinWindow)) && (
            <button
              onClick={() => onDelete(msg.id, msg.created_at, msg.type)}
              aria-label="Elimina messaggio"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--warm-gray)', padding: '0 2px', display: 'inline-flex',
                opacity: 0.55, transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.55}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
