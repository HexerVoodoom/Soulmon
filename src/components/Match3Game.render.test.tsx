// @vitest-environment jsdom
/**
 * COMBINA 3 — a TELA (pedido do dono, 11/10/2026, REGISTRO §36; combate em 18/10/2026, D-02/D-04/D-07). A regra é testada pura em
 * `utils/match3.test.ts` e `utils/match3Combat.test.ts`; aqui: o tabuleiro monta (49 peças, nome acessível, formas), a arena (você à
 * esquerda, 3 inimigos em ordem 1→3, o ativo marcado), tela quase cheia, a jogada válida gasta 1 turno e a cascata anima passo a
 * passo, a rodada fecha quando um lado cai e paga UMA vez o que o placar do combate diz (PT/EN), teclado, dica, recorde, de novo.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { Match3Game } from './Match3Game';
import { M3_COLS, M3_MAX_BITS, M3_ROWS, match3Bits, newRound, trySwap, validMoves, type Board, type Pos, type Rng } from '../utils/match3';
import { M3C_ENEMY_HP, M3C_PLAYER_HP, combatScore, newCombat, playTurn, type M3Combat } from '../utils/match3Combat';
import { mulberry32 } from '../utils/combate/rng';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
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
/** A mesma rodada, jogada pela conta pura (tabuleiro + combate com os MESMOS rngs da tela), para prever o que a tela deve mostrar. */
function previsao(n: number): { moves: Array<{ a: Pos; b: Pos }>; total: number; boards: Board[]; combates: M3Combat[] } {
  const { board, rng } = newRound(SEED);
  const er = mulberry32(SEED ^ 0x5eed);
  let c = newCombat(mulberry32(SEED + 99), Object.keys(DUNGEON_LINE_SPRITES), undefined);
  let b = board;
  const moves: Array<{ a: Pos; b: Pos }> = [];
  const boards: Board[] = [b];
  const combates: M3Combat[] = [c];
  for (let i = 0; i < n && c.outcome === 'playing'; i++) {
    const m = validMoves(b)[0];
    const r = trySwap(b, m.a, m.b, rng as Rng);
    if (!r.ok) throw new Error('inválida');
    moves.push(m); b = r.board; boards.push(b);
    c = playTurn(c, r.steps, er); combates.push(c);
  }
  return { moves, total: combatScore(c), boards, combates };
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
    expect(document.body.textContent).toContain('Turno');
  });

  it('turno, placar e Bits começam em 0 / 0 / 0; só um tabuleiro roving-tabindex (um foco)', () => {
    montar();
    expect(num('data-m3-turn')).toBe(0);
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

  it('9.2: troca que NÃO forma linha é LIVRE — as duas peças trocam, gasta 1 turno (o inimigo responde), não pontua e não há aviso de erro', async () => {
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
    expect(num('data-m3-turn')).toBe(1);
    expect(num('data-m3-score')).toBe(0);
    expect(cell(par!.a).getAttribute('data-m3-kind')).toBe(kindB);
    expect(cell(par!.b).getAttribute('data-m3-kind')).toBe(kindA);
    const aviso = document.querySelector('[data-m3-note]')?.textContent ?? '';
    expect(aviso).not.toMatch(/doesn't make a line|try another|wrong|error|fail|errou/i);
  });

  it('jogada válida: gasta 1 turno, a cascata anima passo a passo e a pontuação bate com a conta pura', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
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
    expect(num('data-m3-turn')).toBe(1);
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
    expect(num('data-m3-turn')).toBe(1);
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

/** Joga na tela a partida inteira prevista pela conta pura (a rodada acaba quando um lado cai). */
async function jogarTudo(p: ReturnType<typeof previsao>) {
  for (let i = 0; i < p.moves.length; i++) await jogarEscolhido(p.moves[i]);
}

describe('a rodada', () => {
  it('a rodada acaba quando um lado cai (não por limite de movimentos), paga UMA vez o que o placar diz e mostra o resultado (EN)', async () => {
    const onEarn = vi.fn();
    montar({ onEarn });
    const p = previsao(60);
    const final = p.combates[p.combates.length - 1];
    expect(final.outcome).not.toBe('playing');
    expect(p.moves.length).toBeGreaterThan(5);
    await jogarTudo(p);
    expect(document.querySelector('[data-m3-end]')!.textContent).toBe(`You scored ${p.total} points`);
    expect(document.querySelector('[data-m3-end]')!.getAttribute('data-m3-outcome')).toBe(final.outcome);
    const bits = match3Bits(p.total);
    expect(bits).toBeLessThanOrEqual(M3_MAX_BITS);
    if (bits > 0) {
      expect(onEarn).toHaveBeenCalledTimes(1);
      expect(onEarn).toHaveBeenCalledWith(bits);
      expect(document.body.textContent).toContain(`+${bits} Bits`);
    } else {
      expect(onEarn).not.toHaveBeenCalled();
    }
    expect(localStorage.getItem(STORAGE_KEYS.MATCH3_BEST)).toBe(String(p.total));
    await avancar(5000);
    expect(onEarn.mock.calls.length).toBeLessThanOrEqual(1); // nunca de novo
    expect(document.querySelector('[data-m3-board]')).toBeNull(); // acabou: o tabuleiro sai
  });

  it('D-07: o valor pago sai SÓ do placar do combate (dano causado − recebido + bônus), com o teto de Bits', async () => {
    const onEarn = vi.fn();
    montar({ onEarn });
    const p = previsao(60);
    const c = p.combates[p.combates.length - 1];
    expect(p.total).toBe(Math.max(0, c.dealt - c.taken + c.defeated * 100));
    await jogarTudo(p);
    const pago = onEarn.mock.calls.reduce((n, a) => n + (a[0] as number), 0);
    expect(pago).toBe(match3Bits(p.total));
    expect(pago).toBeLessThanOrEqual(M3_MAX_BITS);
  });

  it('em PT-BR o resultado é em português', async () => {
    montar({ language: 'pt-BR' });
    const p = previsao(60);
    await jogarTudo(p);
    expect(document.querySelector('[data-m3-end]')!.textContent).toBe(`Você fez ${p.total} pontos`);
    expect(screen.getByRole('button', { name: 'De novo' })).toBeTruthy();
    expect(document.querySelector('[data-m3-outcome-line]')!.textContent).toMatch(/time da fenda/);
    expect(document.body.textContent).not.toMatch(/errou|perdeu|derrota/i);
  });

  it('"De novo" começa outra rodada (turno 0, placar 0, HP cheio) e o recorde fica', async () => {
    montar();
    const p = previsao(60);
    await jogarTudo(p);
    fireEvent.click(document.querySelector('[data-m3-again]')!);
    expect(num('data-m3-turn')).toBe(0);
    expect(num('data-m3-score')).toBe(0);
    expect(Number(document.querySelector('[data-m3-player]')!.getAttribute('data-m3-hp'))).toBe(M3C_PLAYER_HP);
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

describe('D-06: turnos alternados na tela', () => {
  it('cada jogada válida (pontue ou não) tira vida do Soulmon do jogador e do inimigo ativo, como a conta pura', async () => {
    montar();
    const p = previsao(2);
    await jogarEscolhido(p.moves[0]);
    const c1 = p.combates[1];
    expect(Number(document.querySelector('[data-m3-player]')!.getAttribute('data-m3-hp'))).toBe(c1.player.hp);
    expect(c1.player.hp).toBeLessThan(M3C_PLAYER_HP);
    expect(Number(document.querySelector('[data-m3-enemy="1"]')!.getAttribute('data-m3-hp'))).toBe(c1.enemies[0].hp);
    expect(Number(document.querySelector('[data-m3-enemy="2"]')!.getAttribute('data-m3-hp'))).toBe(M3C_ENEMY_HP[1]);
    const aviso = document.querySelector('[data-m3-note]')!.textContent ?? '';
    expect(aviso).toMatch(/Your strike/);
    expect(aviso).toMatch(/Reply/);
  });
});

describe('D-04: a arena', () => {
  it('1 Soulmon do jogador à ESQUERDA e 3 inimigos à direita em ordem 1→3, com HP e o ativo marcado', () => {
    montar();
    const arena = document.querySelector('[data-m3-arena]') as HTMLElement;
    const player = arena.querySelectorAll('[data-m3-player]');
    const inimigos = [...arena.querySelectorAll('[data-m3-enemy]')];
    expect(player.length).toBe(1);
    expect(inimigos.map(e => e.getAttribute('data-m3-enemy'))).toEqual(['1', '2', '3']);
    // ordem do documento = ordem visual (linha flex, sem inversão): o jogador vem antes de todos os inimigos
    for (const e of inimigos) expect(player[0].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(arena.style.flexDirection).not.toBe('row-reverse');
    expect(arena.style.flexDirection).not.toBe('column');
    // sprites e barras de HP (GameKit): 1 + 3 barras
    expect(player[0].querySelector('img')!.getAttribute('src')).toBeTruthy();
    for (const e of inimigos) expect(e.querySelector('img[src]')).not.toBeNull();
    expect(arena.querySelectorAll('[role="progressbar"]').length).toBe(4);
    // o primeiro é o ativo; os outros não
    expect(inimigos.map(e => e.getAttribute('data-m3-active'))).toEqual(['1', '0', '0']);
    expect(inimigos[0].getAttribute('aria-current')).toBe('true');
    expect(inimigos[0].textContent).toContain('▸');
    // três elementos distintos
    expect(new Set(inimigos.map(e => e.getAttribute('data-m3-element'))).size).toBe(3);
  });

  it('o inimigo ativo muda quando o 1º cai (a marca vai para o 2º)', async () => {
    montar();
    const p = previsao(60);
    const i = p.combates.findIndex(c => c.active === 1);
    expect(i).toBeGreaterThan(0);
    for (let k = 0; k < i; k++) await jogarEscolhido(p.moves[k]);
    const inimigos = [...document.querySelectorAll('[data-m3-enemy]')];
    expect(inimigos.map(e => e.getAttribute('data-m3-active'))).toEqual(['0', '1', '0']);
    expect(Number(inimigos[0].getAttribute('data-m3-hp'))).toBe(0);
  });

  it('tela quase cheia (D-02): a página não reserva a faixa da nav, a arena cresce e o tabuleiro escala pela largura', () => {
    montar();
    const root = document.querySelector('[data-game-root]') as HTMLElement;
    expect(root.hasAttribute('data-game-full')).toBe(true);
    expect(root.style.paddingBottom).not.toContain('--sm-corner-h');
    const campo = document.querySelector('[data-m3-field]') as HTMLElement;
    expect(campo.style.flex).toMatch(/^1 /);
    const board = document.querySelector('[data-m3-board]') as HTMLElement;
    expect(board.style.width).toBe('100%');
    // o botão de dica tem alvo ≥ 44
    expect((document.querySelector('[data-m3-hint-button]') as HTMLElement).style.minHeight).toBe('44px');
    // nenhum link de canto/nav montado por este componente
    expect(document.querySelector('[data-corner-link]')).toBeNull();
  });
});

describe('D-01: o contexto narrativo', () => {
  it('o Combina 3 conta o combate (os 3 Soulmon inimigos são um time) em PT e EN', () => {
    montar({ language: 'pt-BR' });
    expect(document.querySelector('[data-game-story="match3"]')!.textContent).toMatch(/Três Soulmon da fenda formam um time/);
    cleanup();
    montar({ language: 'en-US' });
    expect(document.querySelector('[data-game-story="match3"]')!.textContent).toMatch(/Three Soulmon from the rift form a team/);
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
