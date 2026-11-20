-- TODO EN UNO · decoraciones, lugar libre, catálogo de libros, teca principal, premio por guardar y tablero
-- Se puede correr aunque ya hayas corrido alguno de estos antes.

-- ===== 11_decoraciones =====
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

-- ===== 12_lugar_libre =====
-- 12 · Acomodar libre: cada título y deco guarda en qué estante y en qué lugar va
alter table public.items add column if not exists shelf_row int;
alter table public.items add column if not exists shelf_x double precision;
alter table public.user_decos add column if not exists shelf_row int;
alter table public.user_decos add column if not exists shelf_x double precision;
grant update (photo_url, teca, position, stacked, text, shelf_row, shelf_x) on public.user_decos to authenticated;

-- ===== 13_catalogo_libros =====
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

-- ===== 14_vista_y_teca_principal =====
-- 14 · Teca que se ve primero en tu perfil (null = la que más títulos tiene)
alter table public.profiles add column if not exists default_teca text check (default_teca is null or default_teca in ('book','movie','show'));
grant update (default_teca) on public.profiles to authenticated;


-- ===== 15_premio_por_guardar =====
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

-- ===== 16_tablero =====
-- 16 · Tablero de teca (solo admin): fechas, banco de ideas y procesos para hacerla real
create table if not exists public.admin_board (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('fechas', 'ideas', 'procesos')),
  title text not null,
  body text,
  due date,
  remind_days int not null default 30,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.admin_board enable row level security;
drop policy if exists "solo admin" on public.admin_board;
create policy "solo admin" on public.admin_board for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.admin_board to authenticated;

-- Primeras tarjetas (solo si el tablero está vacío)
insert into public.admin_board (section, title, body, due, remind_days, position)
select * from (values
  ('fechas', 'Decos de Navidad', 'Arbolito, guirnaldas, nieve en el estante y un gato con gorro. ¿Gratis por unos días o con tecoins?', '2026-12-08'::date, 21, 0),
  ('fechas', 'Tu año en teca (top 3 y resumen)', 'Tus 3 libros, pelis y series del año, páginas leídas y horas vistas, listo para compartir en historias. Ideal que salga a mediados de diciembre.', '2026-12-15'::date, 30, 1),
  ('fechas', 'La caja 2026', 'Animación del 1 de enero: todo se guarda en una caja que dice 2026 y la teca arranca de cero. Después se puede volver a ver cada año. Las decos se quedan.', '2027-01-01'::date, 35, 2),
  ('fechas', 'Prode de los Oscar', 'Elegir ganadores antes de la ceremonia y sumar tecoins por acierto. Confirmar la fecha de las nominaciones y de la ceremonia.', '2027-01-21'::date, 30, 3),
  ('fechas', 'Feria del Libro de Buenos Aires', 'Algo especial para la Feria: decos, un desafío o un club. Confirmar fechas.', '2027-04-22'::date, 45, 4),
  ('fechas', 'Día del Libro (23 de abril)', 'Tecoins extra por cargar un libro ese día o una deco especial.', '2027-04-23'::date, 30, 5),
  ('fechas', 'Día del Amigo (20 de julio)', 'Campaña para invitar amigos: más tecoins por invitación esa semana.', '2027-07-20'::date, 30, 6),
  ('fechas', 'Decos de Halloween', 'Calabazas, telarañas y gatos negros para el estante.', '2027-10-31'::date, 30, 7),
  ('ideas', 'Compartir tu teca en historias', 'Un botón que arma una imagen linda del estante con el link a teca. Ayuda a que crezca sin gastar.', null::date, 30, 0),
  ('ideas', 'Clubes de lectura', 'Un club con libro del mes y chat. Ya está la pantalla de "muy pronto".', null::date, 30, 1),
  ('ideas', 'Escanear el código de barras', 'Cargar un libro apuntando la cámara al código de barras de la contratapa.', null::date, 30, 2),
  ('ideas', 'Biblioteca Nacional de España como fuente', 'Datos abiertos con las ediciones españolas (las traducciones que llegan acá). Sin tapas.', null::date, 30, 3),
  ('ideas', 'Aviso cuando un amigo termina algo que guardaste', '"Almu terminó Kentukis, que tenés para después".', null::date, 30, 4),
  ('ideas', 'Desafío de lectura del año', 'Ponerse una meta de libros o pelis y ver el avance en el perfil.', null::date, 30, 5),
  ('ideas', 'Decos por temporada', 'Ediciones limitadas que aparecen solo en ciertas fechas.', null::date, 30, 6),
  ('procesos', 'Beta con amigos', 'Que 15 o más personas usen teca seguido y anotar qué les cuesta. Esas mismas personas sirven después como testers de Google Play.', null::date, 30, 0),
  ('procesos', 'Inscribir la base de datos en la AAIP', 'Es gratis y online. teca guarda mails y perfiles, así que corresponde por la ley de datos personales.', null::date, 30, 1),
  ('procesos', 'Usar teca™', 'Mientras la marca está en trámite se puede usar ™. La ® va recién cuando la otorgan.', null::date, 30, 2),
  ('procesos', 'Buscar antecedentes de "teca" en el INPI', 'Revisar clases 9 (apps), 42 (software online) y 45 (redes sociales). Si aparece algo parecido, consultar a un agente de marcas.', null::date, 30, 3),
  ('procesos', 'Presentar la marca en el INPI', 'Marca denominativa "teca", a tu nombre. 100 UMAPI por clase. No hace falta esperar a que la otorguen para seguir: el derecho cuenta desde que la pedís.', null::date, 30, 4),
  ('procesos', 'Dominio teca.com.ar y teca.ar', 'En nic.ar con clave fiscal.', null::date, 30, 5),
  ('procesos', 'Mail de soporte', 'Por ejemplo hola@teca.com.ar. Las tiendas lo piden.', null::date, 30, 6),
  ('procesos', 'Borrar la cuenta desde la app', 'Apple exige que se pueda borrar la cuenta desde adentro de la app, no solo por mail.', null::date, 30, 7),
  ('procesos', 'Términos y condiciones en una URL', 'La política de privacidad ya está en /privacidad. Sumar términos de uso.', null::date, 30, 8),
  ('procesos', 'Ícono, capturas y textos para las tiendas', 'Capturas de iPhone y Android, descripción corta y larga, palabras clave.', null::date, 30, 9),
  ('procesos', 'Cuenta de Google Play', 'USD 25, pago único. Verificación de identidad.', null::date, 30, 10),
  ('procesos', 'Android: empaquetar y prueba cerrada', 'Envolver teca como app nativa (Capacitor). Las cuentas personales nuevas necesitan una prueba cerrada con 12 testers durante 14 días seguidos.', null::date, 30, 11),
  ('procesos', 'Android: pedir producción y publicar', 'Después de la prueba cerrada, Google revisa y publica.', null::date, 30, 12),
  ('procesos', 'Cuenta de Apple Developer', 'USD 99 por año. Como individual aparece tu nombre como vendedora; como empresa hace falta un D-U-N-S.', null::date, 30, 13),
  ('procesos', 'iPhone: empaquetar y TestFlight', 'Necesita una Mac con Xcode (o un servicio de compilación en la nube). Probar con TestFlight antes de mandar a revisión.', null::date, 30, 14),
  ('procesos', 'iPhone: revisión y publicación', 'Apple revisa cada versión. Ojo con la regla de que no sea "solo una web envuelta": las notificaciones nativas ayudan.', null::date, 30, 15),
  ('procesos', 'Si empezás a cobrar: monotributo o SAS', 'Recién cuando haya ingresos (suscripción, decos pagas, etc.).', null::date, 30, 16)
) as v(section, title, body, due, remind_days, position)
where not exists (select 1 from public.admin_board);
