// Búsqueda de libros del lado del servidor, priorizando ediciones en castellano.
// Fuentes: Google Books (en castellano y disponibles en Argentina) + Open Library (pidiendo la edición en castellano).
const norm = (x) => (x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

export default async function handler(req, res) {
  const q = String(req.query.q || '').trim()
  const author = String(req.query.author || '').trim()
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  if (q.length < 2 && author.length < 2) return res.status(200).json([])
  const many = q.length < 2 // solo autor: traemos muchos títulos
  const [gEs, olEs, gAll] = await Promise.all([
    google(q, author, true, many).catch(() => []),
    openLibrary(q, author, many).catch(() => []),
    google(q, author, false, many).catch(() => []),
  ])
  const es = [...gEs, ...olEs.filter((r) => r.lang === 'es'), ...gAll.filter((r) => r.lang === 'es')]
  const rest = [...olEs.filter((r) => r.lang !== 'es'), ...gAll.filter((r) => r.lang !== 'es')]
  const nq = norm(q)
  const score = (r) => (norm(r.title).startsWith(nq) ? 2 : norm(r.title).includes(nq) ? 1 : 0) + (r.cover_url ? 1 : 0)
  const seen = new Set()
  const out = [...es.sort((a, b) => score(b) - score(a)), ...rest.sort((a, b) => score(b) - score(a))].filter((r) => {
    const k = norm(r.title) + '|' + norm(r.creator).split(' ').pop()
    if (seen.has(k)) return false
    seen.add(k); return true
  })
  res.status(200).json(out.slice(0, many ? 40 : 15))
}

async function google(q, author, spanish, many) {
  const parts = []
  if (q) parts.push(`intitle:${q}`)
  if (author) parts.push(`inauthor:${author}`)
  const key = process.env.GOOGLE_BOOKS_KEY ? `&key=${process.env.GOOGLE_BOOKS_KEY}` : ''
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(parts.join(' '))}&maxResults=${many ? 40 : 20}&printType=books&country=AR${spanish ? '&langRestrict=es' : ''}${key}`
  const j = await (await fetch(url)).json()
  return (j.items || []).map(({ volumeInfo: v }) => ({
    title: v.subtitle && v.title.length < 18 ? `${v.title}: ${v.subtitle}` : v.title,
    creator: (v.authors || [])[0] || '',
    year: parseInt((v.publishedDate || '').slice(0, 4)) || null,
    pages: v.pageCount || null,
    cover_url: v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace('http://', 'https://').replace('&edge=curl', '') : null,
    lang: v.language || (spanish ? 'es' : null),
    categories: [...(v.categories || []), v.mainCategory || ''].filter(Boolean),
  }))
}

async function openLibrary(q, author, many) {
  const params = new URLSearchParams({
    lang: 'es', limit: many ? '40' : '10',
    fields: 'title,author_name,first_publish_year,cover_i,number_of_pages_median,subject,editions,editions.title,editions.language,editions.cover_i,editions.number_of_pages_median,editions.publish_date',
  })
  if (q) params.set('title', q)
  if (author) params.set('author', author)
  const j = await (await fetch(`https://openlibrary.org/search.json?${params}`, { headers: { 'User-Agent': 'teca (teca-tau.vercel.app)' } })).json()
  return (j.docs || []).map((d) => {
    const ed = d.editions?.docs?.[0]
    const spa = ed && (ed.language || []).includes('spa')
    const cover = (spa && ed.cover_i) || d.cover_i
    return {
      title: spa && ed.title ? ed.title : d.title,
      creator: (d.author_name || [])[0] || '',
      year: d.first_publish_year || null,
      pages: (spa && ed.number_of_pages_median) || d.number_of_pages_median || null,
      cover_url: cover ? `https://covers.openlibrary.org/b/id/${cover}-L.jpg` : null,
      lang: spa ? 'es' : null,
      categories: (d.subject || []).slice(0, 12),
    }
  })
}
