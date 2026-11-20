import { useEffect, useLayoutEffect, useState } from 'react'
import { Icon, Sheet } from '../ui.jsx'

const STEPS = [
  { target: null, title: <>Esta es tu <span className="serif" style={{ fontWeight: 400, fontSize: '1.12em' }}>teca</span></>, text: 'Una biblioteca de verdad, pero en el bolsillo. Cada libro, peli o serie que terminás aparece en tu estante, y tus amigos ven en qué andás.' },
  { target: 'tabs', title: 'Tres estantes, uno para cada cosa', text: <>Tu biblio<span className="serif">teca</span> para libros, tu filmo<span className="serif">teca</span> para pelis y tu video<span className="serif">teca</span> para series. Deslizá para pasar de una a otra.</>, radius: 99 },
  { target: 'add', title: 'Cargá lo que terminaste', text: 'Tocá + y escribí el título. La tapa aparece sola. Ponele estrellas y, si querés, una reseña para tus amigos.', radius: 99 },
  { target: 'shelf', title: 'Acomodalo a tu gusto', text: 'Mantené apretado cualquier título para entrar al modo acomodar: arrastralo, ponelo parado, acostado o inclinado, y sumá decoraciones.', radius: 8 },
  { target: 'browse', title: 'Buscá, filtrá o mirala en lista', text: 'Arriba del estante tenés un buscador, un filtro por género y puntaje, y un botón para ver todo en lista. Cuando volvés a abrir teca, aparece de nuevo como biblioteca.', radius: 16 },
  { target: 'coins', title: 'Ganá tecoins', text: 'Cada cosa que cargás suma tecoins, y si alguien guarda algo tuyo para después, ganás 2 más por recomendarlo. Canjealos por plantas, gatos, velas y más. Ojo: si no pasás seguido, tu teca junta polvo.', radius: 99 },
  { target: 'friends', title: 'Sumá a tus amigos', text: 'Buscalos por su usuario o mandales tu link: si se suman, ganan tecoins los dos. Tocá la foto de alguien para ver su teca, y deslizá a los costados para pasar de un título a otro.', radius: 99 },
  { target: 'me', title: 'Tu teca principal', text: 'Cuando alguien entra a tu perfil, ve primero la teca donde más cargaste. Si preferís otra, la cambiás en Ajustes.', radius: 99 },
]

export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

// Chrome en Android avisa cuando la app se puede instalar: guardamos ese aviso para usarlo con un botón
let deferred = null
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })

// Novedades para quienes ya hicieron el tutorial (se muestran una sola vez)
export const NEWS_KEY = 'teca.news3'
const NEWS = [
  { target: 'shelf', isNew: true, title: 'Acomodá como quieras', text: 'Mantené apretado cualquier título para entrar al modo acomodar. Ahora cada cosa queda donde la soltás, y si soltás una deco sobre libros acostados, queda arriba.', radius: 8 },
  { target: 'browse', isNew: true, title: 'Buscador, filtro y lista', text: 'Buscá en tu teca, filtrá por género o puntaje, o mirala en lista. Cuando volvés a abrir teca, aparece de nuevo como biblioteca.', radius: 16 },
  { target: null, isNew: true, title: 'Deslizá entre títulos', text: 'Cuando abrís un libro o una peli de una teca, deslizá a los costados para ver el anterior y el siguiente. Para cerrar, deslizá para abajo.' },
  { target: 'coins', isNew: true, title: 'Ganá por recomendar', text: 'Si alguien guarda para después algo de tu teca, ganás 2 tecoins y te avisamos.', radius: 99 },
  { target: 'me', isNew: true, title: 'Tu teca principal', text: 'En tu perfil se ve primero la teca donde más cargaste. Si preferís otra, la cambiás en Ajustes.', radius: 99 },
]

export function Tutorial({ onDone, news }) {
  const LIST = news ? NEWS : STEPS
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const step = LIST[i]
  useLayoutEffect(() => {
    const measure = () => { const el = document.querySelector(`[data-tour="${step.target}"]`); setRect(el ? el.getBoundingClientRect() : null) }
    measure(); window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step.target])
  const next = () => (i < LIST.length - 1 ? setI(i + 1) : onDone())
  const pad = 6
  const H = window.innerHeight
  const tipStyle = !rect ? { top: '50%', transform: 'translateY(-50%)' }
    : H - rect.bottom > 250 ? { top: rect.bottom + 22 }
    : rect.top > 250 ? { bottom: H - rect.top + 22 }
    : { bottom: 24 }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} role="dialog" aria-modal="true" aria-label="Tutorial">
      {rect
        ? <div style={{ position: 'fixed', left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: step.radius, boxShadow: '0 0 0 4px #E6F04A, 0 0 0 9999px rgba(20,18,16,.74)', transition: 'all .35s cubic-bezier(.2,.8,.2,1)', pointerEvents: 'none' }} />
        : <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,16,.74)' }} />}
      <div style={{ position: 'fixed', left: 'max(24px, calc(50% - 196px))', right: 'max(24px, calc(50% - 196px))', ...tipStyle, background: '#fff', borderRadius: 24, padding: 20, transition: 'all .35s' }}>
        <div className="between">{step.isNew ? <span className="row" style={{ gap: 8 }}><span className="tape" style={{ fontSize: 11, padding: '5px 9px' }}>NUEVO</span><span className="light">{i + 1} de {LIST.length}</span></span> : <span className="light">{i + 1} de {LIST.length}</span>}<button className="linkbtn" style={{ fontWeight: 300, fontSize: 13 }} onClick={onDone}>Saltar</button></div>
        <h2 className="h" style={{ fontSize: 24, marginTop: 10 }}>{step.title}</h2>
        <p className="body" style={{ margin: '8px 0 0', lineHeight: 1.4 }}>{step.text}</p>
        <div className="between" style={{ marginTop: 16 }}>
          <div className="pagedots" style={{ margin: 0 }}>{LIST.length > 1 && LIST.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
          <button className="chip lim" style={{ padding: '10px 18px', fontSize: 14 }} onClick={next}>{i < LIST.length - 1 ? 'Siguiente' : news ? '¡Dale!' : 'Empezar'}</button>
        </div>
      </div>
    </div>
  )
}

export function InstallSteps({ os }) {
  const steps = os === 0
    ? [['Tocá compartir', 'En Safari, el botón del cuadrado con la flecha (abajo o arriba, según tu iPhone).', 'share', 'Compartir'], ['Elegí “Agregar a inicio”', 'Si no lo ves, deslizá el menú hacia abajo.', 'plussq', 'Agregar a inicio'], ['Tocá “Agregar” y listo', 'teca aparece en tu pantalla con su ícono.']]
    : [['Abrí el menú', 'En Chrome, los tres puntitos de arriba a la derecha.', 'dots', 'Menú'], ['Elegí “Instalar app”', 'En algunos celus dice “Agregar a la pantalla principal”.', 'install', 'Instalar app'], ['Confirmá y listo', 'teca aparece en tu pantalla con su ícono.']]
  return (
    <div className="stack" style={{ marginTop: 14 }}>
      {steps.map(([t, sub, ic, label], i) => (
        <div key={i} className="card row" style={{ alignItems: 'flex-start', gap: 12, background: '#fff' }}>
          <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: 'var(--lim)', boxShadow: 'inset 0 0 0 1.5px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{i + 1}</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 16 }}>{t}</div><div style={{ marginTop: 3, fontWeight: 300, fontSize: 13.5, lineHeight: 1.4 }}>{sub}</div>
            {ic && <div className="between" style={{ marginTop: 10, padding: '10px 12px', background: 'var(--cell)', borderRadius: 12, fontWeight: 800, fontSize: 14 }}>{label}<Icon n={ic} s={18} w={2} /></div>}</div>
        </div>
      ))}
    </div>
  )
}

export function InstallContent({ onDone }) {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const [os, setOs] = useState(ios ? 0 : 1)
  const [can, setCan] = useState(!!deferred)
  useEffect(() => { const f = (e) => { e.preventDefault(); deferred = e; setCan(true) }; window.addEventListener('beforeinstallprompt', f); return () => window.removeEventListener('beforeinstallprompt', f) }, [])
  async function install() { if (!deferred) return; deferred.prompt(); const r = await deferred.userChoice; deferred = null; setCan(false); if (r.outcome === 'accepted') onDone?.() }
  return (<>
    <div className="row" style={{ gap: 14 }}><img src="/icons/icon-192.png" alt="Ícono de teca" style={{ width: 64, height: 64, borderRadius: 14 }} /><h2 className="h" style={{ fontSize: 28 }}>Tené teca<br />en tu inicio</h2></div>
    <p className="body" style={{ marginTop: 12 }}>Así se abre como una app, con su ícono y sin pasar por el navegador.</p>
    {can && os === 1 && <div style={{ marginTop: 14 }}><button className="btn" onClick={install}><Icon n="install" s={18} w={2} />Instalar teca</button></div>}
    <div className="seg" style={{ marginTop: 16 }}>{['iPhone', 'Android'].map((t, i) => <button key={t} className={os === i ? 'on' : ''} onClick={() => setOs(i)} style={{ fontSize: 14 }}>{t}</button>)}</div>
    <InstallSteps os={os} />
  </>)
}

export function InstallSheet({ onClose }) {
  return (
    <Sheet onClose={onClose}>
      <InstallContent onDone={onClose} />
      <div style={{ marginTop: 18 }}><button className="btn" onClick={onClose}>Listo</button></div>
      <div style={{ marginTop: 12, textAlign: 'center' }}><button className="linkbtn" style={{ fontWeight: 300 }} onClick={onClose}>Más tarde</button></div>
    </Sheet>
  )
}
