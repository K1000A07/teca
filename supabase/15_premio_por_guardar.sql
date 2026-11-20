-- 15 · Cuando alguien guarda algo tuyo, ganás 2 tecoins (una sola vez por persona y por título)
create table if not exists public.save_rewards (
  id bigserial primary key,
  owner_id uuid not null references public.profiles on delete cascade,
  saver_id uuid not null references public.profiles on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  title text,
  kind text,
  amount int not null default 2,
  created_at timestamptz not null default now(),
  unique (saver_id, item_id)
);
alter table public.save_rewards enable row level security;
drop policy if exists "mis premios por guardar" on public.save_rewards;
create policy "mis premios por guardar" on public.save_rewards for select to authenticated
  using (owner_id = auth.uid() or saver_id = auth.uid());
grant select on public.save_rewards to authenticated;

create or replace function public.reward_save()
returns trigger language plpgsql security definer set search_path = public as $$
declare o uuid; t text; k text;
begin
  select user_id, title, kind into o, t, k from items where id = new.item_id;
  if o is null or o = new.user_id then return new; end if;
  insert into save_rewards (owner_id, saver_id, item_id, title, kind) values (o, new.user_id, new.item_id, t, k)
    on conflict (saver_id, item_id) do nothing;
  if found then update profiles set bonus_coins = coalesce(bonus_coins, 0) + 2 where id = o; end if;
  return new;
end;
$$;
drop trigger if exists reward_save on public.saved;
create trigger reward_save after insert on public.saved for each row execute function public.reward_save();

-- Para avisarle al celu del dueño (solo justo después de guardar, una vez)
create or replace function public.save_push_targets(p_item uuid)
returns table (endpoint text, p256dh text, auth text, saver text, title text, kind text)
language sql stable security definer set search_path = public as $$
  select s.endpoint, s.p256dh, s.auth, p.name, r.title, r.kind
  from save_rewards r
  join push_subscriptions s on s.user_id = r.owner_id
  join profiles p on p.id = r.saver_id
  where r.saver_id = auth.uid() and r.item_id = p_item and r.created_at > now() - interval '2 minutes';
$$;
grant execute on function public.save_push_targets(uuid) to authenticated;
