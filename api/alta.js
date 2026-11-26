// Se llama al terminar de crear el perfil: manda el mail de bienvenida con Brevo
// y, si la persona tildó novedades, la suma a la lista de contactos.
const SUPABASE_URL = 'https://oeppdldydozrraebsquz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_St106bWGOlC32-woOSJipw_bizgRilX'
const BREVO = 'https://api.brevo.com/v3'

const WELCOME = (name) => `<div style="font-family:Arial,sans-serif;color:#141210;max-width:520px">
<p style="font-size:28px;font-weight:800;margin:0 0 16px">¡Bienvenida${name ? ', ' + name : ''}!</p>
<p style="font-size:16px;line-height:1.5">Ya tenés tu cuenta en <em>teca</em>. Empezá por tu estante: sumá el primer libro, peli o serie y puntualo.</p>
<p style="font-size:16px;line-height:1.5">Cuando tengas amigos en teca, podés ver sus estantes, comentar y guardar lo que te recomienden.</p>
<p style="margin:28px 0"><a href="https://appteca.com.ar/app" style="background:#E6F04A;color:#141210;padding:14px 22px;border-radius:99px;text-decoration:none;font-weight:800;box-shadow:inset 0 0 0 1.5px #141210">Abrir teca</a></p>
<p style="font-size:13px;color:#6b6b6b">Si no creaste esta cuenta, respondé este mail y la borramos.</p>
</div>`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Falta sesión' })

  // Quién es, según Supabase (no confiamos en lo que mande el cliente)
  const ru = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } })
  if (!ru.ok) return res.status(401).json({ error: 'Sesión inválida' })
  const user = await ru.json()
  const email = user?.email
  if (!email) return res.status(400).json({ error: 'Sin mail' })

  // Su perfil (con su propio token, así RLS la deja leer)
  const rp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=name,news_consent`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } })
  const [profile] = rp.ok ? await rp.json() : []
  const name = (profile?.name || '').split(' ')[0]

  const key = process.env.BREVO_API_KEY
  if (!key) return res.status(200).json({ ok: false, motivo: 'Falta BREVO_API_KEY' })
  const headers = { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' }
  const out = { welcome: false, lista: false }

  // Mail de bienvenida
  const sender = process.env.BREVO_SENDER_EMAIL || 'no-responder@appteca.com.ar'
  try {
    const w = await fetch(`${BREVO}/smtp/email`, {
      method: 'POST', headers,
      body: JSON.stringify({ sender: { name: 'teca', email: sender }, to: [{ email, name: profile?.name || undefined }], replyTo: { email: 'contactoappteca@gmail.com', name: 'teca' }, subject: '¡Bienvenida a teca!', htmlContent: WELCOME(name) }),
    })
    out.welcome = w.ok
  } catch {}

  // Lista de novedades, solo si tildó la casilla
  if (profile?.news_consent && process.env.BREVO_LIST_ID) {
    try {
      const c = await fetch(`${BREVO}/contacts`, {
        method: 'POST', headers,
        body: JSON.stringify({ email, attributes: { NOMBRE: profile?.name || '' }, listIds: [Number(process.env.BREVO_LIST_ID)], updateEnabled: true }),
      })
      out.lista = c.ok || c.status === 204
    } catch {}
  }
  res.status(200).json(out)
}
