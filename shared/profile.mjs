export const LANGUAGES = { en: 'English', ms: 'Bahasa Melayu', zh: '简体中文（普通话）', ta: 'தமிழ்' }
export const CHEFS = {
  ayu: { name: 'Ayu', culture: 'Malay', skin: 0xefc2a7, hair: 0x242024 },
  liWei: { name: 'Li Wen', culture: 'Chinese', skin: 0xf9c59e, hair: 0x47302c },
  kavitha: { name: 'Kavitha', culture: 'Indian', skin: 0xc78761, hair: 0x322633 },
  eco: { name: '全村最环保的人', culture: 'Chinese', skin: 0xffdec9, hair: 0x20191c }
}
export const GARMENTS = {
  none: 'No clothing',
  bajuMelayu: 'Baju Melayu',
  bajuKurung: 'Baju Kurung',
  samfu: 'Samfu',
  cheongsam: 'Cheongsam',
  kurta: 'Kurta',
  saree: 'Sari',
  striped: 'Striped shirt'
}
export const ACCESSORIES = { chef: 'Chef hat', songkok: 'Songkok', flower: 'Flower', sprout: 'Sprout', none: 'No headwear' }
export const EXPRESSIONS = { none: 'Blank face', calm: 'Calm', happy: 'Happy', wink: 'Wink', worried: 'Worried', determined: 'Determined', sleepy: 'Sleepy' }
export const HAND_SIGNS = { relaxed: 'Relaxed hands', peace: 'Peace sign', wave: 'Wave', fist: 'Fist', point: 'Point', okay: 'OK sign' }
export const HAIRSTYLES = { none: 'No hair', short: 'Short hair', bob: 'Bob', bun: 'Bun', braids: 'Braids' }
export const PALETTE = ['#c85243', '#2c8976', '#674993', '#cb8c29', '#376ca0', '#ab4b81', '#88aa58', '#fff4dc', '#2b2029', '#efd78b']
export const DEFAULT_OUTFIT = { chef: 'ayu', garment: 'bajuMelayu', accessory: 'chef', fabric: 0, trim: 3, expression: 'calm', handSign: 'peace', hairStyle: 'none' }
export const BASE_OUTFIT = { ...DEFAULT_OUTFIT, garment: 'none', accessory: 'none', expression: 'none', handSign: 'relaxed' }
export const ECO_OUTFIT = { ...DEFAULT_OUTFIT, chef: 'eco', garment: 'striped', accessory: 'sprout', fabric: 6, trim: 7, hairStyle: 'braids' }
export const AYU_OUTFIT = { ...DEFAULT_OUTFIT, accessory: 'none', fabric: 9, trim: 1, handSign: 'relaxed', hairStyle: 'short' }
export const LI_WEN_OUTFIT = { ...DEFAULT_OUTFIT, chef: 'liWei', garment: 'samfu', accessory: 'none', trim: 3, hairStyle: 'short', handSign: 'relaxed' }
export const KAVITHA_OUTFIT = { ...DEFAULT_OUTFIT, chef: 'kavitha', garment: 'kurta', accessory: 'none', fabric: 9, trim: 0, hairStyle: 'short', handSign: 'relaxed' }
export const FIXED_OUTFITS = { [ECO_OUTFIT.chef]: ECO_OUTFIT, [AYU_OUTFIT.chef]: AYU_OUTFIT, [LI_WEN_OUTFIT.chef]: LI_WEN_OUTFIT, [KAVITHA_OUTFIT.chef]: KAVITHA_OUTFIT }

export function hasFixedFabric(chef) {
  return chef === LI_WEN_OUTFIT.chef || chef === KAVITHA_OUTFIT.chef
}

export function lockSignatureOutfit(outfit) {
  if (!Object.hasOwn(FIXED_OUTFITS, outfit.chef)) return outfit
  const { garment, trim, hairStyle, fabric } = FIXED_OUTFITS[outfit.chef]
  const eco = outfit.chef === ECO_OUTFIT.chef
  return { ...outfit, garment, trim, hairStyle, fabric: hasFixedFabric(outfit.chef) ? fabric : outfit.fabric,
    expression: eco && outfit.expression === 'none' ? ECO_OUTFIT.expression : outfit.expression,
    handSign: eco && outfit.handSign === 'relaxed' ? ECO_OUTFIT.handSign : outfit.handSign }
}
