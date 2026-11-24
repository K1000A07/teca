import { useEffect, useMemo, useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar, Coin, Cover, Stars } from '../ui.jsx'
import { KINDS, timeAgo } from '../lib.js'
import { GiftsPanel } from './Profile.jsx'
import { Review } from './Detail.jsx'
import { BudgetPanel, DocsPanel } from './Work.jsx'
import { ImpressionsPanel } from './Impressions.jsx'
import { MetasPanel } from './Metas.jsx'

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—')
const DAY = 864e5
// Qué función puede ver cada persona del equipo (la fundadora tiene todas)
export const PERMS = [
  ['usuarios', 'Usuarios y actividad', 'Resumen, lista de personas con su mail y lo que cargan, edad y lugar'],
  ['impresiones', 'Impresiones', 'Cuántas veces se ve cada pantalla con publicidad'],
  ['avisos', 'Notificaciones', 'Mandar avisos al celu de todas las personas'],
  ['regalos', 'Links de regalo', 'Crear y ver links de regalo'],
  ['presupuesto', 'Presupuesto', 'Inversión estimada y gastos'],
  ['docs', 'Documentos', 'Marca, trámites y papeles'],
]

function Switch({ on, onChange, label, sub }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="row" style={{ width: '100%', gap: 14, padding: '11px 0', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.02em' }}>{label}</span><span style={{ display: 'block', fontWeight: 300, fontSize: 12.5, marginTop: 1 }}>{sub}</span></span>
      <span style={{ flex: 'none', width: 46, height: 28, borderRadius: 99, background: on ? 'var(--lim)' : '#D9D6CF', boxShadow: 'inset 0 0 0 1.5px var(--ink)', position: 'relative', transition: 'background .15s' }}><span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 99, background: 'var(--ink)', transition: 'left .15s' }} /></span>
    </button>
  )
}

function PermsModal({ u, onClose, onSaved, say }) {
  const [perms, setPerms] = useState(u.admin_perms || [])
  const [busy, setBusy] = useState(false)
  const isNew = !u.admin_perms
  const toggle = (k, v) => setPerms((p) => (v ? [...new Set([...p, k])] : p.filter((x) => x !== k)))
  async function save() {
    setBusy(true)
    const { error } = await sb.rpc('admin_set_access', { p_user: u.id, p_perms: perms })
    setBusy(false)
    if (error) return say(error.message || 'No se pudo guardar')
    say(isNew ? 'Ya tiene acceso al panel' : 'Permisos guardados'); onSaved()
  }
  async function remove() {
    if (!confirm(`¿Sacarle a ${u.name || u.email} el acceso al panel?`)) return
    setBusy(true)
    const { error } = await sb.rpc('admin_remove_access', { p_user: u.id })
    setBusy(false)
    if (error) return say(error.message || 'No se pudo sacar')
    say('Ya no tiene acceso'); onSaved()
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,18,16,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Permisos" style={{ background: '#fff', borderRadius: 26, padding: 24, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 0 0 1.5px var(--ink), 0 30px 60px -20px rgba(0,0,0,.5)' }}>
        <div className="light">{isNew ? 'Sumar al equipo' : 'Permisos del equipo'}</div>
        <h2 className="h" style={{ fontSize: 28, marginTop: 4 }}>{u.name || u.email}</h2>
        <p className="body" style={{ fontSize: 14, marginTop: 4 }}>Prendé lo que puede ver y usar en el panel. Vos siempre tenés acceso a todo y nadie más puede cambiar esto.</p>
        <div style={{ marginTop: 10 }}>{PERMS.map(([k, l, d]) => <Switch key={k} on={perms.includes(k)} onChange={(v) => toggle(k, v)} label={l} sub={d} />)}</div>
        <div className="between" style={{ marginTop: 12 }}>
          <button type="button" className="linkbtn" onClick={() => setPerms(perms.length === PERMS.length ? [] : PERMS.map(([k]) => k))}>{perms.length === PERMS.length ? 'Apagar todo' : 'Prender todo'}</button>
          {!isNew && <button type="button" className="linkbtn" style={{ color: '#B33' }} onClick={remove} disabled={busy}>Sacar del equipo</button>}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 18 }}>
          <button className="btn" style={{ flex: 1, width: 'auto' }} onClick={save} disabled={busy}>{busy ? 'Un segundo…' : isNew ? 'Dar acceso' : 'Guardar'}</button>
          <button className="btn white" style={{ width: 'auto', padding: '0 22px' }} onClick={onClose}>Cancelar</button>
        </div>
        {isNew && !perms.length && <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>Si no prendés nada, entra al panel pero no ve nada.</p>}
      </div>
    </div>
  )
}

function RowMenu({ m, onPick, onClose }) {
  const has = !!m.u.admin_perms
  const item = (l, f, danger) => <button type="button" onClick={f} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'none', padding: '11px 16px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', color: danger ? '#B33' : 'var(--ink)' }}>{l}</button>
  return (
    <div onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', left: Math.min(m.x, window.innerWidth - 230), top: Math.min(m.y, window.innerHeight - 120), width: 220, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 1.5px var(--ink), 0 18px 36px -12px rgba(0,0,0,.4)' }}>
        <div className="light" style={{ padding: '10px 16px 2px' }}>{m.u.name || m.u.email}</div>
        {item(has ? 'Cambiar permisos…' : 'Agregar al equipo…', () => onPick(m.u))}
      </div>
    </div>
  )
}

function Stat({ n, label, sub, bg = '#fff' }) {
  return (
    <div style={{ background: bg, borderRadius: 22, padding: '18px 20px', boxShadow: bg === '#fff' ? 'inset 0 0 0 1.5px var(--ink)' : 'none' }}>
      <div style={{ fontWeight: 800, fontSize: 52, letterSpacing: '-0.05em', lineHeight: .9 }}>{n}</div>
      <div className="light" style={{ color: 'var(--ink)', marginTop: 8 }}>{label}</div>
      {sub && <div style={{ fontWeight: 300, fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function Bars({ items }) {
  const days = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * DAY); d.setHours(0, 0, 0, 0); return d })
  const counts = days.map((d) => items.filter((it) => { const t = new Date(it.created_at); return t >= d && t < new Date(d.getTime() + DAY) }).length)
  const max = Math.max(1, ...counts)
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="between"><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>Títulos cargados por día</span><span className="light">últimos 14 días</span></div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, marginTop: 18 }}>
        {counts.map((c, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }} title={`${days[i].toLocaleDateString('es-AR')}: ${c}`}>
            <span style={{ fontWeight: 800, fontSize: 11 }}>{c || ''}</span>
            <div style={{ width: '100%', height: Math.max(3, (c / max) * 100), background: i === 13 ? 'var(--lim)' : 'var(--cel)', borderRadius: 6, boxShadow: i === 13 ? 'inset 0 0 0 1.5px var(--ink)' : 'none' }} />
            <span style={{ fontWeight: 300, fontSize: 10, color: 'var(--gris)' }}>{days[i].getDate()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserRow({ u, open, onToggle, canManage, onMenu }) {
  const [items, setItems] = useState(null)
  useEffect(() => { if (open && !items) sb.from('items').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).then(({ data }) => setItems(data || [])) }, [open])
  const p = { name: u.name || u.email, username: u.username, emoji: u.emoji, color: u.color || '#EEE', avatar_url: u.avatar_url }
  return (<>
    <tr onClick={onToggle} onContextMenu={canManage && !u.is_founder ? (e) => { e.preventDefault(); onMenu(u, e.clientX, e.clientY) } : undefined} style={{ cursor: 'pointer', background: open ? 'var(--cell)' : undefined }}>
      <td><div className="row" style={{ gap: 10 }}><Avatar p={p} s={34} /><div><div style={{ fontWeight: 800 }}>{u.name || <span className="muted">sin perfil</span>}{u.is_founder ? <span className="tape" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 8 }}>FUNDADORA</span> : u.admin_perms ? <span className="tape" style={{ fontSize: 9, padding: '2px 6px', marginLeft: 8, background: 'var(--cel)' }}>EQUIPO</span> : null}</div><div className="muted" style={{ fontSize: 12.5 }}>{u.username ? '@' + u.username : ''}</div></div></div></td>
      <td style={{ fontWeight: 300 }}>{u.email}</td>
      <td>{fmt(u.signed_up)}</td>
      <td>{u.last_seen ? timeAgo(u.last_seen) : '—'}</td>
      <td><b>{u.titles}</b> <span className="muted" style={{ fontSize: 12 }}>· {u.books}L {u.movies}P {u.shows}S</span></td>
      <td><span className="row" style={{ gap: 4 }}><Coin s={14} />{u.coins}</span></td>
      <td>{u.friends}</td>
      <td style={{ fontWeight: 300, fontSize: 12.5 }}>{u.gift_code || '—'}</td>
      {canManage && <td style={{ width: 40, textAlign: 'right' }}>{!u.is_founder && <button type="button" aria-label="Más opciones" className="linkbtn" style={{ fontSize: 20, padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenu(u, r.left - 180, r.bottom + 4) }}>⋯</button>}</td>}
    </tr>
    {open && (
      <tr><td colSpan={9} style={{ background: 'var(--cell)', padding: '6px 16px 18px' }}>
        {items === null ? 'Cargando…' : !items.length ? <span className="muted">Todavía no cargó nada.</span> : (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingTop: 6 }}>
            {items.map((it) => <div key={it.id} style={{ flex: 'none', width: 92 }}><Cover it={it} w={92} /><div style={{ fontWeight: 800, fontSize: 12.5, marginTop: 6, lineHeight: 1.1 }}>{it.title}</div><div className="muted" style={{ fontSize: 11 }}>{KINDS[it.kind].label} · {fmt(it.created_at)}</div></div>)}
          </div>
        )}
      </td></tr>
    )}
  </>)
}

export function AdminApp({ session, profile, say }) {
  const [tab, setTab] = useState('resumen')
  const [users, setUsers] = useState(null)
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const [kind, setKind] = useState('all')
  const [access, setAccess] = useState(null)
  const [menu, setMenu] = useState(null)
  const [perms, setPerms] = useState(null)
  const ALL = PERMS.map(([k]) => k)
  // Qué puede hacer esta cuenta en el panel (si todavía no se corrió el SQL 23, vale lo de antes: administradora = todo)
  useEffect(() => {
    sb.rpc('my_access').then(({ data, error }) => setAccess(!error && data ? data : { founder: !!profile?.is_admin, perms: profile?.is_admin ? ALL : [], legacy: true }))
  }, [profile?.is_admin])
  const can = (k) => !!access && (access.founder || access.perms.includes(k))
  const hasAccess = !!access && (access.founder || access.perms.length > 0)
  const loadUsers = () => sb.rpc('admin_users').then(({ data, error }) => setUsers(error || !Array.isArray(data) ? [] : data))
  useEffect(() => {
    if (!access || !can('usuarios')) return
    loadUsers()
    sb.from('items').select('*').order('created_at', { ascending: false }).limit(500).then(({ data }) => setItems(data || []))
  }, [access])
  const byId = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u])), [users])

  if (!access) return <p className="body muted" style={{ padding: 40 }}>Cargando…</p>
  if (!hasAccess) return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
      <div className="serif" style={{ fontSize: 80, lineHeight: .8 }}>teca</div>
      <h1 className="h" style={{ fontSize: 30, marginTop: 24 }}>Esta parte es solo para administración</h1>
      <p className="body" style={{ marginTop: 10 }}>Tu cuenta ({session.user.email}) no tiene acceso al panel.</p>
      <a href="/app" className="btn" style={{ marginTop: 24, textDecoration: 'none' }}>Ir a mi teca</a>
    </div>
  )

  const week = Date.now() - 7 * DAY
  const filteredUsers = (users || []).filter((u) => !q || [u.name, u.username, u.email].some((x) => (x || '').toLowerCase().includes(q.toLowerCase())))
  const feed = (items || []).filter((i) => kind === 'all' || i.kind === kind)
  // Dos mundos: la app (lo que pasa adentro de teca) y el tablero de trabajo (lo que hacés vos)
  const NEED = { resumen: 'usuarios', metas: 'usuarios', usuarios: 'usuarios', actividad: 'usuarios', impresiones: 'impresiones', avisos: 'avisos', links: 'regalos', presupuesto: 'presupuesto', docs: 'docs' }
  const GROUPS = {
    app: [['resumen', 'Resumen'], ['metas', 'Metas'], ['usuarios', 'Usuarios'], ['actividad', 'Actividad'], ['impresiones', 'Impresiones'], ['avisos', 'Notificaciones'], ['links', 'Links de regalo']].filter(([k]) => can(NEED[k])),
    work: [['presupuesto', 'Presupuesto'], ['docs', 'Documentos']].filter(([k]) => can(NEED[k])),
  }
  const firstTab = GROUPS.app[0]?.[0] || GROUPS.work[0]?.[0]
  const mine = [...GROUPS.app, ...GROUPS.work].some(([k]) => k === tab)
  if (!mine) { if (firstTab) setTimeout(() => setTab(firstTab)); return null }
  const group = GROUPS.work.some(([k]) => k === tab) ? 'work' : 'app'
  const T = GROUPS[group]
  return (
    <div className="admin">
      <header className="between" style={{ flexWrap: 'wrap', gap: 16, padding: '28px 0 8px' }}>
        <div className="row" style={{ gap: 14, alignItems: 'baseline' }}><span className="serif" style={{ fontSize: 54, lineHeight: .8 }}>teca</span><span className="tape" style={{ fontSize: 11, padding: '5px 9px' }}>PANEL</span></div>
        <div className="row" style={{ gap: 12 }}>
          <a href="/app" className="chip" style={{ textDecoration: 'none' }}>Ir a la app</a>
          <Avatar p={profile} s={38} />
          <button className="linkbtn" style={{ fontWeight: 300 }} onClick={() => sb.auth.signOut()}>Salir</button>
        </div>
      </header>
      <div className="row" style={{ gap: 0, marginTop: 14, background: 'var(--cell)', borderRadius: 99, padding: 4, width: 'fit-content' }}>
        {[['app', 'La app'], ['work', 'Tablero de trabajo']].filter(([g]) => GROUPS[g].length).map(([g, l]) => <button key={g} onClick={() => group !== g && setTab(GROUPS[g][0][0])} style={{ border: 0, borderRadius: 99, padding: '11px 22px', fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.02em', cursor: 'pointer', background: group === g ? 'var(--ink)' : 'transparent', color: group === g ? 'var(--lim)' : 'var(--ink)' }}>{l}</button>)}
      </div>
      <nav className="row" style={{ gap: 4, padding: '14px 0 22px', flexWrap: 'wrap', borderBottom: '1.5px solid rgba(20,18,16,.12)', marginBottom: 24 }}>{T.map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ border: 0, background: 'none', padding: '8px 12px', fontWeight: tab === k ? 800 : 300, fontSize: 15, cursor: 'pointer', color: 'var(--ink)', boxShadow: tab === k ? 'inset 0 -3px 0 var(--ink)' : 'none' }}>{l}</button>)}</nav>

      {tab === 'presupuesto' ? <BudgetPanel say={say} /> : tab === 'docs' ? <DocsPanel say={say} /> : tab === 'impresiones' ? <ImpressionsPanel say={say} /> : tab === 'avisos' ? <PushPanel session={session} say={say} /> : tab === 'metas' ? <MetasPanel users={users} /> : (!users || !items) && tab !== 'links' ? <p className="body muted">Cargando…</p> : tab === 'resumen' ? (<>
        <div className="admin-grid">
          <Stat n={users.length} label="Personas" sub={`${users.filter((u) => new Date(u.signed_up) > week).length} se sumaron esta semana`} bg="#E6F04A" />
          <Stat n={items.length} label="Títulos cargados" sub={`${items.filter((i) => new Date(i.created_at) > week).length} esta semana`} bg="#A9C6F2" />
          <Stat n={users.filter((u) => u.last_seen && new Date(u.last_seen) > week).length} label="Activos" sub="entraron en los últimos 7 días" />
          <Stat n={users.filter((u) => u.gift_code).length} label="Con regalo" sub="entraron con un link de regalo" bg="#E3EDFB" />
        </div>
        <div style={{ marginTop: 18 }}><Bars items={items} /></div>
        <div className="admin-two" style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', marginBottom: 6 }}>Últimos en sumarse</div>
            {users.slice(0, 8).map((u) => <div key={u.id} className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}><Avatar p={{ ...u, color: u.color || '#EEE' }} s={30} /><div style={{ flex: 1 }}><b>{u.name || u.email}</b> <span className="muted" style={{ fontSize: 13 }}>{u.username ? '@' + u.username : 'sin perfil todavía'}</span></div><span className="muted" style={{ fontSize: 12.5 }}>{timeAgo(u.signed_up)}</span></div>)}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', marginBottom: 6 }}>Lo último que se cargó</div>
            {items.slice(0, 8).map((it) => <div key={it.id} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}><Cover it={it} w={26} /><div style={{ flex: 1, minWidth: 0 }}><b>{it.title}</b><div className="muted" style={{ fontSize: 12.5 }}>{byId[it.user_id]?.name || ''} · {KINDS[it.kind].label}</div></div><span className="muted" style={{ fontSize: 12.5 }}>{timeAgo(it.created_at)}</span></div>)}
          </div>
        </div>
      </>) : tab === 'usuarios' ? (<>
        <input className="input" style={{ maxWidth: 360 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, usuario o mail" />
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>Persona</th><th>Mail</th><th>Se sumó</th><th>Última vez</th><th>Títulos</th><th>Tecoins</th><th>Amigos</th><th>Regalo</th>{access.founder && !access.legacy && <th />}</tr></thead>
            <tbody>{filteredUsers.map((u) => <UserRow key={u.id} u={u} open={open === u.id} onToggle={() => setOpen(open === u.id ? null : u.id)} canManage={access.founder && !access.legacy} onMenu={(usr, x, y) => setMenu({ u: usr, x, y })} />)}</tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Tocá una fila para ver lo que cargó esa persona.{access.founder && !access.legacy ? ' Clic derecho en una persona (o el botón ⋯) para sumarla al equipo y elegir qué puede ver.' : ''}</p>
        {menu && <RowMenu m={menu} onClose={() => setMenu(null)} onPick={(u) => { setMenu(null); setPerms(u) }} />}
        {perms && <PermsModal u={perms} say={say} onClose={() => setPerms(null)} onSaved={() => { setPerms(null); loadUsers() }} />}
      </>) : tab === 'actividad' ? (<>
        <div className="row" style={{ gap: 6 }}>{[['all', 'todo'], ['book', 'libros'], ['movie', 'pelis'], ['show', 'series']].map(([k, l]) => <button key={k} className={`chip ${kind === k ? 'lim' : ''}`} onClick={() => setKind(k)}>{l}</button>)}</div>
        <div className="admin-feed" style={{ marginTop: 16 }}>
          {feed.map((it) => { const u = byId[it.user_id]; return (
            <div key={it.id} className="card row" style={{ alignItems: 'flex-start', gap: 14 }}>
              <Cover it={it} w={64} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 8 }}><Avatar p={{ ...u, color: u?.color || '#EEE' }} s={22} /><span style={{ fontSize: 13 }}><b>{u?.name}</b> <span className="muted">· {timeAgo(it.created_at)}</span></span></div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', marginTop: 6 }}>{it.title}</div>
                <div className="muted" style={{ fontSize: 12.5, margin: '2px 0 6px' }}>{[KINDS[it.kind].label, it.creator, it.platform].filter(Boolean).join(' · ')}</div>
                <Stars n={it.stars || 0} s={13} />
                {it.review && <div style={{ marginTop: 6 }}><Review text={it.review} lines={3} size={14} /></div>}
              </div>
            </div>) })}
        </div>
      </>) : <GiftsPanel uid={session.user.id} say={say} wide />}
    </div>
  )
}

function PushPanel({ session, say }) {
  const [count, setCount] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState(null)
  useEffect(() => { sb.rpc('admin_push_count').then(({ data }) => setCount(data ?? 0)) }, [])
  async function send(e) {
    e.preventDefault()
    if (!confirm(`¿Mandar este aviso a ${count} personas?`)) return
    setBusy(true)
    const r = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ title, body, url }) })
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return say(j.error || 'No se pudo mandar')
    setLast(j); setTitle(''); setBody('')
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 440px) minmax(0, 1fr)', gap: 40, alignItems: 'start' }}>
      <form onSubmit={send}>
        <Stat n={count ?? '…'} label="Personas con avisos activados" sub="Les llega al celu, aunque tengan la app cerrada" bg="#E6F04A" />
        <label className="field"><span className="light">Título · hasta 80 caracteres</span><input className="input" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¡Llegó el ranking del año! 🏆" /></label>
        <label className="field"><span className="light">Texto · hasta 200 caracteres</span><textarea className="input" maxLength={200} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Armá tu top 3 de libros, pelis y series de 2026." /></label>
        <div className="field"><span className="light">Al tocarla, abre</span><div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{[['/', 'Mi teca'], ['/?tab=friends', 'Amigos'], ['/?tab=rank', 'Ranking']].map(([u, l]) => <button type="button" key={u} className={`chip ${url === u ? 'on' : ''}`} onClick={() => setUrl(u)}>{l}</button>)}</div></div>
        <div style={{ marginTop: 18 }}><button className="btn" disabled={busy || !count}>{busy ? 'Mandando…' : 'Mandar aviso'}</button></div>
        {last && <p className="body" style={{ fontSize: 14, marginTop: 12 }}>Listo: llegó a {last.sent} {last.sent === 1 ? 'celu' : 'celus'}{last.gone ? ` (${last.gone} ya no tenían la app y los sacamos de la lista)` : ''}.</p>}
      </form>
      <div>
        <div className="light">Así se ve en el celu</div>
        <div style={{ marginTop: 10, maxWidth: 380, background: 'rgba(245,245,245,.95)', borderRadius: 22, padding: 14, boxShadow: '0 10px 30px -10px rgba(0,0,0,.3)', display: 'flex', gap: 12 }}>
          <img src="/icons/icon-192.png" alt="" style={{ width: 38, height: 38, borderRadius: 9 }} />
          <div style={{ flex: 1, minWidth: 0 }}><div className="between"><b style={{ fontSize: 14 }}>{title || 'Título del aviso'}</b><span className="muted" style={{ fontSize: 12 }}>ahora</span></div><div style={{ fontSize: 14, fontWeight: 300, marginTop: 2 }}>{body || 'El texto aparece acá.'}</div></div>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.45 }}>Les llega a quienes tocaron “activar” en la app. En iPhone, solo si tienen teca agregada al inicio. Mandá pocos y que valgan la pena: si son muchos, la gente los apaga.</p>
      </div>
    </div>
  )
}
