#!/usr/bin/env node
/**
 * O FUNIL DA SEMANA — a tabela que o dono lê toda segunda.
 * ========================================================
 *
 * Decisão #18 do QA GERAL (21/09/2026): "`METRICS_ADMIN_KEY`: definir; script
 * de leitura vem junto". O achado que motivou (`08-produto-maestro.md` §2.b
 * item 2): a instrumentação existe ponta a ponta, o GET é fail-closed, e
 * NINGUÉM lê — "o primeiro usuário real vai gerar dado que ninguém vai olhar".
 *
 * O que este script é, e o que NÃO é:
 *  · É o TRANSPORTE + uma tabela: busca os últimos 7 dias em `GET /api/metrics`
 *    e imprime o funil install → onboarding_step → first_task_done →
 *    day_active → week_active → retained d1/d7/d30. As REGRAS de leitura
 *    (mediana, `n` em toda linha, eixo no zero, recusa de conversão curta) já
 *    moram em `tools/metricsReport.mjs` e são REUSADAS — `--full` imprime o
 *    relatório inteiro de lá logo abaixo da tabela. Nada daquilo é copiado
 *    aqui (footgun 9).
 *  · NÃO calcula taxa entre linhas do funil como se fossem as mesmas pessoas.
 *    O agregado é por dia de EVENTO, sem coorte (cabeçalho de
 *    `functions/api/metrics.js`): `first_task_done ÷ install` da mesma semana
 *    é a razão entre dois grupos que não são o mesmo grupo. A coluna "% do
 *    topo" existe porque é a pergunta que o dono vai fazer de qualquer jeito —
 *    e sai rotulada como APROXIMADA, com o `n` ao lado, na mesma janela.
 *  · `tools/metrics-read.mjs` continua existindo: é o relatório completo com
 *    janela livre. Este é o atalho de uma semana. Os dois leem a mesma rota
 *    com a mesma chave.
 *
 * Uso:
 *   METRICS_ADMIN_KEY=… APP_URL=https://soulmon.mateus-sprnd.workers.dev node scripts/metrics-report.mjs
 *   node scripts/metrics-report.mjs --url https://… [--to 2026-09-21] [--days 7] [--full]
 *
 * Saídas: 0 ok · 2 sem chave · 3 chave recusada (404/401) · 4 outro HTTP · 1 erro.
 * Sem a chave a rota responde 404 de propósito (falha fechada), e este script
 * diz isso em vez de fingir que não há dados — as duas situações são
 * diferentes, e confundi-las é como um painel vazio vira "ninguém usa".
 */
import { fileURLToPath } from 'node:url';
import { renderRelatorio, razao, linhaDeRazao } from '../tools/metricsReport.mjs';

/** URL de produção — a mesma de `CLAUDE.md` § Deploy. `APP_URL`/`--url` sobrepõem. */
export const APP_URL_PADRAO = 'https://soulmon.mateus-sprnd.workers.dev';
export const DIAS_PADRAO = 7;

/**
 * As linhas do funil, na ORDEM em que uma pessoa as atravessa. Cada uma cita a
 * chave do agregado que a alimenta (ver `applyAggregate` em `metrics.js`).
 * `onboarding_step` é o TOTAL de passos emitidos (todo funil, todo passo) — é
 * o sinal de "entrou no ritual", não "terminou"; o drop-off por passo está no
 * relatório completo (`--full`).
 */
export const LINHAS_DO_FUNIL = [
  ['install', 'install'],
  ['onboarding_step', 'onboarding_step'],
  ['first_task_done', 'first_task_done'],
  ['day_active', 'day_active'],
  ['week_active', 'week_active'],
  ['retained d1', 'retained.d1'],
  ['retained d7', 'retained.d7'],
  ['retained d30', 'retained.d30'],
];

const ehNum = (v) => typeof v === 'number' && Number.isFinite(v);
const n = (totais, chave) => (ehNum(totais?.[chave]) ? totais[chave] : 0);

/**
 * A tabela do funil como linhas de texto. PURA — recebe o JSON de
 * `GET /api/metrics`, devolve strings. É o que o teste trava.
 * @param {object} payload
 * @returns {string[]}
 */
export function tabelaDoFunil(payload) {
  const totais = payload?.totals ?? {};
  const out = [];
  out.push(`FUNIL — ${payload?.from ?? '?'} a ${payload?.to ?? '?'}`);
  out.push('  etapa            │     n │ % do topo (≈, mesma janela, NÃO é coorte)');
  out.push('  ─────────────────┼───────┼──────────────────────────────────────────');
  const topo = n(totais, LINHAS_DO_FUNIL[0][1]);
  for (const [rotulo, chave] of LINHAS_DO_FUNIL) {
    const v = n(totais, chave);
    const r = razao(v, topo);
    const pct = r ? `~${(r.valor * 100).toFixed(1)}%` : 'sem dados';
    out.push(`  ${rotulo.padEnd(16)} │ ${String(v).padStart(5)} │ ${pct}`);
  }
  out.push('');
  // A frase que o servidor manda (`notes.unreadable`) vem repetida aqui, e não
  // resumida: é ele quem sabe o que não sabe.
  const cegos = payload?.notes?.unreadable;
  if (Array.isArray(cegos) && cegos.length) {
    out.push('  ⚠️ NÃO calculável a partir deste agregado: ' + cegos.join(' · '));
  }
  out.push(`  ⚠️ ${linhaDeRazao('first_task_done ÷ install', razao(n(totais, 'first_task_done'), topo))}`);
  out.push('     — dois grupos da mesma semana, não as mesmas pessoas. Leia como tendência, nunca como taxa.');
  return out;
}

function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}
const flag = (nome) => process.argv.includes(`--${nome}`);

/** `YYYY-MM-DD` UTC de `dias` atrás (0 = hoje). */
export function diaUtc(diasAtras = 0, agora = Date.now()) {
  return new Date(agora - diasAtras * 86400000).toISOString().slice(0, 10);
}

/** Janela dos últimos `dias` dias terminando em `to` (inclusivo). */
export function janela(to = diaUtc(0), dias = DIAS_PADRAO) {
  const fim = Date.parse(`${to}T00:00:00Z`);
  const from = new Date(fim - (dias - 1) * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

async function main() {
  const chave = process.env.METRICS_ADMIN_KEY;
  if (!chave) {
    console.error('METRICS_ADMIN_KEY não está no ambiente.');
    console.error('A rota /api/metrics falha FECHADA (404 sem chave): sem ela não há o que ler.');
    console.error('Defina o segredo no Cloudflare Pages (o mesmo valor) e exporte-o aqui:');
    console.error('  METRICS_ADMIN_KEY=… node scripts/metrics-report.mjs');
    process.exit(2);
  }

  const base = (arg('url', process.env.APP_URL ?? APP_URL_PADRAO)).replace(/\/+$/, '');
  const dias = Number.parseInt(arg('days', String(DIAS_PADRAO)), 10) || DIAS_PADRAO;
  const { from, to } = janela(arg('to', diaUtc(0)), dias);

  const r = await fetch(`${base}/api/metrics?from=${from}&to=${to}`, { headers: { 'X-Metrics-Key': chave } });
  if (r.status === 404 || r.status === 401) {
    console.error(`${r.status}: a chave não confere, ou o servidor não tem METRICS_ADMIN_KEY.`);
    console.error('Isto NÃO significa "sem dados" — significa "sem permissão".');
    process.exit(3);
  }
  if (!r.ok) { console.error(`HTTP ${r.status} em ${base}/api/metrics`); process.exit(4); }
  const payload = await r.json();

  console.log(tabelaDoFunil(payload).join('\n'));
  if (flag('full')) {
    console.log('');
    console.log(renderRelatorio(payload).join('\n'));
  }
}

// Só roda quando é o PROGRAMA — importado pelo teste, só exporta.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => { console.error(err?.message ?? err); process.exit(1); });
}
