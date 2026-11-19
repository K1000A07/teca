-- teca · invitar amigos con tu link y ganar tecoins
-- Pegar en Supabase › SQL Editor › New query › Run.

create table if not exists public.referrals (
  new_user uuid primary key references public.profiles on delete cascade,
  inviter uuid not null references public.profiles on delete cascade,
  rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  check (new_user <> inviter)
);
alter table public.referrals enable row level security;
drop policy if exists "mis invitados" on public.referrals;
create policy "mis invitados" on public.referrals for select to authenticated
  using (inviter = auth.uid() or new_user = auth.uid() or public.is_admin());
grant select on public.referrals to authenticated;

-- Datos públicos para la vista previa del link (solo el nombre)
create or replace function public.ref_info(p_username text)
returns table (name text, valid boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(name, ''), username), true from profiles where username = lower(p_username);
$$;
grant execute on function public.ref_info(text) to anon, authenticated;

-- Al crear la cuenta con un link: queda registrado quién invitó y se hacen amigos
create or replace function public.claim_referral(p_username text)
returns boolean language plpgsql security definer set search_path = public as $$
declare me profiles; inv uuid;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null or me.created_at < now() - interval '1 day' then return false; end if;
  if exists (select 1 from referrals where new_user = me.id) then return false; end if;
  select id into inv from profiles where username = lower(p_username);
  if inv is null or inv = me.id then return false; end if;
  insert into referrals (new_user, inviter) values (me.id, inv);
  insert into friendships (requester, addressee, status) values (inv, me.id, 'accepted') on conflict do nothing;
  return true;
end;
$$;
grant execute on function public.claim_referral(text) to authenticated;

-- El premio llega cuando la persona nueva carga su primer título: 30 para quien invitó, 20 para quien llegó
create or replace function public.reward_referral()
returns trigger language plpgsql security definer set search_path = public as $$
declare r referrals;
begin
  select * into r from referrals where new_user = new.user_id and not rewarded;
  if r.new_user is not null then
    update referrals set rewarded = true where new_user = r.new_user;
    update profiles set bonus_coins = bonus_coins + 30 where id = r.inviter;
    update profiles set bonus_coins = bonus_coins + 20 where id = r.new_user;
  end if;
  return new;
end;
$$;
drop trigger if exists reward_referral_on_item on public.items;
create trigger reward_referral_on_item after insert on public.items for each row execute function public.reward_referral();
