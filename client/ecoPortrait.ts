import { ECO_OUTFIT, PALETTE } from '../shared/profile.mjs'
import type { Outfit } from '../shared/profile.mjs'

export { default as ecoPortrait } from './assets/eco-chef.webp'

export function usesEcoPortrait(outfit?: Outfit) {
  return Boolean(outfit && outfit.chef === ECO_OUTFIT.chef && outfit.garment === ECO_OUTFIT.garment)
}

export const ECO_WIDTH = 303
export const ECO_HEIGHT = 480

function rgb(color: string) {
  return [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16))
}

function drawHeadwear(context: CanvasRenderingContext2D, accessory: string) {
  if (accessory === ECO_OUTFIT.accessory) return
  const sprout = context.getImageData(107, 0, 70, 55)
  for (let offset = 0; offset < sprout.data.length; offset += 4) {
    const [red, green, blue] = sprout.data.subarray(offset, offset + 3)
    if (green > red * 1.035 && green > blue * 1.15) sprout.data[offset + 3] = 0
  }
  context.putImageData(sprout, 107, 0)
  context.lineWidth = 3
  context.strokeStyle = '#33252b'

  if (accessory === 'chef') {
    context.beginPath()
    context.moveTo(111, 63)
    context.bezierCurveTo(104, 56, 100, 40, 108, 32)
    context.bezierCurveTo(115, 24, 125, 26, 132, 28)
    context.bezierCurveTo(135, 9, 159, 8, 168, 24)
    context.bezierCurveTo(184, 18, 199, 28, 198, 43)
    context.bezierCurveTo(197, 53, 189, 57, 185, 60)
    context.lineTo(185, 70)
    context.quadraticCurveTo(148, 77, 111, 69)
    context.closePath()
    context.fillStyle = '#fff5e4'
    context.fill()
    context.stroke()
    context.fillStyle = '#e4cbbf'
    context.fillRect(116, 62, 64, 3)
  } else if (accessory === 'songkok') {
    context.beginPath()
    context.roundRect(107, 35, 82, 34, [13, 13, 6, 6])
    context.fillStyle = '#342936'
    context.fill()
    context.stroke()
    context.fillStyle = '#66536a'
    context.fillRect(114, 58, 68, 3)
  } else if (accessory === 'flower') {
    context.fillStyle = '#f3a18f'
    for (const [x, y] of [[190, 55], [201, 61], [197, 73], [184, 73], [180, 61]]) {
      context.beginPath()
      context.arc(x, y, 7, 0, Math.PI * 2)
      context.fill()
    }
    context.beginPath()
    context.arc(190, 64, 5, 0, Math.PI * 2)
    context.fillStyle = '#fff0b2'
    context.fill()
  }
}

export function tintEcoPortrait(source: CanvasImageSource, outfit: Outfit) {
  const canvas = document.createElement('canvas')
  canvas.width = ECO_WIDTH
  canvas.height = ECO_HEIGHT
  const context = canvas.getContext('2d')!
  context.drawImage(source, 0, 0, ECO_WIDTH, ECO_HEIGHT)
  drawHeadwear(context, outfit.accessory)
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
