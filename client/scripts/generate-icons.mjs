import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import toIco from 'to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public')
const appDir = path.resolve(__dirname, '../src/app')

const BRAND_BLUE = '#185FA5'
const WHITE = '#FFFFFF'

function roundedRectPath(ctx, x, y, w, h, { tl = 0, tr = 0, br = 0, bl = 0 }) {
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
}

function drawBackground(ctx, size) {
  const radius = size * 0.22
  roundedRectPath(ctx, 0, 0, size, size, { tl: radius, tr: radius, br: radius, bl: radius })
  ctx.fillStyle = BRAND_BLUE
  ctx.fill()
}

// Minimal mark for tiny sizes (16/32px) — rounded square dot, reads cleanly at small scale.
function drawSimpleMark(ctx, size) {
  const dotSize = size * 0.34
  const dotRadius = dotSize * 0.28
  const dx = (size - dotSize) / 2
  const dy = (size - dotSize) / 2
  roundedRectPath(ctx, dx, dy, dotSize, dotSize, { tl: dotRadius, tr: dotRadius, br: dotRadius, bl: dotRadius })
  ctx.fillStyle = WHITE
  ctx.fill()
}

// Full geometric "P" lettermark: vertical stem + D-shaped bowl, drawn as paths.
function drawLettermark(ctx, size) {
  const padding = size * 0.27
  const contentSize = size - padding * 2
  const stroke = contentSize * 0.2

  const stemX = padding
  const stemY = padding
  const stemHeight = contentSize
  const stemRadius = stroke * 0.3

  const bowlWidth = contentSize * 0.82
  const bowlHeight = contentSize * 0.58
  const bowlX = padding
  const bowlY = padding
  const bowlOuterRadius = bowlHeight / 2

  // Outer D shape (flat left edge, semicircular right edge), filled white.
  roundedRectPath(ctx, bowlX, bowlY, bowlWidth, bowlHeight, {
    tl: stroke * 0.35,
    tr: bowlOuterRadius,
    br: bowlOuterRadius,
    bl: stroke * 0.35,
  })
  ctx.fillStyle = WHITE
  ctx.fill()

  // Cut the inner counter out of the bowl, leaving a ring of `stroke` thickness.
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  const innerX = bowlX + stroke
  const innerY = bowlY + stroke
  const innerWidth = bowlWidth - stroke * 2
  const innerHeight = bowlHeight - stroke * 2
  const innerRadius = innerHeight / 2
  roundedRectPath(ctx, innerX, innerY, innerWidth, innerHeight, {
    tl: stroke * 0.2,
    tr: innerRadius,
    br: innerRadius,
    bl: stroke * 0.2,
  })
  ctx.fill()
  ctx.restore()

  // Vertical stem, drawn last so it overlays the bowl's left wall and joins cleanly.
  roundedRectPath(ctx, stemX, stemY, stroke, stemHeight, {
    tl: stemRadius,
    tr: stemRadius,
    br: stemRadius,
    bl: stemRadius,
  })
  ctx.fillStyle = WHITE
  ctx.fill()
}

function renderIcon(size, { simple }) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  drawBackground(ctx, size)
  if (simple) {
    drawSimpleMark(ctx, size)
  } else {
    drawLettermark(ctx, size)
  }
  return canvas
}

const targets = [
  { name: 'icon-16.png', size: 16, simple: true },
  { name: 'icon-32.png', size: 32, simple: true },
  { name: 'icon-192.png', size: 192, simple: false },
  { name: 'icon-512.png', size: 512, simple: false },
  { name: 'apple-touch-icon.png', size: 180, simple: false },
]

for (const { name, size, simple } of targets) {
  const canvas = renderIcon(size, { simple })
  const buffer = canvas.toBuffer('image/png')
  writeFileSync(path.join(outDir, name), buffer)
  console.log(`Generated ${name} (${size}x${size})`)
}

// Build favicon.ico from the 16 and 32px PNG buffers.
// Saved into src/app/ (not public/) — Next.js App Router treats app/favicon.ico
// as a convention route, and a duplicate in public/ causes a routing conflict.
const icoBuffer = await toIco([
  readFileSync(path.join(outDir, 'icon-16.png')),
  readFileSync(path.join(outDir, 'icon-32.png')),
])
writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer)
console.log('Generated src/app/favicon.ico (16x16 + 32x32)')
