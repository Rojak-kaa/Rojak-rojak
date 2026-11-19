import { ECO_OUTFIT } from '../shared/profile.mjs'
import type { Outfit } from '../shared/profile.mjs'

export { default as ecoPortrait } from './assets/eco-chef.webp'

export function usesEcoPortrait(outfit?: Outfit) {
  return Boolean(outfit && outfit.chef === ECO_OUTFIT.chef && outfit.garment === ECO_OUTFIT.garment &&
    outfit.accessory === ECO_OUTFIT.accessory && outfit.fabric === ECO_OUTFIT.fabric && outfit.trim === ECO_OUTFIT.trim)
}
