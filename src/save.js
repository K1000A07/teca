import { sb } from './supabase.js'

// Guardar / sacar de "para después". Si es de otra persona, ella gana 2 tecoins (una sola vez)
export async function toggleSave(ctx, it) {
  const isSaved = ctx.saved.some((s) => s.id === it.id)
  if (isSaved) {
    await sb.from('saved').delete().eq('user_id', ctx.uid).eq('item_id', it.id)
    ctx.setSaved((s) => s.filter((x) => x.id !== it.id))
    return
  }
  const { error } = await sb.from('saved').insert({ user_id: ctx.uid, item_id: it.id })
  if (error && error.code !== '23505') return ctx.say('No se pudo guardar')
  ctx.setSaved((s) => [it, ...s])
  const owner = ctx.people[it.user_id]
  if (!owner || it.user_id === ctx.uid) return ctx.say('Guardado para después')
  const since = new Date(Date.now() - 60000).toISOString()
  const { data } = await sb.from('save_rewards').select('id').eq('saver_id', ctx.uid).eq('item_id', it.id).gte('created_at', since).maybeSingle()
  if (data) {
    ctx.say(`Guardado · ${owner.name} ganó 2 tecoins por recomendártelo`)
    const { data: s } = await sb.auth.getSession()
    fetch('/api/notify-save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token}` }, body: JSON.stringify({ item_id: it.id }) }).catch(() => {})
  } else ctx.say('Guardado para después')
}
