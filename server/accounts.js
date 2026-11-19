import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import express from 'express'
import { ACCESSORIES, CHEFS, DEFAULT_OUTFIT, GARMENTS, LANGUAGES, PALETTE } from '../shared/profile.mjs'

const derive = promisify(scrypt)
const COOKIE = 'rojak_account'
const SESSION_AGE = 30 * 24 * 60 * 60 * 1000
const digest = token => createHash('sha256').update(token).digest('hex')

export function createAccounts(path) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      salt TEXT NOT NULL, password TEXT NOT NULL, language TEXT NOT NULL DEFAULT 'en',
      outfit TEXT NOT NULL, served INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
  `)
  const userByName = db.prepare('SELECT * FROM users WHERE username = ?')
  const userById = db.prepare('SELECT * FROM users WHERE id = ?')
  const sessionUser = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires > ?')
  const publicProfile = ({ id, username, name, language, outfit, served }) => ({ id, username, name, language, outfit: { ...DEFAULT_OUTFIT, ...JSON.parse(outfit) }, served })
  const tokenFrom = headers => /(?:^|;\s*)rojak_account=([A-Za-z0-9_-]{43})(?:;|$)/.exec(headers.cookie ?? '')?.[1]
  function identify(headers) {
    const token = tokenFrom(headers)
    const user = token && sessionUser.get(digest(token), Date.now())
    return user ? publicProfile(user) : null
  }
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === '1', path: '/' }
  function issue(res, id) {
    const token = randomBytes(32).toString('base64url')
    db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now())
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), id, Date.now() + SESSION_AGE)
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_AGE })
    return res.json(publicProfile(userById.get(id)))
  }
  const router = express.Router()
  const attempts = new Map()
  const windowMs = 10 * 60 * 1000
  router.use(express.json({ limit: '4kb' }))
  router.post('/:action(register|login)', async (req, res, next) => {
    try {
      const now = Date.now()
      for (const [key, window] of attempts) if (now >= window.until) attempts.delete(key)
      const attempt = attempts.get(req.ip) ?? { count: 0, until: now + windowMs }
      attempts.set(req.ip, attempt)
      if (attempt.count++ >= 25) return res.status(429).json({ error: 'Too many attempts. Try again later.' })
      const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : ''
      const { password } = req.body ?? {}
      if (!/^[a-z0-9_-]{3,24}$/.test(username) || typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: 'Use 3–24 letters, numbers, underscores or hyphens and a password of 8–128 characters.' })
      }
      const existing = userByName.get(username)
      if (req.params.action === 'login') {
        const key = await derive(password, existing?.salt ?? 'rojak-invalid-account', 64)
        if (!existing || !timingSafeEqual(key, Buffer.from(existing.password, 'hex'))) return res.status(401).json({ error: 'Incorrect username or password.' })
        return issue(res, existing.id)
      }
      const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 20) : ''
      if (!name) return res.status(400).json({ error: 'Enter a chef nickname.' })
      const salt = randomBytes(16).toString('hex')
      const key = await derive(password, salt, 64)
      const id = randomUUID()
      const language = Object.hasOwn(LANGUAGES, req.body.language) ? req.body.language : 'en'
      const result = db.prepare('INSERT OR IGNORE INTO users (id, username, name, salt, password, language, outfit) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, username, name, salt, key.toString('hex'), language, JSON.stringify(DEFAULT_OUTFIT))
      if (!result.changes) return res.status(409).json({ error: 'That username is already taken.' })
      return issue(res, id)
    } catch (error) { next(error) }
  })
  router.get('/me', (req, res) => res.json(identify(req.headers)))
  router.patch('/me', (req, res) => {
    const user = identify(req.headers)
    if (!user) return res.status(401).json({ error: 'Sign in to continue.' })
    const { name, language, outfit } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim() || name.length > 20 || !Object.hasOwn(LANGUAGES, language) ||
      !outfit || !Object.hasOwn(CHEFS, outfit.chef) || !Object.hasOwn(GARMENTS, outfit.garment) || !Object.hasOwn(ACCESSORIES, outfit.accessory) ||
      ![outfit.fabric, outfit.trim].every(value => Number.isInteger(value) && PALETTE[value])) {
      return res.status(400).json({ error: 'Check your profile details.' })
    }
    const cleanOutfit = { chef: outfit.chef, garment: outfit.garment, accessory: outfit.accessory, fabric: outfit.fabric, trim: outfit.trim }
    db.prepare('UPDATE users SET name = ?, language = ?, outfit = ? WHERE id = ?').run(name.trim(), language, JSON.stringify(cleanOutfit), user.id)
    res.json(publicProfile(userById.get(user.id)))
  })
  router.post('/logout', (req, res) => {
    const token = tokenFrom(req.headers)
    if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(digest(token))
    res.clearCookie(COOKIE, cookieOptions).json({ ok: true })
  })
  return { router, identify, serve: id => db.prepare('UPDATE users SET served = served + 1 WHERE id = ?').run(id), close: () => db.close() }
}
