import { CHEFS, ECO_OUTFIT, PALETTE } from '../shared/profile.mjs'
import type { Outfit } from '../shared/profile.mjs'

export { default as ecoPortrait } from './assets/eco-chef.webp'

export function usesEcoPortrait(outfit?: Outfit) {
  return Boolean(outfit && Object.hasOwn(CHEFS, outfit.chef))
}

export const ECO_WIDTH = 303
export const ECO_HEIGHT = 480

function rgb(color: string) {
  return [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16))
}

function sampleColour(context: CanvasRenderingContext2D, x: number, y: number) {
  const [r, g, b] = context.getImageData(x, y, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}

function drawExpression(context: CanvasRenderingContext2D, expression: string) {
  if (expression === 'calm') return
  const skin = sampleColour(context, 145, 164)
  for (const [x, y, rx, ry] of [[111, 162, 17, 16], [177, 163, 17, 16], [146, 180, 10, 6]]) {
    context.fillStyle = skin
    context.beginPath()
    context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    context.fill()
  }
  context.lineCap = 'round'
  context.lineWidth = 3.4
  context.strokeStyle = '#452830'
  const arc = 'M102 168 Q111 154 122 166'
  const arcRight = 'M167 166 Q177 154 187 168'
  if (expression === 'happy' || expression === 'wink') {
    context.stroke(new Path2D(arcRight))
    if (expression === 'happy') context.stroke(new Path2D(arc))
  } else if (expression === 'sleepy') {
    context.stroke(new Path2D('M103 166 Q112 169 121 166 M168 166 Q177 169 186 166'))
  } else {
    const brow = expression === 'worried' ? 'M104 152 L119 146 M170 146 L184 152' : 'M102 148 L119 155 M169 154 L187 148'
    context.stroke(new Path2D(brow))
  }
  if (['wink', 'worried', 'determined'].includes(expression)) {
    for (const x of expression === 'wink' ? [111] : [111, 177]) {
      context.fillStyle = '#583840'
      context.beginPath()
      context.ellipse(x, 164, 6, 8, 0, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#fff3e6'
      context.beginPath()
      context.arc(x - 2, 161, 2, 0, Math.PI * 2)
      context.fill()
    }
  }
  if (expression === 'worried') {
    context.lineWidth = 2
    context.stroke(new Path2D('M141 183 Q146 178 152 182'))
    return
  }
  const mouth = expression === 'sleepy'
    ? new Path2D('M142 182 Q146 177 150 182 Q151 186 146 186 Q141 185 142 182')
    : new Path2D('M137 177 Q146 180 155 177 Q152 190 146 190 Q140 189 137 177')
  context.fillStyle = '#da8f91'
  context.fill(mouth)
  context.lineWidth = 1.4
  context.stroke(mouth)
}

const handPaths: Record<string, string> = {
  wave: 'M83 220 Q76 215 72 208 L66 202 Q64 197 69 198 L76 204 L69 192 Q68 188 72 189 L80 199 L75 185 Q76 180 80 184 L86 197 L85 183 Q89 179 91 184 L94 202 Q98 200 99 205 Q99 216 91 220 Z',
  fist: 'M83 220 Q76 216 75 209 L76 199 Q78 194 82 197 Q86 193 90 197 Q94 194 96 200 L98 208 Q98 216 91 220 Z M78 205 Q86 202 91 207',
  point: 'M83 220 Q75 214 76 206 L78 196 L76 186 Q77 181 81 184 L88 200 Q95 195 97 204 L98 210 Q97 216 91 220 Z',
  okay: 'M83 220 Q75 216 75 207 Q73 201 77 198 L73 192 Q72 188 76 189 L82 196 L80 186 Q83 182 86 186 L89 198 Q95 198 98 205 Q101 216 91 220 Z M84 204 Q92 200 94 207 Q90 212 85 210 Q82 208 84 204 Z'
}

function drawHandSign(context: CanvasRenderingContext2D, handSign: string) {
  const outline = handPaths[handSign]
  if (!outline) return
  const skin = sampleColour(context, 89, 218)
  context.save()
  context.globalCompositeOperation = 'destination-out'
  context.fill(new Path2D('M72 188 L92 186 L98 204 L99 217 L93 221 L82 220 L71 210 Z'))
  context.restore()
  context.fillStyle = skin
  context.strokeStyle = '#65434a'
  context.lineWidth = 1.8
  context.lineJoin = 'round'
  const path = new Path2D(outline)
  context.fill(path, 'evenodd')
  context.stroke(path)
}

function tintCharacter(context: CanvasRenderingContext2D, outfit: Outfit) {
  if (outfit.chef === ECO_OUTFIT.chef) return
  const chef = CHEFS[outfit.chef]
  const skin = rgb('#' + chef.skin.toString(16).padStart(6, '0'))
  const hair = rgb('#' + chef.hair.toString(16).padStart(6, '0'))
  const pixels = context.getImageData(0, 52, ECO_WIDTH, ECO_HEIGHT - 52)
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const i = (y * pixels.width + x) * 4
      const [red, green, blue, alpha] = pixels.data.subarray(i, i + 4)
      if (!alpha) continue
      const onHair = y < 168 && (y < 79 || x < 89 || x > 205)
      const foxClip = onHair && x > 75 && x < 132 && y > 36 && y < 86 && red > 150 && red > blue * 1.35
      const tone = onHair && (Math.max(red, green, blue) < 73 || foxClip) ? hair :
        red > 190 && green < red * 0.95 && blue < green * 0.98 ? skin : null
      if (!tone) continue
      const shade = tone === skin ? red / 250 : foxClip ? 1 : Math.max(0.65, red / 34)
      for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] = tone[channel] * shade
    }
  }
  context.putImageData(pixels, 0, 52)
}

export function garmentHem(garment: string) {
  return ({ cheongsam: 388, saree: 399, bajuKurung: 390, kurta: 366, samfu: 350, bajuMelayu: 354 } as Record<string, number>)[garment] ?? 347
}

function drawGarment(context: CanvasRenderingContext2D, outfit: Outfit) {
  if (outfit.garment === 'striped') return
  const hem = garmentHem(outfit.garment)
  const fitted = outfit.garment === 'cheongsam'
  const trim = PALETTE[outfit.trim]
  context.beginPath()
  context.moveTo(100, 224)
  context.quadraticCurveTo(108, 211, 128, 209)
  context.lineTo(131, fitted ? 200 : 209)
  context.quadraticCurveTo(144, 205, 158, fitted ? 199 : 208)
  context.lineTo(163, 209)
  context.quadraticCurveTo(179, 213, 185, 226)
  context.quadraticCurveTo(181, 253, fitted ? 171 : 180, 266)
  context.bezierCurveTo(175, 282, 196, hem - 33, 199, hem - 12)
  context.quadraticCurveTo(199, hem + 6, 151, hem)
  context.quadraticCurveTo(97, hem + 3, 93, hem - 13)
  context.quadraticCurveTo(97, 309, fitted ? 116 : 103, 270)
  context.quadraticCurveTo(107, 250, 100, 224)
  context.closePath()
  context.lineWidth = 3.5
  context.strokeStyle = '#473037'
  context.fillStyle = PALETTE[outfit.fabric]
  context.fill()
  context.stroke()
  context.strokeStyle = trim
  context.lineCap = 'round'
  if (fitted || outfit.garment === 'samfu') {
    context.beginPath()
    context.moveTo(132, 205)
    context.quadraticCurveTo(144, 211, 157, 204)
    context.moveTo(151, 212)
    context.quadraticCurveTo(145, 237, 120, 250)
    context.stroke()
    for (const [x, y] of [[148, 218], [142, 228], [134, 237]]) {
      context.beginPath()
      context.moveTo(x - 4, y - 3)
      context.lineTo(x + 5, y + 4)
      context.stroke()
    }
    if (fitted) {
      context.beginPath()
      context.moveTo(184, hem - 7)
      context.lineTo(175, hem - 39)
      context.stroke()
    }
  } else if (outfit.garment === 'saree') {
    context.lineWidth = 10
    context.beginPath()
    context.moveTo(115, 220)
    context.quadraticCurveTo(137, 264, 176, 288)
    context.lineTo(178, hem - 8)
    context.stroke()
  } else {
    context.beginPath()
    context.moveTo(130, 216)
    context.quadraticCurveTo(145, 232, 160, 216)
    context.moveTo(145, 225)
    context.lineTo(145, outfit.garment === 'kurta' ? 270 : 248)
    context.moveTo(104, hem - 9)
    context.quadraticCurveTo(150, hem - 3, 191, hem - 9)
    context.stroke()
    if (outfit.garment === 'bajuMelayu') {
      context.fillStyle = trim
      context.fillRect(103, 283, 87, 9)
    }
  }
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
  tintCharacter(context, outfit)
  drawHeadwear(context, outfit.accessory)
  drawExpression(context, outfit.expression)
  drawHandSign(context, outfit.handSign)
  if (outfit.garment === 'striped' && outfit.fabric === ECO_OUTFIT.fabric && outfit.trim === ECO_OUTFIT.trim) return canvas

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
      const base = isGreen || outfit.garment !== 'striped' ? fabric : trim
      const shade = isGreen ? green / 163 : green / 238
      for (let channel = 0; channel < 3; channel++) {
        pixels.data[offset + channel] = Math.min(255, base[channel] * shade)
      }
    }
  }
  context.putImageData(pixels, 74, 211)
  drawGarment(context, outfit)
  return canvas
}

export function drawEcoWalk(context: CanvasRenderingContext2D, source: HTMLCanvasElement, phase: number, stride: number, hem: number) {
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
      context.translate(hip, hem - 8 - Math.max(0, swing * direction) * 9)
      context.rotate(swing * direction * 0.14)
      context.drawImage(source, left, hem - 10, width, ECO_HEIGHT - hem + 10, left - hip, -2, width, ECO_HEIGHT - hem + 10)
      context.restore()
    }
    context.drawImage(source, 0, 0, ECO_WIDTH, hem, 0, 0, ECO_WIDTH, hem)
  }
  context.restore()
}
