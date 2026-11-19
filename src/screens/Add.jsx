import { useEffect, useRef, useState } from 'react'
import { sb } from '../supabase.js'
import { Coin, Cover, Icon, Sheet, Stars } from '../ui.jsx'
import { GENRES, KINDS, KIND_ORDER, PLATFORMS, coinsFor, genreList, searchTitles } from '../lib.js'

async function shrinkKeep(file, max) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
  const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}
const LANGS = { en: 'en inglés', pt: 'en portugués', fr: 'en francés', it: 'en italiano', de: 'en alemán' }
const Light = ({ children, style }) => <div className="light" style={{ marginTop: 14, marginBottom: 6, ...style }}>{children}</div>

function Choice({ on, title, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ flex: 1, textAlign: 'left', border: 0, borderRadius: 14, padding: '10px 12px', background: on ? 'var(--lim)' : '#fff', boxShadow: 'inset 0 0 0 1.5px var(--ink)' }}>
      <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>{title}</span>
      {sub && <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontWeight: 300, fontSize: 11.5, lineHeight: 1.3 }}>{sub}</span>}
    </button>
  )
}

export function AddSheet({ ctx, onClose, edit, prefill }) {
  const [kind, setKind] = useState(edit?.kind || prefill?.kind || ctx.teca)
  const [f, setF] = useState(edit ? { ...edit, genres: genreList(edit.genre), in_theaters: edit.seen_where === 'cine' } : prefill ? { stars: 0, review: '', seen_where: 'casa', platform: null, format: 'papel', title: prefill.title, creator: prefill.creator || '', year: prefill.year || null, cover_url: prefill.cover_url || null, pages: prefill.pages || null, seasons: prefill.seasons || null, genres: genreList(prefill.genre) } : { genres: [], title: '', creator: '', year: null, cover_url: null, pages: null, seasons: null, stars: 0, genre: null, review: '', seen_where: 'casa', platform: null, format: 'papel' })
  const [q, setQ] = useState(edit?.title || prefill?.title || '')
  const [sugs, setSugs] = useState([])
  const [picked, setPicked] = useState(!!edit || !!prefill)
  const coverRef = useRef()
  const [uploading, setUploading] = useState(false)
  async function uploadCover(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const blob = await shrinkKeep(file, 700)
      const path = `${ctx.uid}/cover-${Date.now()}.jpg`
      const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      set('cover_url', sb.storage.from('avatars').getPublicUrl(path).data.publicUrl); setPicked(true)
    } catch { ctx.say('No se pudo subir la foto') }
    setUploading(false)
  }
  const [busy, setBusy] = useState(false)
  const [searching, setSearching] = useState(false)
  const [done, setDone] = useState(null)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    if (picked || (q.trim().length < 3 && (f.creator || '').trim().length < 3)) { setSugs([]); return }
    setSearching(true)
    const t = setTimeout(() => searchTitles(kind, q, f.creator).then((r) => setSugs(r.slice(0, 40))).catch(() => setSugs([])).finally(() => setSearching(false)), 450)
    return () => clearTimeout(t)
  }, [q, f.creator, kind, picked])

  function pick(s) { setF((x) => ({ ...x, ...s, genres: s.genres?.length ? s.genres : x.genres })); setQ(s.title); setPicked(true); setSugs([]) }
  const toggleGenre = (k) => setF((x) => ({ ...x, genres: x.genres.includes(k) ? x.genres.filter((g) => g !== k) : [...x.genres, k] }))
  const item = { ...f, kind, title: q.trim() }
  const { total, parts } = coinsFor(item)

  async function save() {
    if (!item.title) return
    setBusy(true)
    const row = { user_id: ctx.uid, kind, title: item.title, creator: f.creator || null, year: f.year ? Number(f.year) : null, cover_url: f.cover_url || null,
      pages: kind === 'book' && f.pages ? Number(f.pages) : null, seasons: kind === 'show' && f.seasons ? Number(f.seasons) : null,
      stars: f.stars || null, genre: f.genres.length ? f.genres.join(',') : null, review: f.review?.trim() || null, seen_where: kind === 'book' ? null : kind === 'show' ? 'casa' : f.seen_where,
      platform: kind !== 'book' && (kind === 'show' || f.seen_where === 'casa') ? f.platform || null : null,
      format: kind === 'book' ? f.format : null, coins: total, tilt: edit ? edit.tilt : (Math.random() < 0.12 ? (Math.random() < .5 ? -7 : 7) : 0) }
    const res = edit ? await sb.from('items').update(row).eq('id', edit.id).select().single() : await sb.from('items').insert(row).select().single()
    setBusy(false)
    if (res.error) return ctx.say('No se pudo guardar: ' + res.error.message)
    ctx.setItems((xs) => edit ? xs.map((x) => (x.id === edit.id ? res.data : x)) : [...xs, res.data])
    ctx.setTeca(kind)
    if (edit) { ctx.say('Listo, guardado'); onClose() } else setDone(res.data)
  }

  if (done) return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 46, letterSpacing: '-0.05em' }}>+{done.coins} <Coin s={42} /></div>
        <h2 className="h" style={{ fontSize: 28, marginTop: 14 }}>¡Sumaste {done.coins} tecoins!</h2>
        <p className="body" style={{ marginTop: 8 }}>{done.title} ya está en tu {KINDS[done.kind].teca}<span className="serif">teca</span>.</p>
        <div style={{ marginTop: 22 }}><button className="btn" onClick={onClose}>Ver mi {KINDS[done.kind].teca}teca</button></div>
      </div>
    </Sheet>
  )

  return (
    <Sheet onClose={onClose}>
      <div className="seg">{KIND_ORDER.map((k) => <button key={k} className={k === kind ? 'on' : ''} onClick={() => { setKind(k); setPicked(false); setSugs([]) }}><Icon n={KINDS[k].icon} s={16} w={2} />{KINDS[k].label}</button>)}</div>

      <div className="row" style={{ alignItems: 'flex-start', gap: 14, marginTop: 16 }}>
        <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {f.cover_url || picked ? <Cover it={item} w={76} /> : (
          <div style={{ width: 76, height: 112, flex: 'none', border: '1.5px dashed var(--ink)', borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center' }}>
            <Icon n="photo" s={20} w={1.6} /><span style={{ fontWeight: 300, fontSize: 9.5, lineHeight: 1.25 }}>{kind === 'book' ? 'la tapa' : 'el afiche'}<br />aparece sol{kind === 'book' ? 'a' : 'o'}</span>
          </div>
        )}
        <button type="button" className="linkbtn" style={{ fontSize: 11, fontWeight: 300 }} onClick={() => coverRef.current.click()} disabled={uploading}>{uploading ? 'subiendo…' : 'subir foto'}</button>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={uploadCover} />
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div className="light" style={{ marginBottom: 6 }}>Título</div>
          <input className="input" style={{ fontSize: 18 }} value={q} autoFocus={!edit} onChange={(e) => { setQ(e.target.value); setPicked(false) }} placeholder={kind === 'book' ? 'Rayuela' : kind === 'movie' ? 'Aftersun' : 'The Bear'} />
          <input className="input" style={{ marginTop: 8, fontSize: 13, padding: '9px 12px' }} value={f.creator || ''} onChange={(e) => { set('creator', e.target.value); if (!f.cover_url) setPicked(false) }} placeholder={kind === 'book' ? 'Autor/a · ayuda a encontrarlo' : `${KINDS[kind].creator}`} />
          {searching && !sugs.length && <div className="light" style={{ marginTop: 6, letterSpacing: '.1em' }}>Buscando…</div>}
          {picked && f.cover_url && <div className="row" style={{ marginTop: 6, fontSize: 12.5, gap: 8 }}><b>✓ Encontramos {kind === 'book' ? 'la tapa' : 'el afiche'}</b><button className="linkbtn" style={{ fontWeight: 300, fontSize: 12.5 }} onClick={() => set('cover_url', null)}>sacar</button></div>}
          {sugs.length > 0 && (
            <div style={{ position: 'absolute', left: -90, right: 0, top: 102, background: '#fff', borderRadius: 16, padding: 6, boxShadow: '0 0 0 1.5px var(--ink), 0 16px 30px -12px rgba(0,0,0,.4)', zIndex: 5, maxHeight: 360, overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {sugs.length > 4 && <div className="light" style={{ padding: '4px 10px 6px', letterSpacing: '.12em' }}>{sugs.length} resultados · deslizá para ver más</div>}
              {sugs.map((s, i) => (
                <button key={i} onClick={() => pick(s)} className="row" style={{ width: '100%', border: 0, background: 'none', padding: '8px 10px', borderRadius: 12, textAlign: 'left' }}>
                  <Cover it={{ ...s, kind }} w={30} />
                  <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>{s.title}{s.lang && s.lang !== 'es' && <span style={{ marginLeft: 6, fontWeight: 300, fontSize: 10.5, padding: '1px 6px', borderRadius: 99, boxShadow: 'inset 0 0 0 1px var(--gris)', verticalAlign: 2 }}>{LANGS[s.lang] || s.lang}</span>}</div><div className="light" style={{ fontSize: 9, letterSpacing: '.12em', marginTop: 2 }}>{[KINDS[kind].label, s.year, s.creator].filter(Boolean).join(' · ')}</div></div>
                </button>
              ))}
              <div style={{ position: 'sticky', bottom: -6, background: '#fff', padding: '9px 10px 6px', borderTop: '1px solid var(--line)', marginTop: 4, fontWeight: 300, fontSize: 13 }}>¿No está? <button className="linkbtn" style={{ fontSize: 13 }} onClick={() => { setPicked(true); setSugs([]) }}>Cargal{kind === 'book' ? 'o' : 'a'} igual</button></div>
            </div>
          )}
        </div>
      </div>

      {kind === 'book' && (<>
        <Light>¿Cómo lo leíste?</Light>
        <div className="row" style={{ gap: 8 }}>
          <Choice on={f.format === 'papel'} title="En papel" sub={<>+5 <Coin s={12} /></>} onClick={() => set('format', 'papel')} />
          <Choice on={f.format === 'ebook'} title="Ebook" sub="Kindle, celu o compu" onClick={() => set('format', 'ebook')} />
        </div>
        <label className="row" style={{ marginTop: 10, gap: 10 }}><span className="light" style={{ flex: 1 }}>Páginas</span><input className="input" style={{ width: 110 }} inputMode="numeric" value={f.pages || ''} onChange={(e) => set('pages', e.target.value.replace(/\D/g, ''))} placeholder="250" /></label>
      </>)}
      {kind === 'show' && (
        <label className="row" style={{ marginTop: 14, gap: 10 }}><span className="light" style={{ flex: 1 }}>Temporadas</span><input className="input" style={{ width: 110 }} inputMode="numeric" value={f.seasons || ''} onChange={(e) => set('seasons', e.target.value.replace(/\D/g, ''))} placeholder="3" /></label>
      )}

      <Light>¿Cuántas estrellas?</Light>
      <Stars n={f.stars} s={30} onChange={(v) => set('stars', v)} />

      <Light>¿De qué va? · podés elegir varias</Light>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{GENRES.map(([k, e, l]) => <button key={k} type="button" aria-pressed={f.genres.includes(k)} className={`chip ${f.genres.includes(k) ? 'lim' : ''}`} onClick={() => toggleGenre(k)}>{e} {l}</button>)}</div>

      {kind === 'movie' && (<>
        <Light>¿Dónde la viste?</Light>
        <div className="row" style={{ gap: 8 }}>
          <Choice on={f.seen_where === 'casa'} title="En casa" sub="Tele, compu o celu" onClick={() => set('seen_where', 'casa')} />
          <Choice on={f.seen_where === 'cine'} title="En el cine" sub={<>+15 <Coin s={12} /> si está en cartelera</>} onClick={() => set('seen_where', 'cine')} />
        </div>
        {f.seen_where === 'cine' && <div style={{ marginTop: 8, fontWeight: 300, fontSize: 12.5, lineHeight: 1.4 }}>{f.in_theaters ? <b style={{ fontWeight: 800 }}>✓ Está en cartelera: suma +15</b> : picked && f.cover_url ? 'No figura en cartelera ahora, así que no suma los +15.' : 'Elegila de la lista para chequear si está en cartelera.'}</div>}
      </>)}
      {kind !== 'book' && (kind === 'show' || f.seen_where === 'casa') && (<>
        <Light>¿En qué plataforma?</Light>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{PLATFORMS.map((p) => <button key={p} type="button" className={`chip ${f.platform === p ? 'lim' : ''}`} onClick={() => set('platform', f.platform === p ? null : p)}>{p}</button>)}</div>
      </>)}

      <Light>Tu reseña · la ven tus amigos</Light>
      <textarea className="input" value={f.review || ''} onChange={(e) => set('review', e.target.value)} placeholder="Contales qué te pareció…" />

      <div style={{ marginTop: 16 }}>
        <button className="btn" disabled={!item.title || busy} onClick={save}>
          {busy ? 'Guardando…' : edit ? 'Guardar cambios' : <>Guardar en mi {KINDS[kind].teca}teca <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--ink)', color: 'var(--lim)', borderRadius: 99, padding: '3px 9px', fontSize: 13 }}>+{total} <Coin s={15} ring="#E6F04A" /></span></>}
        </button>
      </div>
      {!edit && item.title && <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 300, fontSize: 12, color: 'var(--gris)' }}>{parts.map(([n, l]) => `${n} por ${l}`).join(' + ')}</div>}
    </Sheet>
  )
}
