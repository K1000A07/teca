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
