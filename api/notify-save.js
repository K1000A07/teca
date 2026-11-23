// Le avisa al celu de alguien que guardaron un título suyo (y que ganó 2 tecoins)
import * as webpush from 'web-push'
const SUPABASE_URL = 'https://oeppdldydozrraebsquz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_St106bWGOlC32-woOSJipw_bizgRilX'
const VAPID_PUBLIC = 'BGEwAkOdLwBCGGv7i3gsWZImaz57Poao1-sPK86e7_3-HQpL3eqhIfA6ulYDKLjcMz6O50NSl_ljUq4OoVO51EM'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usá POST' })
  if (!process.env.VAPID_PRIVATE_KEY) return res.status(200).json({ sent: 0 })
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const { item_id } = req.body || {}
  if (!token || !item_id) return res.status(400).json({ error: 'Faltan datos' })
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_push_targets`, {
    method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_item: item_id }),
  })
  if (!r.ok) return res.status(200).json({ sent: 0 })
  const subs = await r.json()
  if (!Array.isArray(subs) || !subs.length) return res.status(200).json({ sent: 0 })
  webpush.setVapidDetails('mailto:hola@teca.app', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY)
  const { saver, title, kind } = subs[0]
  const payload = JSON.stringify({ title: `${saver} guardó ${title}`.slice(0, 80), body: `Lo vio en tu ${kind === 'book' ? 'biblio' : kind === 'movie' ? 'filmo' : 'video'}teca. ¡Ganaste 2 tecoins!`, url: '/app?tab=news' })
  let sent = 0
  await Promise.all(subs.map(async (s) => { try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 }); sent++ } catch {} }))
  res.status(200).json({ sent })
}
