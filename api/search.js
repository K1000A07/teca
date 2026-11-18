// Búsqueda de pelis y series del lado del servidor (Vercel).
// Si hay TMDB_KEY configurada usa TMDB; si no, usa el catálogo público de iTunes (Argentina).
export default async function handler(req, res) {
  const { type = 'movie', q = '' } = req.query
  const term = String(q).trim()
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  if (term.length < 2) return res.status(200).json([])
  try {
    const out = process.env.TMDB_KEY ? await tmdb(type, term) : await itunes(type, term)
    res.status(200).json(out.slice(0, 7))
  } catch (e) {
    res.status(200).json([])
  }
}

const big = (u) => (u ? u.replace(/\/\d+x\d+(bb)?\./, '/600x900bb.') : null)

async function itunes(type, term) {
  const base = 'https://itunes.apple.com/search?country=ar&lang=es_mx&limit=25&term=' + encodeURIComponent(term)
  if (type === 'movie') {
    const j = await (await fetch(base + '&media=movie&entity=movie')).json()
    return (j.results || []).map((r) => ({
      title: r.trackName,
      creator: r.artistName || '',
      year: parseInt((r.releaseDate || '').slice(0, 4)) || null,
      cover_url: big(r.artworkUrl100),
    }))
  }
  const j = await (await fetch(base + '&media=tvShow&entity=tvSeason')).json()
  const shows = new Map()
  for (const r of j.results || []) {
    const name = (r.artistName || r.collectionName || '').trim()
    if (!name) continue
    const m = (r.collectionName || '').match(/(?:season|temporada)\s*(\d+)/i)
    const n = m ? parseInt(m[1]) : 1
    const s = shows.get(name) || { title: name, creator: '', year: null, seasons: 0, cover_url: null, _first: 99 }
    s.seasons = Math.max(s.seasons, n)
    const y = parseInt((r.releaseDate || '').slice(0, 4)) || null
    if (n < s._first) { s._first = n; s.year = y; s.cover_url = big(r.artworkUrl100) }
    shows.set(name, s)
  }
  return [...shows.values()].map(({ _first, ...s }) => s)
}

async function tmdb(type, term) {
  const key = process.env.TMDB_KEY
  const kind = type === 'movie' ? 'movie' : 'tv'
  const j = await (await fetch(`https://api.themoviedb.org/3/search/${kind}?query=${encodeURIComponent(term)}&language=es-AR&api_key=${key}`)).json()
  const top = (j.results || []).slice(0, 7)
  return Promise.all(top.map(async (d) => {
    const det = await (await fetch(`https://api.themoviedb.org/3/${kind}/${d.id}?language=es-AR&append_to_response=credits&api_key=${key}`)).json().catch(() => ({}))
    const director = kind === 'movie' ? (det.credits?.crew || []).find((c) => c.job === 'Director')?.name : (det.created_by || [])[0]?.name
    return {
      tmdb_id: d.id,
      title: d.title || d.name,
      creator: director || '',
      year: parseInt((d.release_date || d.first_air_date || '').slice(0, 4)) || null,
      seasons: kind === 'tv' ? det.number_of_seasons || null : null,
      cover_url: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
    }
  }))
}
