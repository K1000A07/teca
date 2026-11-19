-- 11 · Decos arriba de los libros + cartelera de cine
alter table public.user_decos add column if not exists stacked boolean not null default false;
alter table public.user_decos add column if not exists text text;
alter table public.user_decos drop constraint if exists user_decos_text_len;
alter table public.user_decos add constraint user_decos_text_len check (text is null or char_length(text) <= 80);
grant update (photo_url, teca, position, stacked, text) on public.user_decos to authenticated;

create or replace function public.deco_price(p_kind text)
returns int language sql immutable as $$
  select case p_kind
    when 'plantita' then 30 when 'taza' then 40 when 'cartelera' then 50 when 'portarretrato' then 60
    when 'lampara' then 80 when 'estante_blanco' then 100 when 'estante_celeste' then 150 end;
$$;
