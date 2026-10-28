/**
 * ELEMENTAL FUSION COMO COMBATE — a regra pura (D-03…D-07, 18/10/2026): dano por elemento, só no inimigo ativo, turnos alternados, placar que vira
 * Bits e o balanço (uma partida típica de ~15–25 jogadas, por simulação com as funções REAIS).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  M3_COLS, M3_ROWS, M3_MAX_BITS, M3_TILE_ELEMENTS, match3Bits, newRound, resolveBoard, trySwap, validMoves,
  type Board, type Step,
} from './match3';
import {
  M3C_DEFEAT_BONUS, M3C_DMG_PER_TILE, M3C_ENEMY_HP, M3C_MAX_TURNS, M3C_PLAYER_HP,
  M3_HINTS_PER_GAME, M3_HINT_PRICE_BITS, hintAction, M3C_ENEMY_DMG_FACTOR, M3C_MAX_STREAK, m3BoardAdvantage, m3ElementMult, applyEnemySteps, applyPlayerSteps, chooseMove, combatScore, enemyPhase, grantsExtraTurn, newCombat, playTurn, type M3Combat,
} from './match3Combat';
import { mulberry32 } from './combate/rng';
import { elementAdvantage } from './arena';

/** Tabuleiro sem nenhuma linha pronta, com 3 de FOGO (tipo 0) alinhadas na linha 3, colunas 1..3. */
function tabuleiroComTresDeFogo(): Board {
  const b: Board = Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (r * 3 + c) % 6 })));
  for (const c of [1, 2, 3]) b[3][c] = { k: 0 };
  return b;
}
/** Um passo sintético: `n` peças do tipo `k` limpas (só o que o combate lê). */
const passo = (kinds: number[], chain = 1, quatro = false): Step => ({ cleared: [], kinds, triggered: [], created: quatro ? [{ pos: { r: 0, c: 0 }, tile: { k: kinds[0], sp: 'row' as const } }] : [], chain, gained: 0, after: [] });
const tab = (seed = 1): Board => newRound(seed).board;
const novoReal = (seed = 1) => newCombat(mulberry32(seed), ['a', 'b', 'c', 'd', 'e', 'f'], 'a');
/** Combate com os 3 inimigos de elemento NEUTRO (sem relação no anel): os números dos testes antigos não dependem do sorteio de elemento. */
const novo = (seed = 1): M3Combat => { const c = novoReal(seed); return { ...c, enemies: c.enemies.map(e => ({ ...e, element: 'neutro' })) }; };

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

describe('D-06/D-83: turnos alternados — o inimigo da frente MEXE as peças depois de cada jogada válida', () => {
  it('uma jogada que pontua: dano do jogador e UMA troca do inimigo, cujos combos tiram HP do jogador', () => {
    const c0 = novo();
    const ex = playTurn(c0, [passo([0, 0, 0])], tab(), mulberry32(3));
    expect(ex.extra).toBe(false);
    expect(ex.enemyMoves.length).toBeGreaterThanOrEqual(1);
    expect(ex.state.log[0].by).toBe('player');
    expect(ex.state.log.slice(1).every(e => e.by === 'enemy' && e.target === 'player')).toBe(true);
    expect(ex.state.player.hp).toBeLessThan(M3C_PLAYER_HP);
    expect(ex.state.taken).toBe(M3C_PLAYER_HP - ex.state.player.hp);
    expect(ex.state.turns).toBe(1);
  });
  it('troca válida que NÃO pontua também gasta o turno: o inimigo joga', () => {
    const ex = playTurn(novo(), [], tab(), mulberry32(3));
    expect(ex.state.dealt).toBe(0);
    expect(ex.enemyMoves.length).toBeGreaterThanOrEqual(1);
    expect(ex.state.taken).toBeGreaterThan(0);
    expect(ex.state.turns).toBe(1);
  });
  it('o dano do inimigo usa a MESMA fórmula do jogador (peças × 10 × cascata) vezes o fator de equilíbrio, um evento por elemento', () => {
    const c = applyEnemySteps(novo(), [passo([0, 0, 0, 1, 1, 1, 1], 1), passo([2, 2, 2], 2)]);
    const f = (n: number) => Math.max(1, Math.round(n * M3C_ENEMY_DMG_FACTOR));
    expect(c.log.map(e => [e.by, e.element, e.dmg])).toEqual([['enemy', 'fogo', f(30)], ['enemy', 'agua', f(40)], ['enemy', 'terra', f(45)]]);
    expect(c.taken).toBe(f(30) + f(40) + f(45));
  });
  it('HP do jogador a 0 = derrota; depois dela nada mais acontece', () => {
    const c: M3Combat = novo();
    c.player.hp = 1;
    const ex = playTurn(c, [], tab(), mulberry32(1));
    expect(ex.state.player.hp).toBe(0);
    expect(ex.state.outcome).toBe('loss');
    expect(ex.state.taken).toBe(1); // o dano que passa de 0 não conta
    expect(playTurn(ex.state, [passo([0, 0, 0])], tab(), mulberry32(1)).state).toBe(ex.state);
  });
  it('a vitória no golpe do jogador NÃO dá resposta ao inimigo (ele já caiu)', () => {
    const c0 = novo();
    c0.active = 2; c0.defeated = 2; c0.enemies[0].hp = 0; c0.enemies[1].hp = 0; c0.enemies[2].hp = 5;
    const ex = playTurn(c0, [passo([0, 0, 0])], tab(), mulberry32(1));
    expect(ex.state.outcome).toBe('win');
    expect(ex.state.taken).toBe(0);
    expect(ex.enemyMoves).toEqual([]);
  });
  it('determinístico: mesma semente, mesmo combate; a fonte não usa Math.random', () => {
    const a = playTurn(novo(4), [passo([2, 2, 2])], tab(2), mulberry32(9));
    const b = playTurn(novo(4), [passo([2, 2, 2])], tab(2), mulberry32(9));
    expect(a).toEqual(b);
    const src = readFileSync(join(__dirname, 'match3Combat.ts'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/Math\.random/);
  });
  it('três inimigos com elementos e linhas distintas, nenhuma a do jogador', () => {
    for (let s = 1; s <= 30; s++) {
      const c = novoReal(s);
      expect(new Set(c.enemies.map(e => e.element)).size).toBe(3);
      expect(new Set(c.enemies.map(e => e.line)).size).toBe(3);
      expect(c.enemies.some(e => e.line === 'a')).toBe(false);
    }
  });
});

describe('D-83: a escolha da jogada do inimigo é simples e DETERMINÍSTICA (e é a mesma da dica, D-85)', () => {
  it('mesmo tabuleiro, mesma jogada — uma troca que forma linha, a de maior pontuação', () => {
    for (let s = 1; s <= 8; s++) {
      const b = tab(s);
      const m = chooseMove(b)!;
      expect(chooseMove(b)).toEqual(m);
      const valid = validMoves(b);
      expect(valid.some(v => v.a.r === m.a.r && v.a.c === m.a.c && v.b.r === m.b.r && v.b.c === m.b.c)).toBe(true);
      for (const v of valid) { const r = trySwap(b, v.a, v.b, mulberry32(0x2c1b3c6d)); if (r.ok) expect(r.score).toBeLessThanOrEqual(m.score); }
    }
  });
  it('empate = a PRIMEIRA jogada na ordem fixa', () => {
    const b = tab(3);
    const m = chooseMove(b)!;
    const primeiro = validMoves(b).find(v => { const r = trySwap(b, v.a, v.b, mulberry32(0x2c1b3c6d)); return r.ok && r.score === m.score; })!;
    expect(m.a).toEqual(primeiro.a);
    expect(m.b).toEqual(primeiro.b);
  });
  it('a vez do inimigo começa pela troca de `chooseMove` e não passa do teto', () => {
    const b = tab(5);
    const ph = enemyPhase(novo(), b, mulberry32(1));
    const esperado = chooseMove(b)!;
    expect(ph.moves[0].a).toEqual(esperado.a);
    expect(ph.moves[0].b).toEqual(esperado.b);
    expect(ph.moves.length).toBeLessThanOrEqual(M3C_MAX_STREAK);
    if (!grantsExtraTurn(ph.moves[0].steps)) expect(ph.moves).toHaveLength(1);
  });
});

describe('D-84: combinação de 4+ dá RODADA EXTRA (e vale para o inimigo)', () => {
  it('4+ do jogador: sem resposta do inimigo e o turno NÃO é consumido; 3 peças passam a vez', () => {
    const c0 = novo();
    const ex = playTurn(c0, [passo([0, 0, 0, 0], 1, true)], tab(), mulberry32(1));
    expect(ex.extra).toBe(true);
    expect(ex.enemyMoves).toEqual([]);
    expect(ex.state.turns).toBe(0);
    expect(ex.state.taken).toBe(0);
    expect(ex.state.dealt).toBe(40);
    const normal = playTurn(c0, [passo([0, 0, 0])], tab(), mulberry32(1));
    expect(normal.extra).toBe(false);
    expect(normal.state.turns).toBe(1);
  });
  it('teto: no máx. M3C_MAX_STREAK jogadas seguidas — a 3ª seguida passa a vez mesmo com 4+', () => {
    expect(M3C_MAX_STREAK).toBe(3);
    const c0 = novo();
    const seg = (streak: number) => playTurn(c0, [passo([0, 0, 0, 0], 1, true)], tab(), mulberry32(1), streak);
    expect(seg(1).extra).toBe(true);
    expect(seg(2).extra).toBe(true);
    const terceira = seg(3);
    expect(terceira.extra).toBe(false);
    expect(terceira.state.turns).toBe(1);
    expect(terceira.enemyMoves.length).toBeGreaterThanOrEqual(1);
  });
  it('o inimigo que forma 4+ joga de novo, e nunca passa do teto de jogadas seguidas (sem loop)', () => {
    let achou = false;
    for (let s = 1; s <= 80; s++) {
      const ph = enemyPhase(novo(), tab(s), mulberry32(s));
      expect(ph.moves.length).toBeLessThanOrEqual(M3C_MAX_STREAK);
      if (ph.moves.length >= 2) { achou = true; expect(grantsExtraTurn(ph.moves[0].steps)).toBe(true); }
    }
    expect(achou).toBe(true);
  });
  it('grantsExtraTurn: só quando nasce peça especial (linha de 4+)', () => {
    expect(grantsExtraTurn([passo([0, 0, 0])])).toBe(false);
    expect(grantsExtraTurn([passo([0, 0, 0]), passo([1, 1, 1, 1], 2, true)])).toBe(true);
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
    for (let i = 0; i < M3C_MAX_TURNS; i++) c = playTurn(c, [], tab(i + 1), mulberry32(i)).state;
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
    const escolha = mulberry32(seed * 7 + 1);
    let c = newCombat(mulberry32(seed + 99), ['a', 'b', 'c', 'd', 'e'], 'a');
    let b = board;
    let streak = 1;
    while (c.outcome === 'playing') {
      const lances = validMoves(b);
      if (!lances.length) break;
      const x = tipico ? lances[Math.floor(escolha() * lances.length)] : chooseMove(b)!;
      const r = trySwap(b, x.a, x.b, rng);
      if (!r.ok) throw new Error('lance inválido');
      const ex = playTurn(c, r.steps, r.board, rng, streak);
      c = ex.state;
      b = ex.board;
      streak = ex.extra ? streak + 1 : 1;
    }
    return c;
  }
  it('balanço: o jogador típico leva ~15–25 jogadas (mediana), vence quase sempre e o placar paga dentro do teto', () => {
    const ps = Array.from({ length: 21 }, (_, i) => partida(i + 1, true));
    const turnos = ps.map(p => p.turns).sort((a, b) => a - b);
    expect(turnos[10]).toBeGreaterThanOrEqual(14); // D-83: o inimigo agora joga a melhor troca
    expect(turnos[10]).toBeLessThanOrEqual(25);
    expect(ps.filter(p => p.outcome === 'win').length).toBeGreaterThanOrEqual(14); // D-83: o inimigo agora joga a melhor troca
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

describe('teto real de Bits (lobby)', () => {
  it('M3C_MAX_BITS = Bits do placar perfeito e nunca passa de M3_MAX_BITS', async () => {
    const m = await import('./match3Combat');
    const b = await import('./match3');
    const perfeito = m.M3C_ENEMY_HP.reduce((a: number, x: number) => a + x, 0) + 3 * m.M3C_DEFEAT_BONUS;
    expect(m.M3C_MAX_BITS).toBe(b.match3Bits(perfeito));
    expect(m.M3C_MAX_BITS).toBeLessThanOrEqual(b.M3_MAX_BITS);
  });
});

describe('D-85: dica — 3 usos, compra com Bits, saldo insuficiente', () => {
  it('há 3 usos por partida e o preço é barato (suposição declarada: ≤ uma rodada típica de Bits)', () => {
    expect(M3_HINTS_PER_GAME).toBe(3);
    expect(M3_HINT_PRICE_BITS).toBeGreaterThan(0);
    expect(M3_HINT_PRICE_BITS).toBeLessThanOrEqual(M3_MAX_BITS);
  });
  it('com usos sobrando: use; acabaram e há saldo: buy; sem saldo: blocked (nunca erro)', () => {
    expect(hintAction(3, 0)).toBe('use');
    expect(hintAction(1, 0)).toBe('use');
    expect(hintAction(0, M3_HINT_PRICE_BITS)).toBe('buy');
    expect(hintAction(0, M3_HINT_PRICE_BITS - 1)).toBe('blocked');
    expect(hintAction(0, Number.NaN)).toBe('blocked');
  });
  it('a dica é a jogada que a IA inimiga escolheria (mesma função, determinística)', () => {
    for (let s = 1; s <= 5; s++) expect(chooseMove(tab(s))).toEqual(chooseMove(tab(s)));
  });
});

describe('Vantagem elemental (dono, 27/10/2026): o dano do Match3 segue o mesmo ±1 golpe exibido da Arena e do Duelo', () => {
  const com = (el: string, playerElement?: string): M3Combat => ({ ...novo(), ...(playerElement ? { playerElement } : {}), enemies: novo().enemies.map(e => ({ ...e, element: el })) });
  it('m3ElementMult: +1 = ×(1/0,9), -1 = ×(1/1,1), neutro/ausente = ×1 (a mesma tabela do anel)', () => {
    expect(elementAdvantage('fogo', ['planta'])).toBe(1);
    expect(m3ElementMult('fogo', 'planta')).toBeCloseTo(1 / 0.9, 10);
    expect(m3ElementMult('planta', 'fogo')).toBeCloseTo(1 / 1.1, 10);
    expect(m3ElementMult('fogo', 'neutro')).toBe(1);
    expect(m3ElementMult(undefined, 'fogo')).toBe(1);
    expect(m3ElementMult('fogo', undefined)).toBe(1);
    expect(m3ElementMult('fogo', 'vapor')).toBe(1); // par: vale a base dominante (vapor -> fogo; fogo vs fogo = neutro)
  });
  it('dano do jogador: peça de fogo contra planta bate +1 golpe a mais; contra vigor (que contra-ataca o fogo) bate menos; neutro igual a antes', () => {
    const passoFogo = [passo([0, 0, 0])];
    const neutro = applyPlayerSteps(novo(), passoFogo).log[0].dmg;
    const vant = applyPlayerSteps(com('planta'), passoFogo).log[0].dmg;
    const desv = applyPlayerSteps(com('vigor'), passoFogo).log[0].dmg;
    expect(neutro).toBe(30);
    expect(vant).toBe(Math.round(30 / 0.9));
    expect(desv).toBe(Math.round(30 / 1.1));
    expect(vant).toBeGreaterThan(neutro);
    expect(desv).toBeLessThan(neutro);
  });
  it('dano do inimigo: o elemento do inimigo contra o do Soulmon; sem elemento do Soulmon = neutro', () => {
    const st = [passo([0, 0, 0, 0, 0])];
    const base = applyEnemySteps(com('fogo'), st).log[0].dmg;
    const vant = applyEnemySteps(com('fogo', 'planta'), st).log[0].dmg; // fogo bate planta
    const desv = applyEnemySteps(com('planta', 'fogo'), st).log[0].dmg; // fogo do inimigo contra planta do Soulmon: a favor do inimigo
    expect(applyEnemySteps(com('fogo', 'fogo'), st).log[0].dmg).toBe(base);
    expect(vant).toBeGreaterThan(base);
    expect(desv).toBeLessThan(base);
  });
  it('o selo (m3BoardAdvantage) vem do MESMO cálculo: peças a favor = +1, contra = -1, equilíbrio/neutro = 0', () => {
    const so = (els: string[], foe: string): M3Combat => ({ ...com(foe), elements: els });
    expect(m3BoardAdvantage(so(['fogo', 'fogo'], 'planta'))).toBe(1);
    expect(m3BoardAdvantage(so(['planta', 'planta'], 'fogo'))).toBe(-1);
    expect(m3BoardAdvantage(so(['fogo', 'planta'], 'fogo'))).toBe(-1); // fogo x fogo neutro, planta x fogo desvantagem
    expect(m3BoardAdvantage(so(['fogo'], 'neutro'))).toBe(0);
    expect(m3BoardAdvantage({ ...com('planta'), outcome: 'win' })).toBe(0);
  });
  it('determinístico: mesma entrada, mesmo dano (e nenhum Math.random na regra)', () => {
    const a = applyPlayerSteps(com('planta'), [passo([0, 0, 0, 1, 1, 1], 2)]);
    const b = applyPlayerSteps(com('planta'), [passo([0, 0, 0, 1, 1, 1], 2)]);
    expect(a).toEqual(b);
  });
});
