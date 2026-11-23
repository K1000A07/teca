// Sugerencias de lugares de Argentina para "¿Dónde vivís?".
// Barrios de CABA propios + localidades del servicio oficial Georef (datos.gob.ar), así todos quedan escritos igual.
const CABA = ['Agronomía', 'Almagro', 'Balvanera', 'Barracas', 'Belgrano', 'Boedo', 'Caballito', 'Chacarita', 'Coghlan', 'Colegiales', 'Constitución', 'Flores', 'Floresta', 'La Boca', 'La Paternal', 'Liniers', 'Mataderos', 'Monte Castro', 'Montserrat', 'Nueva Pompeya', 'Núñez', 'Palermo', 'Parque Avellaneda', 'Parque Chacabuco', 'Parque Chas', 'Parque Patricios', 'Puerto Madero', 'Recoleta', 'Retiro', 'Saavedra', 'San Cristóbal', 'San Nicolás', 'San Telmo', 'Vélez Sarsfield', 'Versalles', 'Villa Crespo', 'Villa del Parque', 'Villa Devoto', 'Villa General Mitre', 'Villa Lugano', 'Villa Luro', 'Villa Ortúzar', 'Villa Pueyrredón', 'Villa Real', 'Villa Riachuelo', 'Villa Santa Rita', 'Villa Soldati', 'Villa Urquiza']
const CABA_NAME = 'Ciudad Autónoma de Buenos Aires'
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const title = (s) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s)
const short = (p) => (p === CABA_NAME ? 'CABA' : p)

export default async function handler(req, res) {
  const q = String(req.query.q || '').trim().slice(0, 60)
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  if (norm(q).length < 2) return res.status(200).json([])
  const nq = norm(q)
  const out = CABA.filter((b) => norm(b).split(' ').some((w) => w.startsWith(nq)) || norm(b).startsWith(nq))
    .sort((a, b) => Number(norm(b).startsWith(nq)) - Number(norm(a).startsWith(nq)))
    .map((b) => ({ id: 'caba:' + norm(b).replace(/\s+/g, '-'), name: b, province: CABA_NAME, label: `${b}, CABA` }))
  try {
    const url = 'https://apis.datos.gob.ar/georef/api/v2.0/localidades?max=10&orden=nombre&campos=id,nombre,provincia.nombre,departamento.nombre&nombre=' + encodeURIComponent(q)
    const j = await (await fetch(url)).json()
    const rows = (j.localidades || []).filter((l) => l.provincia?.nombre && l.provincia.nombre !== CABA_NAME)
    const count = {}
    rows.forEach((l) => { const k = norm(title(l.nombre)) + '|' + l.provincia.nombre; count[k] = (count[k] || 0) + 1 })
    rows.forEach((l) => {
      const name = title(l.nombre), prov = l.provincia.nombre
      const dup = count[norm(name) + '|' + prov] > 1 && l.departamento?.nombre
      out.push({ id: String(l.id), name, province: prov, label: dup ? `${name}, ${title(l.departamento.nombre)}, ${short(prov)}` : `${name}, ${short(prov)}` })
    })
  } catch (e) { /* si el servicio no responde, quedan los barrios de CABA */ }
  const seen = new Set()
  res.status(200).json(out.filter((o) => (seen.has(o.label) ? false : seen.add(o.label))).slice(0, 8))
}
