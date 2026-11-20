import { useEffect, useRef, useState } from 'react'
import { sb } from '../supabase.js'

// Tablero tipo Trello (solo admin): listas, tarjetas que se arrastran, etiquetas de colores y fechas.
export const LISTS = [['ideas', 'Ideas', 'Todavía no decidiste hacerlas'], ['todo', 'Por hacer', 'Ya decidiste: son las próximas'], ['doing', 'Haciendo', 'En curso'], ['done', 'Hecho', '']]
export const TAGS = {
  'Administrativo': '#E6F04A',
  'Creativo': '#A9C6F2',
  'Legal': '#F4A7C3',
  'Contenido': '#F2B63D',
  'Fecha especial': '#EF6F5E',
  'App': '#A8CFAE',
  'Tiendas': '#BDB5E6',
  'Plata': '#D9773F',
}
export const PRIO = [['ahora', 'Ahora'], ['antes', 'Antes de marzo'], ['app', 'Desde marzo']]
const DAY = 864e5
const daysTo = (d) => Math.ceil((new Date(d + 'T12:00:00') - Date.now()) / DAY)
const near = (c) => c.due && c.list !== 'done' && daysTo(c.due) <= (c.remind_days ?? 30)
const when = (d) => { const n = daysTo(d); return n < 0 ? `hace ${-n} d` : n === 0 ? 'hoy' : n === 1 ? 'mañana' : n < 60 ? `en ${n} días` : new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) }
const Tag = ({ t, small }) => <span style={{ display: 'inline-block', fontSize: small ? 10 : 11, fontWeight: 800, letterSpacing: '.04em', padding: small ? '2px 7px' : '3px 9px', borderRadius: 99, background: TAGS[t] || '#ECEAE5', color: '#141210', whiteSpace: 'nowrap' }}>{t}</span>

function CardModal({ c, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...c, tags: c.tags || [] })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const close = () => { onSave(f); onClose() }
  useEffect(() => { const k = (e) => e.key === 'Escape' && close(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) })
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,16,.45)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 24, width: 'min(560px, 100%)', maxHeight: '90dvh', overflow: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div className="between" style={{ alignItems: 'flex-start', gap: 12 }}>
          <textarea value={f.title} onChange={(e) => set({ title: e.target.value })} rows={2} aria-label="Título" style={{ flex: 1, border: 0, outline: 0, resize: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.15 }} />
          <button className="iconbtn" aria-label="Cerrar" onClick={close} style={{ width: 34, height: 34, fontSize: 18 }}>×</button>
        </div>
        <div className="light" style={{ marginTop: 14 }}>Etiquetas</div>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.keys(TAGS).map((t) => { const on = f.tags.includes(t); return <button key={t} onClick={() => set({ tags: on ? f.tags.filter((x) => x !== t) : [...f.tags, t] })} style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer', opacity: on ? 1 : .35, outline: on ? '2px solid #141210' : 'none', borderRadius: 99, outlineOffset: 1 }}><Tag t={t} /></button> })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Lista</span><select className="input" value={f.list} onChange={(e) => set({ list: e.target.value })} style={{ padding: '10px 12px', fontSize: 14 }}>{LISTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Prioridad</span><select className="input" value={f.priority || ''} onChange={(e) => set({ priority: e.target.value || null })} style={{ padding: '10px 12px', fontSize: 14 }}><option value="">—</option>{PRIO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Fecha</span><input className="input" type="date" value={f.due || ''} onChange={(e) => set({ due: e.target.value || null })} style={{ padding: '10px 12px', fontSize: 14 }} /></label>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Avisar días antes</span><input className="input" type="number" min={1} max={120} value={f.remind_days ?? 30} onChange={(e) => set({ remind_days: +e.target.value })} style={{ padding: '10px 12px', fontSize: 14 }} /></label>
          <label style={{ display: 'grid', gap: 6, gridColumn: '1 / -1' }}><span className="light">Costo</span><input className="input" value={f.cost || ''} onChange={(e) => set({ cost: e.target.value || null })} placeholder="Opcional" style={{ padding: '10px 12px', fontSize: 14 }} /></label>
        </div>
        <label style={{ display: 'grid', gap: 6, marginTop: 12 }}><span className="light">Notas</span><textarea className="input" rows={6} value={f.body || ''} onChange={(e) => set({ body: e.target.value })} style={{ fontFamily: 'inherit', fontWeight: 300, fontSize: 15, lineHeight: 1.45, resize: 'vertical' }} /></label>
        <div className="between" style={{ marginTop: 18 }}>
          <button className="linkbtn" style={{ color: '#B33', fontSize: 13 }} onClick={() => { if (confirm('¿Borrar esta tarjeta?')) { onDelete(c); onClose() } }}>Borrar tarjeta</button>
          <button className="chip on" style={{ padding: '10px 20px' }} onClick={close}>Listo</button>
        </div>
      </div>
    </div>
  )
}

export function KanbanPanel({ say }) {
  const [cards, setCards] = useState(null)
  const [filter, setFilter] = useState(null)
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(null)
  const [title, setTitle] = useState('')
  const [drag, setDrag] = useState(null) // { id, x, y, ox, oy, w, over: {list, index} }
  const [big, setBig] = useState(null)
  const colRefs = useRef({})
  useEffect(() => { sb.from('admin_tasks').select('*').order('position').order('created_at').then(({ data, error }) => setCards(error ? [] : data || [])) }, [])

  async function save(c) {
    const { id, created_at, ...patch } = c
    setCards((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await sb.from('admin_tasks').update(patch).eq('id', id)
    if (error) say('No se pudo guardar')
  }
  async function del(c) { setCards((xs) => xs.filter((x) => x.id !== c.id)); await sb.from('admin_tasks').delete().eq('id', c.id) }
  async function add(list) {
    const t = title.trim(); setTitle(''); setAdding(null)
    if (!t) return
    const pos = Math.max(0, ...cards.filter((c) => c.list === list).map((c) => c.position)) + 1
    const { data, error } = await sb.from('admin_tasks').insert({ title: t, list, position: pos, tags: filter ? [filter] : [], area: 'admin', priority: 'ahora' }).select().single()
    if (error) return say('No se pudo guardar')
    setCards((xs) => [...xs, data])
  }

  // ----- arrastrar tarjetas entre listas -----
  // Lo que se acerca sube solo al principio de su lista, ordenado por fecha
  const inList = (list) => cards.filter((c) => c.list === list && (!filter || (c.tags || []).includes(filter))).sort((a, b) => (near(b) - near(a)) || (near(a) && near(b) ? a.due.localeCompare(b.due) : a.position - b.position))
  function overAt(x, y, id) {
    for (const [list] of LISTS) {
      const el = colRefs.current[list]; if (!el) continue
      const r = el.getBoundingClientRect()
      if (x < r.left || x > r.right) continue
      const items = [...el.querySelectorAll('[data-card]')].filter((n) => n.dataset.card !== id)
      let index = items.length
      for (let i = 0; i < items.length; i++) { const b = items[i].getBoundingClientRect(); if (y < b.top + b.height / 2) { index = i; break } }
      return { list, index }
    }
    return null
  }
  function down(e, c) {
    if (e.button && e.button !== 0) return
    const r = e.currentTarget.getBoundingClientRect()
    const st = { id: c.id, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, moved: false }
    const move = (ev) => {
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) < 6) return
      st.moved = true; ev.preventDefault()
      setDrag({ id: c.id, x: ev.clientX - st.ox, y: ev.clientY - st.oy, w: st.w, over: overAt(ev.clientX, ev.clientY, c.id) })
    }
    const up = (ev) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      if (!st.moved) { setDrag(null); return setOpen(c) }
      const o = overAt(ev.clientX, ev.clientY, c.id); setDrag(null)
      if (!o) return
      const list = inList(o.list).filter((x) => x.id !== c.id)
      const before = list[o.index - 1]?.position, after = list[o.index]?.position
      const position = before == null && after == null ? 1 : before == null ? after - 1 : after == null ? before + 1 : (before + after) / 2
      save({ ...c, list: o.list, position, done: o.list === 'done' })
    }
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up)
  }

  if (!cards) return <p className="body muted">Cargando…</p>
  const dragging = drag && cards.find((c) => c.id === drag.id)
  const CardView = ({ c, ghost, still }) => (
    <div data-card={ghost || still ? undefined : c.id} onPointerDown={ghost || still ? undefined : (e) => down(e, c)}
      style={{ background: near(c) ? '#F6F9C9' : '#fff', borderRadius: 14, padding: '10px 12px', boxShadow: ghost ? '0 16px 30px rgba(0,0,0,.25)' : '0 1px 0 rgba(20,18,16,.18)', cursor: ghost ? 'grabbing' : still ? 'pointer' : 'grab', touchAction: still ? 'auto' : 'none', userSelect: 'none', opacity: !ghost && drag?.id === c.id ? .3 : 1, transform: ghost ? 'rotate(2deg)' : undefined }}>
      {(c.tags || []).length > 0 && <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>{c.tags.map((t) => <Tag key={t} t={t} small />)}</div>}
      <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em', lineHeight: 1.25, textDecoration: c.list === 'done' ? 'line-through' : 'none', opacity: c.list === 'done' ? .55 : 1 }}>{c.title}</div>
      {(c.due || c.body || c.cost || c.priority) && (
        <div className="row" style={{ gap: 10, marginTop: 6, fontSize: 12, fontWeight: 300, flexWrap: 'wrap' }}>
          {c.due && <span style={{ fontWeight: near(c) ? 800 : 300 }}>📅 {when(c.due)}</span>}
          {c.priority && c.list !== 'done' && <span>{PRIO.find(([k]) => k === c.priority)?.[1]}</span>}
          {c.cost && <span>💸 {c.cost}</span>}
          {c.body && <span title="Tiene notas">≡</span>}
        </div>
      )}
    </div>
  )
  return (<>
    <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      <span className="light" style={{ marginRight: 4 }}>Filtrar</span>
      <button className={`chip ${!filter ? 'on' : ''}`} style={{ fontSize: 12.5, padding: '5px 11px' }} onClick={() => setFilter(null)}>Todas</button>
      {Object.keys(TAGS).map((t) => <button key={t} onClick={() => setFilter(filter === t ? null : t)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', opacity: !filter || filter === t ? 1 : .35, outline: filter === t ? '2px solid #141210' : 'none', borderRadius: 99, outlineOffset: 1 }}><Tag t={t} /></button>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${LISTS.length}, minmax(250px, 1fr))`, gap: 14, alignItems: 'start', overflowX: 'auto', paddingBottom: 10 }}>
      {LISTS.map(([k, l, s]) => {
        const list = inList(k)
        const ov = drag?.over?.list === k ? drag.over.index : -1
        const shown = list.filter((c) => c.id !== drag?.id)
        return (
          <section key={k} ref={(el) => { colRefs.current[k] = el }} style={{ background: drag?.over?.list === k ? '#DCE7F8' : 'var(--cell)', borderRadius: 20, padding: 10, transition: 'background .15s' }}>
            <button onClick={() => setBig(k)} title="Ver en grande" className="between" style={{ width: '100%', border: 0, background: 'none', padding: '4px 6px 10px', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}><div><div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>{l} <span style={{ fontWeight: 300, fontSize: 13 }}>↗</span></div>{s && <div style={{ fontWeight: 300, fontSize: 12 }}>{s}</div>}</div><span className="light">{list.length}</span></button>
            <div style={{ display: 'grid', gap: 8, minHeight: 20, maxHeight: 640, overflowY: 'auto', overscrollBehavior: 'contain', margin: '0 -4px', padding: '0 4px 2px' }}>
              {shown.map((c, i) => (<div key={c.id}>{ov === i && <div style={{ height: 4, borderRadius: 2, background: 'var(--ink)', marginBottom: 8 }} />}<CardView c={c} /></div>))}
              {ov >= shown.length && <div style={{ height: 4, borderRadius: 2, background: 'var(--ink)' }} />}
              {adding === k
                ? <div style={{ display: 'grid', gap: 6 }}><textarea className="input" autoFocus rows={2} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(k) } }} placeholder="Título de la tarjeta" style={{ fontFamily: 'inherit', fontSize: 14, resize: 'none', background: '#fff' }} /><div className="row" style={{ gap: 8 }}><button className="chip on" style={{ fontSize: 13 }} onClick={() => add(k)}>Agregar</button><button className="linkbtn" style={{ fontSize: 13 }} onClick={() => { setAdding(null); setTitle('') }}>Cancelar</button></div></div>
                : <button onClick={() => setAdding(k)} style={{ border: 0, background: 'none', textAlign: 'left', padding: '6px 8px', borderRadius: 10, fontWeight: 800, fontSize: 13.5, color: 'rgba(20,18,16,.6)', cursor: 'pointer' }}>+ Agregar tarjeta</button>}
            </div>
          </section>
        )
      })}
    </div>
    {big && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(20,18,16,.45)', padding: 24 }} onClick={() => setBig(null)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--cell)', borderRadius: 28, height: '100%', overflow: 'auto', padding: '24px 28px', boxSizing: 'border-box' }}>
          <div className="between" style={{ marginBottom: 18 }}>
            <div><div style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-0.045em' }}>{LISTS.find(([k]) => k === big)[1]} <span style={{ fontWeight: 300, fontSize: 20 }}>{inList(big).length}</span></div><div style={{ fontWeight: 300, fontSize: 14 }}>{LISTS.find(([k]) => k === big)[2]}</div></div>
            <button className="iconbtn" aria-label="Cerrar" onClick={() => setBig(null)} style={{ width: 40, height: 40, fontSize: 20 }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignItems: 'start' }}>
            {inList(big).map((c) => <div key={c.id} onClick={() => setOpen(c)}><CardView c={c} ghost={false} still /></div>)}
          </div>
        </div>
      </div>
    )}
    {dragging && <div style={{ position: 'fixed', left: drag.x, top: drag.y, width: drag.w, zIndex: 90, pointerEvents: 'none' }}><CardView c={dragging} ghost /></div>}
    {open && <CardModal c={cards.find((x) => x.id === open.id) || open} onSave={save} onDelete={del} onClose={() => setOpen(null)} />}
  </>)
}
