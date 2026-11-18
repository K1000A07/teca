// Sirve la app con una vista previa (Open Graph) personalizada para cada link de regalo: /regalo/CODIGO
const SUPABASE_URL = 'https://oeppdldydozrraebsquz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_St106bWGOlC32-woOSJipw_bizgRilX'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export default async function handler(req, res) {
  const code = String(req.query.code || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `https://${host}`
  let info = null
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/invite_info`, {
      method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_code: code }),
    })
    info = (await r.json())?.[0] || null
  } catch {}
  let html = await (await fetch(`${origin}/index.html`)).text()
  const title = info?.valid ? `${info.inviter} te invita a teca 🎁` : 'Te invitaron a teca'
  const desc = info?.valid
    ? `Te regala ${info.coins} tecoins para arrancar tu biblioteca de bolsillo: libros, pelis y series para compartir con amigos.`
    : 'Tu biblioteca de bolsillo: libros, pelis y series para compartir con amigos.'
  const meta = `
<meta property="og:type" content="website">
<meta property="og:site_name" content="teca">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${origin}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${origin}/regalo/${code}">
<meta name="twitter:card" content="summary_large_image">
<script>try{localStorage.setItem('teca.gift',${JSON.stringify(code)})}catch(e){}</script>`
  html = html.replace(/<!-- og:start -->[\s\S]*?<!-- og:end -->/, '').replace('<title>teca</title>', `<title>${esc(title)}</title>${meta}`)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=300')
  res.status(200).send(html)
}
