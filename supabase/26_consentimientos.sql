-- 26 · Consentimientos al crear la cuenta: aceptación de términos y de novedades por mail
-- Corré este archivo entero en el SQL Editor de Supabase. Se puede correr más de una vez.
alter table public.profiles add column if not exists terms_at timestamptz;
alter table public.profiles add column if not exists news_consent boolean not null default false;
alter table public.profiles add column if not exists news_at timestamptz;
grant insert (terms_at, news_consent, news_at) on public.profiles to authenticated;
