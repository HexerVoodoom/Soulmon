#!/usr/bin/env node
/**
 * mutation-sweep.mjs — mede o DETECTOR, não o detectado.
 *
 * POR QUE ESTE SCRIPT EXISTE
 * A suíte tem centenas de testes verdes. Verde não prova que o teste OLHA para
 * alguma coisa: três guards cegos já passaram por aqui (o `simulateReset` que
 * reimplementava a regra, o `cloudSync.test.ts` que comparava uma terceira
 * cópia dos números, o `GameStateContext.hostile.test.tsx` que nunca montava o
 * `useDailyReset`). Cobertura não pega isso — a linha É executada, ninguém
 * afirma nada sobre ela.
 *
 * COMO ELE MEDE
 * Aplica uma mutação mecânica numa linha do código de PRODUÇÃO, roda a suíte
 * relevante e reverte. Se nenhum teste ficou vermelho, aquele mutante
 * SOBREVIVEU: ou o teste é cego naquela linha, ou a mutação é EQUIVALENTE
 * (não muda comportamento observável). O script não sabe distinguir os dois —
 * quem separa é humano, na leitura do relatório.
 *
 * USO
 *   node scripts/mutation-sweep.mjs                # todos os alvos
 *   node scripts/mutation-sweep.mjs dailyReset     # alvos que casam com o filtro
 *   node scripts/mutation-sweep.mjs --json out.json
 *
 * CUSTO
 * Roda só a suíte relevante por alvo (~2s), não a suíte inteira (~13s). Todo
 * SOBREVIVENTE é reconfirmado contra a suíte COMPLETA antes de entrar no
 * relatório — senão um subset estreito viraria falso positivo.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..');

// ---------------------------------------------------------------------------
// Alvos: priorizados por DANO (dinheiro, save, laço do dia), não por cobertura.
// `tests` é o subset rodado por mutante. Ser generoso aqui é barato; ser
// estreito demais fabrica sobreviventes falsos.
// ---------------------------------------------------------------------------
const TARGETS = [
  {
    file: 'src/utils/dailyReset.ts',
    tests: ['src/utils/dailyReset.test.ts', 'src/hooks/useDailyReset.test.ts',
      'src/hooks/useDailyReset.clock.test.ts', 'src/utils/dailyGoal.contract.test.ts',
      'src/utils/dailyGoalSources.test.ts', 'src/utils/gameRules.fuzz.test.ts',
      'src/utils/mood.test.ts', 'src/utils/passives.test.ts'],
  },
  {
    file: 'src/utils/careRules.ts',
    tests: ['src/utils/careRules.test.ts', 'src/utils/dailyGoalSources.test.ts',
      'src/utils/gameRules.fuzz.test.ts', 'src/utils/passives.test.ts',
      'src/utils/mood.test.ts'],
  },
  {
    file: 'src/utils/carePattern.ts',
    tests: ['src/utils/carePattern.test.ts', 'src/utils/careHistory.contract.test.ts',
      'src/utils/gameRules.fuzz.test.ts'],
  },
  {
    file: 'src/types/progression.ts',
    tests: ['src/types/progression.test.ts', 'src/hooks/useDailyReset.test.ts',
      'src/utils/dailyGoal.contract.test.ts', 'src/utils/gameRules.fuzz.test.ts',
      'src/contexts/GameStateContext.hostile.test.tsx',
      'desktop/renderer/src/cloudSync.test.ts'],
  },
  {
    file: 'src/contexts/GameStateContext.tsx',
    tests: ['src/contexts/GameStateContext.hostile.test.tsx',
      'src/contexts/GameStateContext.saveContent.test.tsx',
      'src/contexts/GameStateContext.hydrate.fuzz.test.tsx',
      'src/contexts/GameStateContext.legacySave.test.tsx',
      'src/contexts/GameStateContext.storage.test.tsx',
      'src/contexts/migrateDecor.test.ts', 'src/utils/dailyGoal.contract.test.ts'],
  },
  {
    file: 'functions/api/_entitlements.js',
    tests: ['functions/api/_entitlements.test.js', 'functions/api/entitlements.test.js',
      'functions/api/billing.test.js', 'functions/api/costCeiling.test.js',
      'src/utils/currencies.test.ts'],
  },
  {
    file: 'functions/api/_billing.js',
    tests: ['functions/api/_billing.test.js', 'functions/api/billing.test.js'],
  },
  {
    file: 'functions/api/save.js',
    tests: ['functions/api/save.test.js', 'functions/api/saveId.parity.test.js',
      'functions/api/_auth.test.js'],
  },
  {
    file: 'desktop/renderer/src/cloudSync.ts',
    tests: ['desktop/renderer/src/cloudSync.test.ts',
      'desktop/renderer/src/cloudSync.snapshot.test.ts',
      'desktop/renderer/src/pushCareAction.test.ts',
      'functions/api/saveId.parity.test.js'],
  },
];

// ---------------------------------------------------------------------------
// Máscara de código: posições dentro de string/template/comentário NÃO são
// mutáveis. Sem isso o script mutila mensagens de erro e chaves de storage —
// ruído que não mede teste nenhum.
// ---------------------------------------------------------------------------
function codeMask(src) {
  const mask = new Uint8Array(src.length); // 1 = código mutável
  let i = 0;
  const S = { CODE: 0, LINE: 1, BLOCK: 2, SQ: 3, DQ: 4, TPL: 5 };
  let state = S.CODE;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (state === S.CODE) {
      if (c === '/' && n === '/') { state = S.LINE; i += 2; continue; }
      if (c === '/' && n === '*') { state = S.BLOCK; i += 2; continue; }
      if (c === "'") { state = S.SQ; i++; continue; }
      if (c === '"') { state = S.DQ; i++; continue; }
      if (c === '`') { state = S.TPL; i++; continue; }
      mask[i] = 1; i++; continue;
    }
    if (state === S.LINE) { if (c === '\n') state = S.CODE; i++; continue; }
    if (state === S.BLOCK) { if (c === '*' && n === '/') { state = S.CODE; i += 2; continue; } i++; continue; }
    if (state === S.SQ || state === S.DQ || state === S.TPL) {
      if (c === '\\') { i += 2; continue; }
      if ((state === S.SQ && c === "'") || (state === S.DQ && c === '"') || (state === S.TPL && c === '`')) {
        state = S.CODE;
      }
      i++; continue;
    }
  }
  return mask;
}

// ---------------------------------------------------------------------------
// Operadores. Cada um devolve [{index, len, to}] em posições de código.
// Regra de ouro: só mutações que preservam a SINTAXE. Um mutante que não
// compila é sempre "morto" e mede nada.
// ---------------------------------------------------------------------------
const OPERATORS = [
  // Fronteiras de comparação: o defeito clássico do off-by-one.
  { name: 'relacional', re: / (>=|<=|>|<) /g, map: { '>=': '>', '<=': '<', '>': '>=', '<': '<=' } },
  // Igualdade negada: pega guard que nunca é exercido nos dois lados.
  { name: 'igualdade', re: / (===|!==) /g, map: { '===': '!==', '!==': '===' } },
  // Lógico: pega condição composta testada só por um dos ramos.
  { name: 'logico', re: / (&&|\|\|) /g, map: { '&&': '||', '||': '&&' } },
  // Aritmético binário (exige espaços, então não pega `++`/`+=`/unário).
  { name: 'aritmetico', re: / (\+|-|\*) /g, map: { '+': '-', '-': '+', '*': '+' } },
  // Clamp invertido: min/max trocados é bug de saldo/HP silencioso.
  { name: 'clamp', re: /Math\.(min|max)\(/g, map: { 'Math.min(': 'Math.max(', 'Math.max(': 'Math.min(' } },
  // Booleano literal.
  { name: 'booleano', re: /\b(true|false)\b/g, map: { true: 'false', false: 'true' } },
  // Optional chaining removido: se ninguém testa o caminho nulo, sobrevive.
  { name: 'optional-chain', re: /\?\./g, map: { '?.': '.' } },
  // Coalescência vira OR: difere só quando o valor é falsy-mas-definido
  // (0, '', false) — exatamente onde saldo/contador zerado mora.
  { name: 'coalescencia', re: / \?\? /g, map: { '??': '||' } },
];

function numericMutants(src, mask) {
  const out = [];
  const re = /(?<![\w.$])(\d+(?:\.\d+)?)(?![\w.])/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (!mask[m.index]) continue;
    const lit = m[1];
    // `0` vira `1` e qualquer outro vira `0`: mexe no valor, nunca na sintaxe.
    out.push({ index: m.index, len: lit.length, from: lit, to: Number(lit) === 0 ? '1' : '0', op: 'literal-numerico' });
  }
  return out;
}

function buildMutants(src) {
  const mask = codeMask(src);
  const out = [];
  for (const op of OPERATORS) {
    op.re.lastIndex = 0;
    let m;
    while ((m = op.re.exec(src)) !== null) {
      // O grupo 1 é o token; o match pode incluir espaços em volta.
      const token = m[1] !== undefined ? m[1] : m[0];
      const key = op.name === 'clamp' ? m[0] : token;
      const to = op.map[key];
      if (to === undefined) continue;
      const idx = m[0].indexOf(key) + m.index;
      if (!mask[idx]) continue;
      out.push({ index: idx, len: key.length, from: key, to, op: op.name });
      op.re.lastIndex = m.index + 1; // permite matches adjacentes
    }
  }
  out.push(...numericMutants(src, mask));
  out.sort((a, b) => a.index - b.index);
  return out;
}

function lineOf(src, index) {
  return src.slice(0, index).split('\n').length;
}
function lineText(src, index) {
  const start = src.lastIndexOf('\n', index) + 1;
  let end = src.indexOf('\n', index);
  if (end === -1) end = src.length;
  return src.slice(start, end).trim();
}

// `npx` + shell custa ~1s a mais por chamada e, multiplicado por centenas de
// mutantes, é a diferença entre 20min e 1h. Chamamos o entrypoint do vitest
// direto pelo mesmo node.
const VITEST = path.join(REPO, 'node_modules', 'vitest', 'vitest.mjs');

// Timeout CURTO de propósito: uma mutação pode transformar um laço em laço
// infinito (`i < n` -> `i <= n` num índice, `>` -> `>=` num decremento). Isso é
// um mutante MORTO — a suíte não termina — mas com timeout de 5min ele custava
// 5min de relógio. 90s é folgado contra a suíte completa (~13s).
function runVitest(files, timeout = 90000) {
  const r = spawnSync(process.execPath, [VITEST, 'run', '--reporter=dot', ...files], {
    cwd: REPO, encoding: 'utf8', timeout,
  });
  // `status === null` = morto pelo timeout (travou) => conta como MORTO.
  return { ok: r.status === 0, timedOut: r.status === null, out: (r.stdout || '') + (r.stderr || '') };
}

// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const jsonIdx = args.indexOf('--json');
const jsonOut = jsonIdx >= 0 ? args[jsonIdx + 1] : null;
const filters = args.filter((a, i) => !a.startsWith('--') && i !== jsonIdx + 1);
const targets = filters.length
  ? TARGETS.filter((t) => filters.some((f) => t.file.includes(f)))
  : TARGETS;

// ---------------------------------------------------------------------------
// REDE DE SEGURANÇA. O `finally` reverte o arquivo em qualquer erro, mas NÃO
// sobrevive a um SIGKILL entre o `write` do mutante e o `write` da reversão —
// e isso ACONTECEU nesta rodada: o processo foi morto e
// `functions/api/_entitlements.js` ficou com `slice(-0)` no lugar de
// `slice(-200)` no working tree. Um mutante esquecido no código é o pior
// resultado possível de uma ferramenta de QA.
//
// Duas camadas:
//   1. um `.bak` ao lado do alvo enquanto ele está mutado; se o script começar
//      e achar um `.bak` órfão, ele RESTAURA antes de qualquer coisa;
//   2. handlers de sinal que revertem no caminho de saída.
// ---------------------------------------------------------------------------
const bakOf = (abs) => abs + '.mutation-bak';
let inFlight = null; // { abs, original } do mutante aplicado neste instante

function revertInFlight() {
  if (!inFlight) return;
  try { writeFileSync(inFlight.abs, inFlight.original); } catch { /* ignore */ }
  try { if (existsSync(bakOf(inFlight.abs))) unlinkSync(bakOf(inFlight.abs)); } catch { /* ignore */ }
  inFlight = null;
}
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  try { process.on(sig, () => { revertInFlight(); process.exit(130); }); } catch { /* ignore */ }
}
process.on('exit', revertInFlight);
process.on('uncaughtException', (e) => { revertInFlight(); throw e; });

// Recuperação de uma execução anterior morta na marra.
for (const t of TARGETS) {
  const abs = path.join(REPO, t.file);
  if (existsSync(bakOf(abs))) {
    console.error(`[RECUPERAÇÃO] ${t.file} ficou mutado numa execução anterior — restaurando do .bak`);
    writeFileSync(abs, readFileSync(bakOf(abs), 'utf8'));
    unlinkSync(bakOf(abs));
  }
}

const report = [];
for (const target of targets) {
  const abs = path.join(REPO, target.file);
  const original = readFileSync(abs, 'utf8');
  const mutants = buildMutants(original);

  // Sanidade: o subset TEM que estar verde antes de mutar. Subset vermelho de
  // origem mataria todo mutante e o resultado seria 100% de mentira.
  const base = runVitest(target.tests);
  if (!base.ok) {
    console.error(`[BASELINE VERMELHO] ${target.file} — subset falha sem mutação. Abortando este alvo.`);
    console.error(base.out.slice(-2000));
    continue;
  }

  console.log(`\n=== ${target.file} — ${mutants.length} mutantes`);
  const survivors = [];
  let killed = 0;
  for (let k = 0; k < mutants.length; k++) {
    const mu = mutants[k];
    const t0 = Date.now();
    const mutated = original.slice(0, mu.index) + mu.to + original.slice(mu.index + mu.len);
    let res;
    try {
      writeFileSync(bakOf(abs), original);   // rede contra SIGKILL
      inFlight = { abs, original };
      writeFileSync(abs, mutated);
      res = runVitest(target.tests);
    } finally {
      revertInFlight(); // SEMPRE reverte + apaga o .bak
    }
    const line = lineOf(original, mu.index);
    if (res.ok) {
      // Sobreviveu ao subset: reconfirma na suíte COMPLETA antes de acusar.
      let full;
      try {
        writeFileSync(bakOf(abs), original);
        inFlight = { abs, original };
        writeFileSync(abs, mutated);
        full = runVitest([]);
      } finally {
        revertInFlight();
      }
      if (full.ok) {
        survivors.push({ line, op: mu.op, from: mu.from, to: mu.to, code: lineText(original, mu.index) });
        console.log(`  SOBREVIVEU ${target.file}:${line} [${mu.op}] ${mu.from} -> ${mu.to}  |  ${lineText(original, mu.index)}`);
      } else {
        killed++;
        console.log(`  morto-por-suite-completa ${target.file}:${line} [${mu.op}] ${mu.from} -> ${mu.to}`);
      }
    } else {
      killed++;
    }
    process.stdout.write(`  [${k + 1}/${mutants.length}] mortos=${killed} vivos=${survivors.length} (${Date.now() - t0}ms)\r`);
  }
  const total = mutants.length;
  report.push({
    file: target.file, total, killed, survived: survivors.length,
    score: total ? +((killed / total) * 100).toFixed(1) : 100, survivors,
  });
  console.log(`\n--- ${target.file}: ${killed}/${total} mortos (${total ? ((killed / total) * 100).toFixed(1) : 100}%)`);
}

console.log('\n===== RESUMO =====');
for (const r of report) {
  console.log(`${r.file}\t${r.killed}/${r.total}\t${r.score}%\tvivos=${r.survived}`);
}
if (jsonOut) writeFileSync(path.resolve(jsonOut), JSON.stringify(report, null, 2));
