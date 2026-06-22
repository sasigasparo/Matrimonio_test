import { useState, useRef } from 'react'
import Waveform from './Waveform'

export default function AudioBubble({ src, outgoing }) {
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
