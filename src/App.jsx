import { useCallback, useEffect, useMemo, useState } from 'react'
import { sb } from './supabase.js'
import { Nav, Toast } from './ui.jsx'
import { Intro, Login, ProfileSetup } from './screens/Auth.jsx'
import { Home } from './screens/Home.jsx'
import { AddSheet } from './screens/Add.jsx'
import { Detail } from './screens/Detail.jsx'
import { Friends, FriendTeca, Notifications } from './screens/Friends.jsx'
import { Ranking } from './screens/Ranking.jsx'
import { Tutorial, InstallSheet, isStandalone } from './screens/Tutorial.jsx'
import { Profile, Settings, Privacy, Policy, PolicyBody, Tecoins, Install, Clubs, EditProfile, Gifts, GiftSheet } from './screens/Profile.jsx'

// Guardamos el código de regalo del link (?regalo=...) hasta que la persona tenga su perfil
try { const g = new URLSearchParams(location.search).get('regalo'); if (g) { localStorage.setItem('teca.gift', g.toLowerCase()); history.replaceState({}, '', location.pathname) } } catch {}

export default function App() {
  const [intro, setIntro] = useState(true)
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [items, setItems] = useState([])
  const [friendships, setFriendships] = useState([])
  const [people, setPeople] = useState({})
  const [feed, setFeed] = useState([])
  const [saved, setSaved] = useState([])
  const [stack, setStack] = useState([{ s: 'lib' }])
  const [sheet, setSheet] = useState(null)
  const [toast, setToast] = useState('')
  const [teca, setTeca] = useState('book')
  const [tour, setTour] = useState(false)

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
    const [mine, fr, sv] = await Promise.all([
      sb.from('items').select('*').eq('user_id', uid).order('position', { ascending: true, nullsFirst: false }).order('created_at'),
      sb.from('friendships').select('*').or(`requester.eq.${uid},addressee.eq.${uid}`),
      sb.from('saved').select('item_id, created_at, items(*)').eq('user_id', uid).order('created_at', { ascending: false }),
    ])
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
  useEffect(() => { if (profile) loadAll() }, [profile, loadAll])
  useEffect(() => { if (profile && uid && !localStorage.getItem(`teca.tour.${uid}`)) setTimeout(() => setTour(true), 400) }, [profile?.id, uid])
  const endTour = useCallback(() => { localStorage.setItem(`teca.tour.${uid}`, '1'); setTour(false); if (!isStandalone()) setSheet({ t: 'install' }) }, [uid])
  useEffect(() => {
    const code = localStorage.getItem('teca.gift')
    if (!profile || !code) return
    localStorage.removeItem('teca.gift')
    sb.rpc('redeem_invite', { p_code: code }).then(({ data }) => {
      if (data > 0) { setProfile((p) => ({ ...p, bonus_coins: (p.bonus_coins || 0) + data })); setSheet({ t: 'gift', coins: data }) }
    })
  }, [profile?.id])
  const startTour = useCallback(() => { setStack([{ s: 'lib' }]); setTeca('book'); setTimeout(() => setTour(true), 300) }, [])

  // ----- navegación con el botón "atrás" del celu -----
  const go = useCallback((s, params = {}) => { setStack((st) => [...st, { s, ...params }]); history.pushState({}, '') }, [])
  const tab = useCallback((s) => setStack([{ s }]), [])
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), [])
  useEffect(() => { const f = () => { setSheet(null); setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)) }; window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f) }, [])

  const coins = useMemo(() => items.reduce((a, i) => a + (i.coins || 0), 0) + (profile?.bonus_coins || 0), [items, profile?.bonus_coins])
  const friends = useMemo(() => friendships.filter((f) => f.status === 'accepted').map((f) => people[f.requester === uid ? f.addressee : f.requester]).filter(Boolean), [friendships, people, uid])
  const incoming = useMemo(() => friendships.filter((f) => f.status === 'pending' && f.addressee === uid), [friendships, uid])
  const lastSeen = Number(localStorage.getItem('teca.seen') || 0)
  const hasNews = incoming.length > 0 || feed.some((i) => new Date(i.created_at).getTime() > lastSeen)

  const ctx = { uid, session, profile, setProfile, items, setItems, friends, friendships, people, incoming, feed, saved, setSaved, coins, go, back, tab, say, reload: loadAll, reloadProfile: loadProfile, openSheet: setSheet, teca, setTeca, hasNews, startTour }

  if (location.pathname === '/privacidad') return <div className="app"><div className="back"><a href="/" className="iconbtn dark" aria-label="Volver" style={{ color: '#fff', textDecoration: 'none' }}>‹</a><div className="title">teca</div></div><PolicyBody /></div>
  if (intro || session === undefined || (session && profile === undefined)) return <Intro />
  if (!session) return <div className="app"><Login say={say} /><Toast msg={toast} /></div>
  if (!profile) return <div className="app"><ProfileSetup ctx={ctx} /><Toast msg={toast} /></div>

  const screens = {
    lib: <Home ctx={ctx} />, friends: <Friends ctx={ctx} />, clubs: <Clubs ctx={ctx} />, rank: <Ranking ctx={ctx} />, me: <Profile ctx={ctx} />,
    friend: <FriendTeca ctx={ctx} person={view.person} />, news: <Notifications ctx={ctx} />,
    settings: <Settings ctx={ctx} />, privacy: <Privacy ctx={ctx} />, policy: <Policy ctx={ctx} />, tecoins: <Tecoins ctx={ctx} />,
    install: <Install ctx={ctx} />, gifts: <Gifts ctx={ctx} />, editprofile: <EditProfile ctx={ctx} />,
  }
  const root = stack[0].s
  return (
    <div className="app">
      {screens[view.s] || screens.lib}
      {stack.length === 1 && <Nav tab={root} go={tab} onAdd={() => setSheet({ t: 'add' })} dots={{ friends: hasNews }} />}
      {sheet?.t === 'add' && <AddSheet ctx={ctx} onClose={() => setSheet(null)} />}
      {sheet?.t === 'detail' && <Detail ctx={ctx} it={sheet.it} onClose={() => setSheet(null)} />}
      {sheet?.t === 'install' && <InstallSheet onClose={() => setSheet(null)} />}
      {sheet?.t === 'gift' && <GiftSheet coins={sheet.coins} onClose={() => setSheet(null)} />}
      {tour && !sheet && stack.length === 1 && <Tutorial onDone={endTour} />}
      <Toast msg={toast} />
    </div>
  )
}
