const icons: Record<string, string> = {
  bilis: '🐟', rice: '🍚', fragrantRice: '🍚', sambal: '🌶️', cucumber: '🥒',
  pineapple: '🍍', dressing: '🥣', noodles: '🍜', broth: '🍲', prawn: '🦐',
  sprouts: '🌱', chicken: '🍗', roastedChicken: '🍖', peanut: '🥜', ice: '🧊',
  beans: '🫘', syrup: '🌹', soy: '🥣', charSiew: '🥩', roastGlaze: '🍯',
  barley: '🌾', water: '💧', herbalTea: '🌿', dough: '🫓', sugar: '🧂',
  yellowNoodles: '🍝', wokSauce: '🥣', tea: '🍵', condensedMilk: '🥛',
  curry: '🍛', vegetables: '🥬', paprikSauce: '🌶️', panNoodles: '🍜',
  mince: '🥩', stock: '🍲', bread: '🍞', kaya: '🥥', butter: '🧈',
  coffee: '☕', egg: '🥚'
}

export function ingredientIcon(id: string) {
  return icons[id] ?? '🥣'
}
