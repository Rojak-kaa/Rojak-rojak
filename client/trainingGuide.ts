import { INGREDIENTS, METHODS, recipeFor, stationsFor } from '../shared/kitchen.mjs'
import { t } from './i18n'
import type { Player, Room } from './model'

export function trainingGuide(room: Room, chef: Player, touch: boolean) {
  if (!room.training || !room.game) return ''
  const recipe = recipeFor(room.difficulty, room.training)
  const method = METHODS[recipe.station]
  if (!method) return ''
  const { stations } = room.game
  const layout = stationsFor(room.difficulty, room.training, room.shop)
  const batches = layout.filter(station => station.kind === recipe.station).map(station => stations[station.id])
  const batch = batches.find(state => state.status === 'cooked') ??
    batches.find(state => state.status === 'cooking') ??
    batches.reduce((fullest, state) => state.ingredients.length > fullest.ingredients.length ? state : fullest)
  const item = chef.item
  const stationName = t(method.label)
  const prompt = (line: string, ingredient = '') => t(line)
    .replace('{use}', touch ? t('Use') : 'E')
    .replace('{work}', touch ? t('Work') : 'Space')
    .replace('{station}', stationName)
    .replace('{ingredient}', ingredient ? t(INGREDIENTS[ingredient].name) : '')

  if (item?.kind === 'dish') return prompt('Go to Serve and press {use} to complete the lesson.')
  if (batch.status === 'cooked' || batch.status === 'cooking') {
    if (item?.kind === (recipe.vessel ?? 'plate')) {
      return batch.status === 'cooked'
        ? prompt('Return to {station} and press {use} to collect the order.')
        : prompt('Wait at {station} until the order is ready.')
    }
    if (item) return prompt('Put down your item with {use} to free your hands.')
    return recipe.vessel === 'cup'
      ? prompt('Go to Cups and press {use} for a clean cup.')
      : prompt('Go to Plates and press {use} for a clean plate.')
  }
  if (batch.status === 'burned') {
    return prompt('Go to the burned batch and press {work} to clear it.')
  }
  if (item?.name && recipe.ingredients.includes(item.name) && !batch.ingredients.includes(item.name)) {
    if (item.kind === 'raw' && INGREDIENTS[item.name].chop) return prompt('Go to Chop and press {use} to put down {ingredient}.', item.name)
    if (item.kind === 'raw' && item.name === 'bilis') return prompt('Go to the fryer and press {use} to load ikan bilis.')
    return prompt('Go to {station} and press {use} to add {ingredient}.', item.name)
  }
  if (item) return prompt('Put down your item with {use} to free your hands.')

  const prep = layout.filter(station => station.kind === 'board' || station.kind === 'fryer')
    .map(station => stations[station.id])
    .find(state => state.item?.name && recipe.ingredients.includes(state.item.name) && !batch.ingredients.includes(state.item.name))
  if (prep?.item?.name) {
    if (prep.status === 'raw') return prep.item.name === 'bilis'
      ? prompt('Press {work} at the fryer to fry the ikan bilis.')
      : prompt('Press {work} at the cutting board to chop {ingredient}.', prep.item.name)
    if (prep.status === 'chopping' || prep.status === 'frying') return prompt('Wait for {ingredient} to finish.', prep.item.name)
    return prompt('Press {use} to pick up the prepared {ingredient}.', prep.item.name)
  }
  const missing = recipe.ingredients.find(name => !batch.ingredients.includes(name))
  if (missing === 'bilis' && stations.fryer?.status === 'burned') {
    return prompt('Press {work} at the fryer to clear the burned ikan bilis.')
  }
  return missing ? prompt('Find {ingredient} and press {use} to pick it up.', missing)
    : prompt('All ingredients are in. Press {work} at {station}.')
}
