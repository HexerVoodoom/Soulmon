// Alvos do PACOTE A (16/11/2026): o que falta por combinação de elementos no estágio dela. Só lê; nada gera.
import { build } from 'esbuild';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, 'src/assets/soulmon/novos-arquivo');

export async function carregar(saida) {
  await build({
    stdin: {
      contents: `export { generateOracleWithFamilies } from './src/utils/oracle/motor';
export * as familias from './src/utils/oracle/familias';
export { stagesComElemento, escolherChroma, semChromaSeguro } from './src/utils/elementoCombinado';
export { essenceComposition } from './src/utils/elementDex';
export { ELEMENTOS_CURADOS } from './src/utils/elementosCurados';
export { DERIVED_ELEMENT_PAIRS } from './src/utils/soulProfile/derivedElements';
export { ENEMY_ROSTER } from './src/utils/enemyRoster';
export { nomeDaForma } from './src/utils/enemyRoster';`,
      resolveDir: ROOT, loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', outfile: saida, logLevel: 'error',
    alias: { 'class-system': join(ROOT, 'vendor', 'class-system', 'index.js') },
    loader: { '.png': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl', '.mp3': 'dataurl', '.css': 'empty' },
    define: { 'import.meta.env': '{}' },
  });
  return import(pathToFileURL(saida).href);
}

/** [{elementId, k, comps, stages:[...faltam], rookie:{num,slug,name,arquivo}}] */
export async function alvos(m) {
  const R = m.ENEMY_ROSTER;
  const temForma = (el, st) => R.some(e => e.element === el && e.stage === st && e.kind !== 'base' && e.kind !== 'mascote');
  const out = [];
  const ids = [...m.DERIVED_ELEMENT_PAIRS.map(p => p.id), ...m.ELEMENTOS_CURADOS.map(c => c.id)];
  for (const id of ids) {
    const comps = m.essenceComposition(id) ?? [];
    const k = comps.length;
    const alvo = { 2: 'champion', 3: 'ultimate', 4: 'mega' }[k];
    if (!alvo) continue;
    const rookie = R.find(e => e.element === id && e.stage === 'rookie' && e.kind === 'combinado');
    const cadeia = ['champion', 'ultimate', 'mega'].slice(0, ['champion', 'ultimate', 'mega'].indexOf(alvo) + 1);
    const faltam = cadeia.filter(st => !temForma(id, st));
    if (!faltam.length) continue;
    out.push({ elementId: id, k, comps, alvo, faltam, rookie: rookie ? { artFile: rookie.artFile, name: rookie.name, id: rookie.id, e1: rookie.elements[0] } : null });
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const m = await carregar(join(ROOT, 'node_modules/.cache/combinados/b.mjs'));
  const a = await alvos(m);
  const por = {}; for (const x of a) por[x.k] = (por[x.k] ?? 0) + x.faltam.length;
  console.log(a.length, 'combinações', por, 'sem rookie:', a.filter(x => !x.rookie).map(x => x.elementId));
  console.log(a.filter(x => x.k > 2).map(x => `${x.elementId}:${x.faltam}`).join(' '));
}
