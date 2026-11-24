import { useEffect, useMemo, useState } from 'react'
import { sb } from '../supabase.js'

const DAY = 864e5

// Las mismas metas que el documento del plan de lanzamiento: piso = mínimo para pasar a tiendas, meta = objetivo al 22/4/2027
export const METAS = [
  { k: 'registrados', label: 'Personas registradas al 22/4', piso: 700, meta: 1200, unidad: 'n' },
  { k: 'titulo24', label: 'Cargan un título en las primeras 24 h', piso: 50, meta: 65, unidad: '%' },
  { k: 'tres7', label: 'Tienen 3 títulos o más a los 7 días', piso: 30, meta: 45, unidad: '%' },
  { k: 'amigo', label: 'Sumaron al menos un amigo', piso: 35, meta: 50, unidad: '%' },
  { k: 'dia1', label: 'Vuelven al día siguiente', piso: 30, meta: 35, unidad: '%', aprox: true },
  { k: 'dia7', label: 'Vuelven a los 7 días', piso: 10, meta: 15, unidad: '%', aprox: true },
  { k: 'dia30', label: 'Vuelven a los 30 días', piso: 6, meta: 10, unidad: '%', aprox: true },
  { k: 'encuesta', label: 'Responden la encuesta', piso: 20, meta: 30, unidad: '%', pendiente: 'Se cuenta en Tally, todavía no está conectado al panel' },
  { k: 'edad', label: 'Cargaron edad y lugar', piso: 50, meta: 70, unidad: '%', pendiente: 'Los datos privados todavía no llegan al panel' },
]

// Calcula cada meta a partir de las personas (sin la cuenta de la fundadora) y de sus títulos
export function calcularMetas(users, items, ahora = Date.now()) {
  const gente = users.filter((u) => !u.is_founder)
  const primero = {}
  const porPersona = {}
  for (const it of items) {
    const t = new Date(it.created_at).getTime()
    if (!primero[it.user_id] || t < primero[it.user_id]) primero[it.user_id] = t
    if (!porPersona[it.user_id]) porPersona[it.user_id] = []
    porPersona[it.user_id].push(t)
  }
  const alta = (u) => new Date(u.signed_up).getTime()
  const visto = (u) => (u.last_seen ? new Date(u.last_seen).getTime() : 0)
  const porcentaje = (elegibles, cumplen) => (elegibles.length ? Math.round((cumplen.length / elegibles.length) * 100) : null)

  const h24 = gente.filter((u) => ahora - alta(u) >= DAY)
  const d7 = gente.filter((u) => ahora - alta(u) >= 7 * DAY)
  const d30 = gente.filter((u) => ahora - alta(u) >= 30 * DAY)
  const d1 = gente.filter((u) => ahora - alta(u) >= DAY)

  const r = {
    registrados: gente.length,
    titulo24: porcentaje(h24, h24.filter((u) => primero[u.id] && primero[u.id] - alta(u) <= DAY)),
    tres7: porcentaje(d7, d7.filter((u) => (porPersona[u.id] || []).filter((t) => t <= alta(u) + 7 * DAY).length >= 3)),
    amigo: gente.length ? Math.round((gente.filter((u) => Number(u.friends) > 0).length / gente.length) * 100) : null,
    dia1: porcentaje(d1, d1.filter((u) => visto(u) >= alta(u) + DAY)),
    dia7: porcentaje(d7, d7.filter((u) => visto(u) >= alta(u) + 7 * DAY)),
    dia30: porcentaje(d30, d30.filter((u) => visto(u) >= alta(u) + 30 * DAY)),
  }
  return r
}

function estado(valor, m) {
  if (m.pendiente) return { txt: 'Pendiente', sub: m.pendiente, color: '#D9D6CF' }
  if (valor === null || valor === undefined) return { txt: 'Sin medir', sub: 'Todavía no pasó el tiempo', color: '#D9D6CF' }
  if (valor >= m.meta) return { txt: 'Meta', sub: 'Llegamos al objetivo', color: 'var(--lim)' }
  if (valor >= m.piso) return { txt: 'Piso', sub: 'Pasamos el mínimo, falta llegar a la meta', color: '#A9C6F2' }
  return { txt: 'Falta', sub: 'Por debajo del mínimo', color: '#F3D9CF' }
}

export function MetasPanel({ users }) {
  const [items, setItems] = useState(null)
  useEffect(() => {
    sb.from('items').select('user_id,created_at').limit(5000).then(({ data }) => setItems(data || []))
  }, [])
  const valores = useMemo(() => (users && items ? calcularMetas(users, items) : null), [users, items])

  if (!valores) return <p className="body muted">Cargando…</p>

  return (
    <div style={{ maxWidth: 980 }}>
      <div className="light">Metas de la beta · al 22/4/2027</div>
      <p className="body muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.45 }}>
        "Piso" es lo mínimo para pasar a las tiendas. "Meta" es lo que queremos llegar. Las personas cuentan sin tu cuenta de fundadora.
      </p>

      <div style={{ marginTop: 22, borderTop: '1.5px solid var(--ink)' }}>
        <div className="row" style={{ gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)', fontWeight: 800, fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <span style={{ flex: 1 }}>Métrica</span>
          <span style={{ width: 70, textAlign: 'right' }}>Piso</span>
          <span style={{ width: 70, textAlign: 'right' }}>Meta</span>
          <span style={{ width: 90, textAlign: 'right' }}>Vamos</span>
          <span style={{ width: 150 }}>Estado</span>
        </div>
        {METAS.map((m) => {
          const v = valores[m.k]
          const e = estado(v, m)
          const shown = m.unidad === 'n' ? (v ?? 0) : v === null || v === undefined || m.pendiente ? '—' : `${v}%`
          return (
            <div key={m.k} className="row" style={{ gap: 12, padding: '14px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.02em' }}>
                  {m.label}{m.aprox ? <span className="muted" style={{ fontWeight: 300, fontSize: 12 }}> · aprox.</span> : null}
                </span>
              </span>
              <span style={{ width: 70, textAlign: 'right', fontWeight: 300 }}>{m.unidad === 'n' ? m.piso : `${m.piso}%`}</span>
              <span style={{ width: 70, textAlign: 'right', fontWeight: 300 }}>{m.unidad === 'n' ? m.meta : `${m.meta}%`}</span>
              <span style={{ width: 90, textAlign: 'right', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>{shown}</span>
              <span style={{ width: 150 }}>
                <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 99, background: e.color, boxShadow: 'inset 0 0 0 1.5px var(--ink)', fontWeight: 800, fontSize: 12.5 }}>{e.txt}</span>
                <span className="muted" style={{ display: 'block', fontSize: 11.5, marginTop: 4, lineHeight: 1.3 }}>{e.sub}</span>
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="light">Avance hacia 1.200 personas</div>
        <div style={{ marginTop: 10, height: 18, borderRadius: 99, boxShadow: 'inset 0 0 0 1.5px var(--ink)', overflow: 'hidden', background: '#fff' }}>
          <div style={{ width: `${Math.min(100, (valores.registrados / 1200) * 100)}%`, height: '100%', background: 'var(--lim)' }} />
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{valores.registrados} de 1.200. El piso es 700.</p>
      </div>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 22, lineHeight: 1.5 }}>
        Las retenciones salen del último inicio de sesión: si una persona usa la app sin volver a iniciar sesión, puede contarse menos de lo real. Las de 1, 7 y 30 días solo se miden sobre quienes llevan ese tiempo registrados. Los invitados por persona todavía no se ven desde el panel.
      </p>
    </div>
  )
}
