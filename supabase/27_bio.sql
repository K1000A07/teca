-- Descripción del perfil (estilo Instagram), hasta 150 caracteres. Opcional.
alter table public.profiles add column if not exists bio text;
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (bio is null or char_length(bio) <= 150);
grant insert (bio) on public.profiles to authenticated;
grant update (bio) on public.profiles to authenticated;

-- Cantidad de títulos por tipo de cualquier perfil (solo números, no los títulos), para mostrarla aunque la teca sea cerrada.
create or replace function public.profile_counts(uid uuid)
returns table(kind text, n bigint)
language sql stable security definer set search_path = public as $$
  select kind, count(*) from public.items where user_id = uid group by kind
$$;
grant execute on function public.profile_counts(uuid) to authenticated;
