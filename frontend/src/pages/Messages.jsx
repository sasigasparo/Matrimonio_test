import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../hooks/useToast'

function AudioPlayer({ src }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  const toggle = () => {
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      background:'var(--cream)', borderRadius:99, padding:'8px 16px',
      marginTop:8
    }}>
      <audio
        ref={audioRef} src={src}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={e => setProgress(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
      />
      <button
        onClick={toggle}
        style={{
          width:36, height:36, borderRadius:'50%',
          background:'var(--rose)', border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#fff', fontSize:'.9rem', flexShrink:0
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ height:4, background:'rgba(200,130,106,.2)', borderRadius:99, overflow:'hidden' }}>
          <div style={{
            height:'100%', background:'var(--rose)', borderRadius:99,
            width: duration ? `${(progress/duration)*100}%` : '0%',
            transition:'width .1s'
          }} />
        </div>
      </div>
      <span style={{ fontSize:'.75rem', color:'var(--warm-gray)', flexShrink:0 }}>
        {fmt(progress)} / {fmt(duration)}
      </span>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('list')   // list | write
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)

  // Audio recording
  const [recording, setRecording]     = useState(false)
  const [audioBlob, setAudioBlob]     = useState(null)
  const [audioUrl, setAudioUrl]       = useState(null)
  const [recordSecs, setRecordSecs]   = useState(0)
  const mediaRecRef = useRef(null)
  const timerRef    = useRef(null)
  const chunksRef   = useRef([])

  useEffect(() => {
    loadMessages()
    return () => stopRecording()
  }, [])

  const loadMessages = async () => {
    try {
      const data = await api.listMessages()
      setMessages(data)
    } catch(e) { toast.error('Errore caricamento messaggi') }
    setLoading(false)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' })
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecRef.current = mr
      setRecording(true)
      setRecordSecs(0)
      timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000)
    } catch(e) {
      toast.error('Impossibile accedere al microfono: ' + e.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecRef.current && recording) {
      mediaRecRef.current.stop()
      setRecording(false)
    }
    clearInterval(timerRef.current)
  }

  const discardAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordSecs(0)
  }

  const send = async () => {
    if (!text.trim() && !audioBlob) return
    setSending(true)
    try {
      const form = new FormData()
      if (text.trim()) form.append('content', text.trim())
      if (audioBlob) {
        const ext = audioBlob.type.includes('webm') ? '.webm' : '.ogg'
        form.append('audio', new File([audioBlob], `messaggio${ext}`, { type: audioBlob.type }))
      }
      const msg = await api.sendMessage(form)
      setMessages(prev => [msg, ...prev])
      toast.success('💌 Messaggio inviato agli sposi!')
      setText(''); discardAudio(); setTab('list')
    } catch(e) {
      toast.error('Errore: ' + e.message)
    }
    setSending(false)
  }

  const deleteMsg = async (id) => {
    if (!confirm('Eliminare questo messaggio?')) return
    try {
      await api.deleteMsg(id)
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Messaggio eliminato')
    } catch(e) { toast.error('Errore eliminazione') }
  }

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="page-enter" style={{ padding:'60px 0 100px' }}>
      <div className="container-sm" style={{ padding:'0 20px' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>💌</div>
          <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'2.5rem', color:'var(--charcoal)', marginBottom:8 }}>
            Messaggi per gli sposi
          </h1>
          <p style={{ color:'var(--warm-gray)' }}>
            Lascia un pensiero scritto o registra un messaggio vocale
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:32, justifyContent:'center' }}>
          <button className={`btn ${tab === 'list' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('list')}>
            💌 Tutti i messaggi
          </button>
          <button className={`btn ${tab === 'write' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('write')}>
            ✍️ Scrivi
          </button>
        </div>

        {/* Write tab */}
        {tab === 'write' && (
          <div className="card" style={{ padding:28, marginBottom:32 }}>
            <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1.3rem', marginBottom:20 }}>
              Un pensiero per Sofia & Marco
            </h3>

            <div style={{ marginBottom:20 }}>
              <label>Messaggio scritto</label>
              <textarea
                className="textarea"
                placeholder="Scrivi il tuo messaggio agli sposi… auguri, un ricordo, un consiglio per la vita insieme 💕"
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
              />
            </div>

            <div style={{ marginBottom:20 }}>
              <label>Messaggio vocale</label>
              {!audioUrl ? (
                <div style={{
                  border:'2px dashed var(--blush)', borderRadius:'var(--radius-md)',
                  padding:24, textAlign:'center',
                }}>
                  {!recording ? (
                    <div>
                      <div style={{ fontSize:'2.5rem', marginBottom:8 }}>🎙️</div>
                      <p style={{ color:'var(--warm-gray)', marginBottom:16, fontSize:'.9rem' }}>
                        Registra un messaggio vocale speciale
                      </p>
                      <button className="btn btn-outline" onClick={startRecording}>
                        ⏺ Inizia registrazione
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:'2rem', marginBottom:8, animation:'pulse 1s infinite' }}>🔴</div>
                      <p style={{ color:'var(--rose)', fontWeight:500, marginBottom:8 }}>
                        Registrazione in corso… {fmt(recordSecs)}
                      </p>
                      <button className="btn btn-primary" onClick={stopRecording}>
                        ⏹ Stop
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background:'var(--cream)', borderRadius:'var(--radius-md)', padding:16 }}>
                  <AudioPlayer src={audioUrl} />
                  <button className="btn btn-ghost btn-sm" onClick={discardAudio} style={{ marginTop:8 }}>
                    ✕ Elimina registrazione
                  </button>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center' }}
              onClick={send}
              disabled={sending || (!text.trim() && !audioBlob)}
            >
              {sending ? 'Invio…' : '💌 Invia messaggio'}
            </button>
          </div>
        )}

        {/* List tab */}
        {tab === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {loading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" /></div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, color:'var(--warm-gray)' }}>
                <div style={{ fontSize:'3rem', marginBottom:12 }}>💌</div>
                <p>Ancora nessun messaggio. Sii il primo!</p>
                <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setTab('write')}>
                  Scrivi un messaggio
                </button>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <img
                    src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.guest_name)}&background=e8c4a8&color=2c2420`}
                    alt={m.guest_name}
                    style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid var(--cream)' }}
                  />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div>
                        <span style={{ fontWeight:500, color:'var(--charcoal)' }}>{m.guest_name}</span>
                        <span style={{ fontSize:'.8rem', color:'var(--warm-gray)', marginLeft:8 }}>
                          {new Date(m.created_at).toLocaleDateString('it-IT', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      {user?.is_admin && (
                        <button
                          onClick={() => deleteMsg(m.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--warm-gray)', fontSize:'.8rem' }}
                        >🗑</button>
                      )}
                    </div>

                    {m.content && (
                      <p style={{
                        marginTop:8, color:'var(--charcoal)', lineHeight:1.6,
                        fontFamily: m.type !== 'audio' ? 'var(--font-serif)' : undefined,
                        fontStyle: m.type !== 'audio' ? 'italic' : undefined,
                        fontSize:'1.05rem'
                      }}>
                        "{m.content}"
                      </p>
                    )}
                    {m.audio_path && <AudioPlayer src={m.audio_path} />}
                    {m.type === 'audio' && !m.content && (
                      <p style={{ fontSize:'.8rem', color:'var(--warm-gray)', marginTop:4 }}>🎙️ Messaggio vocale</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer toasts={toast.toasts} />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  )
}
