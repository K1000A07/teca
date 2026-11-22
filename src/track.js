import { useEffect } from 'react'
import { sb } from './supabase.js'

// Cuenta cuántas veces se ve cada pantalla donde va a ir publicidad (ver supabase/21_impresiones.sql).
// Espacios: conecta, sumaste, tecoins, buscador, detalle, eventos. Nunca interrumpe la app si falla.
const recent = {}
export function track(space, uid) {
  if (!uid) return
  const now = Date.now()
  if (recent[space] && now - recent[space] < 3000) return // evita contar dos veces el mismo montaje
  recent[space] = now
  try { sb.from('ad_impressions').insert({ user_id: uid, space }).then(() => {}, () => {}) } catch {}
}
export function useImpression(space, uid, on = true) {
  useEffect(() => { if (on) track(space, uid) }, [space, uid, on])
}
