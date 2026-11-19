import { useRef, useState } from 'react'
import { paletteFor, spineSize, PPC } from './lib.js'
import { AsteriskMark } from './ui.jsx'
import { DecoArt, SHELF_STYLES, decoSize } from './decos.jsx'
import { Dust } from './dust.jsx'

const decoW = (kind) => Math.round(decoSize(kind).w)
const spineW = (it) => Math.round(spineSize(it).wcm * PPC * 2.2)
const spineH = (it) => Math.round(spineSize(it).hcm * PPC)

// Junta títulos y decoraciones de una teca en un solo orden
export function buildEntries(items, decos, kind) {
  const list = [
    ...items.filter((i) => i.kind === kind).map((i) => ({ eid: 'i:' + i.id, type: 'item', ref: i })),
    ...decos.filter((d) => d.teca === kind).map((d) => ({ eid: 'd:' + d.id, type: 'deco', ref: d })),
  ]
  return list.sort((a, b) => (a.ref.position ?? 1e12) - (b.ref.position ?? 1e12) || new Date(a.ref.created_at) - new Date(b.ref.created_at))
}

function toBlocks(entries) {
  const blocks = []
  for (const e of entries) {
    const last = blocks[blocks.length - 1]
    if (e.type === 'item' && e.ref.lying) {
      if (last?.type === 'pile' && last.entries.length < 5 && !last.top) last.entries.push(e)
      else blocks.push({ type: 'pile', entries: [e] })
    } else if (e.type === 'deco' && e.ref.stacked && last?.type === 'pile' && !last.top) last.top = e
    else blocks.push({ type: 'one', entries: [e] })
  }
  return blocks
}
function blockWidth(b) {
  if (b.type === 'pile') return Math.max(...b.entries.map((e) => spineH(e.ref)), b.top ? decoW(b.top.ref.kind) : 0) + 6
  const e = b.entries[0]
  if (e.type === 'deco') return decoW(e.ref.kind) + 6
  return spineW(e.ref) + 1 + (e.ref.tilt ? 12 : 0)
}

function Standing({ it, isNew }) {
  const [bg, fg] = paletteFor(it.title)
  const st = it.cover_url
    ? { backgroundColor: bg, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.28), rgba(0,0,0,.12) 40%, rgba(0,0,0,.3)), url("${it.cover_url}")`, backgroundSize: 'auto 100%', backgroundPosition: '6% center', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.7)' }
    : { background: bg, color: fg }
  return (
    <div style={{ position: 'relative', transformOrigin: 'bottom center', transform: it.tilt ? `rotate(${it.tilt}deg)` : undefined, margin: it.tilt ? '0 6px' : undefined }}>
      <div className={`spine ${it.kind}`} style={{ width: spineW(it), height: spineH(it), ...st }}><span>{it.title}</span></div>
      {isNew && <span className="newmark"><AsteriskMark /></span>}
    </div>
  )
}
function Lying({ it }) {
  const [bg, fg] = paletteFor(it.title)
  const h = Math.min(26, Math.max(12, spineW(it)))
  const st = it.cover_url
    ? { backgroundColor: bg, backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url("${it.cover_url}")`, backgroundSize: '100% auto', backgroundPosition: 'center 8%', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.7)' }
    : { background: bg, color: fg }
  return <div className="lying" style={{ width: spineH(it), height: h, ...st }}><span>{it.title}</span></div>
}

export function Shelf({ entries, kind, width, styleName = 'madera', editing, selected, onOpen, onSelect, onLongPress, onReorder, onAdd, onDecoTap, dust = 0, cleaning, onCleaned }) {
  const inner = width - 20
  const blocks = toBlocks(entries)
  const rows = []
  let cur = [], used = 0
  for (const b of blocks) {
    const w = blockWidth(b)
    if (used + w > inner && cur.length) { rows.push(cur); cur = []; used = 0 }
    cur.push(b); used += w
  }
  if (cur.length) rows.push(cur)
  while (rows.length < 3) rows.push([])
  const k = { book: 0, movie: 1, show: 2 }[kind]
  const newest = entries.filter((e) => e.type === 'item').sort((a, b) => new Date(b.ref.created_at) - new Date(a.ref.created_at))[0]?.eid
  const sty = SHELF_STYLES[styleName] || SHELF_STYLES.madera

  // ----- tocar, mantener apretado y arrastrar -----
  const st = useRef(null)
  const [drag, setDrag] = useState(null) // { eid, dx, dy, target, after }
  function down(e, eid) {
    if (e.button && e.button !== 0) return
    const s = { eid, x: e.clientX, y: e.clientY, moved: false, timer: null }
    if (!editing) s.timer = setTimeout(() => { s.long = true; onLongPress?.(eid); navigator.vibrate?.(15) }, 450)
    st.current = s
    const move = (ev) => {
      const d = st.current; if (!d) return
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) > 7) { d.moved = true; clearTimeout(d.timer) }
      if (!editing || !d.moved) return
      ev.preventDefault()
      const hit = document.elementFromPoint(ev.clientX, ev.clientY)
      const el = hit?.closest('[data-eid]')
      let target = null, after = false
      if (el && el.dataset.eid !== d.eid) { const r = el.getBoundingClientRect(); target = el.dataset.eid; after = ev.clientX > r.left + r.width / 2 }
      else if (!el) {
        // en el hueco de un estante: va al final de ese estante
        const row = hit?.closest('[data-rowlast]')
        if (row?.dataset.rowlast && row.dataset.rowlast !== d.eid) { target = row.dataset.rowlast; after = true }
        else if (row?.dataset.rowfirst && row.dataset.rowfirst !== d.eid) { target = row.dataset.rowfirst; after = false }
      }
      setDrag({ eid: d.eid, dx, dy, target, after })
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
      const d = st.current; st.current = null
      if (!d) return
      clearTimeout(d.timer)
      setDrag((g) => {
        if (editing && d.moved && g?.target) {
          const ids = entries.map((x) => x.eid).filter((x) => x !== d.eid)
          let idx = ids.indexOf(g.target) + (g.after ? 1 : 0)
          ids.splice(idx, 0, d.eid)
          setTimeout(() => onReorder?.(ids), 0)
        } else if (!d.moved && !d.long) {
          const en = entries.find((x) => x.eid === d.eid)
          if (editing) onSelect?.(d.eid)
          else if (en?.type === 'item') onOpen?.(en.ref)
          else if (en?.type === 'deco') onDecoTap?.(en.ref)
        }
        return null
      })
    }
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
  }

  const ent = (e, children, style) => {
    const isDrag = drag?.eid === e.eid
    return (
      <div key={e.eid} data-eid={e.eid} onPointerDown={(ev) => down(ev, e.eid)} role="button" tabIndex={0} aria-label={e.type === 'item' ? e.ref.title : 'Decoración'}
        onKeyDown={(ev) => { if (ev.key === 'Enter') editing ? onSelect?.(e.eid) : e.type === 'item' && onOpen?.(e.ref) }}
        className={editing && !isDrag ? 'wiggle' : undefined}
        style={{ position: 'relative', flex: 'none', touchAction: editing ? 'none' : 'manipulation', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', cursor: editing ? 'grab' : 'pointer',
          outline: selected === e.eid ? '3px solid #141210' : 'none', outlineOffset: 2, borderRadius: 3,
          transform: isDrag ? `translate(${drag.dx}px, ${drag.dy}px) rotate(-4deg)` : selected === e.eid ? 'translateY(-8px)' : undefined, animation: selected === e.eid ? 'none' : undefined, zIndex: isDrag ? 20 : undefined, pointerEvents: isDrag ? 'none' : undefined,
          boxShadow: isDrag ? '0 18px 22px -8px rgba(0,0,0,.5)' : undefined, ...style }}>
        {children}
      </div>
    )
  }
  const Marker = () => <div style={{ flex: 'none', width: 4, height: 96, background: '#E6F04A', boxShadow: '0 0 0 1.5px #141210', borderRadius: 2, margin: '0 2px' }} />
  const inBlock = (b, id) => b.entries.some((e) => e.eid === id) || b.top?.eid === id
  const markBefore = (b) => drag?.target && !drag.after && inBlock(b, drag.target)
  const markAfter = (b) => drag?.target && drag.after && inBlock(b, drag.target)

  return (
    <div className={`case k${k}`} style={{ width }}>
      <Dust level={editing ? 0 : dust} cleaning={cleaning} onCleaned={onCleaned} />
      {rows.map((r, i) => {
        const lastB = r[r.length - 1]
        const rowLast = lastB ? (lastB.top || lastB.entries[lastB.entries.length - 1]).eid : entries[entries.length - 1]?.eid
        const nextFirst = rows.slice(i + 1).find((x) => x.length)?.[0]?.entries[0]?.eid
        return (
        <div key={i} data-rowlast={r.length ? rowLast : nextFirst ? undefined : entries[entries.length - 1]?.eid} data-rowfirst={r.length ? undefined : nextFirst} style={{ position: 'relative' }}>
          <div className="shelfrow" style={{ minHeight: r.length ? 0 : 108 }}>
            {r.map((b, j) => (
              <span key={b.entries[0].eid} style={{ display: 'contents' }}>
                {markBefore(b) && <Marker />}
                {b.type === 'pile'
                  ? <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', flex: 'none', margin: '0 3px' }}>{b.entries.map((e) => ent(e, <Lying it={e.ref} />))}{b.top && ent(b.top, <DecoArt d={b.top.ref} />, { marginBottom: -1 })}</div>
                  : b.entries[0].type === 'deco'
                    ? ent(b.entries[0], <DecoArt d={b.entries[0].ref} />, { margin: '0 3px' })
                    : ent(b.entries[0], <Standing it={b.entries[0].ref} isNew={b.entries[0].eid === newest} />)}
                {markAfter(b) && <Marker />}
              </span>
            ))}
            {!entries.length && i === 0 && onAdd && <button className="emptyslot" onClick={onAdd} aria-label="Cargar el primero">+</button>}
          </div>
          <div className={`plank ${sty.grain ? '' : 'nograin'}`} style={{ background: sty.plank }} />
        </div>
      )})}
    </div>
  )
}
