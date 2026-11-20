import { firstTeca } from './browse.jsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sb } from './supabase.js'
import { Nav, Toast } from './ui.jsx'
import { Intro, Login, ProfileSetup } from './screens/Auth.jsx'
import { Home } from './screens/Home.jsx'
import { AddSheet } from './screens/Add.jsx'
import { Detail } from './screens/Detail.jsx'
import { Friends, FriendTeca, Notifications } from './screens/Friends.jsx'
import { Ranking } from './screens/Ranking.jsx'
import { NEWS_KEY, Tutorial, InstallSheet, isStandalone } from './screens/Tutorial.jsx'
import { AdminApp } from './screens/Admin.jsx'
import { PushPrompt, shouldAskPush } from './screens/PushPrompt.jsx'
import { Shop } from './screens/Arrange.jsx'
import { Profile, Settings, Privacy, Policy, PolicyBody, Tecoins, Install, Clubs, EditProfile, Gifts, GiftSheet } from './screens/Profile.jsx'

// Guardamos el código de regalo del link (?regalo=...) hasta que la persona tenga su perfil
try {
  const rm = location.pathname.match(/^\/r\/([a-z0-9_.]+)/i)
  if (rm) { localStorage.setItem('teca.ref', rm[1].toLowerCase()); history.replaceState({}, '', '/') }
  const m = location.pathname.match(/^\/regalo\/([a-z0-9-]+)/i)
  const g = m ? m[1] : new URLSearchParams(location.search).get('regalo')
  if (g) { localStorage.setItem('teca.gift', g.toLowerCase()); history.replaceState({}, '', '/') }
} catch {}

export default function App() {
  const [intro, setIntro] = useState(true)
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [items, setItems] = useState([])
  const [friendships, setFriendships] = useState([])
  const [people, setPeople] = useState({})
  const [feed, setFeed] = useState([])
  const [saved, setSaved] = useState([])
  const [stack, setStack] = useState(() => { const t = new URLSearchParams(location.search).get('tab'); return t === 'news' ? [{ s: 'friends' }, { s: 'news' }] : [{ s: ['friends', 'rank', 'me', 'clubs'].includes(t) ? t : 'lib' }] })
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const [teca, setTeca] = useState('book')
  const pickedTeca = useRef(false)
  const [tour, setTour] = useState(false)
  const [askPush, setAskPush] = useState(false)
  const [decos, setDecos] = useState([])
  const [spent, setSpent] = useState(0)
  const [hideNav, setHideNav] = useState(false)

  const uid = session?.user?.id
  const view = stack[stack.length - 1]
  const say = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 2200) }, [])

  // ----- sesión -----
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    const t = setTimeout(() => setIntro(false), 2400)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    return () => { data.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  // ----- datos -----
  const loadProfile = useCallback(async () => {
    if (!uid) return setProfile(null)
    const { data } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data || null)
  }, [uid])

  const loadAll = useCallback(async () => {
    if (!uid) return
    const [mine, fr, sv, dc, sp] = await Promise.all([
      sb.from('items').select('*').eq('user_id', uid).order('position', { ascending: true, nullsFirst: false }).order('created_at'),
      sb.from('friendships').select('*').or(`requester.eq.${uid},addressee.eq.${uid}`),
      sb.from('saved').select('item_id, created_at, items(*)').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('user_decos').select('*').eq('user_id', uid),
      sb.from('coin_spends').select('amount').eq('user_id', uid),
    ])
    setDecos(Array.isArray(dc.data) ? dc.data : [])
    setSpent(Array.isArray(sp.data) ? sp.data.reduce((a, x) => a + x.amount, 0) : 0)
    setItems(mine.data || [])
    const fs = fr.data || []
    setFriendships(fs)
    setSaved((sv.data || []).filter((x) => x.items).map((x) => x.items))
    const ids = [...new Set(fs.flatMap((f) => [f.requester, f.addressee]).filter((x) => x !== uid))]
    if (ids.length) {
      const { data: ps } = await sb.from('profiles').select('*').in('id', ids)
      setPeople(Object.fromEntries((ps || []).map((p) => [p.id, p])))
    }
    const friendIds = fs.filter((f) => f.status === 'accepted').map((f) => (f.requester === uid ? f.addressee : f.requester))
    if (friendIds.length) {
      const { data: fd } = await sb.from('items').select('*').in('user_id', friendIds).order('created_at', { ascending: false }).limit(60)
      setFeed(fd || [])
    } else setFeed([])
  }, [uid])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { if (profile?.id) loadAll() }, [profile?.id, loadAll])
  useEffect(() => {
    if (!profile?.id) return
    sb.rpc('touch_visit').then(({ data, error }) => { if (!error && data) setProfile((p) => (p.last_visit === data ? p : { ...p, last_visit: data })) })
  }, [profile?.id])
  useEffect(() => {
    if (!profile || !uid) return
    // Cuentas de antes del tutorial nuevo: solo ven la novedad de acomodar
    if (!localStorage.getItem(`teca.tour2.${uid}`)) setTimeout(() => setTour(new Date(profile.created_at) < new Date('2026-11-19T15:00:00Z') ? 'news' : true), 400)
    else if (!localStorage.getItem(`${NEWS_KEY}.${uid}`)) setTimeout(() => setTour('news'), 400)
    else if (shouldAskPush()) setTimeout(() => setAskPush(true), 900)
  }, [profile?.id, uid])
  const endTour = useCallback(() => { const wasNews = tour === 'news'; localStorage.setItem(`teca.tour2.${uid}`, '1'); localStorage.setItem(`${NEWS_KEY}.${uid}`, '1'); setTour(false); if (!isStandalone() && !wasNews) setSheet({ t: 'install' }); if (shouldAskPush()) setTimeout(() => setAskPush(true), 400) }, [uid, tour])
  useEffect(() => {
    const code = localStorage.getItem('teca.gift')
    if (!profile || !code) return
    localStorage.removeItem('teca.gift')
    ;(async () => {
      const { data: info } = await sb.rpc('invite_info', { p_code: code })
      const { data } = await sb.rpc('redeem_invite', { p_code: code })
      if (data > 0) { setProfile((p) => ({ ...p, bonus_coins: (p.bonus_coins || 0) + data })); setSheet({ t: 'gift', coins: data, from: info?.[0]?.inviter }) }
    })()
  }, [profile?.id])
  const [refs, setRefs] = useState([])
  const [saveRewards, setSaveRewards] = useState([])
  useEffect(() => {
    if (!profile?.id) return
    const ref = localStorage.getItem('teca.ref')
    if (ref) {
      localStorage.removeItem('teca.ref')
      sb.rpc('claim_referral', { p_username: ref }).then(({ data }) => { if (data) { loadAll(); say('¡Ya son amigos! Cargá tu primer título y ganan tecoins los dos') } })
    }
    sb.from('save_rewards').select('*').eq('owner_id', profile.id).order('created_at', { ascending: false }).limit(30).then(({ data }) => setSaveRewards(Array.isArray(data) ? data : []))
    sb.from('referrals').select('*').eq('inviter', profile.id).order('created_at', { ascending: false }).then(({ data }) => setRefs(Array.isArray(data) ? data : []))
  }, [profile?.id])
  const startTour = useCallback(() => { setStack([{ s: 'lib' }]); setTeca('book'); setTimeout(() => setTour(true), 300) }, [])

  // ----- navegación con el botón "atrás" del celu -----
  const go = useCallback((s, params = {}) => { setStack((st) => [...st, { s, ...params }]); history.pushState({}, '') }, [])
  const tab = useCallback((s) => setStack([{ s }]), [])
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), [])
  useEffect(() => { const f = () => { setSheet(null); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)) }; window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f) }, [])

  const coins = useMemo(() => items.reduce((a, i) => a + (i.coins || 0), 0) + (profile?.bonus_coins || 0) - decos.reduce((a, d) => a + (d.price || 0), 0) - spent, [items, profile?.bonus_coins, decos, spent])
  const friends = useMemo(() => friendships.filter((f) => f.status === 'accepted').map((f) => people[f.requester === uid ? f.addressee : f.requester]).filter(Boolean), [friendships, people, uid])
  const incoming = useMemo(() => friendships.filter((f) => f.status === 'pending' && f.addressee === uid), [friendships, uid])
  const lastSeen = Number(localStorage.getItem('teca.seen') || 0)
  const hasNews = incoming.length > 0 || feed.some((i) => new Date(i.created_at).getTime() > lastSeen) || saveRewards.some((r) => new Date(r.created_at).getTime() > lastSeen)

  useEffect(() => { if (!pickedTeca.current && profile && items.length) { pickedTeca.current = true; setTeca(firstTeca(items, profile.default_teca)) } }, [items, profile])
  const ctx = { uid, session, profile, setProfile, items, setItems, friends, friendships, people, incoming, feed, saved, setSaved, coins, go, back, tab, say, reload: loadAll, reloadProfile: loadProfile, openSheet: setSheet, teca, setTeca, hasNews, startTour, decos, setDecos, setHideNav, setSpent, refs, saveRewards }

  if (location.pathname === '/privacidad') return <div className="app"><div className="back"><a href="/" className="iconbtn dark" aria-label="Volver" style={{ color: '#fff', textDecoration: 'none' }}>‹</a><div className="title">teca</div></div><PolicyBody /></div>
  const isAdminPage = location.pathname.startsWith('/admin')
  if (isAdminPage && session !== undefined && !(session && profile === undefined)) return session ? <><AdminApp session={session} profile={profile} say={say} /><Toast msg={toast} /></> : <div className="app"><Login say={say} /><Toast msg={toast} /></div>
  if (intro || session === undefined || (session && profile === undefined)) return <Intro />
  if (!session) return <div className="app"><Login say={say} /><Toast msg={toast} /></div>
  if (!profile) return <div className="app"><ProfileSetup ctx={ctx} /><Toast msg={toast} /></div>

  const screens = {
    lib: <Home ctx={ctx} />, friends: <Friends ctx={ctx} />, clubs: <Clubs ctx={ctx} />, rank: <Ranking ctx={ctx} />, me: <Profile ctx={ctx} />,
    friend: <FriendTeca ctx={ctx} person={view.person} />, news: <Notifications ctx={ctx} />,
    settings: <Settings ctx={ctx} />, privacy: <Privacy ctx={ctx} />, policy: <Policy ctx={ctx} />, tecoins: <Tecoins ctx={ctx} />,
    install: <Install ctx={ctx} />, gifts: <Gifts ctx={ctx} />, shop: <Shop ctx={ctx} />, editprofile: <EditProfile ctx={ctx} />,
  }
  const root = stack[0].s
  return (
    <div className="app">
      {screens[view.s] || screens.lib}
      {stack.length === 1 && !hideNav && <Nav tab={root} go={tab} onAdd={() => setSheet({ t: 'add' })} dots={{ friends: hasNews }} />}
      {sheet?.t === 'add' && <AddSheet ctx={ctx} prefill={sheet.prefill} onClose={() => setSheet(null)} />}
      {sheet?.t === 'detail' && <Detail ctx={ctx} it={sheet.it} list={sheet.list} onClose={() => setSheet(null)} />}
      {sheet?.t === 'install' && <InstallSheet onClose={() => setSheet(null)} />}
      {sheet?.t === 'gift' && <GiftSheet coins={sheet.coins} from={sheet.from} onClose={() => setSheet(null)} />}
      {tour && !sheet && stack.length === 1 && <Tutorial news={tour === 'news'} onDone={endTour} />}
      {askPush && !tour && !sheet && <PushPrompt uid={uid} say={say} onClose={() => setAskPush(false)} />}
      <Toast msg={toast} />
    </div>
  )
}
