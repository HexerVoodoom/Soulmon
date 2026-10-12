#!/usr/bin/env node
/**
 * `node scripts/top-consumidores.mjs` — quem mais gastou IA no dia (`/api/top-ai`).
 * Mesmo segredo do relatório de crash/métricas: `METRICS_ADMIN_KEY` (cabeçalho
 * `X-Metrics-Key`). O saveId vem TRUNCADO (8 caracteres) de propósito.
 *
 * Uso:
 *   $env:METRICS_ADMIN_KEY = "..."; node scripts/top-consumidores.mjs [--day AAAA-MM-DD] [--url https://...] [--json]
 *
 * Saídas: 0 ok · 2 sem chave · 3 chave recusada · 4 outro HTTP · 1 erro.
 */
import { fileURLToPath } from 'node:url';

export const APP_URL_PADRAO = 'https://soulmon.mateus-sprnd.workers.dev';

export function parseArgs(argv, env = {}) {
  const o = { url: env.APP_URL || APP_URL_PADRAO, day: new Date().toISOString().slice(0, 10), json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--day') o.day = String(argv[++i] ?? '');
    else if (argv[i] === '--url') o.url = String(argv[++i] ?? '');
    else if (argv[i] === '--json') o.json = true;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.day)) throw new Error(`dia inválido: ${o.day}`);
  return o;
}

export function renderTabela(res) {
  const linhas = [`Top consumidores de IA em ${res.day} (saveId truncado; * = ≥ 80% da cota diária)`];
  for (const [bucket, lista] of Object.entries(res.top ?? {})) {
    linhas.push('', `${bucket}:`);
    if (!lista.length) { linhas.push('  (ninguém)'); continue; }
    for (const e of lista) linhas.push(`  ${e.saveIdPrefix}  ${String(e.n).padStart(4)}${e.acima80 ? ' *' : ''}`);
  }
  return linhas.join('\n');
}

async function main() {
  const o = parseArgs(process.argv.slice(2), process.env);
  const key = process.env.METRICS_ADMIN_KEY;
  if (!key) { console.error('Defina METRICS_ADMIN_KEY.'); process.exit(2); }
  const r = await fetch(`${o.url}/api/top-ai?day=${o.day}`, { headers: { 'X-Metrics-Key': key } });
  if (r.status === 404 || r.status === 401) { console.error(`Chave recusada (${r.status}).`); process.exit(3); }
  if (!r.ok) { console.error(`HTTP ${r.status}`); process.exit(4); }
  const res = await r.json();
  console.log(o.json ? JSON.stringify(res, null, 2) : renderTabela(res));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(String(e?.message ?? e)); process.exit(1); });
}
