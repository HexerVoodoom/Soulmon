// Chroma-key do sprite de Soulmon (§48). O gerador por API (Higgsfield 2.0 Alpha /
// 2.5 Flare) NÃO devolve alfa: o prompt pede fundo verde #00FF00 e AQUI o fundo vira
// transparência. Equivalente em JS do `key()`/`final()` de referência validado em
// Python (E:\soulmon-sprites-teste\tools\post.py). Puro: bytes PNG -> bytes PNG RGBA.
import { decodePng, encodePng } from './_png.js';

/** Fundo: g > 150 e (g - max(r,b)) > 60. Borda suave: d entre 35 e 60 (alfa
 *  linear), depois binarizada em alfa > 128 (a arte é pixel art plana). */
const BG_G_MIN = 150;
const BG_D_MIN = 60;
const EDGE_D_MIN = 35;
const EDGE_SPAN = 25;
const MIN_ISLAND = 24;
/** Fundo removido abaixo disto => a imagem não veio com fundo verde. */
const MIN_BG_FRACTION = 0.1;
/** Verde "furado" (não ligado à borda) acima disto do sprite => criatura verde. */
const MAX_HOLE_FRACTION = 0.25;

export class BadChromaError extends Error {
  constructor(detail) {
    super(`bad-chroma: ${detail}`);
    this.code = 'bad-chroma';
  }
}

/** Chroma-key sobre RGBA (muta e devolve as métricas). */
export function keyRgba(width, height, rgba) {
  const n = width * height;
  const alpha = new Uint8Array(n);
  const isBg = new Uint8Array(n);
  let bgCount = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
    const m = r > b ? r : b;
    const d = g - m;
    const bg = g > BG_G_MIN && d > BG_D_MIN;
    const al = bg ? 0 : d > EDGE_D_MIN ? 255 * (1 - (d - EDGE_D_MIN) / EDGE_SPAN) : 255;
    if (bg) { isBg[i] = 1; bgCount++; }
    if (d > 0) rgba[p + 1] = m; // despill: nunca sobra g acima de max(r,b)
    alpha[i] = al > 128 ? 255 : 0;
  }
  const stack = new Int32Array(n);
  // Ilhas pequenas (4-conectividade) somem.
  const seen = new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    if (!alpha[s] || seen[s]) continue;
    let top = 0, size = 0;
    stack[top++] = s; seen[s] = 1;
    const members = [];
    while (top) {
      const i = stack[--top];
      size++;
      if (size <= MIN_ISLAND) members.push(i);
      const x = i % width;
      if (x > 0 && alpha[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack[top++] = i - 1; }
      if (x < width - 1 && alpha[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack[top++] = i + 1; }
      if (i >= width && alpha[i - width] && !seen[i - width]) { seen[i - width] = 1; stack[top++] = i - width; }
      if (i < n - width && alpha[i + width] && !seen[i + width]) { seen[i + width] = 1; stack[top++] = i + width; }
    }
    if (size < MIN_ISLAND) for (const i of members) alpha[i] = 0;
  }
  // Verde que NÃO toca a borda = buraco dentro da criatura (verde próprio).
  const reach = new Uint8Array(n);
  let top = 0;
  const seed = i => { if (isBg[i] && !reach[i]) { reach[i] = 1; stack[top++] = i; } };
  for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + width - 1); }
  while (top) {
    const i = stack[--top];
    const x = i % width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (i >= width) seed(i - width);
    if (i < n - width) seed(i + width);
  }
  let holes = 0, opaque = 0;
  for (let i = 0; i < n; i++) {
    if (isBg[i] && !reach[i]) holes++;
    if (alpha[i]) opaque++;
    rgba[i * 4 + 3] = alpha[i];
  }
  return { bgFraction: bgCount / n, opaque, holeFraction: holes + opaque ? holes / (holes + opaque) : 0 };
}

/**
 * PNG com fundo verde -> PNG RGBA recortado pela bounding box, canvas quadrado com
 * margem de 4% (mín. 2 px), sem reescalar. Lança `BadChromaError` quando o resultado
 * não é confiável: sem fundo verde, criatura verde demais ou nada sobrou.
 * @param {Uint8Array} pngBytes @returns {Uint8Array}
 */
export function chromaKeyPng(pngBytes) {
  const { width, height, data } = decodePng(pngBytes);
  const m = keyRgba(width, height, data);
  if (m.bgFraction < MIN_BG_FRACTION) throw new BadChromaError(`sem fundo verde (${(m.bgFraction * 100).toFixed(1)}% removido)`);
  if (m.holeFraction > MAX_HOLE_FRACTION) throw new BadChromaError(`verde demais na criatura (${(m.holeFraction * 100).toFixed(1)}%)`);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new BadChromaError('nada sobrou depois do recorte');
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const side = Math.max(w, h);
  const pad = Math.max(2, Math.floor(side * 0.04));
  const S = side + 2 * pad;
  const out = new Uint8Array(S * S * 4); // zerado = transparente
  const ox = pad + ((side - w) >> 1), oy = pad + ((side - h) >> 1);
  for (let y = 0; y < h; y++) {
    out.set(data.subarray(((y0 + y) * width + x0) * 4, ((y0 + y) * width + x0 + w) * 4), ((oy + y) * S + ox) * 4);
  }
  return encodePng(S, S, out);
}
