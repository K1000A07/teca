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
