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

/** Cor do chroma pedida no prompt: azul #0000FF quando a paleta tem verde E magenta (nenhuma das duas recortaria limpo); magenta quando a criatura tem verde (o verde dela
 *  seria comido pelo recorte); verde #00FF00 no resto. O prompt é a fonte única. */
export function chromaKeyOfPrompt(prompt) {
  const t = String(prompt ?? '');
  if (/#0000FF/i.test(t)) return 'blue';
  return /#FF00FF/i.test(t) ? 'magenta' : 'green';
}

/** Matiz (graus) das chaves, para medir colisao (espelha KEY_HUE de `_chromaHue.js`). */
const HUE_OF_KEY = { green: 120, magenta: 300, blue: 240 };
/** Pixel vivo (s,v >= 0.45) a ate 30 graus do matiz da chave: o tipo de cor que o recorte come. */
function nearKeyHue(r, g, b, keyHue) {
  const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
  const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
  if (max < 115 || max === 0 || (max - min) / max < 0.45) return false;
  const c = max - min;
  let h = max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
  h = ((h * 60) + 360) % 360;
  const d = Math.abs(h - keyHue);
  return (d > 180 ? 360 - d : d) <= 30;
}

/** Chroma-key sobre RGBA (muta e devolve as métricas). `key`: 'green' | 'magenta' | 'blue'.
 *  `opts.connectedOnly`: so e fundo o que toca a borda (pixel da cor da chave DENTRO da criatura fica opaco e sem despill). */
export function keyRgba(width, height, rgba, key = 'green', opts = {}) {
  const magenta = key === 'magenta';
  const blue = key === 'blue';
  const n = width * height;
  const alpha = new Uint8Array(n);
  const isBg = new Uint8Array(n);
  const near = new Uint8Array(n);
  const keyHue = HUE_OF_KEY[key] ?? 120;
  let bgCount = 0;
  let conexo = null;
  if (opts.connectedOnly) {
    // Pre-passo: so conta como fundo o que a chave alcanca a partir da borda.
    const cand = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const q = i * 4;
      const r0 = rgba[q], g0 = rgba[q + 1], b0 = rgba[q + 2];
      const v0 = magenta ? (r0 < b0 ? r0 : b0) : blue ? b0 : g0;
      const o0 = magenta ? g0 : blue ? (r0 > g0 ? r0 : g0) : (r0 > b0 ? r0 : b0);
      cand[i] = v0 > BG_G_MIN && v0 - o0 > BG_D_MIN ? 1 : 0;
    }
    conexo = new Uint8Array(n);
    const st = new Int32Array(n);
    let tp = 0;
    const sd = i => { if (cand[i] && !conexo[i]) { conexo[i] = 1; st[tp++] = i; } };
    for (let x = 0; x < width; x++) { sd(x); sd((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { sd(y * width); sd(y * width + width - 1); }
    while (tp) {
      const i = st[--tp];
      const x = i % width;
      if (x > 0) sd(i - 1);
      if (x < width - 1) sd(i + 1);
      if (i >= width) sd(i - width);
      if (i < n - width) sd(i + width);
    }
  }
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
    near[i] = nearKeyHue(r, g, b, keyHue) ? 1 : 0;
    // verde: canal-chave g contra max(r,b); magenta: canal-chave min(r,b) contra g; azul: b contra max(r,g).
    const v = magenta ? (r < b ? r : b) : blue ? b : g;
    const other = magenta ? g : blue ? (r > g ? r : g) : (r > b ? r : b);
    const d = v - other;
    const bg = v > BG_G_MIN && d > BG_D_MIN && (!conexo || conexo[i] === 1);
    const interior = conexo !== null && !bg && v > BG_G_MIN && d > BG_D_MIN; // cor da chave dentro da criatura: preserva
    const al = interior ? 255 : bg ? 0 : d > EDGE_D_MIN ? 255 * (1 - (d - EDGE_D_MIN) / EDGE_SPAN) : 255;
    if (bg) { isBg[i] = 1; bgCount++; }
    // despill: nunca sobra o canal-chave acima do resto
    if (d > 0 && !interior) { if (magenta) { rgba[p] = r - d; rgba[p + 2] = b - d; } else if (blue) rgba[p + 2] = other; else rgba[p + 1] = other; }
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
  let holes = 0, opaque = 0, nearOpaque = 0;
  for (let i = 0; i < n; i++) {
    if (isBg[i] && !reach[i]) holes++;
    if (alpha[i]) { opaque++; if (near[i]) nearOpaque++; }
    rgba[i * 4 + 3] = alpha[i];
  }
  return {
    bgFraction: bgCount / n, opaque, holeFraction: holes + opaque ? holes / (holes + opaque) : 0,
    nearFraction: opaque ? nearOpaque / opaque : 0,
  };
}

/**
 * PNG com fundo verde -> PNG RGBA recortado pela bounding box, canvas quadrado com
 * margem de 4% (mín. 2 px), sem reescalar. Lança `BadChromaError` quando o resultado
 * não é confiável: sem fundo verde, criatura verde demais ou nada sobrou.
 * @param {Uint8Array} pngBytes @returns {Uint8Array}
 */
export function chromaKeyPng(pngBytes, key = 'green') {
  const { width, height, data } = decodePng(pngBytes);
  const m = keyRgba(width, height, data, key);
  if (m.bgFraction < MIN_BG_FRACTION) throw new BadChromaError(`sem fundo ${key === 'magenta' ? 'magenta' : key === 'blue' ? 'azul' : 'verde'} (${(m.bgFraction * 100).toFixed(1)}% removido)`);
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

// ---------------------------------------------------------------- verificacao pos-recorte (so CPU, sem custo)

/** Fracao da criatura (alfa > 0) com matiz vivo a ate 30 graus da chave: acima disto o recorte provavelmente mordeu o corpo/franjou a borda. */
export const NEAR_SUSPECT = 0.12;
/** Buracos internos (chave nao ligada a borda) acima disto da silhueta = transparencia anormal dentro da criatura. */
export const HOLE_SUSPECT = 0.04;
/** Flag gravada no registro do sprite quando o recorte e duvidoso (o fluxo "Revisar meu Soulmon" le `recorteSuspeito`). */
export const FLAG_RECORTE_SUSPEITO = 'recorte-suspeito';

/**
 * Mede o risco de um recorte a partir das metricas de `keyRgba`. Funcao utilitaria para o "Revisar meu Soulmon":
 * `{ suspeito, motivos, nearFraction, holeFraction }`; `suspeito` => marcar o sprite com FLAG_RECORTE_SUSPEITO (nunca regenerar so por isto).
 * @param {{ nearFraction: number, holeFraction: number }} m
 */
export function avaliarRiscoRecorte(m) {
  const motivos = [];
  if (m.nearFraction > NEAR_SUSPECT) motivos.push('criatura-na-cor-da-chave');
  if (m.holeFraction > HOLE_SUSPECT) motivos.push('buracos-internos');
  return { suspeito: motivos.length > 0, motivos, nearFraction: m.nearFraction, holeFraction: m.holeFraction };
}

function enquadrar(width, height, data) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new BadChromaError('nada sobrou depois do recorte');
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const side = Math.max(w, h);
  const pad = Math.max(2, Math.floor(side * 0.04));
  const S = side + 2 * pad;
  const out = new Uint8Array(S * S * 4);
  const ox = pad + ((side - w) >> 1), oy = pad + ((side - h) >> 1);
  for (let y = 0; y < h; y++) out.set(data.subarray(((y0 + y) * width + x0) * 4, ((y0 + y) * width + x0 + w) * 4), ((oy + y) * S + ox) * 4);
  return encodePng(S, S, out);
}

/**
 * Recorte com verificacao. 1) recorte normal; 2) se o risco passa do limiar (ou o normal falhou por "verde demais"), refaz sobre a MESMA
 * imagem no modo `connectedOnly` (so e fundo o que toca a borda: a criatura na cor da chave nao vira buraco) e fica com o que preservou
 * mais criatura; 3) se ainda assim o risco persiste, devolve `quality.flag = 'recorte-suspeito'` (sem regenerar: regenerar custa).
 * Nota: re-chavear com OUTRA chave sobre a mesma imagem nao existe (o fundo da imagem e fisicamente a cor pedida); a alternativa gratuita e o modo conexo.
 * @param {Uint8Array} pngBytes @param {'green'|'magenta'|'blue'} key
 */
export function chromaKeyPngChecked(pngBytes, key = 'green') {
  const tentativa = connectedOnly => {
    const { width, height, data } = decodePng(pngBytes);
    const m = keyRgba(width, height, data, key, { connectedOnly });
    return { width, height, data, m };
  };
  const normal = tentativa(false);
  if (normal.m.bgFraction < MIN_BG_FRACTION) throw new BadChromaError(`sem fundo ${key === 'magenta' ? 'magenta' : key === 'blue' ? 'azul' : 'verde'} (${(normal.m.bgFraction * 100).toFixed(1)}% removido)`);
  const erroNormal = normal.m.holeFraction > MAX_HOLE_FRACTION ? new BadChromaError(`verde demais na criatura (${(normal.m.holeFraction * 100).toFixed(1)}%)`) : null;
  let risco = avaliarRiscoRecorte(normal.m);
  let escolhido = normal;
  let modo = 'normal';
  if (erroNormal || risco.suspeito) {
    const conexo = tentativa(true);
    if (conexo.m.opaque > 0 && (erroNormal || conexo.m.opaque > normal.m.opaque)) {
      escolhido = conexo; modo = 'conectado'; risco = avaliarRiscoRecorte(conexo.m);
    } else if (erroNormal) throw erroNormal;
  }
  const png = enquadrar(escolhido.width, escolhido.height, escolhido.data);
  return {
    png,
    quality: { flag: risco.suspeito ? FLAG_RECORTE_SUSPEITO : null, modo, nearFraction: risco.nearFraction, holeFraction: risco.holeFraction, motivos: risco.motivos },
  };
}

// ---------------------------------------------------------------- medicao DETERMINISTICA de buracos internos (sprite ja recortado)

/** Raio (px, em sprite de 1k; escala com o lado) do fecho morfologico que cobre o "capuz" entre pedacos opacos. */
const CLOSE_RADIUS_FRAC = 0.012;
/** Alfa abaixo disto = transparente. */
const HOLE_ALPHA = 128;
/** Buraco interno acima desta fracao da silhueta (opaco + buraco) reprova o sprite (calibrado no caso real do Saba, ver teste). */
export const HOLE_REJECT_FRACTION = 0.02;
/** Pedaco de buraco menor que isto (fracao da silhueta) e ruido de borda e nao conta. */
const HOLE_MIN_COMPONENT = 0.0004;

function box1d(src, w, h, r, horizontal, op) {
  // op 'max' (dilata) | 'min' (erode); fora da imagem = 0 para max e 1 para min (o canvas ja vem com margem).
  const out = new Uint8Array(src.length);
  const len = horizontal ? w : h, lines = horizontal ? h : w;
  for (let l = 0; l < lines; l++) {
    for (let i = 0; i < len; i++) {
      let v = op === 'max' ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const j = i + k;
        const s = j < 0 || j >= len ? (op === 'max' ? 0 : 1) : src[horizontal ? l * w + j : j * w + l];
        if (op === 'max' ? s : !s) { v = op === 'max' ? 1 : 0; break; }
      }
      out[horizontal ? l * w + i : i * w + l] = v;
    }
  }
  return out;
}

/**
 * Mede buracos INTERNOS de um sprite RGBA ja recortado: transparencia (alfa < 128) dentro da silhueta. Dois sinais, somados:
 * (a) fecho morfologico (dilata r, erode r) da mascara opaca: o que o fecho preenche e transparente = buraco/entalhe interno;
 * (b) flood-fill do exterior a partir das bordas: transparente que ele NAO alcanca = buraco totalmente cercado.
 * Determinístico, so CPU. `holeFraction` = buracos / (opacos + buracos); `components` = pedacos conexos relevantes.
 * @param {Uint8Array} pngBytes
 * @returns {{ opaque: number, holes: number, holeFraction: number, components: number, reprovado: boolean }}
 */
export function medirBuracosInternos(pngBytes) {
  const { width, height, data } = decodePng(pngBytes);
  const r = Math.max(2, Math.round(Math.max(width, height) * CLOSE_RADIUS_FRAC));
  const pad = r + 2;
  const W = width + 2 * pad, H = height + 2 * pad;
  const mask = new Uint8Array(W * H);
  let opaque = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] >= HOLE_ALPHA) { mask[(y + pad) * W + x + pad] = 1; opaque++; }
  }
  if (!opaque) return { opaque: 0, holes: 0, holeFraction: 0, components: 0, reprovado: false };
  const dil = box1d(box1d(mask, W, H, r, true, 'max'), W, H, r, false, 'max');
  const closed = box1d(box1d(dil, W, H, r, true, 'min'), W, H, r, false, 'min');
  // (b) exterior: transparente ligado a borda do canvas com margem
  const reach = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  let top = 0;
  const seed = i => { if (!mask[i] && !reach[i]) { reach[i] = 1; stack[top++] = i; } };
  seed(0);
  while (top) {
    const i = stack[--top]; const x = i % W;
    if (x > 0) seed(i - 1);
    if (x < W - 1) seed(i + 1);
    if (i >= W) seed(i - W);
    if (i < W * H - W) seed(i + W);
  }
  const hole = new Uint8Array(W * H);
  let holes = 0;
  for (let i = 0; i < W * H; i++) if (!mask[i] && (closed[i] || !reach[i])) { hole[i] = 1; holes++; }
  // componentes (4-conexos) acima do piso de ruido
  const seen = new Uint8Array(W * H);
  const minPix = Math.max(4, Math.floor((opaque + holes) * HOLE_MIN_COMPONENT));
  let components = 0, kept = 0;
  for (let s = 0; s < W * H; s++) {
    if (!hole[s] || seen[s]) continue;
    let size = 0; top = 0; stack[top++] = s; seen[s] = 1;
    while (top) {
      const i = stack[--top]; size++; const x = i % W;
      const push = j => { if (hole[j] && !seen[j]) { seen[j] = 1; stack[top++] = j; } };
      if (x > 0) push(i - 1);
      if (x < W - 1) push(i + 1);
      if (i >= W) push(i - W);
      if (i < W * H - W) push(i + W);
    }
    if (size >= minPix) { components++; kept += size; }
  }
  const holeFraction = kept / (opaque + kept);
  return { opaque, holes: kept, holeFraction, components, reprovado: holeFraction > HOLE_REJECT_FRACTION };
}
