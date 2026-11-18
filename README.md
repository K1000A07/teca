# teca

Tu biblio*teca* de bolsillo. Libros, pelis y series para compartir con amigos.

## Qué hay en esta versión (0.1)

- Cuenta con mail y contraseña, perfil con foto o emoji
- Tres estantes separados (biblioteca, filmoteca, videoteca) que se pasan deslizando
- Cargar títulos: tipo, título con sugerencias (libros vía Open Library), estrellas, género, papel/ebook, casa/cine, reseña
- Tecoins calculados al guardar y tabla de cómo se suman
- Amigos: buscar por usuario, solicitudes, "¿En qué andan?", guardar para después, ver la teca de un amigo
- Ranking general (mes, año, siempre)
- Ajustes, privacidad, política de privacidad, cómo instalar en el celu
- Se instala como app (ícono de teca en el inicio)

Pendiente: clubes, decorar el estante y canjear tecoins, acomodar con arrastrar, afiches de pelis y series (TMDB), login con Google.

## Puesta en marcha

1. **Base de datos:** en Supabase › SQL Editor › New query, pegar `supabase/schema.sql` y tocar Run.
2. **Publicar:** en Vercel › Add New › Project, importar este repo. Vercel detecta Vite solo. Deploy.
3. **Avisarle a Supabase la dirección:** en Supabase › Authentication › URL Configuration, poner la dirección de Vercel en *Site URL* y en *Redirect URLs*.
4. (Más adelante) **Afiches de pelis y series:** sacar una API key en themoviedb.org y cargarla en Vercel › Settings › Environment Variables como `VITE_TMDB_KEY`.

## Para programar

```
npm install
npm run dev
```
