import { useEffect, useRef } from 'react'

// Capa de polvo sobre el estante. En modo limpiar, se borra deslizando el dedo.
export function Dust({ level, cleaning, onCleaned }) {
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const c = ref.current; if (!c || !level) return
    done.current = false
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
    c.width = r.width * dpr; c.height = r.height * dpr
    const g = c.getContext('2d'); g.scale(dpr, dpr)
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    g.fillStyle = `rgba(196, 186, 168, ${[0, .28, .42, .55][level]})`; g.fillRect(0, 0, r.width, r.height)
    const n = Math.round(r.width * r.height / [1, 260, 150, 90][level])
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgba(${110 + rnd() * 40}, ${100 + rnd() * 35}, ${85 + rnd() * 30}, ${.25 + rnd() * .45})`
      g.beginPath(); g.arc(rnd() * r.width, rnd() * r.height, .4 + rnd() * 1.4, 0, 7); g.fill()
    }
    if (level >= 3) { // telarañas en las esquinas
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1
      for (const [x, y, sx, sy] of [[0, 0, 1, 1], [r.width, 0, -1, 1]]) {
        for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + sx * Math.cos(t) * 70, y + sy * Math.sin(t) * 70); g.stroke() }
        for (let k = 1; k <= 4; k++) { g.beginPath(); for (let a = 0; a <= 6; a++) { const t = (a / 6) * Math.PI / 2, rr = k * 16 + (a % 2) * 3; const px = x + sx * Math.cos(t) * rr, py = y + sy * Math.sin(t) * rr; a ? g.lineTo(px, py) : g.moveTo(px, py) } g.stroke() }
      }
    }
  }, [level])

  useEffect(() => {
    const c = ref.current; if (!c || !cleaning) return
    const g = c.getContext('2d'); let last = null, moves = 0
    const pt = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const check = () => {
      const { width: w, height: h } = c, img = g.getImageData(0, 0, w, h).data
      let left = 0, total = 0
      for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) { total++; if (img[(y * w + x) * 4 + 3] > 25) left++ }
      if (left / total < 0.12 && !done.current) { done.current = true; g.clearRect(0, 0, w, h); onCleaned?.() }
    }
    const down = (e) => { last = pt(e); c.setPointerCapture(e.pointerId) }
    const move = (e) => {
      if (!last) return
      const p = pt(e), dpr = window.devicePixelRatio || 1
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineWidth = 56 * dpr
      g.beginPath(); g.moveTo(last[0] * dpr, last[1] * dpr); g.lineTo(p[0] * dpr, p[1] * dpr); g.stroke(); g.restore()
      last = p; if (++moves % 8 === 0) check()
    }
    const up = () => { last = null; check() }
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up)
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up) }
  }, [cleaning])

  if (!level) return null
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 6, pointerEvents: cleaning ? 'auto' : 'none', touchAction: cleaning ? 'none' : 'auto', zIndex: 5, cursor: cleaning ? 'grab' : 'default' }} />
}
