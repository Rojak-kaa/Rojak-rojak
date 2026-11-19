import { ECO_OUTFIT, PALETTE } from '../shared/profile.mjs'
import type { Outfit } from '../shared/profile.mjs'

export { default as ecoPortrait } from './assets/eco-chef.webp'

export function usesEcoPortrait(outfit?: Outfit) {
  return Boolean(outfit && outfit.chef === ECO_OUTFIT.chef && outfit.garment === ECO_OUTFIT.garment &&
    outfit.accessory === ECO_OUTFIT.accessory)
}

export const ECO_WIDTH = 303
export const ECO_HEIGHT = 480

function rgb(color: string) {
  return [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16))
}

export function tintEcoPortrait(source: CanvasImageSource, outfit: Outfit) {
  const canvas = document.createElement('canvas')
  canvas.width = ECO_WIDTH
  canvas.height = ECO_HEIGHT
  const context = canvas.getContext('2d')!
  context.drawImage(source, 0, 0, ECO_WIDTH, ECO_HEIGHT)
  if (outfit.fabric === ECO_OUTFIT.fabric && outfit.trim === ECO_OUTFIT.trim) return canvas

  const fabric = rgb(PALETTE[outfit.fabric])
  const trim = rgb(PALETTE[outfit.trim])
  const pixels = context.getImageData(74, 211, 135, 94)
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const offset = (y * pixels.width + x) * 4
      const [red, green, blue, alpha] = pixels.data.subarray(offset, offset + 4)
      if (!alpha) continue
      const isGreen = green > red * 1.035 && green > blue * 1.22 && green > 79
      const isStripe = red >= 185 && green >= red * 0.93 && blue >= green * 0.79
      if (!isGreen && !isStripe) continue
      const base = isGreen ? fabric : trim
      const shade = isGreen ? green / 163 : green / 238
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[offset + channel] = Math.min(255, base[channel] * shade)
      }
    }
  }
  context.putImageData(pixels, 74, 211)
  return canvas
}

export function drawEcoWalk(context: CanvasRenderingContext2D, source: HTMLCanvasElement, phase: number, stride: number) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  context.save()
  context.scale(context.canvas.width / ECO_WIDTH, context.canvas.height / ECO_HEIGHT)
  if (stride < 0.02) {
    context.drawImage(source, 0, 0)
  } else {
    const swing = Math.sin(phase) * stride
    const split = 151
    for (const [left, width, hip, direction] of [[68, split - 68, 125, 1], [split, 92, 169, -1]]) {
      context.save()
      context.translate(hip, 338 - Math.max(0, swing * direction) * 9)
      context.rotate(swing * direction * 0.14)
      context.drawImage(source, left, 337, width, ECO_HEIGHT - 337, left - hip, -1, width, ECO_HEIGHT - 337)
      context.restore()
    }
    context.drawImage(source, 0, 0, ECO_WIDTH, 347, 0, 0, ECO_WIDTH, 347)
  }
  context.restore()
}
