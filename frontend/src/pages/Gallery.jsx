import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'

import { WEDDING_CONFIG } from '../config/wedding'
const { projectId: SUPABASE_PROJECT_ID, bucket: SUPABASE_BUCKET } = WEDDING_CONFIG.supabase
const getSupabasePhotoUrl = (filename) =>
  `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${SUPABASE_BUCKET}/photos/${filename}`

function AudioList({ messages }) {
  const audioMsgs = messages.filter(m => m.audio_path)
  if (audioMsgs.length === 0) return (
    <div style={{ textAlign:'center', padding: '60px 20px', color:'var(--warm-gray)' }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>🎙️</div>
      <p>Nessun audio ancora. Registra un messaggio vocale dalla Chat.</p>
    </div>
  )

  return (
    <div style={{ display:'grid', gap:16, padding:'0 4px' }}>
      {audioMsgs.map(msg => (
        <div key={msg.id} style={{
          background:'var(--white)', borderRadius:'16px', border:'1px solid rgba(207,165,181,.18)',
          padding:'18px 20px', boxShadow:'0 1px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--rose)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              🎙️
            </div>
            <div>
              <div style={{ fontWeight:600, color:'var(--charcoal)', marginBottom:2 }}>{msg.guest_name || 'Ospite'}</div>
              <div style={{ fontSize:12, color:'var(--warm-gray)' }}>
                {new Date(msg.created_at).toLocaleString('it-IT', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          </div>
          {msg.content && (
            <p style={{ color:'var(--warm-gray)', fontStyle:'italic', marginBottom:14, lineHeight:1.6 }}>
              "{msg.content}"
            </p>
          )}
          <audio controls src={msg.audio_path} style={{ width:'100%' }} />
        </div>
      ))}
    </div>
  )
}

export default function Gallery() {
  const { user } = useAuth()
  const toast = useToast()
  const [photos, setPhotos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [messages, setMessages]   = useState([])
  const [audioLoading, setAudioLoading] = useState(true)
  const [tab, setTab]             = useState('gallery')  // gallery | audio | camera | upload
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption]     = useState('')
  const [preview, setPreview]     = useState(null)
  const [selected, setSelected]   = useState(null)

  // Camera
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [captured, setCaptured] = useState(null)

  useEffect(() => {
    loadPhotos()
    loadMessages()
    return () => stopCamera()
  }, [])

  const loadPhotos = async () => {
    try {
      const photoData = await api.listPhotos()
      const messageData = await api.listMessages()
      
      // Combine photos from both sources
      const messagesWithPhotos = messageData
        .filter(m => m.photo_url)
        .map(m => ({
          id: `msg-${m.id}`,
          url: m.photo_url,
          filename: m.photo_url.split('/').pop(),
          caption: m.content,
          guest_name: m.guest_name || 'Ospite',
          avatar_url: m.avatar_url,
          guest_id: m.guest_id,
          created_at: m.created_at,
        }))
      
      // Combine and sort by date (newest first)
      const allPhotos = [...photoData, ...messagesWithPhotos]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      setPhotos(allPhotos)
    } catch(e) { toast.error('Errore caricamento foto') }
    setLoading(false)
  }

  const loadMessages = async () => {
    try {
      const data = await api.listMessages()
      setMessages(data)
    } catch(e) { toast.error('Errore caricamento audio') }
    setAudioLoading(false)
  }

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch(e) {
      toast.error('Impossibile accedere alla fotocamera: ' + e.message)
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
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      setCaptured(blob)
      setPreview(canvas.toDataURL('image/jpeg', .9))
      stopCamera()
    }, 'image/jpeg', .9)
  }

  const retake = () => {
    setCaptured(null)
    setPreview(null)
    startCamera()
  }

  // ── File input ─────────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCaption('')
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
    setCaptured(file)
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const upload = async () => {
    if (!captured) return
    setUploading(true)
    try {
      const name = captured instanceof File ? captured.name : `foto-${Date.now()}.jpg`
      const file = captured instanceof File ? captured : new File([captured], name, { type:'image/jpeg' })

      const form = new FormData()
      form.append('file', file)
      form.append('caption', caption)
      const photo = await api.uploadPhoto(form)
      setPhotos(prev => [photo, ...prev])

      // Invia anche in chat
      const msgForm = new FormData()
      msgForm.append('file', file)
      if (caption) msgForm.append('content', caption)
      await api.sendMessage(msgForm)

      toast.success('Foto caricata! 📸')
      setCaptured(null); setPreview(null); setCaption(''); setTab('gallery')
    } catch(e) {
      toast.error('Errore upload: ' + e.message)
    }
    setUploading(false)
  }

  const deletePhoto = async (id) => {
    if (!confirm('Eliminare questa foto?')) return
    try {
      await api.deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
      toast.success('Foto eliminata')
      setSelected(null)
    } catch(e) { toast.error('Errore eliminazione') }
  }

  const tabs = [
    { id:'gallery', label:'Foto', icon:'🖼️' },
    { id:'audio',   label:'Audio', icon:'🎙️' },
    { id:'camera',  label:'Fotocamera', icon:'📸' },
    { id:'upload',  label:'Carica', icon:'⬆️' },
  ]

  return (
    <div className="page-enter" style={{ padding:'60px 0 100px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', padding:'0 20px 40px' }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>📷</div>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'2.5rem', color:'var(--charcoal)', marginBottom:8 }}>
          Galleria dei ricordi
        </h1>
        <p style={{ color:'var(--warm-gray)' }}>
          Scatta e condividi i tuoi momenti preferiti • {photos.length} foto • {messages.filter(m => m.audio_path).length} audio
        </p>
      </div>

      {/* Tabs — horizontal scroll on mobile, centered on desktop */}
      <div className="no-scrollbar" style={{
        display:'flex', justifyContent:'flex-start', gap:8,
        padding:'0 20px 32px', overflowX:'auto', scrollSnapType:'x proximity',
        WebkitOverflowScrolling:'touch',
      }}>
        <div style={{ flex:1, minWidth:0 }} className="hide-mobile" />
        {tabs.map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flexShrink:0, scrollSnapAlign:'start' }}
            onClick={() => {
              setTab(t.id)
              if (t.id === 'camera') startCamera()
              else stopCamera()
              if (t.id === 'audio' && messages.length === 0) loadMessages()
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <div style={{ flex:1, minWidth:0 }} className="hide-mobile" />
      </div>

      {/* Camera tab */}
      {tab === 'camera' && (
        <div className="container-sm" style={{ padding:'0 20px' }}>
          <div className="card" style={{ overflow:'hidden', position:'relative' }}>
            {!captured ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  style={{ width:'100%', display: cameraOn ? 'block' : 'none', background:'#000' }}
                />
                {!cameraOn && (
                  <div style={{ padding:48, textAlign:'center' }}>
                    <div style={{ fontSize:'4rem', marginBottom:16 }}>📷</div>
                    <p style={{ color:'var(--warm-gray)', marginBottom:20 }}>La fotocamera è spenta</p>
                    <button className="btn btn-primary" onClick={startCamera}>Accendi la fotocamera</button>
                  </div>
                )}
                {cameraOn && (
                  <div style={{
                    position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)',
                    display:'flex', gap:12
                  }}>
                    <button
                      onClick={capturePhoto}
                      style={{
                        width:72, height:72, borderRadius:'50%',
                        background:'var(--white)', border:'4px solid var(--rose)',
                        cursor:'pointer', fontSize:'1.5rem',
                        boxShadow:'var(--shadow-md)',
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}
                    >📸</button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <img src={preview} alt="Anteprima" style={{ width:'100%', display:'block' }} />
                <div style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
                  <input
                    className="input"
                    placeholder="Aggiungi una didascalia…"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                  />
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn btn-outline" onClick={retake} style={{ flex:1 }}>↩ Rifai</button>
                    <button className="btn btn-primary" onClick={upload} disabled={uploading} style={{ flex:2 }}>
                      {uploading ? 'Caricamento…' : '⬆️ Pubblica nella galleria'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }} />
        </div>
      )}

      {/* Upload tab */}
      {tab === 'upload' && (
        <div className="container-sm" style={{ padding:'0 20px' }}>
          <div className="card" style={{ padding:32 }}>
            {!preview ? (
              <label style={{
                display:'block', border:'2px dashed var(--blush)', borderRadius:'var(--radius-md)',
                padding:'48px 24px', textAlign:'center', cursor:'pointer',
                transition:'all .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--rose)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--blush)'}
              >
                <div style={{ fontSize:'3rem', marginBottom:12 }}>⬆️</div>
                <p style={{ color:'var(--warm-gray)', marginBottom:4 }}>Clicca o trascina qui le tue foto</p>
                <p style={{ fontSize:'.8rem', color:'var(--blush)' }}>JPG, PNG, WEBP · max 30MB</p>
                <input type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} multiple={false} />
              </label>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <img src={preview} alt="Anteprima" style={{ width:'100%', borderRadius:'var(--radius-md)', objectFit:'cover', maxHeight:320 }} />
                <input className="input" placeholder="Didascalia…" value={caption} onChange={e => setCaption(e.target.value)} />
                <div style={{ display:'flex', gap:12 }}>
                  <button className="btn btn-outline" onClick={() => { setPreview(null); setCaptured(null) }} style={{ flex:1 }}>✕ Rimuovi</button>
                  <button className="btn btn-primary" onClick={upload} disabled={uploading} style={{ flex:2 }}>
                    {uploading ? 'Caricamento…' : 'Pubblica'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery tab */}
      {tab === 'gallery' && (
        <div style={{ padding:'0 12px' }}>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--warm-gray)' }}>
              <div style={{ fontSize:'3rem', marginBottom:12 }}>📷</div>
              <p>Nessuna foto ancora. Sii il primo a condividere un momento!</p>
            </div>
          ) : (
            <div style={{
              columns: 'auto 180px', columnGap:8,
            }}>
              {photos.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    marginBottom:8, breakInside:'avoid',
                    borderRadius:'var(--radius-md)', overflow:'hidden',
                    cursor:'pointer', position:'relative',
                    transition:'transform .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform=''}
                >
                  <img
                    src={p.url || getSupabasePhotoUrl(p.filename)}
                    alt={p.caption || ''}
                    loading="lazy"
                    style={{ width:'100%', display:'block' }}
                  />
                  <div style={{
                    position:'absolute', bottom:0, left:0, right:0,
                    background:'linear-gradient(transparent, rgba(0,0,0,.5))',
                    padding:'20px 10px 8px',
                    opacity:0, transition:'opacity .2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity=1}
                    onMouseLeave={e => e.currentTarget.style.opacity=0}
                  >
                    <p style={{ color:'#fff', fontSize:'.8rem' }}>{p.guest_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'audio' && (
        <div style={{ padding:'0 12px' }}>
          {audioLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
          ) : (
            <AudioList messages={messages} />
          )}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position:'fixed', inset:0, zIndex:200,
            background:'rgba(0,0,0,.9)', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', padding:20,
          }}
        >
          <img
            src={selected.url || getSupabasePhotoUrl(selected.filename)}
            alt={selected.caption}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth:'100%', maxHeight:'70dvh', borderRadius:'var(--radius-md)', objectFit:'contain' }}
          />
          <div onClick={e => e.stopPropagation()} style={{ color:'#fff', textAlign:'center', marginTop:16, maxWidth:480 }}>
            {selected.caption && <p style={{ marginBottom:8, fontFamily:'var(--font-serif)', fontStyle:'italic' }}>{selected.caption}</p>}
            <p style={{ fontSize:'.85rem', opacity:.7 }}>📷 {selected.guest_name}</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:12 }}>
              {!String(selected.id).startsWith('msg-') && (String(selected.guest_id) === String(user?.id) || user?.is_admin) && (
                <button className="btn btn-sm" style={{ background:'rgba(199,107,139,.8)', color:'#fff' }}
                  onClick={() => deletePhoto(selected.id)}>🗑 Elimina</button>
              )}
              <button className="btn btn-sm btn-ghost" style={{ color:'#fff' }} onClick={() => setSelected(null)}>✕ Chiudi</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
