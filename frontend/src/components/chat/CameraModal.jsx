import { useState, useEffect, useRef } from 'react'

export default function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const lastTapRef = useRef(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [facing, setFacing] = useState('user')
  const [mirror, setMirror] = useState(true) // front default mirrored; user can override
  const [multiCam, setMultiCam] = useState(false) // hide flip when only one camera (e.g. PC)

  const startStream = async (facingMode) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setReady(false)
    const base = { width: { ideal: 1280 }, height: { ideal: 720 } }
    try {
      let stream
      try {
        // exact = force the requested camera (many Android ignore plain facingMode on switch)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { ...base, facingMode: { exact: facingMode } }, audio: false,
        })
      } catch {
        // fallback: device has only one camera / exact unsupported
        stream = await navigator.mediaDevices.getUserMedia({
          video: { ...base, facingMode }, audio: false,
        })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setReady(true)
        setError('')
      }
      // labels/devices populate only after permission granted
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setMultiCam(devices.filter(d => d.kind === 'videoinput').length > 1)
      } catch { /* ignore */ }
    } catch (e) {
      setError('Camera unavailable: ' + e.message)
    }
  }

  useEffect(() => {
    startStream(facing)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  const flip = () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    setMirror(next === 'user') // front mirrored, back not — manual toggle can override after
    startStream(next)
  }

  const handleDoubleTap = (e) => {
    if (!multiCam) return // single camera (PC) — nothing to switch to
    e.preventDefault() // block browser double-tap zoom that swallows the gesture
    const now = Date.now()
    if (now - lastTapRef.current < 350) {
      flip()
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  const shoot = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (mirror) {
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
          {isFront ? 'Selfie' : 'Take a photo'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setMirror(m => !m)} style={{
            background: mirror ? 'rgba(255,255,255,0.18)' : 'none',
            border: 'none', cursor: 'pointer', borderRadius: 8,
            color: '#fff', fontSize: 20, padding: '4px 8px',
          }} title={mirror ? 'Mirror on' : 'Mirror off'}>🪞</button>
          {multiCam && (
            <button onClick={flip} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 22, padding: '4px 8px',
            }} title="Switch camera">🔄</button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
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
              transform: mirror ? 'scaleX(-1)' : 'none',
            }}
          />
        )}
        {ready && multiCam && (
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.45)', fontSize: 11, pointerEvents: 'none',
          }}>
            Double tap to switch camera
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
          title="Capture"
        />
      </div>
    </div>
  )
}
