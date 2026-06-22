import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'
import { WEDDING_CONFIG } from '../config/wedding'
import { API, getToken, getGuestName, compressPhoto } from '../components/chat/chatHelpers'
import MessageBubble, { DateSep } from '../components/chat/MessageBubble'
import NameModal from '../components/chat/NameModal'
import RecordingPill from '../components/chat/RecordingPill'
import CameraModal from '../components/chat/CameraModal'
import PhotoReelModal from '../components/chat/PhotoReelModal'

export default function Chat() {
  const { user, loading: authLoading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [guestName, setGuestName] = useState(getGuestName)
  const [nameModalMode, setNameModalMode] = useState('hidden') // 'hidden' | 'new' | 'edit'
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [showReel, setShowReel] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const myId = user?.id || null
  const isAdmin = user?.is_admin || false
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
    if (!text.trim() && !audioBlob && !photoFile && !videoFile) return
    setSending(true)

    try {
      const form = new FormData()
      if (text.trim()) form.append('content', text.trim())

      if (audioBlob) {
        const ext = audioBlob.type.includes('webm') ? '.webm' : '.ogg'
        const audioFile = new File([audioBlob], `audio${ext}`, { type: audioBlob.type })
        form.append('audio', audioFile)
      }

      if (videoFile) {
        form.append('video', videoFile)
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
      setVideoFile(null)
      inputRef.current?.focus()
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

  const handleVideoChange = e => {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    setVideoFile(f)
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

      {nameModalMode !== 'hidden' && (
        <NameModal
          onDone={handleNameDone}
          isEditing={nameModalMode === 'edit'}
          currentName={nameModalMode === 'edit' ? guestName : ''}
        />
      )}
      {showReel && <PhotoReelModal onClose={() => setShowReel(false)} />}
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 10px 0 14px',
        background: 'var(--white)', borderBottom: '1px solid rgba(200,162,168,0.2)',
        flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        minHeight: 60,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--rose), var(--blush))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>💍</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 400, color: 'var(--charcoal)' }}>
            {WEDDING_CONFIG.couple.displayName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sage)' }}>
            {messages.length} messaggi · {WEDDING_CONFIG.dateLabel}
          </div>
        </div>

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
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
              animation: 'namePop 0.25s ease-out', maxWidth: 160,
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

      {/* Messages */}
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

      {/* Photo preview */}
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

      {/* Video preview */}
      {videoFile && (
        <div style={{
          padding: '10px 12px', background: 'var(--cream)',
          borderTop: '1px solid rgba(200,162,168,0.2)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🎬</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {videoFile.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--warm-gray)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {sending ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 12, height: 12,
                    border: '2px solid var(--blush)', borderTopColor: 'var(--rose)',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                  }} />
                  Caricamento su Drive…
                </>
              ) : `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB · verrà caricato su Drive`}
            </div>
          </div>
          {!sending && (
            <button onClick={() => setVideoFile(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--warm-gray)', fontSize: 12, padding: '4px 8px',
            }}>Scarta</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={send} disabled={sending} style={{ borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            {sending ? (
              <span style={{
                display: 'inline-block', width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
            ) : '✓ Invia'}
          </button>
        </div>
      )}

      {/* Audio preview */}
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
          <button className="btn btn-primary btn-sm" onClick={send} disabled={sending} style={{ borderRadius: 20 }}>
            {sending ? '…' : '✓ Invia'}
          </button>
        </div>
      )}

      {/* Recording pill */}
      {recording && (
        <RecordingPill secs={recordSecs} onStop={stopRecording} onCancel={cancelRecording} />
      )}

      {/* Input bar */}
      {!recording && !audioBlob && !photoPreview && !videoFile && (
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px',
          background: 'var(--white)', borderTop: '1px solid rgba(200,162,168,0.2)',
          flexShrink: 0,
        }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoChange} />

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
                    { icon: '🎬', label: 'Carica un video', action: () => { setShowPhotoMenu(false); videoInputRef.current?.click() } },
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
