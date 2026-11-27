// Link personal de invitación con vista previa: /r/USUARIO
const SUPABASE_URL = 'https://oeppdldydozrraebsquz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_St106bWGOlC32-woOSJipw_bizgRilX'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export default async function handler(req, res) {
  const user = String(req.query.u || '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20)
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  let info = null
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ref_info`, { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_username: user }) })
    info = (await r.json())?.[0] || null
  } catch {}
  let html = await (await fetch(`${origin}/index.html`)).text()
  const title = info ? `${info.name} te invita a teca 📚` : 'Te invitaron a teca'
  const desc = 'Tu biblioteca de bolsillo: guardá todo lo que leés y mirás, y compartilo con tus amigos. Sumate y arrancá con 20 tecoins de regalo.'
  const meta = `
<meta property="og:type" content="website">
<meta property="og:site_name" content="teca">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${origin}/og.jpg?v=2">
<meta property="og:image:secure_url" content="${origin}/og.jpg?v=2">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${origin}/r/${user}">
<meta name="twitter:card" content="summary_large_image">
<script>try{localStorage.setItem('teca.ref',${JSON.stringify(user)})}catch(e){}</script>`
  html = html.replace(/<!-- og:start -->[\s\S]*?<!-- og:end -->/, '').replace('<title>teca</title>', `<title>${esc(title)}</title>${meta}`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300')
  res.status(200).send(html)
}
