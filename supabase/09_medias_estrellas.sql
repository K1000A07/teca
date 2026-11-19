-- teca · medias estrellas (3,5 · 4,5 …)
alter table public.items drop constraint if exists items_stars_check;
alter table public.items alter column stars type numeric(2,1) using stars::numeric;
alter table public.items add constraint items_stars_check check (stars >= 0 and stars <= 5 and stars * 2 = floor(stars * 2));
