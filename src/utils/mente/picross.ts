/**
 * PICROSS DA MALHA — a lógica pura do nonograma (`docs/BENCHMARK-MINIJOGOS.md`
 * §6.5). Sem React, sem localStorage, sem relógio: tudo por parâmetro.
 *
 *  · pistas de linha/coluna (`cluesOf`);
 *  · conferência da solução POR PISTAS (`matchesClues`) — qualquer grade que
 *    bate as pistas conta, não só o desenho de referência;
 *  · resolvedor por lógica de linha (`solveByLines`) — é ele que o teste usa
 *    para exigir que TODO desenho da biblioteca tenha solução única e
 *    alcançável sem chute;
 *  · o puzzle do dia (`dailyPattern`), determinístico pela chave do dia:
 *    o mesmo desenho para todo mundo naquele dia.
 */
import { PICROSS_PATTERNS, type PicrossPattern } from './picrossPatterns';

/** Bits por resolver o puzzle do dia. */
export const PICROSS_DAILY_BITS = 10;
/** Bits por resolver qualquer outro desenho (rejogar). */
export const PICROSS_EXTRA_BITS = 3;

/** Estado de uma casa na grade do jogador: vazia, pintada ou marcada com X. */
export type CellMark = 0 | 1 | 2;
export const EMPTY: CellMark = 0;
export const FILLED: CellMark = 1;
export const CROSSED: CellMark = 2;

export interface Clues {
  rows: number[][];
  cols: number[][];
}

/** `'#'` = pintada, qualquer outro caractere = vazia. */
export function parsePattern(rows: readonly string[]): boolean[][] {
  return rows.map(r => Array.from(r, ch => ch === '#'));
}

/** Pista de uma linha: tamanhos dos blocos contínuos. Linha vazia → `[]`. */
export function lineClue(line: readonly boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v) run++;
    else if (run > 0) { out.push(run); run = 0; }
  }
  if (run > 0) out.push(run);
  return out;
}

export function cluesOf(grid: readonly (readonly boolean[])[]): Clues {
  const h = grid.length;
  const w = h > 0 ? grid[0].length : 0;
  const rows = grid.map(r => lineClue(r));
  const cols: number[][] = [];
  for (let c = 0; c < w; c++) cols.push(lineClue(grid.map(r => r[c])));
  return { rows, cols };
}

const sameClue = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** A grade do jogador resolve o puzzle? X conta como vazia. */
export function matchesClues(cells: readonly (readonly CellMark[])[], clues: Clues): boolean {
  if (cells.length !== clues.rows.length) return false;
  const filled = cells.map(r => r.map(v => v === FILLED));
  const mine = cluesOf(filled);
  if (mine.cols.length !== clues.cols.length) return false;
  return mine.rows.every((r, i) => sameClue(r, clues.rows[i]))
    && mine.cols.every((c, i) => sameClue(c, clues.cols[i]));
}

// ---------------------------------------------------------------------------
// Resolvedor por linha. Célula: 1 pintada, 0 vazia, -1 desconhecida.

type Known = 1 | 0 | -1;

/** Todas as disposições de `clue` em `n` casas compatíveis com `known`. */
function placements(clue: readonly number[], known: readonly Known[]): number[][] {
  const n = known.length;
  const out: number[][] = [];
  const cur = new Array<number>(n).fill(0);
  const fits = (from: number, to: number, v: number) => {
    for (let i = from; i < to; i++) if (known[i] !== -1 && known[i] !== v) return false;
    return true;
  };
  const rec = (k: number, pos: number) => {
    if (k === clue.length) {
      if (fits(pos, n, 0)) {
        const p = cur.slice();
        for (let i = pos; i < n; i++) p[i] = 0;
        out.push(p);
      }
      return;
    }
    const len = clue[k];
    let restMin = 0;
    for (let j = k + 1; j < clue.length; j++) restMin += clue[j] + 1;
    for (let s = pos; s + len + restMin <= n; s++) {
      if (!fits(pos, s, 0)) break; // o vão antes do bloco tem de ser vazio
      if (!fits(s, s + len, 1)) continue;
      if (s + len < n && known[s + len] === 1) continue;
      for (let i = pos; i < s; i++) cur[i] = 0;
      for (let i = s; i < s + len; i++) cur[i] = 1;
      if (s + len < n) cur[s + len] = 0;
      rec(k + 1, Math.min(n, s + len + 1));
    }
  };
  rec(0, 0);
  return out;
}

/** Aperta uma linha: devolve a linha refinada ou `null` se contradiz. */
function refineLine(clue: readonly number[], known: readonly Known[]): Known[] | null {
  const ps = placements(clue, known);
  if (ps.length === 0) return null;
  return known.map((v, i) => {
    if (v !== -1) return v;
    const first = ps[0][i];
    return ps.every(p => p[i] === first) ? (first as Known) : -1;
  });
}

/**
 * Resolve só por lógica de linha (sem chute). Devolve a grade com `-1` onde a
 * lógica de linha não decide, ou `null` se as pistas se contradizem.
 */
export function solveByLines(clues: Clues): Known[][] | null {
  const h = clues.rows.length;
  const w = clues.cols.length;
  const g: Known[][] = Array.from({ length: h }, () => new Array<Known>(w).fill(-1));
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < h; r++) {
      const nx = refineLine(clues.rows[r], g[r]);
      if (!nx) return null;
      for (let c = 0; c < w; c++) if (nx[c] !== g[r][c]) { g[r][c] = nx[c]; changed = true; }
    }
    for (let c = 0; c < w; c++) {
      const col = g.map(row => row[c]);
      const nx = refineLine(clues.cols[c], col);
      if (!nx) return null;
      for (let r = 0; r < h; r++) if (nx[r] !== g[r][c]) { g[r][c] = nx[r]; changed = true; }
    }
  }
  return g;
}

/** O desenho sai inteiro, e igual ao de referência, só por lógica de linha? */
export function isLineSolvable(pattern: PicrossPattern): boolean {
  const grid = parsePattern(pattern.rows);
  const solved = solveByLines(cluesOf(grid));
  if (!solved) return false;
  return solved.every((row, r) => row.every((v, c) => v === (grid[r][c] ? 1 : 0)));
}

/** FNV-1a 32 bits — hash estável da chave do dia. */
export function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** O puzzle do dia: o mesmo para todo mundo com a mesma chave de dia. */
export function dailyPattern(todayKey: string, pool: readonly PicrossPattern[] = PICROSS_PATTERNS): PicrossPattern {
  return pool[hashKey(`picross:${todayKey}`) % pool.length];
}

/** Bits de uma solução: o do dia paga mais, rejogar paga um pouco. */
export function picrossBits(isDaily: boolean): number {
  return isDaily ? PICROSS_DAILY_BITS : PICROSS_EXTRA_BITS;
}

/** Grade vazia do tamanho do desenho. */
export function emptyBoard(pattern: PicrossPattern): CellMark[][] {
  return pattern.rows.map(r => new Array<CellMark>(r.length).fill(EMPTY));
}
