#!/usr/bin/env node
/**
 * orcamento-de-tempo.mjs — mede QUEM ESTÁ PERTO DO TETO, e quem é INSTÁVEL.
 *
 * POR QUE ESTE SCRIPT EXISTE
 * Em 26/08/2026 o `vitest.config.ts` ganhou `testTimeout: 15_000` e declarou,
 * por escrito, a dívida que o número NÃO pagava:
 *
 *   "⚠️ DÍVIDA que este número NÃO paga: ninguém mediu quem mais está perto do
 *    teto. Falta o passe ordenando testes por tempo e uma regra de 'teste acima
 *    de X% do orçamento é dívida nomeada'."
 *
 * Este arquivo é esse passe. O teto sozinho é um piso de robustez; ele não diz
 * nada sobre a distância de cada teste até ele. O incidente que motivou tudo
 * (`squad-alpha-runs/soulmon-02/sweeper/flake-assets-contract.md`) mostrou que
 * o sinal útil não é a duração média — é a MARGEM sob contenção: o mesmo teste
 * foi medido a 594 ms ocioso, 1242 ms na suíte completa, 2599 ms sob 6
 * processos concorrentes e 5005 ms sob 8 (timeout). O fator entre carga normal
 * e carga que estoura é ~4,4×, e é pequeno demais para se descobrir na hora.
 *
 * POR QUE ISTO É UM SCRIPT E NÃO UM TESTE DA SUÍTE
 * A pergunta foi feita e a resposta é medida, não estética. Um teste que
 * afirmasse "nenhum teste passa de X ms" seria FLAKY POR CONSTRUÇÃO:
 *   • o número que ele lê depende de quantos processos disputam a CPU naquele
 *     segundo — a mesma variável que produziu o flake original;
 *   • com o pior caso de hoje em 1248 ms, o fator de contenção medido (4,4×)
 *     levaria esse teste a ~5,5 s, ou seja, ACIMA do limiar de dívida (25% =
 *     3750 ms). O guard ficaria vermelho numa máquina carregada sem que nada
 *     tivesse piorado no código;
 *   • e um limiar frouxo o bastante para nunca falhar por contenção só
 *     acusaria depois que o dano já existisse.
 * Trocar um flake por outro seria pagar a dívida com a mesma moeda que a
 * criou. Então a disciplina é: MEDIÇÃO SOB DEMANDA (este script, determinístico
 * no que reporta, sem asserção de relógio dentro da suíte) + BASELINE ESCRITO
 * com data e máquina (`sweeper/orcamento-de-tempo.md`). O script tem código de
 * saída para quem quiser ligá-lo num CI DEDICADO, em máquina ociosa — mas ele
 * NÃO entra no gate de `npm test`, justamente para não flakear o gate.
 *
 * O QUE ELE MEDE
 * Roda a suíte N vezes (padrão 2 — uma rodada só não enxerga instabilidade) e
 * cruza as rodadas por nome completo do teste. Reporta:
 *   • ranking por PIOR CASO entre as rodadas (não pela média: a média esconde
 *     exatamente o caso que estoura);
 *   • quantos testes cruzam cada faixa de `vitest.budget.mjs`;
 *   • INSTABILIDADE — razão pior/melhor e delta absoluto. Um teste que varia
 *     muito entre duas rodadas ociosas vai variar mais sob contenção; é ele
 *     que vira timeout, não o lento e constante.
 *
 * USO
 *   node scripts/orcamento-de-tempo.mjs                 # 2 rodadas
 *   node scripts/orcamento-de-tempo.mjs --rodadas 5     # amostra maior
 *   node scripts/orcamento-de-tempo.mjs --top 40
 *   node scripts/orcamento-de-tempo.mjs --json saida.json
 *
 * CÓDIGO DE SAÍDA
 *   0 = nenhum teste acima do limiar de DÍVIDA (25% do orçamento)
 *   1 = há dívida nomeada a registrar, ou a suíte não terminou
 * (rode em máquina ociosa; num runner disputado o 1 mede a máquina, não o
 * código — é o motivo de isto não estar no gate.)
 *
 * CUSTO
 * ~33 s por rodada nesta árvore. 2 rodadas ≈ 1 min. É caro para todo commit e
 * barato para uma vez por fase — que é a cadência que a régra abaixo pede.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { TEST_TIMEOUT_MS, LIMIARES } from '../vitest.budget.mjs';

const REPO = path.resolve(import.meta.dirname, '..');
const VITEST = path.join(REPO, 'node_modules', 'vitest', 'vitest.mjs');

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
function opcao(nome, padrao) {
  const i = argv.indexOf(nome);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : padrao;
}
const RODADAS = Math.max(1, Number(opcao('--rodadas', 2)) || 2);
const TOP = Math.max(1, Number(opcao('--top', 20)) || 20);
const JSON_OUT = opcao('--json', null);

// ---------------------------------------------------------------------------
// Coleta: o reporter JSON do próprio vitest. Não parseamos a saída humana do
// `--reporter=verbose` de propósito — ela é formatação, muda de versão, e
// arredonda. `assertionResults[].duration` é o número que o runner usou.
// ---------------------------------------------------------------------------
/** @returns {Map<string, number>} nome completo do teste → duração em ms */
function umaRodada(n, dir) {
  const arquivo = path.join(dir, `rodada-${n}.json`);
  process.stderr.write(`  rodada ${n}/${RODADAS} … `);
  const t0 = Date.now();
  // Chamamos o entrypoint do vitest com o próprio node, e não `npx` — mesmo
  // padrão de `scripts/mutation-sweep.mjs:215`. No Windows, `spawnSync` recusa
  // `npx.cmd` com EINVAL (proteção do Node contra injeção via `.cmd`), e usar
  // `shell: true` reabriria exatamente esse buraco por um ganho de zero.
  const r = spawnSync(
    process.execPath,
    [VITEST, 'run', '--reporter=json', `--outputFile=${arquivo}`],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 },
  );
  const seg = ((Date.now() - t0) / 1000).toFixed(1);

  if (!existsSync(arquivo)) {
    process.stderr.write(`FALHOU (sem relatório)\n`);
    process.stderr.write((r.stderr || r.stdout || '').slice(-4000) + '\n');
    return null;
  }

  const rel = JSON.parse(readFileSync(arquivo, 'utf8'));
  const mapa = new Map();
  let semDuracao = 0;
  for (const suite of rel.testResults ?? []) {
    // `suite.name` é caminho absoluto; encurtamos para caminho do repo para o
    // relatório poder ser colado e comparado entre máquinas.
    const arq = path.relative(REPO, suite.name).replace(/\\/g, '/');
    for (const t of suite.assertionResults ?? []) {
      if (t.status !== 'passed' && t.status !== 'failed') continue; // pulados não têm tempo
      if (typeof t.duration !== 'number') { semDuracao++; continue; }
      mapa.set(`${arq} > ${t.fullName ?? t.title}`, t.duration);
    }
  }
  process.stderr.write(
    `${seg}s · ${mapa.size} testes cronometrados`
    + (semDuracao ? ` (${semDuracao} sem duração)` : '')
    + (rel.success === false ? ' · ⚠️ SUÍTE VERMELHA' : '')
    + '\n',
  );
  return { mapa, verde: rel.success !== false };
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const dir = mkdtempSync(path.join(tmpdir(), 'orcamento-'));
process.stderr.write(
  `orçamento = ${TEST_TIMEOUT_MS} ms · faixas: atenção ${pct(LIMIARES.atencao)}`
  + ` · dívida ${pct(LIMIARES.divida)} · crítico ${pct(LIMIARES.critico)}\n`,
);

const rodadas = [];
let todasVerdes = true;
try {
  for (let i = 1; i <= RODADAS; i++) {
    const r = umaRodada(i, dir);
    if (!r) { process.exitCode = 1; process.stderr.write('\nAbortado: uma rodada não produziu relatório.\n'); break; }
    todasVerdes &&= r.verde;
    rodadas.push(r.mapa);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (rodadas.length === 0) process.exit(1);

// Só entram testes presentes em TODAS as rodadas. Um teste que aparece em uma
// e some na outra não é lento — é outra coisa, e misturar os dois assuntos num
// ranking de tempo é como se perde um achado.
const nomes = [...rodadas[0].keys()].filter(k => rodadas.every(m => m.has(k)));
const linhas = nomes.map(k => {
  const vs = rodadas.map(m => m.get(k));
  const pior = Math.max(...vs);
  const melhor = Math.min(...vs);
  return {
    teste: k,
    rodadas: vs,
    pior,
    melhor,
    delta: pior - melhor,
    // `+1` no denominador: muitos testes marcam 0 ms e a razão explodiria para
    // Infinity sem significar nada. Instabilidade de 0→2 ms não é assunto.
    razao: pior / (melhor + 1),
    pctOrcamento: pior / TEST_TIMEOUT_MS,
  };
});

const fora = nomes.length - Math.min(...rodadas.map(m => m.size));
if (fora !== 0) {
  process.stderr.write(`  (aviso: ${Math.abs(fora)} teste(s) não estavam em todas as rodadas e ficaram fora do cruzamento)\n`);
}

// ---------------------------------------------------------------------------
// Relatório
// ---------------------------------------------------------------------------
function pct(f) { return `${(f * 100).toFixed(0)}%`; }
function ms(n) { return `${Math.round(n)}ms`; }

const acima = (f) => linhas.filter(l => l.pctOrcamento > f);
const atencao = acima(LIMIARES.atencao);
const divida = acima(LIMIARES.divida);
const critico = acima(LIMIARES.critico);

console.log('');
console.log(`# Orçamento de tempo — ${new Date().toISOString()}`);
console.log(`Rodadas: ${rodadas.length} · testes cruzados: ${linhas.length} · orçamento: ${TEST_TIMEOUT_MS} ms`);
console.log(`Suíte verde em todas as rodadas: ${todasVerdes ? 'sim' : 'NÃO'}`);
console.log('');
console.log('## Faixas (por PIOR caso entre as rodadas)');
console.log(`  atenção  > ${pct(LIMIARES.atencao)} (${ms(TEST_TIMEOUT_MS * LIMIARES.atencao)}): ${atencao.length}`);
console.log(`  dívida   > ${pct(LIMIARES.divida)} (${ms(TEST_TIMEOUT_MS * LIMIARES.divida)}): ${divida.length}`);
console.log(`  crítico  > ${pct(LIMIARES.critico)} (${ms(TEST_TIMEOUT_MS * LIMIARES.critico)}): ${critico.length}`);

console.log('');
console.log(`## Top ${TOP} por PIOR CASO`);
[...linhas].sort((a, b) => b.pior - a.pior).slice(0, TOP).forEach((l, i) => {
  console.log(
    `${String(i + 1).padStart(3)}. ${String(Math.round(l.pior)).padStart(6)}ms`
    + ` (${(l.pctOrcamento * 100).toFixed(2)}% do orçamento)`
    + `  [${l.rodadas.map(v => Math.round(v)).join(' / ')}]`
    + `  ${l.teste}`,
  );
});

console.log('');
console.log(`## Top ${TOP} por INSTABILIDADE (razão pior/melhor; só pior ≥ 100ms)`);
console.log('   — o sinal de risco é este, não a duração média: quem já oscila com a');
console.log('     máquina ociosa é quem a contenção transforma em timeout.');
[...linhas].filter(l => l.pior >= 100).sort((a, b) => b.razao - a.razao).slice(0, TOP).forEach((l, i) => {
  console.log(
    `${String(i + 1).padStart(3)}. ${l.razao.toFixed(2)}x  Δ=${String(Math.round(l.delta)).padStart(5)}ms`
    + `  [${l.rodadas.map(v => Math.round(v)).join(' / ')}]`
    + `  ${l.teste}`,
  );
});

if (JSON_OUT) {
  writeFileSync(path.resolve(REPO, JSON_OUT), JSON.stringify({
    geradoEm: new Date().toISOString(),
    orcamentoMs: TEST_TIMEOUT_MS,
    limiares: LIMIARES,
    rodadas: rodadas.length,
    suiteVerde: todasVerdes,
    linhas,
  }, null, 1));
  console.log(`\n(JSON em ${JSON_OUT})`);
}

console.log('');
if (divida.length > 0) {
  console.log(`⚠️  ${divida.length} teste(s) acima de ${pct(LIMIARES.divida)} do orçamento — DÍVIDA NOMEADA.`);
  console.log('   A regra: conserte na ORIGEM (tire o custo do caminho do teste, como em');
  console.log('   flake-assets-contract.md §2) ou registre o nome, o número e o gatilho em');
  console.log('   squad-alpha-runs/<run>/sweeper/orcamento-de-tempo.md. Subir o teto NÃO é conserto.');
  divida.forEach(l => console.log(`   · ${ms(l.pior)} (${(l.pctOrcamento * 100).toFixed(1)}%) ${l.teste}`));
  process.exitCode = 1;
} else {
  console.log(`✅ Nenhum teste acima de ${pct(LIMIARES.divida)} do orçamento (pior caso: `
    + `${ms(Math.max(...linhas.map(l => l.pior)))}).`);
}
if (!todasVerdes) {
  console.log('⚠️  A suíte não ficou verde em alguma rodada — os números acima medem uma árvore quebrada.');
  process.exitCode = 1;
}
