// Analisa o chunk de entrada: builda com sourcemap num diretório TEMPORÁRIO
// (nunca em dist/, nunca commitado) e soma os bytes minificados por módulo de
// origem. Uso: node scripts/analisar-entrada.mjs [outDir] [topN]
import { build } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { eachMapping, TraceMap } from '@jridgewell/trace-mapping';

const out = resolve(process.argv[2] ?? join(tmpdir(), 'soulmon-analise'));
const topN = Number(process.argv[3] ?? 25);
await build({ logLevel: 'error', build: { outDir: out, emptyOutDir: true, sourcemap: true, copyPublicDir: false } });
const assets = join(out, 'assets');
const html = readFileSync(join(out, 'index.html'), 'utf8');
const nome = /src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/.exec(html)[1];
const code = readFileSync(join(assets, nome), 'utf8');
const map = new TraceMap(readFileSync(join(assets, nome + '.map'), 'utf8'));
// linha/coluna -> offset
const linhas = code.split('\n'); const ini = []; let o = 0;
for (const l of linhas) { ini.push(o); o += Buffer.byteLength(l) + 1; }
const segs = [];
eachMapping(map, m => segs.push([ini[m.generatedLine - 1] + m.generatedColumn, m.source]));
segs.sort((a, b) => a[0] - b[0]);
const soma = new Map(); const total = Buffer.byteLength(code);
for (let i = 0; i < segs.length; i++) {
  const fim = i + 1 < segs.length ? segs[i + 1][0] : total;
  const s = segs[i][1] ?? '(sem mapa)';
  soma.set(s, (soma.get(s) ?? 0) + (fim - segs[i][0]));
}
console.log(`${nome}: ${total} B`);
[...soma].sort((a, b) => b[1] - a[1]).slice(0, topN).forEach(([s, b]) => console.log(String(b).padStart(8), s.replace(/^.*?(node_modules\/|src\/)/, '$1')));
