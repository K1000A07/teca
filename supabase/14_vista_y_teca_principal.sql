-- 14 · Teca que se ve primero en tu perfil (null = la que más títulos tiene)
alter table public.profiles add column if not exists default_teca text check (default_teca is null or default_teca in ('book','movie','show'));
grant update (default_teca) on public.profiles to authenticated;
