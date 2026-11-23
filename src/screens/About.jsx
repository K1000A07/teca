import { useEffect, useRef, useState } from 'react'
import { sb } from '../supabase.js'
import { Back } from '../ui.jsx'

export const AGES = [['18-24', '18 a 24'], ['25-34', '25 a 34'], ['35-44', '35 a 44'], ['45+', '45 o más']]

// Datos privados (edad y lugar): los ve solo cada persona y el panel de administración
export const savePrivate = (uid, age, place) => sb.from('profile_private').upsert({
  user_id: uid, age_range: age || null, location: place?.label || null, province: place?.province || null, place_id: place?.id || null, updated_at: new Date().toISOString(),
})

export function AgeChips({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Rango de edad" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {AGES.map(([k, l]) => <button type="button" key={k} role="radio" aria-checked={value === k} className={`chip ${value === k ? 'on' : ''}`} style={{ padding: '7px 13px', fontSize: 13 }} onClick={() => onChange(value === k ? null : k)}>{l}</button>)}
    </div>
  )
}

// Solo se guarda un lugar elegido de la lista, así todos quedan escritos igual
export function PlaceInput({ value, onPick }) {
  const [q, setQ] = useState(value?.label || '')
  const [opts, setOpts] = useState([])
  const [asked, setAsked] = useState(false)
  const seq = useRef(0)
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2 || (value && value.label === q)) { setOpts([]); setAsked(false); return }
    const n = ++seq.current
    const t = setTimeout(() => {
      fetch('/api/places?q=' + encodeURIComponent(term)).then((r) => r.json()).then((j) => { if (n === seq.current) { setOpts(Array.isArray(j) ? j : []); setAsked(true) } }).catch(() => { if (n === seq.current) { setOpts([]); setAsked(true) } })
    }, 250)
    return () => clearTimeout(t)
  }, [q, value])
  const pick = (o) => { setQ(o.label); setOpts([]); onPick(o) }
  return (
    <div style={{ position: 'relative' }}>
      <input className="input" value={q} placeholder="Barrio o ciudad" autoComplete="off" aria-label="¿Dónde vivís?" aria-autocomplete="list"
        onChange={(e) => { setQ(e.target.value); if (value) onPick(null) }} />
      {opts.length > 0 && (
        <div role="listbox" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: 'calc(100% + 4px)', background: '#fff', borderRadius: 14, boxShadow: '0 0 0 1.5px var(--ink), 0 14px 26px -10px rgba(0,0,0,.35)', overflow: 'hidden' }}>
          {opts.map((o) => <button type="button" role="option" key={o.id + o.label} onClick={() => pick(o)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'none', padding: '12px 14px', fontSize: 15, fontWeight: 800, borderBottom: '1px solid var(--line)' }}>{o.label}</button>)}
        </div>
      )}
      <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--gris)', marginTop: 6 }}>
        {q.trim() && !value ? (asked && !opts.length ? 'No encontramos ese lugar. Probá con el barrio o la ciudad.' : 'Elegí una opción de la lista.') : 'Lo usamos para mostrarte eventos cerca. Nadie más lo ve.'}
      </div>
    </div>
  )
}

export function Steps({ n, of = 4 }) {
  return <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingTop: 28 }} aria-label={`Paso ${n} de ${of}`}>{Array.from({ length: of }, (_, i) => <span key={i} style={{ width: i < n ? 18 : 6, height: 6, borderRadius: 3, background: i < n ? 'var(--ink)' : '#CFCBC4' }} />)}</div>
}

// Paso del alta: quién ve tu teca + edad y lugar (opcionales)
export function VisibilityStep({ ctx, data }) {
  const [pub, setPub] = useState(false)
  const [age, setAge] = useState(null)
  const [place, setPlace] = useState(null)
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    let row = data
    if (pub) { const { data: d } = await sb.from('profiles').update({ teca_public: true }).eq('id', ctx.uid).select().single(); if (d) row = d }
    if (age || place) await savePrivate(ctx.uid, age, place)
    ctx.setProfile(row)
  }
  const opt = (on, set, t, sub) => (
    <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 18, background: on ? 'var(--lim)' : '#fff', boxShadow: 'inset 0 0 0 1.5px var(--ink)', cursor: 'pointer' }}>
      <input type="radio" name="vis" checked={on} onChange={set} style={{ width: 20, height: 20, margin: '2px 0 0', accentColor: '#141210' }} />
      <span><span style={{ display: 'block', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>{t}</span><span style={{ display: 'block', fontWeight: 300, fontSize: 14, lineHeight: 1.35, marginTop: 2 }}>{sub}</span></span>
    </label>
  )
  return (<>
    <Steps n={3} />
    <div className="pad" style={{ paddingTop: 22 }}>
      <div className="light">Paso 3 de 4</div>
      <h1 className="h" style={{ fontSize: 34, marginTop: 8 }}>¿Quién puede ver tu <span className="serif">teca</span>?</h1>
      <p className="body" style={{ marginTop: 10 }}>Lo podés cambiar cuando quieras en Ajustes.</p>
      <div className="stack" style={{ marginTop: 22 }}>
        {opt(!pub, () => setPub(false), 'Solo mis amigos', 'Tu estante y tus reseñas los ven las personas que agregaste.')}
        {opt(pub, () => setPub(true), 'Pública', 'Cualquiera puede ver tu teca y tus reseñas ayudan a otros a decidir qué leer o ver.')}
      </div>
      <div className="light" style={{ marginTop: 26 }}>Contanos un poco más (opcional)</div>
      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 10 }}>¿Cuántos años tenés?</div>
      <AgeChips value={age} onChange={setAge} />
      <div style={{ fontWeight: 800, fontSize: 14, margin: '14px 0 6px' }}>¿Dónde vivís?</div>
      <PlaceInput value={place} onPick={setPlace} />
      <div style={{ margin: '24px 0 30px' }}><button className="btn" onClick={go} disabled={busy}>{busy ? 'Un segundo…' : 'Entrar a mi teca'}</button></div>
    </div>
  </>)
}

// Ajustes › Edad y lugar
export function About({ ctx }) {
  const [age, setAge] = useState(null)
  const [place, setPlace] = useState(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    sb.from('profile_private').select('age_range,location,province,place_id').eq('user_id', ctx.uid).maybeSingle().then(({ data }) => {
      if (data) { setAge(data.age_range); if (data.location) setPlace({ label: data.location, province: data.province, id: data.place_id }) }
      setReady(true)
    })
  }, [])
  async function save() {
    setBusy(true)
    const { error } = await savePrivate(ctx.uid, age, place)
    setBusy(false)
    if (error) return ctx.say('No se pudo guardar')
    ctx.say('Guardado'); ctx.back()
  }
  return (
    <div>
      <Back onBack={ctx.back} title="Edad y lugar" />
      <div className="pad">
        <p className="body" style={{ marginTop: 6, fontSize: 14 }}>Nadie más ve estos datos. Los usamos para mostrarte eventos cerca y conocer a quienes usan teca.</p>
        {ready && <>
          <div style={{ fontWeight: 800, fontSize: 14, marginTop: 18 }}>¿Cuántos años tenés?</div>
          <AgeChips value={age} onChange={setAge} />
          <div style={{ fontWeight: 800, fontSize: 14, margin: '16px 0 6px' }}>¿Dónde vivís?</div>
          <PlaceInput value={place} onPick={setPlace} />
          <div style={{ marginTop: 24 }}><button className="btn" onClick={save} disabled={busy}>{busy ? 'Un segundo…' : 'Guardar'}</button></div>
        </>}
      </div>
    </div>
  )
}
