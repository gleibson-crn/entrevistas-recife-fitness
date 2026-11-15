// Gera os PNGs do ícone do app (sem dependências): `node tools/make-icons.mjs`
// Desenho: fundo laranja do Controle Fitness, folha branca com 3 linhas e marcadores.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [242, 107, 29];
const SHEET = [255, 255, 255];
const INK = [242, 107, 29];
const GREY = [205, 205, 210];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// distância a um retângulo arredondado (negativa dentro)
function rrect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return Math.hypot(x - cx, y - cy) - r;
}

function draw(size, { maskable }) {
  const px = Buffer.alloc(size * size * 3);
  const pad = maskable ? 0.2 : 0.1;
  const s = 1 - pad * 2;
  const U = (v) => (pad + v * s) * size; // normalizado → pixel
  const rows = [0.36, 0.55, 0.74];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = BG;
      if (!maskable) {
        const d = rrect(x, y, 0, 0, size - 1, size - 1, size * 0.22);
        if (d > 0) c = mix(BG, [255, 255, 255], clamp01(d));
      }
      const ds = rrect(x, y, U(0.14), U(0.08), U(0.86), U(0.92), size * 0.06 * s);
      c = mix(c, SHEET, clamp01(0.5 - ds));
      // prendedor
      const dc = rrect(x, y, U(0.34), U(0.02), U(0.66), U(0.16), size * 0.04 * s);
      c = mix(c, [60, 60, 70], clamp01(0.5 - dc));
      for (const ry of rows) {
        const dm = Math.hypot(x - U(0.3), y - U(ry)) - 0.055 * s * size;
        c = mix(c, INK, clamp01(0.5 - dm));
        const dl = rrect(x, y, U(0.42), U(ry - 0.03), U(0.74), U(ry + 0.03), 0.03 * s * size);
        c = mix(c, GREY, clamp01(0.5 - dl));
      }
      px.set(c, (y * size + x) * 3);
    }
  }
  return png(size, px);
}

function png(size, rgb) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const out = new URL('../icons/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('icon-192.png', out), draw(192, { maskable: false }));
writeFileSync(new URL('icon-512.png', out), draw(512, { maskable: false }));
writeFileSync(new URL('icon-maskable-512.png', out), draw(512, { maskable: true }));
writeFileSync(new URL('apple-touch-icon.png', out), draw(180, { maskable: true }));
console.log('Ícones gerados em icons/');
