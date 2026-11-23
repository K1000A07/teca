import { useEffect, useRef, useState } from 'react'
import { CoinPill, Icon, Teca, useWidth } from '../ui.jsx'
import { Shelf, buildEntries } from '../shelf.jsx'
import { Tray, Toolbar, useArrange } from './Arrange.jsx'
import { isPlant } from '../decos.jsx'
import { BrowseBar, ListView, useBrowse } from '../browse.jsx'
import { GENRES, KINDS, KIND_ORDER, dustInfo, genreList, plantState } from '../lib.js'
import { sb } from '../supabase.js'
import { Coin } from '../ui.jsx'
import { pushSupported, enablePush } from '../push.js'
import { isStandalone } from './Tutorial.jsx'

export function TopBar({ title, ctx, coins = true }) {
  return (
    <div className="top">
      <h1 className="h" style={{ fontSize: 34 }}>{title}</h1>
      <div className="row" style={{ gap: 8 }}>
        {coins && <span data-tour="coins" style={{ display: 'inline-flex', borderRadius: 99 }}><CoinPill n={ctx.coins} onClick={() => ctx.go('tecoins')} /></span>}
        <button className="iconbtn" aria-label="Novedades" onClick={() => { localStorage.setItem('teca.seen', Date.now()); ctx.go('news') }}><Icon n="bell" s={19} />{ctx.hasNews && <span className="dot" />}</button>
      </div>
    </div>
  )
}

export function TecaTabs({ kind, setKind }) {
  return (<>
    <div className="seg" data-tour="tabs" style={{ margin: '8px 20px 0' }}>
      {KIND_ORDER.map((k) => <button key={k} className={k === kind ? 'on' : ''} onClick={() => setKind(k)}><Icon n={KINDS[k].icon} s={15} w={2} />{KINDS[k].plural}</button>)}
    </div>
    <div className="pagedots">{KIND_ORDER.map((k) => <span key={k} className={k === kind ? 'on' : ''} />)}</div>
  </>)
}

export function useSwipe(kind, setKind) {
  const start = useRef(null)
  return {
    onTouchStart: (e) => { start.current = [e.touches[0].clientX, e.touches[0].clientY] },
    onTouchEnd: (e) => {
      if (!start.current) return
      const dx = e.changedTouches[0].clientX - start.current[0], dy = e.changedTouches[0].clientY - start.current[1]
      start.current = null
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
      const i = KIND_ORDER.indexOf(kind) + (dx < 0 ? 1 : -1)
      if (i >= 0 && i < 3) setKind(KIND_ORDER[i])
    },
  }
}

export function Home({ ctx }) {
  const w = useWidth()
  const kind = ctx.teca, setKind = ctx.setTeca
  const [editing, setEditing] = useState(false)
  const [sel, setSel] = useState(null)
  const actions = useArrange(ctx)
  const mine = ctx.items.filter((i) => i.kind === kind)
  const b = useBrowse(ctx.items, kind)
  useEffect(() => { b.reset() }, [kind])
  useEffect(() => { if (ctx.arrangeReq) { setEditing(true); ctx.clearArrange() } }, [ctx.arrangeReq])
  useEffect(() => { if (editing) { b.reset(); b.setView('shelf'); b.setOpen(false) } }, [editing])
  const allEntries = buildEntries(ctx.items, ctx.decos, kind)
  const entries = b.active && !editing ? allEntries.filter((e) => e.type === 'item' && b.match(e.ref)) : allEntries
  const year = new Date().getFullYear()
  const rated = mine.filter((i) => i.stars)
  const avg = rated.length ? (rated.reduce((a, i) => a + Number(i.stars), 0) / rated.length).toFixed(1).replace('.', ',') : null
  const swipe = useSwipe(kind, (k) => { if (cleaning) return; setSel(null); setKind(k) })
  useEffect(() => { ctx.setHideNav(editing); return () => ctx.setHideNav(false) }, [editing])
  const selIdx = entries.findIndex((e) => e.eid === sel)
  const selEntry = entries[selIdx]

  const stackSel = (d) => actions.stack(d, false)
  const done = () => { setEditing(false); setSel(null) }
  const dust = dustInfo(ctx.profile.last_visit)
  const [cleaning, setCleaning] = useState(false)
  const [askPush, setAskPush] = useState(() => pushSupported() && Notification.permission === 'default' && (isStandalone() || /android/i.test(navigator.userAgent)) && !localStorage.getItem('teca.pushask') && false)
  async function turnOnPush() {
    localStorage.setItem('teca.pushask', '1'); setAskPush(false)
    try { if (await enablePush(ctx.uid)) ctx.say('¡Listo! Te vamos a avisar las novedades') } catch { ctx.say('No se pudieron activar los avisos') }
  }
  async function startClean() {
    if (ctx.coins < dust.cost) return ctx.say(`Limpiar cuesta ${dust.cost} tecoins y no te alcanzan`)
    setCleaning(true)
  }
  async function cleaned() {
    const { data, error } = await sb.rpc('clean_shelf')
    setCleaning(false)
    if (error) return ctx.say(error.message.includes('alcanzan') ? 'No te alcanzan los tecoins' : 'No se pudo limpiar')
    ctx.setSpent((x) => x + (data || 0))
    ctx.setProfile((p) => ({ ...p, last_visit: new Date().toISOString() }))
    ctx.say('¡Quedó impecable! ✨')
  }
  async function water(d) {
    const st = plantState(d.watered_at)
    if (st === 'ok') return ctx.say('Tu plantita está divina 🌿')
    if (ctx.coins < 10) return ctx.say('Regarla cuesta 10 tecoins y no te alcanzan')
    if (!confirm(`Tu plantita está ${st === 'dry' ? 'seca' : 'marchita'}. ¿La regás por 10 tecoins?`)) return
    const { error } = await sb.rpc('water_plant', { p_id: d.id })
    if (error) return ctx.say('No se pudo regar')
    ctx.setSpent((x) => x + 10)
    ctx.setDecos((xs) => xs.map((x) => (x.id === d.id ? { ...x, watered_at: new Date().toISOString() } : x)))
    ctx.say('¡Regada! 💧')
  }
  return (
    <div {...(editing ? {} : swipe)} style={{ paddingBottom: editing ? 320 : 0 }}>
      {editing ? (
        <div className="top"><h1 className="h" style={{ fontSize: 30 }}>Acomodando</h1></div>
      ) : <TopBar title={<Teca pre={`Mi ${KINDS[kind].teca}`} />} ctx={ctx} />}
      <div className="pad between" style={{ marginTop: 2 }}>
        <span className="light">{editing ? 'Arrastrá a donde quieras' : mine.length ? `${mine.length} ${mine.length === 1 ? KINDS[kind].label : KINDS[kind].plural}${avg ? ` · ★ ${avg}` : ''} · ${year}` : 'Todavía está vacía'}</span>
        {!editing && (mine.length > 0 || ctx.decos.length > 0) && <button className="chip" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setEditing(true)}>Acomodar</button>}
      </div>
      <TecaTabs kind={kind} setKind={(k) => { setSel(null); setKind(k) }} />
      {askPush && !editing && (
        <div className="row" style={{ margin: '12px 20px 0', padding: '10px 12px', background: 'var(--cell)', borderRadius: 16, gap: 10 }}>
          <span style={{ fontSize: 22 }}>🔔</span>
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.3 }}><b>¿Te avisamos cuando haya novedades?</b><br /><span style={{ fontWeight: 300 }}>Estrenos, rankings y cosas de tus amigos.</span></div>
          <div className="stack" style={{ gap: 4, alignItems: 'flex-end' }}><button className="chip lim" onClick={turnOnPush}>activar</button><button className="linkbtn" style={{ fontWeight: 300, fontSize: 12 }} onClick={() => { localStorage.setItem('teca.pushask', '1'); setAskPush(false) }}>ahora no</button></div>
        </div>
      )}
      {dust.level > 0 && !editing && (
        <div className="row" style={{ margin: '12px 20px 0', padding: '10px 12px', background: cleaning ? 'var(--lim)' : '#EFE9DD', borderRadius: 16, gap: 10, boxShadow: 'inset 0 0 0 1.5px var(--ink)' }}>
          <span style={{ fontSize: 22 }}>{cleaning ? '🧽' : '🕸️'}</span>
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.3 }}>{cleaning ? <b>Deslizá el dedo sobre el estante para sacar el polvo</b> : <><b>Tu teca juntó polvo</b><br /><span style={{ fontWeight: 300 }}>Hace {dust.days} días que no pasabas.</span></>}</div>
          {cleaning ? <button className="linkbtn" style={{ fontWeight: 300, fontSize: 13 }} onClick={() => setCleaning(false)}>cancelar</button>
            : <button className="chip on" onClick={startClean}>limpiar · {dust.cost} <Coin s={14} ring="#E6F04A" /></button>}
        </div>
      )}
      {!editing && mine.length > 0 && <BrowseBar b={b} kind={kind} tour="browse" />}
      <div style={{ height: !editing && mine.length > 0 ? 24 : 14 }} />
      {b.view === 'list' && !editing ? <ListView items={b.shown} kind={kind} onOpen={(it, list) => ctx.openSheet({ t: 'detail', it, list })} empty="No hay nada con esa búsqueda." /> :
      <div data-tour="shelf" style={{ width: w, margin: '0 auto' }}><Shelf entries={entries} kind={kind} width={w} styleName={ctx.profile.shelf_style} editing={editing} selected={sel}
        onOpen={(it, list) => ctx.openSheet({ t: 'detail', it, list })} onSelect={(e) => setSel(sel === e ? null : e)}
        onLongPress={(e) => { setEditing(true); setSel(e) }} onMove={actions.move} onFull={ctx.say} packed={b.active} onAdd={editing ? null : () => ctx.openSheet({ t: 'add' })}
        onDecoTap={(d) => isPlant(d.kind) && water(d)} dust={dust.level} cleaning={cleaning} onCleaned={cleaned} /></div>}
      {!mine.length && !editing && (
        <div className="pad" style={{ textAlign: 'center', marginTop: 22 }}>
          <div className="h" style={{ fontSize: 22, letterSpacing: '-0.035em' }}>{kind === 'book' ? '¿Qué fue lo último que leíste?' : kind === 'movie' ? '¿Qué fue la última peli que viste?' : '¿Qué serie terminaste?'}</div>
          <p className="body" style={{ marginTop: 8, fontSize: 14 }}>Cargala con el + y sumá tus primeros tecoins.</p>
        </div>
      )}
      {editing && <><Toolbar ctx={ctx} actions={actions} entry={selEntry} onStack={stackSel} onClose={() => setSel(null)} /><Tray ctx={ctx} actions={actions} kind={kind} onDone={done} /></>}
    </div>
  )
}
