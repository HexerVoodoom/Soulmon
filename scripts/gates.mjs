#!/usr/bin/env node
/**
 * `npm run gates` — o caminho RÁPIDO para saber se dá para commitar.
 *
 * Roda, em paralelo, os 3 typechecks do CLAUDE.md (app, overlay desktop,
 * servidor) e, ao mesmo tempo, só os testes que TOCAM no que mudou desde a
 * `origin/main` (`vitest run --changed origin/main`: o vitest segue o grafo de
 * imports, então um teste de contrato que lê a fonte de um módulo alterado
 * entra; um que só LÊ o `dist/` ou um .md, não — para isso existe o completo).
 *
 * NÃO substitui `npm run portoes` (o ci.yml inteiro, em série, com a suíte
 * toda) nem o CI (que roda tudo em 4 shards). É o laço interno: minutos → segundos.
 *
 * Uso:  npm run gates                 (tsc ×3 em paralelo + testes alterados)
 *       npm run gates -- --so-tipos   (só os 3 tsc)
 *       npm run gates -- --base=HEAD~1 (outra base para o "alterado")
 *
 * Saída de cada passo só aparece se ele FALHAR (ou com --verbose): três tsc
 * intercalados no mesmo terminal são ilegíveis.
 */
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const soTipos = args.includes('--so-tipos');
const verbose = args.includes('--verbose');
const base = (args.find((a) => a.startsWith('--base=')) ?? '--base=origin/main').slice(7);

const passos = [
  ['tsc app (src/)', 'npx tsc --noEmit'],
  ['tsc overlay desktop', 'npx tsc -p desktop/tsconfig.json --noEmit'],
  ['tsc servidor (functions/ + workers/)', 'npx tsc -p tsconfig.server.json --noEmit'],
  ...(soTipos ? [] : [[`vitest (alterados desde ${base})`, `npx vitest run --changed ${base} --passWithNoTests`]]),
];

const rodar = ([nome, cmd]) =>
  new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn(cmd, { shell: true, env: process.env });
    let saida = '';
    p.stdout.on('data', (d) => { saida += d; });
    p.stderr.on('data', (d) => { saida += d; });
    p.on('close', (code) => resolve({ nome, code, saida, s: ((Date.now() - t0) / 1000).toFixed(1) }));
  });

const inicio = Date.now();
const res = await Promise.all(passos.map(rodar));
let ruim = 0;
for (const r of res) {
  const ok = r.code === 0;
  if (!ok) ruim++;
  console.log(`${ok ? '✔' : '✖'} ${r.nome}  (${r.s} s)`);
  if (!ok || verbose) console.log(r.saida.trimEnd().split('\n').map((l) => '    ' + l).join('\n'));
}
console.log(`\n${ruim ? `✖ ${ruim} passo(s) vermelho(s)` : '✔ verde'} em ${((Date.now() - inicio) / 1000).toFixed(0)} s` +
  (soTipos ? '' : ' — antes de mergear rode também `npm run portoes` (suíte inteira) ou confie no CI (4 shards).'));
process.exit(ruim ? 1 : 0);
