import { useRef, useState } from 'react'
import { toggleSave as saveIt } from '../save.js'
import { sb } from '../supabase.js'
import { Avatar, Cover, Sheet, Stars } from '../ui.jsx'
import { KINDS, fmtDate, genreLabels } from '../lib.js'
import { AddSheet } from './Add.jsx'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

export function Review({ text, lines = 4, size = 15 }) {
  const [open, setOpen] = useState(false)
  const long = text.length > lines * 42
  return (<>
    <div className="clamp" style={{ fontWeight: 300, fontSize: size, lineHeight: 1.45, WebkitLineClamp: open ? 'unset' : lines }}>{text}</div>
    {long && <button className="linkbtn" style={{ marginTop: 4, fontSize: 13, textDecoration: 'none' }} onClick={() => setOpen(!open)}>{open ? 'Leer menos' : 'Leer más'}</button>}
  </>)
}

// Con una lista (la teca de alguien) se puede deslizar a los costados para ver el anterior y el siguiente
export function Detail({ ctx, it, list, onClose }) {
  const [cur, setCur] = useState(it)
  const items = Array.isArray(list) && list.length > 1 ? list : null
  const idx = items ? items.findIndex((x) => x.id === cur.id) : -1
  const go = (d) => { if (!items) return; const n = items[idx + d]; if (n) setCur(n) }
  const nav = items && idx >= 0 ? { idx, total: items.length, prev: idx > 0 ? () => go(-1) : null, next: idx < items.length - 1 ? () => go(1) : null } : null
  return <DetailBody key={cur.id} ctx={ctx} it={cur} nav={nav} onClose={onClose} />
}

function DetailBody({ ctx, it, nav, onClose }) {
  const touch = useRef(null)
  const [slide, setSlide] = useState(0)
  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, h: null } }
  const onTouchMove = (e) => {
    const s = touch.current; if (!s || !nav) return
    const t = e.touches[0], dx = t.clientX - s.x, dy = t.clientY - s.y
    if (s.h == null && Math.hypot(dx, dy) > 8) s.h = Math.abs(dx) > Math.abs(dy)
    if (s.h) setSlide(Math.max(-90, Math.min(90, dx * .6)))
  }
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null; setSlide(0)
    if (!s?.h || !nav) return
    const dx = e.changedTouches[0].clientX - s.x
    if (dx < -60 && nav.next) nav.next()
    else if (dx > 60 && nav.prev) nav.prev()
  }
  const [editing, setEditing] = useState(false)
  const mine = it.user_id === ctx.uid
  const owner = mine ? ctx.profile : ctx.people[it.user_id]
  const current = mine ? ctx.items.find((x) => x.id === it.id) || it : it
  const others = [...ctx.feed, ...(mine ? [] : ctx.items)].filter((x) => x.id !== it.id && x.kind === it.kind && norm(x.title) === norm(it.title))
  const isSaved = ctx.saved.some((s) => s.id === it.id)
  const already = ctx.items.some((m) => m.kind === it.kind && norm(m.title) === norm(it.title))

  async function del() {
    if (!confirm(`¿Borrar ${current.title} de tu ${KINDS[current.kind].teca}teca?`)) return
    const { error } = await sb.from('items').delete().eq('id', it.id)
    if (error) return ctx.say('No se pudo borrar')
    ctx.setItems((xs) => xs.filter((x) => x.id !== it.id)); onClose(); ctx.say('Borrado')
  }
  const toggleSave = () => saveIt(ctx, it)

  if (editing) return <AddSheet ctx={ctx} edit={current} onClose={() => { setEditing(false); onClose() }} />
  const meta = [current.kind === 'book' ? (current.format === 'ebook' ? 'ebook' : 'en papel') : current.seen_where === 'cine' ? 'en el cine' : current.platform ? `en ${current.platform}` : 'en casa', fmtDate(current.finished_at)]
  return (
    <Sheet onClose={onClose}>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ transform: slide ? `translateX(${slide}px)` : undefined, transition: slide ? 'none' : 'transform .2s ease' }}>
      {nav && (
        <div className="between" style={{ marginTop: -6, marginBottom: 2 }}>
          <button className="iconbtn" aria-label="Anterior" disabled={!nav.prev} onClick={nav.prev || undefined} style={{ width: 34, height: 34, opacity: nav.prev ? 1 : .25, fontSize: 20, fontWeight: 800 }}>‹</button>
          <span className="light">{nav.idx + 1} de {nav.total} · deslizá</span>
          <button className="iconbtn" aria-label="Siguiente" disabled={!nav.next} onClick={nav.next || undefined} style={{ width: 34, height: 34, opacity: nav.next ? 1 : .25, fontSize: 20, fontWeight: 800 }}>›</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 18px' }}><div style={{ transform: 'rotate(-3deg)' }}><Cover it={current} w={108} /></div></div>
      <h2 className="h" style={{ fontSize: 32 }}>{current.title}</h2>
      <div className="between" style={{ marginTop: 8 }}><span className="light">{[current.creator, current.year].filter(Boolean).join(' · ')}</span><Stars n={current.stars || 0} s={17} /></div>
      <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>{genreLabels(current.genre).map((g) => <span key={g} className="chip">{g}</span>)}<span className="chip">{meta.join(' · ')}</span></div>
      {current.review && (
        <div className="card" style={{ marginTop: 14 }}>
          <button className="row" disabled={mine || !owner} onClick={() => { onClose(); ctx.go('friend', { person: owner }) }} style={{ gap: 8, border: 0, background: 'none', padding: 0, color: 'inherit', cursor: mine ? 'default' : 'pointer' }}><Avatar p={owner} s={22} /><span className="light">{mine ? 'Tu reseña' : `La reseña de ${owner?.name || ''}`}</span></button>
          <div style={{ marginTop: 8 }}><Review text={current.review} /></div>
        </div>
      )}
      {!mine && !already && <div className="row" style={{ marginTop: 12, gap: 8 }}><button className="btn" onClick={() => { onClose(); setTimeout(() => ctx.openSheet({ t: 'add', prefill: current }), 50) }}>{current.kind === 'book' ? 'Ya lo leí' : 'Ya la vi'}</button><button className={`btn ${isSaved ? 'ink' : 'white'}`} onClick={toggleSave}>{isSaved ? 'Guardada' : 'Para después'}</button></div>}
      {!mine && already && <p className="body muted" style={{ fontSize: 13, marginTop: 12 }}>✓ Ya está en tu {KINDS[current.kind].teca}teca.</p>}
      {others.length > 0 && (<>
        <div className="between" style={{ marginTop: 18 }}><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>Lo que dijeron tus amigos</span></div>
        {others.slice(0, 6).map((o) => { const p = o.user_id === ctx.uid ? ctx.profile : ctx.people[o.user_id]; return (
          <div key={o.id} className="row" style={{ alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <Avatar p={p} s={30} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="between"><b style={{ fontSize: 14 }}>{p?.name}</b><Stars n={o.stars || 0} s={11} /></div>{o.review && <div style={{ marginTop: 3 }}><Review text={o.review} lines={2} size={14} /></div>}</div>
          </div>) })}
      </>)}
      {mine && <div style={{ marginTop: 16, textAlign: 'center', fontWeight: 300, fontSize: 13 }}><button className="linkbtn" style={{ fontWeight: 300 }} onClick={() => setEditing(true)}>Editar</button> · <button className="linkbtn" style={{ fontWeight: 300 }} onClick={del}>Borrar</button></div>}
      </div>
    </Sheet>
  )
}
