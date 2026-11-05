/**
 * PUBLICAÇÃO DOS ROOKIES DOS 120 SIMULADOS NOVOS — manual. Este script NUNCA fala com o KV nem com a rede (REGISTRO §235).
 *
 *   node scripts/simulados-sprites-publicar.mjs            # DRY-RUN: confere arquivos, conta escritas e bytes, não grava nada
 *   node scripts/simulados-sprites-publicar.mjs --gerar    # grava os lotes para `wrangler kv bulk put`, em <saída>/publicar/
 *   opções: --out <pasta>
 *
 * Para cada simulado, as mesmas 3 chaves de `instalar` em `_simFormas.js`: `sprite:blob:<token>`, `sim:sprite:<id>:rookie` e
 * o ponteiro `sim:sprite:<id>`. O token é aleatório e fica em `publicar/tokens.json`: rodar de novo reusa o mesmo, sem blob órfão.
 * Saídas: 0 ok · 1 erro · 2 uso errado.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIMULADOS } from '../functions/api/_simulados.data.js';
import { SAIDA_PADRAO, pngTemAlfa } from './simulados-sprites-fila.mjs';

export const ESCRITAS_POR_SIMULADO = 3;
/** Teto por arquivo do `kv bulk put` é 100 MB; a folga cobre o JSON em volta. */
export const BYTES_POR_LOTE = 80 * 1024 * 1024;
export const WORKERS_FREE_ESCRITAS_DIA = 1000;
export const USD_POR_MILHAO_DE_ESCRITAS = 5;

export const novos = () => SIMULADOS.slice(50);
export const custoDeEscritas = (n) => (n / 1e6) * USD_POR_MILHAO_DE_ESCRITAS;

/** As entradas do rookie no manifesto, por simulado: { hash, arquivo, sha }. */
export function rookiesDoManifesto(manifesto) {
  const out = new Map();
  for (const [chave, v] of Object.entries(manifesto)) {
    const [id, forma, sha] = chave.split('|');
    if (forma === 'rookie') out.set(id, { arquivo: v.arquivo, sha });
  }
  return out;
}

/** As 3 entradas de um simulado (pura). `base64` é o PNG recortado. */
export function entradasDoSimulado(p, token, base64, sha) {
  const url = `/api/sprite-image?k=${token}`;
  const metadata = { el: p.element, line: p.line, form: 'rookie', sha };
  return [
    { key: `sprite:blob:${token}`, value: base64, base64: true, metadata: { contentType: 'image/png' } },
    { key: `sim:sprite:${p.id}:rookie`, value: url, metadata },
    { key: `sim:sprite:${p.id}`, value: url, metadata },
  ];
}

/** Agrupa entradas em lotes sem separar as do mesmo simulado. */
export function emLotes(grupos, teto = BYTES_POR_LOTE) {
  const lotes = [];
  let atual = [];
  let bytes = 0;
  for (const g of grupos) {
    const t = g.reduce((s, e) => s + e.value.length + e.key.length + 200, 0);
    if (atual.length && bytes + t > teto) { lotes.push(atual); atual = []; bytes = 0; }
    atual.push(...g);
    bytes += t;
  }
  if (atual.length) lotes.push(atual);
  return lotes;
}

function main() {
  const argv = process.argv.slice(2);
  const gerar = argv.includes('--gerar');
  const i = argv.indexOf('--out');
  const pasta = i >= 0 ? argv[i + 1] : SAIDA_PADRAO;
  if (i >= 0 && !pasta) { console.error('--out sem pasta'); process.exit(2); }
  const manPath = join(pasta, 'manifesto.json');
  if (!existsSync(manPath)) { console.error(`Falta ${manPath}`); process.exit(1); }
  const rookies = rookiesDoManifesto(JSON.parse(readFileSync(manPath, 'utf8')));
  const faltam = [];
  let bytes = 0;
  for (const p of novos()) {
    const r = rookies.get(p.id);
    const f = r && join(pasta, r.arquivo);
    if (!f || !existsSync(f)) faltam.push(p.id); else bytes += statSync(f).size;
  }
  if (faltam.length) { console.error(`Sem rookie: ${faltam.join(', ')}`); process.exit(1); }
  const escritas = novos().length * ESCRITAS_POR_SIMULADO;
  console.log(`${novos().length} simulados, ${escritas} escritas, ${(bytes / 1048576).toFixed(0)} MiB de PNG (${(bytes * 4 / 3 / 1048576).toFixed(0)} MiB em base64).`);
  console.log(`Custo das escritas no Workers Paid, fora da franquia: US$ ${custoDeEscritas(escritas).toFixed(4)}. Limite do Free: ${WORKERS_FREE_ESCRITAS_DIA}/dia.`);
  if (!gerar) { console.log('Dry-run: nada foi gravado. Use --gerar para os lotes.'); return; }
  const dir = join(pasta, 'publicar');
  mkdirSync(dir, { recursive: true });
  const tokPath = join(dir, 'tokens.json');
  const tokens = existsSync(tokPath) ? JSON.parse(readFileSync(tokPath, 'utf8')) : {};
  const grupos = novos().map((p) => {
    tokens[p.id] ??= randomUUID().replace(/-/g, '');
    const r = rookies.get(p.id);
    const png = readFileSync(join(pasta, r.arquivo));
    if (!pngTemAlfa(png)) throw new Error(`${p.id}: PNG sem alfa`);
    return entradasDoSimulado(p, tokens[p.id], png.toString('base64'), r.sha);
  });
  writeFileSync(tokPath, JSON.stringify(tokens, null, 1));
  const lotes = emLotes(grupos);
  lotes.forEach((l, n) => writeFileSync(join(dir, `lote-${n + 1}.json`), JSON.stringify(l)));
  console.log(`${lotes.length} lote(s) em ${dir}. Nada foi gravado no KV.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
