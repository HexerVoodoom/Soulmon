#!/usr/bin/env node
// Gera as 14 peças de decoração do palco pelo CLI da Higgsfield.
//
// A lista e a direção de arte vêm de docs/BRIEF-ARTE-DECORACAO.md; o contrato
// de tamanho/slot vem de src/utils/petStage.ts (docs/PALCO-E-DECORACAO.md).
// Este arquivo existe para que a geração seja UM comando — o brief não precisa
// ser relido e traduzido em prompt de novo a cada tentativa.
//
//   node scripts/gen-decor.mjs              → gera as 14
//   node scripts/gen-decor.mjs furn-sofa    → gera só uma
//   node scripts/gen-decor.mjs --dry-run    → imprime os prompts e sai
//
// Pré-requisito: `npx --yes @higgsfield/cli auth login` (interativo, uma vez).
//
// ⚠️ NÃO roda dentro do sandbox de agente: a política de rede do ambiente
// responde 403 no CONNECT para higgsfield.ai. Rode na máquina do dono.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/assets/decor');

/** Peças. `box` é a caixa EXATA do slot — a arte é desenhada PARA ela, nada é
 *  redimensionado depois (ver DECOR_SLOTS em src/utils/petStage.ts). */
const PIECES = [
  { id: 'furn-sofa', box: [56, 56], art: 'a two-seat pixel sofa seen from the front, visible cushions, warm-toned fabric' },
  { id: 'furn-chair', box: [56, 56], art: 'a wingback armchair, narrower than a sofa, tall backrest' },
  { id: 'furn-books', box: [56, 56], art: 'a three-shelf wooden bookcase with colorful book spines' },
  { id: 'furn-lamp', box: [48, 52], art: 'a floor lamp with a shade glowing soft yellow, slim base' },
  { id: 'furn-rug', box: [104, 16], art: 'an oval rug with a paw-print pattern and fringed ends', flat: true },
  { id: 'furn-plant', box: [48, 52], art: 'a terracotta pot with broad foliage in two shades of green' },
  { id: 'furn-picture', box: [56, 40], art: 'a rectangular picture frame containing a generic creature portrait, species unidentifiable' },
  { id: 'furn-campfire', box: [56, 56], art: 'a campfire of crossed sticks with orange and yellow flames, ringed by stones' },
  { id: 'furn-tent', box: [56, 56], art: 'a triangular camping tent with a dark opening and guy stakes' },
  { id: 'furn-rock', box: [48, 52], art: 'a rounded boulder with moss on top, two shades of gray' },
  { id: 'furniture-champion-banner', box: [56, 40], art: 'a hanging pennant banner, gold with dark trim, V-shaped tip' },
  { id: 'furniture-medal-wall', box: [56, 40], art: 'a wooden plaque with three medals hanging from ribbons' },
  // Estes dois saem VAZIOS de propósito: o jogo desenha por cima os troféus de
  // season realmente ganhos. Arte com troféu embutido criaria troféu falso.
  { id: 'furniture-trophy-shelf', box: [46, 50], art: 'an EMPTY two-tier display shelf, no trophies, no objects on the shelves' },
  { id: 'furniture-podium', box: [46, 50], art: 'an EMPTY three-step winners podium (2nd-1st-3rd), no trophies, nobody standing on it' },
];

function buildPrompt({ art, box, flat }) {
  const [w, h] = box;
  return [
    `16-bit pixel art sprite of ${art}, drawn as a single object on a fully`,
    'transparent background, no shadow, no ground line, no scenery.',
    'Front view, very slightly from above. Limited palette of 4-6 colors plus a',
    'dark 1px outline around the silhouette. Crisp hard-edged pixels, no',
    'anti-aliasing, no gradients, no blur. Even neutral lighting from above.',
    `The object must be fully readable at ${w}x${h} pixels.`,
    'Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games.',
    // Nenhum nome de franquia no prompt — mesma regra do utils/oracle.ts.
    flat
      ? 'Extreme foreshortening: the object is lying flat on the ground, seen at a shallow angle, occupying a very wide and short area.'
      : '',
  ].filter(Boolean).join(' ');
}

async function generate(piece) {
  const prompt = buildPrompt(piece);
  const out = path.join(OUT_DIR, `${piece.id}.png`);
  const { stdout } = await exec('npx', [
    '--yes', '@higgsfield/cli', 'generate', 'create',
    '--prompt', prompt,
    '--wait',
    '--output', out,
  ], { maxBuffer: 32 * 1024 * 1024 });
  return { out, stdout: stdout.trim() };
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const only = args.filter(a => !a.startsWith('--'));
const todo = only.length ? PIECES.filter(p => only.includes(p.id)) : PIECES;

if (!todo.length) {
  console.error(`Nenhuma peça casou com: ${only.join(', ')}`);
  console.error(`Ids válidos: ${PIECES.map(p => p.id).join(', ')}`);
  process.exit(1);
}

if (dryRun) {
  for (const p of todo) console.log(`\n── ${p.id} (${p.box.join('×')}) ──\n${buildPrompt(p)}`);
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });
let ok = 0;
for (const piece of todo) {
  process.stdout.write(`${piece.id} … `);
  try {
    const { out } = await generate(piece);
    console.log(`ok → ${path.relative(ROOT, out)}`);
    ok++;
  } catch (err) {
    console.log('FALHOU');
    console.error(`  ${err.message.split('\n')[0]}`);
  }
}
console.log(`\n${ok}/${todo.length} geradas em ${path.relative(ROOT, OUT_DIR)}/`);
console.log('Próximo passo: recortar para a caixa exata do slot e conferir sobre um cenário claro E um escuro (ver docs/BRIEF-ARTE-DECORACAO.md).');
