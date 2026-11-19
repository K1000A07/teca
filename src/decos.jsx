import { plantState } from './lib.js'
import { ART, drawAt } from './deco/art.js'
// Decoraciones del estante: catálogo, precios y cómo se dibuja cada una.
export const DECOS = {
  plantita: { name: 'Plantita', price: 30 },
  taza: { name: 'Taza teca', price: 40 },
  portarretrato: { name: 'Portarretrato con tu foto', short: 'Portarretrato', price: 60 },
  cartelera: { name: 'Cartelera de cine', short: 'Cartelera', price: 50 },
  lampara: { name: 'Lámpara', price: 80 },
  estante_blanco: { name: 'Estante blanco', price: 100, shelf: 'blanco' },
  estante_celeste: { name: 'Estante celeste', price: 150, shelf: 'celeste' },
}
export const SHELF_STYLES = {
  madera: { plank: 'linear-gradient(180deg, #D49A5E 0, #B9773F 30%, #7E4E24 100%)', grain: true },
  blanco: { plank: 'linear-gradient(180deg, #FFFFFF 0, #ECEAE5 40%, #CFCBC4 100%)', grain: false },
  celeste: { plank: 'linear-gradient(180deg, #D6E5FA 0, #A9C6F2 40%, #7F9FD0 100%)', grain: false },
}

export function Plant({ s = 1, state = 'ok' }) {
  const L = state === 'dry' ? ['#8A6A3A', '#9C7A45', '#A88752'] : state === 'wilted' ? ['#6E7D3A', '#86924A', '#97A255'] : ['#1F6A3A', '#2E8A4E', '#3A9A58']
  const droop = state === 'ok' ? 0 : state === 'wilted' ? 1 : 1.6
  return (
    <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 41 * s, height: 64 * s }}>
      <div style={{ position: 'absolute', left: 6 * s, bottom: 0, width: 29 * s, height: 25 * s, background: '#C9633B', borderRadius: `${3 * s}px ${3 * s}px ${8 * s}px ${8 * s}px` }} />
      <div style={{ position: 'absolute', left: 3 * s, bottom: 21 * s, width: 18 * s, height: 28 * s, background: L[0], borderRadius: '50% 0 50% 0', transform: `rotate(${-20 - droop * 40}deg)`, transformOrigin: 'bottom right' }} />
      <div style={{ position: 'absolute', left: 18 * s, bottom: 24 * s, width: 18 * s, height: 32 * s, background: L[1], borderRadius: '0 50% 0 50%', transform: `rotate(${18 + droop * 40}deg)`, transformOrigin: 'bottom left' }} />
      <div style={{ position: 'absolute', left: 12 * s, bottom: 28 * s, width: 14 * s, height: 34 * s, background: L[2], borderRadius: '50% 50% 0 50%', transform: `rotate(${-4 - droop * 12}deg) scaleY(${1 - droop * .25})`, transformOrigin: 'bottom center' }} />
    </div>
  )
}
export function Mug({ s = 1 }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 32 * s, height: 31 * s }}>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: 24 * s, height: 28 * s, background: '#fff', border: `${1.5 * s}px solid #141210`, borderRadius: `3px 3px ${6 * s}px ${6 * s}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="serif" style={{ fontSize: 9 * s }}>teca</span></div>
      <div style={{ position: 'absolute', right: 0, bottom: 7 * s, width: 10 * s, height: 13 * s, border: `${1.5 * s}px solid #141210`, borderLeft: 0, borderRadius: `0 ${6 * s}px ${6 * s}px 0` }} />
    </div>
  )
}
export function Lamp({ s = 1 }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: 44 * s, height: 78 * s }}>
      <div style={{ position: 'absolute', left: 2 * s, top: 0, width: 40 * s, height: 26 * s, background: '#E6F04A', clipPath: 'polygon(18% 0, 82% 0, 100% 100%, 0 100%)', boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.1)' }} />
      <div style={{ position: 'absolute', left: 20 * s, top: 26 * s, width: 4 * s, height: 44 * s, background: '#141210' }} />
      <div style={{ position: 'absolute', left: 8 * s, bottom: 0, width: 28 * s, height: 8 * s, background: '#141210', borderRadius: `${4 * s}px ${4 * s}px 1px 1px` }} />
    </div>
  )
}
export function Frame({ s = 1, photo }) {
  return (
    <div aria-hidden="true" style={{ flex: 'none', width: 46 * s, height: 58 * s, background: '#fff', border: `${3 * s}px solid #141210`, boxSizing: 'border-box', padding: 4 * s, transform: 'rotate(-4deg)', overflow: 'hidden' }}>
      {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #A9C6F2, #E6F04A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 * s, fontWeight: 800 }}>+ foto</div>}
    </div>
  )
}
export function ShelfBar({ style, s = 1 }) {
  return <div aria-hidden="true" style={{ width: 70 * s, height: 12 * s, borderRadius: 2, background: SHELF_STYLES[style].plank, boxShadow: '0 8px 10px -6px rgba(0,0,0,.35)' }} />
}

export function Cartelera({ s = 1, text }) {
  return <div aria-hidden="true" style={{ flex: 'none', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: drawAt(ART['objetos/cartelera'], s, { text: text || 'HOY\nVEMOS\nUNA PELI' }) }} />
}

export function DecoArt({ d, s = 1 }) {
  if (d.kind === 'cartelera') return <Cartelera s={s} text={d.text} />
  if (d.kind === 'plantita') return <Plant s={s} state={d.watered_at ? plantState(d.watered_at) : 'ok'} />
  if (d.kind === 'taza') return <Mug s={s} />
  if (d.kind === 'lampara') return <Lamp s={s} />
  if (d.kind === 'portarretrato') return <Frame s={s} photo={d.photo_url} />
  if (d.kind === 'estante_blanco') return <ShelfBar style="blanco" s={s} />
  if (d.kind === 'estante_celeste') return <ShelfBar style="celeste" s={s} />
  return null
}
export const placeable = (kind) => !kind.startsWith('estante_')
