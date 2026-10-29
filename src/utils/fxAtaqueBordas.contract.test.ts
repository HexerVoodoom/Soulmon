// Régua dos PNGs de `assets/soulmon/fx-ataque/` (29/10/2026, relato do dono: o orb de FOGO sai com a cabeça "serrada").
// Duas leituras do mesmo defeito, e a segunda é a que pegou o orb de fogo:
//  (1) BORDA: nenhum pixel opaco (alpha > 20) encosta numa das 4 bordas — corte reto contra a moldura da célula.
//  (2) CORTE INTERNO: a arte foi serrada por uma reta ANTES da margem transparente (a margem está lá, mas a peça já vinha
//      cortada). Detecção: a linha/coluna extrema da arte (alpha > 200) tem um trecho reto contíguo >= `MIN_RUN` px e a
//      mesma coluna 3px para dentro tem trecho ~igual (arte redonda encolhe rápido; corte reto não).
// O que (2) acha NÃO se conserta com código nem com padding: precisa REGERAR a peça. Estão em `PENDENTE_DE_REGERAR`
// (docs/reviews/2026-10-29-fx-cortados.md traz o prompt de cada uma). Peça NOVA no diretório não entra aqui: tem que passar.
// `defended` fica de fora de (2): o escudo hexagonal tem lado reto POR DESENHO.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '../assets/soulmon/fx-ataque');
const MIN_RUN = 24;

const longestRun = (v: boolean[]): number => {
  let best = 0;
  let cur = 0;
  for (const x of v) { cur = x ? cur + 1 : 0; if (cur > best) best = cur; }
  return best;
};

async function analyse(file: string) {
  const { data, info } = await sharp(join(DIR, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const al = (x: number, y: number) => data[(y * w + x) * 4 + 3];
  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (al(x, y) > 200) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const row = (y: number) => Array.from({ length: w }, (_, x) => al(x, y) > 200);
  const col = (x: number) => Array.from({ length: h }, (_, y) => al(x, y) > 200);
  const edge: string[] = [];
  for (let x = 0; x < w; x++) { if (al(x, 0) > 20 && !edge.includes('T')) edge.push('T'); if (al(x, h - 1) > 20 && !edge.includes('B')) edge.push('B'); }
  for (let y = 0; y < h; y++) { if (al(0, y) > 20 && !edge.includes('L')) edge.push('L'); if (al(w - 1, y) > 20 && !edge.includes('R')) edge.push('R'); }
  const flat: string[] = [];
  if (maxX >= 0) {
    const sides: Record<string, (k: number) => boolean[]> = { T: (k) => row(minY + k), B: (k) => row(maxY - k), L: (k) => col(minX + k), R: (k) => col(maxX - k) };
    for (const [n, g] of Object.entries(sides)) {
      const r0 = longestRun(g(0));
      const r3 = longestRun(g(3));
      if (r0 >= MIN_RUN && r3 >= 0.9 * r0 && r3 <= 1.15 * r0 + 2) flat.push(n);
    }
  }
  return { edge, flat };
}

/** Peças cortadas aguardando regeração. Vazia desde 29/10/2026: `tools/regerar-fx-cortados.py` refez as 74 a partir das folhas originais (o corte era do fatiador de grade 3x2). */
const PENDENTE_DE_REGERAR = new Set<string>([
]);

/** Conferidas a olho: o detector acusa, a arte está inteira (cabeça redonda que só encosta na coluna 122). */
const FALSO_POSITIVO = new Set<string>(['fx-entropia-orb.png']);

describe('fx-ataque: nenhuma peça cortada', () => {
  it('borda limpa e sem corte reto interno (fora da lista de regeração)', async () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith('.png'));
    expect(files.length).toBeGreaterThan(1000);
    const bad: string[] = [];
    const stillPending: string[] = [];
    for (const f of files) {
      const { edge, flat } = await analyse(f);
      const cut = edge.length > 0 || (!FALSO_POSITIVO.has(f) && flat.length > 0 && !/-defended\.png$/.test(f));
      if (cut) { if (PENDENTE_DE_REGERAR.has(f)) stillPending.push(f); else bad.push(`${f} edge=${edge.join('')} flat=${flat.join('')}`); }
    }
    expect(bad).toEqual([]);
    // a lista não pode guardar peça que já foi consertada
    expect([...PENDENTE_DE_REGERAR].filter((f) => !stillPending.includes(f))).toEqual([]);
  }, 120_000);
});
