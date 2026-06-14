import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'

const API = 'http://localhost:8000/api'
const SUPABASE_PROJECT_ID = 'wzwtwbnjcxrwxgiurgqa'
const SUPABASE_BUCKET = 'wedding-photos'

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
        <div key={i} style={{
          width: 1.5, height: h, borderRadius: 1, flexShrink: 0,
          background: i / bars < progress ? color : dimColor,
          transition: 'background 0.1s',
        }} />
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: 200, flex: 1 }}>
      <audio ref={ref} src={src}
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={e => setProgress(e.target.currentTime / (e.target.duration || 1))}
        onLoadedMetadata={e => setDuration(e.target.duration)}
      />
      <button onClick={toggle} style={{
        width: 32, height: 32, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: outgoing ? 'rgba(255,255,255,0.3)' : 'var(--rose)',
        color: '#fff', cursor: 'pointer', fontSize: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playing ? '⏸' : '▶'}
      </button>
      <Waveform progress={progress}
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
  const name = msg.guest_name || 'Ospite'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const timeStr = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  const bubbleStyle = {
    borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
    background: isMe ? 'var(--rose)' : 'var(--white)',
    color: isMe ? '#fff' : 'var(--charcoal)',
    border: isMe ? 'none' : '1px solid rgba(200,162,168,0.2)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
      alignItems: 'flex-end', gap: 8, animation: 'msgIn 0.2s ease-out',
    }}>
      {!isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'var(--blush)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 600,
          color: 'var(--charcoal)', overflow: 'hidden', border: '2px solid var(--cream)',
        }}>
          {msg.avatar_url
            ? <img src={msg.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : initials}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
        {!isMe && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sage)', paddingLeft: 4 }}>{name}</span>}
        <div style={bubbleStyle}>
          {msg.photo_url && (
            <div>
              <img src={msg.photo_url} alt="Foto"
                style={{ width: '100%', maxWidth: 300, maxHeight: 400, display: 'block', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => window.open(msg.photo_url, '_blank')}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          )}
          {msg.audio_path && (
            <div style={{ padding: '8px 12px' }}>
              <AudioBubble src={msg.audio_path} outgoing={isMe} />
            </div>
          )}
          {(msg.content || msg.type === 'photo_text') && msg.content && (
            <p style={{
              padding: msg.photo_url ? '8px 12px 10px' : msg.audio_path ? '6px 12px 8px' : '10px 14px',
              margin: 0, fontSize: 14, lineHeight: 1.5,
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
            }}>
              {msg.content}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
          <span style={{ fontSize: 10, color: 'var(--warm-gray)' }}>{timeStr}</span>
          {(isAdmin || isMe) && (
            <button onClick={() => onDelete(msg.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: 'var(--warm-gray)', padding: '0 2px', opacity: 0.6,
            }}>🗑</button>
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
      <span style={{ fontSize: 11, color: 'var(--warm-gray)', background: 'rgba(245,237,228,0.9)', padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>{label}</span>
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
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', marginBottom: 8, color: 'var(--charcoal)' }}>Come ti chiami?</h2>
        <p style={{ color: 'var(--warm-gray)', fontSize: 14, marginBottom: 24 }}>Il tuo nome apparirà accanto ai tuoi messaggi e foto nella chat.</p>
        <input className="input" placeholder="Il tuo nome completo" value={name}
          onChange={e => { setName(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus style={{ marginBottom: err ? 8 : 16, textAlign: 'center', fontSize: 16 }}
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--cream)', borderTop: '1px solid rgba(200,162,168,0.2)' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rose)', animation: 'pulse 1s infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--charcoal)', fontWeight: 500 }}>Registrazione… {fmt(secs)}</span>
      <div style={{ flex: 1 }} />
      <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', fontSize: 13 }}>Annulla</button>
      <button onClick={onStop} className="btn btn-primary btn-sm" style={{ borderRadius: 99 }}>⏹ Invia</button>
    </div>
  )
}

/* ── Photo picker modal (camera + gallery) ───────────────────────── */
function PhotoPickerModal({ onCapture, onFileSelect, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const [mode, setMode] = useState('choose') // 'choose' | 'camera'
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')

  // Start camera automatically when entering camera mode
  useEffect(() => {
    if (mode === 'camera') {
      startCamera()
    }
    return () => {
      if (mode === 'camera') stopCamera()
    }
  }, [mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    setCameraError('')
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      // Give the video element time to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
          setCameraOn(true)
        }
      }, 100)
    } catch (e) {
      setCameraError('Impossibile accedere alla fotocamera: ' + (e.message || e.name))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      stopCamera()
      onCapture(blob, canvas.toDataURL('image/jpeg', 0.9))
    }, 'image/jpeg', 0.9)
  }

  const handleFileInput = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      onFileSelect(f, ev.target.result)
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 250,
      background: mode === 'camera' ? '#000' : 'rgba(44,36,32,0.7)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {mode === 'choose' && (
        <div style={{
          background: 'var(--white)', borderRadius: 20, padding: 32,
          maxWidth: 320, width: '90%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📷</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', color: 'var(--charcoal)', marginBottom: 8 }}>Aggiungi una foto</h3>
          <p style={{ color: 'var(--warm-gray)', fontSize: 13, marginBottom: 24 }}>Scatta una foto con la fotocamera o scegli dal rullino</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" style={{ justifyContent: 'center', gap: 10 }}
              onClick={() => setMode('camera')}>
              📸 Fotocamera
            </button>
            <button className="btn btn-outline" style={{ justifyContent: 'center', gap: 10 }}
              onClick={() => fileInputRef.current?.click()}>
              🖼️ Rullino foto
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
        </div>
      )}

      {mode === 'camera' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {cameraError ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: 32 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📷</div>
              <p style={{ marginBottom: 20, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{cameraError}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => { setCameraError(''); startCamera() }}>Riprova</button>
                <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
                  onClick={() => fileInputRef.current?.click()}>
                  🖼️ Dal rullino
                </button>
                <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={onClose}>Chiudi</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
              />
              {!cameraOn && (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                  <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff', margin: '0 auto 16px' }} />
                  <p>Avvio fotocamera…</p>
                </div>
              )}
              {cameraOn && (
                <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20, alignItems: 'center' }}>
                  <button onClick={() => { stopCamera(); setMode('choose') }}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.6)', color: '#fff', padding: '8px 18px', borderRadius: 99, cursor: 'pointer', fontSize: 13 }}>
                    ✕ Chiudi
                  </button>
                  <button onClick={capturePhoto} style={{
                    width: 72, height: 72, borderRadius: '50%', background: '#fff', border: '4px solid rgba(200,130,106,0.8)',
                    cursor: 'pointer', fontSize: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>📸</button>
                  <button onClick={() => { stopCamera(); fileInputRef.current?.click() }}
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.6)', color: '#fff', padding: '8px 18px', borderRadius: 99, cursor: 'pointer', fontSize: 13 }}>
                    🖼️ Rullino
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInput} />
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  )
}

/* ── Main Unified Chat component ─────────────────────────────────── */
export default function UnifiedChat() {
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
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

  // audio
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages(data.reverse())
    } catch (e) {
      toast.error('Errore caricamento messaggi')
    }
    setLoading(false)
  }

  const ensureName = () => {
    if (user?.name) return user.name
    if (guestName) return guestName
    setShowNameModal(true)
    return null
  }

  const handlePhotoPickerOpen = () => {
    const name = ensureName()
    if (!name) return
    setShowPhotoPicker(true)
  }

  const handleCameraCapture = (blob, preview) => {
    setPhotoFile(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    setPhotoPreview(preview)
    setShowPhotoPicker(false)
  }

  const handleFileSelect = (file, preview) => {
    setPhotoFile(file)
    setPhotoPreview(preview)
    setShowPhotoPicker(false)
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const send = async () => {
    const name = ensureName()
    if (!name) return

    const currentText = text.trim()
    const currentAudio = audioBlob
    const currentFile = photoFile
    const currentPreview = photoPreview

    if (!currentText && !currentAudio && !currentFile) return
    if (sending) return
    setSending(true)

    console.log('📨 SEND | text=%o | hasAudio=%s | hasFile=%s | name=%s',
      currentText || null, !!currentAudio, !!currentFile, name)

    // Clear UI immediately
    setText('')
    setPhotoPreview(null)
    setPhotoFile(null)
    if (!currentAudio) setAudioBlob(null)

    try {
      const form = new FormData()
      if (currentText) form.append('content', currentText)

      if (currentAudio) {
        const ext = currentAudio.type.includes('webm') ? '.webm' : '.ogg'
        form.append('audio', new File([currentAudio], `audio${ext}`, { type: currentAudio.type }))
        console.log('🎙️  AUDIO | type=%s | size=%d', currentAudio.type, currentAudio.size)
      }

      if (currentFile) {
        const mimeToExt = {
          'image/jpeg': '.jpg', 'image/jpg': '.jpg',
          'image/png': '.png', 'image/webp': '.webp',
          'image/gif': '.gif', 'image/heic': '.heic',
        }
        const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic']
        const origExt = currentFile.name.includes('.')
          ? '.' + currentFile.name.split('.').pop().toLowerCase()
          : ''
        const ext = validExts.includes(origExt) ? origExt : (mimeToExt[currentFile.type] || '.jpg')
        const safeFile = (origExt === ext)
          ? currentFile
          : new File([currentFile], 'foto' + ext, { type: currentFile.type || 'image/jpeg' })
        form.append('file', safeFile)
        console.log('🖼️  FILE | name=%s | ext=%s | type=%s | size=%d', safeFile.name, ext, safeFile.type, safeFile.size)
      }

      form.append('guest_name', name)

      const headers = {}
      const token = getToken()
      if (token) headers['Authorization'] = `Bearer ${token}`

      console.log('⬆️  POST /messages/ | fields:', [...form.keys()])

      const res = await fetch(`${API}/messages/`, { method: 'POST', headers, body: form })
      if (!res.ok) {
        const raw = await res.text()
        let detail = raw
        try { detail = JSON.parse(raw).detail || raw } catch {}
        console.error('❌ BACKEND ERROR | status=%d | body=%s', res.status, raw)
        throw new Error(detail)
      }
      const msg = await res.json()
      console.log('✅ MSG_SENT | id=%s | type=%s', msg.id, msg.type)
      if (!msg.photo_url && currentPreview) msg.photo_url = currentPreview
      setMessages(prev => [...prev, msg])
      setAudioBlob(null)
      toast.success('✓ Messaggio inviato!')
      inputRef.current?.focus()
    } catch (e) {
      console.error('❌ SEND_CATCH | %s', e.message)
      toast.error('Errore invio: ' + e.message)
      if (currentText) setText(currentText)
      if (currentFile) { setPhotoFile(currentFile); setPhotoPreview(currentPreview) }
      if (currentAudio) setAudioBlob(currentAudio)
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

  const deleteMsg = async (id) => {
    if (!confirm('Eliminare questo messaggio?')) return
    try {
      const headers = { Authorization: `Bearer ${getToken()}` }
      await fetch(`${API}/messages/${id}`, { method: 'DELETE', headers })
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Messaggio eliminato')
    } catch { toast.error('Errore eliminazione') }
  }

  // Group messages by date
  const grouped = []
  let lastDate = null
  for (const msg of messages) {
    const d = msg.created_at?.slice(0, 10)
    if (d !== lastDate) { grouped.push({ type: 'date', date: d }); lastDate = d }
    grouped.push({ type: 'msg', msg })
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

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

      {showPhotoPicker && (
        <PhotoPickerModal
          onCapture={handleCameraCapture}
          onFileSelect={handleFileSelect}
          onClose={() => setShowPhotoPicker(false)}
        />
      )}

      {/* ── Header ── */}
      <div style={{
        height: 60, display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', background: 'var(--white)',
        borderBottom: '1px solid rgba(200,162,168,0.2)',
        flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--rose), var(--blush))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💍</div>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 400, color: 'var(--charcoal)' }}>
            Sofia &amp; Marco
          </div>
          <div style={{ fontSize: 11, color: 'var(--sage)' }}>
            {messages.length} messaggi · 21 Maggio 2026
          </div>
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
              Sii il primo a lasciare un messaggio, una foto o un audio agli sposi!
            </p>
          </div>
        ) : grouped.map((item) =>
          item.type === 'date'
            ? <DateSep key={`d-${item.date}`} date={item.date} />
            : <MessageBubble key={item.msg.id} msg={item.msg} myId={myId} isAdmin={isAdmin} onDelete={deleteMsg} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Photo preview bar ── */}
      {photoPreview && (
        <div style={{
          padding: '12px', background: 'var(--cream)',
          borderTop: '1px solid rgba(200,162,168,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={photoPreview} style={{ height: 70, width: 70, borderRadius: 8, objectFit: 'cover' }} alt="Anteprima" />
            <button onClick={clearPhoto} style={{
              position: 'absolute', top: -8, right: -8,
              background: 'var(--rose)', border: 'none', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer', color: '#fff', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>✕</button>
          </div>
          <input className="input" placeholder="Aggiungi didascalia…"
            value={text} onChange={e => setText(e.target.value)}
            style={{ flex: 1, fontSize: 13 }}
          />
          <button onClick={send} disabled={sending} className="btn btn-primary btn-sm" style={{ borderRadius: 20, flexShrink: 0 }}>
            {sending ? '…' : '✓ Invia'}
          </button>
        </div>
      )}

      {/* ── Audio preview bar ── */}
      {audioBlob && !recording && (
        <div style={{
          padding: '10px 12px', background: 'var(--cream)',
          borderTop: '1px solid rgba(200,162,168,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🎙️</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 500 }}>Messaggio vocale pronto</span>
            <p style={{ fontSize: 11, color: 'var(--warm-gray)', margin: '2px 0 0 0' }}>{fmt(recordSecs)}</p>
          </div>
          <button onClick={() => setAudioBlob(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', fontSize: 12, padding: '4px 8px', borderRadius: 4 }}>
            Scarta
          </button>
          <button className="btn btn-primary btn-sm" onClick={send} disabled={sending} style={{ borderRadius: 20 }}>
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
          {/* Photo button — opens picker (camera + gallery) */}
          <button onClick={handlePhotoPickerOpen} style={{
            width: 38, height: 38, borderRadius: '50%',
            border: '1.5px solid rgba(200,162,168,0.3)',
            background: 'var(--ivory)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
          }} title="Foto o fotocamera">📷</button>

          {/* Text area */}
          <textarea ref={inputRef}
            placeholder={guestName || user?.name ? 'Scrivi un messaggio…' : 'Clicca per scrivere…'}
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

          {/* Send or mic */}
          {text.trim() ? (
            <button onClick={send} disabled={sending} style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: 'var(--rose)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0, opacity: sending ? 0.6 : 1,
            }}>➤</button>
          ) : (
            <button onClick={startRecording} style={{
              width: 38, height: 38, borderRadius: '50%',
              border: '1.5px solid rgba(200,162,168,0.3)',
              background: 'var(--ivory)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }} title="Registra messaggio vocale">🎙️</button>
          )}
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
