#!/usr/bin/env node
/**
 * Quem pesa no chunk de ENTRADA — bytes por arquivo-fonte, lidos do sourcemap.
 *
 * Uso:  npx vite build --sourcemap --outDir <dir-fora-do-dist> && \
 *       node scripts/analisar-entrada.mjs <dir>  [topN]
 *
 * Não usa plugin nenhum (nada novo em devDependencies): soma, por fonte, o
 * comprimento dos trechos gerados que o `mappings` atribui a cada arquivo.
 * É uma aproximação (minificação mistura trechos), boa o bastante para ranquear.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { TraceMap, eachMapping } from '@jridgewell/trace-mapping';

const dir = process.argv[2] ?? 'dist';
const topN = Number(process.argv[3] ?? 40);
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const entrada = /assets\/(index-[^"]+\.js)/.exec(html)?.[1];
if (!entrada) throw new Error('chunk de entrada não encontrado no index.html');
const codigo = readFileSync(join(dir, 'assets', entrada), 'utf8');
const mapa = new TraceMap(readFileSync(join(dir, 'assets', entrada + '.map'), 'utf8'));
const linhas = codigo.split('\n');
const porFonte = new Map();
let anterior = null;
const fecha = (fim) => {
  if (!anterior) return;
  const { linha, col, fonte } = anterior;
  const n = fim.linha === linha ? fim.col - col : (linhas[linha] ?? '').length - col;
  porFonte.set(fonte, (porFonte.get(fonte) ?? 0) + Math.max(0, n));
};
eachMapping(mapa, (m) => {
  const atual = { linha: m.generatedLine - 1, col: m.generatedColumn, fonte: m.source ?? '?' };
  fecha(atual);
  anterior = atual;
});
fecha({ linha: anterior?.linha ?? 0, col: Infinity });
const total = Buffer.byteLength(codigo);
console.log(`entrada: ${entrada} = ${total} B`);
[...porFonte].sort((a, b) => b[1] - a[1]).slice(0, topN)
  .forEach(([f, n]) => console.log(String(n).padStart(8), f.replace(/^.*?(src|node_modules)\//, '$1/')));
