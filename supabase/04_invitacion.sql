-- teca · datos públicos de un link de regalo (para la vista previa y el aviso de bienvenida)
-- Pegar en Supabase › SQL Editor › New query › Run.
create or replace function public.invite_info(p_code text)
returns table (coins int, inviter text, valid boolean)
language sql stable security definer set search_path = public as $$
  select i.coins, coalesce(nullif(p.name, ''), 'Alguien'), i.uses < i.max_uses
  from invites i left join profiles p on p.id = i.created_by
  where i.code = lower(p_code);
$$;
grant execute on function public.invite_info(text) to anon, authenticated;
