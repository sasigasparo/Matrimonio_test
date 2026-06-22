import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'
import { api } from '../utils/api'
import { WEDDING_CONFIG } from '../config/wedding'

const API = `${(import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')}/api`


function getToken() {
  return localStorage.getItem('wedding_token') || ''
}

const MAX_PX = 1600
const JPEG_Q = 0.82

function compressPhoto(file) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width: w, height: h } = img
      if (Math.max(w, h) > MAX_PX) {
        const r = MAX_PX / Math.max(w, h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        resolve(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', JPEG_Q)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

function getGuestName() {
  return localStorage.getItem('wedding_guest_name') || ''
}

/* ── Audio waveform bars ─────────────────────────────────────────── */
function Waveform({ progress = 0, bars = 20, color = '#fff', dimColor = 'rgba(255,255,255,0.35)' }) {
  const heights = useRef(
    Array.from({ length: bars }, () => 2 + Math.random() * 8)
  ).current
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, height: 20 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: 1.5,
            height: h,
            borderRadius: 1,
            background: i / bars < progress ? color : dimColor,
            transition: 'background 0.1s',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

/* ── Audio player bubble ─────────────────────────────────────────── */
function AudioBubble({ src, outgoing }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const ref = useRef(null)

  const toggle = () => {
    if (!ref.current) return
    if (playing) { ref.current.pause(); setPlaying(false) }
    else { ref.current.play(); setPlaying(true) }
  }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', minWidth: 200, flex: 1,
    }}>
      <audio
        ref={ref} src={src}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={e => setProgress(e.target.currentTime / (e.target.duration || 1))}
        onLoadedMetadata={e => setDuration(e.target.duration)}
      />
      <button
        onClick={toggle}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: outgoing ? 'rgba(255,255,255,0.3)' : 'var(--rose)',
          color: '#fff', cursor: 'pointer', fontSize: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title={playing ? 'Pausa' : 'Riproduci'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <Waveform
        progress={progress}
        color={outgoing ? '#fff' : 'var(--rose)'}
        dimColor={outgoing ? 'rgba(255,255,255,0.35)' : 'rgba(200,130,106,0.3)'}
      />
      <span style={{ fontSize: 10, opacity: 0.8, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
        {fmt(duration * progress)} / {fmt(duration)}
      </span>
    </div>
  )
}

/* ── Single message bubble ───────────────────────────────────────── */
function MessageBubble({ msg, myId, isAdmin, onDelete }) {
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
  }

  const timeStr = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      display: 'flex',
      flexDirection: outgoing ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      animation: 'msgIn 0.2s ease-out',
    }}>
      {/* Avatar */}
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
          {/* Photo */}
          {msg.photo_url && (
            <div style={{ position: 'relative' }}>
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

          {/* Audio */}
          {msg.audio_path && (
            <div style={{ padding: '8px 12px' }}>
              <AudioBubble src={msg.audio_path} outgoing={outgoing} />
            </div>
          )}

          {/* Text / caption */}
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

/* ── Date separator ──────────────────────────────────────────────── */
function DateSep({ date }) {
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

/* ── Name entry modal ────────────────────────────────────────────── */
// isEditing=true → modale "Cambia nome", false → primo accesso
function NameModal({ onDone, isEditing = false, currentName = '' }) {
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

/* ── Recording indicator ─────────────────────────────────────────── */
function RecordingPill({ secs, onStop, onCancel }) {
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
      <button
        onClick={onStop}
        className="btn btn-primary btn-sm"
        style={{ borderRadius: 99 }}
      >
        ⏹ Invia
      </button>
    </div>
  )
}

/* ── Camera modal (getUserMedia) ────────────────────────────────── */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [facing, setFacing] = useState('environment')

  const startStream = async (facingMode) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setReady(true)
        setError('')
      }
    } catch (e) {
      setError('Fotocamera non disponibile: ' + e.message)
    }
  }

  useEffect(() => {
    startStream(facing)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  const flip = () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    startStream(next)
  }

  const shoot = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'camera_photo.jpg', { type: 'image/jpeg' })
      streamRef.current?.getTracks().forEach(t => t.stop())
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'rgba(0,0,0,0.6)', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 22, lineHeight: 1, padding: '4px 8px',
        }}>✕</button>
        <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: 15 }}>Scatta una foto</span>
        <button onClick={flip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 22, padding: '4px 8px',
        }} title="Cambia fotocamera">🔄</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? (
          <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: 32, fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
            {error}
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: ready ? 1 : 0, transition: 'opacity 0.3s',
            }}
          />
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '28px 0 40px', background: 'rgba(0,0,0,0.6)', flexShrink: 0,
      }}>
        <button
          onClick={shoot}
          disabled={!ready || !!error}
          style={{
            width: 70, height: 70, borderRadius: '50%',
            background: '#fff', border: '5px solid rgba(255,255,255,0.4)',
            cursor: ready && !error ? 'pointer' : 'not-allowed',
            opacity: ready && !error ? 1 : 0.4,
            boxShadow: '0 0 0 3px rgba(255,255,255,0.2)',
            transition: 'transform 0.1s, opacity 0.2s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Scatta"
        />
      </div>
    </div>
  )
}

/* ── Photo Reel modal ────────────────────────────────────────────── */
const { projectId: SUPABASE_PROJECT_ID, bucket: SUPABASE_BUCKET } = WEDDING_CONFIG.supabase
const resolvePhotoUrl = p =>
  p.photo_url ||
  (p.filename ? `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/photos/${p.filename}` : null)

function PhotoReelModal({ onClose }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const token = getToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
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
          {photos.map((p, i) => {
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

/* ── Main Chat component ─────────────────────────────────────────── */
export default function Chat() {
  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [guestName, setGuestName] = useState(getGuestName)
  // nameModalMode: 'hidden' | 'new' | 'edit'
  const [nameModalMode, setNameModalMode] = useState('hidden')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [showReel, setShowReel] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  // audio
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const myId = user?.id || null
  const isAdmin = user?.is_admin || false

  // Se il nome del backend è il placeholder 'Ospite', cade sul nome locale
  const authName = user?.name && user.name !== 'Ospite' ? user.name : null
  const activeName = authName || guestName

  useEffect(() => { loadMessages() }, [])

  useEffect(() => {
    if (authLoading) return
    const savedName = getGuestName()
    if (!authName && (!savedName || savedName === 'Ospite' || savedName.trim() === '')) {
      localStorage.removeItem('wedding_guest_name')
      setGuestName('')
      setNameModalMode('new')
    }
  }, [authLoading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API}/messages/public`)
      const data = await res.json()
      setMessages(data.reverse())
    } catch { toast.error('Errore caricamento messaggi') }
    setLoading(false)
  }

  const ensureName = () => {
    if (authName) return authName
    if (guestName) return guestName
    setNameModalMode('new')
    return null
  }

  const handleNameDone = (name) => {
    setGuestName(name)
    setNameModalMode('hidden')
  }

  const send = async () => {
    const name = ensureName()
    if (!name) return
    if (!text.trim() && !audioBlob && !photoFile) return
    setSending(true)

    try {
      const form = new FormData()
      if (text.trim()) form.append('content', text.trim())

      if (audioBlob) {
        const ext = audioBlob.type.includes('webm') ? '.webm' : '.ogg'
        const audioFile = new File([audioBlob], `audio${ext}`, { type: audioBlob.type })
        form.append('audio', audioFile)
      }

      if (photoFile) {
        const mimeToExt = {
          'image/jpeg': '.jpg', 'image/jpg': '.jpg',
          'image/png': '.png', 'image/webp': '.webp',
          'image/gif': '.gif', 'image/heic': '.heic',
        }
        const origExt = photoFile.name.includes('.')
          ? '.' + photoFile.name.split('.').pop().toLowerCase()
          : ''
        const ext = origExt || mimeToExt[photoFile.type] || '.jpg'
        const safeFile = origExt
          ? photoFile
          : new File([photoFile], `photo${ext}`, { type: photoFile.type || 'image/jpeg' })
        form.append('file', safeFile)
      }

      form.append('guest_name', name)

      const headers = {}
      const token = getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API}/messages/`, { method: 'POST', headers, body: form })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || `Errore HTTP ${res.status}`)
      }
      const msg = await res.json()
      if (!msg.photo_url && photoPreview) msg.photo_url = photoPreview
      setMessages(prev => [...prev, msg])
      setText('')
      setAudioBlob(null)
      setPhotoPreview(null)
      setPhotoFile(null)
      inputRef.current?.focus()
      // success shown via ✓✓ in bubble
    } catch (e) {
      toast.error('Errore invio: ' + e.message)
    }
    setSending(false)
  }

  const startRecording = async () => {
    const name = ensureName()
    if (!name) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg',
        audioBitsPerSecond: 64000,
      })
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        setAudioBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setRecordSecs(0)
      timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000)
    } catch (e) { toast.error('Microfono non disponibile: ' + e.message) }
  }

  const stopRecording = () => {
    if (mediaRef.current) { mediaRef.current.stop(); setRecording(false) }
    clearInterval(timerRef.current)
  }

  const cancelRecording = () => {
    if (mediaRef.current) {
      mediaRef.current.stop()
      mediaRef.current.ondataavailable = null
      mediaRef.current.onstop = null
    }
    setRecording(false)
    setAudioBlob(null)
    chunksRef.current = []
    clearInterval(timerRef.current)
  }

  const handleFileChange = async e => {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    const compressed = await compressPhoto(f)
    setPhotoFile(compressed)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(compressed)
  }

  const handleCameraCapture = async (file) => {
    setShowCamera(false)
    const compressed = await compressPhoto(file)
    setPhotoFile(compressed)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(compressed)
  }

  const deleteMsg = async (id, createdAt, type) => {
    if (!isAdmin) {
      const age = Date.now() - new Date(createdAt).getTime()
      if (age > 3 * 60 * 1000) {
        toast.error('Tempo scaduto: non puoi più eliminare questo messaggio')
        return
      }
    }
    if (!confirm('Eliminare questo messaggio?')) return
    try {
      const headers = { Authorization: `Bearer ${getToken()}` }
      await fetch(`${API}/messages/${id}`, { method: 'DELETE', headers })
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Messaggio eliminato')
    } catch { toast.error('Errore eliminazione') }
  }

  // group by date
  const grouped = []
  let lastDate = null
  for (const msg of messages) {
    const d = msg.created_at?.slice(0, 10)
    if (d !== lastDate) { grouped.push({ type: 'date', date: d }); lastDate = d }
    grouped.push({ type: 'msg', msg })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh',
      background: 'var(--ivory)', fontFamily: 'var(--font-sans)',
    }}>
      <style>{`
        @keyframes msgIn { from { opacity:0; transform: translateY(8px) } to { opacity:1; transform:none } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes namePop { from { opacity:0; transform: scale(0.95) } to { opacity:1; transform: scale(1) } }
      `}</style>

      {/* ── Modali ── */}
      {nameModalMode !== 'hidden' && (
        <NameModal
          onDone={handleNameDone}
          isEditing={nameModalMode === 'edit'}
          currentName={nameModalMode === 'edit' ? guestName : ''}
        />
      )}
      {showReel && <PhotoReelModal onClose={() => setShowReel(false)} />}
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 10px 0 14px',
        background: 'var(--white)', borderBottom: '1px solid rgba(200,162,168,0.2)',
        flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        minHeight: 60,
      }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--rose), var(--blush))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💍</div>

        {/* Titolo + sottotitolo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 400, color: 'var(--charcoal)' }}>
            {WEDDING_CONFIG.couple.displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sage)' }}>
            {messages.length} messaggi · {WEDDING_CONFIG.dateLabel}
          </div>
        </div>

        {/* ── Badge nome — sempre visibile, cliccabile per cambiare ── */}
        {!authName && (
          <button
            onClick={() => setNameModalMode(activeName ? 'edit' : 'new')}
            title={activeName ? 'Cambia il tuo nome' : 'Scegli il tuo nome'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: activeName ? 'rgba(200,130,106,0.1)' : 'var(--rose)',
              border: activeName ? '1.5px solid rgba(200,130,106,0.35)' : 'none',
              borderRadius: 99,
              padding: activeName ? '5px 10px 5px 8px' : '6px 12px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
              animation: 'namePop 0.25s ease-out',
              maxWidth: 160,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = activeName
                ? 'rgba(200,130,106,0.2)'
                : 'color-mix(in srgb, var(--rose) 85%, black)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = activeName
                ? 'rgba(200,130,106,0.1)'
                : 'var(--rose)'
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>{activeName ? '👤' : '✏️'}</span>
            {activeName ? (
              <>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--rose)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeName}
                </span>
                <span style={{ fontSize: 11, color: 'var(--warm-gray)', flexShrink: 0 }}>✎</span>
              </>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                Scegli il tuo nome
              </span>
            )}
          </button>
        )}

        {/* Se autenticato con nome reale, mostra solo badge statico */}
        {authName && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(200,130,106,0.1)',
            border: '1.5px solid rgba(200,130,106,0.3)',
            borderRadius: 99, padding: '5px 10px 5px 8px',
            maxWidth: 160, flexShrink: 0,
          }}>
            <span style={{ fontSize: 13 }}>👤</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--rose)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user.name}
            </span>
          </div>
        )}

        {/* 📷 Rullino shortcut */}
        <button
          onClick={() => setShowReel(true)}
          title="Rullino foto"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(200,130,106,0.1)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, transition: 'background 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,130,106,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,130,106,0.1)'}
        >📷</button>

        {/* ⋮ Menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowMenu(v => !v)}
            title="Menu"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: showMenu ? 'rgba(200,130,106,0.15)' : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, color: 'var(--warm-gray)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,130,106,0.1)'}
            onMouseLeave={e => { if (!showMenu) e.currentTarget.style.background = 'transparent' }}
          >⋮</button>

          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
              <div style={{
                position: 'absolute', top: 40, right: 0, zIndex: 100,
                background: 'var(--white)', borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                border: '1px solid rgba(200,162,168,0.2)',
                minWidth: 200, overflow: 'hidden',
                animation: 'menuIn 0.15s ease-out',
              }}>
                <style>{`@keyframes menuIn { from { opacity:0; transform:scale(0.95) translateY(-6px) } to { opacity:1; transform:none } }`}</style>
                {[
                  { icon: '📷', label: 'Rullino foto', action: () => { setShowReel(true); setShowMenu(false) } },
                  { icon: '🎞️', label: 'Vai ai Ricordi', action: () => { setShowMenu(false); navigate('/gallery') } },
                  ...(!authName ? [{ icon: '✏️', label: 'Cambia il tuo nome', action: () => { setNameModalMode('edit'); setShowMenu(false) } }] : []),
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: '100%', padding: '13px 18px', border: 'none',
                      background: 'none', cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                      color: 'var(--charcoal)', fontSize: 14,
                      borderBottom: '1px solid rgba(200,162,168,0.1)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--ivory)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: 10,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e8c4a8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--warm-gray)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>💌</div>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15 }}>
              Sii il primo a lasciare un messaggio agli sposi!
            </p>
          </div>
        ) : grouped.map((item, i) =>
          item.type === 'date'
            ? <DateSep key={`d-${item.date}`} date={item.date} />
            : (
              <MessageBubble
                key={item.msg.id}
                msg={item.msg}
                myId={myId}
                isAdmin={isAdmin}
                onDelete={deleteMsg}
              />
            )
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Photo preview ── */}
      {photoPreview && (
        <div style={{
          padding: '12px', background: 'var(--cream)',
          borderTop: '1px solid rgba(200,162,168,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={photoPreview} style={{ height: 70, width: 70, borderRadius: 8, objectFit: 'cover' }} />
            <button onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
              style={{
                position: 'absolute', top: -8, right: -8,
                background: 'var(--rose)', border: 'none',
                borderRadius: '50%', width: 24, height: 24,
                cursor: 'pointer', color: '#fff', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
              title="Rimuovi foto"
            >✕</button>
          </div>
          <input
            className="input" placeholder="Aggiungi didascalia…"
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={send} disabled={sending} style={{
            width: 38, height: 38, borderRadius: '50%', border: 'none',
            background: 'var(--rose)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0, opacity: sending ? 0.6 : 1,
            transition: 'all 0.2s',
          }}>➤</button>
        </div>
      )}

      {/* ── Audio preview ── */}
      {audioBlob && !recording && (
        <div style={{
          padding: '10px 12px', background: 'var(--cream)',
          borderTop: '1px solid rgba(200,162,168,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 500 }}>
              Messaggio vocale pronto
            </span>
            <p style={{ fontSize: 11, color: 'var(--warm-gray)', margin: '2px 0 0 0' }}>
              {fmt(recordSecs)}
            </p>
          </div>
          <button onClick={() => setAudioBlob(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--warm-gray)', fontSize: 12, padding: '4px 8px',
            borderRadius: 4, transition: 'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,130,106,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            title="Scarta"
          >
            Scarta
          </button>
          <button className="btn btn-primary btn-sm" onClick={send} disabled={sending}
            style={{ borderRadius: 20 }}>
            {sending ? '…' : '✓ Invia'}
          </button>
        </div>
      )}

      {/* ── Recording pill ── */}
      {recording && (
        <RecordingPill secs={recordSecs} onStop={stopRecording} onCancel={cancelRecording} />
      )}

      {/* ── Input bar ── */}
      {!recording && !audioBlob && !photoPreview && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px',
          background: 'var(--white)', borderTop: '1px solid rgba(200,162,168,0.2)',
          flexShrink: 0,
        }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* 📷 Bottone foto */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => { if (!ensureName()) return; setShowPhotoMenu(v => !v) }}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: `1.5px solid ${showPhotoMenu ? 'var(--rose)' : 'rgba(200,162,168,0.3)'}`,
                background: showPhotoMenu ? 'rgba(200,130,106,0.12)' : 'var(--ivory)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 16,
                transition: 'all 0.2s',
              }}
              title="Foto"
            >📷</button>

            {showPhotoMenu && (
              <>
                <div onClick={() => setShowPhotoMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{
                  position: 'absolute', bottom: 46, left: 0, zIndex: 100,
                  background: 'var(--white)', borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  border: '1px solid rgba(200,162,168,0.2)',
                  overflow: 'hidden', minWidth: 200,
                  animation: 'menuIn 0.15s ease-out',
                }}>
                  {[
                    { icon: '📸', label: 'Scatta una foto', action: () => { setShowPhotoMenu(false); setShowCamera(true) } },
                    { icon: '🖼️', label: 'Carica dalla libreria', action: () => { setShowPhotoMenu(false); fileInputRef.current?.click() } },
                  ].map((item, idx, arr) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        width: '100%', padding: '12px 16px', border: 'none',
                        background: 'none', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: 'var(--charcoal)', fontSize: 13,
                        borderBottom: idx < arr.length - 1 ? '1px solid rgba(200,162,168,0.1)' : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--ivory)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ fontSize: 17 }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={inputRef}
            placeholder={activeName ? 'Scrivi un messaggio…' : 'Scegli il tuo nome per scrivere…'}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            onClick={() => ensureName()}
            style={{
              flex: 1, border: '1.5px solid rgba(200,162,168,0.25)',
              borderRadius: 20, padding: '9px 14px', fontSize: 14,
              fontFamily: 'var(--font-sans)', resize: 'none', lineHeight: 1.4,
              background: 'var(--ivory)', color: 'var(--charcoal)', maxHeight: 120,
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--rose)'; e.target.style.boxShadow = '0 0 0 3px rgba(200,130,106,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(200,162,168,0.25)'; e.target.style.boxShadow = 'none' }}
            rows={1}
          />

          {/* Send / Mic */}
          {text.trim() || photoFile ? (
            <button onClick={send} disabled={sending} style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: 'var(--rose)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
              opacity: sending ? 0.6 : 1,
            }}>➤</button>
          ) : (
            <button onClick={startRecording} style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1.5px solid rgba(200,162,168,0.3)',
              background: 'var(--ivory)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
            }} title="Registra messaggio vocale">🎙️</button>
          )}
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}