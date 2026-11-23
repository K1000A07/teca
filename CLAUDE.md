# teca — contexto para seguir trabajando

Este archivo resume todo lo que hay que saber para retomar teca en otra conversación con Claude.
Si sos Claude: leelo entero antes de tocar algo.

## Qué es teca
App social (PWA) de Cami (Camila Manucci, directora de arte, Buenos Aires) para registrar libros, pelis y series en estanterías realistas — biblioteca, filmoteca y videoteca — y compartirlas con amigos. Tiene estrellas (con medias), reseñas, feed "¿En qué andan?", guardar para después, ranking, tecoins, decoraciones para el estante y clubes (pendiente).

Cami escribe en castellano rioplatense (vos), prefiere respuestas directas, sin vueltas ni lenguaje corporativo, con poco formato. Es diseñadora: le importa mucho cómo se ve y se siente cada cosa.

## Dónde está todo
- App en vivo: https://appteca.com.ar (dominio comprado en NIC Argentina el 20/11/2026; también responde https://teca-tau.vercel.app). Panel de admin en /admin, usuario admin: k1000a
- Landing: `src/screens/Landing.jsx` + `src/landing/celu.html` y `compu.html` (sacados del brandbook L1/L2). La ve solo quien entra sin sesión desde el navegador a `/`; la app instalada, los links /r/ y /regalo/ y `/?entrar` van directo al login.
- Código: https://github.com/K1000A07/teca (rama main; Vercel publica solo en cada push)
- Base de datos y login: Supabase, proyecto `oeppdldydozrraebsquz`
- Hosting y funciones: Vercel, proyecto k1000a07/teca
- Brandbook y diseño de pantallas: artifact de Claude "teca — Brandbook" (páginas: Brandbook, Decoraciones, Estantería, App, Recorrido)

Claves: la publishable key de Supabase y la clave pública VAPID están en el código (son públicas). Las secretas están en Vercel → Environment Variables: `VAPID_PRIVATE_KEY`, `TMDB_KEY`, `GOOGLE_BOOKS_KEY`. Nunca pedir ni guardar la service_role key ni la contraseña de la base.

## Stack
- Vite + React 18 (JavaScript), sin router: navegación propia con un stack de pantallas en `src/App.jsx`.
- Supabase JS v2: auth por mail y contraseña, Postgres con RLS, Storage (bucket `avatars`, también para tapas y fotos de portarretratos).
- Funciones en `/api` (Vercel, ESM): `books.js` (Google Books + Open Library), `search.js` (TMDB, con iTunes de respaldo), `invite.js` y `ref.js` (vista previa de links de regalo e invitación), `push.js` (notificaciones del admin), `notify-save.js` (aviso cuando alguien guarda algo tuyo).
- PWA: `public/manifest.webmanifest`, `public/sw.js` (push), íconos en `public/icons`.
- Marca: lima #E6F04A, celeste #A9C6F2, celda #E3EDFB, tinta #141210. Tipografías Bricolage Grotesque (300/800) e Instrument Serif itálica (la palabra "teca" siempre en serif itálica minúscula).

## Archivos clave
- `src/App.jsx`: estado global (ctx), carga de datos, tutorial y novedades, hojas.
- `src/shelf.jsx`: estantería con lugar libre (shelf_row/shelf_x), pilas de libros acostados, decos arriba de pilas, arrastrar y soltar.
- `src/deco/art.js`: librería de decoraciones en SVG (plantas, velas, gatos, tazas, objetos, cuadros). La misma que usa el brandbook.
- `src/decos.jsx`: catálogo, precios y dibujo de decos. `src/screens/Arrange.jsx`: modo acomodar y tienda.
- `src/browse.jsx`: buscador, filtro y vista lista. `src/save.js`: guardar para después (+2 tecoins al dueño).
- `src/screens/Detail.jsx`: tarjeta del título (deslizar a los costados entre títulos, para abajo para cerrar).
- `src/screens/Tutorial.jsx`: tutorial de 8 pasos y novedades (`NEWS_KEY`).
- `src/screens/Admin.jsx` + `Kanban.jsx` + `Work.jsx` + `Board.jsx`: panel con "La app" (resumen, usuarios, actividad, notificaciones, links de regalo) y "Tablero de trabajo" (tareas tipo Trello, contenido para redes con reporte, presupuesto y gastos, documentos, versión anterior).
- `supabase/`: un archivo SQL por cambio (02 al 22). `ACTUALIZAR.sql` junta del 11 al 22 y se puede correr más de una vez.

## Cómo se trabaja
- Cambios de base de datos: un SQL nuevo en `supabase/NN_nombre.sql` (idempotente: `if not exists`, `drop ... if exists`) y sumarlo a `ACTUALIZAR.sql`. Cami lo pega en el SQL Editor de Supabase. Avisarle siempre qué correr.
- Probar antes de subir: `npm run build`, `npx vite preview` y Playwright con Supabase simulado (interceptar `*.supabase.co` y poner la sesión en localStorage `sb-oeppdldydozrraebsquz-auth-token`).
- Subir: commit y push a main. Vercel publica en un par de minutos.

## Estado al 20/11/2026
- Marca "teca" presentada en el INPI el 20/11/2026: denominativa, a nombre de Camila Manucci, clases 9 y 45. e-Recauda 202600176665. Pagado $84.086. La clase 42 no se presentó porque existe "Tecas" (arquitectura, con algo de software) vigente en la 42.
- Ya se puede usar teca™. La ® recién cuando se otorgue.
- Pendiente que Cami corra `supabase/ACTUALIZAR.sql` (decoraciones nuevas, lugar libre, catálogo de libros, teca principal, premio por guardar, tablero, tareas, contenido, presupuesto, gastos y documentos).
- Próximos pasos (están en el tablero del panel): Gmail de teca, reservar usuarios en redes, dominio teca.com.ar / teca.ar, AAIP, términos y condiciones, juntar 15 testers, empezar a publicar contenido. App para tiendas (Capacitor, Google Play USD 25, Apple USD 99/año) desde marzo 2027.
- Ideas con fecha: decos de Navidad (8/12), tu año en teca / top 3 (15/12), la caja 2026 al pasar de año (1/1), prode de los Oscar, Feria del Libro, Día del Libro, Día del Amigo, Halloween.
- Ideas sin fecha: compartir la teca en historias, clubes de lectura, escanear código de barras, Biblioteca Nacional de España como fuente de libros, aviso cuando un amigo termina algo que guardaste, desafío de lectura del año.
