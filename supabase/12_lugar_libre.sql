-- 12 · Acomodar libre: cada título y deco guarda en qué estante y en qué lugar va
alter table public.items add column if not exists shelf_row int;
alter table public.items add column if not exists shelf_x double precision;
alter table public.user_decos add column if not exists shelf_row int;
alter table public.user_decos add column if not exists shelf_x double precision;
grant update (photo_url, teca, position, stacked, text, shelf_row, shelf_x) on public.user_decos to authenticated;
