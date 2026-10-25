/**
 * COLCHA (id `patches`, EN "Patchwork") — a regra pura do jogo de retângulos.
 * O jogador divide a grade inteira em retângulos; cada retângulo tem
 * exatamente UMA pista, e a pista é a ÁREA dele (às vezes com a forma:
 * quadrado, alto ou largo).
 *
 * O gerador particiona PRIMEIRO (cortes recursivos) e só depois põe as
 * pistas — todo puzzle tem solução. Tudo puro (rng por parâmetro).
 */
import { seededRng, type Rng } from './eco';

export { seededRng };
export type { Rng };

export const PATCHES_MAX_BITS = 10;
export const PATCHES_MIN_SIZE = 4;
export const PATCHES_MAX_SIZE = 8;

const PATCHES_BITS_BY_SIZE: Record<number, number> = { 4: 2, 5: 3, 6: 5, 7: 7, 8: 10 };

export type PatchShape = 'square' | 'tall' | 'wide' | 'any';

export interface Rect { r: number; c: number; h: number; w: number }
export interface PatchClue { cell: number; area: number; shape: PatchShape }
export interface PatchesPuzzle {
  size: number;
  clues: PatchClue[];
  /** Uma solução garantida. */
  solution: Rect[];
}

export function patchesSizeForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return Math.min(PATCHES_MAX_SIZE, PATCHES_MIN_SIZE + Math.floor((l - 1) / 2));
}

export function patchesBits(size: number): number {
  return PATCHES_BITS_BY_SIZE[size] ?? PATCHES_BITS_BY_SIZE[PATCHES_MIN_SIZE];
}

export function shapeOf(rect: Pick<Rect, 'h' | 'w'>): Exclude<PatchShape, 'any'> {
  return rect.h === rect.w ? 'square' : rect.h > rect.w ? 'tall' : 'wide';
}

/** Particiona a grade em retângulos com cortes guilhotina aleatórios. */
export function randomPartition(size: number, rng: Rng): Rect[] {
  const target = Math.max(4, Math.round((size * size) / (3 + rng() * 1.5)));
  const rects: Rect[] = [{ r: 0, c: 0, h: size, w: size }];
  let guard = 400;
  while (rects.length < target && guard-- > 0) {
    // Sorteia entre os que ainda se deixam cortar, preferindo os maiores.
    const cuttable = rects.map((x, i) => ({ x, i })).filter(({ x }) => x.h > 1 || x.w > 1);
    if (cuttable.length === 0) break;
    const total = cuttable.reduce((s, { x }) => s + x.h * x.w, 0);
    let pick = rng() * total;
    let chosen = cuttable[0];
    for (const cand of cuttable) { pick -= cand.x.h * cand.x.w; if (pick <= 0) { chosen = cand; break; } }
    const { x, i } = chosen;
    const vertical = x.w > 1 && (x.h === 1 || rng() < (x.w >= x.h ? 0.65 : 0.35));
    if (vertical) {
      const at = 1 + Math.floor(rng() * (x.w - 1));
      rects.splice(i, 1, { ...x, w: at }, { ...x, c: x.c + at, w: x.w - at });
    } else {
      const at = 1 + Math.floor(rng() * (x.h - 1));
      rects.splice(i, 1, { ...x, h: at }, { ...x, r: x.r + at, h: x.h - at });
    }
  }
  return rects;
}

/** Um puzzle do tamanho pedido, com solução garantida (a partição nasce antes das pistas). */
export function generatePatches(size: number, rng: Rng): PatchesPuzzle {
  const n = Math.min(PATCHES_MAX_SIZE, Math.max(PATCHES_MIN_SIZE, Math.floor(size)));
  const solution = randomPartition(n, rng);
  const clues: PatchClue[] = solution.map(rc => {
    const cell = (rc.r + Math.floor(rng() * rc.h)) * n + rc.c + Math.floor(rng() * rc.w);
    // A forma só vem de vez em quando; área 1 é óbvia e fica sem dica.
    const showShape = rc.h * rc.w > 1 && rng() < 0.45;
    return { cell, area: rc.h * rc.w, shape: showShape ? shapeOf(rc) : 'any' };
  });
  clues.sort((a, b) => a.cell - b.cell);
  return { size: n, clues, solution };
}

export function patchesForLevel(level: number, rng: Rng): PatchesPuzzle {
  return generatePatches(patchesSizeForLevel(level), rng);
}

export function rectCells(rc: Rect, size: number): number[] {
  const out: number[] = [];
  for (let r = rc.r; r < rc.r + rc.h; r++) for (let c = rc.c; c < rc.c + rc.w; c++) out.push(r * size + c);
  return out;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.r < b.r + b.h && b.r < a.r + a.h && a.c < b.c + b.w && b.c < a.c + a.w;
}

/** O retângulo cobre a casa? */
export function rectHas(rc: Rect, cell: number, size: number): boolean {
  const r = Math.floor(cell / size);
  const c = cell % size;
  return r >= rc.r && r < rc.r + rc.h && c >= rc.c && c < rc.c + rc.w;
}

/** O retângulo entre duas casas (arrastar de A até B). */
export function rectBetween(a: number, b: number, size: number): Rect {
  const r1 = Math.floor(a / size), c1 = a % size, r2 = Math.floor(b / size), c2 = b % size;
  const r = Math.min(r1, r2), c = Math.min(c1, c2);
  return { r, c, h: Math.abs(r1 - r2) + 1, w: Math.abs(c1 - c2) + 1 };
}

/** Põe `rc` no tabuleiro: o que ele atropela sai (substitui). */
export function placeRect(rects: readonly Rect[], rc: Rect): Rect[] {
  return [...rects.filter(x => !rectsOverlap(x, rc)), rc];
}

/** Valida a solução do jogador: cobre tudo, sem sobrepor, cada retângulo com UMA pista cuja área (e forma, se dada) bate. */
export function validatePatches(puzzle: Pick<PatchesPuzzle, 'size' | 'clues'>, rects: readonly Rect[]): boolean {
  const { size, clues } = puzzle;
  const owner = new Array<number>(size * size).fill(-1);
  for (let i = 0; i < rects.length; i++) {
    const rc = rects[i];
    if (rc.h < 1 || rc.w < 1 || rc.r < 0 || rc.c < 0 || rc.r + rc.h > size || rc.c + rc.w > size) return false;
    for (const cell of rectCells(rc, size)) {
      if (owner[cell] !== -1) return false;
      owner[cell] = i;
    }
  }
  if (owner.some(o => o === -1)) return false;
  const perRect = new Array<number>(rects.length).fill(0);
  for (const cl of clues) {
    const i = owner[cl.cell];
    if (i < 0) return false;
    perRect[i]++;
    const rc = rects[i];
    if (rc.h * rc.w !== cl.area) return false;
    if (cl.shape !== 'any' && shapeOf(rc) !== cl.shape) return false;
  }
  return perRect.every(n => n === 1);
}
