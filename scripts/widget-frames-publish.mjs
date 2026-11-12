#!/usr/bin/env node
// Publica molduras do widget V-Pet (Cage/Companheiro) PELA WEB, sem APK novo (beta12, A1).
// Plano: docs/design/PLANO-WIDGET-MOLDURAS-REMOTAS.md. Saida: public/widget-frames/{manifest.json, <id>.<sha8>.png}.
//
//   node scripts/widget-frames-publish.mjs seed                      # v1 = as 20 embutidas do APK (res/drawable-nodpi)
//   node scripts/widget-frames-publish.mjs add <id> <arte.png> --pt "Nome" --en "Name" [--acquire free|element:<id>] [--until YYYY-MM-DD] [--min-version-code N]
//   node scripts/widget-frames-publish.mjs remove <id>
//   node scripts/widget-frames-publish.mjs check                     # valida o manifesto e os arquivos
//
// Regras (as mesmas do cliente nativo, `WidgetFrameStore.Policy`): 576x384 exato, PNG, teto 256 KB, abertura do LCD
// (x 108..467, y 71..263) 100% transparente, id ^[a-z][a-z0-9_]{1,31}$. Cada mudanca sobe `version` (monotonica).
// Depois: `npm run build` (dist/ e commitado) e deploy normal do Worker. NUNCA mexer em `assets`/`run_worker_first` do wrangler.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'public', 'widget-frames');
const MANIFEST = join(OUT, 'manifest.json');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable-nodpi');

export const GEOMETRY = { w: 576, h: 384, screen: { l: 108, t: 71, r: 467, b: 263 } };
export const SEAM = 16;
// Brilhos pontuais do aro entram na abertura (as 20 embutidas tem ate ~0,1%); LCD tapado passa de 50%.
export const OPAQUE_TOLERANCE = 0.01;
export const MAX_BYTES = 256 * 1024;
export const ID_RE = /^[a-z][a-z0-9_]{1,31}$/;
export const BASE_ELEMENTS = [
  'fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz', 'vileza', 'morte',
  'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta',
];

// Rotulos dos 20 elementos (espelho de utils/elementLabels.ts; so cosmetico no manifesto, o seletor usa elementLabel).
const PT = {
  fogo: 'Fogo', agua: 'Água', terra: 'Terra', ar: 'Ar', eletricidade: 'Eletricidade', arcano: 'Arcano', sombra: 'Sombra', luz: 'Luz',
  vileza: 'Vileza', morte: 'Morte', vida: 'Vida', vigor: 'Vigor', marcial: 'Marcial', tempo: 'Tempo', som: 'Som', gravidade: 'Gravidade',
  espaco: 'Espaço', fada: 'Fada', industrial: 'Industrial', planta: 'Planta',
};
const EN = {
  fogo: 'Fire', agua: 'Water', terra: 'Earth', ar: 'Air', eletricidade: 'Lightning', arcano: 'Arcane', sombra: 'Shadow', luz: 'Light',
  vileza: 'Vileness', morte: 'Death', vida: 'Life', vigor: 'Vigor', marcial: 'Martial', tempo: 'Time', som: 'Sound', gravidade: 'Gravity',
  espaco: 'Space', fada: 'Fairy', industrial: 'Industrial', planta: 'Plant',
};

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Valida a arte: PNG 576x384, <= 256 KB, abertura do LCD toda transparente. Devolve a lista de problemas. */
export async function validateArt(buf) {
  const problems = [];
  if (buf.length > MAX_BYTES) problems.push(`peso ${buf.length} > ${MAX_BYTES}`);
  const img = sharp(buf);
  const meta = await img.metadata();
  if (meta.format !== 'png') problems.push(`formato ${meta.format} (so png)`);
  if (meta.width !== GEOMETRY.w || meta.height !== GEOMETRY.h) problems.push(`dimensao ${meta.width}x${meta.height} (esperado ${GEOMETRY.w}x${GEOMETRY.h})`);
  if (problems.length) return problems;
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // A abertura tem cantos arredondados e o LCD e desenhado 4 px alem dela (o aro do casco esconde a emenda): a borda de 16 px pode ter alfa (as 20 embutidas tem).
  const { l, t, r, b } = GEOMETRY.screen;
  let opaque = 0;
  for (let y = t + SEAM; y < b - SEAM; y++) for (let x = l + SEAM; x < r - SEAM; x++) if (data[(y * info.width + x) * 4 + 3] !== 0) opaque++;
  const area = (r - l - 2 * SEAM) * (b - t - 2 * SEAM);
  if (opaque > area * OPAQUE_TOLERANCE) problems.push(`abertura do LCD com ${opaque} de ${area} pixels nao transparentes (tolerancia ${OPAQUE_TOLERANCE * 100}%)`);
  return problems;
}

function readManifest() {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { schema: 1, version: 0, enabled: true, geometry: GEOMETRY, frames: [] };
}
function writeManifest(m) {
  m.version += 1;
  m.geometry = GEOMETRY;
  m.frames.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}

async function putFrame(m, id, buf, extra) {
  if (!ID_RE.test(id)) throw new Error(`id invalido: ${id}`);
  const problems = await validateArt(buf);
  if (problems.length) throw new Error(`${id}: ${problems.join('; ')}`);
  const hash = sha256(buf);
  const file = `${id}.${hash.slice(0, 8)}.png`;
  writeFileSync(join(OUT, file), buf);
  const old = m.frames.find((f) => f.id === id);
  if (old && old.url !== file && existsSync(join(OUT, old.url))) unlinkSync(join(OUT, old.url));
  m.frames = m.frames.filter((f) => f.id !== id);
  m.frames.push({ id, ...extra, url: file, sha256: hash, bytes: buf.length });
}

const arg = (args, name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };

export async function main(argv) {
  const [cmd, ...rest] = argv;
  mkdirSync(OUT, { recursive: true });
  if (cmd === 'seed') {
    const m = { schema: 1, version: 0, enabled: true, geometry: GEOMETRY, frames: [] };
    for (const id of BASE_ELEMENTS) {
      await putFrame(m, id, readFileSync(join(RES, `moldura_vpet_${id}.png`)), {
        name: { 'pt-BR': PT[id], en: EN[id] }, acquire: { type: 'element', element: id },
      });
    }
    writeManifest(m);
    console.log(`manifest v${m.version}: ${m.frames.length} molduras`);
  } else if (cmd === 'add') {
    const [id, art] = rest;
    if (!id || !art) throw new Error('uso: add <id> <arte.png> --pt "Nome" --en "Name" [--acquire free] [--until YYYY-MM-DD] [--min-version-code N]');
    const pt = arg(rest, '--pt'); const en = arg(rest, '--en');
    if (!pt || !en) throw new Error('--pt e --en sao obrigatorios');
    const acq = arg(rest, '--acquire') ?? 'free';
    const extra = { name: { 'pt-BR': pt, en }, acquire: acq === 'free' ? { type: 'free' } : { type: 'element', element: acq.replace(/^element:/, '') } };
    const until = arg(rest, '--until'); if (until) extra.until = until;
    const minV = arg(rest, '--min-version-code'); if (minV) extra.minVersionCode = Number(minV);
    const m = readManifest();
    await putFrame(m, id, readFileSync(resolve(art)), extra);
    writeManifest(m);
    console.log(`manifest v${m.version}: ${id} publicada`);
  } else if (cmd === 'remove') {
    const [id] = rest;
    const m = readManifest();
    const f = m.frames.find((x) => x.id === id);
    if (!f) throw new Error(`${id} nao esta no manifesto`);
    if (existsSync(join(OUT, f.url))) unlinkSync(join(OUT, f.url));
    m.frames = m.frames.filter((x) => x.id !== id);
    writeManifest(m);
    console.log(`manifest v${m.version}: ${id} retirada`);
  } else if (cmd === 'check') {
    const m = readManifest();
    const errors = [];
    for (const f of m.frames) {
      const p = join(OUT, f.url);
      if (!existsSync(p)) { errors.push(`${f.id}: arquivo ausente`); continue; }
      const buf = readFileSync(p);
      if (sha256(buf) !== f.sha256) errors.push(`${f.id}: sha256 nao bate`);
      if (buf.length !== f.bytes) errors.push(`${f.id}: bytes nao bate`);
      errors.push(...(await validateArt(buf)).map((e) => `${f.id}: ${e}`));
    }
    const stray = readdirSync(OUT).filter((n) => n !== 'manifest.json' && !m.frames.some((f) => f.url === n));
    for (const n of stray) errors.push(`arquivo fora do manifesto: ${n}`);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; } else console.log(`ok: v${m.version}, ${m.frames.length} molduras`);
  } else {
    throw new Error('comandos: seed | add | remove | check');
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
}
