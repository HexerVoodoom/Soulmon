#!/usr/bin/env node
/**
 * `node scripts/crash-report.mjs` - lista os crashes que o app reportou (/api/crash).
 *
 * Par de `functions/api/crash.js`: lê com o MESMO segredo do relatório de métricas
 * (`METRICS_ADMIN_KEY`, cabeçalho `X-Metrics-Key`). Sem o segredo a rota responde
 * 404 de propósito. Os registros se apagam sozinhos em 14 dias.
 *
 * Uso:
 *   METRICS_ADMIN_KEY=... node scripts/crash-report.mjs
 *   node scripts/crash-report.mjs --url https://... [--days 7] [--json]
 *
 * Saídas: 0 ok (com ou sem crashes) · 2 sem chave · 3 chave recusada (404/401) · 4 outro HTTP · 1 erro.
 */
import { fileURLToPath } from 'node:url';

export const APP_URL_PADRAO = 'https://soulmon.mateus-sprnd.workers.dev';
export const DIAS_PADRAO = 7;
export const DIAS_MAX = 14;

export function parseArgs(argv, env = {}) {
  const out = { url: env.APP_URL || APP_URL_PADRAO, days: DIAS_PADRAO, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') out.url = argv[++i];
    else if (argv[i] === '--days') out.days = Math.min(DIAS_MAX, Math.max(1, Number(argv[++i]) || DIAS_PADRAO));
    else if (argv[i] === '--json') out.json = true;
  }
  return out;
}

export function janela(days, hoje = new Date()) {
  const to = hoje.toISOString().slice(0, 10);
  const from = new Date(hoje.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

export function renderTabela(res) {
  if (!res.crashes.length) return `Nenhum crash reportado entre ${res.from} e ${res.to}.`;
  const linhas = [`${res.count} assinatura(s) de crash entre ${res.from} e ${res.to} (mais frequentes primeiro)`, ''];
  for (const c of res.crashes) {
    linhas.push(`${String(c.n).padStart(4)}x  [${c.kind}] ${c.msg}`);
    linhas.push(`       dia ${c.day} | versoes ${(c.vers ?? [c.ver]).join(',')} | ${c.plat} | rota ${c.route} | ${c.first} -> ${c.last} UTC | sig ${c.sig}`);
    const frame = String(c.stack || '').split('\n').slice(0, 3).map(l => `         ${l.trim()}`).join('\n');
    if (frame.trim()) linhas.push(frame);
    linhas.push('');
  }
  return linhas.join('\n');
}

async function main() {
  const key = process.env.METRICS_ADMIN_KEY;
  if (!key) {
    console.error('Falta METRICS_ADMIN_KEY no ambiente (o mesmo segredo do relatorio de metricas).');
    return 2;
  }
  const args = parseArgs(process.argv.slice(2), process.env);
  const { from, to } = janela(args.days);
  const r = await fetch(`${args.url}/api/crash?from=${from}&to=${to}`, { headers: { 'X-Metrics-Key': key } });
  if (r.status === 404 || r.status === 401) {
    console.error(`Chave recusada (HTTP ${r.status}). Confira METRICS_ADMIN_KEY no Worker e aqui.`);
    return 3;
  }
  if (!r.ok) {
    console.error(`HTTP ${r.status}`);
    return 4;
  }
  const res = await r.json();
  console.log(args.json ? JSON.stringify(res, null, 2) : renderTabela(res));
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(c => process.exit(c), e => { console.error(e); process.exit(1); });
}
