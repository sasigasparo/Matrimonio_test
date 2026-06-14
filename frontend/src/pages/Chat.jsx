import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'
import { api } from '../utils/api'

const API = `${(import.meta.env.VITE_API_URL || 'https://matrimonio-test.onrender.com').replace(/\/$/, '')}/api`


function getToken() {
  return localStorage.getItem('wedding_token') || ''
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

  const name = msg.guest_name || 'Ospite'
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

        <div style={{...bubbleStyle, padding: 0, overflow: 'hidden'}}>
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
              {/* Fallback placeholder shown if image fails to load */}
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
              {/* Semi-transparent overlay on hover for gallery button */}
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

          {/* Text / caption — not shown for pure audio messages */}
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
          {(isAdmin || isMe) && (
            <button
              onClick={() => onDelete(msg.id, msg.type)}
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
function NameModal({ onDone }) {
  const [name, setName] = useState('')
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
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌸</div>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', marginBottom: 8, color: 'var(--charcoal)' }}>
          Come ti chiami?
        </h2>
        <p style={{ color: 'var(--warm-gray)', fontSize: 14, marginBottom: 24 }}>
          Il tuo nome apparirà accanto ai tuoi messaggi e foto nella chat del matrimonio.
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
          Entra nella chat 💌
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

/* ── Photo Reel modal ────────────────────────────────────────────── */
const SUPABASE_PROJECT_ID = 'wzwtwbnjcxrwxgiurgqa'
const SUPABASE_BUCKET     = 'wedding-photos'
const resolvePhotoUrl = p =>
  p.photo_url ||
  (p.filename ? `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/photos/${p.filename}` : null)

function PhotoReelModal({ onClose }) {
  const [photos, setPhotos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const token = getToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${API}/photos/`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setPhotos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // close on Escape
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

      {/* Header */}
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

      {/* Grid */}
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

      {/* Lightbox */}
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
  const { user } = useAuth()
  const toast = useToast()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [guestName, setGuestName] = useState(getGuestName)
  const [showNameModal, setShowNameModal] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [showReel, setShowReel] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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

  const myId = user?.id || null
  const isAdmin = user?.is_admin || false

  useEffect(() => { loadMessages() }, [])
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
    if (user?.name) return user.name
    if (guestName) return guestName
    setShowNameModal(true)
    return null
  }

  const send = async () => {
    const name = ensureName()
    if (!name) return
    if (!text.trim() && !audioBlob && !photoFile) {
      console.warn('[Chat] ❌ SEND | nessun contenuto: text=%s audio=%s foto=%s', text.trim().length > 0, !!audioBlob, !!photoFile)
      return
    }
    setSending(true)

    try {
      console.log('📨 [Chat] INIZIO INVIO MESSAGGIO | nome=%s | testo=%d | audio=%s | foto=%s', name, text.length, !!audioBlob, !!photoFile)
      
      const form = new FormData()
      // caption/text — only append if non-empty
      if (text.trim()) {
        form.append('content', text.trim())
        console.log('  ✓ Contenuto testo aggiunto:', text.trim().substring(0, 50))
      }

      if (audioBlob) {
        const ext = audioBlob.type.includes('webm') ? '.webm' : '.ogg'
        const audioFile = new File([audioBlob], `audio${ext}`, { type: audioBlob.type })
        form.append('audio', audioFile)
        console.log('  ✓ Audio aggiunto:', { name: audioFile.name, type: audioBlob.type, size: (audioBlob.size/1024).toFixed(1) + 'KB' })
      }

      if (photoFile) {
        // Guarantee the file has a proper extension so the backend can validate it.
        // Some browsers (especially mobile/iOS) send File objects with names like
        // "blob", "image", or "" — we derive the extension from the MIME type instead.
        const mimeToExt = {
          'image/jpeg': '.jpg', 'image/jpg': '.jpg',
          'image/png': '.png', 'image/webp': '.webp',
          'image/gif': '.gif', 'image/heic': '.heic',
        }
        const origExt = photoFile.name.includes('.')
          ? '.' + photoFile.name.split('.').pop().toLowerCase()
          : ''
        const ext = origExt || mimeToExt[photoFile.type] || '.jpg'
        const safeName = `photo${ext}`
        const safeFile = origExt
          ? photoFile
          : new File([photoFile], safeName, { type: photoFile.type || 'image/jpeg' })

        console.log('🖼️  [Chat] FOTO PREPARAZIONE:', {
          nome_originale: photoFile.name,
          tipo_originale: photoFile.type,
          estensione_originale: origExt || '(nessuna)',
          estensione_dedotta: ext,
          nome_finale: safeFile.name,
          size_kb: (photoFile.size/1024).toFixed(1),
          type_finale: safeFile.type
        })
        form.append('photo', safeFile)
        console.log('  ✓ Foto aggiunta al FormData come "photo"')
      }

      form.append('guest_name', name)
      console.log('  ✓ Nome ospite aggiunto')

      const headers = {}
      const token = getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Verifica FormData prima dell'invio
      let formEntries = []
      for (let [key, value] of form) {
        if (value instanceof File) {
          formEntries.push(`${key}: File(${value.name}, ${value.type}, ${(value.size/1024).toFixed(1)}KB)`)
        } else {
          formEntries.push(`${key}: ${String(value).substring(0, 50)}`)
        }
      }
      console.log('📤 [Chat] FORMDATA FINALE:', formEntries)
      console.log('  Headers:', headers)

      console.log('📡 [Chat] INVIO POST a', `${API}/messages/`)
      const res = await fetch(`${API}/messages/`, { method: 'POST', headers, body: form })
      
      console.log('  ← Risposta ricevuta | status:', res.status, '| ok:', res.ok)
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error('❌ [Chat] ERRORE BACKEND | status=%d | detail=%s', res.status, errBody.detail || JSON.stringify(errBody))
        throw new Error(errBody.detail || `Errore HTTP ${res.status}`)
      }
      const msg = await res.json()
      console.log('✅ [Chat] MESSAGGIO SALVATO | id=%s | tipo=%s | photo=%s | audio=%s | text=%s', 
        msg.id, msg.type, !!msg.photo_url, !!msg.audio_path, !!msg.content)

      // If backend didn't return photo_url but we have a local preview, attach it
      // so the thumbnail renders immediately in the chat list
      if (!msg.photo_url && photoPreview) {
        msg.photo_url = photoPreview
      }
      setMessages(prev => [...prev, msg])
      setText('')
      setAudioBlob(null)
      setPhotoPreview(null)
      setPhotoFile(null)
      inputRef.current?.focus()
      toast.success('✓ Messaggio inviato!')
    } catch (e) {
      console.error('❌ [Chat] ECCEZIONE:', e.message, e)
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
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
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

  const handleFileChange = e => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  const deleteMsg = async (id, type) => {
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
      `}</style>

      {showNameModal && (
        <NameModal onDone={name => { setGuestName(name); setShowNameModal(false) }} />
      )}

      {showReel && <PhotoReelModal onClose={() => setShowReel(false)} />}

      {/* ── Header ── */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 12px 0 16px',
        background: 'var(--white)', borderBottom: '1px solid rgba(200,162,168,0.2)',
        flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        position: 'relative',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--rose), var(--blush))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💍</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 400, color: 'var(--charcoal)' }}>
            Sofia &amp; Marco
          </div>
          <div style={{ fontSize: 11, color: 'var(--sage)' }}>
            {messages.length} messaggi · 14 Giugno 2026
          </div>
        </div>

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
              {/* backdrop */}
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
                  { icon: '📷', label: 'Rullino foto',      action: () => { setShowReel(true); setShowMenu(false) } },
                  { icon: '🎞️', label: 'Vai ai Ricordi',    action: () => { window.location.href = '/ricordi'; setShowMenu(false) } },
                  { icon: '💌', label: 'Vai ai Messaggi',   action: () => { window.location.href = '/messages'; setShowMenu(false) } },
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
            style={{ flex: 1, fontSize: 13 }}
          />
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
      {!recording && !audioBlob && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px',
          background: 'var(--white)', borderTop: '1px solid rgba(200,162,168,0.2)',
          flexShrink: 0,
        }}>
          {/* Photo attach */}
          <button
            onClick={() => { ensureName(); fileInputRef.current?.click() }}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: '1.5px solid rgba(200,162,168,0.3)',
              background: 'var(--ivory)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
              transition: 'all 0.2s',
            }}
            title="Allega foto"
          >📷</button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Text area */}
          <textarea
            ref={inputRef}
            placeholder={guestName || user?.name ? 'Scrivi un messaggio…' : 'Clicca per scrivere…'}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); !photoFile ? send() : send() } }}
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

          {/* Send or mic */}
          {text.trim() || photoFile ? (
            <button
              onClick={send}
              disabled={sending}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: 'var(--rose)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
                opacity: sending ? 0.6 : 1,
              }}
            >
              ➤
            </button>
          ) : (
            <button
              onClick={startRecording}
              style={{
                width: 38, height: 38, borderRadius: '50%',
                border: '1.5px solid rgba(200,162,168,0.3)',
                background: 'var(--ivory)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
              }}
              title="Registra messaggio vocale"
            >🎙️</button>
          )}
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}