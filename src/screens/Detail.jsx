import { useEffect, useRef, useState } from 'react'
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

const Chevron = ({ d }) => <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d={d < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>

// Con una lista (la teca de alguien) se puede deslizar a los costados para ver el anterior y el siguiente.
// La tarjeta queda siempre del mismo alto y la información se acomoda adentro.
export function Detail({ ctx, it, list, onClose }) {
  const [cur, setCur] = useState(it)
  const [editing, setEditing] = useState(null)
  const items = Array.isArray(list) && list.length > 1 ? list : null
  const idx = items ? items.findIndex((x) => x.id === cur.id) : -1
  const go = (d) => { if (!items) return; const n = items[idx + d]; if (n) setCur(n) }
  const nav = items && idx >= 0 ? { idx, total: items.length, prev: idx > 0 ? () => go(-1) : null, next: idx < items.length - 1 ? () => go(1) : null } : null
  const touch = useRef(null)
  const [slide, setSlide] = useState(0)
  const [anim, setAnim] = useState(false)
  const W = Math.min(window.innerWidth, 440)
  const onTouchStart = (e) => { if (anim) return; const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY, h: null } }
  const onTouchMove = (e) => {
    const s = touch.current; if (!s || !nav) return
    const t = e.touches[0], dx = t.clientX - s.x, dy = t.clientY - s.y
    if (s.h == null && Math.hypot(dx, dy) > 8) s.h = Math.abs(dx) > Math.abs(dy)
    if (!s.h) return
    const edge = (dx > 0 && !nav.prev) || (dx < 0 && !nav.next)
    setSlide(edge ? dx * .25 : dx)
  }
  const swap = (d) => {
    setAnim(true); setSlide(d > 0 ? -W : W)
    setTimeout(() => {
      d > 0 ? nav.next() : nav.prev()
      setAnim(false); setSlide(d > 0 ? W * .6 : -W * .6)
      requestAnimationFrame(() => requestAnimationFrame(() => { setAnim(true); setSlide(0); setTimeout(() => setAnim(false), 260) }))
    }, 200)
  }
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null
    if (!s?.h || !nav) { setSlide(0); return }
    const dx = e.changedTouches[0].clientX - s.x
    if (dx < -70 && nav.next) swap(1)
    else if (dx > 70 && nav.prev) swap(-1)
    else { setAnim(true); setSlide(0); setTimeout(() => setAnim(false), 260) }
  }
  const goArrow = (d) => (d > 0 ? nav?.next : nav?.prev) && !anim ? () => swap(d) : null
  if (editing) return <AddSheet ctx={ctx} edit={editing} onClose={() => { setEditing(null); onClose() }} />
  const arrow = (d, fn, label) => (
    <button aria-label={label} disabled={!fn} onClick={fn || undefined} style={{ width: 40, height: 32, border: 0, background: 'none', padding: 0, display: 'grid', placeItems: 'center', color: 'var(--ink)', opacity: fn ? 1 : .2, cursor: fn ? 'pointer' : 'default' }}><Chevron d={d} /></button>
  )
  return (
    <Sheet onClose={onClose} height={nav ? '76dvh' : undefined}>
      {nav && (
        <div className="between" style={{ margin: '-4px -8px 10px' }}>
          {arrow(-1, goArrow(-1), 'Anterior')}
          <span className="light">{nav.idx + 1} de {nav.total}</span>
          {arrow(1, goArrow(1), 'Siguiente')}
        </div>
      )}
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ minHeight: 'calc(100% - 90px)', transform: slide ? `translateX(${slide}px) rotate(${slide / 60}deg)` : undefined, opacity: 1 - Math.min(Math.abs(slide) / W, 1) * .7, transition: anim ? 'transform .22s cubic-bezier(.2,.8,.2,1), opacity .22s' : 'none', willChange: 'transform' }}>
        <DetailBody key={cur.id} ctx={ctx} it={cur} onClose={onClose} onEdit={setEditing} />
      </div>
    </Sheet>
  )
}

function DetailBody({ ctx, it, onClose, onEdit }) {
  const top = useRef(null)
  useEffect(() => { top.current?.closest('.sheet')?.scrollTo(0, 0) }, [])
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

  const meta = [current.kind === 'book' ? (current.format === 'ebook' ? 'ebook' : 'en papel') : current.seen_where === 'cine' ? 'en el cine' : current.platform ? `en ${current.platform}` : 'en casa', fmtDate(current.finished_at)]
  return (
    <div ref={top}>
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
      {!mine && !already && <div className="row" style={{ marginTop: 12, gap: 8 }}><button className="btn" onClick={() => { onClose(); setTimeout(() => ctx.openSheet({ t: 'add', prefill: current }), 50) }}>{current.kind === 'book' ? 'Ya lo leí' : 'Ya la vi'}</button><button className={`btn ${isSaved ? 'ink' : 'white'}`} onClick={toggleSave} aria-label={isSaved ? 'Sacar de guardados' : 'Guardar para después'} aria-pressed={isSaved} style={{ flex: 'none', width: 56, padding: 0 }}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ fill: isSaved ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' }}><path d="M7 4h10v16l-5-3.5L7 20z" /></svg></button></div>}
      {!mine && already && <p className="body muted" style={{ fontSize: 13, marginTop: 12 }}>✓ Ya está en tu {KINDS[current.kind].teca}teca.</p>}
      {others.length > 0 && (<>
        <div className="between" style={{ marginTop: 18 }}><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>Lo que dijeron tus amigos</span></div>
        {others.slice(0, 6).map((o) => { const p = o.user_id === ctx.uid ? ctx.profile : ctx.people[o.user_id]; return (
          <div key={o.id} className="row" style={{ alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <Avatar p={p} s={30} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="between"><b style={{ fontSize: 14 }}>{p?.name}</b><Stars n={o.stars || 0} s={11} /></div>{o.review && <div style={{ marginTop: 3 }}><Review text={o.review} lines={2} size={14} /></div>}</div>
          </div>) })}
      </>)}
      {mine && <div style={{ marginTop: 16, textAlign: 'center', fontWeight: 300, fontSize: 13 }}><button className="linkbtn" style={{ fontWeight: 300 }} onClick={() => onEdit(current)}>Editar</button> · <button className="linkbtn" style={{ fontWeight: 300 }} onClick={del}>Borrar</button></div>}
    </div>
  )
}
