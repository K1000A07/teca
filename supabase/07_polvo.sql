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
