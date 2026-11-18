import { useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar, Cover, Sheet, Stars } from '../ui.jsx'
import { KINDS, fmtDate, genreLabels } from '../lib.js'
import { AddSheet } from './Add.jsx'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

export function Review({ text, lines = 4, size = 15 }) {
  const [open, setOpen] = useState(false)
  const long = text.length > lines * 42
  return (<>
    <div className="clamp" style={{ fontWeight: 300, fontSize: size, lineHeight: 1.45, WebkitLineClamp: open ? 'unset' : lines }}>{text}</div>
    {long && <button className="linkbtn" style={{ marginTop: 4, fontSize: 13, textDecoration: 'none' }} onClick={() => setOpen(!open)}>{open ? 'Leer menos' : 'Leer más'}</button>}
  </>)
}

export function Detail({ ctx, it, onClose }) {
  const [editing, setEditing] = useState(false)
  const mine = it.user_id === ctx.uid
  const owner = mine ? ctx.profile : ctx.people[it.user_id]
  const current = mine ? ctx.items.find((x) => x.id === it.id) || it : it
  const others = [...ctx.feed, ...(mine ? [] : ctx.items)].filter((x) => x.id !== it.id && x.kind === it.kind && norm(x.title) === norm(it.title))
  const isSaved = ctx.saved.some((s) => s.id === it.id)

  async function del() {
    if (!confirm(`¿Borrar ${current.title} de tu ${KINDS[current.kind].teca}teca?`)) return
    const { error } = await sb.from('items').delete().eq('id', it.id)
    if (error) return ctx.say('No se pudo borrar')
    ctx.setItems((xs) => xs.filter((x) => x.id !== it.id)); onClose(); ctx.say('Borrado')
  }
  async function toggleSave() {
    if (isSaved) { await sb.from('saved').delete().eq('user_id', ctx.uid).eq('item_id', it.id); ctx.setSaved((s) => s.filter((x) => x.id !== it.id)) }
    else { await sb.from('saved').insert({ user_id: ctx.uid, item_id: it.id }); ctx.setSaved((s) => [it, ...s]); ctx.say('Guardado para después') }
  }

  if (editing) return <AddSheet ctx={ctx} edit={current} onClose={() => { setEditing(false); onClose() }} />
  const meta = [current.kind === 'book' ? (current.format === 'ebook' ? 'ebook' : 'en papel') : current.seen_where === 'cine' ? 'en el cine' : current.platform ? `en ${current.platform}` : 'en casa', fmtDate(current.finished_at)]
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 18px' }}><div style={{ transform: 'rotate(-3deg)' }}><Cover it={current} w={108} /></div></div>
      <h2 className="h" style={{ fontSize: 32 }}>{current.title}</h2>
      <div className="between" style={{ marginTop: 8 }}><span className="light">{[current.creator, current.year].filter(Boolean).join(' · ')}</span><Stars n={current.stars || 0} s={17} /></div>
      <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>{genreLabels(current.genre).map((g) => <span key={g} className="chip">{g}</span>)}<span className="chip">{meta.join(' · ')}</span></div>
      {current.review && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="row" style={{ gap: 8 }}><Avatar p={owner} s={22} /><span className="light">{mine ? 'Tu reseña' : `La reseña de ${owner?.name || ''}`}</span></div>
          <div style={{ marginTop: 8 }}><Review text={current.review} /></div>
        </div>
      )}
      {!mine && <div style={{ marginTop: 12 }}><button className={`btn ${isSaved ? 'ink' : 'white'}`} onClick={toggleSave}>{isSaved ? 'Guardada para después' : 'Guardar para después'}</button></div>}
      {others.length > 0 && (<>
        <div className="between" style={{ marginTop: 18 }}><span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>Lo que dijeron tus amigos</span></div>
        {others.slice(0, 6).map((o) => { const p = o.user_id === ctx.uid ? ctx.profile : ctx.people[o.user_id]; return (
          <div key={o.id} className="row" style={{ alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <Avatar p={p} s={30} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="between"><b style={{ fontSize: 14 }}>{p?.name}</b><Stars n={o.stars || 0} s={11} /></div>{o.review && <div style={{ marginTop: 3 }}><Review text={o.review} lines={2} size={14} /></div>}</div>
          </div>) })}
      </>)}
      {mine && <div style={{ marginTop: 16, textAlign: 'center', fontWeight: 300, fontSize: 13 }}><button className="linkbtn" style={{ fontWeight: 300 }} onClick={() => setEditing(true)}>Editar</button> · <button className="linkbtn" style={{ fontWeight: 300 }} onClick={del}>Borrar</button></div>}
    </Sheet>
  )
}
