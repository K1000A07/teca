-- 23 · Fundadora y equipo con permisos por función
-- Corré este archivo entero en el SQL Editor de Supabase. Se puede correr más de una vez.
-- Quién es qué:
--   · Fundadora (k1000a): acceso total, siempre. Es la única que puede dar o sacar acceso al panel.
--   · Equipo: cada persona entra al panel solo a las funciones que la fundadora le prendió.
--   · Cualquier otra cuenta: no entra a /admin ni puede leer nada del panel, ni tocando la base desde afuera.

alter table public.profiles add column if not exists is_founder boolean not null default false;
-- is_founder no está en los permisos de escritura de profiles: nadie puede ponérselo desde la app.
update public.profiles set is_founder = true, is_admin = true where username = 'k1000a';

create or replace function public.admin_perm_keys()
returns text[] language sql immutable as $$
  select array['usuarios','impresiones','avisos','regalos','tareas','contenido','presupuesto','docs'];
$$;

create table if not exists public.admin_access (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  perms text[] not null default '{}',
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_founder from profiles where id = auth.uid()), false);
$$;
create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_founder() or exists (select 1 from admin_access where user_id = auth.uid() and p = any(perms));
$$;
-- is_admin() = tiene acceso al panel (fundadora o equipo)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_founder() or exists (select 1 from admin_access where user_id = auth.uid());
$$;
grant execute on function public.is_founder() to authenticated;
grant execute on function public.has_perm(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_access enable row level security;
drop policy if exists "ver acceso al panel" on public.admin_access;
create policy "ver acceso al panel" on public.admin_access for select to authenticated using (user_id = auth.uid() or public.is_founder());
grant select on public.admin_access to authenticated;
-- No hay políticas de escritura: solo se cambia con las funciones de abajo, y solo las usa la fundadora.

-- Quien ya era administradora antes de esto queda en el equipo con todo prendido (la fundadora puede ajustarlo)
insert into public.admin_access (user_id, perms)
select id, public.admin_perm_keys() from public.profiles where is_admin and not is_founder
on conflict (user_id) do nothing;

-- Qué puedo ver yo en el panel
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_founder() then jsonb_build_object('founder', true, 'perms', to_jsonb(public.admin_perm_keys()))
    else coalesce((select jsonb_build_object('founder', false, 'perms', to_jsonb(perms)) from admin_access where user_id = auth.uid()),
                  jsonb_build_object('founder', false, 'perms', '[]'::jsonb)) end;
$$;
grant execute on function public.my_access() to authenticated;

-- Dar o cambiar el acceso de alguien (solo la fundadora; a ella misma no se le puede tocar nada)
create or replace function public.admin_set_access(p_user uuid, p_perms text[])
returns void language plpgsql security definer set search_path = public as $$
declare clean text[];
begin
  if not public.is_founder() then raise exception 'Solo la fundadora puede dar acceso al panel'; end if;
  if not exists (select 1 from profiles where id = p_user) then raise exception 'Esa persona no existe'; end if;
  if exists (select 1 from profiles where id = p_user and is_founder) then raise exception 'La fundadora siempre tiene acceso total'; end if;
  select coalesce(array_agg(distinct k), '{}') into clean from unnest(coalesce(p_perms, '{}')) k where k = any(public.admin_perm_keys());
  insert into admin_access (user_id, perms, granted_by) values (p_user, clean, auth.uid())
    on conflict (user_id) do update set perms = excluded.perms, updated_at = now();
  update profiles set is_admin = true where id = p_user;
end $$;
create or replace function public.admin_remove_access(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'Solo la fundadora puede sacar acceso al panel'; end if;
  if exists (select 1 from profiles where id = p_user and is_founder) then raise exception 'La fundadora siempre tiene acceso total'; end if;
  delete from admin_access where user_id = p_user;
  update profiles set is_admin = false where id = p_user;
end $$;
grant execute on function public.admin_set_access(uuid, text[]) to authenticated;
grant execute on function public.admin_remove_access(uuid) to authenticated;

-- ===== Cada parte del panel pide su permiso =====
-- Usuarios, resumen y actividad
drop policy if exists "admin ve todos los títulos" on public.items;
create policy "admin ve todos los títulos" on public.items for select to authenticated using (public.has_perm('usuarios'));
drop policy if exists "ver mis decos y las de amigos" on public.user_decos;
create policy "ver mis decos y las de amigos" on public.user_decos for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id) or public.is_public(user_id) or public.has_perm('usuarios'));
drop policy if exists "mis invitados" on public.referrals;
create policy "mis invitados" on public.referrals for select to authenticated
  using (inviter = auth.uid() or new_user = auth.uid() or public.has_perm('usuarios'));
drop policy if exists "admin ve datos privados" on public.profile_private;
create policy "admin ve datos privados" on public.profile_private for select to authenticated using (public.has_perm('usuarios'));

drop function if exists public.admin_users();
create or replace function public.admin_users()
returns table (id uuid, email text, username text, name text, emoji text, color text, avatar_url text,
               signed_up timestamptz, last_seen timestamptz, titles bigint, books bigint, movies bigint, shows bigint,
               coins bigint, friends bigint, gift_code text, last_title_at timestamptz,
               is_founder boolean, admin_perms text[])
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
    (select max(created_at) from items i where i.user_id = u.id),
    coalesce(p.is_founder, false),
    (select a.perms from admin_access a where a.user_id = u.id)
  from auth.users u left join profiles p on p.id = u.id
  where public.has_perm('usuarios')
  order by u.created_at desc;
$$;
grant execute on function public.admin_users() to authenticated;

-- Notificaciones
create or replace function public.admin_push_targets()
returns table (endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public as $$
  select endpoint, p256dh, auth from push_subscriptions where public.has_perm('avisos');
$$;
create or replace function public.admin_push_remove(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and public.has_perm('avisos');
$$;
create or replace function public.admin_push_count()
returns bigint language sql stable security definer set search_path = public as $$
  select case when public.has_perm('avisos') then (select count(distinct user_id) from push_subscriptions) else 0 end;
$$;

-- Links de regalo
drop policy if exists "admin ve links" on public.invites;
create policy "admin ve links" on public.invites for select to authenticated using (public.has_perm('regalos'));
drop policy if exists "admin crea links" on public.invites;
create policy "admin crea links" on public.invites for insert to authenticated with check (public.has_perm('regalos') and created_by = auth.uid());
drop policy if exists "admin borra links" on public.invites;
create policy "admin borra links" on public.invites for delete to authenticated using (public.has_perm('regalos'));
drop policy if exists "mi regalo" on public.redemptions;
create policy "mi regalo" on public.redemptions for select to authenticated using (user_id = auth.uid() or public.has_perm('regalos'));

-- Impresiones
drop policy if exists "admin ve impresiones" on public.ad_impressions;
create policy "admin ve impresiones" on public.ad_impressions for select to authenticated using (public.has_perm('impresiones'));
drop function if exists public.admin_ad_report(int, boolean);
create or replace function public.admin_ad_report(p_days int default 28, p_admin boolean default false)
returns table (space text, impressions bigint, people bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select i.space, i.user_id from ad_impressions i
    join profiles p on p.id = i.user_id
    where public.has_perm('impresiones') and (p_admin or not coalesce(p.is_admin, false))
      and i.created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select space, count(*), count(distinct user_id) from base group by space
  union all
  select '_activos', count(*), count(distinct user_id) from base;
$$;
grant execute on function public.admin_ad_report(int, boolean) to authenticated;

-- Tablero de trabajo
do $$ declare t text; pm text; begin
  for t, pm in select * from (values ('admin_tasks', 'tareas'), ('admin_content', 'contenido'), ('admin_budget', 'presupuesto'), ('admin_expenses', 'presupuesto'), ('admin_docs', 'docs')) v(a, b) loop
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.has_perm(%L)) with check (public.has_perm(%L))', t, pm, pm);
  end loop;
end $$;
-- La versión anterior del tablero ya no se usa en el panel: queda solo para la fundadora
drop policy if exists "solo admin" on public.admin_board;
create policy "solo admin" on public.admin_board for all to authenticated using (public.is_founder()) with check (public.is_founder());
