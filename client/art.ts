import Phaser from 'phaser'
import { CHEFS, PALETTE } from '../shared/profile.mjs'
import { COLORS, HEIGHT, INGREDIENTS, RECIPES, WIDTH } from '../shared/kitchen.mjs'
import type { Station } from '../shared/kitchen.mjs'
import type { Item, Player, StationState } from './model'

export const TILE = 56
export const WORLD_WIDTH = WIDTH * TILE
export const WORLD_HEIGHT = HEIGHT * TILE
const hex = (color: string) => Phaser.Display.Color.HexStringToColor(color).color

export function floor(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x2c2633).fillRoundedRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 22)
  for (let y = 1; y < HEIGHT - 1; y++) {
    for (let x = 1; x < WIDTH - 1; x++) {
      const stripe = y < 3 ? [0xf5d9b0, 0xf9e4c4] : [0xf4e9d6, 0xfff5e4]
      g.fillStyle(stripe[(x + y) % 2]).fillRect(x * TILE, y * TILE, TILE, TILE)
    }
  }
  g.fillStyle(0x584250).fillRoundedRect(12, 10, WORLD_WIDTH - 24, 36, 12)
  g.fillStyle(0x695162).fillRoundedRect(12, WORLD_HEIGHT - 44, WORLD_WIDTH - 24, 29, 10)
  for (const x of [21, WORLD_WIDTH - 37]) {
    g.fillStyle(0x7d5861).fillRoundedRect(x, 58, 16, WORLD_HEIGHT - 116, 7)
    for (let y = 74; y < WORLD_HEIGHT - 65; y += 48) {
      g.fillStyle(0xa67b7b).fillRoundedRect(x + 3, y, 10, 20, 4)
    }
  }
}

function cup(g: Phaser.GameObjects.Graphics, x: number, y: number, drink?: string) {
  g.lineStyle(2, 0xb0c6c8).strokeEllipse(x + 8, y, 8, 8)
  g.fillStyle(0xe8f6f2).fillRoundedRect(x - 9, y - 7, 17, 17, 4)
  g.fillStyle(drink ? hex(drink) : 0xbcd2d5).fillEllipse(x - 1, y - 6, 15, 6)
}

function plate(g: Phaser.GameObjects.Graphics, x: number, y: number, dirty = false) {
  g.fillStyle(0xa6c4c8).fillEllipse(x, y + 3, 32, 23)
  g.fillStyle(0xf8ffff).fillEllipse(x, y, 32, 23)
  g.lineStyle(2, 0xbdd9d8).strokeEllipse(x, y, 22, 14)
  if (dirty) g.fillStyle(0xab6a44).fillCircle(x - 3, y, 4).fillCircle(x + 4, y + 2, 2)
}

function ingredient(g: Phaser.GameObjects.Graphics, x: number, y: number, name: string, chopped = false) {
  const color = INGREDIENTS[name] ? hex(INGREDIENTS[name].color) : 0xffffff
  g.fillStyle(color)
  if (chopped) {
    g.fillRoundedRect(x - 9, y - 6, 8, 7, 2).fillRoundedRect(x + 2, y - 8, 7, 7, 2).fillRoundedRect(x - 2, y + 2, 8, 7, 2)
  } else if (name === 'cucumber') {
    g.fillRoundedRect(x - 11, y - 5, 22, 10, 5)
    g.fillStyle(0xc5da8d).fillEllipse(x + 7, y, 7, 8)
  } else if (name === 'pineapple') {
    g.fillEllipse(x, y + 2, 15, 18)
    g.fillStyle(0x509164).fillTriangle(x - 5, y - 5, x, y - 13, x + 5, y - 5)
  } else if (name === 'ice') {
    g.fillRoundedRect(x - 8, y - 8, 16, 16, 4)
    g.fillStyle(0xe9fbff).fillRoundedRect(x - 5, y - 5, 7, 4, 2)
  } else if (['sambal', 'dressing', 'peanut', 'syrup'].includes(name)) {
    g.fillRoundedRect(x - 6, y - 6, 12, 15, 3)
    g.fillStyle(0xffe7b8).fillRoundedRect(x - 4, y - 10, 8, 5, 2)
  } else {
    g.fillEllipse(x - 4, y + 1, 13, 10).fillEllipse(x + 5, y - 1, 12, 10)
  }
}

export function drawItem(g: Phaser.GameObjects.Graphics, x: number, y: number, item: Item) {
  const drink = item.kind === 'dish' && item.name && RECIPES[item.name]?.vessel === 'cup' ? RECIPES[item.name] : undefined
  if (item.kind === 'cup' || item.kind === 'dirtyCup' || drink) {
    cup(g, x, y, drink?.color ?? (item.kind === 'dirtyCup' ? '#936e53' : undefined))
    return
  }
  if (item.kind === 'fried') {
    g.fillStyle(0xaf6836).fillEllipse(x - 3, y - 3, 14, 4).fillEllipse(x + 2, y + 3, 14, 4)
  } else if (item.kind === 'raw' || item.kind === 'chopped') ingredient(g, x, y, item.name ?? '', item.kind === 'chopped')
  else {
    plate(g, x, y, item.kind === 'dirty')
    const recipe = item.kind === 'dish' && item.name ? RECIPES[item.name] : undefined
    if (recipe) {
      g.fillStyle(hex(recipe.color)).fillEllipse(x, y, 23, 14)
      if (item.name === 'nasiLemak') {
        g.fillStyle(0xfff2cf).fillCircle(x - 1, y - 2, 6)
        g.fillStyle(0xce492c).fillCircle(x + 7, y + 1, 3)
        g.fillStyle(0x9ed36d).fillCircle(x - 8, y + 3, 3)
      } else if (item.name === 'aisKacang') {
        g.fillStyle(0xfff7f4).fillCircle(x, y - 5, 8)
        g.fillStyle(0xee689a).fillEllipse(x, y - 7, 13, 5)
        g.fillStyle(0x983951).fillCircle(x + 7, y + 3, 2).fillCircle(x - 7, y + 2, 2)
      } else {
        recipe.ingredients.forEach((name, i) => {
          g.fillStyle(hex(INGREDIENTS[name].color)).fillRoundedRect(x - 8 + i * 6, y - 3, 5, 5, 1)
        })
      }
    }
  }
}

export function drawStation(g: Phaser.GameObjects.Graphics, station: Station, state: StationState | undefined, now: number, active: boolean) {
  const x = station.x * TILE
  const y = station.y * TILE
  const cx = x + 28
  const cy = y + 26
  g.fillStyle(0x442a30, 0.22).fillRoundedRect(x + 3, y + 8, 52, 49, 8)
  g.fillStyle(0x916052).fillRoundedRect(x + 2, y + 7, 52, 45, 7)
  const top = ({ pot: 0x8d8494, grill: 0xb37a66, mix: 0xb8c486, shave: 0x87c8de, sink: 0x8ac3b7, serve: 0xf3a589, crate: 0xca8857, plates: 0x84b6ac, dirty: 0xc6a095, board: 0xf6c48c, bin: 0xa59cab } as Record<string, number>)[station.kind] ?? 0xf0bf99
  g.fillStyle(top).fillRoundedRect(x + 2, y + 3, 52, 42, 7)
  g.fillStyle(0xffffff, 0.22).fillRoundedRect(x + 7, y + 7, 42, 3, 2)
  switch (station.kind) {
    case 'crate':
      g.fillStyle(0xa46a4c).fillRoundedRect(x + 7, y + 11, 42, 27, 5)
      ingredient(g, cx - 9, cy - 4, station.id)
      ingredient(g, cx + 9, cy + 3, station.id)
      break
    case 'board':
      g.fillStyle(0xc48c54).fillRoundedRect(cx - 19, cy - 12, 38, 26, 5)
      g.fillStyle(0xfce0aa).fillRoundedRect(cx - 18, cy - 14, 36, 25, 5)
      if (!state?.item) {
        g.fillStyle(0xa0a5ab).fillRoundedRect(cx - 10, cy - 3, 16, 8, 2)
        g.fillStyle(0x775244).fillRoundedRect(cx + 5, cy - 2, 9, 5, 2)
      }
      break
    case 'mix':
    case 'shave':
    case 'grill':
    case 'fryer':
    case 'pot': {
      if (station.kind === 'grill') {
        g.fillStyle(0x584150).fillRoundedRect(cx - 21, cy - 13, 42, 30, 5)
        for (let i = -14; i <= 14; i += 7) g.fillStyle(0x9f8790).fillRoundedRect(cx + i, cy - 10, 2, 24, 1)
      } else if (station.kind === 'mix' || station.kind === 'shave') {
        g.fillStyle(station.kind === 'mix' ? 0x5f8055 : 0x387f9a).fillEllipse(cx, cy + 2, 40, 30)
        g.fillStyle(station.kind === 'mix' ? 0xdfeeb3 : 0xe5faff).fillEllipse(cx, cy - 2, 34, 21)
      } else {
        g.fillStyle(0x4d4251).fillRoundedRect(cx - 23, cy - 5, 46, 9, 4)
        g.fillStyle(0x525867).fillEllipse(cx, cy + 4, 36, 29)
        g.fillStyle(0xb5b4c1).fillEllipse(cx, cy - 2, 37, 27)
        let filling = 0x544957
        if (state?.status === 'burned') filling = 0x332628
        else if (state?.recipe) filling = hex(RECIPES[state.recipe].color)
        g.fillStyle(filling).fillEllipse(cx, cy - 2, 29, 19)
      }
      if (state?.status === 'loaded' || state?.status === 'cooking') state.ingredients.forEach((name, i) => ingredient(g, cx - 10 + i * 10, cy - 1, name, true))
      if (state?.status === 'cooked' && state.recipe) drawItem(g, cx, cy, { kind: 'dish', name: state.recipe })
      if ((station.kind === 'pot' || station.kind === 'grill') && (state?.status === 'cooking' || state?.status === 'cooked')) {
        for (let i = 0; i < 3; i++) {
          const rise = (now / 90 + i * 5) % 14
          g.fillStyle(0xfffaf0, (14 - rise) / 18).fillCircle(cx - 11 + i * 10, cy - 8 - rise, 3 + rise / 5)
        }
      }
      break
    }
    case 'plates':
    case 'dirty':
      plate(g, cx, cy + 4, station.kind === 'dirty')
      plate(g, cx, cy - 2, station.kind === 'dirty')
      break
    case 'cups':
    case 'cupReturn':
      cup(g, cx - 8, cy + 1, station.kind === 'cupReturn' ? '#936e53' : undefined)
      cup(g, cx + 8, cy - 3, station.kind === 'cupReturn' ? '#936e53' : undefined)
      break
    case 'sink':
      g.fillStyle(0x497f7d).fillRoundedRect(cx - 18, cy - 12, 36, 25, 6)
      g.fillStyle(0x75c7cf).fillRoundedRect(cx - 14, cy - 7, 28, 16, 5)
      g.fillStyle(0xe7fbfa).fillRoundedRect(cx - 3, cy - 17, 6, 15, 3)
      if (state?.status === 'washing') {
        g.fillStyle(0xe6ffff, 0.8).fillCircle(cx - 8, cy + Math.sin(now / 110) * 4, 5).fillCircle(cx + 10, cy - 5, 4)
      }
      break
    case 'serve':
      g.fillStyle(0xffefc9).fillRoundedRect(cx - 17, cy - 10, 34, 22, 4)
      g.fillStyle(0xc36c57).fillCircle(cx, cy, 7)
      g.lineStyle(2, 0xffefc9).beginPath().moveTo(cx - 4, cy).lineTo(cx - 1, cy + 3).lineTo(cx + 5, cy - 4).strokePath()
      break
    case 'bin':
      g.fillStyle(0x5c5367).fillRoundedRect(cx - 14, cy - 10, 28, 24, 4)
      g.fillStyle(0xd2c7d5).fillRoundedRect(cx - 16, cy - 12, 32, 5, 3)
      break
  }
  if (state?.item) drawItem(g, cx, cy, state.item)
  if (state && ['chopping', 'cooking', 'frying', 'cooked', 'washing', 'burned'].includes(state.status)) {
    const tint = state.status === 'cooked' ? 0x52b985 : state.status === 'burned' ? 0xfa7155 : 0xffc95e
    g.fillStyle(tint).fillCircle(x + 45, y + 10, 5)
  }
  if (active) g.lineStyle(3, 0xff801f).strokeRoundedRect(x + 2, y + 2, 52, 45, 8)
}

export function drawChef(g: Phaser.GameObjects.Graphics, player: Player, x: number, y: number, time: number, moving: boolean) {
  const bounce = moving ? Math.sin(time / 65) * 2 : 0
  const color = hex(COLORS[player.color])
  const alpha = player.connected ? 1 : 0.38
  const character = player.outfit && CHEFS[player.outfit.chef]
  const skin = character?.skin ?? [0xf9c59e, 0xc78761, 0xe4a276, 0xad6a4d][player.color]
  g.fillStyle(0x3b2637, 0.19).fillEllipse(x, y + 17, 38, 11)
  g.fillStyle(0x423044, alpha).fillRoundedRect(x - 12, y + 10, 10, 9, 4).fillRoundedRect(x + 2, y + 10, 10, 9, 4)
  y += bounce
  const outfit = player.outfit
  const fabric = outfit ? hex(PALETTE[outfit.fabric]) : color
  const trim = outfit ? hex(PALETTE[outfit.trim]) : 0xffead5
  g.fillStyle(fabric, alpha).fillRoundedRect(x - 17, y - 7, 34, 23, 8)
  g.fillStyle(trim, alpha)
  switch (outfit?.garment) {
    case 'bajuMelayu':
      g.fillRoundedRect(x - 14, y + 5, 28, 9, 2).fillRect(x - 1, y - 5, 2, 10)
      break
    case 'bajuKurung':
      g.fillRoundedRect(x - 13, y + 11, 26, 3, 1).fillEllipse(x, y - 2, 9, 5)
      break
    case 'samfu':
    case 'cheongsam':
      g.fillRect(x - 6, y - 4, 12, 3).fillRect(x + 3, y - 1, 8, 2).fillRect(x + 5, y + 4, 8, 2)
      if (outfit.garment === 'cheongsam') g.fillRect(x - 10, y + 11, 20, 2)
      break
    case 'kurta':
      g.fillRoundedRect(x - 4, y - 4, 8, 14, 2).fillRect(x - 12, y + 11, 24, 2)
      break
    case 'saree':
      g.fillTriangle(x - 14, y - 6, x - 6, y - 6, x + 15, y + 15).fillTriangle(x - 14, y - 6, x + 6, y + 15, x + 15, y + 15)
      break
    default:
      g.fillRoundedRect(x - 9, y + 3, 18, 11, 4)
  }
  g.fillStyle(color, alpha).fillCircle(x + 12, y + 10, 3)
  g.fillStyle(skin, alpha).fillCircle(x - 16, y + 3, 5).fillCircle(x + 16, y + 3, 5).fillRoundedRect(x - 12, y - 22, 24, 23, 9)
  const look = player.facing * 2
  g.fillStyle(0x3e292e, alpha).fillCircle(x - 5 + look, y - 9, 1.7).fillCircle(x + 5 + look, y - 9, 1.7)
  g.fillStyle(0xca7867, alpha).fillEllipse(x - 8, y - 5, 4, 2.5).fillEllipse(x + 8, y - 5, 4, 2.5)
  if (!outfit || outfit.accessory === 'chef') {
    g.fillStyle(0xe4cbc1, alpha).fillRoundedRect(x - 13, y - 26, 26, 10, 4)
    g.fillStyle(0xfffbf2, alpha).fillCircle(x - 9, y - 25, 8).fillCircle(x + 8, y - 26, 8).fillCircle(x, y - 30, 10)
  } else if (outfit.accessory === 'songkok') {
    g.fillStyle(0x312735, alpha).fillRoundedRect(x - 13, y - 30, 26, 13, 3)
  } else {
    g.fillStyle(character?.hair ?? 0x493031, alpha).fillEllipse(x, y - 21, 24, 9)
    if (outfit.accessory === 'flower') g.fillStyle(0xffe4a3, alpha).fillCircle(x + 9, y - 22, 4)
  }
  if (player.item) drawItem(g, x + 20, y + 10, player.item)
}
