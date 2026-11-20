import { canChangeSkinTone, CHEFS, ECO_OUTFIT, KAVITHA_OUTFIT, LI_WEN_OUTFIT, PALETTE, SKIN_TONES } from '../shared/profile.mjs'
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

function drawExpression(context: CanvasRenderingContext2D, expression: string, blankBase: boolean) {
  if (expression === 'none' || (expression === 'calm' && !blankBase)) return
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
  } else if (expression !== 'calm') {
    const brow = expression === 'worried' ? 'M104 152 L119 146 M170 146 L184 152' : 'M102 148 L119 155 M169 154 L187 148'
    context.stroke(new Path2D(brow))
  }
  if (['calm', 'wink', 'worried', 'determined'].includes(expression)) {
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
  if (expression === 'worried' || expression === 'calm') {
    context.lineWidth = 2
    context.stroke(new Path2D(expression === 'calm' ? 'M141 181 Q146 184 152 181' : 'M141 183 Q146 178 152 182'))
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
  peace: 'M83 220 Q75 216 75 207 L72 191 Q72 186 77 188 L84 201 L85 188 Q90 185 91 190 L92 202 Q97 202 98 208 Q99 216 91 220 Z',
  wave: 'M83 220 Q76 215 72 208 L66 202 Q64 197 69 198 L76 204 L69 192 Q68 188 72 189 L80 199 L75 185 Q76 180 80 184 L86 197 L85 183 Q89 179 91 184 L94 202 Q98 200 99 205 Q99 216 91 220 Z',
  fist: 'M83 220 Q76 216 75 209 L76 199 Q78 194 82 197 Q86 193 90 197 Q94 194 96 200 L98 208 Q98 216 91 220 Z M78 205 Q86 202 91 207',
  point: 'M83 220 Q75 214 76 206 L78 196 L76 186 Q77 181 81 184 L88 200 Q95 195 97 204 L98 210 Q97 216 91 220 Z',
  okay: 'M83 220 Q75 216 75 207 Q73 201 77 198 L73 192 Q72 188 76 189 L82 196 L80 186 Q83 182 86 186 L89 198 Q95 198 98 205 Q101 216 91 220 Z M84 204 Q92 200 94 207 Q90 212 85 210 Q82 208 84 204 Z'
}

function drawHandSign(context: CanvasRenderingContext2D, handSign: string, baseSkin?: string) {
  const outline = handPaths[handSign]
  if (!outline || (!baseSkin && handSign === 'peace')) return
  const skin = baseSkin ?? sampleColour(context, 89, 218)
  if (!baseSkin) {
    context.save()
    context.globalCompositeOperation = 'destination-out'
    context.fill(new Path2D('M72 188 L92 186 L98 204 L99 217 L93 221 L82 220 L71 210 Z'))
    context.restore()
  }
  context.fillStyle = skin
  context.strokeStyle = '#65434a'
  context.lineWidth = 1.8
  context.lineJoin = 'round'
  const path = new Path2D(outline)
  context.fill(path, 'evenodd')
  context.stroke(path)
}

function drawBaseBody(context: CanvasRenderingContext2D, skin: string, handSign: string) {
  const leftArm = handSign === 'relaxed'
    ? 'L100 299 Q91 310 80 308 Q70 306 78 296 L91 280 Q108 253 114 230'
    : 'L111 257 Q88 240 83 220 L95 215 Q106 232 115 234 L119 223'
  const body = new Path2D(`M137 197 L164 197 L164 211 Q181 215 189 235
    Q198 270 223 297 Q233 308 221 311 Q210 310 201 299 L181 276
    Q183 311 191 333 Q199 353 186 390 L189 452 Q195 465 182 467
    L162 467 Q154 466 154 456 L150 353 L143 353 L139 456
    Q139 467 128 467 L107 467 Q98 466 103 453 L107 392 Q96 354 107 329
    Q116 308 120 275 ${leftArm} Q119 217 137 211 Z`)
  context.fillStyle = skin
  context.strokeStyle = '#65434a'
  context.lineWidth = 2.5
  context.fill(body)
  context.stroke(body)
  if (handSign !== 'relaxed') drawHandSign(context, handSign, skin)
  const head = new Path2D('M77 143 Q60 136 60 152 Q60 173 80 178 Q98 206 148 207 Q199 207 218 178 Q238 171 238 154 Q236 138 221 143 Q235 107 209 75 Q184 46 149 46 Q107 46 83 79 Q62 107 77 143 Z')
  context.fillStyle = skin
  context.fill(head)
  context.stroke(head)
}

function drawHairstyle(context: CanvasRenderingContext2D, outfit: Outfit) {
  if (outfit.hairStyle === 'none') return
  const hair = '#' + CHEFS[outfit.chef].hair.toString(16).padStart(6, '0')
  context.fillStyle = hair
  context.strokeStyle = '#261c26'
  context.lineWidth = 2.5
  const cap = new Path2D(outfit.chef === LI_WEN_OUTFIT.chef ?
    'M77 150 Q64 135 67 107 Q69 80 90 67 Q108 43 150 43 Q194 42 215 67 Q234 77 233 111 Q234 131 222 150 L213 137 Q213 109 198 101 Q186 94 168 101 Q138 111 108 98 Q91 91 86 112 L85 137 Z' :
    outfit.chef === 'ayu' ?
    'M77 151 Q62 133 64 109 Q64 84 91 66 Q113 47 137 46 Q151 36 166 46 Q192 49 217 70 Q240 89 232 118 Q231 136 219 151 L210 132 Q213 115 200 107 Q184 108 171 98 Q153 103 140 98 Q129 103 117 101 Q105 108 95 108 Q85 120 83 146 Z' :
    'M74 140 Q60 114 81 78 Q105 42 148 42 Q196 41 220 75 Q238 103 225 141 L214 130 Q209 113 203 105 Q177 124 142 122 Q115 134 86 126 L78 145 Z')
  context.fill(cap)
  context.stroke(cap)

  if (outfit.hairStyle === 'bun') {
    context.beginPath()
    context.ellipse(169, 40, 27, 21, -0.23, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  } else if (outfit.hairStyle === 'bob') {
    for (const path of ['M77 117 Q66 127 67 172 Q69 193 92 202 Q79 176 91 128 Z', 'M219 114 Q236 126 234 170 Q232 193 208 202 Q220 171 209 132 Z']) {
      const side = new Path2D(path)
      context.fill(side)
      context.stroke(side)
    }
  } else if (outfit.hairStyle === 'braids') {
    for (const side of [-1, 1]) {
      for (let segment = 0; segment < 5; segment++) {
        context.beginPath()
        context.ellipse(150 + side * (75 + segment * 2), 137 + segment * 14, 12 - segment, 12, side * 0.25, 0, Math.PI * 2)
        context.fill()
        context.stroke()
      }
    }
  }
}

export function garmentHem(garment: string) {
  return ({ cheongsam: 388, saree: 399, bajuKurung: 434, kurta: 366, samfu: 350, bajuMelayu: 354 } as Record<string, number>)[garment] ?? 347
}

function drawBajuMelayu(context: CanvasRenderingContext2D, outfit: Outfit) {
  const cloth = PALETTE[outfit.fabric]
  const trim = PALETTE[outfit.trim]
  context.fillStyle = cloth
  context.strokeStyle = '#65434a'
  context.lineWidth = 2.5
  const leftSleeve = outfit.handSign === 'relaxed'
    ? 'M114 223 Q105 234 90 268 L79 292 L96 300 L120 274 Z'
    : 'M119 223 L112 234 L96 216 L84 224 Q90 243 113 260 L122 271 Z'
  const outfitPaths = [
    'M110 325 L151 326 L145 353 L141 448 Q122 455 104 448 L108 395 Q98 353 110 325 Z',
    'M148 325 L188 324 Q196 350 185 390 L189 448 Q171 455 154 449 L151 365 Z',
    leftSleeve,
    'M180 225 Q191 231 198 251 Q210 278 223 296 L207 301 L182 274 Z',
    'M111 222 Q122 212 137 211 Q149 223 164 212 Q178 215 187 226 L184 291 Q151 302 113 290 Z'
  ]
  for (const path of outfitPaths) {
    const piece = new Path2D(path)
    context.fill(piece)
    context.stroke(piece)
  }
  context.fillStyle = trim
  context.fill(new Path2D('M104 448 Q122 453 141 448 L139 458 Q138 467 127 467 L108 467 Q98 466 104 448 Z M153 449 Q171 454 189 448 Q195 465 182 467 L162 467 Q155 465 153 449 Z'))

  const sampin = new Path2D('M112 286 Q151 295 185 286 L194 344 Q151 355 104 344 Z')
  context.fill(sampin)
  context.save()
  context.clip(sampin)
  context.strokeStyle = '#f3d58c'
  context.lineWidth = 5
  for (let x = 82; x < 232; x += 12) {
    context.stroke(new Path2D(`M${x} 280 l-41 74`))
  }
  context.restore()
  context.stroke(sampin)
}

function drawLiWenSamfu(context: CanvasRenderingContext2D, handSign: string) {
  const relaxed = handSign === 'relaxed'
  function piece(outline: string, color: string) {
    const path = new Path2D(outline)
    context.fillStyle = color
    context.fill(path)
    context.stroke(path)
  }
  context.lineJoin = 'round'
  context.strokeStyle = '#682631'
  context.lineWidth = 3
  piece('M109 326 Q148 315 191 326 Q199 350 185 391 L188 449 Q170 459 153 449 L149 363 L141 449 Q119 458 103 448 L107 393 Q97 351 109 326 Z', '#a92b36')
  piece('M103 448 Q121 454 141 449 L139 461 Q122 474 103 465 Z M153 449 Q171 455 188 449 Q196 467 180 468 Q164 468 154 460 Z', '#332832')
  piece('M178 222 Q191 225 201 248 L225 293 Q214 301 201 301 L179 269 Z', '#d6373f')
  piece(relaxed ? 'M119 219 Q103 222 94 246 L77 290 Q87 303 101 298 L122 265 Z'
    : 'M120 223 L109 234 L96 214 L81 223 Q86 246 113 266 L123 260 Z', '#d6373f')
  piece('M199 293 L219 282 L226 295 Q216 304 203 303 Z', '#f4c760')
  piece(relaxed ? 'M82 279 L105 287 L100 299 Q86 303 77 291 Z'
    : 'M81 222 L95 215 L103 228 L87 238 Z', '#f4c760')
  piece('M112 222 Q126 209 135 210 L136 204 Q149 213 164 204 L165 211 Q178 212 187 224 L185 272 L196 338 Q179 347 154 346 L149 336 L143 346 Q118 346 103 338 L114 273 Z', '#df3c43')
  context.strokeStyle = '#861e2c'
  context.stroke(new Path2D('M135 211 Q141 221 150 222 Q159 219 166 211 M150 222 L149 336'))
  context.strokeStyle = '#f4c760'
  context.lineCap = 'round'
  for (const y of [230, 254, 278, 302]) {
    context.stroke(new Path2D(`M138 ${y} h22 m-22 0 q-4 -5 -6 0 q2 5 6 0 m22 0 q4 -5 6 0 q-2 5 -6 0`))
  }
  context.stroke(new Path2D('M113 329 Q117 316 130 318 Q126 309 119 314 M114 330 Q123 323 132 328 M184 329 Q180 316 167 318 Q171 309 178 314 M183 330 Q174 323 165 328'))
}

function drawKavithaKurta(context: CanvasRenderingContext2D, handSign: string) {
  const cream = '#f3df9f'
  const red = '#ac2531'
  const pieces = [
    [red, 'M107 343 L192 343 Q195 368 185 396 L188 446 Q173 454 154 446 L149 379 L141 446 Q122 453 103 446 L107 392 Q99 373 107 343 Z'],
    [red, 'M104 446 Q121 455 141 449 L139 461 Q125 473 103 465 Z M154 449 Q172 455 188 446 Q196 467 180 468 Q162 468 154 461 Z'],
    [cream, handSign === 'relaxed'
      ? 'M116 220 Q104 226 95 249 L77 290 Q86 300 100 297 L121 264 Z'
      : 'M118 219 L108 234 L96 215 L81 222 Q85 246 113 265 L122 253 Z'],
    [cream, 'M179 220 Q195 226 201 249 L223 292 Q213 303 201 300 L180 270 Z'],
    [cream, 'M112 221 Q123 213 135 211 L137 204 L150 216 L163 204 L166 211 Q181 214 187 224 L183 268 L195 355 Q151 372 103 355 L115 268 Z'],
    ['#fbefc6', 'M105 345 Q151 362 193 345 L195 355 Q151 372 103 355 Z'],
    [red, 'M122 215 Q128 210 135 211 L132 342 Q125 350 116 342 Z M165 211 Q172 210 179 216 L183 342 Q175 349 166 342 Z']
  ]
  context.lineJoin = 'round'
  context.strokeStyle = '#65434a'
  context.lineWidth = 2.5
  for (const [color, outline] of pieces) {
    const path = new Path2D(outline)
    context.fillStyle = color
    context.fill(path)
    context.stroke(path)
  }
  context.strokeStyle = '#957044'
  context.lineWidth = 1.5
  context.stroke(new Path2D('M137 211 L150 225 L163 211 M150 225 L150 353 M81 288 L101 296 M203 290 L220 283'))
  for (const y of [238, 257, 276, 295]) {
    context.beginPath()
    context.arc(155, y, 2.8, 0, Math.PI * 2)
    context.fillStyle = '#d9ab51'
    context.fill()
    context.stroke()
  }
}

function drawBajuKurung(context: CanvasRenderingContext2D, outfit: Outfit) {
  const cloth = PALETTE[outfit.fabric]
  const scarf = PALETTE[outfit.trim]
  const skirt = 'rgb(' + rgb(cloth).map(channel => Math.round(channel * 0.77)).join(', ') + ')'
  const leftSleeve = outfit.handSign === 'relaxed'
    ? 'M116 218 Q102 227 92 250 L77 292 Q87 300 101 298 L123 262 Z'
    : 'M119 218 L110 233 L95 215 L82 223 Q87 246 111 265 L123 263 Z'
  const pieces = [
    [skirt, 'M112 329 L185 329 Q187 383 194 428 Q168 439 146 431 Q125 437 103 431 Z'],
    [cloth, leftSleeve],
    [cloth, 'M178 219 Q192 225 201 250 L224 294 Q213 302 201 301 L179 269 Z'],
    [cloth, 'M111 221 Q120 212 135 211 Q150 224 164 211 Q179 212 189 225 L181 273 Q187 323 198 368 Q152 383 101 369 Q112 318 117 273 Z']
  ]
  context.save()
  context.lineJoin = 'round'
  context.lineWidth = 2.5
  context.strokeStyle = '#473442'
  for (const [color, outline] of pieces) {
    const path = new Path2D(outline)
    context.fillStyle = color
    context.fill(path)
    context.stroke(path)
  }
  context.lineWidth = 1.5
  context.stroke(new Path2D('M124 318 Q120 347 119 371 M158 379 L151 430'))
  context.fillStyle = scarf
  if (outfit.hairStyle === 'none') {
    const hijab = new Path2D('M68 155 Q59 90 100 57 Q145 23 192 53 Q233 76 233 142 Q232 185 201 207 Q192 210 185 217 Q176 248 153 254 Q128 250 111 230 L101 214 Q73 199 68 155 Z M90 143 Q91 111 116 94 Q144 76 173 91 Q200 104 209 135 Q204 181 177 196 Q146 215 118 191 Q95 176 90 143 Z')
    context.fill(hijab, 'evenodd')
    context.stroke(hijab)
  } else {
    const drape = new Path2D('M105 216 Q120 203 135 208 Q149 223 164 207 Q179 207 191 218 Q174 250 153 254 Q127 248 105 216 Z')
    context.fill(drape)
    context.stroke(drape)
  }
  context.globalAlpha = 0.45
  context.stroke(new Path2D('M115 220 Q148 246 178 221 M124 231 Q150 249 169 233'))
  context.restore()
}

function drawGarment(context: CanvasRenderingContext2D, outfit: Outfit, blankBase = false) {
  if (outfit.garment === 'none' || (outfit.garment === 'striped' && !blankBase)) return
  if (outfit.chef === LI_WEN_OUTFIT.chef) {
    drawLiWenSamfu(context, outfit.handSign)
    return
  }
  if (outfit.chef === KAVITHA_OUTFIT.chef) {
    drawKavithaKurta(context, outfit.handSign)
    return
  }
  if (outfit.garment === 'bajuMelayu') {
    drawBajuMelayu(context, outfit)
    return
  }
  if (outfit.garment === 'bajuKurung') {
    drawBajuKurung(context, outfit)
    return
  }
  if (outfit.garment === 'striped') {
    const shirt = new Path2D('M116 224 Q127 212 138 212 Q147 226 163 212 Q179 214 185 229 L185 288 Q150 297 113 288 Z')
    context.fillStyle = PALETTE[outfit.fabric]
    context.fill(shirt)
    context.save()
    context.clip(shirt)
    context.fillStyle = PALETTE[outfit.trim]
    for (const y of [232, 251, 270]) context.fillRect(106, y, 84, 8)
    context.restore()
    context.strokeStyle = '#473037'
    context.stroke(shirt)
    context.fillStyle = '#334520'
    context.fill(new Path2D('M113 289 L184 289 L195 346 L151 344 L146 336 L141 345 L103 345 Z'))
    return
  }
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
  }
}

function drawHeadwear(context: CanvasRenderingContext2D, accessory: string, blankBase: boolean) {
  if (blankBase && accessory === 'sprout') {
    context.strokeStyle = '#638441'
    context.lineWidth = 3
    context.stroke(new Path2D('M150 50 Q153 36 145 31'))
    context.fillStyle = '#88ab58'
    context.fill(new Path2D('M149 39 Q132 39 128 28 Q143 24 149 39 M151 36 Q155 22 171 26 Q167 39 151 36'))
    return
  }
  if (accessory === ECO_OUTFIT.accessory) return
  if (!blankBase) {
  const sprout = context.getImageData(107, 0, 70, 55)
  for (let offset = 0; offset < sprout.data.length; offset += 4) {
    const [red, green, blue] = sprout.data.subarray(offset, offset + 3)
    if (green > red * 1.035 && green > blue * 1.15) sprout.data[offset + 3] = 0
  }
  context.putImageData(sprout, 107, 0)
  }
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

function tintIllustratedSkin(context: CanvasRenderingContext2D, tone: string) {
  const pixels = context.getImageData(0, 0, ECO_WIDTH, ECO_HEIGHT)
  const original = pixels.data.subarray((164 * ECO_WIDTH + 145) * 4, (164 * ECO_WIDTH + 145) * 4 + 3)
  const shift = rgb(tone).map((value, channel) => value - original[channel])
  for (let y = 140; y < 460; y++) {
    for (let x = 65; x < 235; x++) {
      // Exclude the striped shirt and hair accessory from skin recolouring.
      const skinRegion = y <= 207 || (y <= 223 && x >= 123 && x <= 164) ||
        (y <= 226 && x <= 102) || (y >= 295 && y <= 320 && x >= 190) || y >= 335
      if (!skinRegion) continue
      const offset = (y * ECO_WIDTH + x) * 4
      const [r, g, b, alpha] = pixels.data.subarray(offset, offset + 4)
      if (!alpha || r < 205 || r - g < 14 || g - b < 4) continue
      for (let channel = 0; channel < 3; channel++) pixels.data[offset + channel] += shift[channel]
    }
  }
  context.putImageData(pixels, 0, 0)
}

export function tintEcoPortrait(source: CanvasImageSource, outfit: Outfit) {
  const canvas = document.createElement('canvas')
  canvas.width = ECO_WIDTH
  canvas.height = ECO_HEIGHT
  const context = canvas.getContext('2d')!
  const blankBase = outfit.chef !== ECO_OUTFIT.chef
  const tone = canChangeSkinTone(outfit.chef) && outfit.skinTone != null ? SKIN_TONES[outfit.skinTone] : undefined
  if (blankBase) {
    const skin = tone ?? '#' + CHEFS[outfit.chef].skin.toString(16).padStart(6, '0')
    drawBaseBody(context, skin, outfit.handSign)
    drawHairstyle(context, outfit)
  } else {
    context.drawImage(source, 0, 0, ECO_WIDTH, ECO_HEIGHT)
    if (tone) tintIllustratedSkin(context, tone)
    drawHandSign(context, outfit.handSign)
  }
  const bajuKurung = blankBase && outfit.garment === 'bajuKurung'
  if (bajuKurung) drawGarment(context, outfit, true)
  drawHeadwear(context, outfit.accessory, blankBase)
  drawExpression(context, outfit.expression, blankBase)
  if (blankBase) {
    if (!bajuKurung) drawGarment(context, outfit, true)
    return canvas
  }
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
