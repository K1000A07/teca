-- 13 · Catálogo de teca: los libros que ya cargó alguien aparecen primero en la búsqueda.
-- Devuelve solo título, autor, año, páginas, tapa y géneros. Nunca quién lo cargó.
create or replace function public.teca_norm(t text) returns text language sql immutable as $$
  select trim(regexp_replace(translate(lower(coalesce(t, '')), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc'), '[^a-z0-9 ]', ' ', 'g'));
$$;

create or replace function public.catalog_books(p_q text, p_author text)
returns table (title text, creator text, year int, pages int, cover_url text, genre text)
language sql stable security definer set search_path = public as $$
  select title, creator, year, pages, cover_url, genre from (
    select distinct on (teca_norm(i.title), teca_norm(split_part(coalesce(i.creator, ''), ' ', -1)))
      i.title, i.creator, i.year, i.pages, i.cover_url, i.genre,
      count(*) over (partition by teca_norm(i.title)) as n
    from items i
    where i.kind = 'book'
      and (length(p_q) < 2 or teca_norm(i.title) like '%' || teca_norm(p_q) || '%')
      and (length(p_author) < 2 or teca_norm(i.creator) like '%' || teca_norm(p_author) || '%')
      and (length(p_q) >= 2 or length(p_author) >= 2)
    order by teca_norm(i.title), teca_norm(split_part(coalesce(i.creator, ''), ' ', -1)), (i.cover_url is null), i.created_at desc
  ) x
  order by (teca_norm(title) = teca_norm(p_q)) desc, n desc
  limit 8;
$$;
grant execute on function public.catalog_books(text, text) to authenticated;
