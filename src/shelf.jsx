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

// ---------- Lugar libre en el estante ----------
// Cada título o deco puede tener un estante (shelf_row) y una posición horizontal (shelf_x, de 0 a 1).
// Lo que no tiene lugar guardado se acomoda solo en el primer hueco libre.
const lyingH = (it) => Math.min(26, Math.max(12, spineW(it)))
const GAP = 2
const rnd = (v) => Math.round(v * 10000) / 10000
const hasSpot = (r) => r.shelf_row != null && r.shelf_x != null
function entryDims(e) {
  if (e.type === 'deco') return { w: decoW(e.ref.kind) + 6, h: decoSize(e.ref.kind).h }
  if (e.ref.lying) return { w: spineH(e.ref) + 6, h: lyingH(e.ref) }
  return { w: spineW(e.ref) + 1 + (e.ref.tilt ? 12 : 0), h: spineH(e.ref) + (e.ref.tilt ? 4 : 0) }
}
function measure(b) {
  const parts = [...b.entries, ...(b.top ? [b.top] : [])].map(entryDims)
  b.w = Math.max(...parts.map((p) => p.w))
  b.h = b.type === 'pile' ? parts.reduce((a, p) => a + p.h, 0) : parts[0].h
  return b
}
export function layoutShelf(entries, inner, packed) {
  const fixed = [], loose = []
  const piles = new Map()
  for (const e of entries) {
    const r = e.ref
    const spot = !packed && hasSpot(r)
    if (e.type === 'item' && r.lying) {
      if (spot) {
        const key = `${r.shelf_row}|${rnd(r.shelf_x)}`
        let p = piles.get(key)
        if (!p || p.entries.length >= 5) { p = { key, type: 'pile', entries: [], row: r.shelf_row, x: rnd(r.shelf_x), fixed: true }; piles.set(key, p); fixed.push(p) }
        p.entries.push(e)
      } else {
        const last = loose[loose.length - 1]
        if (last?.type === 'pile' && last.entries.length < 5 && !last.top) last.entries.push(e)
        else loose.push({ key: e.eid, type: 'pile', entries: [e] })
      }
    } else if (e.type === 'deco' && r.stacked) {
      const p = spot ? piles.get(`${r.shelf_row}|${rnd(r.shelf_x)}`) : (loose[loose.length - 1]?.type === 'pile' ? loose[loose.length - 1] : null)
      if (p && !p.top) p.top = e
      else (spot ? fixed : loose).push(spot ? { key: e.eid, type: 'one', entries: [e], row: r.shelf_row, x: rnd(r.shelf_x), fixed: true } : { key: e.eid, type: 'one', entries: [e] })
    } else if (spot) fixed.push({ key: e.eid, type: 'one', entries: [e], row: r.shelf_row, x: rnd(r.shelf_x), fixed: true })
    else loose.push({ key: e.eid, type: 'one', entries: [e] })
  }
  const rows = []
  const rowOf = (i) => (rows[i] ||= [])
  // lo que tiene lugar guardado: si se pisa con el de al lado, se corre un poquito
  fixed.forEach(measure)
  const byRow = {}
  fixed.forEach((b) => (byRow[b.row] ||= []).push(b))
  Object.entries(byRow).forEach(([ri, list]) => {
    list.sort((a, b) => a.x - b.x)
    let right = 0
    for (const b of list) {
      b.left = Math.min(Math.max(b.x * inner, right), Math.max(0, inner - b.w))
      right = b.left + b.w + GAP
      rowOf(+ri).push(b)
    }
  })
  // lo nuevo va al primer hueco donde entra
  for (const b of loose) {
    measure(b)
    for (let ri = 0; ; ri++) {
      const ivs = rowOf(ri).map((x) => [x.left, x.left + x.w]).sort((a, c) => a[0] - c[0])
      let cur = 0, at = null
      for (const [l, r] of ivs) { if (l - cur >= b.w) { at = cur; break } cur = Math.max(cur, r + GAP) }
      if (at == null && inner - cur >= b.w) at = cur
      if (at == null && !ivs.length) at = 0
      if (at != null) { b.row = ri; b.left = at; rows[ri].push(b); break }
    }
  }
  for (let i = 0; i < rows.length; i++) rows[i] ||= []
  return rows
}
// Lugar libre más cercano a donde se soltó
function nearestFree(blocks, w, want, inner) {
  const ivs = blocks.map((b) => [b.left, b.left + b.w]).sort((a, c) => a[0] - c[0])
  const gaps = []
  let cur = 0
  for (const [l, r] of ivs) { if (l > cur) gaps.push([cur, l - GAP]); cur = Math.max(cur, r + GAP) }
  if (inner > cur) gaps.push([cur, inner])
  let best = null
  for (const [a, b] of gaps) {
    if (b - a < w) continue
    const c = Math.min(Math.max(want, a), b - w)
    if (best == null || Math.abs(c - want) < Math.abs(best - want)) best = c
  }
  return best
}

export function Shelf({ entries, kind, width, styleName = 'madera', editing, packed, selected, onOpen, onSelect, onLongPress, onMove, onAdd, onDecoTap, onFull, dust = 0, cleaning, onCleaned }) {
  const inner = width - 20
  const rows = layoutShelf(entries, inner, packed)
  while (rows.length < 3) rows.push([])
  if (editing && rows[rows.length - 1].length) rows.push([])
  const k = { book: 0, movie: 1, show: 2 }[kind]
  const newest = entries.filter((e) => e.type === 'item').sort((a, b) => new Date(b.ref.created_at) - new Date(a.ref.created_at))[0]?.eid
  const sty = SHELF_STYLES[styleName] || SHELF_STYLES.madera
  const caseRef = useRef(null)

  // ----- tocar, mantener apretado y arrastrar a donde quieras -----
  const st = useRef(null)
  const [drag, setDrag] = useState(null) // { eid, dx, dy, pile }
  const pileUnder = (x, y, d) => {
    const el = document.elementFromPoint(x, y)?.closest('[data-pile]')
    if (!el || el.dataset.pile === d.blockKey) return null
    const en = entries.find((e) => e.eid === d.eid)
    if (!en || (en.type === 'item' && !en.ref.lying)) return null
    return el.dataset.pile
  }
  function down(e, eid, blockKey) {
    if (e.button && e.button !== 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const s = { eid, blockKey, x: e.clientX, y: e.clientY, offX: e.clientX - r.left, moved: false, timer: null }
    if (!editing) s.timer = setTimeout(() => { s.long = true; onLongPress?.(eid); navigator.vibrate?.(15) }, 450)
    st.current = s
    const move = (ev) => {
      const d = st.current; if (!d) return
      const dx = ev.clientX - d.x, dy = ev.clientY - d.y
      if (!d.moved && Math.hypot(dx, dy) > 6) { d.moved = true; clearTimeout(d.timer) }
      if (!editing || !d.moved) return
      ev.preventDefault()
      setDrag({ eid: d.eid, dx, dy, pile: pileUnder(ev.clientX, ev.clientY, d) })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up)
      const d = st.current; st.current = null
      if (!d) return
      clearTimeout(d.timer)
      setDrag(null)
      if (editing && d.moved) return drop(d, ev.clientX, ev.clientY)
      if (d.moved || d.long) return
      const en = entries.find((x) => x.eid === d.eid)
      if (editing) onSelect?.(d.eid)
      else if (en?.type === 'item') onOpen?.(en.ref)
      else if (en?.type === 'deco') onDecoTap?.(en.ref)
    }
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
  }

  function drop(d, px, py) {
    const en = entries.find((e) => e.eid === d.eid)
    if (!en) return
    // en qué estante se soltó
    const rowEls = [...(caseRef.current?.querySelectorAll('[data-row]') || [])]
    let ri = -1, rowRect = null
    rowEls.forEach((el) => { const r = el.getBoundingClientRect(); if (py >= r.top - 10 && py <= r.bottom + 22) { ri = +el.dataset.row; rowRect = r } })
    if (ri < 0) {
      // más arriba o más abajo de todo: el estante más cercano
      const rs = rowEls.map((el) => [+el.dataset.row, el.getBoundingClientRect()])
      if (!rs.length) return
      const near = rs.reduce((a, b) => (Math.abs(b[1].bottom - py) < Math.abs(a[1].bottom - py) ? b : a))
      ri = near[0]; rowRect = near[1]
    }
    const all = rows.flatMap((r) => r)
    const spot = (b) => ({ row: b.row, x: rnd(b.left / inner) })
    // fijar en su lugar todo lo que todavía se acomodaba solo, así nada salta
    const ups = []
    const seen = new Set()
    for (const b of all) {
      for (const x of [...b.entries, ...(b.top ? [b.top] : [])]) {
        if (x.eid === d.eid) continue
        seen.add(x.eid)
        if (!b.fixed || !hasSpot(x.ref) || Math.abs(x.ref.shelf_x - spot(b).x) > 0.0001 || x.ref.shelf_row !== b.row) ups.push({ eid: x.eid, ...spot(b) })
      }
    }
    const pileKey = pileUnder(px, py, d)
    const pile = pileKey && all.find((b) => b.key === pileKey)
    if (pile && pile.type === 'pile') {
      const pos = Math.max(0, ...pile.entries.map((x) => x.ref.position || 0)) + 1
      if (en.type === 'deco') {
        if (pile.top && pile.top.eid !== d.eid) { onFull?.('Esa pila ya tiene algo arriba'); return }
        ups.push({ eid: d.eid, ...spot(pile), stacked: true })
      } else if (pile.entries.length >= 5) { onFull?.('Esa pila ya tiene 5 libros'); return }
      else ups.push({ eid: d.eid, ...spot(pile), position: pos })
      return onMove?.(ups)
    }
    const me = entryDims(en)
    const others = rows[ri].filter((b) => !(b.entries.length === 1 && !b.top && b.entries[0].eid === d.eid))
      .map((b) => (b.top?.eid === d.eid || b.entries.some((x) => x.eid === d.eid)) ? measure({ ...b, entries: b.entries.filter((x) => x.eid !== d.eid), top: b.top?.eid === d.eid ? null : b.top }) : b)
      .filter((b) => b.entries.length || b.top)
    const want = px - d.offX - rowRect.left
    const left = nearestFree(others, me.w, want, inner)
    if (left == null) { onFull?.('No entra en ese estante'); return }
    ups.push({ eid: d.eid, row: ri, x: rnd(left / inner), ...(en.type === 'deco' ? { stacked: false } : { position: en.ref.position }) })
    onMove?.(ups)
  }

  const ent = (e, blockKey, children, style) => {
    const isDrag = drag?.eid === e.eid
    return (
      <div key={e.eid} data-eid={e.eid} onPointerDown={(ev) => down(ev, e.eid, blockKey)} role="button" tabIndex={0} aria-label={e.type === 'item' ? e.ref.title : 'Decoración'}
        onKeyDown={(ev) => { if (ev.key === 'Enter') editing ? onSelect?.(e.eid) : e.type === 'item' && onOpen?.(e.ref) }}
        className={editing && !isDrag ? 'wiggle' : undefined}
        style={{ position: 'relative', flex: 'none', touchAction: editing ? 'none' : 'manipulation', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', cursor: editing ? (isDrag ? 'grabbing' : 'grab') : 'pointer',
          outline: selected === e.eid ? '3px solid #141210' : 'none', outlineOffset: 2, borderRadius: 3,
          transform: isDrag ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.06)` : selected === e.eid ? 'translateY(-6px)' : undefined, transition: isDrag ? 'none' : 'transform .18s ease',
          zIndex: isDrag ? 40 : undefined, pointerEvents: isDrag ? 'none' : undefined, filter: isDrag ? 'drop-shadow(0 14px 12px rgba(0,0,0,.35))' : undefined, ...style }}>
        {children}
      </div>
    )
  }

  return (
    <div ref={caseRef} className={`case k${k}`} style={{ width }}>
      <Dust level={editing ? 0 : dust} cleaning={cleaning} onCleaned={onCleaned} />
      {rows.map((r, i) => {
        const H = r.length ? Math.max(60, ...r.map((b) => b.h)) : (editing && i === rows.length - 1 ? 90 : 108)
        return (
          <div key={i} style={{ position: 'relative', zIndex: drag && r.some((b) => b.entries.some((x) => x.eid === drag.eid) || b.top?.eid === drag.eid) ? 30 : rows.length - i }}>
            <div data-row={i} style={{ position: 'relative', height: H, margin: '0 10px' }}>
              {r.map((b) => {
                const hot = drag?.pile === b.key
                const ownsDrag = drag && (b.entries.some((x) => x.eid === drag.eid) || b.top?.eid === drag.eid)
                return (
                  <div key={b.key} data-pile={b.type === 'pile' ? b.key : undefined}
                    style={{ position: 'absolute', left: b.left, bottom: 0, width: b.w, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', zIndex: ownsDrag ? 40 : undefined,
                      borderRadius: 4, boxShadow: hot ? '0 0 0 3px #E6F04A, 0 0 0 4.5px #141210' : undefined }}>
                    {b.type === 'pile'
                      ? <>{b.entries.map((e) => ent(e, b.key, <Lying it={e.ref} />))}{b.top && ent(b.top, b.key, <DecoArt d={b.top.ref} />, { marginBottom: -1 })}</>
                      : b.entries[0].type === 'deco'
                        ? ent(b.entries[0], b.key, <DecoArt d={b.entries[0].ref} />)
                        : ent(b.entries[0], b.key, <Standing it={b.entries[0].ref} isNew={b.entries[0].eid === newest} />)}
                  </div>
                )
              })}
              {!entries.length && i === 0 && onAdd && <button className="emptyslot" style={{ position: 'absolute', left: 0, bottom: 0 }} onClick={onAdd} aria-label="Cargar el primero">+</button>}
            </div>
            <div className={`plank ${sty.grain ? '' : 'nograin'}`} style={{ background: sty.plank }} />
          </div>
        )
      })}
    </div>
  )
}
