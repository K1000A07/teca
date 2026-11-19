// Manda una notificación a todos los celus suscriptos. Solo lo puede usar una cuenta administradora.
import * as webpush from 'web-push'
const SUPABASE_URL = 'https://oeppdldydozrraebsquz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_St106bWGOlC32-woOSJipw_bizgRilX'
const VAPID_PUBLIC = 'BGEwAkOdLwBCGGv7i3gsWZImaz57Poao1-sPK86e7_3-HQpL3eqhIfA6ulYDKLjcMz6O50NSl_ljUq4OoVO51EM'

const rpc = (fn, token, body = {}) => fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
  method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!process.env.VAPID_PRIVATE_KEY) return res.status(500).json({ error: 'Falta configurar VAPID_PRIVATE_KEY en Vercel' })
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const { title, body, url } = req.body || {}
  if (!token || !title) return res.status(400).json({ error: 'Faltan datos' })
  const r = await rpc('admin_push_targets', token)
  if (!r.ok) return res.status(403).json({ error: 'No autorizado' })
  const subs = await r.json()
  webpush.setVapidDetails('mailto:hola@teca.app', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)
  const payload = JSON.stringify({ title: String(title).slice(0, 80), body: String(body || '').slice(0, 200), url: url || '/' })
  let sent = 0, gone = 0
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 }); sent++ }
    catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { gone++; await rpc('admin_push_remove', token, { p_endpoint: s.endpoint }) } }
  }))
  res.status(200).json({ sent, gone, total: subs.length })
}
