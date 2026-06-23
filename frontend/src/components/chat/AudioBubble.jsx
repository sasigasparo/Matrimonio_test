import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import Waveform from './Waveform'

export default function AudioBubble({ src, outgoing }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const ref = useRef(null)
  const durKnown = useRef(false)

  const toggle = () => {
    if (!ref.current) return
    if (playing) { ref.current.pause(); setPlaying(false) }
    else { ref.current.play(); setPlaying(true) }
  }
  const fmt = s => isFinite(s) && s >= 0
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    : '--:--'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%', minWidth: 200, flex: 1,
    }}>
      <audio
        ref={ref} src={src} preload="metadata"
        onEnded={() => { setPlaying(false); setProgress(0) }}
        onTimeUpdate={e => setProgress(e.target.currentTime / (e.target.duration || 1))}
        onLoadedMetadata={e => {
          const audio = e.target
          if (!isFinite(audio.duration) || audio.duration === 0) {
            audio.currentTime = 1e101
          } else {
            durKnown.current = true
            setDuration(audio.duration)
          }
        }}
        onSeeked={e => {
          const audio = e.target
          if (!durKnown.current) {
            durKnown.current = true
            setDuration(audio.duration)
            audio.currentTime = 0
          }
        }}
      />
      <button
        onClick={toggle}
        style={{
          width: 34, height: 34, borderRadius: '50%', border: 'none',
          background: outgoing ? 'rgba(199,107,139,0.85)' : 'var(--rose)',
          color: '#fff', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(199,107,139,0.35)',
        }}
        aria-label={playing ? 'Pausa' : 'Riproduci'}
      >
        {playing ? <Pause size={15} fill="#fff" /> : <Play size={15} fill="#fff" style={{ marginLeft: 1 }} />}
      </button>
      <Waveform
        progress={progress}
        color={'var(--rose-deep)'}
        dimColor={outgoing ? 'rgba(166,61,99,0.30)' : 'rgba(199,107,139,0.28)'}
      />
      <span style={{ fontSize: 10.5, color: 'var(--warm-gray)', flexShrink: 0, minWidth: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(duration * progress)} / {fmt(duration)}
      </span>
    </div>
  )
}
