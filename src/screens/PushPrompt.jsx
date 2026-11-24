import { pushSupported, enablePush } from '../push.js'
import { isStandalone } from './Tutorial.jsx'

const KEY = 'teca.pushprompt.next'
const N = 'teca.pushprompt.n'
const DAY = 864e5
const MAX_SPACED = 5 // primeras veces: espaciadas cada 3 días, nunca seguidas
// Se muestra al abrir la app si los avisos no están activados. Primero 5 veces (cada 3 días); después, una vez al mes.
export const shouldAskPush = () => pushSupported() && Notification.permission === 'default' && (isStandalone() || /android/i.test(navigator.userAgent)) && Date.now() > Number(localStorage.getItem(KEY) || 0)

function postpone() {
  const n = Number(localStorage.getItem(N) || 0) + 1
  localStorage.setItem(N, String(n))
  localStorage.setItem(KEY, String(Date.now() + (n < MAX_SPACED ? 3 * DAY : 30 * DAY)))
}

export function PushPrompt({ uid, say, onClose }) {
  async function yes() {
    try { if (await enablePush(uid)) say('¡Listo! Te vamos a avisar las novedades') } catch { say('No se pudieron activar los avisos') }
    postpone(); onClose()
  }
  function later() { postpone(); onClose() }
  return (
    <div role="dialog" aria-modal="true" aria-label="Activar notificaciones" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(20,18,16,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: '28px 28px 0 0', padding: '30px 24px calc(30px + env(safe-area-inset-bottom))', textAlign: 'center', animation: 'up .3s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 84, height: 84, margin: '0 auto', borderRadius: '50%', background: 'var(--lim)', boxShadow: 'inset 0 0 0 2px var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🔔</div>
        <h2 className="h" style={{ fontSize: 30, marginTop: 18 }}>Activá las notificaciones</h2>
        <p className="body" style={{ marginTop: 10 }}>Así te enterás cuando tus amigos cargan algo, de los estrenos y de los rankings del año. Mandamos pocas, prometido.</p>
        <div style={{ marginTop: 22 }}><button className="btn" onClick={yes}>Activar notificaciones</button></div>
        <button className="linkbtn" style={{ marginTop: 14, fontWeight: 300 }} onClick={later}>Ahora no</button>
      </div>
    </div>
  )
}
