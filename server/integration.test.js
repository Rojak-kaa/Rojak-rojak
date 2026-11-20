import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { io as connect } from 'socket.io-client'
import { createKitchenServer } from './index.js'
import { AYU_OUTFIT, BASE_OUTFIT, CHEFS, ECO_OUTFIT, KAVITHA_OUTFIT, LI_WEN_OUTFIT } from '../shared/profile.mjs'
import { interact, startMatch, tickMatch } from './kitchen.js'
import { DIFFICULTIES, HEIGHT, INGREDIENTS, METHODS, recipeFor, serviceStars, SHOPS, SPAWNS, stationsFor, TRAINING_RECIPES, WIDTH } from '../shared/kitchen.mjs'

const { http, io } = createKitchenServer({ database: ':memory:' })
const sockets = []
after(async () => {
  for (const socket of sockets) socket.disconnect()
  await io.close()
})

function waitFor(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('room', receive)
      reject(new Error('Expected room update was not received'))
    }, 4000)
    function receive(snapshot) {
      if (!predicate(snapshot)) return
      clearTimeout(timer)
      socket.off('room', receive)
      resolve(snapshot)
    }
    socket.on('room', receive)
  })
}

test('real Socket.IO clients enforce room rules and synchronize movement, actions and reconnects', { timeout: 12000 }, async () => {
  http.listen(0, '127.0.0.1')
  await once(http, 'listening')
  const address = 'http://127.0.0.1:' + http.address().port
  async function open(cookie) {
    const socket = connect(address, { forceNew: true, transports: ['websocket'], reconnection: false, extraHeaders: cookie ? { cookie } : {} })
    sockets.push(socket)
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('connect_error', reject)
    })
    return socket
  }
  const guest = await open()
  const send = (socket, event, data) => socket.timeout(1500).emitWithAck(event, data)
  assert.match((await send(guest, 'enter', { name: 'Guest', create: true })).error, /Sign in/)
  const cookies = await Promise.all(Array.from({ length: 5 }, (_, index) => register(address, 'chef_' + index)))
  const outfit = { ...LI_WEN_OUTFIT, accessory: 'chef', expression: 'wink', handSign: 'wave' }
  const updated = await fetch(address + '/api/account/me', {
    method: 'PATCH', headers: { cookie: cookies[0], 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pip', language: 'ta', outfit: { ...outfit, garment: 'cheongsam', fabric: 2, trim: 8, hairStyle: 'bob', skinTone: 5 } })
  })
  assert.equal(updated.status, 200)
  assert.deepEqual((await updated.json()).outfit, outfit)
  const custom = { ...BASE_OUTFIT, garment: 'kurta', accessory: 'flower', fabric: 3, trim: 1, expression: 'happy', handSign: 'okay', skinTone: 3 }
  const customSaved = await fetch(address + '/api/account/me', {
    method: 'PATCH', headers: { cookie: cookies[1], 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bean', language: 'en', outfit: custom })
  })
  assert.equal(customSaved.status, 200)
  assert.deepEqual((await customSaved.json()).outfit, custom)
  const [a, b, c, d, outsider] = await Promise.all(cookies.map(open))
  const command = (socket, type, value) => send(socket, 'lobby', { type, value })
  const host = await send(a, 'enter', { name: 'Pip', create: true })
  assert.deepEqual(host.room.players[0].outfit, outfit)
  const code = host.room.code
  assert.match(code, /^[A-Z0-9]{6}$/)
  const extraRoom = await send(outsider, 'enter', { name: 'Miso', create: true })
  assert.notEqual(extraRoom.room.code, code)
  await outsider.timeout(1500).emitWithAck('leave')
  assert.match((await send(b, 'enter', { name: 'Bean', code: 'INVALID' })).error, /not found/)
  const member = await send(b, 'enter', { name: 'Bean', code: code.toLowerCase() })
  assert.deepEqual(member.room.players.find(player => player.name === 'Bean').outfit, custom)
  await send(c, 'enter', { name: 'Sunny', code })
  await send(d, 'enter', { name: 'Basil', code })
  assert.match((await send(outsider, 'enter', { name: 'Guest', code })).error, /full/)
  assert.match((await command(b, 'difficulty', 'Hard')).error, /host/)
  assert.match((await command(b, 'start')).error, /host/)
  assert.match((await command(a, 'start')).error, /ready/)
  assert.match((await command(b, 'color', 0)).error, /unavailable/)
  await d.timeout(1500).emitWithAck('leave')
  await command(a, 'difficulty', 'Normal')
  await Promise.all([a, b, c].map(socket => command(socket, 'ready')))
  const briefing = waitFor(c, state => state.phase === 'briefing')
  assert.equal((await command(a, 'start')).ok, true)
  assert.equal((await briefing).game, null)
  assert.match((await send(outsider, 'enter', { name: 'Guest', code })).error, /started/)
  const waiting = waitFor(c, state => state.phase === 'briefing' && state.players.filter(player => player.ready).length === 2)
  await Promise.all([a, b].map(socket => command(socket, 'briefed')))
  assert.equal((await waiting).game, null)
  const playing = waitFor(c, state => state.phase === 'playing')
  assert.equal((await command(c, 'briefed')).ok, true)
  assert.equal((await playing).game.orders[0].recipe, 'nasiLemak')
  assert.match((await send(outsider, 'enter', { name: 'Guest', code })).error, /started/)

  const acquired = waitFor(b, state => state.players.find(player => player.id === host.id)?.item?.name === 'sambal')
  a.emit('act', 'use')
  await acquired
  const moved = waitFor(c, state => state.players.find(player => player.id === host.id)?.y > 2.96)
  a.emit('move', { x: 0, y: 1 })
  await moved
  a.emit('move', { x: 0, y: 0 })
  const transferred = waitFor(c, state => state.host === member.id && state.players.some(player => player.id === host.id && !player.connected))
  a.disconnect()
  await transferred
  const returning = await open(cookies[0])
  const resumed = await send(returning, 'resume', host.token)
  assert.equal(resumed.id, host.id)
  assert.equal(resumed.room.host, member.id)
  assert.equal(resumed.room.players.find(player => player.id === host.id).item.name, 'sambal')

  const solo = await send(outsider, 'enter', { name: 'Solo Chef', solo: true })
  assert.equal(solo.room.phase, 'briefing')
  assert.equal(solo.room.players.length, 1)
  assert.equal(solo.room.game, null)
  const soloStarted = waitFor(outsider, state => state.phase === 'playing')
  assert.equal((await command(outsider, 'briefed')).ok, true)
  const soloGame = (await soloStarted).game
  assert.equal(soloGame.solo, true)
  assert.equal(soloGame.orders.length, 1)
  assert.equal(Object.keys(soloGame.stations).filter(id => Object.hasOwn(INGREDIENTS, id)).length, 5)
  assert.equal(soloGame.stations.sambal, undefined)
  assert.ok(soloGame.orderLife > DIFFICULTIES.Easy.orderLife)
  assert.match((await send(d, 'enter', { name: 'Guest', code: solo.room.code })).error, /started/)
  await outsider.timeout(1500).emitWithAck('leave')

  const lesson = await send(outsider, 'enter', { name: 'Solo Chef', training: 'laksa' })
  assert.equal(lesson.room.training, 'laksa')
  assert.equal(lesson.room.phase, 'briefing')
  const lessonStarted = waitFor(outsider, state => state.phase === 'playing')
  assert.equal((await command(outsider, 'briefed')).ok, true)
  assert.deepEqual((await lessonStarted).game.orders.map(order => order.recipe), ['laksa'])
  await outsider.timeout(1500).emitWithAck('leave')

  const pair = await send(d, 'enter', { name: 'Basil', create: true, shop: 'kopitiam' })
  const guestAtShop = await send(outsider, 'enter', { name: 'Guest', code: pair.room.code, shop: 'mamak' })
  assert.equal(guestAtShop.room.shop, 'kopitiam')
  await Promise.all([d, outsider].map(socket => command(socket, 'ready')))
  const pairBriefing = waitFor(outsider, state => state.phase === 'briefing')
  assert.equal((await command(d, 'start')).ok, true)
  await pairBriefing
  const pairStarted = waitFor(outsider, state => state.phase === 'playing')
  await Promise.all([d, outsider].map(socket => command(socket, 'briefed')))
  const pairMatch = await pairStarted
  assert.equal(pairMatch.game.solo, false)
  assert.equal(pairMatch.game.orders[0].recipe, 'kayaToast')
})

async function register(address, username) {
  const response = await fetch(address + '/api/account/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name: 'Chef', password: 'testing-123', language: 'en' })
  })
  assert.equal(response.status, 200)
  return response.headers.get('set-cookie').split(';')[0]
}

test('sign-in, language and outfit survive a server restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rojak-accounts-'))
  const database = join(directory, 'accounts.sqlite')
  let instance
  try {
    async function boot() {
      instance = createKitchenServer({ database })
      instance.http.listen(0, '127.0.0.1')
      await once(instance.http, 'listening')
      return 'http://127.0.0.1:' + instance.http.address().port
    }
    const first = await boot()
    const cookie = await register(first, 'chef_persist')
    const initial = await fetch(first + '/api/account/me', { headers: { cookie } }).then(response => response.json())
    assert.equal(initial.outfitConfigured, false)
    assert.deepEqual(initial.outfit, AYU_OUTFIT)
    const ayu = { ...AYU_OUTFIT, accessory: 'songkok', expression: 'happy', handSign: 'wave', fabric: 2 }
    const locked = await fetch(first + '/api/account/me', {
      method: 'PATCH', headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mei', language: 'zh', outfit: { ...ayu, garment: 'saree', hairStyle: 'bun', trim: 3 } })
    })
    assert.equal(locked.status, 200)
    assert.deepEqual((await locked.json()).outfit, ayu)
    const kavitha = { ...KAVITHA_OUTFIT, accessory: 'flower', expression: 'wink', handSign: 'wave' }
    const kavithaSaved = await fetch(first + '/api/account/me', {
      method: 'PATCH', headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mei', language: 'zh', outfit: { ...kavitha, garment: 'saree', fabric: 2, trim: 4, hairStyle: 'bun' } })
    })
    assert.equal(kavithaSaved.status, 200)
    assert.deepEqual((await kavithaSaved.json()).outfit, kavitha)
    const profile = { name: 'Mei', language: 'zh', outfit: { ...ECO_OUTFIT, accessory: 'songkok', fabric: 2, expression: 'happy', handSign: 'okay', skinTone: 4 } }
    assert.equal(CHEFS[profile.outfit.chef].name, '全村最环保的人')
    const updated = await fetch(first + '/api/account/me', {
      method: 'PATCH', headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, outfit: { ...profile.outfit, garment: 'cheongsam', trim: 4, hairStyle: 'bun' } })
    })
    assert.equal(updated.status, 200)
    await instance.io.close()
    const second = await boot()
    const response = await fetch(second + '/api/account/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'chef_persist', password: 'testing-123' })
    })
    const restored = await response.json()
    assert.equal(response.status, 200)
    assert.equal(restored.name, profile.name)
    assert.equal(restored.language, profile.language)
    assert.equal(restored.outfitConfigured, true)
    assert.deepEqual(restored.outfit, profile.outfit)
    assert.equal(restored.password, undefined)
  } finally {
    if (instance?.http.listening) await instance.io.close()
    rmSync(directory, { recursive: true, force: true })
  }
})

function stationPaths(stations) {
  const blocked = new Set(stations.map(({ x, y }) => y * WIDTH + x))
  const positions = SPAWNS.map(([x, y]) => [Math.floor(x), Math.floor(y)])
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const seen = new Set(positions.map(([x, y]) => y * WIDTH + x))
  for (const [x, y] of positions) {
    for (const [dx, dy] of steps) {
      const nx = x + dx
      const ny = y + dy
      const key = ny * WIDTH + nx
      if (nx <= 0 || ny <= 0 || nx >= WIDTH - 1 || ny >= HEIGHT - 1 || blocked.has(key) || seen.has(key)) continue
      seen.add(key)
      positions.push([nx, ny])
    }
  }
  return Object.fromEntries(stations.map(({ id, x, y }) => {
    const access = steps.find(([dx, dy]) => seen.has((y + dy) * WIDTH + x + dx))
    assert.ok(access, id + ' must be reachable from a chef spawn')
    return [id, [x + access[0] * 0.8 + 0.5, y + access[1] * 0.8 + 0.5]]
  }))
}

for (const [difficulty, rules] of Object.entries(DIFFICULTIES)) {
  test(difficulty + ' dishes are playable with the stocked ingredients and reusable plates', () => {
    verifyMenu(difficulty, rules)
  })
}

for (const recipe of TRAINING_RECIPES) {
  test(recipe + ' training stays untimed and completes after one served order', () => {
    verifyMenu('Hard', { ...DIFFICULTIES.Hard, pool: [recipe] }, recipe)
  })
}

for (const [id, shop] of Object.entries(SHOPS)) {
  test(shop.name + ' tutorial serves one dish in the shop kitchen', () => {
    assert.ok(shop.pool.includes(shop.tutorial))
    assert.equal(stationsFor('Hard', shop.tutorial, id), stationsFor('Hard', null, id))
    verifyMenu('Hard', { ...DIFFICULTIES.Hard, pool: [shop.tutorial] }, shop.tutorial, id)
  })

  test(shop.name + ' stocks and serves its own menu', () => {
    const layout = stationsFor('Easy', null, id)
    assert.equal(new Set(layout.map(({ x, y }) => x + ',' + y)).size, layout.length)
    assert.equal(layout.find(station => station.id === 'potA').y, 7)
    for (const drink of shop.pool.map(key => recipeFor('Easy', key)).filter(recipe => recipe.vessel === 'cup')) {
      for (const ingredient of drink.ingredients) assert.equal(layout.find(station => station.id === ingredient).x, 1)
    }
    verifyMenu('Easy', { ...DIFFICULTIES.Easy, pool: shop.pool }, null, id)
    verifyMenu('Easy', { ...DIFFICULTIES.Easy, pool: shop.pool }, null, id, 'potB')
  })
}

function verifyMenu(difficulty, rules, training = null, shop = null, stove = 'potA') {
  const stations = stationsFor(difficulty, training, shop)
  const paths = stationPaths(stations)
  const chefs = (training ? [0] : [0, 1, 2]).map(color => ({ color, socketId: String(color) }))
  const room = { difficulty, training, shop, players: new Map(chefs.map(chef => [chef.color, chef])) }
  let now = 1000
  startMatch(room, now)
  const { game } = room
  function act(chef, station, work = false) {
    now += 200
    const [x, y] = paths[station]
    Object.assign(chef, { x, y })
    return interact(room, chef, work, now)
  }
  const use = (chef, station, work) => assert.equal(act(chef, station, work), '', station)
  function advance(ms) {
    now += ms
    tickMatch(room, now, 0)
  }
  if (training) {
    advance(game.duration + game.orderLife)
    assert.equal(room.phase, 'playing')
    assert.equal(game.orders.length, 1)
  }
  for (const key of rules.pool) {
    const recipe = recipeFor(difficulty, key)
    if (!game.orders.some(order => order.recipe === key)) advance(game.nextOrder - now)
    assert.ok(game.orders.some(order => order.recipe === key), recipe.name + ' ticket should arrive')
    const station = recipe.station === 'pot' ? stove : stations.find(({ kind }) => kind === recipe.station).id
    for (const [i, ingredient] of recipe.ingredients.entries()) {
      const chef = chefs[i % chefs.length]
      use(chef, ingredient === 'roastedChicken' ? 'chicken' : ingredient)
      if (ingredient === 'roastedChicken') {
        assert.match(act(chef, station), /Roast the raw chicken/)
        use(chef, 'oven')
        use(chef, 'oven', true)
        advance(4600)
        use(chef, 'oven')
        assert.deepEqual(chef.item, { kind: 'roasted', name: 'roastedChicken' })
      }
      if (INGREDIENTS[ingredient].chop) {
        assert.match(act(chef, station), /Chop/)
        use(chef, 'boardA')
        use(chef, 'boardA', true)
        advance(1500)
        use(chef, 'boardA')
      }
      if (ingredient === 'bilis') {
        assert.match(act(chef, station), /Fry/)
        use(chef, 'fryer')
        use(chef, 'fryer', true)
        advance(2600)
        use(chef, 'fryer')
        assert.equal(chef.item.kind, 'fried')
      }
      use(chef, station)
      assert.deepEqual(game.stations[station].ingredients, recipe.ingredients.slice(0, i + 1))
      if (i === 0 && recipe.ingredients.length > 1) {
        assert.match(act(chef, station, true), /remaining ingredients/)
        assert.equal(game.stations[station].status, 'loaded')
      }
    }
    use(chefs[0], station, true)
    assert.equal(game.stations[station].recipe, key)
    advance(Math.ceil(rules.cook * METHODS[recipe.station].scale))
    assert.equal(game.stations[station].status, 'cooked')
    assert.equal(Boolean(game.stations[station].until), METHODS[recipe.station].hot)
    const platingChef = chefs[1] ?? chefs[0]
    const drink = recipe.vessel === 'cup'
    if (drink) {
      use(platingChef, 'plates')
      assert.match(act(platingChef, station), /clean cup/)
      use(platingChef, 'plates')
    }
    use(platingChef, drink ? 'cups' : 'plates')
    use(platingChef, station)
    assert.equal(platingChef.item.name, key)
    use(platingChef, 'serve')
    if (training) {
      assert.equal(room.phase, 'results')
      assert.equal(game.served, 1)
      assert.equal(game.score, 1)
      return
    }
    assert.equal(game.dirtyCups, drink ? 1 : 0)
    use(chefs[2], drink ? 'cupReturn' : 'dirty')
    use(chefs[2], 'sink')
    use(chefs[2], 'sink', true)
    advance(2200)
    assert.equal(game.clean, rules.plates)
    assert.equal(game.dirty, 0)
    if (drink) assert.equal(game.cleanCups, rules.plates)
  }
  assert.equal(game.served, rules.pool.length)
  assert.equal(game.bestStreak, rules.pool.length)
  assert.equal(game.score, game.served)
  advance(game.nextOrder - now)
  const next = game.orders[0]
  advance(next.expiresAt - now)
  assert.ok(game.missed >= 1)
  assert.equal(game.streak, 0)
  tickMatch(room, game.endsAt, 0)
  assert.equal(room.phase, 'results')
}

test('a hot dish burns at its deadline even if a player acts before the next tick', () => {
  const now = 1000
  const room = { difficulty: 'Easy', players: new Map([['chef', { color: 0, socketId: 'chef' }]]) }
  startMatch(room, now)
  const player = room.players.get('chef')
  Object.assign(player, { x: 9.5, y: 2.4, item: { kind: 'plate' } })
  const pot = room.game.stations.potA
  const cookedAt = now + 1000
  Object.assign(pot, { status: 'cooking', until: cookedAt, recipe: 'nasiLemak' })
  tickMatch(room, cookedAt + 40, 0)
  const deadline = cookedAt + room.matchRules.burn
  assert.equal(pot.until, deadline)
  assert.match(interact(room, player, false, deadline), /clear the burned batch/)
  assert.equal(player.item.kind, 'plate')
  assert.equal(pot.status, 'burned')
  assert.equal(interact(room, player, true, deadline + 200), '')
  assert.equal(pot.status, 'empty')
})

test('quick two-ingredient orders expire sooner and closing counts missed orders for the score and stars', () => {
  const chef = { color: 0, socketId: 'chef' }
  const room = { difficulty: 'Easy', players: new Map([['a', chef], ['b', { color: 1, socketId: 'b' }]]) }
  startMatch(room, 1000)
  const { game } = room
  const [rice, ice] = game.orders
  assert.equal(rice.easy, false)
  assert.equal(ice.easy, true)
  assert.ok(ice.timeLimit < rice.timeLimit)
  Object.assign(chef, { x: 12.5, y: 4.5, item: { kind: 'dish', name: rice.recipe } })
  assert.equal(interact(room, chef, false, 2000), '')
  assert.equal(game.score, 1)
  assert.equal(serviceStars(game.served, game.missed), 6)
  tickMatch(room, game.endsAt, 0)
  assert.equal(game.missed, 1)
  assert.equal(game.score, 0)
  assert.equal(serviceStars(game.served, game.missed), 3)
  assert.equal(serviceStars(0, 0), 0)
  assert.equal(serviceStars(50, 1), 5)
  assert.equal(room.phase, 'results')
})

test('the use action drops items on open floor and picks them up even near a station', () => {
  const first = { color: 0, socketId: 'first' }
  const second = { color: 1, socketId: 'second' }
  const room = { difficulty: 'Easy', players: new Map([['first', first], ['second', second]]) }
  startMatch(room, 1000)
  Object.assign(first, { x: 9.5, y: 2.75, item: { kind: 'dish', name: 'nasiLemak' } })
  Object.assign(second, { x: 9.5, y: 2.75, item: { kind: 'cup' } })
  assert.equal(interact(room, first, false, 1200), '')
  assert.equal(first.item, null)
  assert.match(interact(room, second, false, 1200), /already an item/)
  assert.equal(second.item.kind, 'cup')
  assert.equal(interact(room, first, false, 1400), '')
  assert.equal(first.item.name, 'nasiLemak')
  assert.deepEqual(room.game.floorItems, {})
  assert.equal(interact(room, first, false, 1600), '')
  second.item = null
  second.y = 2.4
  assert.equal(interact(room, second, false, 1600), '')
  assert.deepEqual(second.item, { kind: 'dish', name: 'nasiLemak' })
  assert.deepEqual(room.game.floorItems, {})
})
