// Efectos: vibración corta y confeti con los colores de teca.
// La vibración no funciona en iPhone desde la web; queda lista para la app nativa.
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
export const buzz = (p = 15) => { try { navigator.vibrate?.(p) } catch {} }

const COLORS = ['#E6F04A', '#A9C6F2', '#141210', '#FFFFFF', '#E3EDFB']
export function confetti(x = innerWidth / 2, y = innerHeight * 0.42) {
  if (reduced() || !document.body.animate) return
  for (let i = 0; i < 46; i++) {
    const e = document.createElement('div')
    const k = Math.random(), s = 8 + Math.random() * 10
    const shape = k < 0.4 ? [s * 0.6, s * 1.5, '2px'] : k < 0.7 ? [s, s, '50%'] : [s * 1.4, s * 0.6, '99px']
    e.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${shape[0]}px;height:${shape[1]}px;border-radius:${shape[2]};background:${COLORS[i % 5]};box-shadow:inset 0 0 0 1.5px #141210;pointer-events:none;z-index:9999;will-change:transform,opacity`
    document.body.appendChild(e)
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 140 + Math.random() * 190
    const dx = Math.cos(a) * v, dy = Math.sin(a) * v, r = (Math.random() - 0.5) * 720
    e.animate([
      { transform: 'translate(-50%,0) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * 0.6}px,${dy}px) rotate(${r * 0.5}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px,${dy + 330}px) rotate(${r}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).onfinish = () => e.remove()
  }
}
