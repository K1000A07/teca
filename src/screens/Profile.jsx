import { useEffect, useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar, Back, Coin, CoinPill, Cover, Icon, Sheet } from '../ui.jsx'
import { COINS, KINDS } from '../lib.js'
import { ProfileForm } from './Auth.jsx'
import { InstallContent, isStandalone } from './Tutorial.jsx'

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

export function Settings({ ctx }) {
  return (
    <div>
      <Back onBack={ctx.back} title="Ajustes" />
      <div className="pad">
        <Group t="Cuenta"><Row t="Mail" v={ctx.session.user.email} /><Row t="Usuario" v={'@' + ctx.profile.username} onClick={() => ctx.go('editprofile')} /></Group>
        <Group t="Privacidad"><Row t="Quién ve qué" v={ctx.profile.teca_public ? 'Todos' : 'Amigos'} onClick={() => ctx.go('privacy')} /><Row t="Política de privacidad" onClick={() => ctx.go('policy')} /></Group>
        <Group t="La app"><Row t="Instalar en tu celu" onClick={() => ctx.go('install')} /><Row t="Ver el tutorial de nuevo" onClick={ctx.startTour} /><Row t="Cómo se suman tecoins" onClick={() => ctx.go('tecoins')} /></Group>
        {ctx.profile.is_admin && <Group t="Solo para vos"><Row t="Links de regalo" v="tecoins" onClick={() => ctx.go('gifts')} /></Group>}
        <div style={{ marginTop: 22 }}><button className="btn white" onClick={() => sb.auth.signOut()}>Cerrar sesión</button></div>
      </div>
    </div>
  )
}

export function Privacy({ ctx }) {
  const [rank, setRank] = useState(ctx.profile.show_in_ranking)
  const [pub, setPub] = useState(!!ctx.profile.teca_public)
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
        <Group t="Tus datos"><Row t="Descargar una copia de mis datos" onClick={download} /><Row t="Política de privacidad" onClick={() => ctx.go('policy')} /></Group>
        <div style={{ marginTop: 20, textAlign: 'center' }}><a href="mailto:[TU MAIL]?subject=Eliminar%20mi%20cuenta%20de%20teca" style={{ fontWeight: 800, fontSize: 15, color: '#B3261E' }}>Eliminar mi cuenta</a></div>
      </div>
    </div>
  )
}

export const POLICY = [
  ['Qué es teca', 'teca es un proyecto personal y sin fines comerciales, pensado para compartir recomendaciones de libros, películas y series entre amigos. Para cualquier consulta podés escribir a [TU MAIL].'],
  ['Qué datos se guardan', 'Tu nombre, tu nombre de usuario, tu correo electrónico y, si querés, una foto de perfil. También lo que cargás en la aplicación: títulos, estrellas y reseñas.'],
  ['Para qué se usan', 'Únicamente para que la aplicación funcione: mostrar tus estantes, que tus amigos puedan verlos, armar el ranking y calcular tus tecoins.'],
  ['Lo que nunca se hace con tus datos', 'No se venden, no se comparten con terceros con fines comerciales, no se usan para publicidad y no se utilizan para ningún otro fin. Quien administra teca no usa la información de los usuarios para nada que no sea el funcionamiento de la aplicación.'],
  ['Quién puede ver lo que cargás', 'Tus estantes y reseñas los ven solo tus amigos, salvo que elijas que tu teca sea pública. En el ranking general aparecen únicamente tu nombre de usuario, tu foto y la cantidad de títulos que cargaste, y podés ocultarte desde Ajustes.'],
  ['Dónde se guardan', 'En los servidores de Supabase, el servicio que aloja la aplicación, con conexión cifrada. Para encontrar tapas y afiches se consultan bases de datos públicas de libros y películas, sin enviar ningún dato tuyo.'],
  ['Tus derechos', 'Podés pedir ver, corregir o borrar tus datos en cualquier momento escribiendo a [TU MAIL]. Los pedidos para ver tus datos se responden dentro de los diez días corridos y los de corrección o borrado, dentro de los cinco días hábiles, como indica la Ley N° 25.326 de Protección de los Datos Personales.'],
  ['Órgano de control', 'LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.'],
  ['Cambios', 'Si esta política cambia, se va a avisar dentro de la aplicación.'],
]
export function PolicyBody() {
  return (
    <div className="pad" style={{ paddingBottom: 40 }}>
      <h1 className="h" style={{ fontSize: 28, marginTop: 6 }}>Política de privacidad</h1>
      <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--lim)', borderRadius: 16, fontWeight: 800, fontSize: 15, lineHeight: 1.35 }}>Tus datos se usan solo para que teca funcione. No se venden, no se comparten y no se usan para nada más.</div>
      {POLICY.map(([t, x], i) => <div key={t} style={{ marginTop: 18 }}><div style={{ fontWeight: 800, fontSize: 15 }}>{i + 1}. {t}</div><p style={{ margin: '5px 0 0', fontWeight: 300, fontSize: 13.5, lineHeight: 1.5 }}>{x}</p></div>)}
    </div>
  )
}
export function Policy({ ctx }) { return <div><Back onBack={ctx.back} title="Política de privacidad" /><PolicyBody /></div> }

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
  return (
    <div>
      <Back onBack={ctx.back} title="Tecoins" right={<CoinPill n={ctx.coins} />} />
      <div className="pad">
        <h1 className="h" style={{ fontSize: 30 }}>Cómo se suman</h1>
        <p className="body" style={{ marginTop: 6, fontSize: 14 }}>Cada título que terminás suma. Lo que lleva más tiempo, vale más.</p>
        <TG ic="book" t="Libros"><TRow t="Libro corto" sub="Hasta 250 páginas" n={COINS.bookShort} /><TRow t="Libro largo" sub="Más de 250 páginas" n={COINS.bookLong} /><TRow t="En papel" sub="Si lo leíste en ebook, no suma extra" n={COINS.paper} plus /></TG>
        <TG ic="clap" t="Pelis"><TRow t="Estreno" sub="Salió hace menos de un año" n={COINS.movieNew} /><TRow t="De catálogo" sub="Salió hace más de un año" n={COINS.movieCatalog} /></TG>
        <TG ic="tv" t="Series"><TRow t="Serie corta" sub="De 1 a 3 temporadas" n={COINS.showShort} /><TRow t="Serie larga" sub="4 temporadas o más" n={COINS.showLong} /></TG>
        <TG ic="plus" t="Extras"><TRow t="La viste en el cine" sub="Tiene que estar en cartelera" n={COINS.cinema} plus /><TRow t="Saga completa" sub="Todos los libros, pelis o temporadas" n={COINS.saga} plus /><TRow t="Dejaste una reseña" sub="Lo que opinás, para tus amigos" n={COINS.review} plus /></TG>
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
