import { useEffect, useRef, useState } from 'react'
import { sb } from '../supabase.js'
import { Avatar, Back, Icon } from '../ui.jsx'
import { Steps, VisibilityStep } from './About.jsx'

export function Intro() {
  return (
    <div className="splash">
      <img src="/splash.jpg" alt="" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,14,20,.3), rgba(10,14,20,.05) 45%, rgba(10,14,20,.35))' }} />
      <div className="word">teca</div>
    </div>
  )
}

function Phrase({ cycle }) {
  const words = ['biblio', 'filmo', 'video']
  const [i, setI] = useState(0)
  useEffect(() => { if (!cycle) return; const t = setInterval(() => setI((x) => x + 1), 1500); return () => clearInterval(t) }, [cycle])
  return (
    <div style={{ position: 'relative', textAlign: 'center', fontWeight: 800, fontSize: 46, lineHeight: .92, letterSpacing: '-0.045em' }}>
      Tu <span style={{ display: 'inline-block', minWidth: 110, textAlign: 'right' }}>{words[i % 3]}</span><span className="teca">teca</span><br />de bolsillo.
      <div className="tape" style={{ position: 'absolute', left: 'calc(50% - 150px)', top: 44 }}>LIBROS<br />PELIS &amp; SERIES</div>
    </div>
  )
}

function InviteBanner() {
  const [info, setInfo] = useState(null)
  useEffect(() => {
    const code = localStorage.getItem('teca.gift')
    const ref = localStorage.getItem('teca.ref')
    if (code) sb.rpc('invite_info', { p_code: code }).then(({ data }) => { if (data?.[0]?.valid) setInfo(data[0]) })
    else if (ref) sb.rpc('ref_info', { p_username: ref }).then(({ data }) => { if (data?.[0]) setInfo({ inviter: data[0].name, coins: 20, ref: true }) })
  }, [])
  if (!info) return null
  return (
    <div className="row" style={{ margin: '0 20px 18px', padding: '12px 14px', background: 'var(--lim)', borderRadius: 18, boxShadow: 'inset 0 0 0 1.5px var(--ink)', gap: 12 }}>
      <span style={{ fontSize: 26 }}>🎁</span>
      <div style={{ fontSize: 14, lineHeight: 1.35 }}>{info.ref ? <><b>{info.inviter} te invita a teca.</b><br /><span style={{ fontWeight: 300 }}>Creá tu cuenta y arrancás con 20 tecoins.</span></> : <><b>{info.inviter === 'Alguien' ? 'Te regalan' : `${info.inviter} te regala`} {info.coins} tecoins.</b><br /><span style={{ fontWeight: 300 }}>Creá tu cuenta para recibirlos.</span></>}</div>
    </div>
  )
}

export function Login({ say, initialMode = null }) {
  const [mode, setMode] = useState(initialMode) // null | 'in' | 'up' | 'sent'
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    if (mode === 'in') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass })
      if (error) setErr(error.message.includes('Invalid') ? 'El mail o la contraseña no coinciden.' : error.message.includes('confirm') ? 'Todavía no confirmaste tu mail. Fijate en tu casilla.' : error.message)
    } else {
      if (pass.length < 6) { setErr('La contraseña tiene que tener al menos 6 caracteres.'); setBusy(false); return }
      const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin } })
      if (error) setErr(error.message.includes('registered') ? 'Ese mail ya tiene cuenta. Probá entrar.' : error.message)
      else if (!data.session) setMode('sent')
    }
    setBusy(false)
  }
  async function forgot() {
    if (!email) return setErr('Escribí tu mail arriba y volvé a tocar.')
    await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    say('Te mandamos un mail para cambiar la contraseña')
  }

  if (mode === 'sent') return (
    <div className="pad" style={{ paddingTop: 140, textAlign: 'center' }}>
      <h1 className="h" style={{ fontSize: 34 }}>Revisá tu mail</h1>
      <p className="body" style={{ marginTop: 12 }}>Te mandamos un link a <b>{email}</b> para confirmar tu cuenta. Tocalo y volvé acá.</p>
      <button className="linkbtn" style={{ marginTop: 20 }} onClick={() => setMode('in')}>Ya confirmé, entrar</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ paddingTop: mode ? 70 : 130, transition: 'padding .5s' }}><Phrase cycle={!mode} /></div>
      <div style={{ height: 40 }} />
      <InviteBanner />
      {!mode ? (
        <div className="pad" style={{ marginTop: 16 }}>
          <p className="body" style={{ textAlign: 'center', fontSize: 16 }}>Guardá todo lo que leés y mirás,<br />y compartilo con tus amigos.</p>
          <div className="stack" style={{ marginTop: 32 }}>
            <button className="btn" onClick={() => setMode('in')}>Entrar con mail</button>
            <button className="btn white" onClick={() => setMode('up')}>Creá tu cuenta</button>
          </div>
        </div>
      ) : (
        <form className="pad" style={{ marginTop: 40 }} onSubmit={submit}>
          <h2 className="h" style={{ fontSize: 26 }}>{mode === 'in' ? 'Entrá a tu teca' : 'Creá tu cuenta'}</h2>
          <label className="field"><span className="light">Mail</span><input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field"><span className="light">Contraseña</span><input className="input" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required value={pass} onChange={(e) => setPass(e.target.value)} /></label>
          {err && <div className="err">{err}</div>}
          <div style={{ marginTop: 20 }}><button className="btn" disabled={busy}>{busy ? 'Un segundo…' : mode === 'in' ? 'Entrar' : 'Seguir'}</button></div>
          <div className="between" style={{ marginTop: 16 }}>
            <button type="button" className="linkbtn" onClick={() => { setErr(''); setMode(mode === 'in' ? 'up' : 'in') }}>{mode === 'in' ? 'Creá tu cuenta' : 'Ya tengo cuenta'}</button>
            {mode === 'in' && <button type="button" className="linkbtn" style={{ fontWeight: 300 }} onClick={forgot}>Me olvidé la contraseña</button>}
          </div>
        </form>
      )}
      <p style={{ marginTop: 'auto', padding: '30px 24px', textAlign: 'center', fontWeight: 300, fontSize: 11.5, color: 'var(--gris)' }}>Al seguir aceptás la <a href="/privacidad" style={{ fontWeight: 800 }}>política de privacidad</a> y recibir avisos de teca.</p>
    </div>
  )
}

const EMOJIS = ['📚', '🎬', '🍿', '☕️', '🌙', '🌻', '🦊', '🐱', '🐶', '🐸', '🦋', '🍓', '🌊', '🔥', '✨', '🎧']
const COLORS = ['#F3D9CF', '#A9C6F2', '#E6F04A', '#F2E3B8', '#D9D3F2', '#CDE8D5', '#F4CFC4']

export async function shrinkImage(file, size = 400) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
  const c = document.createElement('canvas'); c.width = c.height = size
  const s = Math.min(img.width, img.height)
  c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}

export function ProfileForm({ ctx, initial, onDone, submitLabel, deferSet }) {
  const [name, setName] = useState(initial?.name || '')
  const [username, setUsername] = useState(initial?.username || '')
  const [emoji, setEmoji] = useState(initial?.emoji || null)
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [avatar, setAvatar] = useState(initial?.avatar_url || null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()

  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return
    setBusy(true)
    try {
      const blob = await shrinkImage(f)
      const path = `${ctx.uid}/avatar-${Date.now()}.jpg`
      const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
      if (error) throw error
      setAvatar(sb.storage.from('avatars').getPublicUrl(path).data.publicUrl)
    } catch { setErr('No se pudo subir la foto. Probá con otra.') }
    setBusy(false)
  }
  async function save(e) {
    e.preventDefault(); setErr('')
    const u = username.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z0-9_.]{3,20}$/.test(u)) return setErr('El usuario va de 3 a 20 caracteres: letras, números, punto o guion bajo.')
    if (!name.trim()) return setErr('Poné tu nombre.')
    setBusy(true)
    const row = { username: u, name: name.trim(), emoji: avatar ? null : emoji, color, avatar_url: avatar }
    const { data, error } = initial
      ? await sb.from('profiles').update(row).eq('id', ctx.uid).select().single()
      : await sb.from('profiles').insert({ id: ctx.uid, ...row }).select().single()
    setBusy(false)
    if (error) return setErr(error.code === '23505' ? 'Ese usuario ya existe. Probá otro.' : 'No se pudo guardar. ' + error.message)
    if (!deferSet) ctx.setProfile(data)
    onDone?.(data)
  }
  const preview = { name, username, emoji: avatar ? null : emoji, color, avatar_url: avatar }
  return (
    <form className="pad" onSubmit={save}>
      <div className="row" style={{ gap: 16, marginTop: 18 }}>
        <div style={{ position: 'relative' }}>
          <Avatar p={preview} s={92} />
          <button type="button" onClick={() => fileRef.current.click()} aria-label="Subir foto" style={{ position: 'absolute', right: -2, bottom: 2, width: 34, height: 34, borderRadius: '50%', border: 0, background: 'var(--lim)', boxShadow: '0 0 0 3px #fff, inset 0 0 0 1.5px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="camera" s={16} /></button>
        </div>
        <div style={{ flex: 1 }}><button type="button" className="btn white" onClick={() => fileRef.current.click()} disabled={busy}>{avatar ? 'Cambiar foto' : 'Subir foto'}</button>
          {avatar && <button type="button" className="linkbtn" style={{ marginTop: 8, fontWeight: 300 }} onClick={() => setAvatar(null)}>Sacar foto</button>}</div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
      </div>
      <label className="field"><span className="light">Nombre</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cami" /></label>
      <label className="field"><span className="light">Usuario · así te encuentran tus amigos</span><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="cami" autoCapitalize="none" /></label>
      {!avatar && <div className="field"><span className="light">O elegí un emoji</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>{EMOJIS.map((e) => <button type="button" key={e} onClick={() => setEmoji(emoji === e ? null : e)} style={{ aspectRatio: 1, borderRadius: 11, border: 0, background: emoji === e ? 'var(--lim)' : 'var(--cell)', boxShadow: emoji === e ? 'inset 0 0 0 1.5px var(--ink)' : 'none', fontSize: 19 }}>{e}</button>)}</div></div>}
      <div className="field"><span className="light">Color</span>
        <div className="row">{COLORS.map((c) => <button type="button" key={c} aria-label={`Color ${c}`} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', border: 0, background: c, boxShadow: color === c ? '0 0 0 2px #fff, 0 0 0 4px #141210' : 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />)}</div></div>
      {err && <div className="err">{err}</div>}
      <div style={{ margin: '22px 0 30px' }}><button className="btn" disabled={busy}>{busy ? 'Un segundo…' : submitLabel}</button></div>
    </form>
  )
}

export function ProfileSetup({ ctx }) {
  const [created, setCreated] = useState(null)
  if (created) return <VisibilityStep ctx={ctx} data={created} />
  return (<>
    <Steps n={2} />
    <div className="pad" style={{ paddingTop: 22 }}>
      <div className="light">Paso 2 de 4</div>
      <h1 className="h" style={{ fontSize: 34, marginTop: 8 }}>Armá tu perfil</h1>
      <p className="body" style={{ marginTop: 6 }}>Así te van a ver tus amigos.</p>
    </div>
    <ProfileForm ctx={ctx} submitLabel="Seguir" deferSet onDone={setCreated} />
    <div className="pad" style={{ paddingBottom: 30 }}><button className="linkbtn" style={{ fontWeight: 300 }} onClick={() => sb.auth.signOut()}>Salir</button></div>
  </>)
}
