import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar, Back, Cover, Icon, Sheet, Stars, Teca, useWidth } from '../ui.jsx'
import { Shelf, buildEntries } from '../shelf.jsx'
import { KINDS, timeAgo } from '../lib.js'
import { TopBar, TecaTabs, useSwipe } from './Home.jsx'
import { Review } from './Detail.jsx'

function AddFriend({ ctx, onClose }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState([])
  useEffect(() => {
    const term = q.trim().replace(/^@/, '').toLowerCase()
    if (term.length < 2) { setRes([]); return }
    const t = setTimeout(async () => {
      const { data } = await sb.from('profiles').select('*').or(`username.ilike.%${term}%,name.ilike.%${term}%`).neq('id', ctx.uid).limit(10)
      setRes(data || [])
    }, 300)
    return () => clearTimeout(t)
  }, [q, ctx.uid])
  const rel = (id) => ctx.friendships.find((f) => f.requester === id || f.addressee === id)
  async function ask(p) {
    const { error } = await sb.from('friendships').insert({ requester: ctx.uid, addressee: p.id })
    if (error) return ctx.say(error.code === '23505' ? 'Ya hay una solicitud entre ustedes' : 'No se pudo mandar')
    ctx.say(`Le mandaste solicitud a ${p.name}`); ctx.reload()
  }
  return (
    <Sheet onClose={onClose}>
      <h2 className="h" style={{ fontSize: 28 }}>Sumar amigos</h2>
      <p className="body" style={{ marginTop: 6, fontSize: 14 }}>Buscalos por su usuario o su nombre.</p>
      <input className="input" style={{ marginTop: 14 }} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="@juli" autoCapitalize="none" />
      <div style={{ marginTop: 10 }}>
        {res.map((p) => { const r = rel(p.id); return (
          <div key={p.id} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
            <Avatar p={p} s={40} /><div style={{ flex: 1 }}><b>{p.name}</b><div className="light" style={{ letterSpacing: '.1em' }}>@{p.username}</div></div>
            {r ? <span className="chip">{r.status === 'accepted' ? 'amigos' : 'pendiente'}</span> : <button className="chip lim" onClick={() => ask(p)}>sumar</button>}
          </div>) })}
        {q.trim().length >= 2 && !res.length && <p className="body muted" style={{ fontSize: 14 }}>No encontramos a nadie con ese nombre. Pasales el link de teca para que se sumen.</p>}
      </div>
      <div style={{ marginTop: 16 }}><button className="btn white" onClick={() => { navigator.share ? navigator.share({ title: 'teca', text: 'Sumate a teca, mi biblioteca de bolsillo', url: location.origin }) : (navigator.clipboard.writeText(location.origin), ctx.say('Link copiado')) }}><Icon n="share" s={18} w={2} />Invitar con el link</button></div>
    </Sheet>
  )
}

export function Friends({ ctx }) {
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')
  const week = Date.now() - 7 * 864e5
  const posts = ctx.feed.filter((i) => filter === 'all' ? true : filter === 'week' ? new Date(i.created_at).getTime() > week : i.kind === filter)
  const lastSeen = Number(localStorage.getItem('teca.feedseen') || 0)
  useEffect(() => () => { localStorage.setItem('teca.seen', Date.now()); localStorage.setItem('teca.feedseen', Date.now()) }, [])
  return (
    <div>
      <TopBar title="Amigos" ctx={ctx} coins={false} />
      <div className="row" style={{ gap: 12, padding: '14px 20px 4px', overflowX: 'auto' }}>
        <button onClick={() => setAdding(true)} style={{ flex: 'none', width: 60, border: 0, background: 'none', padding: 0, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1.5px dashed var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="plus" s={22} w={2} /></div>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6 }}>Sumar</div>
        </button>
        {ctx.friends.map((p) => (
          <button key={p.id} onClick={() => ctx.go('friend', { person: p })} style={{ flex: 'none', width: 60, border: 0, background: 'none', padding: 0, textAlign: 'center' }}>
            <Avatar p={p} s={60} dot={ctx.feed.some((i) => i.user_id === p.id && new Date(i.created_at).getTime() > lastSeen)} />
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
          </button>
        ))}
      </div>
      {ctx.incoming.length > 0 && (
        <button onClick={() => ctx.go('news')} className="row" style={{ width: 'calc(100% - 40px)', margin: '8px 20px 0', padding: '10px 12px', background: 'var(--lim)', borderRadius: 16, border: 0, fontWeight: 800, fontSize: 14, textAlign: 'left' }}>
          <Avatar p={ctx.people[ctx.incoming[0].requester]} s={28} />
          <span style={{ flex: 1 }}>{ctx.incoming.length === 1 ? `${ctx.people[ctx.incoming[0].requester]?.name} quiere ser tu amigo` : `${ctx.incoming.length} solicitudes de amistad`}</span>
          <span style={{ background: 'var(--ink)', color: 'var(--lim)', borderRadius: 99, padding: '5px 11px', fontSize: 12.5 }}>ver</span>
        </button>
      )}
      <div className="pad" style={{ paddingTop: 18 }}>
        <h2 className="h" style={{ fontSize: 24 }}>¿En qué andan?</h2>
        <p className="body" style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.35 }}>No te pierdas nada de lo que estuvieron viendo o leyendo tus amigos.</p>
      </div>
      <div className="row" style={{ gap: 6, padding: '10px 20px 0', overflowX: 'auto' }}>
        {[['all', 'todo'], ['week', 'esta semana'], ['book', 'libros'], ['movie', 'pelis'], ['show', 'series']].map(([k, l]) => <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {!ctx.friends.length && <div className="pad" style={{ marginTop: 20 }}><div className="card" style={{ textAlign: 'center' }}><p className="body">Todavía no sumaste amigos. Buscalos por su usuario o invitalos con el link.</p><div style={{ marginTop: 12 }}><button className="btn" onClick={() => setAdding(true)}>Sumar amigos</button></div></div></div>}
      {posts.map((it) => <Post key={it.id} ctx={ctx} it={it} isNew={new Date(it.created_at).getTime() > lastSeen} />)}
      {adding && <AddFriend ctx={ctx} onClose={() => setAdding(false)} />}
    </div>
  )
}

function Post({ ctx, it, isNew }) {
  const p = ctx.people[it.user_id]
  const saved = ctx.saved.some((s) => s.id === it.id)
  const already = ctx.items.some((m) => m.kind === it.kind && m.title.toLowerCase() === it.title.toLowerCase())
  async function toggle() {
    if (saved) { await sb.from('saved').delete().eq('user_id', ctx.uid).eq('item_id', it.id); ctx.setSaved((s) => s.filter((x) => x.id !== it.id)) }
    else { await sb.from('saved').insert({ user_id: ctx.uid, item_id: it.id }); ctx.setSaved((s) => [it, ...s]) }
  }
  return (
    <div className="post">
      <div className="row" style={{ gap: 9 }}><Avatar p={p} s={30} /><div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>{p?.name} <span style={{ fontWeight: 300 }}>{it.kind === 'book' ? 'leyó' : 'vio'} · {timeAgo(it.created_at)}</span></div></div>
      <button onClick={() => ctx.openSheet({ t: 'detail', it })} className="row" style={{ alignItems: 'flex-start', gap: 14, marginTop: 12, border: 0, background: 'none', padding: 0, textAlign: 'left', width: '100%' }}>
        <Cover it={it} w={72} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-0.04em', lineHeight: 1 }}>{it.title}</div>
          <div className="light" style={{ margin: '6px 0 7px', letterSpacing: '.12em' }}>{it.creator}</div>
          <Stars n={it.stars || 0} />
          {it.review && <div className="clamp" style={{ marginTop: 7, WebkitLineClamp: 3, fontWeight: 300, fontSize: 14, lineHeight: 1.45 }}>{it.review}</div>}
        </div>
      </button>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
        {already ? <span className="chip" style={{ boxShadow: 'none', background: 'transparent', fontWeight: 300 }}>✓ en tu {KINDS[it.kind].teca}teca</span> : <>
          <button onClick={() => ctx.openSheet({ t: 'add', prefill: it })} className="chip lim"><Icon n="check" s={14} w={2.2} />{it.kind === 'book' ? 'ya lo leí' : 'ya la vi'}</button>
          <button onClick={toggle} className={`chip ${saved ? 'on' : ''}`}><Icon n="bookmark" s={14} w={2} />{saved ? 'guardada' : 'para después'}</button>
        </>}
      </div>
      {isNew && <span style={{ position: 'absolute', right: 14, top: 12 }}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E6F04A" stroke="#141210" strokeWidth="1.5" /><path d="M12 5.8v12.4M6.6 8.9l10.8 6.2M6.6 15.1l10.8-6.2" stroke="#141210" strokeWidth="2" strokeLinecap="round" /></svg></span>}
    </div>
  )
}

export function FriendTeca({ ctx, person: initial }) {
  const w = useWidth()
  const [kind, setKind] = useState('book')
  const [person, setPerson] = useState(initial)
  const [items, setItems] = useState(null)
  const [decos, setDecos] = useState([])
  const rel = ctx.friendships.find((x) => x.requester === initial.id || x.addressee === initial.id)
  const isFriend = rel?.status === 'accepted'
  useEffect(() => {
    sb.from('profiles').select('*').eq('id', initial.id).maybeSingle().then(({ data }) => data && setPerson(data))
    sb.from('user_decos').select('*').eq('user_id', initial.id).then(({ data }) => setDecos(data || []))
    sb.from('items').select('*').eq('user_id', initial.id).order('position', { ascending: true, nullsFirst: false }).order('created_at').then(({ data }) => setItems(data || []))
  }, [initial.id])
  const swipe = useSwipe(kind, setKind)
  const canSee = isFriend || person.teca_public
  const common = (items || []).filter((i) => ctx.items.some((m) => m.kind === i.kind && m.title.toLowerCase() === i.title.toLowerCase())).length
  async function unfriend() {
    if (!confirm(`¿Dejar de ser amigo de ${person.name}?`)) return
    if (rel) await sb.from('friendships').delete().eq('id', rel.id)
    ctx.reload(); ctx.back()
  }
  async function ask() {
    const { error } = await sb.from('friendships').insert({ requester: ctx.uid, addressee: person.id })
    if (error) return ctx.say(error.code === '23505' ? 'Ya hay una solicitud entre ustedes' : 'No se pudo mandar')
    ctx.say(`Le mandaste solicitud a ${person.name}`); ctx.reload()
  }
  async function accept() { await sb.from('friendships').update({ status: 'accepted' }).eq('id', rel.id); ctx.say('¡Ahora son amigos!'); ctx.reload() }
  const action = isFriend ? null
    : !rel ? <button className="btn" onClick={ask}>Sumar a {person.name}</button>
    : rel.addressee === ctx.uid ? <button className="btn" onClick={accept}>Aceptar solicitud</button>
    : <button className="btn white" disabled>Solicitud enviada</button>
  return (
    <div {...swipe}>
      <Back onBack={ctx.back} title="" right={isFriend && <button className="linkbtn" style={{ fontWeight: 300, fontSize: 13 }} onClick={unfriend}>Dejar de seguir</button>} />
      <div className="row pad" style={{ gap: 14, paddingBottom: 6 }}>
        <Avatar p={person} s={70} />
        <div><div className="h" style={{ fontSize: 28 }}>La <span className="teca">teca</span> de {person.name}</div>
          <div className="light" style={{ marginTop: 6 }}>@{person.username}{canSee && items ? ` · ${items.length} títulos · ${common} en común` : ''}</div></div>
      </div>
      {action && <div className="pad" style={{ marginTop: 10 }}>{action}</div>}
      {canSee ? (<>
        <TecaTabs kind={kind} setKind={setKind} />
        <div style={{ height: 14 }} />
        {items && <Shelf entries={buildEntries(items, decos, kind)} kind={kind} width={w} styleName={person.shelf_style} onOpen={(it) => ctx.openSheet({ t: 'detail', it })} />}
      </>) : (
        <div className="pad" style={{ marginTop: 24 }}>
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 30 }}>🔒</div>
            <p className="body" style={{ marginTop: 8 }}>La teca de {person.name} es solo para sus amigos. {rel ? 'Cuando acepte tu solicitud vas a poder verla.' : 'Mandale solicitud para verla.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function Notifications({ ctx }) {
  async function accept(f) { await sb.from('friendships').update({ status: 'accepted' }).eq('id', f.id); ctx.say('¡Ahora son amigos!'); ctx.reload() }
  async function reject(f) { await sb.from('friendships').delete().eq('id', f.id); ctx.reload() }
  const recent = ctx.feed.slice(0, 15)
  return (
    <div>
      <Back onBack={ctx.back} title="Novedades" />
      {ctx.incoming.map((f) => { const p = ctx.people[f.requester]; return (
        <div key={f.id} className="listrow" style={{ background: 'var(--cell)' }}>
          <Avatar p={p} s={42} /><div style={{ flex: 1, fontWeight: 300, fontSize: 14 }}><b style={{ fontWeight: 800 }}>{p?.name}</b> quiere ser tu amigo<div className="light" style={{ marginTop: 4 }}>{timeAgo(f.created_at)}</div></div>
          <button className="chip lim" onClick={() => accept(f)}>aceptar</button><button className="linkbtn" style={{ fontWeight: 300, fontSize: 13 }} onClick={() => reject(f)}>no</button>
        </div>) })}
      {recent.map((it) => { const p = ctx.people[it.user_id]; return (
        <button key={it.id} className="listrow" style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left' }} onClick={() => ctx.openSheet({ t: 'detail', it })}>
          <Avatar p={p} s={42} /><div style={{ flex: 1, fontWeight: 300, fontSize: 14 }}><b style={{ fontWeight: 800 }}>{p?.name}</b> sumó <b style={{ fontWeight: 800 }}>{it.title}</b> a su {KINDS[it.kind].teca}teca<div className="light" style={{ marginTop: 4 }}>{timeAgo(it.created_at)}</div></div>
        </button>) })}
      {!ctx.incoming.length && !recent.length && <p className="pad body muted">No hay novedades por ahora.</p>}
    </div>
  )
}
