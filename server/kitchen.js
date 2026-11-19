import { DIFFICULTIES, HEIGHT, INGREDIENTS, METHODS, menuFor, nearestStation, recipeFor, RECIPES, SPAWNS, stationsFor, WIDTH } from '../shared/kitchen.mjs'

const CHOP_TIME = 1500
const WASH_TIME = 2200
const FRY_TIME = 2600
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
  room.matchRules = { ...rules, pool: menuFor(room.difficulty, room.training, room.shop) }
  room.stations = stationsFor(room.difficulty, room.training, room.shop)
  room.blocked = new Set(room.stations.map(({ x, y }) => y * WIDTH + x))
  room.recipes = room.matchRules.pool.map(id => [id, recipeFor(room.difficulty, id)])
  room.phase = 'playing'
  for (const player of room.players.values()) {
    const [x, y] = SPAWNS[player.color]
    Object.assign(player, { x, y, item: null, dx: 0, dy: 0, inputAt: 0, actionAt: 0, facing: 1, served: 0 })
  }
  room.game = {
    solo, duration: rules.duration, orderLife: rules.orderLife, endsAt: now + rules.duration, nextOrder: now + rules.interval, sequence: 0,
    score: 0, served: 0, missed: 0, streak: 0, bestStreak: 0, clean: rules.plates, dirty: 0,
    cleanCups: room.stations.some(station => station.kind === 'cups') ? rules.plates : 0, dirtyCups: 0,
    orders: [], floorItems: {}, stations: Object.fromEntries(room.stations.map(({ id }) => [id, { item: null, ingredients: [], status: 'empty', until: 0 }]))
  }
  addOrder(room, now)
  if (!solo) addOrder(room, now)
}

function ingredientKind(name) {
  if (name === 'bilis') return 'fried'
  return INGREDIENTS[name].chop ? 'chopped' : 'raw'
}

function advanceStation(room, state, now) {
  if (!state.until || now < state.until) return
  const finishedAt = state.until
  state.until = 0
  if (state.status === 'chopping') {
    state.item = { kind: 'chopped', name: state.item.name }
    state.status = 'ready'
  } else if (state.status === 'washing') {
    room.game[state.item?.kind === 'dirtyCup' ? 'cleanCups' : 'clean']++
    state.item = null
    state.status = 'empty'
  } else if (state.status === 'frying' || state.status === 'cooking') {
    const frying = state.status === 'frying'
    if (frying) state.item = { kind: 'fried', name: 'bilis' }
    const hot = frying || METHODS[RECIPES[state.recipe].station].hot
    const burnsAt = finishedAt + room.matchRules.burn
    state.status = hot && now >= burnsAt ? 'burned' : 'cooked'
    if (hot && state.status === 'cooked') state.until = burnsAt
  } else if (state.status === 'cooked') {
    state.status = 'burned'
  }
  if (state.status === 'burned') state.item = null
}

function addOrder(room, now) {
  const game = room.game
  const rules = room.matchRules
  const id = ++game.sequence
  game.orders.push({ id, recipe: rules.pool[(id - 1) % rules.pool.length], expiresAt: room.training ? Number.MAX_SAFE_INTEGER : now + rules.orderLife })
}

export function tickMatch(room, now, delta) {
  const game = room.game
  if (!room.training && now >= game.endsAt) {
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
  if (!room.training && now >= game.nextOrder) {
    if (game.orders.length < (game.solo ? 2 : 5)) addOrder(room, now)
    game.nextOrder = now + room.matchRules.interval
  }
  for (const state of Object.values(game.stations)) advanceStation(room, state, now)
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

function beginAction(player, now) {
  if (now - player.actionAt < 180) return false
  player.actionAt = now
  return true
}

export function dropOrPickUp(room, player, now) {
  const { floorItems, endsAt } = room.game
  if (!room.training && now >= endsAt) return 'Time is up.'
  if (!beginAction(player, now)) return ''
  const x = Math.floor(player.x)
  const y = Math.floor(player.y)
  const key = y * WIDTH + x
  if (player.item) {
    if (floorItems[key]) return 'There’s already an item here. Move to a clear tile.'
    floorItems[key] = { x, y, item: player.item }
    player.item = null
  } else {
    if (!floorItems[key]) return 'Stand on a dropped item and press Q to pick it up.'
    player.item = floorItems[key].item
    delete floorItems[key]
  }
  return ''
}

export function interact(room, player, start, now) {
  const game = room.game
  if (!room.training && now >= game.endsAt) return 'Time is up.'
  if (!beginAction(player, now)) return ''
  const station = nearestStation(player.x, player.y, room.stations)
  if (!station) return 'Move closer to a station.'
  const state = game.stations[station.id]
  advanceStation(room, state, now)
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
      return 'Use E to place an ingredient marked for chopping, then press Space.'
    case 'fryer':
      if (state.status === 'burned') {
        if (!start) return 'Press Space to clear the burned ikan bilis.'
        reset()
        return ''
      }
      if (state.status === 'frying') return 'Frying ikan bilis…'
      if (start && state.status === 'raw') {
        Object.assign(state, { status: 'frying', until: now + FRY_TIME })
        return ''
      }
      if (!start && !item && state.item) {
        const next = state.item
        reset()
        return take(next)
      }
      if (!start && item?.kind === 'raw' && item.name === 'bilis' && state.status === 'empty') {
        Object.assign(state, { item, status: 'raw' })
        return take(null)
      }
      return 'Load raw ikan bilis with E, press Space to fry, then collect it with E.'
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
      if (!start && state.status === 'cooked' && item?.kind === (RECIPES[state.recipe].vessel ?? 'plate')) {
        const recipe = state.recipe
        reset()
        return take({ kind: 'dish', name: recipe })
      }
      if (!start && !item && state.status === 'loaded') {
        const name = state.ingredients.pop()
        if (!state.ingredients.length) reset()
        return take({ name, kind: ingredientKind(name) })
      }
      if (!start && item?.name && INGREDIENTS[item.name] && ['raw', 'chopped', 'fried'].includes(item.kind) && ['empty', 'loaded'].includes(state.status)) {
        const needed = ingredientKind(item.name)
        if (item.kind !== needed) return needed === 'fried' ? 'Fry the ikan bilis first.' : 'Chop this ingredient first.'
        if (state.ingredients.includes(item.name)) return 'That ingredient is already in this batch.'
        const ingredients = [...state.ingredients, item.name]
        if (!recipes.some(([, recipe]) => ingredients.every(name => recipe.ingredients.includes(name)))) return 'This ingredient does not match the recipe at this station.'
        Object.assign(state, { ingredients, status: 'loaded' })
        return take(null)
      }
      if (state.status === 'burned') return 'Press Space to clear the burned batch.'
      if (state.status === 'cooked') return RECIPES[state.recipe].vessel === 'cup' ? 'Bring a clean cup and press E.' : 'Bring a clean plate and press E.'
      if (state.status === 'cooking') return method.busy + '…'
      return 'Add the ticket ingredients with E, then press Space to start.'
    }
    case 'plates':
    case 'cups': {
      const vessel = station.kind === 'cups' ? 'cup' : 'plate'
      const stock = vessel === 'cup' ? 'cleanCups' : 'clean'
      if (start) return 'Use E to take a clean ' + vessel + '.'
      if (item?.kind === vessel) {
        game[stock]++
        return take(null)
      }
      if (item) return 'Free your hands before taking clean dishware.'
      if (!game[stock]) return 'Wash a dirty ' + vessel + ' to restock.'
      game[stock]--
      return take({ kind: vessel })
    }
    case 'dirty':
    case 'cupReturn': {
      const cup = station.kind === 'cupReturn'
      const stock = cup ? 'dirtyCups' : 'dirty'
      if (!start && !item && game[stock]) {
        game[stock]--
        return take({ kind: cup ? 'dirtyCup' : 'dirty' })
      }
      return 'Use E with empty hands to pick up returned dishware.'
    }
    case 'sink':
      if (state.status === 'washing') return 'This sink is busy.'
      if (!start && ['dirty', 'dirtyCup'].includes(item?.kind) && !state.item) {
        Object.assign(state, { item, status: 'dirty' })
        return take(null)
      }
      if (start && state.status === 'dirty') {
        Object.assign(state, { status: 'washing', until: now + WASH_TIME })
        return ''
      }
      return 'Place dirty dishware with E, then wash with Space.'
    case 'serve': {
      if (start || item?.kind !== 'dish') return 'Bring a plated dish and serve with E.'
      const index = game.orders.findIndex(order => order.recipe === item.name && order.expiresAt > now)
      if (index < 0) return 'There is no open ticket for this dish.'
      const [order] = game.orders.splice(index, 1)
      game.streak++
      game.bestStreak = Math.max(game.bestStreak, game.streak)
      game.score += RECIPES[item.name].points + (room.training ? 0 : Math.floor((order.expiresAt - now) / 3000) + Math.min(game.streak - 1, 5) * 5)
      returnDishware(game, item)
      game.served++
      player.served++
      if (room.training) room.phase = 'results'
      return take(null)
    }
    case 'bin':
      if (start || !item) return 'Use E to discard a held item.'
      returnDishware(game, item)
      return take(null)
    default:
      return ''
  }
}

export function returnDishware(game, item) {
  if (item?.kind === 'plate') game.clean++
  if (item?.kind === 'cup') game.cleanCups++
  if (item?.kind === 'dirtyCup' || (item?.kind === 'dish' && RECIPES[item.name].vessel === 'cup')) game.dirtyCups++
  else if (item?.kind === 'dirty' || item?.kind === 'dish') game.dirty++
}
