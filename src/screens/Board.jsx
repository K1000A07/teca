import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'

// Tablero de teca (solo admin): fechas para ir pensando, banco de ideas y procesos para hacerla real.
export const SECTIONS = [
  ['fechas', 'Con fecha', 'Se marcan en lima cuando se acercan, para que te dé tiempo de pensarlas.'],
  ['ideas', 'Banco de ideas', 'Cosas para hacer algún día, sin fecha.'],
  ['procesos', 'Para hacerla real', 'Marca, legales y tiendas, en orden.'],
]
const DAY = 864e5
const daysTo = (d) => Math.ceil((new Date(d + 'T12:00:00') - Date.now()) / DAY)
export const isNear = (n) => n.due && !n.done && daysTo(n.due) <= (n.remind_days ?? 30)
const whenTxt = (d) => { const n = daysTo(d); return n < 0 ? `pasó hace ${-n} días` : n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días` }
const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })

export function useBoard() {
  const [notes, setNotes] = useState(null)
  const load = () => sb.from('admin_board').select('*').order('position').order('due', { nullsFirst: false }).order('created_at').then(({ data, error }) => setNotes(error ? [] : data || []))
  useEffect(() => { load() }, [])
  return { notes, setNotes, load }
}

function Card({ n, onSave, onDelete }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(n)
  const near = isNear(n)
  const save = (patch) => { const next = { ...f, ...patch }; setF(next); onSave(next) }
  return (
    <div style={{ background: n.done ? '#F3F1EC' : near ? 'var(--lim)' : '#fff', borderRadius: 16, padding: '12px 14px', boxShadow: 'inset 0 0 0 1.5px var(--ink)', opacity: n.done ? .6 : 1 }}>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        {n.section === 'procesos' && <input type="checkbox" checked={!!f.done} onChange={(e) => save({ done: e.target.checked })} aria-label="Hecho" style={{ marginTop: 3, width: 18, height: 18, accentColor: '#141210' }} />}
        <button onClick={() => setOpen(!open)} style={{ flex: 1, textAlign: 'left', border: 0, background: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.02em', lineHeight: 1.2, textDecoration: n.done ? 'line-through' : 'none' }}>{n.title}</div>
          {n.due && <div className="light" style={{ marginTop: 5, color: 'var(--ink)' }}>{fmt(n.due)} · {whenTxt(n.due)}</div>}
          {!open && n.body && <div style={{ fontWeight: 300, fontSize: 13, marginTop: 5, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} onBlur={() => save({})} aria-label="Título" />
          <textarea className="input" rows={4} value={f.body || ''} onChange={(e) => setF({ ...f, body: e.target.value })} onBlur={() => save({})} placeholder="Notas" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <select className="input" value={f.section} onChange={(e) => save({ section: e.target.value })} style={{ width: 'auto' }} aria-label="Sección">{SECTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <input className="input" type="date" value={f.due || ''} onChange={(e) => save({ due: e.target.value || null })} style={{ width: 'auto' }} aria-label="Fecha" />
            {f.due && <label className="row" style={{ gap: 6, fontWeight: 300, fontSize: 13 }}>avisar <input className="input" type="number" min={1} max={120} value={f.remind_days ?? 30} onChange={(e) => setF({ ...f, remind_days: +e.target.value })} onBlur={() => save({})} style={{ width: 64 }} /> días antes</label>}
          </div>
          <div className="between"><button className="linkbtn" style={{ fontSize: 13 }} onClick={() => setOpen(false)}>Listo</button><button className="linkbtn" style={{ fontSize: 13, color: '#B33' }} onClick={() => confirm('¿Borrar esta tarjeta?') && onDelete(n)}>Borrar</button></div>
        </div>
      )}
    </div>
  )
}

export function BoardPanel({ say }) {
  const { notes, setNotes } = useBoard()
  const [adding, setAdding] = useState(null)
  const [title, setTitle] = useState('')
  async function save(n) {
    const { id, created_at, ...patch } = n
    setNotes((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await sb.from('admin_board').update(patch).eq('id', id)
    if (error) say('No se pudo guardar')
  }
  async function del(n) {
    setNotes((xs) => xs.filter((x) => x.id !== n.id))
    await sb.from('admin_board').delete().eq('id', n.id)
  }
  async function add(section) {
    if (!title.trim()) return setAdding(null)
    const { data, error } = await sb.from('admin_board').insert({ section, title: title.trim(), position: 999 }).select().single()
    if (error) return say('No se pudo guardar')
    setNotes((xs) => [...xs, data]); setTitle(''); setAdding(null)
  }
  if (!notes) return <p className="body muted">Cargando…</p>
  const near = notes.filter(isNear).sort((a, b) => a.due.localeCompare(b.due))
  return (<>
    {near.length > 0 && (
      <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 22, padding: '16px 20px', marginBottom: 22 }}>
        <div className="light" style={{ color: 'var(--lim)' }}>Se acerca</div>
        {near.map((n) => <div key={n.id} style={{ marginTop: 8, fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>{n.title} <span style={{ fontWeight: 300, fontSize: 14 }}>· {whenTxt(n.due)}</span></div>)}
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'start' }}>
      {SECTIONS.map(([k, l, sub]) => {
        const list = notes.filter((n) => n.section === k).sort((a, b) => (k === 'fechas' ? (a.due || '9').localeCompare(b.due || '9') : (a.position - b.position) || a.created_at.localeCompare(b.created_at)))
        const done = list.filter((n) => n.done).length
        return (
          <section key={k} style={{ background: 'var(--cell)', borderRadius: 24, padding: 16 }}>
            <div className="between"><h2 style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em', margin: 0 }}>{l}</h2><span className="light">{k === 'procesos' ? `${done}/${list.length}` : list.length}</span></div>
            <p style={{ fontWeight: 300, fontSize: 13, margin: '4px 0 12px' }}>{sub}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {list.map((n) => <Card key={n.id} n={n} onSave={save} onDelete={del} />)}
              {adding === k
                ? <div style={{ display: 'grid', gap: 6 }}><input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add(k)} placeholder="Escribí la idea" /><div className="row" style={{ gap: 8 }}><button className="chip on" onClick={() => add(k)}>Agregar</button><button className="linkbtn" onClick={() => { setAdding(null); setTitle('') }}>Cancelar</button></div></div>
                : <button className="chip" style={{ justifyContent: 'center', background: 'transparent' }} onClick={() => setAdding(k)}>+ Agregar</button>}
            </div>
          </section>
        )
      })}
    </div>
  </>)
}
