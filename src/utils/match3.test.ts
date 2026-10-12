/**
 * COMBINA 3 — a lógica pura (pedido do dono, 11/10/2026, REGISTRO §36): detecção de linhas, gravidade, cascata, troca inválida,
 * peças especiais (linha de 4), embaralhar sem jogadas e DETERMINISMO por semente. Mais a conta de Bits e o grep de `Math.random`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  M3_COLS, M3_KINDS, M3_MAX_BITS, M3_MOVES, M3_POINTS_PER_BIT, M3_ROWS, POINTS_PER_TILE, bestMove, chainMultiplier, cloneBoard, findRuns, hasMoves,
  match3Bits, newBoard, newRound, resolveBoard, shuffleBoard, trySwap, validMoves, type Board, type Tile,
} from './match3';
import { mulberry32 } from './combate/rng';

/** Monta um tabuleiro a partir de linhas de dígitos. */
function fromRows(rows: string[]): Board {
  return rows.map(row => [...row].map(ch => ({ k: Number(ch) })) as Tile[]);
}
/** 7×7 sem nenhuma linha pronta: o padrão (r + 2c) % 6 nunca repete 3 seguidos nem na linha nem na coluna. */
function neutro(): Board {
  return Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (r + 2 * c) % M3_KINDS }))) as Board;
}
const set = (b: Board, r: number, c: number, k: number, sp?: 'row' | 'col') => { b[r][c] = sp ? { k, sp } : { k }; };

describe('detecção de linhas', () => {
  it('acha linhas horizontais e verticais de 3+ e ignora pares', () => {
    const b = neutro();
    expect(findRuns(b)).toEqual([]);
    set(b, 0, 0, 5); set(b, 0, 1, 5); set(b, 0, 2, 5);
    set(b, 3, 6, 4); set(b, 4, 6, 4); set(b, 5, 6, 4); set(b, 6, 6, 4);
    const runs = findRuns(b);
    expect(runs.length).toBe(2);
    expect(runs.find(r => r.dir === 'h')!.cells.length).toBe(3);
    expect(runs.find(r => r.dir === 'v')!.cells.length).toBe(4);
  });
  it('um tabuleiro novo nunca nasce com linha pronta e sempre tem jogada — em 200 sementes', () => {
    for (let s = 1; s <= 200; s++) {
      const b = newBoard(mulberry32(s));
      expect(findRuns(b), `semente ${s}`).toEqual([]);
      expect(hasMoves(b), `semente ${s}`).toBe(true);
      expect(b.length).toBe(M3_ROWS);
      expect(b.every(row => row.length === M3_COLS && row.every(t => t && t.k >= 0 && t.k < M3_KINDS))).toBe(true);
    }
  });
});

describe('troca', () => {
  it('troca inválida (sem linha) devolve nomatch e NÃO muda o tabuleiro', () => {
    const b = neutro();
    const antes = JSON.stringify(b);
    const r = trySwap(b, { r: 3, c: 3 }, { r: 3, c: 4 }, mulberry32(1));
    expect(r).toEqual({ ok: false, reason: 'nomatch' });
    expect(JSON.stringify(b)).toBe(antes);
  });
  it('só vizinhas (4 direções) contam: diagonal, longe, a mesma e fora do tabuleiro são "far"', () => {
    const b = neutro();
    for (const [a, d] of [[{ r: 0, c: 0 }, { r: 1, c: 1 }], [{ r: 0, c: 0 }, { r: 0, c: 2 }], [{ r: 0, c: 0 }, { r: 0, c: 0 }], [{ r: 0, c: 0 }, { r: -1, c: 0 }], [{ r: 6, c: 6 }, { r: 6, c: 7 }]] as const) {
      expect(trySwap(b, a, d, mulberry32(1))).toEqual({ ok: false, reason: 'far' });
    }
  });
  it('troca válida: gasta a linha, devolve os passos e o tabuleiro assentado (sem linha pronta, cheio)', () => {
    const b = neutro();
    set(b, 2, 0, 5); set(b, 2, 1, 5); set(b, 2, 3, 5); set(b, 3, 2, 5);
    expect(findRuns(b)).toEqual([]);
    const r = trySwap(b, { r: 2, c: 2 }, { r: 3, c: 2 }, mulberry32(9));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.steps.length).toBeGreaterThanOrEqual(1);
    // 4 iguais na linha: 3 somem e a 4ª (onde o jogador mexeu) vira especial
    expect(r.steps[0].cleared.length).toBe(3);
    expect(r.steps[0].created.length).toBe(1);
    expect(r.score).toBeGreaterThan(0);
    expect(findRuns(r.board)).toEqual([]);
    expect(r.board.flat().every(Boolean)).toBe(true);
  });
});

describe('gravidade e preenchimento', () => {
  it('as peças de cima descem e o topo é preenchido: o tabuleiro sempre volta cheio', () => {
    const b = neutro();
    set(b, 6, 0, 5); set(b, 6, 1, 5); set(b, 6, 2, 5);
    const topo = [b[3][0]!.k, b[4][0]!.k, b[5][0]!.k];
    const res = resolveBoard(b, mulberry32(3));
    expect(res.steps[0].cleared.length).toBe(3);
    // na coluna 0 sumiu só a de baixo: as que estavam nas linhas 3..5 estão agora uma casa mais abaixo (linhas 4..6)
    const col0 = res.steps[0].after.map(row => row[0]!.k);
    expect(col0.slice(4, 7)).toEqual(topo);
    expect(res.board.flat().every(Boolean)).toBe(true);
  });
});

describe('cascata', () => {
  it('cada passo da cascata vale mais (×1, ×1,5, ×2…) e a soma dos passos é a pontuação da jogada', () => {
    expect(chainMultiplier(1)).toBe(1);
    expect(chainMultiplier(2)).toBe(1.5);
    expect(chainMultiplier(3)).toBe(2);
    let achou = false;
    for (let s = 1; s <= 80 && !achou; s++) {
      const { board, rng } = newRound(s);
      const m = validMoves(board)[0];
      const r = trySwap(board, m.a, m.b, rng);
      if (r.ok && r.steps.length >= 2) {
        achou = true;
        const st2 = r.steps[1];
        expect(st2.chain).toBe(2);
        expect(st2.gained).toBe(Math.round(st2.cleared.length * POINTS_PER_TILE * 1.5) + st2.created.length * 20 + st2.triggered.length * 30);
        expect(r.score).toBe(r.steps.reduce((a, x) => a + x.gained, 0));
      }
    }
    expect(achou).toBe(true);
  });
});

describe('peças especiais (linha de 4+)', () => {
  it('4 em linha horizontal deixa uma peça que limpa a LINHA; vertical, a COLUNA', () => {
    const h = neutro();
    for (let c = 0; c < 4; c++) set(h, 6, c, 5);
    const rh = resolveBoard(h, mulberry32(2));
    expect(rh.steps[0].created.length).toBe(1);
    expect(rh.steps[0].created[0].tile.sp).toBe('row');
    const v = neutro();
    for (let r = 3; r < 7; r++) set(v, r, 0, 5);
    const rv = resolveBoard(v, mulberry32(2));
    expect(rv.steps[0].created[0].tile.sp).toBe('col');
  });
  it('a especial nasce onde o jogador mexeu (a âncora da troca)', () => {
    const b = neutro();
    for (const c of [0, 1, 3]) set(b, 6, c, 5);
    set(b, 5, 2, 5);
    const r = trySwap(b, { r: 5, c: 2 }, { r: 6, c: 2 }, mulberry32(4));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const nasc = r.steps[0].created[0];
    expect(nasc.pos).toEqual({ r: 6, c: 2 });
    expect(nasc.tile).toEqual({ k: 5, sp: 'row' });
  });
  it('a especial, quando entra numa combinação, dispara e limpa a linha inteira (e conta o disparo)', () => {
    const b = neutro();
    set(b, 6, 3, 5, 'row');
    set(b, 6, 4, 5); set(b, 6, 5, 5); set(b, 6, 6, 5);
    const res = resolveBoard(b, mulberry32(5));
    const st = res.steps[0];
    expect(st.triggered).toEqual([{ r: 6, c: 3 }]);
    // 4 iguais na linha (3,4,5,6) criam outra especial no mesmo passo: ela fica de pé; o resto da linha toda some
    expect(st.created.length).toBe(1);
    expect(st.cleared.length).toBe(M3_COLS - 1);
  });
  it('especiais disparam outras em cadeia (a de coluna que estava na linha limpa)', () => {
    const b = neutro();
    set(b, 6, 0, 5, 'row'); set(b, 6, 1, 5); set(b, 6, 2, 5);
    set(b, 6, 5, 4, 'col');
    const res = resolveBoard(b, mulberry32(6));
    const st = res.steps[0];
    expect(st.triggered.length).toBe(2);
    expect(st.cleared.length).toBe(M3_COLS + M3_ROWS - 1);
  });
});

describe('sem jogadas: embaralha', () => {
  it('um tabuleiro é embaralhado em outro com jogada e sem linha pronta, com as mesmas peças', () => {
    const base = fromRows([
      '0123450', '2345012', '4501234', '0123450', '2345012', '4501234', '0123450',
    ]);
    const novo = shuffleBoard(base, mulberry32(11));
    expect(findRuns(novo)).toEqual([]);
    expect(hasMoves(novo)).toBe(true);
    const conta = (b: Board) => b.flat().reduce<number[]>((a, t) => { a[t!.k] = (a[t!.k] ?? 0) + 1; return a; }, []);
    expect(conta(novo)).toEqual(conta(base));
  });
});

describe('determinismo por semente', () => {
  const jogar = (seed: number) => {
    const { board, rng } = newRound(seed);
    let b = board; let total = 0; const log: unknown[] = [];
    for (let i = 0; i < M3_MOVES; i++) {
      const m = validMoves(b)[0];
      const r = trySwap(b, m.a, m.b, rng);
      if (!r.ok) throw new Error('inválida');
      total += r.score; b = r.board; log.push(r.steps.map(s => [s.cleared.length, s.chain, s.gained]));
    }
    return { b, total, log };
  };
  it('mesma semente + mesmas trocas → mesmo tabuleiro, mesmos passos e mesma pontuação', () => {
    expect(jogar(1234)).toEqual(jogar(1234));
    expect(JSON.stringify(jogar(1235)) === JSON.stringify(jogar(1234))).toBe(false);
  });
  it('trySwap não muta o tabuleiro de entrada', () => {
    const { board, rng } = newRound(5);
    const copia = JSON.stringify(board);
    const m = validMoves(board)[0];
    trySwap(board, m.a, m.b, rng);
    expect(JSON.stringify(board)).toBe(copia);
    expect(cloneBoard(board)).toEqual(board);
  });
  it('a dica é um movimento válido', () => {
    const { board } = newRound(8);
    const h = bestMove(board, mulberry32(1))!;
    expect(trySwap(board, h.a, h.b, mulberry32(1)).ok).toBe(true);
  });
  it('o módulo não usa Math.random (a semente decide tudo)', () => {
    const src = readFileSync(join(__dirname, 'match3.ts'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/Math\.random/);
  });
});

describe('Bits', () => {
  it('1 a cada M3_POINTS_PER_BIT pontos, teto M3_MAX_BITS; lixo vale 0', () => {
    expect(match3Bits(0)).toBe(0);
    expect(match3Bits(M3_POINTS_PER_BIT - 1)).toBe(0);
    expect(match3Bits(M3_POINTS_PER_BIT)).toBe(1);
    expect(match3Bits(M3_POINTS_PER_BIT * 3 + 5)).toBe(3);
    expect(match3Bits(1e9)).toBe(M3_MAX_BITS);
    for (const lixo of [NaN, -5, Infinity * 0]) expect(match3Bits(lixo)).toBe(0);
  });
});
