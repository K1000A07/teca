import { plantState } from './lib.js'
import { ART, CATEGORIES, drawAt, standH } from './deco/art.js'

// Decoraciones del estante: catálogo, precios y cómo se dibuja cada una.
// Las primeras decos de teca tenían nombres cortos (plantita, taza…): siguen valiendo y
// ahora se dibujan con la librería nueva.
const LEGACY = { plantita: 'plantas/monstera', taza: 'tazas/teca', portarretrato: 'cuadros/foto', lampara: 'objetos/lampara_lima', cartelera: 'objetos/cartelera' }
const LEGACY_PRICE = { plantita: 30, taza: 40, portarretrato: 60, lampara: 80, cartelera: 50 }
const CAT_PRICE = { plantas: 30, velas: 30, gatos: 70, tazas: 40, objetos: 50, cuadros: 60 }
const PRICE_OVERRIDE = { 'objetos/lampara': 80 }
const artKey = (kind) => LEGACY[kind] || kind
const keyFor = (ak) => Object.keys(LEGACY).find((k) => LEGACY[k] === ak) || ak

export const DECOS = {}
export const DECO_CATS = CATEGORIES.map((c) => ({ key: c.key, name: c.name, kinds: [] }))
CATEGORIES.forEach((c, ci) => Object.keys(c.items).forEach((n) => {
  const ak = `${c.key}/${n}`, k = keyFor(ak), a = ART[ak]
  DECOS[k] = { name: a.name, price: LEGACY_PRICE[k] || PRICE_OVERRIDE[ak] || CAT_PRICE[c.key], cat: c.key, art: ak }
  DECO_CATS[ci].kinds.push(k)
}))
DECOS.estante_blanco = { name: 'Estante blanco', price: 100, shelf: 'blanco', cat: 'estantes' }
DECOS.estante_celeste = { name: 'Estante celeste', price: 150, shelf: 'celeste', cat: 'estantes' }
DECO_CATS.push({ key: 'estantes', name: 'Estantes', kinds: ['estante_blanco', 'estante_celeste'] })

export const SHELF_STYLES = {
  madera: { plank: 'linear-gradient(180deg, #D49A5E 0, #B9773F 30%, #7E4E24 100%)', grain: true },
  blanco: { plank: 'linear-gradient(180deg, #FFFFFF 0, #ECEAE5 40%, #CFCBC4 100%)', grain: false },
  celeste: { plank: 'linear-gradient(180deg, #D6E5FA 0, #A9C6F2 40%, #7F9FD0 100%)', grain: false },
}

export const isPlant = (kind) => DECOS[kind]?.cat === 'plantas'
export const takesPhoto = (kind) => !!ART[artKey(kind)]?.photo
export const takesText = (kind) => !!ART[artKey(kind)]?.text
export const decoName = (kind) => DECOS[kind]?.name || 'Decoración'
// Ancho y alto que ocupa parada en el estante (lo que cuelga queda por debajo)
export const decoSize = (kind, s = 1) => { const a = ART[artKey(kind)]; return a ? { w: a.w * s, h: standH(a) * s } : { w: 70 * s, h: 12 * s } }

export function ShelfBar({ style, s = 1 }) {
  return <div aria-hidden="true" style={{ width: 70 * s, height: 12 * s, borderRadius: 2, background: SHELF_STYLES[style].plank, boxShadow: '0 8px 10px -6px rgba(0,0,0,.35)' }} />
}

const PLANT_LOOK = { ok: undefined, wilted: 'saturate(.55) sepia(.35)', dry: 'saturate(.25) sepia(.75) brightness(.95)' }

// fit: para las vistas chicas (tienda), achica la deco para que entre en la caja sin colgar
export function DecoArt({ d, s = 1, fit }) {
  if (d.kind === 'estante_blanco') return <ShelfBar style="blanco" s={s} />
  if (d.kind === 'estante_celeste') return <ShelfBar style="celeste" s={s} />
  const a = ART[artKey(d.kind)]
  if (!a) return null
  if (fit) s = Math.min(fit / a.w, fit / a.h, 1.3)
  const state = isPlant(d.kind) && d.watered_at ? plantState(d.watered_at) : 'ok'
  const html = drawAt(a, s, { photo: d.photo_url, text: d.text })
  const sh = fit ? a.h * s : standH(a) * s
  return (
    <div aria-hidden="true" style={{ position: 'relative', flex: 'none', width: a.w * s, height: sh, zIndex: a.hangs && !fit ? 3 : undefined }}>
      <div style={{ position: 'absolute', left: 0, top: 0, lineHeight: 0, filter: PLANT_LOOK[state] }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
export const placeable = (kind) => !kind.startsWith('estante_')
