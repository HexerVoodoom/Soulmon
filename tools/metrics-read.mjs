#!/usr/bin/env node
/**
 * Lê os números do Soulmon e imprime o relatório. O TRANSPORTE — as regras de
 * leitura estão em `metricsReport.mjs`, que é puro e testado.
 *
 * Uso:
 *   METRICS_ADMIN_KEY=… node tools/metrics-read.mjs --from 2026-08-01 --to 2026-08-31
 *   node tools/metrics-read.mjs --file resposta.json     (offline, sem chave)
 *
 * Sem a chave a rota responde 404 de propósito (falha fechada), e este script
 * diz isso em vez de fingir que não há dados — as duas situações são diferentes
 * e confundi-las é como um painel vazio vira "o produto não está sendo usado".
 */
import { readFileSync } from 'node:fs';
import { renderRelatorio } from './metricsReport.mjs';

const BASE = process.env.SOULMON_METRICS_URL ?? 'https://soulmon.mateus-sprnd.workers.dev/api/metrics';

function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const hoje = new Date().toISOString().slice(0, 10);
const trintaAtras = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

async function main() {
  const arquivo = arg('file', null);
  let payload;

  if (arquivo) {
    payload = JSON.parse(readFileSync(arquivo, 'utf-8'));
  } else {
    const chave = process.env.METRICS_ADMIN_KEY;
    if (!chave) {
      console.error('METRICS_ADMIN_KEY não está no ambiente.');
      console.error('A rota falha FECHADA (404 sem chave), então sem ela não há o que ler.');
      console.error('Defina a variável no Cloudflare Pages e exporte-a aqui, ou use --file.');
      process.exit(2);
    }
    const from = arg('from', trintaAtras);
    const to = arg('to', hoje);
    const r = await fetch(`${BASE}?from=${from}&to=${to}`, { headers: { 'X-Metrics-Key': chave } });
    if (r.status === 404) {
      console.error('404: a chave não confere, ou o servidor não tem METRICS_ADMIN_KEY.');
      console.error('404 aqui NÃO significa "sem dados" — significa "sem permissão".');
      process.exit(3);
    }
    if (!r.ok) { console.error(`HTTP ${r.status}`); process.exit(4); }
    payload = await r.json();
  }

  console.log(renderRelatorio(payload).join('\n'));
}

main().catch(err => { console.error(err?.message ?? err); process.exit(1); });
