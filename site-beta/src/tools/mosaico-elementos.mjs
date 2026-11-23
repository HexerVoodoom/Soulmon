// Mosaico de fundo do "Seu Soulmon é só seu": 20 ícones base + um trecho dos pares (el-*.png de soulmon/elementos), 96 px em escala 1x, escurecido.
// Uma imagem só (AVIF + WebP) em vez de centenas de pedidos. Rodar: node src/tools/mosaico-elementos.mjs
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const DIR = 'D:/Soulmon/repo/src/assets/soulmon/elementos';
const BASES = 'agua ar arcano eletricidade espaco fada fogo gravidade industrial luz marcial morte planta som sombra tempo terra vida vigor vileza'.split(' ');
const todos = readdirSync(DIR).filter((f) => /^el-.*\.png$/.test(f)).map((f) => f.slice(3, -4));
const pares = todos.filter((i) => !BASES.includes(i) && i !== 'neutro');
const COLS = 14, LIN = 6, C = 96;
const escolha = [...BASES.filter((b) => todos.includes(b)), ...pares.filter((_, i) => i % Math.max(1, Math.floor(pares.length / (COLS * LIN - 20))) === 0)];
const comp = [];
for (let i = 0; i < COLS * LIN; i++) {
  const id = escolha[(i * 7) % escolha.length]; // embaralha de forma fixa
  const b = await sharp(`${DIR}/el-${id}.png`).resize(C, C, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).modulate({ brightness: 0.42, saturation: 0.8 }).png().toBuffer();
  comp.push({ input: b, left: (i % COLS) * C, top: Math.floor(i / COLS) * C });
}
const img = sharp({ create: { width: COLS * C, height: LIN * C, channels: 4, background: '#06161b' } }).composite(comp);
await img.clone().webp({ quality: 70 }).toFile('public/site/mosaico-elementos.webp');
await img.clone().avif({ quality: 40, effort: 9 }).toFile('public/site/mosaico-elementos.avif');
console.log(todos.length, 'arquivos;', new Set(escolha).size, 'distintos no mosaico');
