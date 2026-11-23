// Converte as peças de src/assets-dono/_pecas (fatiar-dono2.py) em WebP final, nos tamanhos que o manifesto (assets.json) descreve.
import sharp from 'sharp';
import { readdirSync, rmSync } from 'node:fs';
const D = 'public/dono';
const w = (n, largura, alt) => sharp(`src/assets-dono/_pecas/${n}.png`).resize({ width: largura, height: alt, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' }).webp({ quality: 80, alphaQuality: 90, effort: 6 });
const saidas = [
  ['botao-normal', 'botao', 551, 180], ['botao-hover', 'botao-hover', 551, 180], ['botao-pressionado', 'botao-press', 551, 180], ['botao-desabilitado', 'botao-off', 551, 180],
  ['moldura-cristal', 'popup', 643], ['painel-cobre', 'painel', 466], ['moldura-ficha', 'ficha', 581],
  ['aba-ativa', 'aba', 285, 90], ['aba-selecionada', 'aba-sel', 285, 90], ['aba-hover', 'aba-hover', 285, 90],
  ['arvore-no', 'arvore-no', 192], ['barra-trilho', 'barra-trilho', 61], ['barra-trilho-cheio', 'barra-cheio', 61], ['barra-capa', 'barra-capa', 106], ['barra-no', 'barra-no', 69], ['barra-no-aceso', 'barra-no-aceso', 76],
  ['seta-esq', 'seta-esq', 96], ['seta-dir', 'seta-dir', 96], ['seta-esq-hover', 'seta-esq-hover', 96], ['seta-dir-hover', 'seta-dir-hover', 96], ['seta-esq-inativa', 'seta-esq-off', 96], ['seta-dir-inativa', 'seta-dir-off', 96],
];
for (const [n, o, l, a] of saidas) await w(n, l, a).toFile(`${D}/${o}.webp`);
console.log(saidas.length, 'peças');
