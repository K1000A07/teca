-- Descripción del perfil (estilo Instagram), hasta 150 caracteres. Opcional.
alter table public.profiles add column if not exists bio text;
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 150);
grant insert (bio) on public.profiles to authenticated;
grant update (bio) on public.profiles to authenticated;
