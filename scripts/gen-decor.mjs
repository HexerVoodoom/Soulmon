#!/usr/bin/env node
// Gera as 14 peças de decoração do palco pela Higgsfield.
//
// A lista e a direção de arte vêm de docs/BRIEF-ARTE-DECORACAO.md; o contrato
// de tamanho/slot vem de src/utils/petStage.ts (docs/PALCO-E-DECORACAO.md).
// Este arquivo existe para que a geração seja UM comando — o brief não precisa
// ser relido e traduzido em prompt de novo a cada tentativa.
//
//   node scripts/gen-decor.mjs              → gera as 14
//   node scripts/gen-decor.mjs furn-sofa    → gera só uma
//   node scripts/gen-decor.mjs --dry-run    → imprime os prompts e sai
//   node scripts/gen-decor.mjs --check      → só testa credencial e rede
//
// ── Dois caminhos, nesta ordem ─────────────────────────────────────────────
// 1. API de plataforma (PREFERIDO): exige HF_API_KEY + HF_SECRET no ambiente.
//    É o MESMO contrato de functions/api/generate-sprite.js — se um mudar, o
//    outro tem que mudar junto (é regra copiada; ver footgun 9 do CLAUDE.md).
//    Não precisa de login de navegador, então roda headless.
// 2. CLI `@higgsfield/cli`: usado só quando as duas variáveis faltam. Exige
//    `npx --yes @higgsfield/cli auth login` (interativo, uma vez).
//
// ⚠️ Rede: `platform.higgsfield.ai` precisa estar liberado na política de
// egresso do ambiente. Sem isso, tudo aqui morre em 403 no CONNECT, e o erro
// NÃO é de credencial. `--check` diz qual dos dois é.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/assets/decor');
const HF_BASE = 'https://platform.higgsfield.ai';

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

// ── Caminho 1: API de plataforma ───────────────────────────────────────────
const hasPlatformCreds = Boolean(process.env.HF_API_KEY && process.env.HF_SECRET);
const authHeader = () => `Key ${process.env.HF_API_KEY}:${process.env.HF_SECRET}`;

/** Gera pela API e devolve a URL do resultado. Mesmo contrato de
 *  functions/api/generate-sprite.js — mudou lá, muda aqui. */
async function generateViaPlatform(prompt) {
  // 1536x1536 é o tamanho conhecido-bom do endpoint (o mesmo que a Function de
  // produção usa). O recorte para a caixa do slot é passo posterior, manual —
  // ver "Depois de gerar" no brief. Não invente string de dimensão aqui: valor
  // não suportado volta como erro de request e parece falha de credencial.
  const res = await fetch(`${HF_BASE}/v1/text2image/soul`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
    body: JSON.stringify({
      params: { prompt, width_and_height: '1536x1536', quality: '720p', batch_size: 1 },
    }),
  });
  if (!res.ok) throw new Error(`create ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const jobSet = await res.json();
  const jobSetId = jobSet.id || jobSet.job_set_id;
  if (!jobSetId) throw new Error('resposta sem job set id');

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const st = await fetch(`${HF_BASE}/v1/job-sets/${jobSetId}`, { headers: { Authorization: authHeader() } });
    if (!st.ok) continue;
    const jobs = (await st.json()).jobs || [];
    if (jobs.some(j => j.status === 'failed' || j.status === 'nsfw')) throw new Error('geração recusada (failed/nsfw)');
    const done = jobs.find(j => j.status === 'completed');
    if (done) {
      const url = done.results?.raw?.url || done.results?.min?.url;
      if (url) return url;
      throw new Error('completou sem url');
    }
  }
  throw new Error('timeout esperando o job');
}

/** A URL do resultado vive num CDN de storage cujo host é decidido em tempo de
 *  execução — ele também precisa estar liberado na política de egresso, e é o
 *  403 que costuma aparecer DEPOIS de a geração dar certo. */
async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} (host: ${new URL(url).host})`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

// ── Caminho 2: CLI ─────────────────────────────────────────────────────────
async function generateViaCli(prompt, out) {
  await exec('npx', ['--yes', '@higgsfield/cli', 'generate', 'create',
    '--prompt', prompt, '--wait', '--output', out], { maxBuffer: 32 * 1024 * 1024 });
}

async function generate(piece) {
  const prompt = buildPrompt(piece);
  const out = path.join(OUT_DIR, `${piece.id}.png`);
  if (hasPlatformCreds) {
    const url = await generateViaPlatform(prompt);
    await download(url, out);
  } else {
    await generateViaCli(prompt, out);
  }
  return out;
}

// ── CLI deste script ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const check = args.includes('--check');
const only = args.filter(a => !a.startsWith('--'));
const todo = only.length ? PIECES.filter(p => only.includes(p.id)) : PIECES;

if (check) {
  console.log(`credenciais de plataforma: ${hasPlatformCreds ? 'HF_API_KEY + HF_SECRET presentes' : 'AUSENTES (cairia no CLI)'}`);
  try {
    const res = await fetch(`${HF_BASE}/v1/job-sets/ping-connectivity-probe`, {
      headers: hasPlatformCreds ? { Authorization: authHeader() } : {},
    });
    const body = (await res.text()).slice(0, 300);
    // CUIDADO: "recebeu um HTTP de volta" NÃO prova que a rede passou. Num
    // ambiente com allowlist de egresso, o filtro responde ele mesmo um 403
    // com esta mensagem — que é indistinguível de um 403 de credencial se a
    // gente olhar só o status. Esta checagem já mentiu uma vez dizendo "rede
    // liberada" para um host bloqueado; por isso olha o CORPO.
    if (res.status === 403 && /not in allowlist/i.test(body)) {
      console.log(`rede até ${HF_BASE}: BLOQUEADA pela política de egresso do ambiente`);
      console.log(`→ ${body}`);
      console.log('→ NÃO é problema de credencial. Libere o host nas configurações de rede do ambiente.');
      process.exit(1);
    }
    console.log(`rede até ${HF_BASE}: OK (HTTP ${res.status} — resposta da API)`);
    if (res.status === 401 || res.status === 403) {
      console.log(`→ rede liberada, mas a credencial foi recusada: ${body}`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`rede até ${HF_BASE}: BLOQUEADA — ${err.message}`);
    console.log('→ política de egresso do ambiente. Libere o host; não é problema de credencial.');
    process.exit(1);
  }
  process.exit(0);
}

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
console.log(`Gerando ${todo.length} peça(s) via ${hasPlatformCreds ? 'API de plataforma' : 'CLI'}…\n`);
let ok = 0;
for (const piece of todo) {
  process.stdout.write(`${piece.id} … `);
  try {
    const out = await generate(piece);
    console.log(`ok → ${path.relative(ROOT, out)}`);
    ok++;
  } catch (err) {
    console.log('FALHOU');
    console.error(`  ${err.message.split('\n')[0]}`);
  }
}
console.log(`\n${ok}/${todo.length} geradas em ${path.relative(ROOT, OUT_DIR)}/`);
if (ok) console.log('Próximo passo: recortar para a caixa exata do slot e conferir sobre um cenário claro E um escuro (ver docs/BRIEF-ARTE-DECORACAO.md).');
