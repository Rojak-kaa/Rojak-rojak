const ingredient = (name, label, color) => ({ name, label, color })
export const SHOP_INGREDIENTS = {
  fragrantRice: ingredient('Fragrant rice', 'FRAGRANT RICE', '#fff0ce'),
  soy: ingredient('Soy dressing', 'SOY DRESSING', '#654634'),
  charSiew: ingredient('Char siew', 'CHAR SIEW', '#b64d3e'),
  roastGlaze: ingredient('Roast glaze', 'ROAST GLAZE', '#af6a36'),
  roastedChicken: ingredient('Roasted chicken', 'ROAST CHICKEN', '#b66b39'),
  barley: ingredient('Barley', 'BARLEY', '#e6d091'),
  water: ingredient('Water', 'WATER', '#9ccee7'),
  herbalTea: ingredient('Herbal tea', 'HERBAL TEA', '#778854'),
  dough: ingredient('Roti dough', 'ROTI DOUGH', '#f0d99c'),
  sugar: ingredient('Sugar', 'SUGAR', '#fff2cd'),
  yellowNoodles: ingredient('Yellow noodles', 'YELLOW MEE', '#efbe53'),
  wokSauce: ingredient('Wok sauce', 'WOK SAUCE', '#98714d'),
  tea: ingredient('Black tea', 'BLACK TEA', '#99603e'),
  condensedMilk: ingredient('Condensed milk', 'COND. MILK', '#f9e7ab'),
  curry: ingredient('Curry gravy', 'CURRY GRAVY', '#d49246'),
  vegetables: { ...ingredient('Mixed vegetables', 'VEGETABLES', '#78a65a'), chop: true },
  paprikSauce: ingredient('Paprik sauce', 'PAPRIK SAUCE', '#d55b41'),
  panNoodles: ingredient('Pan mee noodles', 'PAN MEE', '#e5cc9c'),
  mince: ingredient('Minced meat', 'MINCE', '#b27158'),
  stock: ingredient('Soup stock', 'STOCK', '#bd9050'),
  bread: ingredient('Bread', 'BREAD', '#e8bd80'),
  kaya: ingredient('Kaya', 'KAYA', '#769850'),
  butter: ingredient('Butter', 'BUTTER', '#f5dc74'),
  coffee: ingredient('Coffee grounds', 'COFFEE', '#70432f'),
  egg: ingredient('Egg', 'EGG', '#f8e0bb')
}

const dish = (name, station, ingredients, method, color, points = 100) => ({ name, station, ingredients, method, color, points })
const drink = (...args) => ({ ...dish(...args), vessel: 'cup' })
export const SHOP_RECIPES = {
  chickenRice: dish('Chicken Rice', 'pot', ['fragrantRice', 'chicken', 'soy'], 'Steam at the stove', '#d3a751'),
  barleyWater: drink('Barley Water', 'pot', ['barley', 'water'], 'Simmer barley in water at the stove', '#d1b77e', 75),
  icedLiangTeh: drink('Iced Liang Teh', 'mix', ['herbalTea', 'ice'], 'Mix the herbal tea with ice', '#8aa186', 75),
  charSiewRice: dish('Char Siew Rice', 'grill', ['charSiew', 'fragrantRice'], 'Glaze and warm at the grill', '#c46643'),
  roastedChickenRice: dish('Roasted Chicken Rice', 'mix', ['roastedChicken', 'roastGlaze', 'fragrantRice'], 'Roast raw chicken in the oven, then assemble with glaze and rice at Mix', '#bd784c'),
  rotiCanai: dish('Roti Canai', 'grill', ['dough', 'butter'], 'Griddle until golden', '#e8b665', 85),
  rotiTissue: dish('Roti Tissue', 'grill', ['dough', 'sugar'], 'Griddle the thin roti with sugar', '#e0a256', 85),
  meeGoreng: dish('Mee Goreng', 'pot', ['yellowNoodles', 'wokSauce', 'sprouts'], 'Stir-fry at the stove', '#cf7141'),
  tehTarik: drink('Teh Tarik', 'mix', ['tea', 'condensedMilk'], 'Pull the tea and milk at the mixing station', '#b57c52', 80),
  nasiKandar: dish('Nasi Kandar', 'pot', ['fragrantRice', 'curry', 'chicken'], 'Heat the curry and chicken at the stove', '#cb9a45'),
  ayamPaprik: dish('Ayam Paprik', 'pot', ['chicken', 'vegetables', 'paprikSauce'], 'Stir-fry chicken and vegetables in paprik sauce', '#bd6341'),
  banMee: dish('Ban Mee', 'pot', ['panNoodles', 'mince', 'stock'], 'Simmer the noodles and mince in stock', '#b89258'),
  kayaToast: dish('Kaya Butter Toast', 'grill', ['bread', 'kaya', 'butter'], 'Toast at the grill and add kaya and butter', '#dca45a', 85),
  blackCoffee: drink('Black Coffee', 'pot', ['coffee', 'water'], 'Brew at the stove', '#8a533b', 75),
  whiteCoffee: drink('White Coffee', 'pot', ['coffee', 'water', 'condensedMilk'], 'Brew at the stove with condensed milk', '#ba966a', 80),
  halfBoiledEgg: dish('Half-boiled Eggs', 'pot', ['egg', 'water'], 'Soft-boil at the stove', '#d8a65e', 75)
}

export const SHOPS = {
  chickenRice: { name: 'Chicken Rice Shop', x: 19, y: 26, pool: ['chickenRice', 'barleyWater', 'icedLiangTeh', 'charSiewRice', 'roastedChickenRice'] },
  mamak: { name: 'Mamak', x: 81, y: 23, pool: ['rotiCanai', 'rotiTissue', 'meeGoreng', 'tehTarik', 'nasiKandar', 'ayamPaprik'] },
  hawker: { name: 'Hawker Centre', x: 18, y: 66, pool: ['banMee', 'chickenRice', 'charKwayTeow', 'laksa', 'rojak'] },
  kopitiam: { name: 'Kopitiam', x: 83, y: 67, pool: ['kayaToast', 'blackCoffee', 'whiteCoffee', 'halfBoiledEgg'] }
}
