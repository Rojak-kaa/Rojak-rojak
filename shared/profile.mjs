export const LANGUAGES = { en: 'English', ms: 'Bahasa Melayu', zh: '简体中文（普通话）', ta: 'தமிழ்' }
export const CHEFS = {
  ayu: { name: 'Ayu', culture: 'Malay', skin: 0xe4a276, hair: 0x442f35 },
  liWei: { name: 'Li Wei', culture: 'Chinese', skin: 0xf9c59e, hair: 0x302831 },
  kavitha: { name: 'Kavitha', culture: 'Indian', skin: 0xc78761, hair: 0x322633 },
  eco: { name: '全村最环保的人', culture: 'Chinese', skin: 0xffdec9, hair: 0x20191c }
}
export const GARMENTS = {
  bajuMelayu: 'Baju Melayu',
  bajuKurung: 'Baju Kurung',
  samfu: 'Samfu',
  cheongsam: 'Cheongsam',
  kurta: 'Kurta',
  saree: 'Sari',
  striped: 'Striped shirt'
}
export const ACCESSORIES = { chef: 'Chef hat', songkok: 'Songkok', flower: 'Flower', sprout: 'Sprout', none: 'No headwear' }
export const PALETTE = ['#c85243', '#2c8976', '#674993', '#cb8c29', '#376ca0', '#ab4b81', '#88aa58', '#fff4dc', '#2b2029']
export const DEFAULT_OUTFIT = { chef: 'ayu', garment: 'bajuMelayu', accessory: 'chef', fabric: 0, trim: 3 }
export const ECO_OUTFIT = { chef: 'eco', garment: 'striped', accessory: 'sprout', fabric: 6, trim: 7 }

export function lockEcoOutfit(outfit) {
  return outfit.chef === ECO_OUTFIT.chef
    ? { ...ECO_OUTFIT, accessory: outfit.accessory, fabric: outfit.fabric }
    : outfit
}
