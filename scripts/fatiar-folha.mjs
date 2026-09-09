/**
 * Fatia uma FOLHA de ícones (grade sobre fundo branco) em PNGs com alfa.
 *
 * O corte é por PROJEÇÃO DE PIXELS — acha as linhas e colunas inteiramente
 * brancas e corta nelas — e nunca por grade fixa. O motivo está medido: o
 * Gemini não respeita o espaçamento pedido, e nesta própria folha ele entregou
 * 4x4 quando o prompt pedia 4x3 (ele mesmo avisou). Grade fixa cortaria ícone
 * pelo meio; a projeção se adapta ao que veio.
 *
 *   node scripts/fatiar-folha.mjs <folha.jfif> <destino/> [--prefixo p]
 *
 * Cada peça sai quadrada no tamanho `--tam` (96 por padrão, que é o tamanho das
 * 30 cenas de sonho em `assets/soulmon/dreams/`), com o conteúdo centralizado.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [, , SRC, DEST, ...flags] = process.argv;
const arg = (n, d) => { const i = flags.indexOf(n); return i >= 0 ? flags[i + 1] : d; };
const TAM = +arg('--tam', 96);
const PREFIXO = arg('--prefixo', 'tile');
const MIN_LADO = +arg('--min', 40);          // descarta respingo de compressão
const FUNDO = arg('--fundo', 'branco');      // 'branco' | 'verde'

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// Folha sobre chroma green: além de separar a tinta, tira a franja verde
// (despill) antes de qualquer medida, senão a borda de cada peça entra no
// recorte com halo — o mesmo passo do `decor-para-caixa.mjs`.
if (FUNDO === 'verde') {
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    if (g > 110 && g > r + 55 && b < g - 40 && r < g - 40) continue;   // é fundo
    const mx = Math.max(r, b);
    if (g > mx + 20) data[i * 4 + 1] = mx;
  }
}

/** Tinta = o que não é fundo. O limiar é folgado porque a folha chega em JPEG. */
const tinta = FUNDO === 'verde'
  ? (x, y) => {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      return !(g > 110 && g > r + 55 && b < g - 40 && r < g - 40);
    }
  : (x, y) => {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      return Math.min(r, g, b) < 232 || Math.max(r, g, b) - Math.min(r, g, b) > 18;
    };

/** Bandas de índices com pelo menos `minCheio` posições com tinta. */
function bandas(n, cheio, minCheio) {
  const out = [];
  let ini = -1;
  for (let i = 0; i < n; i++) {
    const tem = cheio[i] >= minCheio;
    if (tem && ini < 0) ini = i;
    if (!tem && ini >= 0) { out.push([ini, i - 1]); ini = -1; }
  }
  if (ini >= 0) out.push([ini, n - 1]);
  return out;
}

const porLinha = new Array(H).fill(0);
for (let y = 0; y < H; y++) { let c = 0; for (let x = 0; x < W; x++) if (tinta(x, y)) c++; porLinha[y] = c; }
const faixas = bandas(H, porLinha, 3).filter(([a, b]) => b - a + 1 >= MIN_LADO);

fs.mkdirSync(DEST, { recursive: true });
let n = 0;
const relatorio = [];
for (const [y0, y1] of faixas) {
  const porCol = new Array(W).fill(0);
  for (let x = 0; x < W; x++) { let c = 0; for (let y = y0; y <= y1; y++) if (tinta(x, y)) c++; porCol[x] = c; }
  const colunas = bandas(W, porCol, 2).filter(([a, b]) => b - a + 1 >= MIN_LADO);
  for (const [x0, x1] of colunas) {
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    // recorta, tira o branco por limiar e volta a recortar pela bbox real
    const bruto = Buffer.alloc(cw * ch * 4);
    let minX = cw, minY = ch, maxX = -1, maxY = -1;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const s = ((y0 + y) * W + (x0 + x)) * 4, d = (y * cw + x) * 4;
      const op = tinta(x0 + x, y0 + y);
      bruto[d] = data[s]; bruto[d + 1] = data[s + 1]; bruto[d + 2] = data[s + 2];
      bruto[d + 3] = op ? 255 : 0;
      if (op) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    if (maxX < 0) continue;
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const s = Math.min(TAM / bw, TAM / bh);
    const dw = Math.max(1, Math.round(bw * s)), dh = Math.max(1, Math.round(bh * s));
    const arte = await sharp(bruto, { raw: { width: cw, height: ch, channels: 4 } })
      .extract({ left: minX, top: minY, width: bw, height: bh })
      .resize(dw, dh, { kernel: 'nearest' }).png().toBuffer();
    const nome = `${PREFIXO}-${String(n).padStart(2, '0')}.png`;
    await sharp({ create: { width: TAM, height: TAM, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: arte, left: Math.round((TAM - dw) / 2), top: Math.round((TAM - dh) / 2) }])
      .png().toFile(path.join(DEST, nome));
    relatorio.push({ n, nome, origem: `${x0},${y0} ${cw}x${ch}`, bbox: `${bw}x${bh}` });
    n++;
  }
}
console.table(relatorio);
console.log(`${n} peças em ${DEST}`);
