// @vitest-environment jsdom
/**
 * COMBINA 3 — a TELA (pedido do dono, 11/10/2026, REGISTRO §36). A regra é testada pura em `utils/match3.test.ts`; aqui: o tabuleiro
 * monta (49 peças, nome acessível, formas), troca inválida volta sem gastar movimento, a jogada válida gasta 1 e a cascata anima
 * passo a passo, a rodada fecha em 20 movimentos e paga UMA vez o que a conta pura diz (PT/EN), teclado, dica, recorde, de novo.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { Match3Game } from './Match3Game';
import { M3_COLS, M3_MAX_BITS, M3_MOVES, M3_ROWS, match3Bits, newRound, trySwap, validMoves, type Board, type Pos, type Rng } from '../utils/match3';
import { STORAGE_KEYS } from '../utils/storageKeys';

const SEED = 31337;
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const cell = (p: Pos) => document.querySelector(`[data-m3-cell="${p.r},${p.c}"]`) as HTMLButtonElement;
const num = (attr: string) => Number(document.querySelector(`[${attr}]`)!.getAttribute(attr));
/** Deixa a cascata inteira correr (cada passo ~0,5 s). */
const assentar = async () => { await avancar(8000); };

function montar(over: { language?: 'pt-BR' | 'en-US'; onEarn?: (n: number) => void; onExit?: () => void } = {}) {
  return renderWithCss(<Match3Game language={over.language ?? 'en-US'} evolutionStage="rookie" onEarnPoints={over.onEarn ?? (() => {})} onExit={over.onExit ?? (() => {})} seed={SEED} />);
}
/** A mesma rodada, jogada pela conta pura, para prever o que a tela deve mostrar. */
function previsao(n: number): { moves: Array<{ a: Pos; b: Pos }>; total: number; boards: Board[] } {
  const { board, rng } = newRound(SEED);
  let b = board; let total = 0;
  const moves: Array<{ a: Pos; b: Pos }> = [];
  const boards: Board[] = [b];
  for (let i = 0; i < n; i++) {
    const m = validMoves(b)[0];
    const r = trySwap(b, m.a, m.b, rng as Rng);
    if (!r.ok) throw new Error('inválida');
    moves.push(m); total += r.score; b = r.board; boards.push(b);
  }
  return { moves, total, boards };
}
async function jogarEscolhido(m: { a: Pos; b: Pos }) {
  fireEvent.click(cell(m.a));
  fireEvent.click(cell(m.b));
  await assentar();
}

describe('o tabuleiro', () => {
  it('monta 7×7 peças de elemento, cada uma com nome acessível e linha/coluna; grid acessível', () => {
    montar();
    const grade = document.querySelector('[data-m3-board]')!;
    expect(grade.getAttribute('role')).toBe('grid');
    expect(grade.getAttribute('aria-rowcount')).toBe(String(M3_ROWS));
    expect(grade.getAttribute('aria-colcount')).toBe(String(M3_COLS));
    const celulas = document.querySelectorAll('[data-m3-cell]');
    expect(celulas.length).toBe(M3_ROWS * M3_COLS);
    const primeira = cell({ r: 0, c: 0 });
    expect(primeira.getAttribute('aria-label')).toMatch(/^(Fire|Water|Earth|Life|Air|Light), row 1, column 1$/);
    expect(primeira.querySelector('img')!.getAttribute('src')).toBeTruthy(); // ícone de elemento do repo
    expect(document.querySelectorAll('[role="gridcell"]').length).toBe(49);
  });

  it('em PT-BR os nomes e a ajuda estão em português', () => {
    montar({ language: 'pt-BR' });
    expect(cell({ r: 2, c: 3 }).getAttribute('aria-label')).toMatch(/^(Fogo|Água|Terra|Vida|Ar|Luz), linha 3, coluna 4$/);
    expect(screen.getByRole('button', { name: 'Dica' })).toBeTruthy();
    expect(document.body.textContent).toContain('Movimentos');
  });

  it('movimentos, pontos e Bits começam em 20 / 0 / 0; só um tabuleiro roving-tabindex (um foco)', () => {
    montar();
    expect(num('data-m3-moves')).toBe(M3_MOVES);
    expect(num('data-m3-score')).toBe(0);
    expect(num('data-m3-bits')).toBe(0);
    expect([...document.querySelectorAll('[data-m3-cell]')].filter(b => b.getAttribute('tabindex') === '0').length).toBe(1);
  });
});

describe('jogar', () => {
  it('toque numa peça seleciona; no mesmo lugar de novo desseleciona', () => {
    montar();
    fireEvent.click(cell({ r: 3, c: 3 }));
    expect(cell({ r: 3, c: 3 }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(cell({ r: 3, c: 3 }));
    expect(cell({ r: 3, c: 3 }).getAttribute('aria-pressed')).toBe('false');
  });

  it('9.2: troca que NÃO forma linha é LIVRE — as duas peças trocam, gasta 1 movimento, não pontua e não há aviso de erro', async () => {
    montar();
    const { board } = newRound(SEED);
    // acha um par vizinho que não forma linha
    const validos = new Set(validMoves(board).map(m => `${m.a.r},${m.a.c}-${m.b.r},${m.b.c}`));
    let par: { a: Pos; b: Pos } | null = null;
    for (let r = 0; r < M3_ROWS && !par; r++) for (let c = 0; c < M3_COLS - 1 && !par; c++) if (!validos.has(`${r},${c}-${r},${c + 1}`)) par = { a: { r, c }, b: { r, c: c + 1 } };
    expect(par).not.toBeNull();
    const kindA = cell(par!.a).getAttribute('data-m3-kind');
    const kindB = cell(par!.b).getAttribute('data-m3-kind');
    fireEvent.click(cell(par!.a));
    fireEvent.click(cell(par!.b));
    await assentar();
    expect(num('data-m3-moves')).toBe(M3_MOVES - 1);
    expect(num('data-m3-score')).toBe(0);
    expect(cell(par!.a).getAttribute('data-m3-kind')).toBe(kindB);
    expect(cell(par!.b).getAttribute('data-m3-kind')).toBe(kindA);
    const aviso = document.querySelector('[data-m3-note]')?.textContent ?? '';
    expect(aviso).not.toMatch(/doesn't make a line|try another|wrong|error|fail|errou/i);
  });

  it('jogada válida: gasta 1 movimento, a cascata anima passo a passo e a pontuação bate com a conta pura', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    expect(num('data-m3-moves')).toBe(M3_MOVES - 1);
    // durante a animação o tabuleiro trava (aria-busy)
    expect(document.querySelector('[data-m3-board]')!.getAttribute('aria-busy')).toBe('true');
    await assentar();
    expect(document.querySelector('[data-m3-board]')!.getAttribute('aria-busy')).toBe('false');
    expect(num('data-m3-score')).toBe(p.total);
    expect(num('data-m3-bits')).toBe(match3Bits(p.total));
    // o tabuleiro assentado é o da conta pura
    const esperado = p.boards[1];
    for (let r = 0; r < M3_ROWS; r++) for (let c = 0; c < M3_COLS; c++) expect(Number(cell({ r, c }).getAttribute('data-m3-kind'))).toBe(esperado[r][c]!.k);
  });

  it('arrastar (swipe) numa peça troca com a vizinha na direção do gesto', async () => {
    montar();
    const p = previsao(1);
    const { a, b } = p.moves[0];
    const dx = b.c - a.c; const dy = b.r - a.r;
    fireEvent.pointerDown(cell(a), { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(cell(a), { clientX: 100 + dx * 40, clientY: 100 + dy * 40 });
    fireEvent.click(cell(a)); // o clique que o navegador dispara depois do gesto não pode trocar de novo
    await assentar();
    expect(num('data-m3-moves')).toBe(M3_MOVES - 1);
    expect(num('data-m3-score')).toBe(p.total);
  });

  it('teclado: setas movem o foco, Enter seleciona e Enter numa vizinha troca', async () => {
    montar();
    const p = previsao(1);
    const { a, b } = p.moves[0];
    const grade = document.querySelector('[data-m3-board]') as HTMLElement;
    // leva o cursor até `a` com as setas
    for (let i = 0; i < a.r; i++) fireEvent.keyDown(grade, { key: 'ArrowDown' });
    for (let i = 0; i < a.c; i++) fireEvent.keyDown(grade, { key: 'ArrowRight' });
    expect(cell(a).getAttribute('tabindex')).toBe('0');
    fireEvent.click(cell(a)); // Enter/Espaço num <button> é um clique
    expect(cell(a).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(grade, { key: b.r > a.r ? 'ArrowDown' : b.r < a.r ? 'ArrowUp' : b.c > a.c ? 'ArrowRight' : 'ArrowLeft' });
    fireEvent.click(cell(b));
    await assentar();
    expect(num('data-m3-moves')).toBe(M3_MOVES - 1);
  });

  it('a dica marca duas peças que de fato trocam (e some sozinha)', async () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    const marcadas = [...document.querySelectorAll('[data-m3-hint="1"]')];
    expect(marcadas.length).toBe(2);
    await avancar(3000);
    expect(document.querySelectorAll('[data-m3-hint="1"]').length).toBe(0);
  });
});

describe('a rodada', () => {
  it('em 20 movimentos fecha, paga UMA vez exatamente o da conta pura e mostra o resultado (EN)', async () => {
    const onEarn = vi.fn();
    montar({ onEarn });
    const p = previsao(M3_MOVES);
    for (let i = 0; i < M3_MOVES; i++) {
      expect(num('data-m3-moves')).toBe(M3_MOVES - i);
      await jogarEscolhido(p.moves[i]);
    }
    expect(document.querySelector('[data-m3-end]')!.textContent).toBe(`You scored ${p.total} points`);
    const bits = match3Bits(p.total);
    expect(bits).toBeGreaterThan(0);
    expect(bits).toBeLessThanOrEqual(M3_MAX_BITS);
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(bits);
    expect(document.body.textContent).toContain(`+${bits} Bits`);
    expect(localStorage.getItem(STORAGE_KEYS.MATCH3_BEST)).toBe(String(p.total));
    await avancar(5000);
    expect(onEarn).toHaveBeenCalledTimes(1); // nunca de novo
  });

  it('em PT-BR o resultado é em português', async () => {
    montar({ language: 'pt-BR' });
    const p = previsao(M3_MOVES);
    for (let i = 0; i < M3_MOVES; i++) await jogarEscolhido(p.moves[i]);
    expect(document.querySelector('[data-m3-end]')!.textContent).toBe(`Você fez ${p.total} pontos`);
    expect(screen.getByRole('button', { name: 'De novo' })).toBeTruthy();
  });

  it('"De novo" começa outra rodada (movimentos 20, pontos 0) e o recorde fica', async () => {
    const onEarn = vi.fn();
    montar({ onEarn });
    const p = previsao(M3_MOVES);
    for (let i = 0; i < M3_MOVES; i++) await jogarEscolhido(p.moves[i]);
    fireEvent.click(document.querySelector('[data-m3-again]')!);
    expect(num('data-m3-moves')).toBe(M3_MOVES);
    expect(num('data-m3-score')).toBe(0);
    expect(document.querySelector('[data-m3-end]')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.MATCH3_BEST)).toBe(String(p.total));
  });

  it('sair no meio da rodada pede confirmação e NÃO paga nada', async () => {
    const onEarn = vi.fn();
    const onExit = vi.fn();
    montar({ onEarn, onExit });
    const p = previsao(1);
    await jogarEscolhido(p.moves[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(onEarn).not.toHaveBeenCalled();
  });
});

describe('movimento reduzido', () => {
  it('com prefers-reduced-motion a cascata não espera animação e o resultado é o mesmo', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await avancar(50); // quase nada de espera
    expect(num('data-m3-score')).toBe(p.total);
    // sem transição de CSS nas peças
    expect((cell({ r: 0, c: 0 }) as HTMLElement).style.transition === 'none' || (cell({ r: 0, c: 0 }) as HTMLElement).style.transition === '').toBe(true);
    vi.unstubAllGlobals();
  });
});
