import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar } from '../ui.jsx'
import { TopBar } from './Home.jsx'

export function Ranking({ ctx }) {
  const [period, setPeriod] = useState('year')
  const [rows, setRows] = useState(null)
  useEffect(() => {
    const now = new Date()
    const since = period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : period === 'year' ? new Date(now.getFullYear(), 0, 1) : null
    setRows(null)
    sb.rpc('ranking', { since: since ? since.toISOString().slice(0, 10) : null }).then(({ data }) => setRows(data || []))
  }, [period, ctx.items.length])
  const name = (r) => (r.id === ctx.uid ? 'Vos' : r.name)
  const top = (rows || []).slice(0, 3)
  const rest = (rows || []).slice(3)
  const open = (r) => (r.id === ctx.uid ? ctx.tab('me') : ctx.go('friend', { person: r }))
  const Pod = ({ r, pos, bg }) => !r ? <div style={{ flex: 1 }} /> : (
    <button onClick={() => open(r)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', border: 0, background: 'none', padding: 0 }}>
      <Avatar p={r} s={pos === 1 ? 60 : 50} />
      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 6 }}>{name(r)}</div>
      <div style={{ width: '100%', height: { 1: 120, 2: 88, 3: 66 }[pos], marginTop: 8, background: bg, borderRadius: '14px 14px 4px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: bg === '#fff' ? 'inset 0 0 0 1.5px #141210' : 'none' }}>
        <div style={{ fontWeight: 800, fontSize: pos === 1 ? 44 : 34, letterSpacing: '-0.04em', lineHeight: .9 }}>{r.total}</div>
        <div className="light" style={{ color: 'var(--ink)' }}>#{pos}</div>
      </div>
    </button>
  )
  return (
    <div>
      <TopBar title="Ranking" ctx={ctx} coins={false} />
      <div className="pad light">General · todos los que usan teca</div>
      <div className="row" style={{ gap: 6, padding: '12px 20px 0' }}>
        <button className="chip on">general</button>
        <span className="light" style={{ marginLeft: 6, letterSpacing: '.1em' }}>por club, muy pronto</span>
      </div>
      <div className="row" style={{ gap: 6, padding: '8px 20px 0' }}>
        {[['month', 'mes'], ['year', 'año'], ['all', 'siempre']].map(([k, l]) => <button key={k} className={`chip ${period === k ? 'lim' : ''}`} onClick={() => setPeriod(k)}>{l}</button>)}
      </div>
      {rows === null ? <p className="pad body muted" style={{ marginTop: 30 }}>Cargando…</p> : (<>
        <div className="row" style={{ alignItems: 'flex-end', gap: 8, padding: '22px 20px 0' }}>
          <Pod r={top[1]} pos={2} bg="#A9C6F2" /><Pod r={top[0]} pos={1} bg="#E6F04A" /><Pod r={top[2]} pos={3} bg="#fff" />
        </div>
        <div style={{ marginTop: 10 }}>
          {rest.map((r, i) => (
            <button key={r.id} onClick={() => open(r)} className="listrow" style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', textAlign: 'left', background: r.id === ctx.uid ? 'var(--cell)' : '#fff' }}>
              <span style={{ width: 24, fontWeight: 800, fontSize: 18 }}>{i + 4}</span><Avatar p={r} s={36} />
              <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{name(r)}<div className="light" style={{ marginTop: 3, letterSpacing: '.1em' }}>{r.books} libros · {r.movies} pelis · {r.shows} series</div></div>
              <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em' }}>{r.total}</span>
            </button>
          ))}
        </div>
      </>)}
    </div>
  )
}
