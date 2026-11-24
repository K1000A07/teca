import { Fragment, useEffect, useMemo, useState } from 'react'
import { sb } from '../supabase.js'

// Panel de trabajo (solo admin): tareas, contenido para redes y presupuesto.
const DAY = 864e5
const num = (v) => (v === '' || v == null || isNaN(+v) ? 0 : +v)
const fmtN = (n) => (n >= 10000 ? `${Math.round(n / 1000)} mil` : n.toLocaleString('es-AR'))
const fmtD = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '')
const box = { background: 'var(--cell)', borderRadius: 24, padding: 16 }
const h2 = { fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em', margin: 0 }
const sub = { fontWeight: 300, fontSize: 13, margin: '4px 0 12px' }
const card = (bg = '#fff') => ({ background: bg, borderRadius: 16, padding: '12px 14px', boxShadow: 'inset 0 0 0 1.5px var(--ink)' })

function useTable(table, order = 'position') {
  const [rows, setRows] = useState(null)
  useEffect(() => { sb.from(table).select('*').order(order).order('created_at').then(({ data, error }) => setRows(error ? [] : data || [])) }, [table])
  const save = async (r, say) => {
    const { id, created_at, ...patch } = r
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await sb.from(table).update(patch).eq('id', id)
    if (error) say?.('No se pudo guardar')
  }
  const add = async (r, say) => {
    const { data, error } = await sb.from(table).insert(r).select().single()
    if (error) return say?.('No se pudo guardar')
    setRows((xs) => [...xs, data]); return data
  }
  const del = async (r) => { setRows((xs) => xs.filter((x) => x.id !== r.id)); await sb.from(table).delete().eq('id', r.id) }
  return { rows, save, add, del }
}

function Field({ label, children }) {
  return <label style={{ display: 'grid', gap: 4, fontWeight: 300, fontSize: 12 }}><span className="light" style={{ fontSize: 10.5 }}>{label}</span>{children}</label>
}
function Editable({ value, onSave, placeholder, area, style }) {
  const [v, setV] = useState(value || '')
  useEffect(() => setV(value || ''), [value])
  const P = { className: 'input', value: v, placeholder, onChange: (e) => setV(e.target.value), onBlur: () => v !== (value || '') && onSave(v), style: { padding: '9px 11px', fontSize: 14, ...style } }
  return area ? <textarea rows={3} {...P} style={{ ...P.style, fontFamily: 'inherit', resize: 'vertical', fontWeight: 300 }} /> : <input {...P} />
}

// ---------- TAREAS ----------
export const PRIORITIES = [['ahora', 'Ahora', 'Noviembre y diciembre: cosas gratis o baratas que se pueden hacer ya.'], ['antes', 'Antes de marzo', 'Para tener todo listo cuando arranque la app.'], ['app', 'Desde marzo', 'Cuando empecemos con la app para las tiendas.']]

// ---------- CONTENIDO ----------
export const STAGES = [['idea', 'Idea'], ['guion', 'Guion'], ['grabando', 'Grabando'], ['editando', 'Editando'], ['publicado', 'Publicado']]
const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Otra']
const METRICS = [['views', 'Vistas'], ['likes', 'Me gusta'], ['comments', 'Comentarios'], ['shares', 'Compartidos'], ['saves', 'Guardados'], ['follows', 'Seguidores nuevos']]
const eng = (v) => { const m = v.metrics || {}; const vw = num(m.views); return vw ? (num(m.likes) + num(m.comments) + num(m.shares) + num(m.saves)) / vw : 0 }
const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')}%`

// Tarjeta chica: se toca y se abre en grande con todo el contenido
function VideoCard({ v, save, onOpen }) {
  const i = STAGES.findIndex(([k]) => k === v.status)
  const move = (d) => { const n = STAGES[i + d]; if (n) save({ ...v, status: n[0], ...(n[0] === 'publicado' && !v.published_at ? { published_at: new Date().toISOString().slice(0, 10) } : {}) }) }
  const m = v.metrics || {}
  return (
    <div style={card()}>
      <button onClick={onOpen} style={{ width: '100%', textAlign: 'left', border: 0, background: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{v.title}</div>
        {v.body && <div style={{ fontWeight: 300, fontSize: 12.5, lineHeight: 1.35, marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.body}</div>}
        <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {v.platform && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, background: 'var(--cel)' }}>{v.platform}</span>}
          {(v.tags || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => <span key={t} style={{ fontSize: 11.5, fontWeight: 300 }}>#{t}</span>)}
        </div>
        {v.status === 'publicado' && num(m.views) > 0 && <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 800 }}>{fmtN(num(m.views))} vistas · {pct(eng(v))} interacción</div>}
      </button>
      <div className="between" style={{ marginTop: 8 }}>
        <button className="linkbtn" style={{ fontSize: 12.5, opacity: i > 0 ? 1 : .25 }} disabled={i === 0} onClick={() => move(-1)}>← {STAGES[i - 1]?.[1] || ''}</button>
        <button className="linkbtn" style={{ fontSize: 12.5, opacity: i < STAGES.length - 1 ? 1 : .25 }} disabled={i === STAGES.length - 1} onClick={() => move(1)}>{STAGES[i + 1]?.[1] || ''} →</button>
      </div>
    </div>
  )
}

// Vista grande de una idea (también para cargar una nueva)
function VideoModal({ v, isNew, onSave, onDelete, onClose }) {
  const [f, setF] = useState({ ...v })
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const m = f.metrics || {}
  const close = () => { onSave(f); onClose() }
  useEffect(() => { const k = (e) => e.key === 'Escape' && close(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) })
  const inp = { padding: '10px 12px', fontSize: 14 }
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,16,.45)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 24, width: 'min(620px, 100%)', maxHeight: '90dvh', overflow: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div className="between" style={{ alignItems: 'flex-start', gap: 12 }}>
          <textarea autoFocus={isNew} value={f.title || ''} onChange={(e) => set({ title: e.target.value })} rows={2} placeholder="Idea de video" aria-label="Título" style={{ flex: 1, border: 0, outline: 0, resize: 'none', fontFamily: 'inherit', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.15 }} />
          <button className="iconbtn" aria-label="Cerrar" onClick={close} style={{ width: 34, height: 34, fontSize: 18 }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Etapa</span><select className="input" value={f.status} onChange={(e) => set({ status: e.target.value, ...(e.target.value === 'publicado' && !f.published_at ? { published_at: new Date().toISOString().slice(0, 10) } : {}) })} style={inp}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6 }}><span className="light">Plataforma</span><select className="input" value={f.platform || ''} onChange={(e) => set({ platform: e.target.value || null })} style={inp}><option value="">—</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label style={{ display: 'grid', gap: 6, gridColumn: '1 / -1' }}><span className="light">Etiquetas</span><input className="input" value={f.tags || ''} onChange={(e) => set({ tags: e.target.value || null })} placeholder="pov, tour, humor" style={inp} /></label>
        </div>
        <label style={{ display: 'grid', gap: 6, marginTop: 12 }}><span className="light">Idea, guion, notas</span><textarea className="input" rows={9} value={f.body || ''} onChange={(e) => set({ body: e.target.value })} style={{ fontFamily: 'inherit', fontWeight: 300, fontSize: 15, lineHeight: 1.45, resize: 'vertical' }} /></label>
        {f.status === 'publicado' && (<div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}><span className="light">Link</span><input className="input" value={f.link || ''} onChange={(e) => set({ link: e.target.value || null })} placeholder="https://…" style={inp} /></label>
            <label style={{ display: 'grid', gap: 6 }}><span className="light">Publicado el</span><input className="input" type="date" value={f.published_at || ''} onChange={(e) => set({ published_at: e.target.value || null })} style={inp} /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {METRICS.map(([k, l]) => <label key={k} style={{ display: 'grid', gap: 6 }}><span className="light">{l}</span><input className="input" type="number" min={0} value={m[k] ?? ''} onChange={(e) => set({ metrics: { ...m, [k]: e.target.value === '' ? null : +e.target.value } })} style={inp} /></label>)}
          </div>
          {f.link && <a href={f.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 800 }}>Abrir el video ↗</a>}
        </div>)}
        <div className="between" style={{ marginTop: 18 }}>
          {isNew ? <button className="linkbtn" style={{ fontSize: 13 }} onClick={onClose}>Descartar</button> : <button className="linkbtn" style={{ color: '#B33', fontSize: 13 }} onClick={() => { if (confirm('¿Borrar esta idea?')) { onDelete(v); onClose() } }}>Borrar</button>}
          <button className="chip on" style={{ padding: '10px 20px' }} onClick={close}>{isNew ? 'Agregar' : 'Listo'}</button>
        </div>
      </div>
    </div>
  )
}

function Report({ vids, say }) {
  const pub = vids.filter((v) => v.status === 'publicado')
  const withData = pub.filter((v) => num(v.metrics?.views) > 0)
  const week = withData.filter((v) => v.published_at && Date.now() - new Date(v.published_at + 'T12:00:00') < 7 * DAY)
  const byViews = [...withData].sort((a, b) => num(b.metrics.views) - num(a.metrics.views))
  const byEng = [...withData].sort((a, b) => eng(b) - eng(a))
  const tags = {}
  withData.forEach((v) => (v.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).forEach((t) => { (tags[t] ||= []).push(v) }))
  const tagRank = Object.entries(tags).map(([t, l]) => [t, l.reduce((a, v) => a + num(v.metrics.views), 0) / l.length, l.length]).sort((a, b) => b[1] - a[1])
  const total = (k, l = withData) => l.reduce((a, v) => a + num(v.metrics?.[k]), 0)
  function copy() {
    const lines = [`Datos de los videos de teca (${new Date().toLocaleDateString('es-AR')}):`, ...pub.map((v) => { const m = v.metrics || {}; return `- "${v.title}" | ${v.platform || '?'} | ${v.published_at || 's/f'} | etiquetas: ${v.tags || '-'} | vistas ${num(m.views)}, me gusta ${num(m.likes)}, comentarios ${num(m.comments)}, compartidos ${num(m.shares)}, guardados ${num(m.saves)}, seguidores ${num(m.follows)}${v.link ? ` | ${v.link}` : ''}` }), '', 'Ideas pendientes:', ...vids.filter((v) => v.status !== 'publicado').map((v) => `- ${v.title} (${v.status})`)]
    navigator.clipboard?.writeText(lines.join('\n')).then(() => say('Copiado: pegáselo a Claude para el reporte'), () => say('No se pudo copiar'))
  }
  return (
    <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 24, padding: '18px 22px', marginBottom: 22 }}>
      <div className="between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="light" style={{ color: 'var(--lim)' }}>Cómo vienen los videos</div>
        <button className="chip lim" style={{ fontSize: 13, padding: '7px 14px' }} onClick={copy}>Copiar datos para el reporte</button>
      </div>
      {!withData.length ? <p style={{ fontWeight: 300, fontSize: 14.5, margin: '10px 0 0', lineHeight: 1.4 }}>Cuando publiques un video, pasalo a "Publicado", pegá el link y cargá los números (vistas, me gusta, guardados…). Acá vas a ver qué funciona y qué no.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginTop: 12 }}>
          <div><div style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-0.05em', lineHeight: .9 }}>{fmtN(total('views'))}</div><div style={{ fontWeight: 300, fontSize: 13, marginTop: 6 }}>vistas en {withData.length} videos · {fmtN(total('follows'))} seguidores nuevos{week.length ? ` · esta semana: ${fmtN(total('views', week))} vistas en ${week.length}` : ''}</div></div>
          <div><div className="light" style={{ color: '#fff', opacity: .7 }}>Lo que funcionó</div><div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{byViews[0].title}</div><div style={{ fontWeight: 300, fontSize: 13 }}>el más visto · {fmtN(num(byViews[0].metrics.views))}</div>{byEng[0] !== byViews[0] && <><div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{byEng[0].title}</div><div style={{ fontWeight: 300, fontSize: 13 }}>el que más interacción tuvo · {pct(eng(byEng[0]))}</div></>}</div>
          {withData.length > 1 && <div><div className="light" style={{ color: '#fff', opacity: .7 }}>Lo que no tanto</div><div style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>{byViews[byViews.length - 1].title}</div><div style={{ fontWeight: 300, fontSize: 13 }}>{fmtN(num(byViews[byViews.length - 1].metrics.views))} vistas · {pct(eng(byViews[byViews.length - 1]))} interacción</div></div>}
          {tagRank.length > 0 && <div><div className="light" style={{ color: '#fff', opacity: .7 }}>Por etiqueta (vistas promedio)</div>{tagRank.slice(0, 4).map(([t, avg, n]) => <div key={t} style={{ fontSize: 13.5, marginTop: 5 }}><b>#{t}</b> <span style={{ fontWeight: 300 }}>{fmtN(Math.round(avg))} · {n} {n === 1 ? 'video' : 'videos'}</span></div>)}</div>}
        </div>
      )}
    </div>
  )
}

export function ContentPanel({ say }) {
  const V = useTable('admin_content')
  const [open, setOpen] = useState(null) // { v, isNew }
  if (!V.rows) return <p className="body muted">Cargando…</p>
  const saveModal = async (f) => {
    if (open.isNew) { if (f.title?.trim()) await V.add({ ...f, title: f.title.trim(), position: 999 }, say) }
    else V.save(f, say)
  }
  return (<>
    <div className="between" style={{ marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
      <button className="chip on" style={{ padding: '10px 18px' }} onClick={() => setOpen({ v: { title: '', status: 'idea' }, isNew: true })}>+ Nueva idea</button>
    </div>
    <Report vids={V.rows} say={say} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(210px, 1fr))', gap: 12, alignItems: 'start', overflowX: 'auto', paddingBottom: 8 }}>
      {STAGES.map(([k, l]) => {
        const list = V.rows.filter((v) => v.status === k).sort((a, b) => (k === 'publicado' ? (b.published_at || '').localeCompare(a.published_at || '') : a.position - b.position))
        return (
          <section key={k} style={{ ...box, padding: 12, background: k === 'publicado' ? '#EEF3D0' : 'var(--cell)' }}>
            <div className="between" style={{ marginBottom: 10 }}><h2 style={{ ...h2, fontSize: 18 }}>{l}</h2><span className="light">{list.length}</span></div>
            <div style={{ display: 'grid', gap: 8 }}>
              {list.map((v) => <VideoCard key={v.id} v={v} save={(r) => V.save(r, say)} onOpen={() => setOpen({ v })} />)}
            </div>
          </section>
        )
      })}
    </div>
    {open && <VideoModal v={open.isNew ? open.v : V.rows.find((x) => x.id === open.v.id) || open.v} isNew={open.isNew} onSave={saveModal} onDelete={V.del} onClose={() => setOpen(null)} />}
  </>)
}

// ---------- PRESUPUESTO ----------
const FREQ = [['unico', 'pago único'], ['anual', 'por año'], ['mensual', 'por mes']]
export function BudgetPanel({ say }) {
  const B = useTable('admin_budget')
  const E = useTable('admin_expenses', 'spent_on')
  const [usd, setUsd] = useState(() => { try { return +localStorage.getItem('teca.usd') || 0 } catch { return 0 } })
  useEffect(() => { try { localStorage.setItem('teca.usd', String(usd || '')) } catch {} }, [usd])
  // Inversión del primer año = lo que ya gastaste (pagos reales) + lo que falta pagar (estimado, sin lo opcional)
  const cur = (r) => (r.currency === 'USD' ? 'USD' : 'ARS')
  const parts = useMemo(() => {
    const spent = { ARS: 0, USD: 0 }, left = { ARS: 0, USD: 0 }
    for (const r of E.rows || []) spent[cur(r)] += num(r.amount)
    for (const r of B.rows || []) { if (r.optional || r.paid) continue; left[cur(r)] += r.freq === 'mensual' ? num(r.amount) * 12 : num(r.amount) }
    return { spent, left }
  }, [B.rows, E.rows])
  const totals = { ARS: { year: parts.spent.ARS + parts.left.ARS }, USD: { year: parts.spent.USD + parts.left.USD } }
  async function setPaid(r) {
    if (!r.paid) {
      if (!num(r.amount)) return say('Ponele el monto antes de marcarlo como pagado')
      if (confirm(`¿Sumar "${r.concept}" a "Lo que ya gastaste" con la fecha de hoy?\n\nSi ya lo cargaste ahí, tocá Cancelar.`)) await E.add({ concept: r.concept, amount: num(r.amount), currency: cur(r), spent_on: new Date().toISOString().slice(0, 10) }, say)
    }
    B.save({ ...r, paid: !r.paid }, say)
  }
  if (!B.rows || !E.rows) return <p className="body muted">Cargando…</p>
  const groups = [...new Set(B.rows.map((r) => r.category))]
  const money = (n, c) => (c === 'USD' ? `USD ${n.toLocaleString('es-AR')}` : `$${Math.round(n).toLocaleString('es-AR')}`)
  const inArs = usd ? totals.ARS.year + totals.USD.year * usd : null
  const paidTxt = `Ya gastaste ${money(parts.spent.ARS, 'ARS')}${parts.spent.USD ? ` + ${money(parts.spent.USD, 'USD')}` : ''}. Falta pagar ${money(parts.left.ARS, 'ARS')}${parts.left.USD ? ` + ${money(parts.left.USD, 'USD')}` : ''}.`
  const td = { padding: '10px 8px', borderBottom: '1px solid rgba(20,18,16,.12)', verticalAlign: 'top', fontSize: 14 }
  return (<>
    <ExpensesPanel say={say} E={E} />
    <h2 style={{ ...h2, marginBottom: 4 }}>Inversión estimada</h2>
    <p style={{ ...sub, fontSize: 14, marginBottom: 14 }}>Lo que ya gastaste más lo que falta pagar: si cargás un gasto nuevo arriba, se suma solo. {paidTxt}</p>
    <div className="admin-grid" style={{ marginBottom: 22 }}>
      <div style={{ ...card('#E6F04A'), padding: '18px 20px' }}><div style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-0.05em', lineHeight: .9 }}>{money(totals.ARS.year, 'ARS')}</div><div className="light" style={{ color: 'var(--ink)', marginTop: 8 }}>en pesos · primer año</div></div>
      <div style={{ ...card('#A9C6F2'), padding: '18px 20px' }}><div style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-0.05em', lineHeight: .9 }}>{money(totals.USD.year, 'USD')}</div><div className="light" style={{ color: 'var(--ink)', marginTop: 8 }}>en dólares, primer año</div></div>
      <div style={{ ...card(), padding: '18px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 40, letterSpacing: '-0.05em', lineHeight: .9 }}>{inArs ? money(inArs, 'ARS') : '—'}</div>
        <div className="light" style={{ color: 'var(--ink)', marginTop: 8 }}>todo en pesos</div>
        <label className="row" style={{ gap: 6, marginTop: 8, fontWeight: 300, fontSize: 13 }}>dólar a $<input className="input" type="number" value={usd || ''} onChange={(e) => setUsd(+e.target.value)} placeholder="cotización" style={{ width: 110, padding: '6px 9px', fontSize: 14 }} /></label>
      </div>
    </div>
    <p style={{ fontWeight: 300, fontSize: 14, margin: '0 0 14px' }}>Montos estimados, solo vos (sin equipo). Lo marcado como opcional no suma al total. Lo que marcás como pagado pasa a “Lo que ya gastaste”.</p>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr>{['Concepto', 'Monto', '', 'Frecuencia', 'Estado', ''].map((h, i) => <th key={i} className="light" style={{ textAlign: 'left', padding: '0 8px 8px', fontSize: 10.5 }}>{h}</th>)}</tr></thead>
      <tbody>
        {groups.map((g) => (<Fragment key={g}>
          <tr><td colSpan={6} style={{ padding: '18px 8px 6px', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>{g}</td></tr>
          {B.rows.filter((r) => r.category === g).sort((a, b) => a.position - b.position).map((r) => (
            <tr key={r.id} style={{ opacity: r.optional ? .55 : 1 }}>
              <td style={td}><div style={{ fontWeight: 800 }}>{r.concept}</div>{r.note && <div style={{ fontWeight: 300, fontSize: 12.5, marginTop: 3, maxWidth: 480 }}>{r.note}</div>}</td>
              <td style={{ ...td, width: 130 }}><input className="input" type="number" defaultValue={r.amount ?? ''} onBlur={(e) => B.save({ ...r, amount: e.target.value === '' ? null : +e.target.value }, say)} style={{ padding: '7px 9px', fontSize: 14 }} /></td>
              <td style={{ ...td, width: 80 }}><select className="input" value={r.currency} onChange={(e) => B.save({ ...r, currency: e.target.value }, say)} style={{ padding: '7px 6px', fontSize: 13 }}><option>ARS</option><option>USD</option></select></td>
              <td style={{ ...td, width: 120 }}><select className="input" value={r.freq} onChange={(e) => B.save({ ...r, freq: e.target.value }, say)} style={{ padding: '7px 6px', fontSize: 13 }}>{FREQ.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
              <td style={{ ...td, width: 130 }}><button className={`chip ${r.paid ? 'on' : ''}`} style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setPaid(r)}>{r.paid ? 'pagado' : 'pendiente'}</button></td>
              <td style={{ ...td, width: 90 }}><button className="linkbtn" style={{ fontSize: 12 }} onClick={() => B.save({ ...r, optional: !r.optional }, say)}>{r.optional ? 'sumar' : 'opcional'}</button></td>
            </tr>
          ))}
        </Fragment>))}
      </tbody>
    </table>
    <button className="chip" style={{ marginTop: 14 }} onClick={() => { const c = prompt('¿Qué gasto querés sumar?'); if (c) B.add({ concept: c, category: 'Otros', currency: 'ARS', freq: 'unico', position: 999 }, say) }}>+ Sumar un gasto</button>
  </>)
}

// ---------- GASTOS (lo que ya pagaste) ----------
export function ExpensesPanel({ say, E: shared }) {
  const own = useTable('admin_expenses', 'spent_on')
  const E = shared || own
  const [f, setF] = useState({ concept: '', amount: '', currency: 'ARS', spent_on: new Date().toISOString().slice(0, 10) })
  if (!E.rows) return null
  const rows = [...E.rows].sort((a, b) => (b.spent_on || '').localeCompare(a.spent_on || ''))
  const tot = (c) => rows.filter((r) => r.currency === c).reduce((a, r) => a + num(r.amount), 0)
  const money = (n, c) => (c === 'USD' ? `USD ${n.toLocaleString('es-AR')}` : `$${Math.round(n).toLocaleString('es-AR')}`)
  async function add() {
    if (!f.concept.trim() || !f.amount) return say('Completá qué pagaste y cuánto')
    await E.add({ concept: f.concept.trim(), amount: +f.amount, currency: f.currency, spent_on: f.spent_on }, say)
    setF({ ...f, concept: '', amount: '' })
  }
  const td = { padding: '9px 8px', borderBottom: '1px solid rgba(20,18,16,.12)', fontSize: 14 }
  return (
    <section style={{ ...box, marginBottom: 28, background: '#F6F9C9' }}>
      <div className="between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div><h2 style={h2}>Lo que ya gastaste</h2><p style={sub}>Cada pago real, con su fecha.</p></div>
        <div className="row" style={{ gap: 18 }}>
          <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', lineHeight: 1 }}>{money(tot('ARS'), 'ARS')}</div><div className="light">en pesos</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', lineHeight: 1 }}>{money(tot('USD'), 'USD')}</div><div className="light">en dólares</div></div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...td, width: 110, fontWeight: 300 }}>{fmtD(r.spent_on)}</td>
              <td style={{ ...td, fontWeight: 800 }}>{r.concept}{r.note && <div style={{ fontWeight: 300, fontSize: 12.5 }}>{r.note}</div>}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>{money(num(r.amount), r.currency)}</td>
              <td style={{ ...td, width: 60, textAlign: 'right' }}><button className="linkbtn" style={{ fontSize: 12, color: '#B33' }} onClick={() => confirm('¿Borrar este gasto?') && E.del(r)}>borrar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <input className="input" type="date" value={f.spent_on} onChange={(e) => setF({ ...f, spent_on: e.target.value })} style={{ width: 'auto', padding: '9px 11px', fontSize: 14, background: '#fff' }} aria-label="Fecha" />
        <input className="input" value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} placeholder="Qué pagaste" style={{ flex: 1, minWidth: 180, padding: '9px 11px', fontSize: 14, background: '#fff' }} />
        <input className="input" type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Monto" style={{ width: 120, padding: '9px 11px', fontSize: 14, background: '#fff' }} />
        <select className="input" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} style={{ width: 'auto', padding: '9px 8px', fontSize: 14, background: '#fff' }}><option>ARS</option><option>USD</option></select>
        <button className="chip on" onClick={add}>Sumar gasto</button>
      </div>
    </section>
  )
}

// ---------- DOCUMENTOS (números de trámite, comprobantes, datos) ----------
export function DocsPanel({ say }) {
  const D = useTable('admin_docs', 'doc_date')
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ title: '', number: '', category: 'Marca', doc_date: new Date().toISOString().slice(0, 10), link: '', note: '' })
  if (!D.rows) return <p className="body muted">Cargando…</p>
  const cats = [...new Set(['Marca', 'Legales', 'Dominio y cuentas', 'Tiendas', ...D.rows.map((r) => r.category)])]
  const add = async () => { if (!f.title.trim()) return; await D.add({ ...f, title: f.title.trim(), link: f.link || null, note: f.note || null, number: f.number || null }, say); setAdding(false); setF({ ...f, title: '', number: '', link: '', note: '' }) }
  const copy = (t) => navigator.clipboard?.writeText(t).then(() => say('Copiado'))
  return (<>
    <div className="between" style={{ marginBottom: 16 }}><p style={{ ...sub, margin: 0, fontSize: 14 }}>Números de trámite, comprobantes, cuentas y fechas importantes. Todo en un solo lugar.</p><button className="chip on" onClick={() => setAdding(!adding)}>{adding ? 'Cancelar' : '+ Sumar documento'}</button></div>
    {adding && (
      <div style={{ ...box, marginBottom: 18, display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
          <Field label="Qué es"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} style={{ padding: '9px 11px', fontSize: 14, background: '#fff' }} /></Field>
          <Field label="Número"><input className="input" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} style={{ padding: '9px 11px', fontSize: 14, background: '#fff' }} /></Field>
          <Field label="Categoría"><input className="input" list="doccats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} style={{ padding: '9px 11px', fontSize: 14, background: '#fff' }} /><datalist id="doccats">{cats.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Fecha"><input className="input" type="date" value={f.doc_date} onChange={(e) => setF({ ...f, doc_date: e.target.value })} style={{ padding: '9px 11px', fontSize: 14, background: '#fff' }} /></Field>
        </div>
        <Field label="Link (comprobante, carpeta de Drive…)"><input className="input" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://…" style={{ padding: '9px 11px', fontSize: 14, background: '#fff' }} /></Field>
        <Field label="Notas"><textarea className="input" rows={2} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} style={{ padding: '9px 11px', fontSize: 14, background: '#fff', fontFamily: 'inherit', fontWeight: 300 }} /></Field>
        <div><button className="chip on" onClick={add}>Guardar</button></div>
      </div>
    )}
    <div style={{ display: 'grid', gap: 22 }}>
      {cats.filter((c) => D.rows.some((r) => r.category === c)).map((c) => (
        <section key={c}>
          <h2 style={{ ...h2, fontSize: 19, marginBottom: 10 }}>{c}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
            {D.rows.filter((r) => r.category === c).sort((a, b) => (b.doc_date || '').localeCompare(a.doc_date || '')).map((r) => (
              <div key={r.id} style={card()}>
                <div className="between" style={{ alignItems: 'flex-start', gap: 8 }}><div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{r.title}</div><span className="light" style={{ whiteSpace: 'nowrap' }}>{fmtD(r.doc_date)}</span></div>
                {r.number && <button onClick={() => copy(r.number)} title="Copiar" style={{ marginTop: 8, border: 0, background: 'var(--cell)', borderRadius: 10, padding: '7px 10px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: 'inherit' }}>{r.number} ⧉</button>}
                {r.note && <div style={{ fontWeight: 300, fontSize: 13, marginTop: 8, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{r.note}</div>}
                <div className="between" style={{ marginTop: 8 }}>{r.link ? <a href={r.link} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 800 }}>Abrir ↗</a> : <span />}<button className="linkbtn" style={{ fontSize: 12, color: '#B33' }} onClick={() => confirm('¿Borrar este documento?') && D.del(r)}>borrar</button></div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  </>)
}
