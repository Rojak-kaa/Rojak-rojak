import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ACCESSORIES, BASE_OUTFIT, CHEFS, ECO_OUTFIT, EXPRESSIONS, FIXED_OUTFITS, GARMENTS, HAIRSTYLES, HAND_SIGNS, LANGUAGES, PALETTE } from '../shared/profile.mjs'
import type { Language, Outfit } from '../shared/profile.mjs'
import type { Profile } from './model'
import { t } from './i18n'
import { ecoPortrait, ECO_HEIGHT, ECO_WIDTH, tintEcoPortrait, usesEcoPortrait } from './ecoPortrait'

const clothingGroups = [
  ['Malay', 'bajuMelayu', 'bajuKurung'],
  ['Chinese', 'samfu', 'cheongsam'],
  ['Indian', 'kurta', 'saree'],
  ['Casual', 'striped']
]

export async function accountRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch('/api/account/' + path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  if (!response.ok) {
    const info = await response.json().catch(() => ({}))
    throw new Error(info.error ?? 'The kitchen server did not respond.')
  }
  return response.json()
}

export function LanguagePicker({ value, change }: { value: Language; change: (language: Language) => void }) {
  return <label>{t('Language')}<select value={value} onChange={event => change(event.target.value as Language)}>
    {Object.entries(LANGUAGES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
  </select></label>
}

export function SignIn({ language, onSignIn }: { language: Language; onSignIn: (profile: Profile) => void }) {
  const [register, setRegister] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    setPending(true)
    setError('')
    try {
      onSignIn(await accountRequest<Profile>(register ? 'register' : 'login', 'POST', { ...fields, language }))
    } catch (failure) {
      setError((failure as Error).message)
    } finally { setPending(false) }
  }
  return <form className="account-form" onSubmit={submit}>
    {register && <label>{t('Chef nickname')}<input required name="name" maxLength={20} autoComplete="nickname" /></label>}
    <label>{t('Username')}<input required name="username" minLength={3} maxLength={24} pattern={/^[A-Za-z0-9_\-]{3,24}$/.source} autoComplete="username" /></label>
    <label>{t('Password')}<input required type="password" name="password" minLength={8} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} /></label>
    {error && <p className="error" role="alert">{t(error)}</p>}
    <div className="account-actions">
      <button className="button primary" disabled={pending}>{t(register ? 'Create account' : 'Sign in')}</button>
      <button type="button" className="back" disabled={pending} onClick={() => { setRegister(!register); setError('') }}>{t(register ? 'Already have an account?' : 'New player?')}</button>
    </div>
  </form>
}

export function OutfitPreview({ outfit }: { outfit: Outfit }) {
  const fabric = PALETTE[outfit.fabric]
  const trim = PALETTE[outfit.trim]
  const background = outfit.garment === 'striped' ? `repeating-linear-gradient(${fabric} 0 5px, ${trim} 5px 9px)` : fabric
  return <span aria-hidden="true" className={'outfit-preview outfit-' + outfit.garment} style={{ background, borderColor: trim }} />
}

function EcoChefPreview({ outfit }: { outfit: Outfit }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const source = new Image()
    source.onload = () => {
      const context = canvas.current?.getContext('2d')
      if (!context) return
      context.clearRect(0, 0, ECO_WIDTH, ECO_HEIGHT)
      context.drawImage(tintEcoPortrait(source, outfit), 0, 0)
    }
    source.src = ecoPortrait
    return () => { source.onload = null }
  }, [outfit])
  return <canvas ref={canvas} width={ECO_WIDTH} height={ECO_HEIGHT} className="eco-chef-portrait" role="img" aria-label={CHEFS[outfit.chef].name} />
}

function ChefPreview({ outfit }: { outfit: Outfit }) {
  if (usesEcoPortrait(outfit)) return <EcoChefPreview outfit={outfit} />
  const chef = CHEFS[outfit.chef]
  return <div className={'chef-preview' + (outfit.chef === 'eco' ? ' chef-preview-eco' : '')} aria-hidden="true">
    <span className={'portrait-head portrait-' + outfit.accessory} style={{ backgroundColor: '#' + chef.skin.toString(16) }}>
      {outfit.chef === 'eco' && <><i className="portrait-braids" /><i className="portrait-clip">🦊</i></>}
      {outfit.accessory === 'sprout' && <i className="portrait-leaves" />}
    </span>
    <OutfitPreview outfit={outfit} />
    {outfit.garment === 'striped' && <span className="portrait-shorts" />}
  </div>
}

export function Wardrobe({ profile, onSave, onSignOut, onboarding }: { profile: Profile; onSave: (profile: Profile) => void; onSignOut: () => Promise<void>; onboarding: boolean }) {
  const [draft, setDraft] = useState(profile)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fixedClothing = FIXED_OUTFITS[draft.outfit.chef]
  const eco = draft.outfit.chef === ECO_OUTFIT.chef
  function outfit(part: keyof Outfit, value: string | number) {
    setDraft(previous => {
      if (part === 'chef') {
        const chef = String(value)
        return { ...previous, outfit: { ...(FIXED_OUTFITS[chef] ?? BASE_OUTFIT), chef } }
      }
      const next = { ...previous.outfit, [part]: value }
      if (part === 'garment' && value === 'cheongsam') Object.assign(next, { fabric: 0, trim: 8 })
      return { ...previous, outfit: next }
    })
    setSaved(false)
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const updated = await accountRequest<Profile>('me', 'PATCH', draft)
      onSave(updated)
      setDraft(updated)
      setSaved(true)
    } catch (failure) {
      setError((failure as Error).message)
    } finally { setPending(false) }
  }
  return <form className="account-form" onSubmit={submit}>
    <div className="profile-summary">
      <div><strong>{profile.name}</strong><p>@{profile.username}</p></div>
      {!onboarding && <p>{t('Dishes served')} <strong>{profile.served}</strong></p>}
    </div>
    <label>{t('Chef nickname')}<input required maxLength={20} value={draft.name} onChange={event => { setDraft({ ...draft, name: event.target.value }); setSaved(false) }} /></label>
    <LanguagePicker value={draft.language} change={language => { setDraft({ ...draft, language }); setSaved(false) }} />
    <label>{t('Chef character')}<select value={draft.outfit.chef} onChange={event => outfit('chef', event.target.value)}>
      {Object.entries(CHEFS).map(([id, chef]) => <option key={id} value={id}>{id === ECO_OUTFIT.chef ? chef.name : chef.name + ' · ' + t(chef.culture)}</option>)}
    </select></label>
    <div className="outfit-heading"><strong>{t('Clothing')}</strong><ChefPreview outfit={draft.outfit} /></div>
    {fixedClothing ? <p>{t(GARMENTS[fixedClothing.garment])} · {t(HAIRSTYLES[fixedClothing.hairStyle])}</p> :
    <select aria-label={t('Clothing')} value={draft.outfit.garment} onChange={event => outfit('garment', event.target.value)}>
      <option value="none">{t(GARMENTS.none)}</option>
      {clothingGroups.map(([culture, ...garments]) => <optgroup key={culture} label={t(culture)}>
        {garments.map(id => <option key={id} value={id}>{t(GARMENTS[id])}</option>)}
      </optgroup>)}
    </select>}
    {!fixedClothing && <label>{t('Hairstyle')}<select value={draft.outfit.hairStyle} onChange={event => outfit('hairStyle', event.target.value)}>
      {Object.entries(HAIRSTYLES).map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
    </select></label>}
    <label>{t('Headwear')}<select value={draft.outfit.accessory} onChange={event => outfit('accessory', event.target.value)}>
      {Object.entries(ACCESSORIES).map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
    </select></label>
    <label>{t('Facial expression')}<select value={draft.outfit.expression} onChange={event => outfit('expression', event.target.value)}>
      {Object.entries(EXPRESSIONS).filter(([id]) => !eco || id !== 'none').map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
    </select></label>
    <label>{t('Hand sign')}<select value={draft.outfit.handSign} onChange={event => outfit('handSign', event.target.value)}>
      {Object.entries(HAND_SIGNS).filter(([id]) => !eco || id !== 'relaxed').map(([id, label]) => <option key={id} value={id}>{t(label)}</option>)}
    </select></label>
    {([['fabric', 'Fabric colour'], ['trim', 'Trim colour']] as const).filter(([part]) => !fixedClothing || part === 'fabric').map(([part, label]) =>
      <fieldset className="palette" key={part}><legend>{t(label)}</legend>{PALETTE.map((color, index) =>
        <button type="button" className="swatch" style={{ background: color }} aria-label={t(label) + ' ' + (index + 1)}
          aria-pressed={draft.outfit[part] === index} onClick={() => outfit(part, index)} key={color} />)}</fieldset>)}
    {error && <p className="error" role="alert">{t(error)}</p>}
    {saved && <p role="status">{t('Profile saved')}</p>}
    <div className="account-actions">
      <button className="button primary" disabled={pending}>{t(onboarding ? 'Save and continue' : 'Save profile')}</button>
      <button type="button" className="back" disabled={pending} onClick={() => void onSignOut().catch(failure => setError(failure.message))}>{t('Sign out')}</button>
    </div>
  </form>
}
