// Codec PNG mínimo, JS puro (roda em Cloudflare Workers, sem Node nativo).
// Usa `fflate` só para o zlib. Decodifica PNG não entrelaçado (tipos 0/2/3/4/6,
// 8 ou 16 bits; 16 bits vira 8 pela metade alta) e codifica RGBA 8 bits.
// Existe para o chroma-key do sprite (`_chroma.js`, §48).
import { unzlibSync, zlibSync } from 'fflate';

const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const u32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

/** @param {Uint8Array} bytes @returns {{ width: number, height: number, data: Uint8Array }} RGBA */
export function decodePng(bytes) {
  for (let i = 0; i < 8; i++) if (bytes[i] !== SIG[i]) throw new Error('png: assinatura inválida');
  let pos = 8;
  let width = 0, height = 0, depth = 0, ctype = -1, interlace = 0;
  /** @type {Uint8Array | null} */
  let palette = null;
  /** @type {Uint8Array | null} */
  let trns = null;
  const idat = [];
  while (pos + 8 <= bytes.length) {
    const len = u32(bytes, pos);
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const body = bytes.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = u32(body, 0); height = u32(body, 4); depth = body[8]; ctype = body[9]; interlace = body[12];
    } else if (type === 'PLTE') palette = body;
    else if (type === 'tRNS') trns = body;
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (!width || !height || !(ctype in CHANNELS)) throw new Error('png: cabeçalho inválido');
  if (width * height > 16_000_000) throw new Error('png: grande demais');
  if (interlace) throw new Error('png: entrelaçado não suportado');
  if (depth !== 8 && depth !== 16) throw new Error('png: profundidade não suportada');
  if (ctype === 3 && (depth !== 8 || !palette)) throw new Error('png: paleta inválida');
  const total = idat.reduce((n, c) => n + c.length, 0);
  const comp = new Uint8Array(total);
  let o = 0;
  for (const c of idat) { comp.set(c, o); o += c.length; }
  const raw = unzlibSync(comp);

  const bpp = CHANNELS[ctype] * (depth / 8);
  const stride = width * bpp;
  if (raw.length < (stride + 1) * height) throw new Error('png: dados truncados');
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0;
      const b = y > 0 ? px[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (f !== 0) throw new Error('png: filtro inválido');
      px[dst + x] = v & 255;
    }
  }

  const out = new Uint8Array(width * height * 4);
  const step = depth / 8; // 2 => pega o byte alto
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * bpp, d = i * 4;
    if (ctype === 6) { out[d] = px[s]; out[d + 1] = px[s + step]; out[d + 2] = px[s + 2 * step]; out[d + 3] = px[s + 3 * step]; }
    else if (ctype === 2) { out[d] = px[s]; out[d + 1] = px[s + step]; out[d + 2] = px[s + 2 * step]; out[d + 3] = 255; }
    else if (ctype === 0) { out[d] = out[d + 1] = out[d + 2] = px[s]; out[d + 3] = 255; }
    else if (ctype === 4) { out[d] = out[d + 1] = out[d + 2] = px[s]; out[d + 3] = px[s + step]; }
    else {
      const k = px[s];
      if (!palette) throw new Error("png: paleta inválida");
      out[d] = palette[k * 3]; out[d + 1] = palette[k * 3 + 1]; out[d + 2] = palette[k * 3 + 2];
      out[d + 3] = trns && k < trns.length ? trns[k] : 255;
    }
  }
  return { width, height, data: out };
}

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** @param {number} width @param {number} height @param {Uint8Array} rgba @returns {Uint8Array} */
export function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width); dv.setUint32(4, height);
  ihdr[8] = 8; ihdr[9] = 6;
  const parts = [Uint8Array.from(SIG), chunk('IHDR', ihdr), chunk('IDAT', zlibSync(raw, { level: 6 })), chunk('IEND', new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
