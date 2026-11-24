-- 24 · Tutorial visto guardado en la cuenta (no en el navegador): si la persona entra desde la app instalada, no lo vuelve a ver
-- Corré este archivo entero en el SQL Editor de Supabase. Se puede correr más de una vez.
alter table public.profiles add column if not exists tour_seen text[] not null default '{}';
grant update (tour_seen) on public.profiles to authenticated;
-- Las cuentas que ya existen ya vieron el tutorial y las novedades
update public.profiles set tour_seen = array['tour2', 'news3'] where tour_seen = '{}';
