export const WIDTH = 15
export const HEIGHT = 9
export const COLORS = ['#f36a47', '#3d9d89', '#8266c4', '#eca73d']
export const SPAWNS = [[3.5, 2.5], [6.5, 2.5], [9.5, 2.5], [11.5, 2.5]]
export const STATIONS = [
  ['rice', 'crate', 2, 1], ['sambal', 'crate', 3, 1], ['cucumber', 'crate', 4, 1],
  ['pineapple', 'crate', 5, 1], ['dressing', 'crate', 6, 1],
  ['boardA', 'board', 7, 1], ['boardB', 'board', 8, 1],
  ['potA', 'pot', 9, 1], ['potB', 'pot', 10, 1], ['grill', 'grill', 11, 1],
  ['noodles', 'crate', 8, 3], ['prawn', 'crate', 9, 3], ['sprouts', 'crate', 10, 3],
  ['broth', 'crate', 7, 3],
  ['chicken', 'crate', 12, 1], ['peanut', 'crate', 13, 1],
  ['mix', 'mix', 5, 4], ['shave', 'shave', 9, 5],
  ['plates', 'plates', 13, 3], ['serve', 'serve', 13, 4],
  ['dirty', 'dirty', 13, 6], ['sink', 'sink', 11, 7], ['bin', 'bin', 3, 7],
  ['ice', 'crate', 8, 7], ['beans', 'crate', 9, 7], ['syrup', 'crate', 10, 7],
  ['counterB', 'counter', 6, 4], ['counterC', 'counter', 8, 4],
  ['counterE', 'counter', 7, 7]
].map(([id, kind, x, y]) => ({ id, kind, x, y }))
export const INGREDIENTS = {
  rice: { name: 'Coconut rice', label: 'RICE', color: '#fff0cc' },
  sambal: { name: 'Sambal', label: 'SAMBAL', color: '#cf482d' },
  cucumber: { name: 'Cucumber', label: 'CUCUMBER', color: '#69a85e', chop: true },
  pineapple: { name: 'Pineapple', label: 'PINEAPPLE', color: '#e9b747', chop: true },
  dressing: { name: 'Rojak sauce', label: 'ROJAK SAUCE', color: '#884827' },
  noodles: { name: 'Flat rice noodles', label: 'NOODLES', color: '#eed498' },
  broth: { name: 'Curry broth', label: 'CURRY BROTH', color: '#de783b' },
  prawn: { name: 'Prawns', label: 'PRAWNS', color: '#fb8c79' },
  sprouts: { name: 'Bean sprouts', label: 'SPROUTS', color: '#d2dc8c' },
  chicken: { name: 'Chicken', label: 'CHICKEN', color: '#eea48a', chop: true },
  peanut: { name: 'Peanut sauce', label: 'PEANUT SAUCE', color: '#ad733e' },
  ice: { name: 'Ice', label: 'ICE', color: '#a6e1ef' },
  beans: { name: 'Red beans', label: 'RED BEANS', color: '#a04b5c' },
  syrup: { name: 'Rose syrup', label: 'ROSE SYRUP', color: '#ee689a' }
}
export const METHODS = {
  pot: { label: 'Stove', action: 'Cook', busy: 'Cooking', hot: true, scale: 1 },
  grill: { label: 'Grill', action: 'Grill', busy: 'Grilling', hot: true, scale: 0.9 },
  mix: { label: 'Mixing bowl', action: 'Toss', busy: 'Tossing', hot: false, scale: 0.48 },
  shave: { label: 'Ice station', action: 'Shave and top', busy: 'Shaving and topping', hot: false, scale: 0.6 }
}
export const RECIPES = {
  nasiLemak: { name: 'Nasi Lemak', station: 'pot', ingredients: ['rice', 'sambal', 'cucumber'], method: 'Cook at the stove', color: '#5a955d', points: 110 },
  rojak: { name: 'Fruit Rojak', station: 'mix', ingredients: ['cucumber', 'pineapple', 'dressing'], method: 'Toss in the mixing bowl', color: '#b76538', points: 110 },
  aisKacang: { name: 'Ais Kacang', station: 'shave', ingredients: ['ice', 'beans', 'syrup'], method: 'Shave and top at the ice station', color: '#db659a', points: 90 },
  charKwayTeow: { name: 'Char Kway Teow', station: 'pot', ingredients: ['noodles', 'prawn', 'sprouts'], method: 'Stir-fry at the stove', color: '#bd6a3c', points: 110 },
  satay: { name: 'Chicken Satay', station: 'grill', ingredients: ['chicken', 'peanut'], method: 'Cook on the grill', color: '#d49542', points: 90 },
  laksa: { name: 'Curry Laksa', station: 'pot', ingredients: ['broth', 'noodles', 'prawn'], method: 'Simmer at the stove', color: '#ce6442', points: 110 }
}
export const TRAINING_RECIPES = ['rojak', 'nasiLemak', 'laksa', 'aisKacang']
const service = { duration: 210000, orderLife: 78000, interval: 23000, cook: 4200, burn: 23000, plates: 6 }
export const DIFFICULTIES = {
  Easy: { ...service, category: 'Rice & dessert', pool: ['nasiLemak', 'aisKacang'] },
  Normal: { ...service, category: 'Hot favourites', pool: ['nasiLemak', 'charKwayTeow', 'satay'] },
  Hard: { ...service, category: 'Full hawker menu', pool: ['rojak', 'charKwayTeow', 'aisKacang', 'satay', 'nasiLemak'] }
}

export function recipeFor(difficulty, id) {
  const recipe = RECIPES[id]
  if (difficulty === 'Easy' && id === 'nasiLemak') return { ...recipe, ingredients: ['rice', 'cucumber'], included: 'Sambal is provided at the stove.' }
  if (difficulty === 'Easy' && id === 'aisKacang') return { ...recipe, ingredients: ['ice', 'beans'], included: 'Rose syrup is provided at the ice station.' }
  return recipe
}

function buildStations(difficulty, pool) {
  const recipes = pool.map(id => recipeFor(difficulty, id))
  const ingredients = new Set(recipes.flatMap(recipe => recipe.ingredients))
  const methods = new Set(recipes.map(recipe => recipe.station))
  return STATIONS.filter(station => {
    if (station.kind === 'crate') return ingredients.has(station.id)
    return !Object.hasOwn(METHODS, station.kind) || methods.has(station.kind)
  })
}

const stationLayouts = Object.fromEntries(Object.entries(DIFFICULTIES).map(([level, rules]) => [level, buildStations(level, rules.pool)]))
const trainingLayouts = Object.fromEntries(TRAINING_RECIPES.map(id => [id, buildStations('Hard', [id])]))

export function stationsFor(difficulty, training) {
  return training ? trainingLayouts[training] : stationLayouts[difficulty]
}

export function nearestStation(x, y, stations = STATIONS) {
  let nearest
  let distance = 1.05
  for (const station of stations) {
    const next = Math.hypot(station.x + 0.5 - x, station.y + 0.5 - y)
    if (next < distance) {
      nearest = station
      distance = next
    }
  }
  return nearest
}
