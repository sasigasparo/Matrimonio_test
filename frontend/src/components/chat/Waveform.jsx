import { useRef } from 'react'

export default function Waveform({ progress = 0, bars = 20, color = '#fff', dimColor = 'rgba(255,255,255,0.35)' }) {
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
