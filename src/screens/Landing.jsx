import { useEffect, useRef, useState } from 'react'
import celu from '../landing/celu.html?raw'
import compu from '../landing/compu.html?raw'

const W = { celu: 390, compu: 1440 }
const words = ['biblio', 'filmo', 'video']
const toasts = [['Sofi guardó Harry Potter en tu biblioteca', '+2 tecoins', 0, 0], ['Juli ya vio Interestelar', '', 1, 1], ['Mica terminó The Bear, temporada 3', 'En tu videoteca · +20 tecoins', 0, 0]]

function vals(t, celu) {
  const i = Math.floor(t / 22) % 3, ph = t % 22, inT = ph > 3 && ph < 20
  const v = { word: words[i], coins: 180 + (Math.floor(t / 22) % 9) * 20, toast: toasts[i][0], toastSub: toasts[i][1], subD: toasts[i][1] ? 'block' : 'none', starsD: toasts[i][2] ? 'block' : 'none', btnD: toasts[i][3] ? 'flex' : 'none', toastOp: inT ? 1 : 0, toastY: inT ? 0 : 14, toastX: celu ? (i === 1 ? -24 : 104) : (i === 1 ? -120 : 210) }
  ;[0, 1, 2].forEach((n) => { v['op' + n] = n === i ? 1 : 0; v['op' + n + 'Y'] = n === i ? 0 : 18; v['tab' + n] = n === i ? '#141210' : '#E3EDFB'; v['tabc' + n] = n === i ? '#E6F04A' : '#141210' })
  return v
}

export default function Landing({ onEnter }) {
  const [vw, setVw] = useState(window.innerWidth)
  const box = useRef(null)
  const kind = vw < 760 ? 'celu' : 'compu'
  const scale = kind === 'celu' ? vw / W.celu : Math.min(vw / W.compu, 1.15)

  useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  useEffect(() => { document.title = 'teca · Tu biblioteca de bolsillo' }, [])

  useEffect(() => {
    const root = box.current
    root.innerHTML = kind === 'celu' ? celu : compu
    const sNodes = [...root.querySelectorAll('[data-s]')], tNodes = [...root.querySelectorAll('[data-t]')]
    const fill = (str, v) => str.replace(/\[\[(\w+)\]\]/g, (_, k) => v[k])
    let t = 0
    const tick = () => { const v = vals(t++, kind === 'celu'); sNodes.forEach((n) => { n.style.cssText = fill(n.dataset.s, v) }); tNodes.forEach((n) => { const x = String(v[n.dataset.t]); if (n.textContent !== x) n.textContent = x }) }
    tick(); const id = setInterval(tick, 100)
    root.querySelectorAll('[data-act]').forEach((n) => { n.style.cursor = 'pointer' })
    const qr = root.querySelector('[data-qr]')
    if (qr) import('qrcode').then((Q) => Q.toString(location.origin, { type: 'svg', margin: 1, color: { dark: '#141210', light: '#ffffff' } })).then((svg) => { qr.style.background = '#fff'; qr.style.overflow = 'hidden'; qr.innerHTML = svg.replace('<svg', '<svg style="width:100%;height:100%;display:block;border-radius:12px"') })
    return () => clearInterval(id)
  }, [kind])

  const click = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act
    if (!a) return
    if (a === 'up' || a === 'in') onEnter(a)
    else if (a === 'priv') location.href = '/privacidad'
    else {
      const txt = a === 'how' ? 'Así de simple.' : 'Hacela'
      const el = [...box.current.querySelectorAll('div')].find((d) => d.children.length < 3 && d.textContent.trim().startsWith(txt))
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 30, behavior: 'smooth' })
    }
  }

  const h = kind === 'celu' ? 2640 : 2560
  return (
    <div style={{ width: '100%', height: h * scale, overflow: 'hidden', background: '#fff', display: 'flex', justifyContent: 'center' }}>
      <div ref={box} onClick={click} style={{ width: W[kind], height: h, flex: 'none', transform: `scale(${scale})`, transformOrigin: 'top center' }} />
    </div>
  )
}
