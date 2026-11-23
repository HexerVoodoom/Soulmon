/**
 * ELEMENTAL FUSION — peças especiais por combinação (pedido do dono, 09/11/2026): 4 em linha = 1 seta na direção formada;
 * 5+ em linha = 2 setas; 3 horizontais + 3 verticais do mesmo elemento (cruz/L/T) = 2 setas na casa em comum, que explode em cruz.
 */
import { describe, it, expect } from 'vitest';
import { M3_COLS, M3_ROWS, findRuns, resolveBoard, trySwap, type Board, type Pos } from './match3';
import { mulberry32 } from './combate/rng';

const base = (): Board => Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (c + 2 * r) % 6 })));
const X = 9; // um tipo que o tabuleiro-base não tem: nenhuma linha acidental
const put = (b: Board, cells: Array<[number, number]>, k = X) => { for (const [r, c] of cells) b[r][c] = { k }; return b; };
const horiz = (r: number, c0: number, n: number): Array<[number, number]> => Array.from({ length: n }, (_, i) => [r, c0 + i]);
const vert = (r0: number, c: number, n: number): Array<[number, number]> => Array.from({ length: n }, (_, i) => [r0 + i, c]);
const step1 = (b: Board) => resolveBoard(b, mulberry32(1)).steps[0];
const specials = (b: Board) => b.flat().filter(t => t?.sp);

describe('padrões que geram especial', () => {
  it('3 em linha: nada de especial', () => {
    expect(step1(put(base(), horiz(3, 1, 3))).created).toHaveLength(0);
  });
  it('4 na horizontal: 1 seta horizontal (limpa a linha)', () => {
    const st = step1(put(base(), horiz(3, 1, 4)));
    expect(st.created).toHaveLength(1);
    expect(st.created[0].tile).toEqual({ k: X, sp: 'row' });
  });
  it('4 na vertical: 1 seta vertical (limpa a coluna)', () => {
    const st = step1(put(base(), vert(1, 3, 4)));
    expect(st.created).toHaveLength(1);
    expect(st.created[0].tile.sp).toBe('col');
  });
  it('5 na horizontal e 5 na vertical: 2 setas', () => {
    expect(step1(put(base(), horiz(2, 0, 5))).created.map(x => x.tile.sp)).toEqual(['both']);
    expect(step1(put(base(), vert(0, 4, 5))).created.map(x => x.tile.sp)).toEqual(['both']);
  });
  it('7 na linha (largura toda) também é 2 setas, uma só peça', () => {
    const st = step1(put(base(), horiz(5, 0, 7)));
    expect(st.created).toHaveLength(1);
    expect(st.created[0].tile.sp).toBe('both');
  });
  it('cruz (+): 2 setas na casa em comum', () => {
    const st = step1(put(base(), [...horiz(3, 2, 3), ...vert(2, 3, 3)]));
    expect(st.created).toHaveLength(1);
    expect(st.created[0]).toEqual({ pos: { r: 3, c: 3 }, tile: { k: X, sp: 'both' } });
  });
  it('L no canto e T na borda do tabuleiro: 2 setas na quina', () => {
    const l = step1(put(base(), [...horiz(0, 0, 3), ...vert(0, 0, 3)]));
    expect(l.created).toEqual([{ pos: { r: 0, c: 0 }, tile: { k: X, sp: 'both' } }]);
    const t = step1(put(base(), [...horiz(6, 2, 3), ...vert(4, 3, 3)]));
    expect(t.created).toEqual([{ pos: { r: 6, c: 3 }, tile: { k: X, sp: 'both' } }]);
  });
  it('linha de 4 cruzada por uma vertical de 3: vira UMA de 2 setas (sem seta extra de 1 direção)', () => {
    const st = step1(put(base(), [...horiz(3, 0, 4), ...vert(2, 1, 3)]));
    expect(st.created).toHaveLength(1);
    expect(st.created[0].tile.sp).toBe('both');
  });
  it('3 horizontais e 3 verticais de elementos DIFERENTES não fazem cruz', () => {
    const b = put(base(), horiz(3, 2, 3));
    put(b, [[2, 3], [4, 3]], 8); // o X do meio está na horizontal; em cima e embaixo, outro tipo
    expect(findRuns(b).every(r => r.k === X)).toBe(true);
    expect(step1(b).created).toHaveLength(0);
  });
  it('pela troca: 4 e 5 formados pelo jogador criam a peça onde ele mexeu', () => {
    const b4 = put(base(), [...horiz(3, 0, 3), [4, 3]]);
    const r4 = trySwap(b4, { r: 4, c: 3 }, { r: 3, c: 3 }, mulberry32(1));
    expect(r4.ok && r4.steps[0].created[0]).toMatchObject({ pos: { r: 3, c: 3 }, tile: { sp: 'row' } });
    const b5 = put(base(), [...horiz(3, 0, 2), ...horiz(3, 3, 2), [4, 2]]);
    const r5 = trySwap(b5, { r: 4, c: 2 }, { r: 3, c: 2 }, mulberry32(1));
    expect(r5.ok && r5.steps[0].created[0]).toMatchObject({ pos: { r: 3, c: 2 }, tile: { sp: 'both' } });
  });
});

describe('efeito ao ativar', () => {
  const comEspecial = (sp: 'row' | 'col' | 'both') => {
    const b = base();
    b[3][3] = { k: X, sp };
    put(b, [[3, 2], [3, 4]]); // linha de 3 com a especial no meio → dispara
    return b;
  };
  it('2 setas: limpa a linha E a coluna inteiras', () => {
    const st = step1(comEspecial('both'));
    expect(st.triggered).toEqual([{ r: 3, c: 3 }]);
    const has = (r: number, c: number) => st.cleared.some(p => p.r === r && p.c === c);
    for (let c = 0; c < M3_COLS; c++) expect(has(3, c)).toBe(true);
    for (let r = 0; r < M3_ROWS; r++) expect(has(r, 3)).toBe(true);
    expect(st.cleared).toHaveLength(M3_COLS + M3_ROWS - 1);
  });
  it('1 seta horizontal só limpa a linha; vertical só a coluna', () => {
    expect(step1(comEspecial('row')).cleared).toHaveLength(M3_COLS);
    const b = base();
    b[3][3] = { k: X, sp: 'col' };
    put(b, [[2, 3], [4, 3]]);
    const st = step1(b);
    expect(st.cleared).toHaveLength(M3_ROWS);
    expect(st.cleared.every(p => p.c === 3)).toBe(true);
  });
  it('a de 2 setas pode acionar outra especial em cadeia', () => {
    const b = comEspecial('both');
    b[3][0] = { k: 1, sp: 'col' };
    const st = step1(b);
    expect(st.triggered).toHaveLength(2);
    expect(st.cleared.some(p => p.r === 0 && p.c === 0)).toBe(true); // a coluna 0 inteira foi junto
  });
});

describe('cascata, gravidade e pontuação', () => {
  it('a peça criada fica de pé, cai com a gravidade e vale pontos de criação', () => {
    const res = resolveBoard(put(base(), horiz(3, 1, 5)), mulberry32(1));
    const st = res.steps[0];
    expect(st.gained).toBeGreaterThanOrEqual(4 * 10 + 20); // 4 peças somem + 1 criada
    expect(specials(st.after)).toHaveLength(1);
    expect(specials(st.after)[0]).toMatchObject({ k: X, sp: 'both' });
    expect(res.score).toBe(res.steps.reduce((s, x) => s + x.gained, 0));
  });
  it('determinismo: mesma semente, mesmo tabuleiro e mesma pontuação', () => {
    const mk = () => resolveBoard(put(base(), [...horiz(3, 2, 3), ...vert(2, 3, 3)]), mulberry32(5));
    const a = mk();
    const c = mk();
    expect(a.board).toEqual(c.board);
    expect(a.score).toBe(c.score);
  });
  it('a cascata assenta sem linha pronta e a especial da cruz sobrevive', () => {
    const feita = resolveBoard(put(base(), [...horiz(3, 2, 3), ...vert(2, 3, 3)]), mulberry32(2));
    expect(findRuns(feita.board)).toHaveLength(0);
    expect(feita.steps[0].created).toHaveLength(1);
    expect(feita.steps.length).toBeGreaterThanOrEqual(1);
  });
});
