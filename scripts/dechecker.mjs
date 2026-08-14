#!/usr/bin/env node
// Remove o "fundo xadrez" que o gpt_image_2 desenha como PIXELS DE VERDADE em
// vez de alpha real, quando gerado via CLI (ver scripts/gen-decor.mjs). O
// xadrez é sempre as duas mesmas cores quase-neutras (branco e cinza claro,
// baixa saturação) em blocos regulares — então: qualquer pixel dessas duas
// cores vira transparente, e um flood-fill a partir das bordas garante que só
// o fundo conectado às bordas some (não um pedaço de sofá que por acaso caia
// perto dessas cores).
//
//   node scripts/dechecker.mjs <arquivo.png> [--threshold 18]

import sharp from 'sharp';
import path from 'node:path';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const thresholdArg = args.indexOf('--threshold');
const THRESHOLD = thresholdArg >= 0 ? Number(args[thresholdArg + 1]) : 18;

if (!file) {
  console.error('uso: node scripts/dechecker.mjs <arquivo.png> [--threshold N]');
  process.exit(1);
}

// As duas cores do xadrez do gpt_image_2: branco puro e cinza claro neutro.
// low-sat + brilho alto é o que distingue do sofá (tons quentes/saturados).
function isCheckerColor(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat < 0.06 && r > 190;
}

const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const idx = (x, y) => (y * width + x) * channels;
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
  if (!isCheckerColor(data[p], data[p + 1], data[p + 2])) continue;
  data[p + 3] = 0;
  cleared++;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

await sharp(data, { raw: { width, height, channels } }).png().toFile(file);
console.log(`${path.basename(file)}: ${cleared} px de xadrez removidos (flood-fill a partir das bordas)`);
