import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'

// Pantallas donde va (o va a ir) publicidad, con el precio por mil de referencia (punto medio de cada rango, en US$)
const SPACES = [
  ['conecta', 'Conecta · tarjeta grande en Descubrí', 20],
  ['sumaste', 'Hoja ¡Sumaste N tecoins!', 16],
  ['tecoins', 'Pantalla de Tecoins', 11],
  ['buscador', 'Buscador', 8],
  ['detalle', 'Detalle del título (Conseguilo en la librería)', null],
  ['eventos', 'Descubrí: eventos', null],
]
const PERIODS = [[7, '7 días'], [28, '28 días'], [90, '90 días']]
const num = (n, d = 0) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d })

export function ImpressionsPanel({ say }) {
  const [days, setDays] = useState(28)
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const [users, setUsers] = useState(5000)
  useEffect(() => {
    setRows(null); setErr('')
    sb.rpc('admin_ad_report', { p_days: days }).then(({ data, error }) => {
      if (error) { setErr(error.message); setRows([]); return }
      setRows(Array.isArray(data) ? data : [])
    })
  }, [days])

  const by = Object.fromEntries((rows || []).map((r) => [r.space, r]))
  const active = Number(by._activos?.people || 0)
  const perMonth = (n) => (active ? (Number(n) / active) * (30 / days) : 0) // impresiones por persona por mes
  const lines = SPACES.map(([k, label, cpm]) => {
    const imp = Number(by[k]?.impressions || 0), ppl = Number(by[k]?.people || 0)
    const per = perMonth(imp)
    const proj = per * Number(users || 0)
    return { k, label, cpm, imp, ppl, per, proj, price: cpm ? (proj / 1000) * cpm : null }
  })
  const text = () => ['Espacio\tImpresiones\tPersonas\tPor persona por mes\tProyección mensual con ' + users + ' usuarios\tUS$ por mes (precio medio)']
    .concat(lines.map((l) => [l.label, l.imp, l.ppl, num(l.per, 1), num(l.proj), l.price == null ? '' : num(l.price)].join('\t')))
    .concat([`Personas activas en el período (${days} días): ${active}`]).join('\n')
  async function copy() { try { await navigator.clipboard.writeText(text()); say('Copiado: pegalo en el chat con Claude') } catch { say('No se pudo copiar') } }

  return (
    <div>
      <p className="body" style={{ maxWidth: 640 }}>Cuántas veces se ve cada pantalla donde va a ir publicidad. No incluye a las cuentas de administración. Sirve para saber qué números mostrarle a una marca.</p>
      <div className="row" style={{ gap: 6, margin: '16px 0 14px', flexWrap: 'wrap' }}>
        {PERIODS.map(([d, l]) => <button key={d} className={`chip ${days === d ? 'on' : ''}`} onClick={() => setDays(d)}>{l}</button>)}
        <span className="muted" style={{ marginLeft: 10, fontSize: 14 }}>Proyectar con</span>
        <input className="input" style={{ width: 110 }} type="number" min="0" value={users} onChange={(e) => setUsers(e.target.value)} />
        <span className="muted" style={{ fontSize: 14 }}>usuarios activos</span>
      </div>
      {err ? <div className="card" style={{ padding: 18 }}><b>Todavía no está lista la base.</b><p className="body muted" style={{ fontSize: 14, marginTop: 6 }}>Falta correr el SQL 21_impresiones (o ACTUALIZAR.sql) en Supabase. Detalle: {err}</p></div>
        : !rows ? <p className="body muted">Cargando…</p> : (<>
          <div className="admin-grid" style={{ marginBottom: 18 }}>
            <div className="card" style={{ padding: 18 }}><div style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-0.04em' }}>{num(active)}</div><div className="muted" style={{ fontSize: 13 }}>personas con actividad en {days} días</div></div>
            <div className="card" style={{ padding: 18 }}><div style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-0.04em' }}>{num(by._activos?.impressions || 0)}</div><div className="muted" style={{ fontSize: 13 }}>impresiones en total</div></div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Espacio</th><th>Impresiones</th><th>Personas</th><th>Por persona por mes</th><th>Proyección mensual</th><th>US$ por mes</th></tr></thead>
              <tbody>{lines.map((l) => <tr key={l.k}><td><b>{l.label}</b></td><td>{num(l.imp)}</td><td>{num(l.ppl)}</td><td>{num(l.per, 1)}</td><td>{num(l.proj)}</td><td>{l.price == null ? <span className="muted">—</span> : num(l.price)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 10, maxWidth: 640 }}>“Por persona por mes” es lo que se ve cada persona activa, llevado a 30 días. La proyección multiplica eso por los usuarios que pongas arriba. Los US$ usan el punto medio del precio por mil de la presentación; es una estimación. Buscador y eventos todavía no existen en la app, por eso están en cero.</p>
          <div style={{ marginTop: 14 }}><button className="btn" onClick={copy}>Copiar el reporte</button></div>
        </>)}
    </div>
  )
}
