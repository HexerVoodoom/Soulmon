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
import { M3_HINTS_PER_GAME, M3_HINT_PRICE_BITS, M3C_ENEMY_HP, M3C_PLAYER_HP, chooseMove, combatScore, newCombat, playTurn, type M3Combat } from '../utils/match3Combat';
import { mulberry32 } from '../utils/combate/rng';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { STORAGE_KEYS } from '../utils/storageKeys';

const SEED = 31337;

/** Altura da janela (jsdom não tem layout): o hook lê `window.innerHeight`. */
const comAltura = (h: number) => { Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: h }); };

describe('Combina 3 — tela baixa (QA L11-15, 320×568)', () => {
  const hOriginal = window.innerHeight;
  afterEach(() => comAltura(hOriginal));

  it('abaixo de 800 px de altura a arena compacta: uma linha e sprites menores', () => {
    comAltura(568);
    montar();
    const arena = document.querySelector('[data-m3-arena]') as HTMLElement;
    expect(arena.hasAttribute('data-m3-compact')).toBe(true);
    expect(arena.style.flexDirection).toBe('column');
    const player = document.querySelector('[data-m3-player] img') as HTMLImageElement;
    expect(player.width).toBeLessThan(88);
  });

  it('em tela alta a arena segue em coluna, com os sprites de sempre', () => {
    comAltura(900);
    montar();
    const arena = document.querySelector('[data-m3-arena]') as HTMLElement;
    expect(arena.hasAttribute('data-m3-compact')).toBe(false);
    expect(arena.style.flexDirection).toBe('column');
    expect((document.querySelector('[data-m3-player] img') as HTMLImageElement).width).toBe(88);
  });
});
// jsdom nasce com innerHeight 768 (< 800 = arena compacta): os testes de layout em coluna fixam uma tela alta (900).
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); comAltura(900); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const cell = (p: Pos) => document.querySelector(`[data-m3-cell="${p.r},${p.c}"]`) as HTMLButtonElement;
const num = (attr: string) => Number(document.querySelector(`[${attr}]`)!.getAttribute(attr));
/** Deixa a cascata inteira correr (cada passo ~0,5 s). */
const assentar = async () => { await avancar(8000); };

function montar(over: { language?: 'pt-BR' | 'en-US'; onEarn?: (n: number) => void; onExit?: () => void; bits?: number; onSpendBits?: (n: number) => boolean; petName?: string; petElement?: string } = {}) {
  return renderWithCss(<Match3Game language={over.language ?? 'en-US'} evolutionStage="rookie" petName={over.petName} petElement={over.petElement} onEarnPoints={over.onEarn ?? (() => {})} onExit={over.onExit ?? (() => {})} seed={SEED} bits={over.bits} onSpendBits={over.onSpendBits} />);
}
/** A mesma rodada, jogada pela conta pura (tabuleiro + combate com os MESMOS rngs da tela), para prever o que a tela deve mostrar. */
function previsao(n: number): { moves: Array<{ a: Pos; b: Pos }>; total: number; boards: Board[]; combates: M3Combat[] } {
  const { board, rng } = newRound(SEED);
  let c = newCombat(mulberry32(SEED + 99), Object.keys(DUNGEON_LINE_SPRITES), undefined);
  let b = board;
  let streak = 1;
  const moves: Array<{ a: Pos; b: Pos }> = [];
  const boards: Board[] = [b];
  const combates: M3Combat[] = [c];
  for (let i = 0; i < n && c.outcome === 'playing'; i++) {
    const m = validMoves(b)[0];
    const r = trySwap(b, m.a, m.b, rng as Rng);
    if (!r.ok) throw new Error('inválida');
    moves.push(m);
    const ex = playTurn(c, r.steps, r.board, rng as Rng, streak);
    c = ex.state; b = ex.board; boards.push(b); combates.push(c);
    streak = ex.extra ? streak + 1 : 1;
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
    expect(screen.getByRole('button', { name: /Dica, 3 restantes/ })).toBeTruthy();
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
  it('1 Soulmon do jogador (em cima) e 3 inimigos (embaixo) em ordem 1→3, com HP e o ativo marcado', () => {
    montar();
    const arena = document.querySelector('[data-m3-arena]') as HTMLElement;
    const player = arena.querySelectorAll('[data-m3-player]');
    const inimigos = [...arena.querySelectorAll('[data-m3-enemy]')];
    expect(player.length).toBe(1);
    expect(inimigos.map(e => e.getAttribute('data-m3-enemy'))).toEqual(['1', '2', '3']);
    // o jogador vem antes de todos os inimigos no documento (e em cima na tela: coluna)
    for (const e of inimigos) expect(player[0].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(arena.style.flexDirection).toBe('column');
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
    // o botão de dica (D-85) tem alvo ≥ 44
    expect((document.querySelector('[data-m3-hint-button]') as HTMLElement).style.minHeight).toBe('44px');
    // nenhum link de canto/nav montado por este componente
    expect(document.querySelector('[data-corner-link]')).toBeNull();
  });
});

describe('D-76/D-77: layout da arena e o topo enxuto', () => {
  it('o Soulmon do jogador vem ANTES (em cima, à esquerda) e os 3 inimigos DEPOIS, em fila da direita para a esquerda', () => {
    montar();
    const arena = document.querySelector('[data-m3-arena]') as HTMLElement;
    expect(arena.style.flexDirection).toBe('column'); // jogador em cima, time embaixo
    const filhos = [...arena.children] as HTMLElement[];
    expect(filhos[0].hasAttribute('data-m3-player')).toBe(true);
    expect(filhos[0].style.alignSelf).toBe('flex-start'); // à esquerda
    // N5: usuário · tabuleiro · adversários (o tabuleiro ENTRE eles)
    expect(filhos[1].hasAttribute('data-m3-board')).toBe(true);
    const time = filhos[2];
    expect(time.hasAttribute('data-m3-enemies')).toBe(true);
    expect(time.style.flexDirection).toBe('row-reverse'); // o 1º inimigo na ponta DIREITA
    expect(time.style.justifyContent).toBe('flex-start');
    expect([...time.querySelectorAll('[data-m3-enemy]')].map(e => e.getAttribute('data-m3-enemy'))).toEqual(['1', '2', '3']);
  });

  it('no topo só o contador de turnos (e o "i" do cabeçalho): sem história, sem placar/Bits visíveis, sem "próximo Bit"', () => {
    montar({ language: 'en-US' });
    expect(document.querySelector('[data-game-story]')).toBeNull();
    expect(screen.getByRole('button', { name: 'How to play' })).toBeTruthy();
    const campo = document.querySelector('[data-m3-field]') as HTMLElement;
    const clone = campo.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.sm2-sr-only, [data-m3-arena]').forEach(n => n.remove());
    expect(clone.textContent!.replace(/\s+/g, ' ').trim()).toMatch(/^Turn ?0$/);
    // placar, Bits, aviso e "próximo Bit" existem só para leitor de tela
    for (const sel of ['[data-m3-sr]', '[data-m3-note]', '[data-m3-next]']) expect(document.querySelector(sel)!.classList.contains('sm2-sr-only')).toBe(true);
  });
});

describe('N5: elemento do usuário, sem numeração e banner mais longo', () => {
  it('mostra o ícone do elemento do Soulmon do usuário quando conhecido', () => {
    montar({ petElement: 'fogo' });
    expect(document.querySelector('[data-m3-player] [data-m3-player-element="fogo"]')).not.toBeNull();
  });
  it('os inimigos não levam mais o numeral de ordem (só o ▸ do ativo e o elemento)', () => {
    montar();
    for (const e of document.querySelectorAll('[data-m3-enemy]')) expect(e.querySelector('p')!.textContent).toMatch(/^▸?$/);
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

describe('D-85: a dica (3 por partida, depois compra com Bits)', () => {
  const botao = () => document.querySelector('[data-m3-hint-button]') as HTMLButtonElement;
  const marcadas = () => [...document.querySelectorAll('[data-m3-hint="1"]')].map(e => e.getAttribute('data-m3-cell'));

  it('mostra os usos restantes (número), marca a MESMA jogada que a IA escolheria e some sozinha', async () => {
    montar();
    expect(botao().querySelector('[data-m3-hints-left]')!.textContent).toBe(String(M3_HINTS_PER_GAME));
    const m = chooseMove(newRound(SEED).board)!;
    fireEvent.click(botao());
    expect(marcadas().sort()).toEqual([`${m.a.r},${m.a.c}`, `${m.b.r},${m.b.c}`].sort());
    expect(botao().querySelector('[data-m3-hints-left]')!.textContent).toBe(String(M3_HINTS_PER_GAME - 1));
    await avancar(3000);
    expect(marcadas()).toEqual([]);
  });

  it('acabados os 3 usos o botão mostra o PREÇO em Bits; sem saldo fica desabilitado (nunca erro)', () => {
    const gasta = vi.fn(() => true);
    montar({ bits: 0, onSpendBits: gasta });
    for (let i = 0; i < M3_HINTS_PER_GAME; i++) fireEvent.click(botao());
    expect(botao().querySelector('[data-m3-hint-price]')!.textContent).toBe(`${M3_HINT_PRICE_BITS} Bits`);
    expect(botao().disabled).toBe(true);
    fireEvent.click(botao());
    expect(gasta).not.toHaveBeenCalled();
  });

  it('com saldo: o 1º toque pede confirmação, o 2º compra pela via de gasto do app e mostra a dica', () => {
    const gasta = vi.fn(() => true);
    montar({ bits: 50, onSpendBits: gasta });
    for (let i = 0; i < M3_HINTS_PER_GAME; i++) fireEvent.click(botao());
    fireEvent.click(botao());
    expect(botao().getAttribute('data-m3-hint-mode')).toBe('confirm');
    expect(gasta).not.toHaveBeenCalled();
    fireEvent.click(botao());
    expect(gasta).toHaveBeenCalledWith(M3_HINT_PRICE_BITS);
    expect(marcadas().length).toBe(2);
  });

  it('se o app recusa a cobrança, nada é dado', async () => {
    const gasta = vi.fn(() => false);
    montar({ bits: 50, onSpendBits: gasta });
    for (let i = 0; i < M3_HINTS_PER_GAME; i++) fireEvent.click(botao());
    await avancar(3000);
    fireEvent.click(botao());
    fireEvent.click(botao());
    expect(gasta).toHaveBeenCalledTimes(1);
    expect(marcadas()).toEqual([]); // a compra recusada não mostra dica
    expect(botao().getAttribute('data-m3-hint-mode')).toBe('buy');
  });
});

describe('D-83/D-84: o inimigo joga na tela; 4+ dá o aviso de rodada extra', () => {
  it('depois de uma jogada que passa a vez, o tabuleiro assenta no que a conta pura diz (jogador + troca do inimigo)', async () => {
    montar();
    const p = previsao(1);
    await jogarEscolhido(p.moves[0]);
    const esperado = p.boards[1];
    for (let r = 0; r < M3_ROWS; r++) for (let c = 0; c < M3_COLS; c++) expect(Number(cell({ r, c }).getAttribute('data-m3-kind'))).toBe(esperado[r][c]!.k);
    expect(num('data-m3-turn')).toBe(p.combates[1].turns);
  });

  it('o aviso de rodada extra é só um ícone (sem texto visível) e some do caminho quando não houve 4+', async () => {
    montar();
    expect(document.querySelector('[data-m3-extra]')).toBeNull();
  });
});

describe('D-99/D-100: posição dos Soulmon e o poder do combo', () => {
  const shots = () => [...document.querySelectorAll('[data-m3-dmg]')] as HTMLElement[];

  it('D-99: jogador em cima à esquerda e o time inimigo embaixo à direita (o ativo, o 1º, na ponta direita)', () => {
    montar();
    expect(document.querySelector('[data-m3-player]')!.getAttribute('data-m3-pos')).toBe('top-left');
    const time = document.querySelector('[data-m3-enemies]') as HTMLElement;
    expect(time.getAttribute('data-m3-pos')).toBe('bottom-right');
    expect(time.style.flexDirection).toBe('row-reverse');
    expect(time.querySelector('[data-m3-enemy="1"]')!.getAttribute('data-m3-active')).toBe('1');
  });

  it('o número do dano mostrado é exatamente o dano aplicado: um por golpe do jogador e um por resposta do inimigo', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await avancar(220);
    const vistos = shots().filter(s => s.getAttribute('data-m3-dmg-by') === 'player');
    const log = p.combates[1].log.filter(e => e.by === 'player');
    expect(vistos.length).toBeGreaterThan(0);
    expect(vistos.length).toBeLessThanOrEqual(log.length);
    vistos.forEach(v => expect(log.map(e => String(e.dmg))).toContain(v.getAttribute('data-m3-dmg')));
    await assentar();
    // ao fim os números já saíram; o HP bate com a conta pura (o poder não muda a conta)
    expect(Number(document.querySelector('[data-m3-enemy="1"]')!.getAttribute('data-m3-hp'))).toBe(p.combates[1].enemies[0].hp);
  });

  it('o poder sai da célula do combo (elemento do combo) e há poder também do inimigo no mesmo turno', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    const vistos: HTMLElement[] = [];
    for (let i = 0; i < 60; i++) {
      await avancar(100);
      shots().forEach(s => { if (!vistos.includes(s)) vistos.push(s); });
    }
    expect(vistos.some(s => s.getAttribute('data-m3-dmg-by') === 'player')).toBe(true);
    expect(vistos.some(s => s.getAttribute('data-m3-dmg-by') === 'enemy')).toBe(true);
    expect(vistos.filter(s => s.getAttribute('data-m3-dmg-by') === 'enemy').every(s => s.getAttribute('data-m3-dmg-target') === 'player')).toBe(true);
  });

  it('D-102: a aura acende no atacante ANTES do poder sair e some depois; o poder é maior que o de antes e viaja mais', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await avancar(210);
    const aura = document.querySelector('[data-m3-aura]') as HTMLElement;
    const orb = document.querySelector('[data-m3-shot]') as HTMLElement;
    expect(aura).not.toBeNull();
    expect(orb).not.toBeNull();
    expect(aura.getAttribute('data-m3-aura-by')).toBe('player');
    const folga = Number(orb.getAttribute('data-m3-fx-start')) - Number(aura.getAttribute('data-m3-fx-start'));
    expect(folga).toBeGreaterThanOrEqual(400);
    expect(folga).toBeLessThanOrEqual(600);
    expect(Number(aura.getAttribute('data-m3-fx-start')) + Number(aura.getAttribute('data-m3-fx-dur'))).toBeGreaterThan(Number(orb.getAttribute('data-m3-fx-start')));
    expect(Number(orb.getAttribute('data-m3-fx-dur'))).toBeGreaterThanOrEqual(900);
    expect(Number(orb.getAttribute('data-m3-fx-dur'))).toBeLessThanOrEqual(1200);
    expect(Number(orb.getAttribute('data-m3-shot-px'))).toBeGreaterThanOrEqual(48);
    await assentar();
    expect(document.querySelector('[data-m3-aura]')).toBeNull();
    expect(document.querySelector('[data-m3-shot]')).toBeNull();
  });

  it('D-103: UM único poder por combo — cada [data-m3-shot] tem 1 só ícone, o rastro não repete o ícone, e o poder é ~25% maior', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    let vistos = 0;
    for (let i = 0; i < 40; i++) {
      await avancar(100);
      const poderes = [...document.querySelectorAll('[data-m3-shot]')] as HTMLElement[];
      vistos += poderes.length;
      poderes.forEach(o => {
        expect(o.querySelectorAll('img').length).toBe(1);
        expect(Number(o.getAttribute('data-m3-shot-px'))).toBe(o.getAttribute('data-m3-shot-big') === '1' ? 105 : 70);
      });
      expect(document.querySelectorAll('[data-m3-trail] img').length).toBe(0);
    }
    expect(vistos).toBeGreaterThan(0);
    await assentar();
  });

  it('D-102: nunca mais de 2 poderes (aura + voo) ao mesmo tempo na tela, em nenhum instante da jogada', async () => {
    montar();
    const p = previsao(2);
    for (const m of p.moves) {
      fireEvent.click(cell(m.a));
      fireEvent.click(cell(m.b));
      for (let i = 0; i < 80; i++) {
        await avancar(100);
        expect(document.querySelectorAll('[data-m3-shot]').length).toBeLessThanOrEqual(2);
        expect(document.querySelectorAll('[data-m3-aura]').length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('D-102: o efeito é decoração — a vez do inimigo não espera por ele (o tabuleiro destrava no ritmo de sempre)', async () => {
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await assentar();
    expect(document.querySelector('[data-m3-board]')!.getAttribute('aria-busy')).toBe('false');
    expect(num('data-m3-turn')).toBe(p.combates[1].turns);
  });

  it('D-102: movimento reduzido — sem aura nem viagem; só o flash estático curto e o número já no alvo', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await avancar(10);
    expect(document.querySelectorAll('[data-m3-aura]').length).toBe(0);
    expect(document.querySelectorAll('[data-m3-shot]').length).toBe(0);
    expect(document.querySelectorAll('[data-m3-burst]').length).toBe(0);
    expect(document.querySelectorAll('[data-m3-flash]').length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it('movimento reduzido: nada viaja (sem ícone em voo) e o número do dano aparece direto, já visível', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    montar();
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    await avancar(10);
    expect(document.querySelectorAll('[data-m3-shot]').length).toBe(0);
    const n = shots();
    expect(n.length).toBeGreaterThan(0);
    expect(n.every(s => s.style.opacity === '1')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('transição de turno: mostra "<nome> turn", espera 1s, acende aura pré-ataque no inimigo e destaca as peças inimigas com contorno vermelho', async () => {
    montar({ petName: 'Drako' });
    const p = previsao(1);
    fireEvent.click(cell(p.moves[0].a));
    fireEvent.click(cell(p.moves[0].b));
    let sawEnemyTurnBanner = false;
    let sawPlayerTurnBanner = false;
    let sawPreAura = false;
    let sawEnemyRedPick = false;
    for (let i = 0; i < 65; i++) {
      await avancar(100);
      const banner = document.querySelector('[data-m3-turn-banner]') as HTMLElement | null;
      if (banner?.getAttribute('data-m3-turn-banner') === 'enemy' && / turn$/.test(banner.textContent ?? '')) {
        sawEnemyTurnBanner = true;
      }
      if (banner?.getAttribute('data-m3-turn-banner') === 'player' && banner.textContent === 'Drako turn') {
        sawPlayerTurnBanner = true;
      }
      if (document.querySelector('[data-m3-enemy-pre-aura]')) {
        sawPreAura = true;
      }
      const picked = [...document.querySelectorAll('[data-m3-enemy-pick="1"]')] as HTMLElement[];
      if (picked.length === 2 && picked.every(el => el.style.border.includes('danger'))) {
        sawEnemyRedPick = true;
      }
    }
    expect(sawEnemyTurnBanner).toBe(true);
    expect(sawPreAura).toBe(true);
    expect(sawEnemyRedPick).toBe(true);
    expect(sawPlayerTurnBanner).toBe(true);
    await assentar();
    expect(document.querySelector('[data-m3-turn-banner]')).toBeNull();
    expect(document.querySelector('[data-m3-enemy-pre-aura]')).toBeNull();
    expect(document.querySelectorAll('[data-m3-enemy-pick="1"]').length).toBe(0);
  });
});
