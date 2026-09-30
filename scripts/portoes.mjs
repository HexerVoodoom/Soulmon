#!/usr/bin/env node
/**
 * Portões locais — o `.github/workflows/ci.yml` rodando na máquina, sem Actions.
 *
 * Nasceu em 30/09/2026: o CI passou a abortar em ~4 s em todo commit (runner
 * que não sobe; log 404), e sem ele o único portão real é o local. Os passos
 * são OS MESMOS do `ci.yml`, na mesma ordem — se um mudar lá, mude aqui.
 * Mais o guard do manual (`docs-sync.yml`), que é barato.
 *
 * Uso:  npm run portoes            (ci.yml + guard do manual)
 *       npm run portoes -- --build (e ainda `npm run build`, que regenera dist/)
 *
 * Funciona em PowerShell e em bash (spawn com shell). Para no primeiro vermelho.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const comBuild = process.argv.includes('--build');

function vendorIntegro() {
  const p = JSON.parse(readFileSync('vendor/class-system/_provenance.json', 'utf8'));
  const blob = execFileSync('git', ['show', 'HEAD:vendor/class-system/index.js'], { maxBuffer: 1 << 28 });
  const sha = createHash('sha256').update(blob).digest('hex');
  if (sha !== p.bundleSha256 || blob.length !== p.bundleBytes) {
    console.error('vendor/class-system/index.js NÃO bate com _provenance.json — rode `npm run vendor:class-system` junto com `npm run sync:oracle-data` (mesmo SHA do clone irmão) e commite os dois.');
    return false;
  }
  return true;
}

const passos = [
  ['integridade do vendor', vendorIntegro],
  ['tsc (app, src/)', 'npx tsc --noEmit'],
  ['tsc (overlay desktop)', 'npx tsc -p desktop/tsconfig.json --noEmit'],
  ['tsc (servidor: functions/ + workers/)', 'npx tsc -p tsconfig.server.json --noEmit'],
  ['vitest (suíte inteira)', 'npx vitest run'],
  ['guard do manual', 'npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts'],
  ...(comBuild ? [['build (vite + webp + functions → dist/)', 'npm run build']] : []),
];

const inicio = Date.now();
for (const [nome, passo] of passos) {
  console.log(`\n▶ ${nome}`);
  const ok = typeof passo === 'function'
    ? passo()
    : spawnSync(passo, { stdio: 'inherit', shell: true }).status === 0;
  if (!ok) {
    console.error(`\n✖ VERMELHO em: ${nome}. Não commite/mergeie até consertar.`);
    process.exit(1);
  }
  console.log(`✔ ${nome}`);
}
console.log(`\n✔ Portões verdes em ${Math.round((Date.now() - inicio) / 1000)} s — pode mergear.`);
