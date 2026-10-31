// PARA ONDE A ARTE DE CADA FX OLHA — medido do PNG, nunca à mão (REGISTRO §151).
//   node scripts/fx-facing.mjs          → regrava src/utils/fxFacingTable.ts
// A lib (`measureFacing`) também é importada por `src/utils/fxFacing.contract.test.ts`, que reprova tabela velha.
//
// Convenção ÚNICA: "olha para" = a direção para onde o efeito aponta/viaja.
//  · orb      → a CABEÇA do projétil (lado mais denso e brilhante; o rastro fica atrás);
//  · slash    → o BOJO do crescente (o lado convexo, que lidera o golpe);
//  · defended → para onde o golpe recebido ANDA (as setas entram pelo lado de onde ele vem, então olha ao contrário delas).
// cast/aura/impact são simétricos por contrato (a medição precisa dar ≤ SIM_MAX_PX).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');
export const DIRS = [
  path.join(ROOT, 'src/assets/soulmon/fx-ataque'),
  path.join(ROOT, 'src/assets/soulmon/pesadelo'),
];
export const SYM_MAX_PX = 12; // cast/aura/impact são explosão/anel radiais (estilhaço irregular até ~11px, nenhum aponta): deslocamento do centroide até o centro da caixa
const ORB_MIN_PX = 6; // um projétil sempre tem direção
const SLASH_MIN_PX = 2; // abaixo disto o crescente é reto (lê-se simétrico)
const DEF_MIN_PX = 2.5;

async function load(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { d: data, w: info.width, h: info.height };
}

/** Deslocamento horizontal do centroide (peso = alfa × brilho) em relação ao centro da caixa opaca. + = massa à direita. */
function centroidOffset({ d, w, h }) {
  let minX = w, maxX = -1, sw = 0, sx = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; const a = d[i + 3] / 255;
    if (a <= 0.1) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    const wt = a * (Math.max(d[i], d[i + 1], d[i + 2]) / 255 + 0.2);
    sw += wt; sx += wt * x;
  }
  return sx / sw - (minX + maxX) / 2;
}

/** Para que lado (dx) fica o BOJO do crescente: o meio do traço vs as pontas, no eixo perpendicular ao eixo principal. */
function slashBulgeDx({ d, w, h }) {
  const P = []; let sw = 0, cx = 0, cy = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = d[(y * w + x) * 4 + 3] / 255;
    if (a <= 0.25) continue;
    P.push([x, y, a]); sw += a; cx += a * x; cy += a * y;
  }
  cx /= sw; cy /= sw;
  let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y, a] of P) { sxx += a * (x - cx) ** 2; sxy += a * (x - cx) * (y - cy); syy += a * (y - cy) ** 2; }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ax = [Math.cos(ang), Math.sin(ang)]; const pp = [-ax[1], ax[0]];
  const T = P.map(([x, y]) => (x - cx) * ax[0] + (y - cy) * ax[1]);
  const Sv = P.map(([x, y]) => (x - cx) * pp[0] + (y - cy) * pp[1]);
  const sorted = [...T].sort((a, b) => a - b);
  const ext = Math.max(Math.abs(sorted[Math.floor(sorted.length * 0.02)]), Math.abs(sorted[Math.floor(sorted.length * 0.98)]));
  let mS = 0, mW = 0, eS = 0, eW = 0;
  P.forEach(([, , a], i) => {
    const t = Math.abs(T[i]);
    if (t < 0.25 * ext) { mS += a * Sv[i]; mW += a; } else if (t > 0.7 * ext) { eS += a * Sv[i]; eW += a; }
  });
  return (mS / mW - eS / eW) * pp[0];
}

const dir = (v, min) => (Math.abs(v) < min ? 'S' : v > 0 ? 'R' : 'L');

/** 'R' | 'L' | 'S' (simétrico) + o número medido, para o estado. */
export async function measureFacing(file, estado) {
  const img = await load(file);
  if (estado === 'orb') { const v = centroidOffset(img); return { dir: dir(v, ORB_MIN_PX), v }; }
  if (estado === 'slash') { const v = slashBulgeDx(img); return { dir: dir(v, SLASH_MIN_PX), v }; }
  if (estado === 'defended') { const v = centroidOffset(img); return { dir: dir(v, DEF_MIN_PX), v }; } // setas na direita → o golpe anda p/ esquerda
  const v = centroidOffset(img); return { dir: Math.abs(v) <= SYM_MAX_PX ? 'S' : dir(v, 0), v };
}

/** Projétil cujo centroide é quase central (rastro aberto dos dois lados) mas a cabeça é VISÍVEL a olho: decisão por inspeção. */
export const ORB_OVERRIDE = { onda_de_choque: 'R', arauto: 'R' };

export function listFxFiles() {
  const out = {};
  for (const dirp of DIRS) {
    for (const f of fs.readdirSync(dirp)) {
      const m = /^fx-([a-z_]+)-(cast|aura|slash|impact|defended|orb)\.png$/.exec(f);
      if (!m || /-aura-96\.png$/.test(f)) continue;
      (out[m[1]] ??= {})[m[2]] = path.join(dirp, f);
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = listFxFiles();
  const rows = [];
  for (const id of Object.keys(files).sort()) {
    const r = {};
    for (const e of ['orb', 'slash', 'defended']) r[e] = (await measureFacing(files[id][e], e)).dir;
    if (r.orb === 'S') r.orb = ORB_OVERRIDE[id] ?? (() => { throw new Error(`orb sem direção: ${id}`); })();
    rows.push(`  ${/^[a-z]+$/.test(id) ? id : `'${id}'`}: '${r.orb}${r.slash}${r.defended}',`);
  }
  const body = `// GERADO por \`node scripts/fx-facing.mjs\` — NÃO edite à mão (o teste \`fxFacing.contract.test.ts\` remede os PNG).
// Três letras por elemento: orb · slash · defended. R = a arte olha para a DIREITA, L = esquerda, S = simétrica.
// Convenção (olha para = para onde o efeito aponta/viaja): ver o cabeçalho de \`scripts/fx-facing.mjs\` e \`utils/fxFacing.ts\`.
export const FX_FACING_TABLE: Readonly<Record<string, string>> = {
${rows.join('\n')}
};
`;
  fs.writeFileSync(path.join(ROOT, 'src/utils/fxFacingTable.ts'), body);
  const cnt = {}; for (const r of rows) { const k = r.split("'")[1] ?? r; cnt[k] = (cnt[k] ?? 0) + 1; }
  console.log(`${rows.length} elementos → src/utils/fxFacingTable.ts`);
}
