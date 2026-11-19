-- teca · TODO JUNTO (archivos 02 a 09)
-- Pegar entero en Supabase › SQL Editor › New query › Run. Se puede correr más de una vez.

alter table public.items add column if not exists platform text;

-- ===================== 02_regalos =====================
-- teca · links de regalo con tecoins
-- Pegar en Supabase › SQL Editor › New query › Run.

alter table public.profiles add column if not exists bonus_coins int not null default 0;
alter table public.profiles add column if not exists is_admin boolean not null default false;

create table if not exists public.invites (
  code text primary key check (code ~ '^[a-z0-9-]{3,40}$'),
  coins int not null check (coins between 1 and 1000),
  max_uses int not null default 1 check (max_uses between 1 and 500),
  uses int not null default 0,
  note text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  user_id uuid primary key references public.profiles on delete cascade,
  code text not null references public.invites on delete cascade,
  coins int not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Canjear un regalo: solo cuentas nuevas (perfil de menos de 1 día), un regalo por persona
create or replace function public.redeem_invite(p_code text)
returns int language plpgsql security definer set search_path = public as $$
declare inv invites; prof profiles;
begin
  select * into prof from profiles where id = auth.uid();
  if prof.id is null or prof.created_at < now() - interval '1 day' then return 0; end if;
  if exists (select 1 from redemptions where user_id = auth.uid()) then return 0; end if;
  select * into inv from invites where code = lower(p_code) for update;
  if inv.code is null or inv.uses >= inv.max_uses then return 0; end if;
  insert into redemptions (user_id, code, coins) values (auth.uid(), inv.code, inv.coins);
  update invites set uses = uses + 1 where code = inv.code;
  update profiles set bonus_coins = bonus_coins + inv.coins where id = auth.uid();
  return inv.coins;
end;
$$;

alter table public.invites enable row level security;
alter table public.redemptions enable row level security;
drop policy if exists "admin ve links" on public.invites;
create policy "admin ve links" on public.invites for select to authenticated using (public.is_admin());
drop policy if exists "admin crea links" on public.invites;
create policy "admin crea links" on public.invites for insert to authenticated with check (public.is_admin() and created_by = auth.uid());
drop policy if exists "admin borra links" on public.invites;
create policy "admin borra links" on public.invites for delete to authenticated using (public.is_admin());
drop policy if exists "mi regalo" on public.redemptions;
create policy "mi regalo" on public.redemptions for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Nadie puede darse tecoins ni hacerse admin editando su propio perfil
revoke insert, update on public.profiles from authenticated;
grant insert (id, username, name, emoji, color, avatar_url, show_in_ranking) on public.profiles to authenticated;
grant update (username, name, emoji, color, avatar_url, show_in_ranking) on public.profiles to authenticated;

grant select, insert, delete on public.invites to authenticated;
grant select on public.redemptions to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ===================== 03_admin =====================
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

-- ===================== 04_invitacion =====================
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

-- ===================== 05_acomodar_premios =====================
-- teca · acomodar estantes y premios (decoraciones)
-- Pegar en Supabase › SQL Editor › New query › Run. (Necesita haber corrido antes 02_regalos.sql)

-- Libros acostados
alter table public.items add column if not exists lying boolean not null default false;

-- Estilo del estante elegido
alter table public.profiles add column if not exists shelf_style text not null default 'madera';
grant update (shelf_style) on public.profiles to authenticated;

-- Decoraciones compradas con tecoins
create table if not exists public.user_decos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('plantita','taza','portarretrato','lampara','estante_blanco','estante_celeste')),
  price int not null,
  photo_url text,
  teca text check (teca in ('book','movie','show')),
  position double precision,
  created_at timestamptz not null default now()
);
create index if not exists user_decos_user_idx on public.user_decos (user_id);

alter table public.user_decos enable row level security;
drop policy if exists "ver mis decos y las de amigos" on public.user_decos;
create policy "ver mis decos y las de amigos" on public.user_decos for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id) or public.is_admin());
drop policy if exists "mover mis decos" on public.user_decos;
create policy "mover mis decos" on public.user_decos for update to authenticated using (user_id = auth.uid());
grant select on public.user_decos to authenticated;
grant update (photo_url, teca, position) on public.user_decos to authenticated;

-- Precios (se definen acá para que nadie los pueda cambiar desde la app)
create or replace function public.deco_price(p_kind text)
returns int language sql immutable as $$
  select case p_kind
    when 'plantita' then 30 when 'taza' then 40 when 'portarretrato' then 60
    when 'lampara' then 80 when 'estante_blanco' then 100 when 'estante_celeste' then 150 end;
$$;

-- Saldo: lo ganado con títulos + regalos − lo gastado
create or replace function public.coins_balance(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(coins) from items where user_id = p_user), 0)
        + coalesce((select bonus_coins from profiles where id = p_user), 0)
        - coalesce((select sum(price) from user_decos where user_id = p_user), 0))::int;
$$;

-- Comprar una decoración
create or replace function public.buy_deco(p_kind text)
returns public.user_decos language plpgsql security definer set search_path = public as $$
declare price int := public.deco_price(p_kind); row public.user_decos;
begin
  if price is null then raise exception 'Esa decoración no existe'; end if;
  if p_kind like 'estante_%' and exists (select 1 from user_decos where user_id = auth.uid() and kind = p_kind) then
    raise exception 'Ya tenés ese estante';
  end if;
  if public.coins_balance(auth.uid()) < price then raise exception 'No te alcanzan los tecoins'; end if;
  insert into user_decos (user_id, kind, price) values (auth.uid(), p_kind, price) returning * into row;
  return row;
end;
$$;

grant execute on function public.deco_price(text) to authenticated;
grant execute on function public.coins_balance(uuid) to authenticated;
grant execute on function public.buy_deco(text) to authenticated;

-- ===================== 06_perfiles_publicos =====================
-- teca · tecas públicas o solo para amigos
-- Pegar en Supabase › SQL Editor › New query › Run.
alter table public.profiles add column if not exists teca_public boolean not null default false;
grant update (teca_public) on public.profiles to authenticated;

create or replace function public.is_public(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select teca_public from profiles where id = p_user), false);
$$;
grant execute on function public.is_public(uuid) to authenticated;

drop policy if exists "ver mis títulos y los de amigos" on public.items;
create policy "ver mis títulos y los de amigos" on public.items for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id) or public.is_public(user_id));

drop policy if exists "ver mis decos y las de amigos" on public.user_decos;
create policy "ver mis decos y las de amigos" on public.user_decos for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id) or public.is_public(user_id) or public.is_admin());

-- ===================== 07_polvo =====================
-- teca · polvo en el estante y plantitas que se marchitan
-- Pegar en Supabase › SQL Editor › New query › Run. (Necesita haber corrido antes 05_acomodar_premios.sql)

alter table public.profiles add column if not exists last_visit timestamptz not null default now();
alter table public.user_decos add column if not exists watered_at timestamptz not null default now();

-- Gastos de tecoins que no son decoraciones (limpiar, regar)
create table if not exists public.coin_spends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  amount int not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.coin_spends enable row level security;
drop policy if exists "mis gastos" on public.coin_spends;
create policy "mis gastos" on public.coin_spends for select to authenticated using (user_id = auth.uid());
grant select on public.coin_spends to authenticated;

create or replace function public.coins_balance(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  select (coalesce((select sum(coins) from items where user_id = p_user), 0)
        + coalesce((select bonus_coins from profiles where id = p_user), 0)
        - coalesce((select sum(price) from user_decos where user_id = p_user), 0)
        - coalesce((select sum(amount) from coin_spends where user_id = p_user), 0))::int;
$$;

-- Cada vez que entrás: si pasaron menos de 7 días, el estante sigue limpio y las plantitas sanas se riegan solas
create or replace function public.touch_visit()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare lv timestamptz;
begin
  select last_visit into lv from profiles where id = auth.uid();
  if lv is null or now() - lv < interval '7 days' then
    update profiles set last_visit = now() where id = auth.uid();
    update user_decos set watered_at = now()
      where user_id = auth.uid() and kind = 'plantita' and now() - watered_at < interval '14 days';
    return now();
  end if;
  return lv;
end;
$$;

-- Limpiar: 5 tecoins (7+ días), 10 (15+ días), 15 (30+ días)
create or replace function public.clean_shelf()
returns int language plpgsql security definer set search_path = public as $$
declare gap interval; cost int;
begin
  select now() - last_visit into gap from profiles where id = auth.uid();
  cost := case when gap >= interval '30 days' then 15 when gap >= interval '15 days' then 10 when gap >= interval '7 days' then 5 else 0 end;
  if cost > 0 then
    if public.coins_balance(auth.uid()) < cost then raise exception 'No te alcanzan los tecoins'; end if;
    insert into coin_spends (user_id, amount, reason) values (auth.uid(), cost, 'limpiar');
  end if;
  update profiles set last_visit = now() where id = auth.uid();
  return cost;
end;
$$;

-- Regar una plantita marchita: 10 tecoins
create or replace function public.water_plant(p_id uuid)
returns int language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from user_decos where id = p_id and user_id = auth.uid() and kind = 'plantita') then raise exception 'No es tu plantita'; end if;
  if public.coins_balance(auth.uid()) < 10 then raise exception 'No te alcanzan los tecoins'; end if;
  insert into coin_spends (user_id, amount, reason) values (auth.uid(), 10, 'regar');
  update user_decos set watered_at = now() where id = p_id;
  return 10;
end;
$$;

grant execute on function public.touch_visit() to authenticated;
grant execute on function public.clean_shelf() to authenticated;
grant execute on function public.water_plant(uuid) to authenticated;

-- ===================== 08_notificaciones =====================
-- teca · notificaciones en el celu y baja de mails
-- Pegar en Supabase › SQL Editor › New query › Run.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "mis avisos" on public.push_subscriptions;
create policy "mis avisos" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Para mandar avisos desde el panel (solo administradores)
create or replace function public.admin_push_targets()
returns table (endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public as $$
  select endpoint, p256dh, auth from push_subscriptions where public.is_admin();
$$;
create or replace function public.admin_push_remove(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and public.is_admin();
$$;
create or replace function public.admin_push_count()
returns bigint language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then (select count(distinct user_id) from push_subscriptions) else 0 end;
$$;
grant execute on function public.admin_push_targets() to authenticated;
grant execute on function public.admin_push_remove(text) to authenticated;
grant execute on function public.admin_push_count() to authenticated;

-- Baja de los avisos por mail
alter table public.profiles add column if not exists email_opt_out boolean not null default false;
grant update (email_opt_out) on public.profiles to authenticated;

-- ===================== 09_medias_estrellas =====================
-- teca · medias estrellas (3,5 · 4,5 …)
alter table public.items drop constraint if exists items_stars_check;
alter table public.items alter column stars type numeric(2,1) using stars::numeric;
alter table public.items add constraint items_stars_check check (stars >= 0 and stars <= 5 and stars * 2 = floor(stars * 2));
