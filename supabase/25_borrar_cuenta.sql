-- Borrar la cuenta desde la app. Borra el usuario de auth; sus datos caen por cascada.
create or replace function public.borrar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'No hay sesión'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.borrar_mi_cuenta() from public;
grant execute on function public.borrar_mi_cuenta() to authenticated;
