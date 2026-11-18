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
