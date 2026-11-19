import express from 'express'
import { createServer } from 'node:http'
import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Server } from 'socket.io'
import { COLORS, DIFFICULTIES, SHOPS, TRAINING_RECIPES } from '../shared/kitchen.mjs'
import { interact, returnDishware, startMatch, tickMatch } from './kitchen.js'
import { createAccounts } from './accounts.js'

const GRACE = 30000
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const respond = (ack, data) => { if (typeof ack === 'function') ack(data) }

export function createKitchenServer({ database = process.env.ROJAK_DB ?? './data/rojak.sqlite' } = {}) {
  const app = express()
  const http = createServer(app)
  const io = new Server(http, { maxHttpBufferSize: 4096 })
  const rooms = new Map()
  const sessions = new Map()
  const accounts = createAccounts(database)

  app.use('/api/account', accounts.router)
  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.use(express.static(DIST))

  function snapshot(room, now = Date.now()) {
    return {
      code: room.code, host: room.host, phase: room.phase, difficulty: room.difficulty, solo: room.solo, training: room.training, shop: room.shop, now,
      players: [...room.players.values()].map(({ id, name, color, outfit, ready, socketId, x, y, facing, item, served }) =>
        ({ id, name, color, outfit, ready, connected: Boolean(socketId), x, y, facing, item, served })),
      game: room.game
    }
  }

  const publish = room => io.to(room.code).emit('room', snapshot(room))

  function openBriefing(room) {
    room.phase = 'briefing'
    room.game = null
    for (const player of room.players.values()) player.ready = false
  }

  function startIfBriefed(room) {
    if (room.phase !== 'briefing') return
    const connected = [...room.players.values()].filter(player => player.socketId)
    if (connected.length && connected.every(player => player.ready)) startMatch(room, Date.now())
  }

  function chooseHost(room) {
    if (room.players.get(room.host)?.socketId) return
    const players = [...room.players.values()]
    room.host = players.find(player => player.socketId)?.id ?? players[0]?.id ?? null
  }

  function remove(room, player) {
    if (room.phase === 'playing') {
      returnDishware(room.game, player.item)
    }
    room.players.delete(player.id)
    sessions.delete(player.token)
    chooseHost(room)
    startIfBriefed(room)
    if (!room.players.size) rooms.delete(room.code)
    else publish(room)
  }

  io.on('connection', socket => {
    const membership = () => {
      const room = rooms.get(socket.data.room)
      const player = room?.players.get(socket.data.player)
      return player?.socketId === socket.id ? { room, player } : {}
    }

    function attach(room, player, ack) {
      player.socketId = socket.id
      player.graceUntil = 0
      Object.assign(socket.data, { room: room.code, player: player.id })
      socket.join(room.code)
      chooseHost(room)
      respond(ack, { ok: true, id: player.id, token: player.token, room: snapshot(room) })
      publish(room)
    }

    socket.on('enter', (data, ack) => {
      if (membership().room) return respond(ack, { error: 'Leave your current room first.' })
      const account = accounts.identify(socket.request.headers)
      if (!account) return respond(ack, { error: 'Sign in to continue.' })
      const name = typeof data?.name === 'string' ? data.name.trim().slice(0, 20) : ''
      if (!name) return respond(ack, { error: 'Enter a chef nickname.' })
      let room
      const training = typeof data.training === 'string' && TRAINING_RECIPES.includes(data.training) ? data.training : null
      if (data.training != null && !training) return respond(ack, { error: 'That training recipe is unavailable.' })
      const shop = typeof data.shop === 'string' && Object.hasOwn(SHOPS, data.shop) ? data.shop : null
      if (data.shop != null && !shop) return respond(ack, { error: 'That shop is unavailable.' })
      const solo = data.solo === true || Boolean(training)
      if (data.create === true || solo) {
        let code
        do { code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('') } while (rooms.has(code))
        room = { code, phase: 'lobby', players: new Map(), host: null, difficulty: training ? 'Hard' : 'Easy', solo, training, shop: training ? null : shop, game: null }
        rooms.set(code, room)
      } else {
        const code = typeof data.code === 'string' ? data.code.trim().toUpperCase() : ''
        room = rooms.get(code)
        if (!room) return respond(ack, { error: 'Room code not found.' })
        if (room.phase !== 'lobby') return respond(ack, { error: 'This room already started a match.' })
        if (room.players.size >= 4) return respond(ack, { error: 'This kitchen is full.' })
      }
      const taken = new Set([...room.players.values()].map(player => player.color))
      const player = {
        id: randomUUID(), token: randomBytes(24).toString('base64url'), name, ready: false, accountId: account.id, outfit: account.outfit,
        color: COLORS.findIndex((_color, index) => !taken.has(index))
      }
      room.players.set(player.id, player)
      sessions.set(player.token, { room, player })
      if (solo) openBriefing(room)
      attach(room, player, ack)
    })

    socket.on('resume', (token, ack) => {
      const entry = typeof token === 'string' && sessions.get(token)
      const account = accounts.identify(socket.request.headers)
      const current = membership()
      if (current.room || !entry || entry.player.accountId !== account?.id || entry.player.socketId || entry.player.graceUntil <= Date.now()) {
        return respond(ack, { error: 'Your previous session is unavailable.' })
      }
      attach(entry.room, entry.player, ack)
    })

    socket.on('lobby', (data, ack) => {
      const { room, player } = membership()
      if (!room) return respond(ack, { error: 'Join a room first.' })
      if (data?.type === 'rematch' && player.id === room.host && room.phase === 'results') {
        if (room.solo) {
          openBriefing(room)
        } else {
          room.phase = 'lobby'
          room.game = null
          for (const chef of room.players.values()) chef.ready = false
        }
        publish(room)
        return respond(ack, { ok: true })
      }
      if (data?.type === 'briefed' && room.phase === 'briefing') {
        player.ready = true
        startIfBriefed(room)
        publish(room)
        return respond(ack, { ok: true })
      }
      if (room.phase !== 'lobby') return respond(ack, { error: 'The kitchen is in service.' })
      switch (data?.type) {
        case 'ready':
          player.ready = !player.ready
          break
        case 'color':
          if (!Number.isInteger(data.value) || !COLORS[data.value] || [...room.players.values()].some(other => other !== player && other.color === data.value)) {
            return respond(ack, { error: 'That apron is unavailable.' })
          }
          player.color = data.value
          break
        case 'difficulty':
          if (player.id !== room.host || !Object.hasOwn(DIFFICULTIES, data.value)) return respond(ack, { error: 'Only the host can choose the difficulty.' })
          room.difficulty = data.value
          break
        case 'start':
          if (player.id !== room.host) return respond(ack, { error: 'Only the host can start.' })
          if (![...room.players.values()].every(chef => chef.ready && chef.socketId)) {
            return respond(ack, { error: 'Every chef must be connected and ready.' })
          }
          openBriefing(room)
          break
        default:
          return respond(ack, { error: 'Unknown lobby action.' })
      }
      publish(room)
      respond(ack, { ok: true })
    })

    socket.on('move', data => {
      const { room, player } = membership()
      if (room?.phase !== 'playing') return
      if (![-1, 0, 1].includes(data?.x) || ![-1, 0, 1].includes(data?.y)) return
      Object.assign(player, { dx: data.x, dy: data.y, inputAt: Date.now() })
    })

    socket.on('act', action => {
      const { room, player } = membership()
      if (room?.phase !== 'playing' || !['use', 'work'].includes(action)) return
      const servedBefore = player.served
      const notice = interact(room, player, action === 'work', Date.now())
      if (player.served > servedBefore) accounts.serve(player.accountId)
      if (notice) socket.emit('notice', notice)
      else publish(room)
    })

    socket.on('leave', ack => {
      const { room, player } = membership()
      if (room) {
        socket.leave(room.code)
        remove(room, player)
        socket.data = {}
      }
      respond(ack, { ok: true })
    })

    socket.on('disconnect', () => {
      const { room, player } = membership()
      if (!room) return
      Object.assign(player, { socketId: null, ready: false, graceUntil: Date.now() + GRACE })
      chooseHost(room)
      startIfBriefed(room)
      publish(room)
    })
  })

  let last = Date.now()
  const timer = setInterval(() => {
    const now = Date.now()
    const delta = Math.min((now - last) / 1000, 0.08)
    last = now
    for (const room of rooms.values()) {
      for (const player of room.players.values()) {
        if (!player.socketId && now >= player.graceUntil) remove(room, player)
      }
      if (room.players.size && room.phase === 'playing') {
        tickMatch(room, now, delta)
        publish(room)
      }
    }
  }, 50)
  timer.unref()
  http.on('close', () => {
    clearInterval(timer)
    accounts.close()
  })

  return { http, io }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { http } = createKitchenServer()
  http.listen(Number(process.env.PORT ?? 3001), '0.0.0.0', () => {
    console.log('Rojak-rojak listening on port', http.address().port)
  })
}
