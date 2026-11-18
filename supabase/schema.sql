-- teca · esquema de base de datos
-- Pegar todo en Supabase › SQL Editor › New query › Run.
-- Se puede correr más de una vez sin romper nada.

-- ---------- Perfiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_.]{3,20}$'),
  name text not null default '',
  emoji text,
  color text not null default '#F3D9CF',
  avatar_url text,
  show_in_ranking boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Títulos cargados ----------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('book','movie','show')),
  title text not null,
  creator text,
  year int,
  cover_url text,
  pages int,
  seasons int,
  stars int check (stars between 0 and 5),
  genre text,
  review text,
  seen_where text check (seen_where in ('casa','cine')),
  format text check (format in ('papel','ebook')),
  coins int not null default 0,
  tilt int not null default 0,
  position double precision,
  finished_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists items_user_idx on public.items (user_id, created_at desc);

-- ---------- Amistades ----------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references public.profiles on delete cascade,
  addressee uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

-- ---------- Guardados para después ----------
create table if not exists public.saved (
  user_id uuid not null references public.profiles on delete cascade,
  item_id uuid not null references public.items on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------- Funciones ----------
create or replace function public.is_friend(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- Ranking general: solo nombre, foto y cantidad de títulos (nunca los títulos)
create or replace function public.ranking(since date default null)
returns table (id uuid, username text, name text, emoji text, color text, avatar_url text,
               books bigint, movies bigint, shows bigint, total bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.name, p.emoji, p.color, p.avatar_url,
    count(*) filter (where i.kind = 'book'),
    count(*) filter (where i.kind = 'movie'),
    count(*) filter (where i.kind = 'show'),
    count(i.id)
  from profiles p
  left join items i on i.user_id = p.id and (since is null or i.finished_at >= since)
  where p.show_in_ranking or p.id = auth.uid()
  group by p.id
  order by count(i.id) desc, p.created_at
  limit 100;
$$;

-- ---------- Seguridad (RLS) ----------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.friendships enable row level security;
alter table public.saved enable row level security;

drop policy if exists "perfiles visibles" on public.profiles;
create policy "perfiles visibles" on public.profiles for select to authenticated using (true);
drop policy if exists "crear mi perfil" on public.profiles;
create policy "crear mi perfil" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles for update to authenticated using (id = auth.uid());

drop policy if exists "ver mis títulos y los de amigos" on public.items;
create policy "ver mis títulos y los de amigos" on public.items for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id));
drop policy if exists "cargar mis títulos" on public.items;
create policy "cargar mis títulos" on public.items for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "editar mis títulos" on public.items;
create policy "editar mis títulos" on public.items for update to authenticated using (user_id = auth.uid());
drop policy if exists "borrar mis títulos" on public.items;
create policy "borrar mis títulos" on public.items for delete to authenticated using (user_id = auth.uid());

drop policy if exists "ver mis amistades" on public.friendships;
create policy "ver mis amistades" on public.friendships for select to authenticated
  using (auth.uid() in (requester, addressee));
drop policy if exists "pedir amistad" on public.friendships;
create policy "pedir amistad" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');
drop policy if exists "aceptar amistad" on public.friendships;
create policy "aceptar amistad" on public.friendships for update to authenticated
  using (addressee = auth.uid());
drop policy if exists "borrar amistad" on public.friendships;
create policy "borrar amistad" on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

drop policy if exists "mis guardados" on public.saved;
create policy "mis guardados" on public.saved for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Fotos de perfil ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
drop policy if exists "subir mi foto" on storage.objects;
create policy "subir mi foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "cambiar mi foto" on storage.objects;
create policy "cambiar mi foto" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ver fotos" on storage.objects;
create policy "ver fotos" on storage.objects for select using (bucket_id = 'avatars');
