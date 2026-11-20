import { useState } from 'react'
import { GENRES, KINDS, genreList } from './lib.js'
import { Cover, Icon, Stars } from './ui.jsx'

const norm = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Buscador + filtro + vista lista/biblioteca. La vista arranca siempre en biblioteca.
export function useBrowse(items, kind) {
  const [q, setQ] = useState('')
  const [genres, setGenres] = useState([])
  const [minStars, setMinStars] = useState(0)
  const [view, setView] = useState('shelf')
  const [open, setOpen] = useState(false)
  const mine = items.filter((i) => i.kind === kind)
  const nq = norm(q.trim())
  const match = (i) => (!nq || norm(i.title).includes(nq) || norm(i.creator).includes(nq))
    && (!genres.length || genres.some((g) => genreList(i.genre).includes(g)))
    && (!minStars || Number(i.stars || 0) >= minStars)
  const active = !!nq || genres.length > 0 || minStars > 0
  const present = GENRES.filter(([k]) => mine.some((i) => genreList(i.genre).includes(k)))
  const reset = () => { setQ(''); setGenres([]); setMinStars(0) }
  return { q, setQ, genres, setGenres, minStars, setMinStars, view, setView, open, setOpen, match, active, present, reset, mine, shown: mine.filter(match) }
}

export function BrowseBar({ b, kind }) {
  const nFilters = b.genres.length + (b.minStars ? 1 : 0)
  const iconBtn = (on, label, onClick, children, badge) => (
    <button aria-label={label} aria-pressed={on} onClick={onClick}
      style={{ position: 'relative', flex: 'none', width: 46, height: 46, border: 0, padding: 0, cursor: 'pointer', borderRadius: 14, background: on ? 'var(--ink)' : 'var(--cell)', color: on ? 'var(--lim)' : 'var(--ink)', display: 'grid', placeItems: 'center' }}>
      {children}
      {badge > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: 'var(--lim)', color: 'var(--ink)', boxShadow: '0 0 0 1.5px var(--ink)', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{badge}</span>}
    </button>
  )
  return (
    <div style={{ padding: '16px 20px 0' }}>
      <div className="row" style={{ gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 13, opacity: .55 }}><Icon n="search" s={20} /></span>
          <input className="input" value={b.q} onChange={(e) => b.setQ(e.target.value)} placeholder={`Buscar en tus ${KINDS[kind].plural}`} aria-label="Buscar"
            style={{ paddingLeft: 40, paddingRight: b.q ? 36 : 14, height: 46, fontSize: 15 }} />
          {b.q && <button aria-label="Borrar búsqueda" onClick={() => b.setQ('')} style={{ position: 'absolute', right: 8, top: 11, opacity: .6, border: 0, background: 'transparent', padding: 0 }}><Icon n="x" s={22} /></button>}
        </div>
        {iconBtn(b.open || nFilters > 0, 'Filtrar', () => b.setOpen(!b.open),
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }}><path d="M4 6h16M7 12h10M10 18h4" /></svg>, nFilters)}
        {iconBtn(b.view === 'list', b.view === 'list' ? 'Ver como biblioteca' : 'Ver como lista', () => b.setView(b.view === 'list' ? 'shelf' : 'list'),
          b.view === 'list'
            ? <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><rect x="4" y="4" width="4" height="14" rx="1" /><rect x="10" y="6" width="4" height="12" rx="1" /><path d="M16.5 7.5l3 10.5" strokeLinecap="round" /><path d="M2 20.5h20" strokeLinecap="round" /></svg>
            : <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" /></svg>)}
      </div>
      {b.open && (
        <div style={{ marginTop: 10, padding: 14, borderRadius: 18, background: 'var(--cell)' }}>
          <div className="between"><span className="light">Género</span>{(b.genres.length > 0 || b.minStars > 0) && <button className="linkbtn" style={{ fontSize: 12.5 }} onClick={() => { b.setGenres([]); b.setMinStars(0) }}>limpiar</button>}</div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {b.present.length ? b.present.map(([k, e, l]) => {
              const on = b.genres.includes(k)
              return <button key={k} className={`chip ${on ? 'on' : ''}`} style={{ background: on ? undefined : 'var(--white)' }} onClick={() => b.setGenres(on ? b.genres.filter((x) => x !== k) : [...b.genres, k])}>{e} {l}</button>
            }) : <span style={{ fontWeight: 300, fontSize: 13.5 }}>Cuando cargues con género, vas a poder filtrar acá.</span>}
          </div>
          <div className="light" style={{ marginTop: 14 }}>Puntaje</div>
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            {[0, 3, 4, 5].map((n) => <button key={n} className={`chip ${b.minStars === n ? 'on' : ''}`} style={{ background: b.minStars === n ? undefined : 'var(--white)' }} onClick={() => b.setMinStars(n)}>{n ? `${n}★${n < 5 ? ' o más' : ''}` : 'todos'}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}

export function ListView({ items, kind, onOpen, empty }) {
  const [sort, setSort] = useState('recent')
  const sorted = [...items].sort((a, b) => sort === 'az' ? a.title.localeCompare(b.title, 'es')
    : sort === 'stars' ? (Number(b.stars || 0) - Number(a.stars || 0)) || a.title.localeCompare(b.title, 'es')
    : new Date(b.finished_at || b.created_at) - new Date(a.finished_at || a.created_at))
  if (!items.length) return <div className="pad" style={{ marginTop: 20, fontWeight: 300, fontSize: 15 }}>{empty}</div>
  return (
    <div className="pad" style={{ marginTop: 0, paddingBottom: 120 }}>
      <div className="row" style={{ gap: 6, marginBottom: 6 }}>
        {[['recent', 'recientes'], ['stars', 'mejor puntaje'], ['az', 'a–z']].map(([k, l]) => <button key={k} className={`chip ${sort === k ? 'on' : ''}`} style={{ padding: '5px 11px', fontSize: 12.5 }} onClick={() => setSort(k)}>{l}</button>)}
      </div>
      {sorted.map((it) => (
        <button key={it.id} onClick={() => onOpen(it, sorted)} className="row" style={{ width: '100%', gap: 12, padding: '10px 0', border: 0, borderBottom: '1px solid rgba(20,18,16,.1)', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
          <Cover it={it} w={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.01em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{it.title}</div>
            <div style={{ fontWeight: 300, fontSize: 13, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[it.creator, it.year].filter(Boolean).join(' · ')}</div>
            {Number(it.stars) > 0 && <div style={{ marginTop: 4 }}><Stars n={it.stars} s={13} /></div>}
          </div>
        </button>
      ))}
    </div>
  )
}

// Qué teca se muestra primero: la que eligió la persona o, si no eligió, la que más tiene
export function firstTeca(items, pref) {
  if (pref && KINDS[pref]) return pref
  const n = { book: 0, movie: 0, show: 0 }
  for (const i of items || []) if (n[i.kind] != null) n[i.kind]++
  return ['book', 'movie', 'show'].reduce((a, k) => (n[k] > n[a] ? k : a), 'book')
}
