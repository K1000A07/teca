import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'
import { BIO_ON } from '../flags.js'
import { Avatar, Back, Coin, CoinPill, Cover, Icon, Sheet } from '../ui.jsx'
import { COINS, KINDS } from '../lib.js'
import { ProfileForm } from './Auth.jsx'
import { useImpression } from '../track.js'
import { InstallContent, isStandalone } from './Tutorial.jsx'
import { pushStatus, enablePush, disablePush } from '../push.js'

export function Profile({ ctx }) {
  const [filter, setFilter] = useState('all')
  const count = (k) => ctx.items.filter((i) => i.kind === k).length
  const saved = ctx.saved.filter((i) => filter === 'all' || i.kind === filter)
  return (
    <div>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8, padding: '24px 20px 0' }}>
        <button className="iconbtn" aria-label="Ajustes" onClick={() => ctx.go('settings')}><Icon n="gear" s={19} /></button>
        <button className="iconbtn" aria-label="Novedades" onClick={() => ctx.go('news')}><Icon n="bell" s={19} />{ctx.hasNews && <span className="dot" />}</button>
      </div>
      <div className="row pad" style={{ gap: 16 }}>
        <Avatar p={ctx.profile} s={86} />
        <div><h1 className="h" style={{ fontSize: 40 }}>{ctx.profile.name}</h1>
          <div className="light" style={{ marginTop: 4, letterSpacing: '.1em' }}>@{ctx.profile.username}</div>
          <button className="chip" style={{ marginTop: 8 }} onClick={() => ctx.go('editprofile')}>Editar perfil</button></div>
      </div>
      {BIO_ON && ctx.profile.bio && <p className="pad body" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.4 }}>{ctx.profile.bio}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '18px 20px 0' }}>
        {[['book', '#A9C6F2'], ['movie', '#E6F04A'], ['show', '#E3EDFB']].map(([k, bg]) => (
          <button key={k} onClick={() => { ctx.setTeca(k); ctx.tab('lib') }} style={{ border: 0, background: bg, padding: '12px 8px', textAlign: 'center', borderRadius: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: '-0.04em', lineHeight: .95 }}>{count(k)}</div>
            <div className="light" style={{ color: 'var(--ink)', marginTop: 4 }}>{KINDS[k].plural}</div>
          </button>
        ))}
      </div>
      <button onClick={() => ctx.go('shop')} className="row" style={{ width: 'calc(100% - 40px)', margin: '10px 20px 0', padding: '12px 14px', background: 'var(--ink)', color: '#fff', borderRadius: 18, border: 0, textAlign: 'left', gap: 12 }}>
        <span className="row" style={{ gap: 7, fontWeight: 800, fontSize: 26, color: 'var(--lim)', letterSpacing: '-0.04em' }}><Coin s={26} ring="#E6F04A" />{ctx.coins}</span>
        <span style={{ flex: 1 }} className="light"><span style={{ color: '#fff' }}>Tecoins · canjear</span></span>
        <span style={{ transform: 'rotate(180deg)', display: 'flex' }}><Icon n="back" s={16} c="#E6F04A" w={2.4} /></span>
      </button>
      <button onClick={() => { const url = `${location.origin}/r/${ctx.profile.username}`; navigator.share ? navigator.share({ title: 'teca', text: 'Te invito a teca, mi biblioteca de bolsillo. Si te sumás con mi link, los dos ganamos tecoins 📚', url }).catch(() => {}) : (navigator.clipboard.writeText(url), ctx.say('Link copiado')) }} className="row" style={{ width: 'calc(100% - 40px)', margin: '10px 20px 0', padding: '12px 14px', background: 'var(--lim)', borderRadius: 18, border: 0, boxShadow: 'inset 0 0 0 1.5px var(--ink)', textAlign: 'left', gap: 12 }}>
        <span style={{ fontSize: 24 }}>💌</span>
        <span style={{ flex: 1 }}><b style={{ fontSize: 15 }}>Invitá amigos y ganá 30 tecoins</b><br /><span style={{ fontWeight: 300, fontSize: 12.5 }}>{(ctx.refs || []).length ? `Ya se sumaron ${(ctx.refs || []).length} con tu link` : 'Compartí tu link personal de teca'}</span></span>
        <Icon n="share" s={18} w={2} />
      </button>
      <div className="between pad" style={{ paddingTop: 20, alignItems: 'baseline' }}><h2 className="h" style={{ fontSize: 24 }}>Guardados</h2><span className="light">para después · {ctx.saved.length}</span></div>
      <div className="row" style={{ gap: 6, padding: '10px 20px 4px' }}>
        {[['all', 'todo'], ['book', 'libros'], ['movie', 'pelis'], ['show', 'series']].map(([k, l]) => <button key={k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      {saved.map((it) => (
        <button key={it.id} className="listrow" style={{ width: '100%', border: 0, borderBottom: '1px solid var(--line)', background: 'none', textAlign: 'left' }} onClick={() => ctx.openSheet({ t: 'detail', it })}>
          <Cover it={it} w={38} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
            <div className="light" style={{ marginTop: 3, letterSpacing: '.12em' }}>{KINDS[it.kind].label} · por {ctx.people[it.user_id]?.name || ''}</div></div>
        </button>
      ))}
      {!saved.length && <p className="pad body muted" style={{ fontSize: 14 }}>Cuando algo de tus amigos te tiente, tocá “guardar para después” y aparece acá.</p>}
    </div>
  )
}

export function EditProfile({ ctx }) {
  return (<div><Back onBack={ctx.back} title="Editar perfil" /><ProfileForm ctx={ctx} initial={ctx.profile} submitLabel="Guardar" onDone={() => { ctx.say('Perfil guardado'); ctx.back() }} /></div>)
}

function Row({ t, v, onClick, toggle }) {
  return (
    <button onClick={onClick} className="between" style={{ width: '100%', border: 0, background: 'none', padding: '13px 0', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
      <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>{t}</span>
      {toggle !== undefined
        ? <span style={{ width: 44, height: 26, borderRadius: 99, background: toggle ? 'var(--lim)' : '#DDD9D2', boxShadow: 'inset 0 0 0 1.5px var(--ink)', position: 'relative', flex: 'none' }}><span style={{ position: 'absolute', top: 3, [toggle ? 'right' : 'left']: 3, width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)' }} /></span>
        : <span style={{ fontWeight: 300, fontSize: 14, color: 'var(--gris)', whiteSpace: 'nowrap' }}>{v} ›</span>}
    </button>
  )
}
const Group = ({ t, children, note }) => <div style={{ marginTop: 18 }}><div className="light">{t}</div><div style={{ marginTop: 4 }}>{children}</div>{note && <p style={{ margin: '8px 0 0', fontWeight: 300, fontSize: 12.5, lineHeight: 1.4, color: 'var(--gris)' }}>{note}</p>}</div>

async function borrarCuenta_(ctx) {
  if (!confirm('¿Borrar tu cuenta? Se pierden tus estantes, reseñas, amigos y tecoins. No se puede deshacer.')) return
  try {
    const uid = ctx.session.user.id
    const { data: files } = await sb.storage.from('avatars').list(uid)
    if (files?.length) await sb.storage.from('avatars').remove(files.map((f) => `${uid}/${f.name}`))
    const { error } = await sb.rpc('borrar_mi_cuenta')
    if (error) throw error
    await sb.auth.signOut()
  } catch { ctx.say('No se pudo borrar la cuenta. Probá de nuevo.') }
}

export function Settings({ ctx }) {
  const borrarCuenta = () => borrarCuenta_(ctx)
  const [push, setPush] = useState(null)
  useEffect(() => { pushStatus().then(setPush) }, [])
  async function togglePush() {
    if (push === 'on') { await disablePush(); setPush('off'); return }
    if (push === 'denied') return ctx.say('Los avisos están bloqueados. Activalos desde los ajustes del celu.')
    if (push === 'unsupported') return ctx.say(/iphone|ipad/i.test(navigator.userAgent) ? 'En iPhone primero agregá teca a tu inicio y abrila desde ahí.' : 'Este navegador no permite avisos.')
    try { setPush((await enablePush(ctx.uid)) ? 'on' : await pushStatus()) } catch { ctx.say('No se pudieron activar los avisos') }
  }
  const TECAS = [[null, 'La que más tenés'], ['book', 'Libros'], ['movie', 'Pelis'], ['show', 'Series']]
  const curT = TECAS.findIndex(([k]) => k === (ctx.profile.default_teca || null))
  async function cycleTeca() {
    const next = TECAS[(curT + 1) % TECAS.length][0]
    const { data, error } = await sb.from('profiles').update({ default_teca: next }).eq('id', ctx.uid).select().single()
    if (error) return ctx.say('No se pudo guardar')
    ctx.setProfile(data)
  }
  return (
    <div>
      <Back onBack={ctx.back} title="Ajustes" />
      <div className="pad">
        <Group t="Cuenta"><Row t="Mail" v={ctx.session.user.email} /><Row t="Usuario" v={'@' + ctx.profile.username} onClick={() => ctx.go('editprofile')} /><Row t="Edad y lugar" onClick={() => ctx.go('about')} /><Row t="Borrar mi cuenta" onClick={borrarCuenta} /></Group>
        <Group t="Privacidad"><Row t="Quién ve qué" v={ctx.profile.teca_public ? 'Todos' : 'Amigos'} onClick={() => ctx.go('privacy')} /><Row t="Política de privacidad" onClick={() => ctx.go('policy')} /><Row t="Términos y condiciones" onClick={() => ctx.go('terms')} /></Group>
        <Group t="Tu teca"><Row t="La que se ve primero" v={TECAS[Math.max(0, curT)][1]} onClick={cycleTeca} /></Group>
        <Group t="La app"><Row t="Notificaciones en el celu" toggle={push === 'on'} onClick={togglePush} /><Row t="Instalar en tu celu" onClick={() => ctx.go('install')} /><Row t="Ver el tutorial de nuevo" onClick={ctx.startTour} /><Row t="Cómo se suman tecoins" onClick={() => ctx.go('tecoins')} /></Group>
        {ctx.profile.is_admin && <Group t="Solo para vos"><Row t="Links de regalo" v="tecoins" onClick={() => ctx.go('gifts')} /></Group>}
        <div style={{ marginTop: 22 }}><button className="btn white" onClick={() => sb.auth.signOut()}>Cerrar sesión</button></div>
      </div>
    </div>
  )
}

export function Privacy({ ctx }) {
  const [rank, setRank] = useState(ctx.profile.show_in_ranking)
  const [pub, setPub] = useState(!!ctx.profile.teca_public)
  const [optOut, setOptOut] = useState(!!ctx.profile.email_opt_out)
  async function toggleMail() {
    const v = !optOut; setOptOut(v)
    const { data, error } = await sb.from('profiles').update({ email_opt_out: v }).eq('id', ctx.uid).select().single()
    if (error) { setOptOut(!v); return ctx.say('No se pudo guardar') }
    ctx.setProfile(data)
  }
  async function togglePub() {
    const v = !pub; setPub(v)
    const { data, error } = await sb.from('profiles').update({ teca_public: v }).eq('id', ctx.uid).select().single()
    if (error) { setPub(!v); return ctx.say('No se pudo guardar') }
    ctx.setProfile(data)
  }
  async function toggleRank() {
    const v = !rank; setRank(v)
    const { data } = await sb.from('profiles').update({ show_in_ranking: v }).eq('id', ctx.uid).select().single()
    if (data) ctx.setProfile(data)
  }
  async function download() {
    const blob = new Blob([JSON.stringify({ perfil: ctx.profile, titulos: ctx.items }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mis-datos-teca.json'; a.click()
  }
  return (
    <div>
      <Back onBack={ctx.back} title="Privacidad" />
      <div className="pad">
        <h1 className="h" style={{ fontSize: 28, marginTop: 4 }}>Configuración de privacidad</h1>
        <p className="body" style={{ marginTop: 6, fontSize: 14 }}>Elegí qué información se muestra y a quién.</p>
        <Group t="Tu teca" note={pub ? 'Cualquiera que use teca puede ver tus estantes y reseñas, por ejemplo desde el ranking.' : 'Solo tus amigos ven tus estantes y reseñas. Los demás ven tu perfil y pueden mandarte solicitud.'}><Row t="Que cualquiera pueda ver mi teca" toggle={pub} onClick={togglePub} /></Group>
        <Group t="Ranking" note="En el ranking general solo se muestran tu nombre de usuario, tu foto de perfil y la cantidad de títulos registrados."><Row t="Mostrar mi perfil en el ranking general" toggle={rank} onClick={toggleRank} /></Group>
        <Group t="Avisos" note="Usamos tu mail solo para mandarte avisos de teca, como novedades o rankings. Nada de publicidad de terceros."><Row t="Recibir avisos de teca por mail" toggle={!optOut} onClick={toggleMail} /></Group>
        <Group t="Tus datos"><Row t="Descargar una copia de mis datos" onClick={download} /><Row t="Política de privacidad" onClick={() => ctx.go('policy')} /></Group>
        <div style={{ marginTop: 20, textAlign: 'center' }}><a href="mailto:contactoappteca@gmail.com?subject=Eliminar%20mi%20cuenta%20de%20teca" style={{ fontWeight: 800, fontSize: 15, color: '#B3261E' }}>Eliminar mi cuenta</a></div>
      </div>
    </div>
  )
}

export const POLICY = [
  ['Quién es responsable', 'Los datos los administra Camila Manucci, con domicilio en CABA, Buenos Aires, Argentina. Para cualquier consulta, pedido o queja podés escribir a contactoappteca@gmail.com.'],
  ['Qué datos guardamos', 'Tu nombre, tu usuario, tu correo, tu foto y tus colores de perfil si los elegís. Lo que cargás en teca: títulos, estrellas, reseñas, tus amigos, tus tecoins y tus decoraciones. Si lo completás, también tu rango de edad y tu provincia y ciudad. Y los datos técnicos necesarios para mandarte avisos al celu, si los activás.'],
  ['Para qué los usamos', 'Para que teca funcione: mostrar tus estantes, que tus amigos los vean según lo que elijas, armar el ranking, calcular tus tecoins y mandarte los avisos que activaste.'],
  ['Cuánto tiempo los guardamos', 'Mientras tengas la cuenta. Si la borrás, eliminamos tus datos dentro de los cinco días hábiles, salvo lo que la ley nos obligue a conservar.'],
  ['Quién procesa los datos', 'Usamos servicios de terceros para que teca funcione: Supabase (base de datos y acceso) y Vercel (hosting). Para mostrar tapas y afiches consultamos bases públicas de libros y películas (Google Books, Open Library, TMDB e iTunes), sin enviarles tus datos personales.'],
  ['Datos agregados para marcas', 'Cuando teca tenga marcas que la apoyen, podemos mostrarles números generales, por ejemplo cuántas personas de una ciudad o de un rango de edad usan teca. Nunca les mostramos datos de una persona en particular ni su correo.'],
  ['Lo que no hacemos', 'No vendemos tus datos y no los compartimos con terceros para que hagan publicidad con ellos. No usamos tus datos para nada distinto de lo que dice esta política.'],
  ['Quién puede ver lo que cargás', 'Tus estantes y reseñas los ven tus amigos, salvo que elijas que tu teca sea pública. En el ranking general aparecen tu nombre de usuario, tu foto y la cantidad de títulos. Podés ocultarte desde Ajustes.'],
  ['Avisos', 'Los mails de la cuenta, como confirmar el alta o recuperar la contraseña, son parte del servicio. Los mails de novedades solo te llegan si los aceptaste, y podés darte de baja cuando quieras desde Ajustes › Privacidad o con el link que trae cada mail.'],
  ['Cookies y almacenamiento', 'teca guarda en tu navegador lo mínimo para funcionar: tu sesión y algunas preferencias, como saber si ya viste el tutorial. No usamos cookies de publicidad.'],
  ['Menores', 'teca es para mayores de 16 años. Si detectamos datos de alguien menor de esa edad, los borramos.'],
  ['Tus derechos', 'Podés pedir ver, corregir o borrar tus datos en cualquier momento escribiendo a contactoappteca@gmail.com. Los pedidos de acceso se responden dentro de los diez días corridos, y los de corrección o borrado dentro de los cinco días hábiles, según la Ley N° 25.326 de Protección de los Datos Personales.'],
  ['Órgano de control', 'La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley N° 25.326, atiende las denuncias y reclamos por incumplimiento de esa ley.'],
  ['Cambios', 'Si esta política cambia, te avisamos dentro de la app antes de que el cambio tenga efecto.'],
]
export function PolicyBody() {
  return (
    <div className="pad" style={{ paddingBottom: 40 }}>
      <h1 className="h" style={{ fontSize: 28, marginTop: 6 }}>Política de privacidad</h1>
      <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--lim)', borderRadius: 16, fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>Tus datos se usan solo para que teca funcione. No se venden ni se usan para publicidad de terceros.</div>
      {POLICY.map(([t, x], i) => <div key={t} style={{ marginTop: 18 }}><div style={{ fontWeight: 800, fontSize: 15 }}>{i + 1}. {t}</div><p style={{ margin: '5px 0 0', fontWeight: 300, fontSize: 13.5, lineHeight: 1.5 }}>{x}</p></div>)}
    </div>
  )
}
export function Policy({ ctx }) { return <div><Back onBack={ctx.back} title="Política de privacidad" /><PolicyBody /></div> }

export const TERMS = [
  ['Quiénes somos y qué regulan estos términos', 'teca es una app para registrar libros, películas y series en estanterías y compartirlos con amigos. La opera Camila Manucci, con domicilio en CABA, Buenos Aires, Argentina. Al crear una cuenta o usar teca aceptás estos términos y la política de privacidad.'],
  ['Qué es teca', 'Podés puntuar y reseñar lo que leés o mirás, armar tu estante, ver el feed de tus amigos, guardar cosas para después, ver el ranking, sumar tecoins y decorar tu estante. Podemos cambiar, agregar o quitar funciones. Si quitamos algo importante, te avisamos con anticipación razonable.'],
  ['Tu cuenta', 'Tenés que ser mayor de 16 años para usar teca. Tenés que dar datos verdaderos, tener un solo usuario y cuidar tu contraseña. Sos responsable de lo que se haga desde tu cuenta. Si notás que alguien la usa sin tu permiso, escribinos.'],
  ['Lo que cargás', 'Títulos, estrellas, reseñas, listas, tu foto y tus datos de perfil son tuyos. Lo que compartís se ve según lo que elijas: amigos o público. Para que teca funcione, nos das permiso, no exclusivo y gratuito, para guardarlo, mostrarlo dentro de la app a quien corresponda y procesarlo (por ejemplo, para el ranking). No lo usamos para publicidad de terceros. Si borrás algo, deja de mostrarse; las copias de respaldo se borran en un plazo razonable.'],
  ['Cómo usar teca', 'Usá teca con respeto. No podés publicar contenido ofensivo, discriminatorio, violento, sexual o que incite al odio. Tampoco hacerte pasar por otra persona, hacer spam, tener varias cuentas para sumar tecoins o subir en el ranking, ni copiar reseñas o fotos de otros sin permiso. Y no podés intentar romper, copiar o forzar la app.'],
  ['Moderación', 'Si algo infringe estos términos, podemos ocultarlo, borrarlo o suspender la cuenta. Podés reportar contenido escribiendo a contactoappteca@gmail.com. Cuando sea posible, te avisamos el motivo.'],
  ['Tecoins y decoraciones', 'Las tecoins son una moneda virtual de teca. Se ganan usando la app, por ejemplo cuando alguien guarda algo tuyo, y se gastan en decoraciones y otras funciones. No tienen valor en dinero, no se pueden cambiar por dinero ni transferir a otra persona. Podemos cambiar cómo se ganan y cómo se gastan, con aviso previo.'],
  ['Beta', 'teca está en beta. Puede haber fallas, cambios frecuentes y, en casos excepcionales, pérdida de datos. Hacemos lo posible por evitarlo, pero no garantizamos que nada se pierda. No uses teca para guardar nada que no puedas perder.'],
  ['Disponibilidad', 'Hacemos lo posible para que teca esté disponible, pero no garantizamos que funcione sin interrupciones. Puede haber mantenimientos o cortes ajenos a nosotros.'],
  ['Propiedad intelectual', 'teca, su diseño, sus decoraciones, sus textos y su código son de Camila Manucci. El nombre teca está en trámite de registro como marca ante el INPI (solicitud presentada el 20/11/2026, pendiente de otorgamiento). Las portadas, afiches y datos de libros y películas pertenecen a sus titulares. Los mostramos a partir de bases públicas (Google Books, Open Library, TMDB e iTunes). Si sos titular de algo y querés que lo quitemos, escribinos.'],
  ['Licencia de uso', 'Te damos una licencia personal, limitada, revocable y no transferible para usar teca sin fines comerciales. No podés copiar la app, modificarla, hacer ingeniería inversa ni extraer datos de forma automática.'],
  ['Servicios de terceros', 'teca usa servicios de terceros para funcionar, como Supabase, Vercel, Google (para el ingreso con Google), las bases de libros y películas y las notificaciones del celu. Sus propios términos también se aplican cuando los usás.'],
  ['Responsabilidad', 'No nos responsabilizamos por lo que escriben otros usuarios ni por daños indirectos, en la medida que la ley lo permita. Esto no afecta los derechos que te reconoce la ley de defensa del consumidor.'],
  ['Baja de la cuenta', 'Podés borrar tu cuenta desde Ajustes cuando quieras. Eliminamos tus datos según lo que dice la política de privacidad. Podemos suspender o cerrar cuentas que incumplan estos términos; si lo hacemos sin una causa grave, te avisamos antes.'],
  ['Cambios en estos términos', 'Si cambiamos estos términos, te avisamos dentro de la app antes de que rijan. Si no estás de acuerdo, podés borrar tu cuenta.'],
  ['Ley aplicable y jurisdicción', 'Estos términos se rigen por las leyes argentinas. Para cualquier conflicto, son competentes los tribunales de la Ciudad Autónoma de Buenos Aires, sin perjuicio de la elección de domicilio que la ley de defensa del consumidor le reconoce a la persona usuaria.'],
  ['Contacto', 'Camila Manucci, CABA, Buenos Aires, Argentina. Para consultas, reclamos o reportes: contactoappteca@gmail.com.'],
]
export function TermsBody() {
  return (
    <div className="pad" style={{ paddingBottom: 40 }}>
      <h1 className="h" style={{ fontSize: 28, marginTop: 6 }}>Términos y condiciones</h1>
      <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--lim)', borderRadius: 16, fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>Sé respetuoso, tu contenido es tuyo y las tecoins no son plata.</div>
      <p style={{ margin: '14px 0 0', fontWeight: 300, fontSize: 12.5, color: 'var(--gris)' }}>Última actualización: 25 de noviembre de 2026</p>
      {TERMS.map(([t, x], i) => <div key={t} style={{ marginTop: 18 }}><div style={{ fontWeight: 800, fontSize: 15 }}>{i + 1}. {t}</div><p style={{ margin: '5px 0 0', fontWeight: 300, fontSize: 13.5, lineHeight: 1.5 }}>{x}</p></div>)}
      <p style={{ marginTop: 22, fontWeight: 300, fontSize: 12.5 }}>Mirá también la <a href="/privacidad" style={{ fontWeight: 800 }}>política de privacidad</a>.</p>
    </div>
  )
}
export function Terms({ ctx }) { return <div><Back onBack={ctx.back} title="Términos y condiciones" /><TermsBody /></div> }

function TRow({ t, sub, n, plus }) {
  return (
    <div className="between" style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
      <div><div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>{t}</div><div style={{ marginTop: 2, fontWeight: 300, fontSize: 12.5, color: 'var(--gris)' }}>{sub}</div></div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--lim)', borderRadius: 99, padding: '3px 10px 3px 4px', fontWeight: 800, fontSize: 14, boxShadow: 'inset 0 0 0 1.2px var(--ink)' }}><Coin s={18} />{plus ? '+' : ''}{n}</span>
    </div>
  )
}
const TG = ({ ic, t, children }) => <div style={{ marginTop: 14 }}><div className="row" style={{ gap: 7 }}><Icon n={ic} s={16} w={2} /><span className="light" style={{ color: 'var(--ink)', letterSpacing: '.2em' }}>{t}</span></div><div style={{ marginTop: 2 }}>{children}</div></div>

export function Tecoins({ ctx }) {
  useImpression('tecoins', ctx.uid)
  return (
    <div>
      <Back onBack={ctx.back} title="Tecoins" right={<CoinPill n={ctx.coins} />} />
      <div className="pad">
        <h1 className="h" style={{ fontSize: 30 }}>Cómo se suman</h1>
        <p className="body" style={{ marginTop: 6, fontSize: 14 }}>Cada título que terminás suma. Lo que lleva más tiempo, vale más.</p>
        <TG ic="book" t="Libros"><TRow t="Libro corto" sub="Hasta 250 páginas" n={COINS.bookShort} /><TRow t="Libro largo" sub="Más de 250 páginas" n={COINS.bookLong} /><TRow t="En papel" sub="Si lo leíste en ebook, no suma extra" n={COINS.paper} plus /></TG>
        <TG ic="clap" t="Pelis"><TRow t="Estreno" sub="Salió hace menos de un año" n={COINS.movieNew} /><TRow t="De catálogo" sub="Salió hace más de un año" n={COINS.movieCatalog} /></TG>
        <TG ic="tv" t="Series"><TRow t="Serie corta" sub="De 1 a 3 temporadas" n={COINS.showShort} /><TRow t="Serie larga" sub="4 temporadas o más" n={COINS.showLong} /></TG>
        <TG ic="plus" t="Extras"><TRow t="La viste en el cine" sub="Tiene que estar en cartelera" n={COINS.cinema} plus /><TRow t="Saga completa" sub="Todos los libros, pelis o temporadas" n={COINS.saga} plus /><TRow t="Dejaste una reseña" sub="Lo que opinás, para tus amigos" n={COINS.review} plus /><TRow t="Invitaste a un amigo" sub="Cuando carga su primer título" n={30} plus /><TRow t="Alguien guardó algo tuyo" sub="Por recomendarlo, una vez por persona" n={2} plus /></TG>
        <div style={{ marginTop: 18 }}><button className="btn" onClick={() => ctx.go('shop')}>Canjear por decoraciones</button></div>
      </div>
    </div>
  )
}

export function Install({ ctx }) {
  return (
    <div style={{ background: 'var(--cell)', minHeight: '100dvh' }}>
      <Back onBack={ctx.back} title="" />
      <div className="pad" style={{ paddingBottom: 40 }}>{isStandalone() ? <><h1 className="h" style={{ fontSize: 28 }}>Ya la tenés instalada</h1><p className="body" style={{ marginTop: 10 }}>Estás usando teca como app. Para compartirla, pasales a tus amigos el link y esta misma explicación les aparece al entrar.</p></> : <InstallContent />}</div>
    </div>
  )
}

export function Clubs({ ctx }) {
  return (
    <div>
      <div className="top"><h1 className="h" style={{ fontSize: 34 }}>Clubes</h1></div>
      <div className="pad light">Para leer o ver algo juntos</div>
      <div className="pad" style={{ marginTop: 30 }}>
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div className="tape" style={{ fontSize: 12, padding: '6px 10px' }}>MUY PRONTO</div>
          <p className="body" style={{ marginTop: 14 }}>Acá vas a poder armar clubes con tus amigos, elegir qué leer o ver, hasta dónde y para cuándo, y charlar sin spoilers.</p>
        </div>
      </div>
    </div>
  )
}

export function GiftSheet({ coins, from, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div className="tape" style={{ fontSize: 12, padding: '6px 10px' }}>UN REGALO</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 46, letterSpacing: '-0.05em', marginTop: 18 }}>+{coins} <Coin s={42} /></div>
        <h2 className="h" style={{ fontSize: 28, marginTop: 14 }}>{from && from !== 'Alguien' ? `¡${from} te regaló ${coins} tecoins!` : `¡Te regalaron ${coins} tecoins!`}</h2>
        <p className="body" style={{ marginTop: 8 }}>Ya están en tu cuenta. Canjealos por decoraciones para tu estante desde tu perfil.</p>
        <div style={{ marginTop: 22 }}><button className="btn" onClick={onClose}>¡Gracias!</button></div>
      </div>
    </Sheet>
  )
}

const slug = (t) => (t || 'regalo').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'regalo'

export function Gifts({ ctx }) {
  return <div><Back onBack={ctx.back} title="Links de regalo" /><GiftsPanel uid={ctx.uid} say={ctx.say} /></div>
}

export function GiftsPanel({ uid, say, wide }) {
  const [list, setList] = useState(null)
  const [note, setNote] = useState('')
  const [coins, setCoins] = useState(50)
  const [uses, setUses] = useState(1)
  const [busy, setBusy] = useState(false)
  const load = () => sb.from('invites').select('*').order('created_at', { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [])
  const link = (c) => `${location.origin}/regalo/${c}`
  async function copy(c) {
    const url = link(c)
    if (navigator.share) { try { await navigator.share({ title: 'teca', text: 'Te invito a teca, mi biblioteca de bolsillo. Te regalo tecoins para que arranques.', url }); return } catch {} }
    await navigator.clipboard.writeText(url); say('Link copiado')
  }
  async function create(e) {
    e.preventDefault(); setBusy(true)
    const code = `${slug(note)}-${Math.random().toString(36).slice(2, 6)}`
    const { error } = await sb.from('invites').insert({ code, coins, max_uses: uses, note: note.trim() || null, created_by: uid })
    setBusy(false)
    if (error) return say('No se pudo crear: ' + error.message)
    setNote(''); load(); copy(code)
  }
  async function del(c) { if (!confirm('¿Borrar este link? Ya no se va a poder usar.')) return; await sb.from('invites').delete().eq('code', c); load() }
  return (
    <div style={wide ? { display: 'grid', gridTemplateColumns: 'minmax(0, 380px) minmax(0, 1fr)', gap: 40, alignItems: 'start' } : undefined}>
      <form className={wide ? '' : 'pad'} onSubmit={create}>
        <p className="body" style={{ fontSize: 14 }}>Quien entre por el link y cree su cuenta recibe los tecoins al armar su perfil. Solo vale para cuentas nuevas, una vez por persona.</p>
        <label className="field"><span className="light">Para quién · solo lo ves vos</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Juli" /></label>
        <div className="field"><span className="light">Tecoins</span><div className="row" style={{ gap: 6 }}>{[20, 50, 100, 200].map((n) => <button type="button" key={n} className={`chip ${coins === n ? 'lim' : ''}`} onClick={() => setCoins(n)}><Coin s={14} />{n}</button>)}</div></div>
        <div className="field"><span className="light">¿Cuántas personas lo pueden usar?</span><div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{[1, 5, 10, 50].map((n) => <button type="button" key={n} className={`chip ${uses === n ? 'on' : ''}`} onClick={() => setUses(n)}>{n === 1 ? '1 persona' : n}</button>)}
          <label className="row" style={{ gap: 6, fontWeight: 300, fontSize: 13 }}>u otro:<input className="input" type="number" min="1" max="500" inputMode="numeric" value={[1, 5, 10, 50].includes(uses) ? '' : uses} onChange={(e) => { const v = Math.min(500, Math.max(1, parseInt(e.target.value) || 1)); setUses(e.target.value === '' ? 1 : v) }} placeholder="25" style={{ width: 80, padding: '8px 10px', fontSize: 14 }} /></label></div></div>
        <div style={{ marginTop: 18 }}><button className="btn" disabled={busy}>{busy ? 'Creando…' : 'Crear y copiar link'}</button></div>
      </form>
      <div>
      <div className={wide ? 'light' : 'pad light'} style={{ marginTop: wide ? 0 : 26 }}>Tus links</div>
      {list === null && <p className="pad body muted">Cargando…</p>}
      {list?.map((g) => (
        <div key={g.code} className="listrow" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{g.note || g.code}</div>
            <div style={{ fontWeight: 300, fontSize: 12.5, color: 'var(--gris)', marginTop: 2, wordBreak: 'break-all' }}>{link(g.code).replace(/^https?:\/\//, '')}</div>
            <div className="row" style={{ gap: 8, marginTop: 6, fontSize: 13 }}><span className="row" style={{ gap: 4, fontWeight: 800 }}><Coin s={14} />{g.coins}</span><span style={{ fontWeight: 300 }}>· usado {g.uses} de {g.max_uses}</span></div>
          </div>
          <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
            <button className="chip lim" onClick={() => copy(g.code)}>copiar</button>
            <button className="linkbtn" style={{ fontWeight: 300, fontSize: 12.5 }} onClick={() => del(g.code)}>borrar</button>
          </div>
        </div>
      ))}
      {list?.length === 0 && <p className="pad body muted" style={{ fontSize: 14 }}>Todavía no creaste ninguno.</p>}
      </div>
    </div>
  )
}
