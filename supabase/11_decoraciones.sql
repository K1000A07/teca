-- 11 · Librería completa de decoraciones (plantas, velas, gatos, tazas, objetos, cuadros)
-- Corré este archivo entero en el SQL Editor de Supabase.

-- Ahora hay muchas decos: el precio de cada una dice cuáles existen
alter table public.user_decos drop constraint if exists user_decos_kind_check;
alter table public.user_decos add column if not exists stacked boolean not null default false;
alter table public.user_decos add column if not exists text text;
alter table public.user_decos drop constraint if exists user_decos_text_len;
alter table public.user_decos add constraint user_decos_text_len check (text is null or char_length(text) <= 80);
grant update (photo_url, teca, position, stacked, text) on public.user_decos to authenticated;

create or replace function public.deco_price(p_kind text)
returns int language sql immutable as $$
  select case p_kind
    when 'plantita' then 30
    when 'plantas/serpiente' then 30
    when 'plantas/potus' then 30
    when 'plantas/cactus' then 30
    when 'plantas/olivo' then 30
    when 'plantas/goma' then 30
    when 'plantas/tulipan' then 30
    when 'plantas/suculenta' then 30
    when 'velas/ondulada' then 30
    when 'velas/columna' then 30
    when 'velas/retorcida' then 30
    when 'velas/burbujas' then 30
    when 'velas/arco' then 30
    when 'velas/frasco' then 30
    when 'velas/alta' then 30
    when 'velas/trio' then 30
    when 'gatos/durmiendo' then 70
    when 'gatos/sentado' then 70
    when 'gatos/espalda' then 70
    when 'gatos/estirado' then 70
    when 'gatos/asomado' then 70
    when 'gatos/pan' then 70
    when 'gatos/jugando' then 70
    when 'gatos/atigrado' then 70
    when 'tazas/lunares' then 40
    when 'tazas/rayas' then 40
    when 'tazas/corazones' then 40
    when 'tazas/flores' then 40
    when 'tazas/estrellas' then 40
    when 'tazas/olas' then 40
    when 'taza' then 40
    when 'tazas/platito' then 40
    when 'cartelera' then 50
    when 'objetos/globo' then 50
    when 'objetos/pajaro' then 50
    when 'objetos/florero' then 50
    when 'objetos/arcoiris' then 50
    when 'objetos/reloj' then 50
    when 'objetos/mano' then 50
    when 'objetos/difusor' then 50
    when 'objetos/lampara' then 80
    when 'lampara' then 80
    when 'portarretrato' then 60
    when 'cuadros/hoja' then 60
    when 'cuadros/figura' then 60
    when 'cuadros/espejo' then 60
    when 'cuadros/ondulado' then 60
    when 'estante_blanco' then 100
    when 'estante_celeste' then 150
  end;
$$;

-- Todas las plantas se marchitan y se riegan, no solo la plantita
create or replace function public.touch_visit()
returns timestamptz language plpgsql security definer set search_path = public as $$
declare lv timestamptz;
begin
  select last_visit into lv from profiles where id = auth.uid();
  if lv is null or now() - lv < interval '7 days' then
    update profiles set last_visit = now() where id = auth.uid();
    update user_decos set watered_at = now()
      where user_id = auth.uid() and kind in ('plantita', 'plantas/serpiente', 'plantas/potus', 'plantas/cactus', 'plantas/olivo', 'plantas/goma', 'plantas/tulipan', 'plantas/suculenta') and now() - watered_at < interval '14 days';
    return now();
  end if;
  return lv;
end;
$$;

create or replace function public.water_plant(p_id uuid)
returns int language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from user_decos where id = p_id and user_id = auth.uid() and kind in ('plantita', 'plantas/serpiente', 'plantas/potus', 'plantas/cactus', 'plantas/olivo', 'plantas/goma', 'plantas/tulipan', 'plantas/suculenta')) then raise exception 'No es tu plantita'; end if;
  if public.coins_balance(auth.uid()) < 10 then raise exception 'No te alcanzan los tecoins'; end if;
  insert into coin_spends (user_id, amount, reason) values (auth.uid(), 10, 'regar');
  update user_decos set watered_at = now() where id = p_id;
  return 10;
end;
$$;
