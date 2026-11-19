import { DIFFICULTIES, HEIGHT, INGREDIENTS, METHODS, nearestStation, recipeFor, RECIPES, SPAWNS, stationsFor, WIDTH } from '../shared/kitchen.mjs'

const CHOP_TIME = 1500
const WASH_TIME = 2200
const SPEED = 3.75
const RADIUS = 0.22

function walkable(x, y, blocked) {
  for (const dx of [-RADIUS, RADIUS]) {
    for (const dy of [-RADIUS, RADIUS]) {
      const col = Math.floor(x + dx)
      const row = Math.floor(y + dy)
      if (col < 1 || row < 1 || col >= WIDTH - 1 || row >= HEIGHT - 1 || blocked.has(row * WIDTH + col)) return false
    }
  }
  return true
}

export function startMatch(room, now) {
  const solo = room.players.size === 1
  const difficulty = DIFFICULTIES[room.difficulty]
  const rules = solo ? {
    ...difficulty,
    duration: difficulty.duration + 30000,
    orderLife: difficulty.orderLife + 40000,
    interval: difficulty.interval + 16000,
    burn: difficulty.burn + 10000
  } : difficulty
  room.matchRules = rules
  room.stations = stationsFor(room.difficulty)
  room.blocked = new Set(room.stations.map(({ x, y }) => y * WIDTH + x))
  room.recipes = rules.pool.map(id => [id, recipeFor(room.difficulty, id)])
  room.phase = 'playing'
  for (const player of room.players.values()) {
    const [x, y] = SPAWNS[player.color]
    Object.assign(player, { x, y, item: null, dx: 0, dy: 0, inputAt: 0, actionAt: 0, facing: 1, served: 0 })
  }
  room.game = {
    solo, duration: rules.duration, orderLife: rules.orderLife, endsAt: now + rules.duration, nextOrder: now + rules.interval, sequence: 0,
    score: 0, served: 0, missed: 0, streak: 0, bestStreak: 0, clean: rules.plates, dirty: 0,
    orders: [], stations: Object.fromEntries(room.stations.map(({ id }) => [id, { item: null, ingredients: [], status: 'empty', until: 0 }]))
  }
  addOrder(room, now)
  if (!solo) addOrder(room, now)
}

function addOrder(room, now) {
  const game = room.game
  const rules = room.matchRules
  const id = ++game.sequence
  game.orders.push({ id, recipe: rules.pool[(id - 1) % rules.pool.length], expiresAt: now + rules.orderLife })
}

export function tickMatch(room, now, delta) {
  const game = room.game
  if (now >= game.endsAt) {
    room.phase = 'results'
    return
  }
  const remaining = game.orders.filter(order => order.expiresAt > now)
  const missed = game.orders.length - remaining.length
  if (missed) {
    game.missed += missed
    game.streak = 0
    game.score = Math.max(0, game.score - missed * 20)
    game.orders = remaining
  }
  if (now >= game.nextOrder) {
    if (game.orders.length < (game.solo ? 2 : 5)) addOrder(room, now)
    game.nextOrder = now + room.matchRules.interval
  }
  for (const state of Object.values(game.stations)) {
    if (!state.until || now < state.until) continue
    state.until = 0
    if (state.status === 'chopping') {
      state.item = { kind: 'chopped', name: state.item.name }
      state.status = 'ready'
    } else if (state.status === 'washing') {
      game.clean++
      state.status = 'empty'
    } else if (state.status === 'cooking') {
      state.status = 'cooked'
      if (METHODS[RECIPES[state.recipe].station].hot) state.until = now + room.matchRules.burn
    } else if (state.status === 'cooked') {
      state.status = 'burned'
    }
  }
  for (const player of room.players.values()) {
    if (!player.socketId || now - player.inputAt > 350) continue
    const length = Math.hypot(player.dx, player.dy)
    if (!length) continue
    const dx = player.x + player.dx / length * SPEED * delta
    const dy = player.y + player.dy / length * SPEED * delta
    if (walkable(dx, player.y, room.blocked)) player.x = dx
    if (walkable(player.x, dy, room.blocked)) player.y = dy
    if (player.dx) player.facing = Math.sign(player.dx)
  }
}

export function interact(room, player, start, now) {
  const game = room.game
  if (now >= game.endsAt) return 'Time is up.'
  if (now - player.actionAt < 180) return ''
  player.actionAt = now
  const station = nearestStation(player.x, player.y, room.stations)
  if (!station) return 'Move closer to a station.'
  const state = game.stations[station.id]
  const item = player.item
  const reset = () => Object.assign(state, { item: null, recipe: null, ingredients: [], status: 'empty', until: 0 })
  const take = next => { player.item = next; return '' }

  switch (station.kind) {
    case 'crate':
      return !start && !item ? take({ kind: 'raw', name: station.id }) : 'Use E with empty hands to grab an ingredient.'
    case 'counter':
      if (start) return 'Use E to place or pick up items.'
      if (item && state.item) return 'This counter is occupied.'
      ;[player.item, state.item] = [state.item, item]
      return ''
    case 'board':
      if (start) {
        if (state.status !== 'raw') return 'Place a fresh ingredient first.'
        Object.assign(state, { status: 'chopping', until: now + CHOP_TIME })
        return ''
      }
      if (state.status === 'chopping') return 'Chopping…'
      if (!item && state.item) {
        const next = state.item
        reset()
        return take(next)
      }
      if (item?.kind === 'raw' && INGREDIENTS[item.name].chop && !state.item) {
        Object.assign(state, { item, status: 'raw' })
        return take(null)
      }
      return 'Use E to place cucumber, pineapple, or chicken, then press Space to chop.'
    case 'pot':
    case 'grill':
    case 'mix':
    case 'shave': {
      const method = METHODS[station.kind]
      const recipes = room.recipes.filter(([, recipe]) => recipe.station === station.kind)
      if (start && state.status === 'burned') {
        reset()
        return ''
      }
      if (start && state.status === 'loaded') {
        const complete = recipes.find(([, recipe]) => recipe.ingredients.length === state.ingredients.length && recipe.ingredients.every(name => state.ingredients.includes(name)))
        if (!complete) return 'Add the remaining ingredients from the order ticket.'
        Object.assign(state, { recipe: complete[0], status: 'cooking', until: now + Math.round(room.matchRules.cook * method.scale) })
        return ''
      }
      if (!start && state.status === 'cooked' && item?.kind === 'plate') {
        const recipe = state.recipe
        reset()
        return take({ kind: 'dish', name: recipe })
      }
      if (!start && !item && state.status === 'loaded') {
        const name = state.ingredients.pop()
        if (!state.ingredients.length) reset()
        return take({ name, kind: INGREDIENTS[name].chop ? 'chopped' : 'raw' })
      }
      if (!start && item?.name && INGREDIENTS[item.name] && ['raw', 'chopped'].includes(item.kind) && ['empty', 'loaded'].includes(state.status)) {
        if (INGREDIENTS[item.name].chop && item.kind !== 'chopped') return 'Chop this ingredient first.'
        if (state.ingredients.includes(item.name)) return 'That ingredient is already in this batch.'
        const ingredients = [...state.ingredients, item.name]
        if (!recipes.some(([, recipe]) => ingredients.every(name => recipe.ingredients.includes(name)))) return 'This ingredient does not match the recipe at this station.'
        Object.assign(state, { ingredients, status: 'loaded' })
        return take(null)
      }
      if (state.status === 'burned') return 'Press Space to clear the burned batch.'
      if (state.status === 'cooked') return 'Bring clean dishware and press E.'
      if (state.status === 'cooking') return method.busy + '…'
      return 'Add the ticket ingredients with E, then press Space to start.'
    }
    case 'plates':
      if (start) return 'Use E to take a clean plate.'
      if (item?.kind === 'plate') {
        game.clean++
        return take(null)
      }
      if (item) return 'Free your hands before taking a plate.'
      if (!game.clean) return 'Wash a dirty plate to restock.'
      game.clean--
      return take({ kind: 'plate' })
    case 'dirty':
      if (!start && !item && game.dirty) {
        game.dirty--
        return take({ kind: 'dirty' })
      }
      return 'Use E with empty hands to pick up a returned plate.'
    case 'sink':
      if (state.status === 'washing') return 'This sink is busy.'
      if (!start && item?.kind === 'dirty' && !state.item) {
        Object.assign(state, { item, status: 'dirty' })
        return take(null)
      }
      if (start && state.status === 'dirty') {
        Object.assign(state, { item: null, status: 'washing', until: now + WASH_TIME })
        return ''
      }
      return 'Place a dirty plate with E, then wash with Space.'
    case 'serve': {
      if (start || item?.kind !== 'dish') return 'Bring a plated dish and serve with E.'
      const index = game.orders.findIndex(order => order.recipe === item.name && order.expiresAt > now)
      if (index < 0) return 'There is no open ticket for this dish.'
      const [order] = game.orders.splice(index, 1)
      game.streak++
      game.bestStreak = Math.max(game.bestStreak, game.streak)
      game.score += RECIPES[item.name].points + Math.floor((order.expiresAt - now) / 3000) + Math.min(game.streak - 1, 5) * 5
      game.dirty++
      game.served++
      player.served++
      return take(null)
    }
    case 'bin':
      if (start || !item) return 'Use E to discard a held item.'
      if (item.kind === 'plate') game.clean++
      if (item.kind === 'dirty' || item.kind === 'dish') game.dirty++
      return take(null)
    default:
      return ''
  }
}
