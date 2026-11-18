// Lógica compartida: tecoins, medidas de lomos, colores y búsqueda de títulos.

export const KINDS = {
  book: { teca: 'biblio', label: 'libro', plural: 'libros', creator: 'Autor/a', verb: 'leíste', icon: 'book' },
  movie: { teca: 'filmo', label: 'peli', plural: 'pelis', creator: 'Dirección', verb: 'viste', icon: 'clap' },
  show: { teca: 'video', label: 'serie', plural: 'series', creator: 'Plataforma', verb: 'viste', icon: 'tv' },
}
export const KIND_ORDER = ['book', 'movie', 'show']

export const GENRES = [
  ['amor', '💘', 'amor'], ['scifi', '🚀', 'ciencia ficción'], ['thriller', '🔪', 'thriller'],
  ['drama', '🎭', 'drama'], ['comedia', '😂', 'comedia'], ['terror', '👻', 'terror'],
  ['fantasia', '🐉', 'fantasía'], ['noficcion', '🧠', 'no ficción'],
]
export const genreLabel = (g) => { const x = GENRES.find((y) => y[0] === g); return x ? `${x[1]} ${x[2]}` : null }

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
    if (it.seen_where === 'cine') parts.push([COINS.cinema, 'en el cine'])
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
export async function searchTitles(kind, q) {
  if (!q || q.trim().length < 3) return []
  if (kind === 'book') {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median&limit=6`
    const r = await fetch(url)
    if (!r.ok) return []
    const j = await r.json()
    return (j.docs || []).map((d) => ({
      title: d.title,
      creator: (d.author_name || [])[0] || '',
      year: d.first_publish_year || null,
      pages: d.number_of_pages_median || null,
      cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    }))
  }
  const key = import.meta.env.VITE_TMDB_KEY
  if (!key) return []
  const type = kind === 'movie' ? 'movie' : 'tv'
  const r = await fetch(`https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(q)}&language=es-AR&api_key=${key}`)
  if (!r.ok) return []
  const j = await r.json()
  return (j.results || []).slice(0, 6).map((d) => ({
    tmdb_id: d.id,
    title: d.title || d.name,
    creator: '',
    year: parseInt((d.release_date || d.first_air_date || '').slice(0, 4)) || null,
    cover_url: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
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
