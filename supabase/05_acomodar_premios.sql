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
