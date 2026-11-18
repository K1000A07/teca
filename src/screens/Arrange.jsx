import { useRef, useState } from 'react'
import { sb } from '../supabase.js'
import { Back, Coin, CoinPill, Icon } from '../ui.jsx'
import { DECOS, DecoArt, placeable } from '../decos.jsx'
import { shrinkImage } from './Auth.jsx'

// Acciones del modo acomodar y de la tienda
export function useArrange(ctx) {
  const { uid, items, setItems, decos, setDecos, say } = ctx
  async function reorder(eids) {
    const pos = Object.fromEntries(eids.map((e, i) => [e, (i + 1) * 10]))
    const itemUpd = items.filter((i) => pos['i:' + i.id] !== undefined && pos['i:' + i.id] !== i.position)
    const decoUpd = decos.filter((d) => pos['d:' + d.id] !== undefined && pos['d:' + d.id] !== d.position)
    setItems((xs) => xs.map((x) => (pos['i:' + x.id] !== undefined ? { ...x, position: pos['i:' + x.id] } : x)))
    setDecos((xs) => xs.map((x) => (pos['d:' + x.id] !== undefined ? { ...x, position: pos['d:' + x.id] } : x)))
    const res = await Promise.all([
      ...itemUpd.map((i) => sb.from('items').update({ position: pos['i:' + i.id] }).eq('id', i.id)),
      ...decoUpd.map((d) => sb.from('user_decos').update({ position: pos['d:' + d.id] }).eq('id', d.id)),
    ])
    if (res.some((r) => r.error)) say('No se pudo guardar el orden')
  }
  async function orient(it, o) {
    const patch = o === 'up' ? { lying: false, tilt: 0 } : o === 'lie' ? { lying: true, tilt: 0 } : { lying: false, tilt: it.tilt ? -it.tilt : 7 }
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, ...patch } : x)))
    const { error } = await sb.from('items').update(patch).eq('id', it.id)
    if (error) say('No se pudo guardar')
  }
  const maxPos = (kind) => Math.max(0, ...items.filter((i) => i.kind === kind).map((i) => i.position || 0), ...decos.filter((d) => d.teca === kind).map((d) => d.position || 0))
  async function place(d, kind) {
    const position = maxPos(kind) + 10
    setDecos((xs) => xs.map((x) => (x.id === d.id ? { ...x, teca: kind, position } : x)))
    await sb.from('user_decos').update({ teca: kind, position }).eq('id', d.id)
  }
  async function unplace(d) {
    setDecos((xs) => xs.map((x) => (x.id === d.id ? { ...x, teca: null, position: null } : x)))
    await sb.from('user_decos').update({ teca: null, position: null }).eq('id', d.id)
  }
  async function buy(kind, placeIn) {
    const { data, error } = await sb.rpc('buy_deco', { p_kind: kind })
    if (error) { say(error.message.includes('alcanzan') ? 'No te alcanzan los tecoins' : error.message.includes('Ya tenés') ? 'Ya tenés ese estante' : 'No se pudo canjear'); return null }
    setDecos((xs) => [...xs, data])
    if (DECOS[kind].shelf) await setStyle(DECOS[kind].shelf)
    else if (placeIn) await place(data, placeIn)
    say(`¡Canjeaste ${DECOS[kind].short || DECOS[kind].name}!`)
    return data
  }
  async function setStyle(style) {
    const { data } = await sb.from('profiles').update({ shelf_style: style }).eq('id', uid).select().single()
    if (data) ctx.setProfile(data)
  }
  async function setPhoto(d, file) {
    try {
      const blob = await shrinkImage(file, 500)
      const path = `${uid}/deco-${d.id}-${Date.now()}.jpg`
      const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error
      const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
      setDecos((xs) => xs.map((x) => (x.id === d.id ? { ...x, photo_url: url } : x)))
      await sb.from('user_decos').update({ photo_url: url }).eq('id', d.id)
    } catch { say('No se pudo subir la foto') }
  }
  return { reorder, orient, place, unplace, buy, setStyle, setPhoto }
}

function PriceChip({ n, state }) {
  if (state === 'own') return <span style={{ fontWeight: 300, fontSize: 10.5 }}>en uso</span>
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: state === 'can' ? 'var(--lim)' : '#fff', borderRadius: 99, padding: '2px 7px 2px 3px', fontWeight: 800, fontSize: 11, boxShadow: 'inset 0 0 0 1.2px var(--ink)', opacity: state === 'lock' ? .55 : 1 }}><Coin s={13} />{n}</span>
}

export function ShopTiles({ ctx, actions, kind }) {
  const style = ctx.profile.shelf_style || 'madera'
  const owned = (k) => ctx.decos.some((d) => d.kind === k)
  return (<>
    {Object.entries(DECOS).map(([k, c]) => {
      const isShelf = !!c.shelf
      const has = isShelf && owned(k)
      const inUse = isShelf && style === c.shelf
      const can = ctx.coins >= c.price
      return (
        <button key={k} className="tile" onClick={async () => {
          if (isShelf && has) return actions.setStyle(inUse ? 'madera' : c.shelf)
          if (!can) return ctx.say(`Te faltan ${c.price - ctx.coins} tecoins`)
          if (confirm(`¿Canjear ${c.short || c.name} por ${c.price} tecoins?`)) actions.buy(k, kind)
        }}>
          <span className="box" style={{ opacity: !has && !can ? .5 : 1 }}><DecoArt d={{ kind: k }} s={k === 'lampara' ? .75 : .9} /></span>
          <span className="lbl">{c.short || c.name}</span>
          {isShelf && has ? <span style={{ fontWeight: 800, fontSize: 10.5 }}>{inUse ? '✓ en uso' : 'usar'}</span> : <PriceChip n={c.price} state={can ? 'can' : 'lock'} />}
        </button>
      )
    })}
  </>)
}

export function Tray({ ctx, actions, kind }) {
  const [tab, setTab] = useState(0)
  const loose = ctx.decos.filter((d) => placeable(d.kind) && !d.teca)
  return (
    <div className="tray">
      <div className="between">
        <div className="row" style={{ gap: 6 }}>{['Tus decos', 'Canjear'].map((t, i) => <button key={t} className={`chip ${tab === i ? 'on' : ''}`} onClick={() => setTab(i)}>{t}</button>)}</div>
        <CoinPill n={ctx.coins} />
      </div>
      <div className="row" style={{ gap: 10, marginTop: 12, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 2 }}>
        {tab === 0 ? (loose.length ? loose.map((d) => (
          <button key={d.id} className="tile" onClick={() => actions.place(d, kind)}>
            <span className="box"><DecoArt d={d} s={d.kind === 'lampara' ? .75 : .9} /></span><span className="lbl">{DECOS[d.kind].short || DECOS[d.kind].name}</span><span style={{ fontWeight: 300, fontSize: 10.5 }}>tocá para poner</span>
          </button>
        )) : <p className="body" style={{ fontSize: 13.5, margin: '6px 0 14px' }}>{ctx.decos.some((d) => placeable(d.kind)) ? 'Todas tus decos ya están en algún estante.' : 'Todavía no tenés decoraciones. Canjeá tus tecoins en la pestaña Canjear.'}</p>)
          : <ShopTiles ctx={ctx} actions={actions} kind={kind} />}
      </div>
    </div>
  )
}

export function Toolbar({ ctx, actions, entry, onClose }) {
  const fileRef = useRef()
  if (!entry) return null
  const btn = (on, ic, label, onClick) => (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 66, padding: '8px 6px 7px', border: 0, borderRadius: 12, background: on ? 'var(--lim)' : 'transparent', color: on ? 'var(--ink)' : '#fff', fontWeight: 800, fontSize: 11.5 }}>{ic}{label}</button>
  )
  const shape = (r, w, h) => <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1.9 }}><rect x={12 - w / 2} y={12 - h / 2} width={w} height={h} rx="1" transform={`rotate(${r} 12 12)`} /></svg>
  if (entry.type === 'item') {
    const it = entry.ref
    const o = it.lying ? 'lie' : it.tilt ? 'tilt' : 'up'
    return (
      <div className="row" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 196, zIndex: 46, background: 'var(--ink)', borderRadius: 18, padding: 5, gap: 2, boxShadow: '0 14px 26px -10px rgba(0,0,0,.55)' }}>
        {btn(o === 'up', shape(0, 6, 18), 'parado', () => actions.orient(it, 'up'))}
        {btn(o === 'lie', shape(0, 18, 6), 'acostado', () => actions.orient(it, 'lie'))}
        {btn(o === 'tilt', shape(16, 6, 18), 'inclinado', () => actions.orient(it, 'tilt'))}
        {btn(false, <Icon n="x" s={20} />, 'listo', onClose)}
      </div>
    )
  }
  const d = entry.ref
  return (
    <div className="row" style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 196, zIndex: 46, background: 'var(--ink)', borderRadius: 18, padding: 5, gap: 2, boxShadow: '0 14px 26px -10px rgba(0,0,0,.55)' }}>
      {d.kind === 'portarretrato' && <>{btn(false, <Icon n="photo" s={20} />, d.photo_url ? 'cambiar foto' : 'poner foto', () => fileRef.current.click())}<input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && actions.setPhoto(d, e.target.files[0])} /></>}
      {btn(false, <Icon n="x" s={20} />, 'sacar', () => { actions.unplace(d); onClose() })}
      {btn(false, <Icon n="check" s={20} />, 'listo', onClose)}
    </div>
  )
}

export function Shop({ ctx }) {
  const actions = useArrange(ctx)
  return (
    <div style={{ background: 'var(--cell)', minHeight: '100dvh' }}>
      <Back onBack={ctx.back} title="Canjear tecoins" right={<CoinPill n={ctx.coins} />} />
      <div className="pad">
        <h1 className="h" style={{ fontSize: 32 }}>Decorá tu teca</h1>
        <p className="body" style={{ marginTop: 8, fontSize: 14 }}>Canjeá tus tecoins por cositas para tu estante. Después las ponés y las movés desde <b>Acomodar</b>.</p>
        <button className="linkbtn" style={{ marginTop: 8 }} onClick={() => ctx.go('tecoins')}>Ver cuánto vale cada cosa</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 18, justifyItems: 'center' }}><ShopTiles ctx={ctx} actions={actions} kind={null} /></div>
      </div>
    </div>
  )
}
