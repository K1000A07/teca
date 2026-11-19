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
