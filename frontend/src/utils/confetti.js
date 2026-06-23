/*
 * Dependency-free soft confetti burst. Romantic palette, gentle gravity.
 * No-ops when the user prefers reduced motion.
 */
const COLORS = ['#C76B8B', '#FBCBDD', '#FBDCE6', '#C9A36A', '#FFFFFF', '#A63D63']

export function burstConfetti({ count = 90, duration = 2600 } = {}) {
  if (typeof window === 'undefined') return
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '60',
  })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // Two emitters near the bottom corners, firing upward and inward.
  const parts = Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0
    const angle = (fromLeft ? -1 : 1) * (Math.PI / 3.4) + (Math.random() - 0.5) * 0.7 - Math.PI / 2
    const speed = 8 + Math.random() * 9
    return {
      x: fromLeft ? W * 0.12 : W * 0.88,
      y: H * 0.92,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }
  })

  const start = performance.now()
  function frame(now) {
    const elapsed = now - start
    ctx.clearRect(0, 0, W, H)
    for (const p of parts) {
      p.vy += 0.22          // gravity
      p.vx *= 0.99          // air drag
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      const lifeLeft = Math.max(0, 1 - elapsed / duration)
      ctx.save()
      ctx.globalAlpha = lifeLeft
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
      ctx.restore()
    }
    if (elapsed < duration) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}
