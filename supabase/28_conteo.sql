-- Cantidad de títulos por tipo de cualquier perfil (solo números, no los títulos), para mostrarla aunque la teca sea cerrada.
create or replace function public.profile_counts(uid uuid)
returns table(kind text, n bigint)
language sql stable security definer set search_path = public as $$
  select kind, count(*) from public.items where user_id = uid group by kind
$$;
grant execute on function public.profile_counts(uuid) to authenticated;
