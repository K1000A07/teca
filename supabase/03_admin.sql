-- teca · panel de administración
-- Pegar en Supabase › SQL Editor › New query › Run. (Necesita haber corrido antes 02_regalos.sql)

-- La administradora puede ver todos los títulos
drop policy if exists "admin ve todos los títulos" on public.items;
create policy "admin ve todos los títulos" on public.items for select to authenticated using (public.is_admin());

-- Lista de usuarios con mail, fechas y números (solo para administradores)
create or replace function public.admin_users()
returns table (id uuid, email text, username text, name text, emoji text, color text, avatar_url text,
               signed_up timestamptz, last_seen timestamptz, titles bigint, books bigint, movies bigint, shows bigint,
               coins bigint, friends bigint, gift_code text, last_title_at timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, p.username, p.name, p.emoji, p.color, p.avatar_url,
    u.created_at, u.last_sign_in_at,
    (select count(*) from items i where i.user_id = u.id),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'book'),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'movie'),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'show'),
    coalesce((select sum(coins) from items i where i.user_id = u.id), 0) + coalesce(p.bonus_coins, 0),
    (select count(*) from friendships f where f.status = 'accepted' and u.id in (f.requester, f.addressee)),
    (select r.code from redemptions r where r.user_id = u.id),
    (select max(created_at) from items i where i.user_id = u.id)
  from auth.users u left join profiles p on p.id = u.id
  where public.is_admin()
  order by u.created_at desc;
$$;
grant execute on function public.admin_users() to authenticated;
