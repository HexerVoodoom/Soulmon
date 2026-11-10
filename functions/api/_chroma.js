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

// ---------------------------------------------------------------- chave AZUL: flood-fill a partir da borda (M5)
// Por que: o criterio por canal (b > 150 e b - max(r,g) > 60) pega tambem violeta/azul-royal do sprite (ex.: (110,90,230), runas do
// Saba) e o despill (b = max(r,g)) agia na imagem toda. Aqui o fundo e o que e ALCANCAVEL da borda por pixels perto do azul amostrado
// nos cantos; o despill so age num anel de poucos px ao redor do fundo removido. Verde e magenta NAO usam este caminho.
const FLOOD_TOL2 = 110 * 110;
const PURE_TOL2 = 60 * 60;
const HALO_TOL2 = 170 * 170;
const DESPILL_RING = 3;
/** Buraco enclausurado so conta como fundo se tiver pelo menos isto (px, a 1024x1024; escala com a area). */
const ENCLOSED_MIN_AT_1K = 800;

/** Cor do fundo amostrada nos 4 cantos (mediana por canal de blocos 8x8) ou null se nao for azul de chave. */
function amostrarFundoAzul(width, height, rgba) {
  const bs = Math.max(1, Math.min(8, width >> 1, height >> 1));
  const rs = [], gs = [], bl = [];
  for (const [cx, cy] of [[0, 0], [width - bs, 0], [0, height - bs], [width - bs, height - bs]]) {
    for (let y = cy; y < cy + bs; y++) for (let x = cx; x < cx + bs; x++) {
      const p = (y * width + x) * 4;
      rs.push(rgba[p]); gs.push(rgba[p + 1]); bl.push(rgba[p + 2]);
    }
  }
  const med = a => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const r = med(rs), g = med(gs), b = med(bl);
  return b > BG_G_MIN && b - Math.max(r, g) > BG_D_MIN ? [r, g, b] : null;
}

/** Flood-fill 4-conexo: marca em `out` os pixels de `cand` ligados as sementes. */
function inundar(width, height, cand, seeds) {
  const n = width * height;
  const out = new Uint8Array(n);
  const st = new Int32Array(n);
  let tp = 0;
  const push = i => { if (cand[i] && !out[i]) { out[i] = 1; st[tp++] = i; } };
  for (const i of seeds) push(i);
  while (tp) {
    const i = st[--tp];
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i < n - width) push(i + width);
  }
  return out;
}

function dilatar(width, height, src) {
  const n = width * height;
  const o = new Uint8Array(src);
  for (let i = 0; i < n; i++) {
    if (!src[i]) continue;
    const x = i % width;
    if (x > 0) o[i - 1] = 1;
    if (x < width - 1) o[i + 1] = 1;
    if (i >= width) o[i - width] = 1;
    if (i < n - width) o[i + width] = 1;
  }
  return o;
}

/** Recorte da chave azul por flood-fill. Devolve as mesmas metricas de `keyRgba`, ou null quando os cantos nao sao azul de chave
 *  (o chamador cai no recorte por canal, que sabe dizer "sem fundo azul"). */
function keyRgbaBlueFlood(width, height, rgba) {
  const bg0 = amostrarFundoAzul(width, height, rgba);
  if (!bg0) return null;
  const n = width * height;
  const dist2 = new Int32Array(n);
  const cand = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    const dr = rgba[p] - bg0[0], dg = rgba[p + 1] - bg0[1], db = rgba[p + 2] - bg0[2];
    const d2 = dr * dr + dg * dg + db * db;
    dist2[i] = d2;
    cand[i] = d2 <= FLOOD_TOL2 ? 1 : 0;
  }
  const seeds = [];
  for (let x = 0; x < width; x++) { seeds.push(x, (height - 1) * width + x); }
  for (let y = 0; y < height; y++) { seeds.push(y * width, y * width + width - 1); }
  const bg = inundar(width, height, cand, seeds);
  // buracos enclausurados grandes (ex.: vao entre bracos): componentes de cand nao alcancados com >= ENCLOSED_MIN px
  const minEnc = Math.max(16, Math.round(ENCLOSED_MIN_AT_1K * n / (1024 * 1024)));
  const resto = new Uint8Array(n);
  for (let i = 0; i < n; i++) resto[i] = cand[i] && !bg[i] ? 1 : 0;
  const lab = new Uint8Array(n);
  const st = new Int32Array(n);
  let enclosedBg = 0;
  for (let s = 0; s < n; s++) {
    if (!resto[s] || lab[s]) continue;
    let tp = 0, size = 0;
    st[tp++] = s; lab[s] = 1;
    const mem = [];
    while (tp) {
      const i = st[--tp]; size++; mem.push(i);
      const x = i % width;
      if (x > 0 && resto[i - 1] && !lab[i - 1]) { lab[i - 1] = 1; st[tp++] = i - 1; }
      if (x < width - 1 && resto[i + 1] && !lab[i + 1]) { lab[i + 1] = 1; st[tp++] = i + 1; }
      if (i >= width && resto[i - width] && !lab[i - width]) { lab[i - width] = 1; st[tp++] = i - width; }
      if (i < n - width && resto[i + width] && !lab[i + width]) { lab[i + width] = 1; st[tp++] = i + width; }
    }
    if (size >= minEnc) { for (const i of mem) bg[i] = 1; enclosedBg += size; }
  }
  // azul quase puro mesmo isolado (resto do fundo entre pelos/dedos)
  for (let i = 0; i < n; i++) if (dist2[i] <= PURE_TOL2) bg[i] = 1;
  // halo de 1 px
  const d1 = dilatar(width, height, bg);
  for (let i = 0; i < n; i++) if (!bg[i] && d1[i] && dist2[i] <= HALO_TOL2) bg[i] = 1;
  // despill so num anel ao redor do fundo removido
  let ring = bg;
  for (let k = 0; k < DESPILL_RING; k++) ring = dilatar(width, height, ring);
  for (let i = 0; i < n; i++) {
    if (bg[i] || !ring[i]) continue;
    const p = i * 4;
    const m = rgba[p] > rgba[p + 1] ? rgba[p] : rgba[p + 1];
    if (rgba[p + 2] > m) rgba[p + 2] = m;
  }
  const alpha = new Uint8Array(n);
  for (let i = 0; i < n; i++) alpha[i] = bg[i] ? 0 : 255;
  // ilhas pequenas somem (igual ao caminho por canal)
  const seen = new Uint8Array(n);
  for (let s = 0; s < n; s++) {
    if (!alpha[s] || seen[s]) continue;
    let tp = 0, size = 0;
    st[tp++] = s; seen[s] = 1;
    const mem = [];
    while (tp) {
      const i = st[--tp]; size++;
      if (size <= MIN_ISLAND) mem.push(i);
      const x = i % width;
      if (x > 0 && alpha[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; st[tp++] = i - 1; }
      if (x < width - 1 && alpha[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; st[tp++] = i + 1; }
      if (i >= width && alpha[i - width] && !seen[i - width]) { seen[i - width] = 1; st[tp++] = i - width; }
      if (i < n - width && alpha[i + width] && !seen[i + width]) { seen[i + width] = 1; st[tp++] = i + width; }
    }
    if (size < MIN_ISLAND) for (const i of mem) alpha[i] = 0;
  }
  let bgCount = 0, opaque = 0, nearOpaque = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    if (bg[i]) bgCount++;
    if (alpha[i]) { opaque++; if (nearKeyHue(rgba[p], rgba[p + 1], rgba[p + 2], 240)) nearOpaque++; }
    rgba[p + 3] = alpha[i];
  }
  return {
    bgFraction: bgCount / n, opaque, holeFraction: enclosedBg + opaque ? enclosedBg / (enclosedBg + opaque) : 0,
    nearFraction: opaque ? nearOpaque / opaque : 0,
  };
}

/** Chroma-key sobre RGBA (muta e devolve as métricas). `key`: 'green' | 'magenta' | 'blue'.
 *  `opts.connectedOnly`: so e fundo o que toca a borda (pixel da cor da chave DENTRO da criatura fica opaco e sem despill). */
export function keyRgba(width, height, rgba, key = 'green', opts = {}) {
  const magenta = key === 'magenta';
  const blue = key === 'blue';
  if (blue) {
    const m = keyRgbaBlueFlood(width, height, rgba);
    if (m) return m;
  }
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

/** Alfa abaixo disto = transparente. */
const HOLE_ALPHA = 128;
/** POEIRA de furos reprova: fracao da silhueta ocupada por furos PEQUENOS enclausurados acima disto => recorte quebrado.
 *  Calibrado em medidas reais do sprite do Saba (fixture + miniaturas 160/256/985, ver review-soulmon.buracos.test.js):
 *  recorte quebrado (runas comidas) 2,35-3,34%; recorte correto e arejado 0,63-0,84% (de 8-13 furos, contra 63-109 do quebrado). */
export const HOLE_REJECT_FRACTION = 0.015;
/** Furo enclausurado MAIOR que isto (fracao da silhueta) e vao legitimo (entre bracos, asas, cauda) e NAO conta: sprite arejado correto
 *  tem ate ~17% de vaos assim e NAO deve ser mandado regenerar (regenerar custa). So a poeira de furos pequenos denuncia corpo comido. */
const HOLE_BIG_COMPONENT = 0.002;
/** Furo menor que isto (fracao da silhueta, minimo 2 px) e ruido de borda e nao conta. */
const HOLE_MIN_COMPONENT = 0.00002;

/**
 * Mede a POEIRA de furos internos de um sprite RGBA ja recortado: transparencia (alfa < 128) totalmente cercada pela silhueta
 * (flood-fill do exterior a partir das bordas nao a alcanca), contando so os pedacos PEQUENOS (<= 0,2% da silhueta cada).
 * Vao grande (ligado ao exterior ou enclausurado e grande) nao conta: e arejado legitimo, nao recorte quebrado.
 * Deterministico, so CPU. `holeFraction` = area dos furos pequenos / (opacos + essa area); `components` = quantos furos pequenos.
 * @param {Uint8Array} pngBytes
 * @returns {{ opaque: number, holes: number, holeFraction: number, components: number, reprovado: boolean }}
 */
export function medirBuracosInternos(pngBytes) {
  const { width, height, data } = decodePng(pngBytes);
  const n = width * height;
  const opaqueMask = new Uint8Array(n);
  let opaque = 0;
  for (let i = 0; i < n; i++) if (data[i * 4 + 3] >= HOLE_ALPHA) { opaqueMask[i] = 1; opaque++; }
  if (!opaque) return { opaque: 0, holes: 0, holeFraction: 0, components: 0, reprovado: false };
  // exterior: transparente ligado a borda da imagem
  const reach = new Uint8Array(n);
  const stack = new Int32Array(n);
  let top = 0;
  const seed = i => { if (!opaqueMask[i] && !reach[i]) { reach[i] = 1; stack[top++] = i; } };
  for (let x = 0; x < width; x++) { seed(x); seed((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { seed(y * width); seed(y * width + width - 1); }
  while (top) {
    const i = stack[--top]; const x = i % width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (i >= width) seed(i - width);
    if (i < n - width) seed(i + width);
  }
  const minPix = Math.max(2, Math.floor(opaque * HOLE_MIN_COMPONENT));
  const maxPix = Math.floor(opaque * HOLE_BIG_COMPONENT);
  const seen = new Uint8Array(n);
  let components = 0, kept = 0;
  for (let s = 0; s < n; s++) {
    if (opaqueMask[s] || reach[s] || seen[s]) continue;
    let size = 0; top = 0; stack[top++] = s; seen[s] = 1;
    while (top) {
      const i = stack[--top]; size++; const x = i % width;
      const push = j => { if (!opaqueMask[j] && !reach[j] && !seen[j]) { seen[j] = 1; stack[top++] = j; } };
      if (x > 0) push(i - 1);
      if (x < width - 1) push(i + 1);
      if (i >= width) push(i - width);
      if (i < n - width) push(i + width);
    }
    if (size >= minPix && size <= maxPix) { components++; kept += size; }
  }
  const holeFraction = kept / (opaque + kept);
  return { opaque, holes: kept, holeFraction, components, reprovado: holeFraction > HOLE_REJECT_FRACTION };
}
