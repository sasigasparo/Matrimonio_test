import { useState, useEffect, useRef } from 'react'

export default function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const lastTapRef = useRef(0)
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

  const handleDoubleTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) flip()
    lastTapRef.current = now
  }

  const shoot = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
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

  const isFront = facing === 'user'

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
        <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: 15 }}>
          {isFront ? 'Selfie' : 'Scatta una foto'}
        </span>
        <button onClick={flip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 22, padding: '4px 8px',
        }} title="Cambia fotocamera">🔄</button>
      </div>

      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onTouchEnd={handleDoubleTap}
        onDoubleClick={flip}
      >
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
              transform: isFront ? 'scaleX(-1)' : 'none',
            }}
          />
        )}
        {ready && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.45)', fontSize: 11, pointerEvents: 'none',
          }}>
            Doppio tap per cambiare fotocamera
          </div>
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
