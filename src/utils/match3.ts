/**
 * COMBINA 3 — a lógica PURA do jogo de combinar peças do Salão de Jogos (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * Tabuleiro `M3_ROWS × M3_COLS` de peças de `M3_KINDS` tipos (os ícones de ELEMENTO que já existem no repo — ver `M3_TILE_ELEMENTS`).
 * O jogador troca duas peças vizinhas, LIVREMENTE (beta-2, backlog 9.2: a exigência de "a troca tem que pontuar" saiu — toda troca entre vizinhas
 * vale e gasta 1 movimento, pontue ou não; é o que garante o fim da partida). Se formar linha de 3+, as linhas somem,
 * as peças de cima caem, o topo é preenchido e, se isso formar linhas novas, a CASCATA continua sozinha (cada passo da cascata vale
 * mais). Uma linha de 4+ deixa para trás uma peça ESPECIAL (listrada): quando ela entra numa combinação, limpa a linha (ou a coluna)
 * inteira — e pode acionar outra listrada, em cadeia. Sem movimentos possíveis, o tabuleiro se embaralha sozinho (sem custo).
 *
 * Tudo aqui é determinístico: o sorteio vem de `rng` por PARÂMETRO (`mulberry32(seed)` — nunca `Math.random`; um teste de grep
 * trava), então a mesma semente e a mesma sequência de trocas dão o mesmo tabuleiro, passo a passo.
 *
 * Economia: quem paga é só a função `match3Bits` — e só pelo funil único do `App` (`onEarnPoints` → `handleEarnGamePoints`, teto diário
 * de minijogo). A régua de Bits/minuto está em `utils/mente/balanco.test.ts` (o jogo entra na mesma faixa dos outros).
 */
import { mulberry32 } from './combate/rng';

export const M3_COLS = 7;
export const M3_ROWS = 7;
/** Tipos de peça. */
export const M3_KINDS = 6;
/** Movimentos por rodada (a rodada acaba quando eles acabam). */
export const M3_MOVES = 20;
/** Os ícones de elemento (`utils/elementIconArt`) que fazem de peça, na ordem dos tipos. Arte que já existe no repo; nada novo. */
export const M3_TILE_ELEMENTS = ['fogo', 'agua', 'terra', 'vida', 'ar', 'luz'] as const;
/** Nome de cada tipo, PT/EN (leitor de tela e legenda). */
export const M3_TILE_NAMES: ReadonlyArray<{ pt: string; en: string }> = [
  { pt: 'Fogo', en: 'Fire' }, { pt: 'Água', en: 'Water' }, { pt: 'Terra', en: 'Earth' },
  { pt: 'Vida', en: 'Life' }, { pt: 'Ar', en: 'Air' }, { pt: 'Luz', en: 'Light' },
];

/** Peça especial: limpa a linha (`row`) ou a coluna (`col`) em que está quando entra numa combinação. */
export type Special = 'row' | 'col';
export interface Tile { k: number; sp?: Special }
export type Board = (Tile | null)[][];
export interface Pos { r: number; c: number }
export type Rng = () => number;

const key = (p: Pos): number => p.r * M3_COLS + p.c;
const inside = (r: number, c: number): boolean => r >= 0 && r < M3_ROWS && c >= 0 && c < M3_COLS;

export function cloneBoard(b: Board): Board {
  return b.map(row => row.map(t => (t ? { ...t } : null)));
}

const pickKind = (rng: Rng, avoid: readonly number[] = []): number => {
  const ok: number[] = [];
  for (let k = 0; k < M3_KINDS; k++) if (!avoid.includes(k)) ok.push(k);
  return ok[Math.min(ok.length - 1, Math.floor(rng() * ok.length))];
};

// ── linhas ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface Run { cells: Pos[]; dir: 'h' | 'v'; k: number }

/** Todas as linhas MÁXIMAS de 3+ peças do mesmo tipo (horizontais e verticais). */
export function findRuns(b: Board): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < M3_ROWS; r++) {
    let c = 0;
    while (c < M3_COLS) {
      const t = b[r][c];
      if (!t) { c++; continue; }
      let e = c + 1;
      while (e < M3_COLS && b[r][e]?.k === t.k) e++;
      if (e - c >= 3) runs.push({ dir: 'h', k: t.k, cells: Array.from({ length: e - c }, (_, i) => ({ r, c: c + i })) });
      c = e;
    }
  }
  for (let c = 0; c < M3_COLS; c++) {
    let r = 0;
    while (r < M3_ROWS) {
      const t = b[r][c];
      if (!t) { r++; continue; }
      let e = r + 1;
      while (e < M3_ROWS && b[e][c]?.k === t.k) e++;
      if (e - r >= 3) runs.push({ dir: 'v', k: t.k, cells: Array.from({ length: e - r }, (_, i) => ({ r: r + i, c })) });
      r = e;
    }
  }
  return runs;
}

// ── o tabuleiro ──────────────────────────────────────────────────────────────────────────────────────────────────────

const swapCells = (b: Board, a: Pos, d: Pos): void => {
  const t = b[a.r][a.c];
  b[a.r][a.c] = b[d.r][d.c];
  b[d.r][d.c] = t;
};

/** Os movimentos que formam linha — ou trocam duas especiais entre si (pares vizinhos, sempre `a` à esquerda/em cima de `b`). */
export function validMoves(b: Board): Array<{ a: Pos; b: Pos }> {
  const out: Array<{ a: Pos; b: Pos }> = [];
  const w = cloneBoard(b);
  for (let r = 0; r < M3_ROWS; r++) {
    for (let c = 0; c < M3_COLS; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]] as const) {
        if (!inside(r + dr, c + dc)) continue;
        const a = { r, c };
        const d = { r: r + dr, c: c + dc };
        swapCells(w, a, d);
        // duas setinhas trocadas entre si disparam juntas (combo de 2 especiais), mesmo sem linha formada: é movimento válido
        // (senão `hasMoves` dizia "sem jogada" e o tabuleiro embaralhava com um combo disponível; a dica e a IA também o ignoravam)
        if (findRuns(w).length > 0 || (w[a.r][a.c]?.sp && w[d.r][d.c]?.sp)) out.push({ a, b: d });
        swapCells(w, a, d);
      }
    }
  }
  return out;
}

export const hasMoves = (b: Board): boolean => validMoves(b).length > 0;

/** Um tabuleiro sem NENHUMA linha pronta e com pelo menos um movimento. Determinístico pelo `rng`. */
export function newBoard(rng: Rng): Board {
  for (let tent = 0; tent < 200; tent++) {
    const b: Board = Array.from({ length: M3_ROWS }, () => Array.from({ length: M3_COLS }, () => null as Tile | null));
    for (let r = 0; r < M3_ROWS; r++) {
      for (let c = 0; c < M3_COLS; c++) {
        const avoid: number[] = [];
        if (c >= 2 && b[r][c - 1]!.k === b[r][c - 2]!.k) avoid.push(b[r][c - 1]!.k);
        if (r >= 2 && b[r - 1][c]!.k === b[r - 2][c]!.k) avoid.push(b[r - 1][c]!.k);
        b[r][c] = { k: pickKind(rng, avoid) };
      }
    }
    if (hasMoves(b)) return b;
  }
  // inalcançável na prática (200 sorteios); devolve um tabuleiro listrado que tem movimento
  return Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (r + c * 2 + (r > 3 ? 1 : 0)) % M3_KINDS }))) as Board;
}

/** Embaralha as peças COMUNS de lugar até não haver linha pronta e haver movimento (as especiais ficam onde estão). */
export function shuffleBoard(b: Board, rng: Rng): Board {
  const cells: Pos[] = [];
  for (let r = 0; r < M3_ROWS; r++) for (let c = 0; c < M3_COLS; c++) if (b[r][c] && !b[r][c]!.sp) cells.push({ r, c });
  for (let tent = 0; tent < 300; tent++) {
    const w = cloneBoard(b);
    const pool = cells.map(p => w[p.r][p.c]!);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    cells.forEach((p, i) => { w[p.r][p.c] = pool[i]; });
    if (findRuns(w).length === 0 && hasMoves(w)) return w;
  }
  return newBoard(rng);
}

// ── a resolução: limpar, cair, preencher, cascata ────────────────────────────────────────────────────────────────────

/** Um passo da cascata (o que a tela anima, na ordem). */
export interface Step {
  /** Peças que somem neste passo (já com as linhas das especiais). */
  cleared: Pos[];
  /** D-03: o TIPO (`k`) de cada peça de `cleared`, na mesma ordem — é daqui que o combate tira o elemento do dano. */
  kinds: number[];
  /** Especiais que DISPARARAM neste passo. */
  triggered: Pos[];
  /** Especiais que NASCERAM neste passo (linha de 4+). */
  created: Array<{ pos: Pos; tile: Tile }>;
  /** 1 = a jogada; 2+ = cascata. */
  chain: number;
  gained: number;
  /** O tabuleiro depois que as peças caíram e o topo foi preenchido. */
  after: Board;
}

export const POINTS_PER_TILE = 10;
const POINTS_PER_CREATED = 20;
const POINTS_PER_TRIGGER = 30;
/** A cascata vale mais a cada passo: ×1, ×1,5, ×2, … */
export const chainMultiplier = (chain: number): number => 1 + 0.5 * (Math.max(1, chain) - 1);
const MAX_CHAIN = 60;

/** Resolve o tabuleiro até assentar. `anchors` = as casas da troca (a especial nasce onde o jogador mexeu). */
export function resolveBoard(start: Board, rng: Rng, anchors: readonly Pos[] = [], combo: readonly Pos[] = []): { steps: Step[]; board: Board; score: number } {
  const w = cloneBoard(start);
  const steps: Step[] = [];
  let score = 0;
  for (let chain = 1; chain <= MAX_CHAIN; chain++) {
    const runs = findRuns(w);
    const comboNow = chain === 1 ? combo : [];
    if (runs.length === 0 && comboNow.length === 0) break;
    const clearSet = new Map<number, Pos>();
    // D-E2: duas setinhas trocadas entre si disparam juntas (linha E coluna), com ou sem linha formada
    const comboKeys = new Set(comboNow.map(key));
    for (const p of comboNow) clearSet.set(key(p), p);
    const created: Array<{ pos: Pos; tile: Tile }> = [];
    for (const run of runs) {
      for (const p of run.cells) clearSet.set(key(p), p);
      if (run.cells.length >= 4) {
        const ancora = chain === 1 ? run.cells.find(p => anchors.some(a => a.r === p.r && a.c === p.c)) : undefined;
        const pos = ancora ?? run.cells[Math.floor((run.cells.length - 1) / 2)];
        if (!created.some(x => key(x.pos) === key(pos))) created.push({ pos, tile: { k: run.k, sp: run.dir === 'h' ? 'row' : 'col' } });
      }
    }
    // as especiais que entraram na combinação disparam (e podem disparar outras, em cadeia)
    const triggered: Pos[] = [];
    const fila = [...clearSet.values()];
    for (let i = 0; i < fila.length; i++) {
      const p = fila[i];
      const t = w[p.r][p.c];
      if (!t?.sp) continue;
      triggered.push(p);
      const linha = Array.from({ length: M3_COLS }, (_, c) => ({ r: p.r, c }));
      const coluna = Array.from({ length: M3_ROWS }, (_, r) => ({ r, c: p.c }));
      const alvo: Pos[] = comboKeys.has(key(p)) ? [...linha, ...coluna] : t.sp === 'row' ? linha : coluna;
      for (const q of alvo) {
        if (!w[q.r][q.c] || clearSet.has(key(q))) continue;
        clearSet.set(key(q), q);
        fila.push(q);
      }
    }
    // a peça que nasce fica de pé (mesmo que uma listrada passe por cima dela)
    for (const x of created) clearSet.delete(key(x.pos));
    const cleared = [...clearSet.values()];
    const gained = Math.round(cleared.length * POINTS_PER_TILE * chainMultiplier(chain)) + created.length * POINTS_PER_CREATED + triggered.length * POINTS_PER_TRIGGER;
    score += gained;
    const kinds = cleared.map(p => w[p.r][p.c]!.k);
    for (const p of cleared) w[p.r][p.c] = null;
    for (const x of created) w[x.pos.r][x.pos.c] = x.tile;
    // gravidade por coluna, depois o topo é preenchido (coluna a coluna, de cima para baixo: ordem fixa do sorteio)
    for (let c = 0; c < M3_COLS; c++) {
      const fica: Tile[] = [];
      for (let r = M3_ROWS - 1; r >= 0; r--) if (w[r][c]) fica.push(w[r][c]!);
      const faltam = M3_ROWS - fica.length;
      for (let r = M3_ROWS - 1, i = 0; r >= 0; r--, i++) w[r][c] = i < fica.length ? fica[i] : null;
      for (let r = 0; r < faltam; r++) w[r][c] = { k: pickKind(rng) };
    }
    steps.push({ cleared, kinds, triggered, created, chain, gained, after: cloneBoard(w) });
  }
  return { steps, board: w, score };
}

export type SwapResult =
  | { ok: false; reason: 'far' | 'empty' }
  | { ok: true; swapped: Board; steps: Step[]; board: Board; score: number; reshuffled: Board | null; scored: boolean };

/**
 * A jogada: trocar duas peças VIZINHAS. Válida SEMPRE que as duas casas existem, são vizinhas e têm peça — formando linha ou não
 * (sem linha: `steps` vazio, `score` 0, `scored` false e o tabuleiro fica com as duas peças trocadas). Inválida (nada muda,
 * nenhum movimento gasto) só quando `far` (fora do tabuleiro ou não vizinhas) ou `empty` (casa sem peça). Quem chama gasta 1 movimento por troca válida.
 */
export function trySwap(b: Board, a: Pos, d: Pos, rng: Rng): SwapResult {
  if (!inside(a.r, a.c) || !inside(d.r, d.c)) return { ok: false, reason: 'far' };
  if (Math.abs(a.r - d.r) + Math.abs(a.c - d.c) !== 1) return { ok: false, reason: 'far' };
  if (!b[a.r][a.c] || !b[d.r][d.c]) return { ok: false, reason: 'empty' };
  const swapped = cloneBoard(b);
  swapCells(swapped, a, d);
  // duas setinhas trocadas entre si (qualquer elemento) disparam juntas: linha E coluna
  const combo = swapped[a.r][a.c]!.sp && swapped[d.r][d.c]!.sp ? [a, d] : [];
  const res = resolveBoard(swapped, rng, [a, d], combo);
  let board = res.board;
  let reshuffled: Board | null = null;
  if (!hasMoves(board)) { board = shuffleBoard(board, rng); reshuffled = board; }
  return { ok: true, swapped, steps: res.steps, board, score: res.score, reshuffled, scored: res.steps.length > 0 };
}

// ── a rodada e os Bits ───────────────────────────────────────────────────────────────────────────────────────────────

/** Pontos por Bit e o teto de uma rodada — calibrados em `utils/mente/balanco.test.ts` (mesma faixa de Bits/minuto dos outros jogos). */
export const M3_POINTS_PER_BIT = 130;
export const M3_MAX_BITS = 8;

/** Bits de uma rodada: 1 a cada `M3_POINTS_PER_BIT` pontos, até `M3_MAX_BITS`. */
export function match3Bits(score: number): number {
  const s = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  return Math.min(M3_MAX_BITS, Math.floor(s / M3_POINTS_PER_BIT));
}

/** Uma rodada inteira a partir da semente (a tela e os testes usam a MESMA). */
export function newRound(seed: number): { board: Board; rng: Rng } {
  const rng = mulberry32(seed | 0);
  return { board: newBoard(rng), rng };
}

/** Uma dica: o movimento que mais pontua agora (primeiro, em caso de empate). `null` se não houver. */
export function bestMove(b: Board, rng: Rng): { a: Pos; b: Pos; score: number } | null {
  let melhor: { a: Pos; b: Pos; score: number } | null = null;
  for (const m of validMoves(b)) {
    const r = trySwap(b, m.a, m.b, mulberry32(Math.floor(rng() * 2 ** 31)));
    if (r.ok && (!melhor || r.score > melhor.score)) melhor = { a: m.a, b: m.b, score: r.score };
  }
  return melhor;
}
