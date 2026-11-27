import { useEffect, useRef, useState } from 'react'
import { KINDS, paletteFor, spineSize, PPC } from './lib.js'

const P = {
  lib: <path d="M4 4h4v16H4zM10 4h4v16h-4zM16.2 5.2l3.6-1 3 14.8-3.6 1z" />,
  friends: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" /><circle cx="17" cy="9" r="2.5" /><path d="M16.5 14.3c2.4.1 4 1.7 4.5 4.6" /></>,
  clubs: <path d="M4 5.5h16v10H10l-4.5 3.5v-3.5H4z" />,
  rank: <path d="M5 20V12M12 20V5M19 20v-6" />,
  me: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.8-3.8 3.6-5.8 7-5.8s6.2 2 7 5.8" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  book: <><path d="M3 6c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5v12c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5z" /><path d="M12 6.5v12" /></>,
  clap: <><path d="M4 10h16v9H4z" /><path d="M3.5 6.5l15-3 .8 3.6-15 3z" /><path d="M8 5.6l1.5 3M12 4.8l1.5 3" /></>,
  tv: <><path d="M4 8h16v11H4z" /><path d="M12 8 8.5 4M12 8l3.5-4" /></>,
  gear: <><path d="M10.3 4.3c.4-1.8 2.9-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.4 1.8 2.9 0 3.4a1.7 1.7 0 0 0-1 2.6c.9 1.5-.8 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.8-2.9 1.8-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.8-.4-1.8-2.9 0-3.4a1.7 1.7 0 0 0 1-2.5c-.9-1.6.8-3.3 2.4-2.4 1 .6 2.3.1 2.6-1.1z" /><circle cx="12" cy="12" r="3" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  bookmark: <path d="M7 4h10v16l-5-3.5L7 20z" />,
  photo: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4 4 3 3-2 4 3" /></>,
  camera: <><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.4" /></>,
  share: <><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M5 13v6h14v-6" /></>,
  plussq: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8.5v7M8.5 12h7" /></>,
  dots: <><circle cx="12" cy="5.5" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="12" cy="18.5" r="1.3" /></>,
  install: <><path d="M12 4v10M7.5 9.5 12 14l4.5-4.5" /><path d="M5 17v3h14v-3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
}
export function Icon({ n, s = 21, c = 'currentColor', w = 1.9 }) {
  return <svg aria-hidden="true" width={s} height={s} viewBox="0 0 24 24" style={{ fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', flex: 'none' }}>{P[n]}</svg>
}

export function Coin({ s = 18, ring = '#141210' }) {
  return (
    <svg role="img" aria-label="tecoins" width={s} height={s} viewBox="0 0 24 24" style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="10.6" fill="#E6F04A" stroke={ring} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="#141210" strokeWidth=".7" opacity=".45" />
      <path d="M13.5 5.6 11.3 15.1c-.35 1.6.3 2.5 1.6 2.5 1 0 1.8-.6 2.5-1.5M8.9 9.5h6.7" fill="none" stroke="#141210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export const CoinPill = ({ n, onClick }) => <button className="coins" onClick={onClick} aria-label={`${n} tecoins`}><Coin s={19} ring="#E6F04A" />{n}</button>

export const Teca = ({ pre }) => <>{pre}<span className="teca">teca</span></>

export function Avatar({ p, s = 40, dot }) {
  if (!p) return <div className="avatar" style={{ width: s, height: s, background: '#EEE' }} />
  return (
    <div className="avatar" style={{ width: s, height: s, background: p.color || '#F3D9CF', fontSize: Math.round(s * .56) }}>
      {p.avatar_url ? <img src={p.avatar_url} alt="" /> : p.emoji ? <span style={{ fontStyle: 'normal', fontSize: Math.round(s * .5) }}>{p.emoji}</span> : <span className="l">{(p.name || p.username || '?')[0].toLowerCase()}</span>}
      {dot && <span style={{ position: 'absolute', top: -1, right: -1, width: Math.max(11, s * .26), height: Math.max(11, s * .26), borderRadius: '50%', background: '#E6F04A', boxShadow: '0 0 0 2px #141210, 0 0 0 4px #fff' }} />}
    </div>
  )
}

// Estrellas con medias: tocás la mitad izquierda de una estrella para media, la derecha para entera
export function Stars({ n = 0, s = 14, onChange }) {
  n = Number(n) || 0
  const star = (i) => {
    const fill = n >= i ? 1 : n >= i - 0.5 ? 0.5 : 0
    return (
      <span key={i} style={{ position: 'relative', display: 'inline-block', fontSize: s, lineHeight: 1, color: '#D9D6CF' }}>
        ★
        {fill > 0 && <span style={{ position: 'absolute', left: 0, top: 0, width: fill === 1 ? '100%' : '50%', overflow: 'hidden', color: '#F5B62A' }}>★</span>}
        {onChange && <>
          <button type="button" aria-label={`${i - 0.5} estrellas`} onClick={() => onChange(n === i - 0.5 ? 0 : i - 0.5)} style={{ position: 'absolute', left: 0, top: -4, width: '50%', height: 'calc(100% + 8px)', border: 0, background: 'transparent', padding: 0 }} />
          <button type="button" aria-label={`${i} estrellas`} onClick={() => onChange(n === i ? 0 : i)} style={{ position: 'absolute', right: 0, top: -4, width: '50%', height: 'calc(100% + 8px)', border: 0, background: 'transparent', padding: 0 }} />
        </>}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: onChange ? 4 : 1 }} aria-label={`${String(n).replace('.', ',')} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(star)}
      {onChange && n > 0 && <span style={{ marginLeft: 8, fontWeight: 800, fontSize: Math.round(s * .55) }}>{String(n).replace('.', ',')}</span>}
    </span>
  )
}

export const AsteriskMark = () => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E6F04A" stroke="#141210" strokeWidth="1.5" /><path d="M12 5.8v12.4M6.6 8.9l10.8 6.2M6.6 15.1l10.8-6.2" stroke="#141210" strokeWidth="2" strokeLinecap="round" /></svg>
)

export function Cover({ it, w = 72 }) {
  const h = Math.round(w * 1.5)
  const [bg, fg] = paletteFor(it.title)
  const [broken, setBroken] = useState(false)
  if (it.cover_url && !broken) return <img src={it.cover_url} alt={`Tapa de ${it.title}`} onError={() => setBroken(true)} style={{ width: w, height: h, objectFit: 'cover', borderRadius: 3, flex: 'none', boxShadow: '0 6px 14px -8px rgba(0,0,0,.45)', background: bg }} />
  return (
    <div role="img" aria-label={`Tapa de ${it.title}`} style={{ width: w, height: h, flex: 'none', borderRadius: 3, background: bg, color: fg, padding: w * .1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 6px 14px -8px rgba(0,0,0,.45)', overflow: 'hidden' }}>
      <div style={{ fontWeight: 800, fontSize: Math.max(9, w * .15), lineHeight: .95, letterSpacing: '-0.03em' }}>{it.title}</div>
      <div style={{ fontWeight: 300, fontSize: Math.max(6, w * .09), textTransform: 'uppercase', letterSpacing: '.1em' }}>{it.creator}</div>
    </div>
  )
}

export function Spine({ it, isNew, onClick }) {
  const { hcm, wcm } = spineSize(it)
  const [bg, fg] = paletteFor(it.title)
  const real = it.cover_url
  const st = real
    ? { width: Math.round(wcm * PPC * 2.2), height: Math.round(hcm * PPC), backgroundColor: bg, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.12) 40%, rgba(0,0,0,.3)), url("${real}")`, backgroundSize: 'auto 100%', backgroundPosition: '6% center', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.7)' }
    : { width: Math.round(wcm * PPC * 2.2), height: Math.round(hcm * PPC), background: bg, color: fg }
  return (
    <div style={{ position: 'relative', flex: 'none', transformOrigin: 'bottom center', transform: it.tilt ? `rotate(${it.tilt}deg)` : undefined, margin: it.tilt ? '0 6px' : undefined }}>
      <button className={`spine ${it.kind}`} style={st} onClick={onClick} aria-label={it.title}><span>{it.title}</span></button>
      {isNew && <span className="newmark"><AsteriskMark /></span>}
    </div>
  )
}

const Plant = () => (
  <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 41, height: 64, marginLeft: 'auto' }}>
    <div style={{ position: 'absolute', left: 6, bottom: 0, width: 29, height: 25, background: '#C9633B', borderRadius: '3px 3px 8px 8px' }} />
    <div style={{ position: 'absolute', left: 3, bottom: 21, width: 18, height: 28, background: '#1F6A3A', borderRadius: '50% 0 50% 0', transform: 'rotate(-20deg)' }} />
    <div style={{ position: 'absolute', left: 18, bottom: 24, width: 18, height: 32, background: '#2E8A4E', borderRadius: '0 50% 0 50%', transform: 'rotate(18deg)' }} />
    <div style={{ position: 'absolute', left: 12, bottom: 28, width: 14, height: 34, background: '#3A9A58', borderRadius: '50% 50% 0 50%', transform: 'rotate(-4deg)' }} />
  </div>
)
const Mug = () => (
  <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 32, height: 31, marginLeft: 'auto' }}>
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: 24, height: 28, background: '#fff', border: '1.5px solid #141210', borderRadius: '3px 3px 6px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="serif" style={{ fontSize: 9 }}>teca</span></div>
    <div style={{ position: 'absolute', right: 0, bottom: 7, width: 10, height: 13, border: '1.5px solid #141210', borderLeft: 0, borderRadius: '0 6px 6px 0' }} />
  </div>
)

// Arma las filas del estante según el ancho disponible
export function Shelf({ items, kind, width, onOpen, onAdd }) {
  const inner = width - 20
  const rows = []
  let cur = [], used = 0
  const newestId = items.length ? [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].id : null
  for (const it of items) {
    const w = Math.round(spineSize(it).wcm * PPC * 2.2) + 1 + (it.tilt ? 12 : 0)
    if (used + w > inner - 46 && cur.length) { rows.push(cur); cur = []; used = 0 }
    cur.push(it); used += w
  }
  if (cur.length) rows.push(cur)
  while (rows.length < 3) rows.push([])
  const k = { book: 0, movie: 1, show: 2 }[kind]
  return (
    <div className={`case k${k}`} style={{ width }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div className="shelfrow" style={{ minHeight: r.length ? 0 : 108 }}>
            {r.map((it) => <Spine key={it.id} it={it} isNew={it.id === newestId} onClick={() => onOpen(it)} />)}
            {!items.length && i === 0 && <button className="emptyslot" onClick={onAdd} aria-label="Cargar el primero">+</button>}
            {i === 0 && <Plant />}
            {i === 2 && <Mug />}
          </div>
          <div className="plank" />
        </div>
      ))}
    </div>
  )
}

export function Sheet({ onClose, children, height, headerOnly }) {
  useEffect(() => { const f = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [onClose])
  // Deslizar para abajo cierra (desde arriba de todo de la tarjeta)
  const ref = useRef(null)
  const drag = useRef(null)
  const [dy, setDy] = useState(0)
  const [closing, setClosing] = useState(false)
  const start = (e) => {
    const t = e.touches[0]
    const el = ref.current
    const inHeader = t.clientY - el.getBoundingClientRect().top < 48
    drag.current = { y: t.clientY, x: t.clientX, ok: inHeader || (!headerOnly && el.scrollTop <= 0), axis: null }
  }
  const move = (e) => {
    const d = drag.current; if (!d || !d.ok) return
    const t = e.touches[0], ddy = t.clientY - d.y, ddx = t.clientX - d.x
    if (d.axis == null && Math.hypot(ddx, ddy) > 8) d.axis = Math.abs(ddy) > Math.abs(ddx) && ddy > 0 ? 'y' : 'x'
    if (d.axis === 'y') { d.dy = Math.max(0, ddy); setDy(d.dy); if (e.cancelable) e.preventDefault() }
  }
  const end = () => {
    const d = drag.current; drag.current = null
    if (d?.axis === 'y' && (d.dy || 0) > 110) { setClosing(true); setTimeout(onClose, 180) }
    else setDy(0)
  }
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.addEventListener('touchmove', move, { passive: false })
    return () => el.removeEventListener('touchmove', move)
  })
  const style = { ...(height ? { height, maxHeight: height } : {}), transform: closing ? 'translate(-50%, 100%)' : dy ? `translate(-50%, ${dy}px)` : undefined, transition: drag.current?.axis === 'y' ? 'none' : 'transform .2s ease' }
  return (<>
    <div className="scrim" onClick={onClose} style={{ opacity: closing ? 0 : 1 - Math.min(dy / 400, .6), transition: 'opacity .2s' }} />
    <div ref={ref} className="sheet" role="dialog" aria-modal="true" style={style} onTouchStart={start} onTouchEnd={end} onTouchCancel={end}>
      <div style={{ position: 'relative', height: 30, marginBottom: 8 }}>
        <div className="grab" style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', margin: 0 }} />
        <button onClick={onClose} aria-label="Cerrar" className="iconbtn" style={{ position: 'absolute', right: -6, top: -2, width: 34, height: 34 }}><Icon n="x" s={16} w={2.2} /></button>
      </div>
      {children}
    </div>
  </>)
}

export function Back({ title, onBack, right }) {
  return (
    <div className="back">
      <button className="iconbtn dark" onClick={onBack} aria-label="Volver"><Icon n="back" s={18} c="#fff" w={2.2} /></button>
      <div className="title">{title}</div>{right}
    </div>
  )
}

export function Nav({ tab, go, onAdd, dots = {} }) {
  const T = [['lib', 'Mi teca'], ['friends', 'Amigos'], ['clubs', 'Clubes'], ['rank', 'Ranking'], ['me', 'Perfil']]
  return (<>
    <div className="fade" />
    <nav className="nav">
      <div className="pill">{T.map(([k, l]) => <button key={k} data-tour={k} className={tab === k ? 'on' : ''} onClick={() => go(k)} aria-label={l}><Icon n={k} />{dots[k] && <span className="ndot" />}</button>)}</div>
      <button className="add" data-tour="add" onClick={onAdd} aria-label="Cargar"><Icon n="plus" s={26} w={2.2} /></button>
    </nav>
  </>)
}

export function useWidth() {
  const get = () => Math.min(window.innerWidth, 440) - 40
  const [w, setW] = useState(get())
  useEffect(() => { const f = () => setW(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  return w
}

export function Toast({ msg }) { return msg ? <div className="toast" role="status">{msg}</div> : null }
