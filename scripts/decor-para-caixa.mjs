/**
 * Recorte e enquadramento de uma peça de decoração gerada sobre chroma green.
 *
 * Herdeiro do `product/soulmon-01/ui/arte-pendente/chroma-key.mjs`, com a única
 * diferença que a auditoria de 08/09/2026 exigiu: a tela de saída é RETANGULAR,
 * no tamanho do slot × 2, em vez de quadrada.
 *
 * Por que slot × 2: `PetStageDecor` desenha com `objectFit: contain`. Fonte
 * quadrada em caixa não-quadrada encolhe até o menor lado — era por isso que o
 * tapete (256×256 numa caixa de 104×16) renderizava como um selo de 16×16.
 * Exportando em 2× a caixa, `contain` dá fator exatamente 2:1 nos dois eixos,
 * que é o que o `naGrade()` do guard de escala exige.
 *
 *   node scripts/decor-para-caixa.mjs <entrada.png> <saida.png> <L> <A> [--chao]
 *
 * `--chao` ancora a peça embaixo (o que fica apoiado na linha do chão); sem ele
 * a peça é centralizada (parede e tapete).
 *
 * `--cores N` fecha a paleta em N cores (padrão 6 + contorno). O passo é
 * obrigatório porque a saída do Gemini chega em JPEG: medido no sofá, o mesmo
 * marrom aparecia como 182,88,36 / 184,90,36 / 185,91,37, e o arquivo somava
 * 1461 cores distintas onde o brief pede 4 a 6.
 *
 * A quantização é POR DISTÂNCIA, não por median-cut: as cores são ordenadas por
 * frequência e cada uma vira representante só se estiver a mais de `--dist` de
 * todas as já eleitas; o resto é mapeado para a mais próxima. Median-cut foi
 * testado primeiro (`png({palette:true})`) e falhou nos dois extremos — com 7
 * cores achatava o sofá inteiro em 3 tons, e com 12, 16 ou 24 devolvia sempre
 * as MESMAS 15, ainda cheias de vizinhas indistinguíveis (183,89,35 ao lado de
 * 186,92,36). Distância mínima separa "tom de sombra" de "ruído de JPEG", que é
 * exatamente a distinção que interessa aqui.
 */
import sharp from 'sharp';

const [, , SRC, OUT, Wt, Ht, ...flags] = process.argv;
if (!SRC || !OUT || !Wt || !Ht) {
  console.error('uso: decor-para-caixa.mjs <entrada> <saida> <L> <A> [--chao]');
  process.exit(2);
}
const TW = +Wt, TH = +Ht, CHAO = flags.includes('--chao');
const iCores = flags.indexOf('--cores');
const CORES = iCores >= 0 ? +flags[iCores + 1] : 7;
const iDist = flags.indexOf('--dist');
const DIST = iDist >= 0 ? +flags[iDist + 1] : 46;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, px = Buffer.from(data);

// 1. chroma-key + despill (tira a franja verde que sobra na borda)
for (let i = 0; i < W * H; i++) {
  const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
  if (g > 110 && g > r + 55 && b < g - 40 && r < g - 40) { px[i * 4 + 3] = 0; continue; }
  const mx = Math.max(r, b);
  if (g > mx + 20) px[i * 4 + 1] = mx;
}

// 2. descarte de ilhas < 24px (a nuvem de ruído pontilhado)
const on = i => px[i * 4 + 3] > 25;
const comp = new Int32Array(W * H).fill(-1), size = [];
for (let k = 0; k < W * H; k++) {
  if (comp[k] !== -1 || !on(k)) continue;
  const id = size.length; let n = 0; const st = [k]; comp[k] = id;
  while (st.length) {
    const c = st.pop(); n++;
    const cx = c % W, cy = (c - cx) / W;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const kk = ny * W + nx;
      if (comp[kk] !== -1 || !on(kk)) continue;
      comp[kk] = id; st.push(kk);
    }
  }
  size.push(n);
}
let killed = 0;
for (let k = 0; k < W * H; k++) if (comp[k] !== -1 && size[comp[k]] < 24) { px[k * 4 + 3] = 0; killed++; }

// 3. recorte da bounding box
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let k = 0; k < W * H; k++) if (px[k * 4 + 3] > 25) {
  const x = k % W, y = (k - x) / W;
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
}
if (maxX < 0) { console.error('ERRO: nada sobrou depois do chroma-key'); process.exit(1); }
const cw = maxX - minX + 1, ch = maxY - minY + 1;

// 4. reescala NEAREST (bilinear borra pixel art) preservando a proporção
const s = Math.min(TW / cw, TH / ch);
const dw = Math.max(1, Math.round(cw * s)), dh = Math.max(1, Math.round(ch * s));
const arte = await sharp(px, { raw: { width: W, height: H, channels: 4 } })
  .extract({ left: minX, top: minY, width: cw, height: ch })
  .resize(dw, dh, { kernel: 'nearest' }).png().toBuffer();

// 5. colagem na tela do slot × 2
const composto = await sharp({ create: { width: TW, height: TH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: arte, left: Math.round((TW - dw) / 2), top: CHAO ? TH - dh : Math.round((TH - dh) / 2) }])
  .png().toBuffer();

// 6. paleta fechada por distância mínima (ver cabeçalho)
const tela = await sharp(composto).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const tp = tela.data;
const hist = new Map();
for (let i = 0; i < tp.length; i += 4) {
  if (tp[i + 3] < 8) continue;
  const k = (tp[i] << 16) | (tp[i + 1] << 8) | tp[i + 2];
  hist.set(k, (hist.get(k) || 0) + 1);
}
const d2 = (a, b) => {
  const dr = (a >> 16) - (b >> 16), dg = ((a >> 8) & 255) - ((b >> 8) & 255), db = (a & 255) - (b & 255);
  return dr * dr + dg * dg + db * db;
};
const reps = [];
for (const [k] of [...hist.entries()].sort((a, b) => b[1] - a[1])) {
  if (reps.length >= CORES) break;
  if (reps.every(r => d2(r, k) > DIST * DIST)) reps.push(k);
}
const cache = new Map();
for (let i = 0; i < tp.length; i += 4) {
  if (tp[i + 3] < 8) { tp[i] = tp[i + 1] = tp[i + 2] = 0; tp[i + 3] = 0; continue; }
  tp[i + 3] = 255;                                   // alfa binário: nada de borda macia
  const k = (tp[i] << 16) | (tp[i + 1] << 8) | tp[i + 2];
  let r = cache.get(k);
  if (r === undefined) {
    r = reps.reduce((best, c) => (d2(c, k) < d2(best, k) ? c : best), reps[0]);
    cache.set(k, r);
  }
  tp[i] = r >> 16; tp[i + 1] = (r >> 8) & 255; tp[i + 2] = r & 255;
}
await sharp(tp, { raw: { width: TW, height: TH, channels: 4 } }).png().toFile(OUT);

console.log(JSON.stringify({
  killed, cores: reps.length, bbox: [minX, minY, cw, ch], razaoFonte: +(cw / ch).toFixed(2),
  razaoCaixa: +(TW / TH).toFixed(2), desenhado: [dw, dh], tela: [TW, TH],
  preenchimento: +(100 * (dw * dh) / (TW * TH)).toFixed(1) + '%',
}));
