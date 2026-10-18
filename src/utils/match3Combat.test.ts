/**
 * COMBINA 3 COMO COMBATE — a regra pura (D-03…D-07, 18/10/2026): dano por elemento, só no inimigo ativo, turnos alternados, placar que vira
 * Bits e o balanço (uma partida típica de ~15–25 jogadas, por simulação com as funções REAIS).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  M3_COLS, M3_ROWS, M3_MAX_BITS, M3_TILE_ELEMENTS, bestMove, match3Bits, newRound, resolveBoard, trySwap, validMoves,
  type Board, type Step,
} from './match3';
import {
  M3C_DEFEAT_BONUS, M3C_DMG_PER_TILE, M3C_ENEMY_HP, M3C_MAX_TURNS, M3C_PLAYER_HP,
  applyPlayerSteps, combatScore, enemyTurn, newCombat, playTurn, type M3Combat,
} from './match3Combat';
import { mulberry32 } from './combate/rng';

/** Tabuleiro sem nenhuma linha pronta, com 3 de FOGO (tipo 0) alinhadas na linha 3, colunas 1..3. */
function tabuleiroComTresDeFogo(): Board {
  const b: Board = Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (r * 3 + c) % 6 })));
  for (const c of [1, 2, 3]) b[3][c] = { k: 0 };
  return b;
}
/** Um passo sintético: `n` peças do tipo `k` limpas (só o que o combate lê). */
const passo = (kinds: number[], chain = 1): Step => ({ cleared: [], kinds, triggered: [], created: [], chain, gained: 0, after: [] });
const novo = (seed = 1) => newCombat(mulberry32(seed), ['a', 'b', 'c', 'd', 'e', 'f'], 'a');

describe('D-03: combinar peças causa dano do ELEMENTO ao inimigo ativo', () => {
  it('3 de fogo alinhadas: ao combinar o inimigo ativo perde HP e o evento registra elemento=fogo', () => {
    const res = resolveBoard(tabuleiroComTresDeFogo(), mulberry32(5));
    expect(res.steps[0].kinds).toEqual([0, 0, 0]); // o passo diz o tipo de cada peça limpa
    const c0 = novo();
    const c1 = applyPlayerSteps(c0, res.steps.slice(0, 1));
    expect(c1.enemies[0].hp).toBe(c0.enemies[0].hp - 3 * M3C_DMG_PER_TILE);
    expect(c1.log).toHaveLength(1);
    expect(c1.log[0]).toMatchObject({ by: 'player', element: 'fogo', dmg: 30, target: 0 });
    expect(M3_TILE_ELEMENTS[0]).toBe('fogo');
    expect(c0.enemies[0].hp).toBe(M3C_ENEMY_HP[0]); // o estado anterior não foi mexido
  });
  it('um evento por elemento no mesmo passo, e a cascata (×1,5) bate mais forte', () => {
    const c = applyPlayerSteps(novo(), [passo([0, 0, 0, 1, 1, 1, 1], 1), passo([2, 2, 2], 2)]);
    expect(c.log.map(e => [e.element, e.dmg])).toEqual([['fogo', 30], ['agua', 40], ['terra', 45]]);
  });
  it('troca sem linha: nenhum passo, nenhum dano do jogador', () => {
    const c = applyPlayerSteps(novo(), []);
    expect(c.dealt).toBe(0);
    expect(c.log).toEqual([]);
  });
});

describe('D-05: o dano só atinge o inimigo ATIVO; a sobra é descartada; o time cai junto', () => {
  it('a sobra de um golpe que zera o HP se perde: o próximo inimigo assume intacto', () => {
    const c0 = novo();
    c0.enemies[0].hp = 10;
    const c = applyPlayerSteps(c0, [passo([0, 0, 0, 0, 0])]); // 50 contra 10 de HP
    expect(c.dealt).toBe(10);
    expect(c.enemies[0].hp).toBe(0);
    expect(c.enemies[1].hp).toBe(M3C_ENEMY_HP[1]);
    expect(c.active).toBe(1);
    expect(c.defeated).toBe(1);
    expect(c.log[0].dmg).toBe(10);
    expect(c.outcome).toBe('playing');
  });
  it('só o ativo leva dano (os outros dois ficam cheios)', () => {
    const c = applyPlayerSteps(novo(), [passo([3, 3, 3]), passo([4, 4, 4])]);
    expect(c.enemies[0].hp).toBe(M3C_ENEMY_HP[0] - 60);
    expect(c.enemies[1].hp).toBe(M3C_ENEMY_HP[1]);
    expect(c.enemies[2].hp).toBe(M3C_ENEMY_HP[2]);
    expect(c.log.every(e => e.target === 0)).toBe(true);
  });
  it('vitória = os 3 derrotados, e depois dela nada mais é aplicado', () => {
    const total = M3C_ENEMY_HP.reduce((a, b) => a + b, 0);
    const c = applyPlayerSteps(novo(), [passo(Array(Math.ceil(total / M3C_DMG_PER_TILE) + 20).fill(0))]);
    // um golpe só derruba um inimigo (sobra descartada): precisa de 3 eventos
    expect(c.defeated).toBe(1);
    const c3 = applyPlayerSteps(c, [passo(Array(60).fill(0)), passo(Array(60).fill(0))]);
    expect(c3.defeated).toBe(3);
    expect(c3.outcome).toBe('win');
    const apos = applyPlayerSteps(c3, [passo([1, 1, 1])]);
    expect(apos).toEqual(c3);
    expect(apos.dealt).toBe(total);
  });
});

describe('D-06: turnos alternados — o inimigo ativo age depois de cada jogada válida', () => {
  it('uma jogada que pontua: dano do jogador e UMA ação do inimigo ativo no HP do jogador', () => {
    const c = playTurn(novo(), [passo([0, 0, 0])], mulberry32(3));
    expect(c.log.map(e => e.by)).toEqual(['player', 'enemy']);
    expect(c.player.hp).toBeLessThan(M3C_PLAYER_HP);
    expect(c.taken).toBe(M3C_PLAYER_HP - c.player.hp);
    expect(c.turns).toBe(1);
    expect(c.log[1].target).toBe('player');
  });
  it('troca válida que NÃO pontua também gasta o turno: o inimigo age', () => {
    const c = playTurn(novo(), [], mulberry32(3));
    expect(c.dealt).toBe(0);
    expect(c.log.map(e => e.by)).toEqual(['enemy']);
    expect(c.taken).toBeGreaterThan(0);
  });
  it('HP do jogador a 0 = derrota; depois dela nada mais acontece', () => {
    let c: M3Combat = novo();
    c.player.hp = 5;
    c = playTurn(c, [], mulberry32(1));
    expect(c.player.hp).toBe(0);
    expect(c.outcome).toBe('loss');
    expect(c.taken).toBe(5); // o dano que passa de 0 não conta
    expect(playTurn(c, [passo([0, 0, 0])], mulberry32(1))).toBe(c);
    expect(enemyTurn(c, mulberry32(1))).toBe(c);
  });
  it('a vitória no golpe do jogador NÃO dá resposta ao inimigo (ele já caiu)', () => {
    const c0 = novo();
    c0.active = 2; c0.defeated = 2; c0.enemies[0].hp = 0; c0.enemies[1].hp = 0; c0.enemies[2].hp = 5;
    const c = playTurn(c0, [passo([0, 0, 0])], mulberry32(1));
    expect(c.outcome).toBe('win');
    expect(c.taken).toBe(0);
  });
  it('o inimigo que age é o ATIVO (o elemento do evento é o dele)', () => {
    const c0 = novo();
    c0.active = 1;
    const c = enemyTurn(c0, mulberry32(2));
    expect(c.log[0].element).toBe(c0.enemies[1].element);
  });
  it('determinístico por rng de parâmetro: mesma semente, mesmo combate; e a fonte não usa Math.random', () => {
    const a = playTurn(novo(4), [passo([2, 2, 2])], mulberry32(9));
    const b = playTurn(novo(4), [passo([2, 2, 2])], mulberry32(9));
    expect(a).toEqual(b);
    const src = readFileSync(join(__dirname, 'match3Combat.ts'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/Math\.random/);
  });
  it('três inimigos com elementos e linhas distintas, nenhuma a do jogador', () => {
    for (let s = 1; s <= 30; s++) {
      const c = novo(s);
      expect(new Set(c.enemies.map(e => e.element)).size).toBe(3);
      expect(new Set(c.enemies.map(e => e.line)).size).toBe(3);
      expect(c.enemies.some(e => e.line === 'a')).toBe(false);
    }
  });
});

describe('D-07: placar, fim e recompensa derivam do combate', () => {
  it('placar = dano causado − dano recebido + bônus por inimigo derrotado, nunca abaixo de 0', () => {
    const c = novo();
    expect(combatScore(c)).toBe(0);
    expect(combatScore({ ...c, dealt: 100, taken: 30, defeated: 1 })).toBe(100 - 30 + M3C_DEFEAT_BONUS);
    expect(combatScore({ ...c, dealt: 10, taken: 200, defeated: 0 })).toBe(0);
  });
  it('o teto de segurança acaba a rodada como derrota (sem custo) no turno 60', () => {
    let c: M3Combat = novo();
    c.player.hp = 1e9; c.player.max = 1e9;
    for (let i = 0; i < M3C_MAX_TURNS; i++) c = playTurn(c, [], mulberry32(i));
    expect(c.turns).toBe(M3C_MAX_TURNS);
    expect(c.outcome).toBe('loss');
  });
  it('os Bits saem SÓ do placar e respeitam o teto M3_MAX_BITS', () => {
    const maximo = M3C_ENEMY_HP.reduce((a, b) => a + b, 0) + 3 * M3C_DEFEAT_BONUS; // o placar de uma partida perfeita
    expect(match3Bits(maximo)).toBeLessThanOrEqual(M3_MAX_BITS);
    expect(match3Bits(1e9)).toBe(M3_MAX_BITS);
  });

  /** Joga uma partida inteira com as funções REAIS. `tipico` = um lance válido qualquer; senão a melhor troca. */
  function partida(seed: number, tipico: boolean) {
    const { board, rng } = newRound(seed);
    const er = mulberry32(seed ^ 0x5eed);
    const escolha = mulberry32(seed * 7 + 1);
    let c = newCombat(mulberry32(seed + 99), ['a', 'b', 'c', 'd', 'e'], 'a');
    let b = board;
    while (c.outcome === 'playing') {
      const lances = validMoves(b);
      if (!lances.length) break;
      const x = tipico ? lances[Math.floor(escolha() * lances.length)] : bestMove(b, escolha)!;
      const r = trySwap(b, x.a, x.b, rng);
      if (!r.ok) throw new Error('lance inválido');
      c = playTurn(c, r.steps, er);
      b = r.board;
    }
    return c;
  }
  it('balanço: o jogador típico leva ~15–25 jogadas (mediana), vence quase sempre e o placar paga dentro do teto', () => {
    const ps = Array.from({ length: 21 }, (_, i) => partida(i + 1, true));
    const turnos = ps.map(p => p.turns).sort((a, b) => a - b);
    expect(turnos[10]).toBeGreaterThanOrEqual(15);
    expect(turnos[10]).toBeLessThanOrEqual(25);
    expect(ps.filter(p => p.outcome === 'win').length).toBeGreaterThanOrEqual(15);
    expect(ps.every(p => p.outcome !== 'playing' && p.turns < M3C_MAX_TURNS)).toBe(true);
    for (const p of ps) { expect(combatScore(p)).toBeGreaterThanOrEqual(0); expect(match3Bits(combatScore(p))).toBeLessThanOrEqual(M3_MAX_BITS); }
  });
  it('balanço: quem joga a melhor troca termina mais rápido que o típico', () => {
    const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
    const tip = med(Array.from({ length: 11 }, (_, i) => partida(i + 1, true).turns));
    const exp = med(Array.from({ length: 11 }, (_, i) => partida(i + 1, false).turns));
    expect(exp).toBeLessThan(tip);
    expect(exp).toBeGreaterThanOrEqual(8);
  });
});
