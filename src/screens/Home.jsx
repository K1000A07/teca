import { useRef } from 'react'
import { CoinPill, Icon, Shelf, Teca, useWidth } from '../ui.jsx'
import { KINDS, KIND_ORDER } from '../lib.js'

export function TopBar({ title, ctx, coins = true }) {
  return (
    <div className="top">
      <h1 className="h" style={{ fontSize: 34 }}>{title}</h1>
      <div className="row" style={{ gap: 8 }}>
        {coins && <CoinPill n={ctx.coins} onClick={() => ctx.go('tecoins')} />}
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
  const mine = ctx.items.filter((i) => i.kind === kind)
  const year = new Date().getFullYear()
  const rated = mine.filter((i) => i.stars)
  const avg = rated.length ? (rated.reduce((a, i) => a + i.stars, 0) / rated.length).toFixed(1).replace('.', ',') : null
  const swipe = useSwipe(kind, setKind)
  return (
    <div {...swipe}>
      <TopBar title={<Teca pre={`Mi ${KINDS[kind].teca}`} />} ctx={ctx} />
      <div className="pad light" style={{ marginTop: 2 }}>{mine.length ? `${mine.length} ${mine.length === 1 ? KINDS[kind].label : KINDS[kind].plural}${avg ? ` · ★ ${avg}` : ''} · ${year}` : 'Todavía está vacía'}</div>
      <TecaTabs kind={kind} setKind={setKind} />
      <div style={{ height: 14 }} />
      <Shelf items={mine} kind={kind} width={w} onOpen={(it) => ctx.openSheet({ t: 'detail', it })} onAdd={() => ctx.openSheet({ t: 'add' })} />
      {!mine.length && (
        <div className="pad" style={{ textAlign: 'center', marginTop: 22 }}>
          <div className="h" style={{ fontSize: 22, letterSpacing: '-0.035em' }}>{kind === 'book' ? '¿Qué fue lo último que leíste?' : kind === 'movie' ? '¿Qué fue la última peli que viste?' : '¿Qué serie terminaste?'}</div>
          <p className="body" style={{ marginTop: 8, fontSize: 14 }}>Cargala con el + y sumá tus primeros tecoins.</p>
        </div>
      )}
    </div>
  )
}
