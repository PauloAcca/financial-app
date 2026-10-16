/**
 * Genera los iconos de marca de Aura (PNG/ICO) sin dependencias:
 * un cuadrado redondeado con gradiente salvia→azul niebla y un aro
 * (aura) en el centro. PNG encoder propio con zlib de Node.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ---------------- PNG encoder ---------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
  return Buffer.concat([len, typeB, data, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------- ICO (PNG embebido) ---------------- */

function encodeIco(pngBuf, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // tipo: icono
  header.writeUInt16LE(1, 4) // cantidad
  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size
  entry[1] = size >= 256 ? 0 : size
  entry.writeUInt16LE(1, 4) // planos
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(pngBuf.length, 8)
  entry.writeUInt32LE(22, 12) // offset
  return Buffer.concat([header, entry, pngBuf])
}

/* ---------------- Render ---------------- */

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const C1 = hex('#8FCBB0') // salvia
const C2 = hex('#A6B9E8') // azul niebla

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// SDF de rectángulo redondeado (coordenadas unitarias 0..1)
function sdRoundRect(x, y, cx, cy, hw, hh, r) {
  const dx = Math.abs(x - cx) - hw + r
  const dy = Math.abs(y - cy) - hh + r
  const ax = Math.max(dx, 0)
  const ay = Math.max(dy, 0)
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ax, ay) - r
}

// Distancia a un círculo (unitaria)
function sdCircle(x, y, r) {
  return Math.hypot(x - 0.5, y - 0.5) - r
}

// Cobertura antialiased a partir de una SDF en píxeles
const cov = (dPx) => clamp01(0.5 - dPx)

function render(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4)
  const S = 1 / size
  const margin = 3 * S // aro exterior dentro del lienzo
  const half = 0.5 - margin
  const corner = 0.225 * (0.5 + half) // radio de esquina relativo
  const scale = maskable ? 0.82 : 1 // zona segura maskable
  const ringR = 0.205 * scale
  const ringW = 0.048 * scale
  const haloR = 0.33 * scale
  const haloW = 0.011 * scale

  for (let y0 = 0; y0 < size; y0++) {
    for (let x0 = 0; x0 < size; x0++) {
      const x = (x0 + 0.5) * S
      const y = (y0 + 0.5) * S

      // Cuadrado redondeado con gradiente diagonal
      const rectD = sdRoundRect(x, y, 0.5, 0.5, half, half, corner) * size
      const aRect = cov(rectD)
      if (aRect <= 0) continue

      const t = clamp01(x * 0.65 + y * 0.35)
      let r = lerp(C1[0], C2[0], t)
      let g = lerp(C1[1], C2[1], t)
      let b = lerp(C1[2], C2[2], t)

      // Brillo suave arriba a la izquierda (luz de vidrio)
      const sheen = Math.max(0, 1 - Math.hypot((x - 0.3) * 2.2, (y - 0.25) * 2.2)) * 0.16
      r += (255 - r) * sheen
      g += (255 - g) * sheen
      b += (255 - b) * sheen

      let alpha = aRect

      // Aros (aura): exterior tenue + interior nítido
      const layers = [
        { a: cov((Math.abs(sdCircle(x, y, haloR)) - haloW * 0.5) * size) * 0.4, w: 0.4 },
        { a: cov((Math.abs(sdCircle(x, y, ringR)) - ringW * 0.5) * size) * 0.96, w: 0.96 },
      ]
      for (const { a: la, w } of layers) {
        if (la <= 0) continue
        const outA = la + alpha * (1 - la)
        r = (255 * w * la + r * alpha * (1 - la)) / (outA || 1)
        g = (255 * w * la + g * alpha * (1 - la)) / (outA || 1)
        b = (255 * w * la + b * alpha * (1 - la)) / (outA || 1)
        alpha = outA
      }

      const idx = (y0 * size + x0) * 4
      px[idx] = Math.round(r)
      px[idx + 1] = Math.round(g)
      px[idx + 2] = Math.round(b)
      px[idx + 3] = Math.round(alpha * 255)
    }
  }
  return encodePng(size, size, px)
}

/* ---------------- Outputs ---------------- */

const outputs = [
  { file: 'src/app/icon.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180 },
  { file: 'src/app/favicon.ico', size: 32, ico: true },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/icon-maskable-512.png', size: 512, maskable: true },
]

for (const { file, size, ico, maskable } of outputs) {
  const buf = render(size, { maskable })
  const out = ico ? encodeIco(buf, size) : buf
  const path = join(ROOT, file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, out)
  console.log(`✓ ${file} (${size}x${size})`)
}
