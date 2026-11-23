-- 22 · Edad y lugar donde vivís (datos privados: solo los ve cada persona; el panel de admin los lee para armar números para marcas)
-- Corré este archivo entero en el SQL Editor de Supabase. Se puede correr más de una vez.
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age_range text check (age_range is null or age_range in ('18-24','25-34','35-44','45+')),
  location text,
  province text,
  place_id text,
  updated_at timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists "mis datos privados" on public.profile_private;
create policy "mis datos privados" on public.profile_private for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admin ve datos privados" on public.profile_private;
create policy "admin ve datos privados" on public.profile_private for select to authenticated using (public.is_admin());
grant select, insert, update on public.profile_private to authenticated;
