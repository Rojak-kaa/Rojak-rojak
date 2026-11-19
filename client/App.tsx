import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { io } from 'socket.io-client'
import { COLORS, DIFFICULTIES, INGREDIENTS, METHODS, menuFor, nearestStation, recipeFor, RECIPES, SHOPS, stationsFor, TRAINING_RECIPES, WIDTH } from '../shared/kitchen.mjs'
import type { Difficulty, Player, Room } from './model'
import type { Profile } from './model'
import { LANGUAGES } from '../shared/profile.mjs'
import type { Language } from '../shared/profile.mjs'
import { accountRequest, LanguagePicker, OutfitPreview, SignIn, Wardrobe } from './Account'
import { setLanguage, t } from './i18n'
import { ingredientIcon } from './ingredientIcons'
import kitchenCrew from './assets/kitchen-crew.webp'
import foodTown from './assets/food-town.webp'

const GameCanvas = lazy(() => import('./GameCanvas'))
const socket = io({ autoConnect: false })
const SESSION_KEY = 'kitchen-rush-session'
const APRONS = ['Paprika', 'Basil', 'Ube', 'Saffron']
type Reply = { ok?: boolean; error?: string; room?: Room; id?: string; token?: string }

let audio: AudioContext | undefined
function ping(enabled: boolean, notes = [440, 660]) {
  if (!enabled || !window.AudioContext) return
  try {
    audio ??= new AudioContext()
    void audio.resume().catch(() => {})
    notes.forEach((frequency, i) => {
      const oscillator = audio!.createOscillator()
      const gain = audio!.createGain()
      const start = audio!.currentTime + i * 0.075
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.055, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13)
      oscillator.connect(gain).connect(audio!.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.14)
    })
  } catch { /* Audio availability does not affect play. */ }
}

function Apron({ color }: { color: number }) {
  return <span className="apron" style={{ backgroundColor: COLORS[color] }} aria-hidden="true">👨‍🍳</span>
}

async function copy(value: string) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(value)
  const field = document.createElement('textarea')
  field.value = value
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  if (!copied) throw new Error('Clipboard unavailable')
}

function Dialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} onCancel={close} className="dialog">
    <div className="flex items-center justify-between gap-4"><h2>{title}</h2><button className="icon-btn" aria-label="Close settings" onClick={close}>×</button></div>
    {children}
  </dialog>
}

function PlayerRow({ player, host, me }: { player: Player; host: boolean; me: boolean }) {
  return <div className="player-row">
    {player.outfit ? <OutfitPreview outfit={player.outfit} /> : <Apron color={player.color} />}
    <div className="player-name"><strong>{player.name}{me && <small> (you)</small>}</strong>{host && <small>{t('Room host')}</small>}</div>
    <span className={'pill ' + (player.ready && player.connected ? 'good' : '')}>{!player.connected ? t('Reconnecting') : player.ready ? t('Ready') : t('Not ready')}</span>
  </div>
}

function formatTime(ms: number) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000)
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
}

function RecipeIngredients({ ingredients }: { ingredients: string[] }) {
  return <ul className="recipe-ingredients" aria-label={t('Ingredients')}>{ingredients.map(id => {
    const ingredient = INGREDIENTS[id]
    const name = id === 'bilis' ? 'Fried ikan bilis' : ingredient.chop ? 'Chopped ' + ingredient.name.toLowerCase() : ingredient.name
    return <li key={id} style={{ borderInlineStartColor: ingredient.color }}><span className="ingredient-icon" aria-hidden="true">{ingredientIcon(id)}</span>{t(name)}</li>
  })}</ul>
}

function ServiceBriefing({ online, chef, room, onReady, onLeave, error }: {
  online: boolean; chef?: Player; room: Room; onReady: () => void; onLeave: () => void; error: string
}) {
  const connected = room.players.filter(player => player.connected)
  const ready = connected.filter(player => player.ready).length
  return <main className="shell inner briefing">
    <button className="button secondary compact briefing-back" onClick={onLeave}>{t("Back to main page")}</button>
    <div className="room-heading"><div><span className="eyebrow">{t(room.training ? 'UNTIMED PRACTICE' : 'PRE-GAME GUIDE')}</span><h1>{room.training ? RECIPES[room.training].name + ' · ' + t('Training') : t('Before service')}</h1></div><Status online={online} /></div>
    <section className="panel briefing-controls" aria-label="Kitchen instructions">
      <p><kbd>WASD</kbd> or arrow keys <strong>{t("Move")}</strong></p>
      <p><kbd>E</kbd> <strong>{t("Pick up, place, plate, or serve")}</strong></p>
      <p><kbd>E</kbd> <strong>{t('Drop or pick up a floor item')}</strong></p>
      <p><kbd>Space</kbd> <strong>{t("Work at the highlighted station")}</strong></p>
    </section>
    <p className="briefing-tip">{t('Chop marked ingredients at a cutting board. Fry ikan bilis at the fryer when it’s on the recipe.')} <kbd>E</kbd> {t('Pick up, place, serve')} · <kbd>Space</kbd> {t('Work at a station')}. {t('Collect hot food before the burn countdown reaches zero. Use clean dishware to plate and deliver at Serve.')}</p>
    <h2 className="briefing-menu-title">{room.training ? t('Practice recipe') : room.shop ? SHOPS[room.shop].name : t(room.difficulty) + ' · ' + t(DIFFICULTIES[room.difficulty].category)}</h2>
    <ul className="briefing-menu">
      {menuFor(room.difficulty, room.training, room.shop).map(id => {
        const recipe = recipeFor(room.difficulty, id)
        return <li className="panel briefing-recipe" key={id} style={{ borderTopColor: recipe.color }}>
          <h3>{recipe.name}</h3>
          <p className="recipe-method">{t(recipe.method)}</p>
          <RecipeIngredients ingredients={recipe.ingredients} />
          {recipe.included && <small>{t(recipe.included)}</small>}
        </li>
      })}
    </ul>
    <div className="briefing-actions">
      <button className="button primary" disabled={!online || !chef || chef.ready} onClick={onReady}>{t(chef?.ready ? 'Ready' : 'Ready to cook')}</button>
      <p role="status">{room.training ? t('Follow the recipe and serve one dish to complete the lesson.') : connected.length > 1 ? ready + ' / ' + connected.length + ' · ' + t('Ready') : t('The timer starts when you’re ready.')}</p>
    </div>
    {error && <p className="error" role="alert">{t(error)}</p>}
  </main>
}

function CanvasFallback() {
  return <div className="canvas-wrap canvas-fallback">Heating up the kitchen…</div>
}

function guidance(room: Room, player?: Player) {
  if (!player) return 'Waiting for your chef…'
  const station = nearestStation(player.x, player.y, stationsFor(room.difficulty, room.training, room.shop))
  const floorItem = room.game?.floorItems[Math.floor(player.y) * WIDTH + Math.floor(player.x)]
  if (!player.item && floorItem) return 'E · Pick up floor item'
  if (!station) return player.item ? 'E · Drop held item' : 'Walk up to a station to interact.'
  const state = room.game!.stations[station.id]
  const remaining = state.until ? Math.max(1, Math.ceil((state.until - room.now) / 1000)) + 's' : ''
  const method = METHODS[station.kind]
  if (method) {
    if (state.status === 'cooked') {
      const action = state.recipe && RECIPES[state.recipe].vessel === 'cup' ? 'E · Fill a clean cup' : 'E · Use a clean plate'
      return t(action) + (method.hot && state.until ? ' · ' + t('Burns in') + ' ' + remaining : '')
    }
    if (state.status === 'cooking') return method.busy + ' · ' + remaining
    if (state.status === 'burned') return 'Space · Clear the burned batch'
    if (state.status === 'loaded') return 'E · Add or take back an ingredient   /   Space · ' + method.action
    return 'E · Add the ingredients listed on the ticket'
  }
  switch (station.kind) {
    case 'fryer':
      if (state.status === 'frying') return 'Frying ikan bilis · ' + remaining
      if (state.status === 'cooked') return 'E · Collect fried ikan bilis · Burns in ' + remaining
      if (state.status === 'burned') return 'Space · Clear burned ikan bilis'
      return state.status === 'raw' ? 'Space · Fry ikan bilis' : 'E · Put raw ikan bilis in the fryer'
    case 'oven':
      if (state.status === 'roasting') return 'Roasting chicken · ' + remaining
      if (state.status === 'cooked') return 'E · Collect roasted chicken · Burns in ' + remaining
      if (state.status === 'burned') return 'Space · Clear burned chicken'
      return state.status === 'raw' ? 'Space · Roast chicken' : 'E · Put raw chicken in the oven'
    case 'crate': return 'E · Pick up ' + INGREDIENTS[station.id].name.toLowerCase()
    case 'counter': return 'E · Place or pick up an item'
    case 'board':
      if (state.status === 'chopping') return 'Chopping · ' + remaining
      if (state.status === 'raw') return 'Space · Chop   /   E · Pick up'
      return state.item ? 'E · Pick up chopped ingredient' : 'E · Put down an ingredient'
    case 'sink': return state.status === 'washing' ? 'Washing · ' + remaining : state.status === 'dirty' ? 'Space · Wash dishware' : 'E · Put down dirty dishware'
    case 'plates': return 'E · Take or return a clean plate'
    case 'cups': return 'E · Take or return a clean cup'
    case 'dirty': return 'E · Collect a dirty plate'
    case 'cupReturn': return 'E · Collect a dirty cup'
    case 'serve': return 'E · Serve a plated order'
    case 'bin': return 'E · Discard held item'
    default: return ''
  }
}

export default function App() {
  const [page, setPage] = useState<'home' | 'join'>(() => new URLSearchParams(location.search).has('room') ? 'join' : 'home')
  const [room, setRoom] = useState<Room>()
  const [me, setMe] = useState<string>()
  const [online, setOnline] = useState(socket.connected)
  const [settings, setSettings] = useState(false)
  const [sound, setSound] = useState(() => localStorage.getItem('kitchen-rush-sound') !== 'off')
  const [name, setName] = useState(() => sessionStorage.getItem('kitchen-rush-name') ?? '')
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room') ?? '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState('')
  const [pending, setPending] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checkingAccount, setCheckingAccount] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const [shopMenu, setShopMenu] = useState<string>()
  const [selectedShop, setSelectedShop] = useState<string>()
  const [trainingMenu, setTrainingMenu] = useState(false)
  const [language, setLocale] = useState<Language>(() => {
    const stored = localStorage.getItem('rojak-language')
    return stored && Object.hasOwn(LANGUAGES, stored) ? stored as Language : 'en'
  })
  setLanguage(language)
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-Hans' : language }, [language])
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const soundRef = useRef(sound)
  const lastScore = useRef(0)
  soundRef.current = sound

  function selectLanguage(value: Language) {
    localStorage.setItem('rojak-language', value)
    setLocale(value)
  }

  function updateProfile(value: Profile) {
    setProfile(value)
    setName(value.name)
    selectLanguage(value.language)
  }

  useEffect(() => {
    let active = true
    void accountRequest<Profile | null>('me').then(value => {
      if (active && value) updateProfile(value)
    }).catch(() => {}).finally(() => { if (active) setCheckingAccount(false) })
    return () => { active = false }
  }, [])

  function accept(reply?: Reply) {
    if (!reply?.room || !reply.id || !reply.token) return
    sessionStorage.setItem(SESSION_KEY, reply.token)
    setMe(reply.id)
    setRoom(reply.room)
    setPage('join')
    setError('')
  }

  useEffect(() => {
    if (!profile?.id || !profile.outfitConfigured) return
    function connected() {
      setOnline(true)
      const token = sessionStorage.getItem(SESSION_KEY)
      if (!token) return
      socket.timeout(5000).emit('resume', token, (failure: Error | null, reply?: Reply) => {
        if (failure) return
        if (reply?.error) {
          sessionStorage.removeItem(SESSION_KEY)
          setRoom(undefined)
          setMe(undefined)
          setPage('join')
          setError(reply.error)
        } else accept(reply)
      })
    }
    function disconnected() { setOnline(false) }
    function snapshot(state: Room) {
      if (sessionStorage.getItem(SESSION_KEY)) setRoom(state)
    }
    function announce(message: string) {
      setNotice(message)
      clearTimeout(noticeTimer.current)
      noticeTimer.current = setTimeout(() => setNotice(''), 2300)
    }
    socket.on('connect', connected).on('disconnect', disconnected).on('room', snapshot).on('notice', announce)
    socket.connect()
    return () => {
      clearTimeout(noticeTimer.current)
      socket.off('connect', connected).off('disconnect', disconnected).off('room', snapshot).off('notice', announce)
      socket.disconnect()
    }
  }, [profile?.id, profile?.outfitConfigured])

  const phase = room?.phase
  useEffect(() => {
    if (phase) window.scrollTo(0, 0)
  }, [phase])

  const served = room?.game?.served ?? 0
  useEffect(() => {
    if (served > lastScore.current) ping(soundRef.current, [620, 840, 1040])
    lastScore.current = served
  }, [served])

  function toggleSound() {
    localStorage.setItem('kitchen-rush-sound', sound ? 'off' : 'on')
    setSound(!sound)
    ping(!sound)
  }

  function enter(create: boolean, solo = false, training?: string, shop?: string) {
    const nickname = name.trim() || (solo ? 'Solo Chef' : '')
    if (!nickname) return setError('Enter a chef nickname.')
    if (!create && !solo && !/^[a-z0-9]{6}$/i.test(code)) return setError('Enter the six-character room code.')
    setPending(true)
    setError('')
    ping(sound)
    if (name.trim()) sessionStorage.setItem('kitchen-rush-name', name.trim())
    socket.timeout(5000).emit('enter', { name: nickname, create, solo, training, shop, code }, (failure: Error | null, reply?: Reply) => {
      setPending(false)
      if (failure || reply?.error) return setError(reply?.error ?? 'The kitchen server did not respond. Try again.')
      accept(reply)
      setShopMenu(undefined)
      setTrainingMenu(false)
      if (solo) window.scrollTo(0, 0)
    })
  }

  function startSolo(training?: string, shop?: string) {
    if (!online) return setError('The kitchen server is connecting. Try again in a moment.')
    enter(true, true, training, shop)
  }

  function lobby(type: string, value?: string | number) {
    setError('')
    ping(sound, [480])
    socket.timeout(5000).emit('lobby', { type, value }, (failure: Error | null, reply?: Reply) => {
      if (failure || reply?.error) setError(reply?.error ?? 'The kitchen server did not respond.')
    })
  }

  function leave() {
    socket.emit('leave')
    sessionStorage.removeItem(SESSION_KEY)
    setPage('home')
    setRoom(undefined)
    setMe(undefined)
    setError('')
    setNotice('')
    setCopied('')
    setSelectedShop(undefined)
    history.replaceState({}, '', location.pathname)
    window.scrollTo(0, 0)
  }

  async function share(asLink: boolean) {
    if (!room) return
    const url = new URL(location.href)
    url.searchParams.set('room', room.code)
    try {
      await copy(asLink ? url.href : room.code)
      setCopied(asLink ? 'link' : 'code')
      setTimeout(() => setCopied(''), 1800)
    } catch { setError('Clipboard unavailable. You can select and copy the room code.') }
  }

  function openLobby(shop?: string) {
    ping(sound)
    setError('')
    setPage('join')
    setCode('')
    setSelectedShop(shop)
    setShopMenu(undefined)
    window.scrollTo(0, 0)
  }

  const chef = room?.players.find(player => player.id === me)
  const host = room?.host === me
  const canStart = Boolean(room?.players.length && room.players.every(player => player.ready && player.connected))
  const roundLeft = room?.game ? Math.max(0, room.game.endsAt - room.now) : 0

  const onLanding = !room && page === 'home'

  function openProfile() {
    setProfileOpen(true)
    void accountRequest<Profile>('me').then(value => { if (value) setProfile(value) }).catch(() => {})
  }

  async function signOut() {
    await accountRequest('logout', 'POST')
    leave()
    setProfile(null)
    setOnline(false)
    setProfileOpen(false)
  }

  if (checkingAccount || !profile || !profile.outfitConfigured || profileOpen) {
    const onboarding = Boolean(profile && !profile.outfitConfigured)
    return <main className="player-page">
      <div className="player-page-art" style={{ backgroundImage: `url("${kitchenCrew}")` }} aria-hidden="true" />
      <section className="player-page-panel" aria-labelledby="player-page-title">
        <div className="player-page-content">
          {profileOpen && profile?.outfitConfigured && <button className="back profile-back" onClick={() => setProfileOpen(false)}>{t('Back to main page')}</button>}
          <div className="player-brand"><span className="brand-icon" aria-hidden="true">♨</span> Rojak-rojak</div>
          <h1 id="player-page-title">{t(onboarding ? 'Design your chef' : profile ? 'Your profile' : 'Sign in')}</h1>
          {checkingAccount ? <p role="status">{t('Connecting…')}</p> : profile ? (
            <Wardrobe key={profile.id} profile={profile} onSave={updateProfile} onSignOut={signOut} onboarding={onboarding} />
          ) : <>
            <LanguagePicker value={language} change={selectLanguage} />
            <SignIn language={language} onSignIn={updateProfile} />
          </>}
        </div>
      </section>
    </main>
  }

  return <div className="site">
    {phase !== 'playing' && <header className={onLanding ? 'topbar landing-topbar' : 'topbar'}>
      <div className="shell nav">
        <button className="brand" onClick={() => { if (!room) { setPage('home'); window.scrollTo(0, 0) } }} aria-label="Rojak-rojak home">
          <span className="brand-icon">♨</span><span>Rojak-rojak</span>
        </button>
        <div className="nav-actions">
          {!room && <button className="button secondary compact" onClick={openProfile}>{t('Profile & outfit')}</button>}
          <button className="icon-btn" aria-label={sound ? 'Mute sound' : 'Unmute sound'} aria-pressed={sound} onClick={toggleSound}>{sound ? '◖))' : '◖×'}</button>
          <button className="icon-btn gear" aria-label="Settings" onClick={() => setSettings(true)}>⚙</button>
        </div>
      </div>
    </header>}

    {onLanding && <main className="landing">
      <section className="landing-hero town-hero" aria-labelledby="landing-title" style={{ backgroundImage: `url("${foodTown}")` }}>
        <h1 id="landing-title" className="sr-only">Malaysian Food Town</h1>
        <div className="landing-scene">
          <img src={foodTown} alt="An illustrated Malaysian town map with four food shops and a traditional house." width="1536" height="1024" fetchPriority="high" />
          {Object.entries(SHOPS).map(([id, shop]) => <button key={id} type="button" className="food-hotspot town-shop" disabled={pending}
            style={{ left: shop.x + '%', top: shop.y + '%' }} onClick={() => { setError(''); setShopMenu(id) }}>
            <span>{shop.name}</span>
          </button>)}
          <button type="button" className="food-hotspot town-shop" style={{ left: '50%', top: '37%' }} onClick={openProfile}><span>{t('Your profile')}</span></button>
        </div>
      </section>
    </main>}

    {!room && page === 'join' && <main className="shell inner">
      <button className="back" disabled={pending} onClick={leave}>{t("Back to main page")}</button>
      <div className="join-panel panel">
        <Status online={online} />
        <span className="step-icon">🧑‍🍳</span>
        <h1>{selectedShop ? SHOPS[selectedShop].name : t("Find your kitchen")}</h1>
        <p>{t("Choose a nickname, then host a private room or join your friends.")}</p>
        <form onSubmit={(event: FormEvent) => { event.preventDefault(); enter(Boolean(selectedShop && !code.trim()), false, undefined, selectedShop) }}>
          <label htmlFor="nickname">{t("Chef nickname")}</label>
          <input id="nickname" value={name} maxLength={20} onChange={event => setName(event.target.value)} placeholder="e.g. Chef Miso" autoComplete="nickname" />
          {selectedShop && <><button className="button primary w-full" type="button" disabled={!online || pending} onClick={() => enter(true, false, undefined, selectedShop)}>{t("Create private room")}</button>
          <div className="divider"><span>{t("or join a friend")}</span></div></>}
          <label htmlFor="room-code">{t("Room code")}</label>
          <input id="room-code" value={code} maxLength={6} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC123" autoComplete="off" />
          <button className="button secondary w-full" type="button" disabled={!online || pending} onClick={() => enter(false)}>{t("Join room")}</button>
        </form>
        {error && <p className="error" role="alert">{t(error)}</p>}
      </div>
    </main>}

    {room?.phase === 'lobby' && <main className="shell inner">
      <div className="room-heading"><div><span className="eyebrow">{t("PRIVATE ROOM")}</span><h1>{room.shop ? SHOPS[room.shop].name : t("Kitchen lobby")}</h1></div><Status online={online} /></div>
      <div className="lobby-grid">
        <section className="panel">
          <div className="flex items-center justify-between gap-3"><h2>{t("Chef crew")}</h2><span className="pill">{room.players.length} / 4 chefs</span></div>
          <div className="crew">
            {room.players.map(player => <PlayerRow key={player.id} player={player} host={player.id === room.host} me={player.id === me} />)}
            {Array.from({ length: 4 - room.players.length }, (_, index) => <div className="empty-slot" key={index}>{t("Waiting for a chef")}</div>)}
          </div>
          <h3>{t("Choose an apron")}</h3>
          <div className="apron-grid">
            {APRONS.map((apron, color) => <button key={apron} className={'apron-choice ' + (chef?.color === color ? 'selected' : '')} disabled={!online || room.players.some(player => player.id !== me && player.color === color)} aria-pressed={chef?.color === color} onClick={() => lobby('color', color)}><Apron color={color} />{apron}</button>)}
          </div>
        </section>
        <section className="panel">
          <h2>{t("Invite friends")}</h2>
          <p>{t("Share this code with your crew.")}</p>
          <div className="room-code">{room.code}</div>
          <div className="flex flex-wrap gap-2">
            <button className="button secondary compact" onClick={() => void share(false)}>{copied === 'code' ? t('Copied!') : t('Copy code')}</button>
            <button className="button secondary compact" onClick={() => void share(true)}>{copied === 'link' ? t('Copied!') : t('Copy invite link')}</button>
          </div>
          {!room.shop && <><label htmlFor="difficulty">{t("Difficulty")}</label>
          <select id="difficulty" disabled={!host || !online} value={room.difficulty} onChange={event => lobby('difficulty', event.target.value)}>
            {Object.keys(DIFFICULTIES).map(level => <option key={level} value={level}>{t(level)}</option>)}
          </select>
          <p>{difficultyText[room.difficulty]}</p></>}
          <div className="lobby-actions">
            <button className={'button ' + (chef?.ready ? 'secondary' : 'primary')} disabled={!online} onClick={() => lobby('ready')}>{t(chef?.ready ? 'Mark not ready' : 'I’m ready')}</button>
            {host && <button className="button primary" disabled={!online || !canStart} onClick={() => lobby('start')}>{t("Start game")}</button>}
          </div>
          <p className="room-hint">{canStart ? (host ? t('Ready to start.') : t('Waiting for the host to start.')) : 'All chefs must be connected and ready. You can also start on your own.'}</p>
          {error && <p className="error" role="alert">{t(error)}</p>}
        </section>
      </div>
      <button className="back leave" onClick={leave}>{t("Back to main page")}</button>
    </main>}

    {room?.phase === 'briefing' && <ServiceBriefing online={online} chef={chef} room={room} onReady={() => lobby('briefed')} onLeave={leave} error={error} />}

    {room?.phase === 'playing' && room.game && <main className="match">
      <aside className="order-rail" aria-labelledby="order-rail-title">
        <div className="order-rail-heading">
          {room.shop && <span className="shop-service-name">{SHOPS[room.shop].name}</span>}
          {!room.training && <div className="service-score">{t("Score")} <strong>{room.game.score}</strong></div>}
          <h1 id="order-rail-title">{t(room.training ? 'Training order' : 'Customer orders')}</h1>
          {room.training ? <span className="practice-mode">{t("Untimed practice")}</span> : <div className={'round-clock' + (roundLeft <= 20000 ? ' clock-urgent' : '')}>
            <span>{t("Round left")}</span><strong role="timer">{formatTime(roundLeft)}</strong>
            <progress value={roundLeft} max={room.game.duration} aria-label="Round time remaining" />
          </div>}
        </div>
        <div className="tickets" tabIndex={0} aria-label="Order tickets">
        {room.game.orders.length === 0 && <div className="empty-slot">{t("Waiting for the next order…")}</div>}
        {room.game.orders.map(order => {
          const recipe = recipeFor(room.difficulty, order.recipe)
          const remaining = order.expiresAt - room.now
          return <article className={'ticket ' + (remaining <= 15000 ? 'ticket-urgent' : '')} key={order.id}>
            <div className="receipt-header"><span>ROJAK-ROJAK</span><span>ORDER #{String(order.id).padStart(3, '0')}</span></div>
            <div className="ticket-heading"><strong>1 × {recipe.name}</strong></div>
            <RecipeIngredients ingredients={recipe.ingredients} />
            <div className="recipe-method">{t(recipe.method)}</div>
            {recipe.vessel === 'cup' && <div>{t('Serve in a cup')}</div>}
            {!room.training && <div className="receipt-time"><span>{t("TIME LEFT")}</span><span className="ticket-clock" role="timer">{formatTime(remaining)}</span></div>}
            {!room.training && <progress value={Math.max(0, remaining)} max={room.game!.orderLife} aria-label={recipe.name + ' time remaining'} />}
          </article>
        })}
        </div>
        {room.training && <ol className="practice-steps">
          <li>{t('Collect the listed ingredients. Chop marked ingredients at a board and fry ikan bilis when listed.')}</li>
          <li>Load the recipe station with <kbd>E</kbd> and press <kbd>Space</kbd> to prepare the dish.</li>
          <li>{t('Use a clean plate to collect the finished dish before it burns, then bring it to Serve.')}</li>
        </ol>}
      </aside>
      <section className="play-kitchen" aria-label="Kitchen">
      <div className="match-under"><span role="status">{!online ? t('Connection lost. Reconnecting…') : t(notice || guidance(room, chef))}</span><span>{t("Clean plates")} <b>{room.game.clean}</b> · {t('Returned')} <b>{room.game.dirty}</b>
        {room.game.stations.cups && <> · {t('Clean cups')} <b>{room.game.cleanCups}</b> · {t('Cup returns')} <b>{room.game.dirtyCups}</b></>}
      </span></div>
      <div className="control-strip"><span><kbd>WASD</kbd> / {t('Arrow keys')} · {t('Move')}</span><span><kbd>E</kbd> · {t('Pick up, drop, serve')}</span><span><kbd>Space</kbd> · {t('Work at a station')}</span><button className="back ml-auto" onClick={() => { if (window.confirm(t('Leave the match and return to the main page?'))) leave() }}>{t("Back to main page")}</button></div>
      <div className="match-board"><Suspense fallback={<CanvasFallback />}><GameCanvas room={room} me={me} onMove={(x, y) => { if (socket.connected) socket.volatile.emit('move', { x, y }) }} onAct={action => {
        if (!socket.connected || settings) return
        socket.emit('act', action)
        ping(sound, [380])
      }} /></Suspense></div>
      </section>
    </main>}

    {room?.phase === 'results' && room.game && <main className="shell inner">
      <section className="panel results">
        <span className="step-icon">🏆</span>
        <span className="eyebrow">{room.training ? 'PRACTICE' : room.difficulty.toUpperCase() + ' SERVICE'}</span>
        <h1>{t(room.training ? 'Training complete!' : 'Service complete!')}</h1>
        <p>{room.training ? 'You served ' + RECIPES[room.training].name + '.' : <>{room.game.solo ? 'You' : 'Your crew'} earned <strong>{room.game.score} points</strong>.</>}</p>
        <div className="result-stats">
          <div><strong>{room.game.served}</strong><span>{t("Served")}</span></div>
          <div><strong>{room.game.missed}</strong><span>{t("Expired")}</span></div>
          <div><strong>{room.game.bestStreak}</strong><span>{t("Best streak")}</span></div>
        </div>
        <div className="result-chefs">{room.players.map(player => <div className="player-row" key={player.id}><Apron color={player.color} /><strong className="player-name">{player.name}</strong><span>{player.served} served</span></div>)}</div>
        <div className="lobby-actions">
          {host ? <button className="button primary" disabled={!online} onClick={() => lobby('rematch')}>{t("Play again")}</button> : <span>{t('Waiting for the host to start a rematch.')}</span>}
          <button className="button secondary" onClick={leave}>{t("Back to main page")}</button>
        </div>
        {error && <p className="error" role="alert">{t(error)}</p>}
      </section>
    </main>}

    {phase !== 'playing' && (room || page !== 'home') && <footer className="site-footer"><div className="shell"><span>Rojak-rojak</span><span>Solo or with up to 4 chefs.</span></div></footer>}
    {settings && <Dialog title={t('Settings')} close={() => setSettings(false)}><div className="setting-row"><div><strong>{t('Sound effects')}</strong><p>{t('Play cues for actions and successful orders.')}</p></div><button className="button secondary compact" aria-pressed={sound} onClick={toggleSound}>{t(sound ? 'On' : 'Off')}</button></div>
      <LanguagePicker value={language} change={value => {
        selectLanguage(value)
        if (profile) void accountRequest<Profile>('me', 'PATCH', { ...profile, language: value }).then(setProfile).catch(() => {})
      }} />
    </Dialog>}
    {shopMenu && !room && <Dialog title={SHOPS[shopMenu].name} close={() => setShopMenu(undefined)}>
      <ul className="shop-menu">{SHOPS[shopMenu].pool.map(id => <li key={id}>
        <strong>{RECIPES[id].name}</strong><span>{t(RECIPES[id].method)}</span>
      </li>)}</ul>
      {error && <p className="error" role="alert">{t(error)}</p>}
      <div className="account-actions">
        <button className="button primary" disabled={pending} onClick={() => startSolo(undefined, shopMenu)}>{t('Play Solo')}</button>
        <button className="button secondary" disabled={pending} onClick={() => openLobby(shopMenu)}>{t('Play Team')}</button>
        {shopMenu === 'hawker' && <button className="button secondary" disabled={pending} onClick={() => {
          setError('')
          setShopMenu(undefined)
          setTrainingMenu(true)
        }}>{t('Training')}</button>}
      </div>
    </Dialog>}
    {trainingMenu && !room && <Dialog title={t('Training')} close={() => setTrainingMenu(false)}>
      <div className="account-actions">{TRAINING_RECIPES.map(id =>
        <button className="button secondary compact" key={id} disabled={pending} onClick={() => startSolo(id)}>{RECIPES[id].name}</button>)}
      </div>
      {error && <p className="error" role="alert">{t(error)}</p>}
    </Dialog>}
  </div>
}

function Status({ online }: { online: boolean }) {
  return <span className={'pill status ' + (online ? 'good' : '')}><span />{t(online ? 'Connected' : 'Connecting…')}</span>
}

const difficultyText: Record<Difficulty, string> = {
  Easy: 'Rice & dessert. Make nasi lemak with fried ikan bilis and ais kacang with two ingredients. Sauces are provided.',
  Normal: 'Hot favourites. Make nasi lemak, char kway teow, and chicken satay.',
  Hard: 'Full hawker menu. Make all five dishes across all four cooking stations.'
}
