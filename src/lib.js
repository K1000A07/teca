// Lógica compartida: tecoins, medidas de lomos, colores y búsqueda de títulos.

export const KINDS = {
  book: { teca: 'biblio', label: 'libro', plural: 'libros', creator: 'Autor/a', verb: 'leíste', icon: 'book' },
  movie: { teca: 'filmo', label: 'peli', plural: 'pelis', creator: 'Dirección', verb: 'viste', icon: 'clap' },
  show: { teca: 'video', label: 'serie', plural: 'series', creator: 'Creación', verb: 'viste', icon: 'tv' },
}
export const PLATFORMS = ['Netflix', 'Prime Video', 'Disney+', 'Max', 'Apple TV+', 'Paramount+', 'Mubi', 'Flow', 'YouTube', 'Otra']
export const KIND_ORDER = ['book', 'movie', 'show']

export const GENRES = [
  ['amor', '💘', 'amor'], ['drama', '🎭', 'drama'], ['comedia', '😂', 'comedia'], ['thriller', '🔪', 'thriller'],
  ['misterio', '🕵️', 'misterio'], ['terror', '👻', 'terror'], ['scifi', '🚀', 'ciencia ficción'], ['fantasia', '🐉', 'fantasía'],
  ['accion', '💥', 'acción'], ['historia', '🏛️', 'historia'], ['animacion', '🎨', 'animación'], ['noficcion', '🧠', 'no ficción'],
]
export const genreList = (g) => (g || '').split(',').map((x) => x.trim()).filter((x) => GENRES.some((y) => y[0] === x))
export const genreLabels = (g) => genreList(g).map((k) => { const x = GENRES.find((y) => y[0] === k); return `${x[1]} ${x[2]}` })
export const genreLabel = (g) => genreLabels(g)[0] || null

// Traduce las categorías que traen Google Books / iTunes (en inglés o castellano) a las de teca
const GENRE_WORDS = [
  ['amor', /romance|romant|love|amor/], ['scifi', /science fiction|sci-fi|ciencia ficci|dystop|distop/],
  ['fantasia', /fantas/], ['terror', /horror|terror/], ['misterio', /myster|misterio|detective/],
  ['thriller', /thriller|suspense|crime|policial|crimen|noir/], ['comedia', /humor|comed|humour/],
  ['historia', /histor|war\b|guerra/], ['animacion', /anima|comics|graphic novel|manga|historieta/],
  ['accion', /action|adventure|acci[oó]n|aventura/],
  ['noficcion', /biograph|biograf|memoir|self-help|autoayuda|psycholog|psicolog|philosoph|filosof|business|negocios|science(?! fiction)|ciencia(?! ficci)|essay|ensayo|social|politic|true crime|documentar|nonfiction|no ficci|health|salud|cooking|cocina/],
  ['drama', /drama|literary|literaria|fiction|ficci[oó]n|novel/],
]
export function genresFromText(...texts) {
  const t = texts.flat().filter(Boolean).join(' | ').toLowerCase()
  if (!t) return []
  const found = GENRE_WORDS.filter(([, re]) => re.test(t)).map(([k]) => k)
  // "ficción" genérica solo cuenta como drama si no apareció nada más específico
  return found.length > 1 ? found.filter((k) => k !== 'drama').slice(0, 3) : found
}

// ----- Tecoins -----
export const COINS = {
  bookShort: 20, bookLong: 35, paper: 5,
  movieNew: 10, movieCatalog: 8, cinema: 15,
  showShort: 20, showLong: 35,
  review: 2, saga: 50,
}
export function coinsFor(it) {
  const parts = []
  if (it.kind === 'book') {
    const long = (it.pages || 0) > 250
    parts.push([long ? COINS.bookLong : COINS.bookShort, long ? 'libro largo' : 'libro corto'])
    if (it.format === 'papel') parts.push([COINS.paper, 'en papel'])
  } else if (it.kind === 'movie') {
    const nowY = new Date().getFullYear()
    const isNew = it.year && nowY - it.year < 1
    parts.push([isNew ? COINS.movieNew : COINS.movieCatalog, isNew ? 'estreno' : 'peli de catálogo'])
    if (it.seen_where === 'cine' && it.in_theaters) parts.push([COINS.cinema, 'cine en cartelera'])
  } else {
    const long = (it.seasons || 0) >= 4
    parts.push([long ? COINS.showLong : COINS.showShort, long ? 'serie larga' : 'serie corta'])
  }
  if (it.review && it.review.trim().length > 0) parts.push([COINS.review, 'reseña'])
  return { total: parts.reduce((a, p) => a + p[0], 0), parts }
}

// ----- Colores y medidas -----
const PALETTES = [
  ['#1F3A5F', '#F2E3B8'], ['#C9633B', '#FFF4E0'], ['#2E6B4F', '#F4F1E6'], ['#E6F04A', '#141210'],
  ['#A9C6F2', '#141210'], ['#141210', '#E6F04A'], ['#8E2C3A', '#F7E9D7'], ['#F3D9CF', '#3A2A24'],
  ['#5B4B8A', '#F2EEFF'], ['#D9A441', '#1D1A14'], ['#3E7C8C', '#F0F7F8'], ['#EFE6D6', '#2B2622'],
  ['#B84A62', '#FFF0F3'], ['#2F3B52', '#E3EDFB'], ['#7A8B3C', '#FAFAEF'], ['#E8603C', '#141210'],
]
export function hash(s) { let h = 2166136261; for (const c of s || '') { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return Math.abs(h) }
export const paletteFor = (title) => PALETTES[hash(title) % PALETTES.length]

export const PPC = 4.4 // píxeles por centímetro en el estante
export function spineSize(it) {
  const h = hash(it.title + (it.creator || ''))
  if (it.kind === 'movie') return { hcm: 19, wcm: 1.4 }
  if (it.kind === 'show') return { hcm: 19, wcm: Math.min(4.2, 1.6 + (it.seasons || 1) * 0.35) }
  const pages = it.pages || 180 + (h % 260)
  const hcm = 18 + (h % 7) // 18 a 24 cm, hasta que tengamos medidas reales
  const wcm = Math.max(1, Math.min(5.5, pages * 0.0058 + 0.4))
  return { hcm, wcm }
}

// ----- Búsqueda de títulos -----
// Libros: Open Library (gratis, sin clave). Pelis y series: TMDB (cuando tengamos la clave).
export async function searchTitles(kind, q, author = '') {
  q = (q || '').trim(); author = (author || '').trim()
  if (q.length < 3 && author.length < 3) return []
  if (kind === 'book') {
    try {
      const r = await fetch(`/api/books?q=${encodeURIComponent(q)}&author=${encodeURIComponent(author)}`)
      if (r.ok) {
        const list = await r.json()
        if (Array.isArray(list) && list.length) return list.map(({ categories, ...b }) => ({ ...b, genres: genresFromText(categories || []) }))
      }
    } catch {}
    // respaldo si el servidor no responde
    const [es, all] = await Promise.all([googleBooks(q, author, true).catch(() => []), googleBooks(q, author, false).catch(() => [])])
    let res = dedupe([...es, ...all.filter((r) => r.lang === 'es'), ...all])
    if (res.length < 3) { try { res = dedupe([...res, ...(await openLibrary(q, author))]) } catch {} }
    return res.slice(0, 7)
  }
  const r = await fetch(`/api/search?type=${kind}&q=${encodeURIComponent([q, author].filter(Boolean).join(' '))}`)
  if (!r.ok) return []
  return r.json()
}

const norm = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
function dedupe(list) {
  const seen = new Set()
  return list.filter((r) => { const k = norm(r.title) + '|' + norm(r.creator).split(' ').pop(); if (seen.has(k)) return false; seen.add(k); return true })
}
async function googleBooks(q, author, spanish) {
  const parts = []
  if (q) parts.push(`intitle:${q}`)
  if (author) parts.push(`inauthor:${author}`)
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(parts.join(' '))}&maxResults=12&printType=books${spanish ? '&langRestrict=es' : ''}`
  const r = await fetch(url)
  if (!r.ok) return []
  const j = await r.json()
  const out = (j.items || []).map(({ volumeInfo: v }) => ({
    title: v.subtitle && v.title.length < 18 ? `${v.title}: ${v.subtitle}` : v.title,
    creator: (v.authors || [])[0] || '',
    year: parseInt((v.publishedDate || '').slice(0, 4)) || null,
    pages: v.pageCount || null,
    cover_url: v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace('http://', 'https://').replace('&edge=curl', '') : null,
    lang: spanish ? 'es' : v.language || null,
    genres: genresFromText(v.categories || [], v.mainCategory || ''),
  }))
  // primero los que tienen tapa y coinciden mejor con el título
  const nq = norm(q)
  out.sort((a, b) => (norm(b.title).startsWith(nq) - norm(a.title).startsWith(nq)) || (!!b.cover_url - !!a.cover_url))
  return dedupe(out)
}
async function openLibrary(q, author) {
  const params = new URLSearchParams({ fields: 'key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject', limit: '8' })
  if (q) params.set('title', q)
  if (author) params.set('author', author)
  const r = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!r.ok) return []
  const j = await r.json()
  return (j.docs || []).map((d) => ({
    title: d.title, creator: (d.author_name || [])[0] || '', year: d.first_publish_year || null,
    pages: d.number_of_pages_median || null,
    cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    genres: genresFromText((d.subject || []).slice(0, 12)),
  }))
}

export const fmtDate = (d) => new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
export function timeAgo(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 3600) return `hace ${Math.max(1, Math.round(s / 60))} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  if (s < 172800) return 'ayer'
  return `hace ${Math.round(s / 86400)} días`
}

// ----- Polvo y plantitas -----
const days = (ts) => (ts ? (Date.now() - new Date(ts).getTime()) / 864e5 : 0)
export function dustInfo(lastVisit) {
  const d = days(lastVisit)
  if (d >= 30) return { level: 3, cost: 15, days: Math.floor(d) }
  if (d >= 15) return { level: 2, cost: 10, days: Math.floor(d) }
  if (d >= 7) return { level: 1, cost: 5, days: Math.floor(d) }
  return { level: 0, cost: 0, days: Math.floor(d) }
}
export const plantState = (wateredAt) => { const d = days(wateredAt); return d >= 30 ? 'dry' : d >= 14 ? 'wilted' : 'ok' }
