#!/usr/bin/env node
/**
 * `node scripts/liberar-forma.mjs <saveId> <formId>` — libera UMA nova geração de
 * sprite de UMA forma de um testador (o desenho saiu feio). Chama
 * `POST /api/sprite-admin?action=release-form` com `METRICS_ADMIN_KEY`.
 * O vitalício não volta; a geração nova obedece aos tetos de sempre.
 *
 * Uso: $env:METRICS_ADMIN_KEY = "..."; node scripts/liberar-forma.mjs <saveId> <formId> [--url https://...]
 * Saídas: 0 ok · 2 sem chave/argumento · 3 chave recusada · 4 outro HTTP · 1 erro.
 */
import { fileURLToPath } from 'node:url';

export const APP_URL_PADRAO = 'https://soulmon.mateus-sprnd.workers.dev';
export const FORM_RE = /^(?:rookie|ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))$/;

export function parseArgs(argv, env = {}) {
  const pos = [];
  let url = env.APP_URL || APP_URL_PADRAO;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') url = String(argv[++i] ?? '');
    else pos.push(argv[i]);
  }
  const [id, formId] = pos;
  if (!id || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) throw new Error('saveId inválido');
  if (!formId || !FORM_RE.test(formId)) throw new Error('formId inválido (rookie, champion-power, ..., ultra)');
  return { id, formId, url };
}

async function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2), process.env); } catch (e) { console.error(e.message); process.exit(2); }
  const key = process.env.METRICS_ADMIN_KEY;
  if (!key) { console.error('Defina METRICS_ADMIN_KEY.'); process.exit(2); }
  const r = await fetch(`${o.url}/api/sprite-admin?action=release-form`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Metrics-Key': key }, body: JSON.stringify({ id: o.id, formId: o.formId }),
  });
  if (r.status === 401 || r.status === 404) { console.error(`Chave recusada (${r.status}).`); process.exit(3); }
  if (!r.ok) { console.error(`HTTP ${r.status}: ${await r.text()}`); process.exit(4); }
  const j = await r.json();
  console.log(`Forma ${j.formId} liberada: contador ${j.antes} -> ${j.depois}. A pessoa gera de novo ao abrir a árvore.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(e => { console.error(String(e?.message ?? e)); process.exit(1); });
}
