-- TODO EN UNO · decoraciones, lugar libre, catálogo, teca principal, premio por guardar, panel de trabajo, impresiones y edad/lugar
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

-- ===== 17_panel_trabajo =====
-- 17 · Panel de trabajo (solo admin): tareas, contenido para redes y presupuesto
create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text,
  area text not null default 'admin' check (area in ('admin', 'creativo')),
  priority text not null default 'ahora' check (priority in ('ahora', 'antes', 'app')),
  cost text, done boolean not null default false, position int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_content (
  id uuid primary key default gen_random_uuid(),
  title text not null, body text, tags text, platform text,
  status text not null default 'idea' check (status in ('idea', 'guion', 'grabando', 'editando', 'publicado')),
  link text, published_at date, metrics jsonb not null default '{}'::jsonb, position int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.admin_budget (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Otros', concept text not null, amount numeric,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  freq text not null default 'unico' check (freq in ('unico', 'anual', 'mensual')),
  optional boolean not null default false, paid boolean not null default false, note text, position int not null default 0,
  created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['admin_tasks', 'admin_content', 'admin_budget'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

insert into public.admin_tasks (priority, area, title, body, cost, position)
select * from (values
  ('ahora', 'admin', 'Crear un Gmail para teca', 'Por ejemplo hola.teca@gmail.com o teca.app@gmail.com. Con ese mail se crean todas las cuentas de redes y después las de las tiendas.', null, 0),
  ('ahora', 'admin', 'Reservar el usuario en Instagram, TikTok, YouTube y Threads', 'El mismo nombre en todas (teca, teca.app, somosteca…). Aunque todavía no se publique nada, así nadie lo toma.', null, 1),
  ('ahora', 'admin', 'Inscribir la base de datos en la AAIP', 'Gratis y online.', 'Gratis', 2),
  ('ahora', 'admin', 'Buscar antecedentes de "teca" en el INPI', 'Clases 9, 42 y 45.', 'Gratis', 3),
  ('ahora', 'creativo', 'Definir cómo se ve y cómo habla teca en redes', 'Paleta, tipografías, tono. Ya está el brandbook: bajarlo a plantillas de historias y portadas de video.', null, 4),
  ('ahora', 'creativo', 'Foto de perfil y bio para las redes', 'El ícono de la t en lima. Bio corta + link a la app.', null, 5),
  ('ahora', 'creativo', 'Pensar los primeros 10 videos', 'En la pestaña Contenido ya hay ideas para arrancar.', null, 6),
  ('ahora', 'creativo', 'Grabar material del estante y de la app', 'Grabaciones de pantalla decorando, cargando un libro, deslizando. Sirve para todos los videos.', null, 7),
  ('antes', 'admin', 'Presentar la marca en el INPI', 'Marca denominativa "teca". Recién después de esto, publicar en redes a lo grande.', '100 UMAPI por clase', 8),
  ('antes', 'admin', 'Comprar el dominio', 'teca.com.ar y teca.ar en nic.ar.', null, 9),
  ('antes', 'admin', 'Mail de soporte con el dominio', 'Por ejemplo hola@teca.com.ar.', null, 10),
  ('antes', 'admin', 'Términos y condiciones', 'Sumarlos al lado de la política de privacidad.', null, 11),
  ('antes', 'admin', 'Juntar 15 testers fijos', 'Los vas a necesitar para la prueba cerrada de Google Play (12 durante 14 días seguidos).', null, 12),
  ('antes', 'creativo', 'Empezar a publicar y sumar usuarios beta', 'Después de presentar la marca. Usar el link de invitación /r/tu-usuario.', null, 13),
  ('antes', 'creativo', 'Página simple en el dominio', 'Una landing con qué es teca y el botón para entrar.', null, 14),
  ('app', 'admin', 'Cuenta de Google Play', 'USD 25, un solo pago.', 'USD 25', 15),
  ('app', 'admin', 'Cuenta de Apple Developer', 'USD 99 por año.', 'USD 99/año', 16),
  ('app', 'creativo', 'Capturas y textos para las tiendas', null, null, 17),
  ('app', 'creativo', 'Video de lanzamiento', null, null, 18)
) as v(priority, area, title, body, cost, position)
where not exists (select 1 from public.admin_tasks);

insert into public.admin_content (title, body, tags, status, position)
select * from (values
  ('Armé una app para ver todo lo que leí y vi este año', 'Detrás de escena: de la idea al estante. Mostrar el brandbook y la app funcionando.', 'detras de escena, proceso', 'idea', 0),
  ('Tour por mi teca', 'Recorrido por el estante, las decos, los gatos.', 'tour', 'idea', 1),
  ('POV: tu biblioteca junta polvo si no leés', 'El polvo aparece y lo limpiás con el dedo.', 'pov, humor', 'idea', 2),
  ('Del estante vacío al estante lleno', 'Timelapse cargando libros y decorando.', 'antes y despues', 'idea', 3),
  ('Diseñando las decoraciones', 'Proceso de diseño de los gatos, las velas y las plantas.', 'diseño, proceso', 'idea', 4),
  ('Lo que leyeron mis amigos este mes', 'Captura del feed y recomendaciones.', 'amigos, recomendaciones', 'idea', 5),
  ('Le pedí a mis amigos que me recomienden un libro', 'Con la función de guardar para después.', 'amigos', 'idea', 6),
  ('Mi resumen de noviembre', 'Libros, pelis y series del mes.', 'resumen', 'idea', 7)
) as v(title, body, tags, status, position)
where not exists (select 1 from public.admin_content);

insert into public.admin_budget (category, concept, amount, currency, freq, optional, note, position)
select * from (values
  ('Marca y legales', 'Marca en el INPI · clase 9 (apps)', 40000::numeric, 'ARS', 'unico', false, '100 UMAPI. Al crearse la UMAPI eran $36.000 y se actualiza todos los meses por inflación: confirmá el valor del mes en el portal del INPI.', 0),
  ('Marca y legales', 'Marca en el INPI · clase 42 (software online)', 40000::numeric, 'ARS', 'unico', false, 'Mismo valor que la clase 9.', 1),
  ('Marca y legales', 'Marca en el INPI · clase 45 (redes sociales)', 40000::numeric, 'ARS', 'unico', false, 'Recomendable porque teca tiene amigos, feed y clubes.', 2),
  ('Marca y legales', 'Base de datos en la AAIP', 0::numeric, 'ARS', 'unico', false, 'Gratis.', 3),
  ('Marca y legales', 'Agente de marcas', null::numeric, 'ARS', 'unico', true, 'Solo si aparece una marca parecida y hace falta asesoramiento.', 4),
  ('Dominio y mail', 'Dominio teca.com.ar', null::numeric, 'ARS', 'anual', false, 'Completar con el precio de nic.ar.', 5),
  ('Dominio y mail', 'Gmail de teca', 0::numeric, 'ARS', 'unico', false, 'Gratis.', 6),
  ('Tiendas', 'Google Play', 25::numeric, 'USD', 'unico', false, 'Un solo pago.', 7),
  ('Tiendas', 'Apple Developer', 99::numeric, 'USD', 'anual', false, 'Se paga todos los años.', 8),
  ('Tiendas', 'Mac para armar la versión de iPhone', 0::numeric, 'ARS', 'unico', false, 'Si ya tenés una Mac, no suma. Si no, se puede usar un servicio de compilación en la nube.', 9),
  ('Servidores', 'Vercel Pro', 20::numeric, 'USD', 'mensual', true, 'El plan gratis de Vercel es para uso no comercial: si teca empieza a cobrar algo, hay que pasar a Pro.', 10),
  ('Servidores', 'Supabase Pro', 25::numeric, 'USD', 'mensual', true, 'Solo cuando se pase del plan gratis (base de datos de 500 MB y 50.000 usuarios activos por mes).', 11),
  ('Servidores', 'TMDB y Google Books', 0::numeric, 'ARS', 'unico', false, 'Gratis. TMDB es gratis para uso no comercial: si teca cobra, revisar su licencia.', 12),
  ('Contenido y redes', 'Publicidad para sumar usuarios', null::numeric, 'ARS', 'mensual', true, 'Opcional, más adelante.', 13)
) as v(category, concept, amount, currency, freq, optional, note, position)
where not exists (select 1 from public.admin_budget);

-- ===== 18_tareas_trello =====
-- 18 · Tareas tipo Trello: listas, etiquetas, fechas. Junta las tareas y el tablero anterior en un solo lugar
-- (el tablero anterior no se borra: sigue en "Versión anterior").
alter table public.admin_tasks add column if not exists list text;
alter table public.admin_tasks add column if not exists tags text[] not null default '{}';
alter table public.admin_tasks add column if not exists due date;
alter table public.admin_tasks add column if not exists remind_days int not null default 30;
alter table public.admin_tasks alter column priority drop not null;

-- Las tareas que ya estaban: a su lista y con etiquetas
update public.admin_tasks set
  list = case when done then 'done' else 'todo' end,
  tags = array_remove(array[
    case when area = 'creativo' then 'Creativo' else 'Administrativo' end,
    case when title ~* '(INPI|AAIP|marca|términos)' then 'Legal' end,
    case when title ~* '(Google Play|Apple|tiendas)' then 'Tiendas' end,
    case when title ~* '(video|publicar|grabar|redes|bio)' then 'Contenido' end,
    case when cost is not null and cost <> 'Gratis' then 'Plata' end
  ], null)
where list is null;
alter table public.admin_tasks alter column list set default 'todo';
update public.admin_tasks set list = 'todo' where list is null;
alter table public.admin_tasks alter column list set not null;
alter table public.admin_tasks drop constraint if exists admin_tasks_list_check;
alter table public.admin_tasks add constraint admin_tasks_list_check check (list in ('ideas', 'todo', 'doing', 'done'));

-- Lo del tablero anterior que no estaba repetido, como tarjetas
insert into public.admin_tasks (title, body, list, tags, due, remind_days, done, area, priority, position)
select b.title, b.body,
  case when b.done then 'done' when b.section = 'procesos' then 'todo' else 'ideas' end,
  case b.section
    when 'fechas' then array['Fecha especial']
    when 'ideas' then array['App']
    else array_remove(array[
      case when b.title ~* '(INPI|AAIP|marca|teca™|monotributo)' then 'Legal' end,
      case when b.title ~* '(Google Play|Apple|Android|iPhone|tiendas)' then 'Tiendas' end,
      case when b.title !~* '(INPI|AAIP|marca|teca™|monotributo|Google Play|Apple|Android|iPhone|tiendas)' then 'Administrativo' end
    ], null)
  end,
  b.due, b.remind_days, b.done, 'admin', case when b.section = 'procesos' then 'antes' end, 100 + b.position
from public.admin_board b
where not exists (select 1 from public.admin_tasks t where lower(t.title) = lower(b.title))
  and b.title not in ('Términos y condiciones en una URL', 'Dominio teca.com.ar y teca.ar', 'Mail de soporte', 'Ícono, capturas y textos para las tiendas');

-- Mail @teca con Google Workspace
insert into public.admin_tasks (title, body, list, tags, area, priority, cost, position)
select 'Mail @teca con Google Workspace', 'Después de comprar el dominio. Plan Business Starter: USD 8,40 por mes (o USD 7 por mes pagando el año). Con ese mail se pueden pasar las cuentas de redes y de las tiendas.', 'todo', array['Administrativo', 'Plata'], 'admin', 'antes', 'USD 8,40/mes', 50
where not exists (select 1 from public.admin_tasks where title = 'Mail @teca con Google Workspace');
insert into public.admin_budget (category, concept, amount, currency, freq, optional, note, position)
select 'Dominio y mail', 'Google Workspace (mail @teca)', 8.4, 'USD', 'mensual', false, 'Business Starter, 1 usuario. Pagando el año sale USD 7 por mes (USD 84). Necesita el dominio.', 3
where not exists (select 1 from public.admin_budget where concept = 'Google Workspace (mail @teca)');

-- ===== 19_gastos_y_documentos =====
-- 19 · Gastos reales y documentos (solo admin)
create table if not exists public.admin_expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  concept text not null, amount numeric not null,
  currency text not null default 'ARS' check (currency in ('ARS', 'USD')),
  note text, created_at timestamptz not null default now()
);
create table if not exists public.admin_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null, number text, category text not null default 'Otros',
  doc_date date, link text, note text, created_at timestamptz not null default now()
);
do $$ declare t text; begin
  foreach t in array array['admin_expenses', 'admin_docs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- La marca, presentada el 20/11/2026
insert into public.admin_docs (title, number, category, doc_date, note)
select 'Solicitud de marca "teca" en el INPI (clases 9 y 45) · e-Recauda', '202600176665', 'Marca', '2026-11-20',
  'Marca denominativa "teca", a nombre de Camila Manucci (100%). Clase 9: apps y software para celulares, web y redes sociales. Clase 45: servicios de redes sociales en línea. Total pagado: $84.086 (100 UMAPI por clase, UMAPI a $420,43). Seguimiento en portaltramites.inpi.gob.ar → Mis trámites.'
where not exists (select 1 from public.admin_docs where number = '202600176665');

insert into public.admin_expenses (spent_on, concept, amount, currency, note)
select '2026-11-20', 'Marca "teca" en el INPI · clases 9 y 45', 84086, 'ARS', '2 trámites de 100 UMAPI ($420,43). e-Recauda 202600176665'
where not exists (select 1 from public.admin_expenses where concept = 'Marca "teca" en el INPI · clases 9 y 45');
insert into public.admin_expenses (spent_on, concept, amount, currency, note)
select '2026-11-20', 'Claude · noviembre', 20, 'USD', 'Suscripción mensual'
where not exists (select 1 from public.admin_expenses where concept = 'Claude · noviembre');

-- Presupuesto: valores reales de la marca y la suscripción de Claude
update public.admin_budget set amount = 42043, paid = true, note = 'Pagado el 20/11/2026: 100 UMAPI a $420,43.' where concept like 'Marca en el INPI · clase 9%';
update public.admin_budget set amount = 42043, paid = true, note = 'Pagado el 20/11/2026: 100 UMAPI a $420,43.' where concept like 'Marca en el INPI · clase 45%';
update public.admin_budget set optional = true, note = 'No se presentó: en la 42 está "Tecas" (arquitectura, con algo de software). Se puede pedir más adelante con una descripción acotada.' where concept like 'Marca en el INPI · clase 42%';
insert into public.admin_budget (category, concept, amount, currency, freq, optional, note, position)
select 'Herramientas', 'Claude', 20, 'USD', 'unico', false, 'Solo noviembre 2026 (después se usa la cuenta del trabajo).', 0
where not exists (select 1 from public.admin_budget where concept = 'Claude');
update public.admin_budget set paid = true, freq = 'unico' where concept = 'Claude';

-- ===== 20_tarjeta_dnda =====
-- 20 · Tarjeta para registrar el software y las ilustraciones en la DNDA (para más adelante)
insert into public.admin_tasks (title, body, list, tags, area, priority, position)
select 'Registrar el software y las ilustraciones en la DNDA',
  'Dirección Nacional del Derecho de Autor. El código como "software" y el brandbook, las decos y los gatos como "obra". El derecho de autor ya es tuyo desde que lo creaste: el registro sirve como prueba de fecha y autoría. Es barato y online. No es urgente.',
  'ideas', array['Legal'], 'admin', 'antes', 200
where not exists (select 1 from public.admin_tasks where title = 'Registrar el software y las ilustraciones en la DNDA');

-- ===== 21_impresiones =====
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
-- Por defecto no cuenta a las cuentas de administración (p_admin = true las incluye, para probar). La fila '_activos' = personas con al menos una impresión.
drop function if exists public.admin_ad_report(int);
create or replace function public.admin_ad_report(p_days int default 28, p_admin boolean default false)
returns table (space text, impressions bigint, people bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select i.space, i.user_id from ad_impressions i
    join profiles p on p.id = i.user_id
    where public.is_admin() and (p_admin or not coalesce(p.is_admin, false))
      and i.created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select space, count(*), count(distinct user_id) from base group by space
  union all
  select '_activos', count(*), count(distinct user_id) from base;
$$;
grant execute on function public.admin_ad_report(int, boolean) to authenticated;

-- ===== 22_edad_ubicacion =====
-- 22 · Edad y lugar donde vivís (datos privados)
create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age_range text check (age_range is null or age_range in ('18-24','25-34','35-44','45+')),
  location text,
  province text,
  place_id text,
  updated_at timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists "mis datos privados" on public.profile_private;
create policy "mis datos privados" on public.profile_private for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admin ve datos privados" on public.profile_private;
create policy "admin ve datos privados" on public.profile_private for select to authenticated using (public.is_admin());
grant select, insert, update on public.profile_private to authenticated;

-- ===== 23_equipo_permisos =====
-- Quién es qué:
--   · Fundadora (k1000a): acceso total, siempre. Es la única que puede dar o sacar acceso al panel.
--   · Equipo: cada persona entra al panel solo a las funciones que la fundadora le prendió.
--   · Cualquier otra cuenta: no entra a /admin ni puede leer nada del panel, ni tocando la base desde afuera.

alter table public.profiles add column if not exists is_founder boolean not null default false;
-- is_founder no está en los permisos de escritura de profiles: nadie puede ponérselo desde la app.
update public.profiles set is_founder = true, is_admin = true where username = 'k1000a';

create or replace function public.admin_perm_keys()
returns text[] language sql immutable as $$
  select array['usuarios','impresiones','avisos','regalos','tareas','contenido','presupuesto','docs'];
$$;

create table if not exists public.admin_access (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  perms text[] not null default '{}',
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_founder()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_founder from profiles where id = auth.uid()), false);
$$;
create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_founder() or exists (select 1 from admin_access where user_id = auth.uid() and p = any(perms));
$$;
-- is_admin() = tiene acceso al panel (fundadora o equipo)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_founder() or exists (select 1 from admin_access where user_id = auth.uid());
$$;
grant execute on function public.is_founder() to authenticated;
grant execute on function public.has_perm(text) to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_access enable row level security;
drop policy if exists "ver acceso al panel" on public.admin_access;
create policy "ver acceso al panel" on public.admin_access for select to authenticated using (user_id = auth.uid() or public.is_founder());
grant select on public.admin_access to authenticated;
-- No hay políticas de escritura: solo se cambia con las funciones de abajo, y solo las usa la fundadora.

-- Quien ya era administradora antes de esto queda en el equipo con todo prendido (la fundadora puede ajustarlo)
insert into public.admin_access (user_id, perms)
select id, public.admin_perm_keys() from public.profiles where is_admin and not is_founder
on conflict (user_id) do nothing;

-- Qué puedo ver yo en el panel
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_founder() then jsonb_build_object('founder', true, 'perms', to_jsonb(public.admin_perm_keys()))
    else coalesce((select jsonb_build_object('founder', false, 'perms', to_jsonb(perms)) from admin_access where user_id = auth.uid()),
                  jsonb_build_object('founder', false, 'perms', '[]'::jsonb)) end;
$$;
grant execute on function public.my_access() to authenticated;

-- Dar o cambiar el acceso de alguien (solo la fundadora; a ella misma no se le puede tocar nada)
create or replace function public.admin_set_access(p_user uuid, p_perms text[])
returns void language plpgsql security definer set search_path = public as $$
declare clean text[];
begin
  if not public.is_founder() then raise exception 'Solo la fundadora puede dar acceso al panel'; end if;
  if not exists (select 1 from profiles where id = p_user) then raise exception 'Esa persona no existe'; end if;
  if exists (select 1 from profiles where id = p_user and is_founder) then raise exception 'La fundadora siempre tiene acceso total'; end if;
  select coalesce(array_agg(distinct k), '{}') into clean from unnest(coalesce(p_perms, '{}')) k where k = any(public.admin_perm_keys());
  insert into admin_access (user_id, perms, granted_by) values (p_user, clean, auth.uid())
    on conflict (user_id) do update set perms = excluded.perms, updated_at = now();
  update profiles set is_admin = true where id = p_user;
end $$;
create or replace function public.admin_remove_access(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'Solo la fundadora puede sacar acceso al panel'; end if;
  if exists (select 1 from profiles where id = p_user and is_founder) then raise exception 'La fundadora siempre tiene acceso total'; end if;
  delete from admin_access where user_id = p_user;
  update profiles set is_admin = false where id = p_user;
end $$;
grant execute on function public.admin_set_access(uuid, text[]) to authenticated;
grant execute on function public.admin_remove_access(uuid) to authenticated;

-- ===== Cada parte del panel pide su permiso =====
-- Usuarios, resumen y actividad
drop policy if exists "admin ve todos los títulos" on public.items;
create policy "admin ve todos los títulos" on public.items for select to authenticated using (public.has_perm('usuarios'));
drop policy if exists "ver mis decos y las de amigos" on public.user_decos;
create policy "ver mis decos y las de amigos" on public.user_decos for select to authenticated
  using (user_id = auth.uid() or public.is_friend(auth.uid(), user_id) or public.is_public(user_id) or public.has_perm('usuarios'));
drop policy if exists "mis invitados" on public.referrals;
create policy "mis invitados" on public.referrals for select to authenticated
  using (inviter = auth.uid() or new_user = auth.uid() or public.has_perm('usuarios'));
drop policy if exists "admin ve datos privados" on public.profile_private;
create policy "admin ve datos privados" on public.profile_private for select to authenticated using (public.has_perm('usuarios'));

drop function if exists public.admin_users();
create or replace function public.admin_users()
returns table (id uuid, email text, username text, name text, emoji text, color text, avatar_url text,
               signed_up timestamptz, last_seen timestamptz, titles bigint, books bigint, movies bigint, shows bigint,
               coins bigint, friends bigint, gift_code text, last_title_at timestamptz,
               is_founder boolean, admin_perms text[])
language sql stable security definer set search_path = public as $$
  select u.id, u.email::text, p.username, p.name, p.emoji, p.color, p.avatar_url,
    u.created_at, u.last_sign_in_at,
    (select count(*) from items i where i.user_id = u.id),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'book'),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'movie'),
    (select count(*) from items i where i.user_id = u.id and i.kind = 'show'),
    coalesce((select sum(coins) from items i where i.user_id = u.id), 0) + coalesce(p.bonus_coins, 0),
    (select count(*) from friendships f where f.status = 'accepted' and u.id in (f.requester, f.addressee)),
    (select r.code from redemptions r where r.user_id = u.id),
    (select max(created_at) from items i where i.user_id = u.id),
    coalesce(p.is_founder, false),
    (select a.perms from admin_access a where a.user_id = u.id)
  from auth.users u left join profiles p on p.id = u.id
  where public.has_perm('usuarios')
  order by u.created_at desc;
$$;
grant execute on function public.admin_users() to authenticated;

-- Notificaciones
create or replace function public.admin_push_targets()
returns table (endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public as $$
  select endpoint, p256dh, auth from push_subscriptions where public.has_perm('avisos');
$$;
create or replace function public.admin_push_remove(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and public.has_perm('avisos');
$$;
create or replace function public.admin_push_count()
returns bigint language sql stable security definer set search_path = public as $$
  select case when public.has_perm('avisos') then (select count(distinct user_id) from push_subscriptions) else 0 end;
$$;

-- Links de regalo
drop policy if exists "admin ve links" on public.invites;
create policy "admin ve links" on public.invites for select to authenticated using (public.has_perm('regalos'));
drop policy if exists "admin crea links" on public.invites;
create policy "admin crea links" on public.invites for insert to authenticated with check (public.has_perm('regalos') and created_by = auth.uid());
drop policy if exists "admin borra links" on public.invites;
create policy "admin borra links" on public.invites for delete to authenticated using (public.has_perm('regalos'));
drop policy if exists "mi regalo" on public.redemptions;
create policy "mi regalo" on public.redemptions for select to authenticated using (user_id = auth.uid() or public.has_perm('regalos'));

-- Impresiones
drop policy if exists "admin ve impresiones" on public.ad_impressions;
create policy "admin ve impresiones" on public.ad_impressions for select to authenticated using (public.has_perm('impresiones'));
drop function if exists public.admin_ad_report(int, boolean);
create or replace function public.admin_ad_report(p_days int default 28, p_admin boolean default false)
returns table (space text, impressions bigint, people bigint)
language sql stable security definer set search_path = public as $$
  with base as (
    select i.space, i.user_id from ad_impressions i
    join profiles p on p.id = i.user_id
    where public.has_perm('impresiones') and (p_admin or not coalesce(p.is_admin, false))
      and i.created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select space, count(*), count(distinct user_id) from base group by space
  union all
  select '_activos', count(*), count(distinct user_id) from base;
$$;
grant execute on function public.admin_ad_report(int, boolean) to authenticated;

-- Tablero de trabajo
do $$ declare t text; pm text; begin
  for t, pm in select * from (values ('admin_tasks', 'tareas'), ('admin_content', 'contenido'), ('admin_budget', 'presupuesto'), ('admin_expenses', 'presupuesto'), ('admin_docs', 'docs')) v(a, b) loop
    execute format('drop policy if exists "solo admin" on public.%I', t);
    execute format('create policy "solo admin" on public.%I for all to authenticated using (public.has_perm(%L)) with check (public.has_perm(%L))', t, pm, pm);
  end loop;
end $$;
-- La versión anterior del tablero ya no se usa en el panel: queda solo para la fundadora
drop policy if exists "solo admin" on public.admin_board;
create policy "solo admin" on public.admin_board for all to authenticated using (public.is_founder()) with check (public.is_founder());
-- 24 · Tutorial visto guardado en la cuenta (no en el navegador): si la persona entra desde la app instalada, no lo vuelve a ver
-- Corré este archivo entero en el SQL Editor de Supabase. Se puede correr más de una vez.
alter table public.profiles add column if not exists tour_seen text[] not null default '{}';
grant update (tour_seen) on public.profiles to authenticated;
-- Las cuentas que ya existen ya vieron el tutorial y las novedades
update public.profiles set tour_seen = array['tour2', 'news3'] where tour_seen = '{}';
