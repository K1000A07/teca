-- 21 · Impresiones: cuántas veces se ve cada pantalla donde va a ir publicidad
-- Pegar en Supabase › SQL Editor › New query › Run. Se puede correr más de una vez.
-- Guarda solo: quién (id interno), qué pantalla y cuándo. Sin textos ni datos personales.

create table if not exists public.ad_impressions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  space text not null check (space in ('conecta', 'sumaste', 'tecoins', 'buscador', 'detalle', 'eventos')),
  created_at timestamptz not null default now()
);
create index if not exists ad_impressions_space_time on public.ad_impressions (space, created_at);
create index if not exists ad_impressions_user on public.ad_impressions (user_id);
alter table public.ad_impressions enable row level security;

drop policy if exists "sumo mi impresion" on public.ad_impressions;
create policy "sumo mi impresion" on public.ad_impressions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "admin ve impresiones" on public.ad_impressions;
create policy "admin ve impresiones" on public.ad_impressions for select to authenticated using (public.is_admin());
grant insert, select on public.ad_impressions to authenticated;

-- Reporte para el panel: por pantalla, impresiones y personas distintas en los últimos N días.
-- No cuenta a las cuentas de administración. La fila '_activos' = personas con al menos una impresión.
create or replace function public.admin_ad_report(p_days int default 28)
returns table (space text, impressions bigint, people bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select i.space, i.user_id from ad_impressions i
    join profiles p on p.id = i.user_id
    where public.is_admin() and not coalesce(p.is_admin, false)
      and i.created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select space, count(*), count(distinct user_id) from base group by space
  union all
  select '_activos', count(*), count(distinct user_id) from base;
$$;
grant execute on function public.admin_ad_report(int) to authenticated;
