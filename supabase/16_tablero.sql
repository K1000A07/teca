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
