#!/usr/bin/env node
// As 24 linhas de inimigo da masmorra (src/assets/soulmon/lines/*.png) vieram
// do gerador com fundo OPACO em vez de alpha real — em alguns casos uma cor
// sólida (branco ou quase-preto), em outros um xadrez de duas cores neutras
// (a mesma classe de bug que scripts/dechecker.mjs já resolve pra outro
// conjunto de assets, mas aqui a cor de fundo varia por arquivo em vez de ser
// sempre a mesma, então em vez de cor fixa a gente amostra a borda da própria
// imagem: qualquer pixel de baixa saturação PARECIDO com algum tom visto no
// perímetro vira transparente via flood-fill (só o que está CONECTADO à
// borda soma — uma parte cinza do próprio bicho no meio da imagem não é
// tocada).
//
//   node scripts/debackground-lines.mjs [--dry-run] [--dir <pasta>]

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const dirArg = args.indexOf('--dir');
const DIR = dirArg >= 0 ? args[dirArg + 1] : 'src/assets/soulmon/lines';
const COLOR_TOLERANCE = 22; // distância euclidiana máxima em RGB

function isNeutral(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat < 0.08;
}

function colorDist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

async function processFile(file) {
  const img = sharp(file).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const idx = (x, y) => (y * width + x) * channels;

  // 1. Amostra a paleta de fundo a partir do perímetro (só tons neutros).
  const palette = [];
  const addSample = (x, y) => {
    const p = idx(x, y);
    const c = [data[p], data[p + 1], data[p + 2]];
    if (!isNeutral(...c)) return;
    if (palette.some(p2 => colorDist(p2, c) < COLOR_TOLERANCE)) return;
    palette.push(c);
  };
  for (let x = 0; x < width; x += 2) { addSample(x, 0); addSample(x, height - 1); }
  for (let y = 0; y < height; y += 2) { addSample(0, y); addSample(width - 1, y); }

  if (palette.length === 0) return { file, cleared: 0, note: 'sem paleta neutra na borda' };

  // 2. Flood-fill a partir da borda: pixel some se estiver perto de alguma
  //    cor da paleta.
  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) { stack.push([x, 0]); stack.push([x, height - 1]); }
  for (let y = 0; y < height; y++) { stack.push([0, y]); stack.push([width - 1, y]); }

  let cleared = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const vIdx = y * width + x;
    if (visited[vIdx]) continue;
    visited[vIdx] = 1;
    const p = idx(x, y);
    const c = [data[p], data[p + 1], data[p + 2]];
    if (!palette.some(ref => colorDist(ref, c) < COLOR_TOLERANCE)) continue;
    data[p + 3] = 0;
    cleared++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  if (!DRY_RUN) {
    await sharp(data, { raw: { width, height, channels } }).png().toFile(file);
  }
  return { file, cleared, palette: palette.length };
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).map(f => path.join(DIR, f));
for (const file of files) {
  const r = await processFile(file);
  console.log(`${path.basename(r.file)}: ${r.cleared} px removidos (paleta: ${r.palette ?? 0})${r.note ? ' — ' + r.note : ''}`);
}
