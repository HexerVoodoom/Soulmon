/**
 * BALANÇO DO PVP (REGISTRO §473): jogador aleatório (lance válido ao acaso), duelo de HP igual contra 1 inimigo que joga a melhor troca.
 * Medido (N=80, sementes 1..80, determinístico): Aventura 27,5%; PVP fator 0,2 = 96,3%; 0,5 = 51,2%; 0,8 = 22,5%; 1,0 = 13,8%.
 * Com 0,8 a folga sobre a Aventura era 5 pontos (ruído de N=40: 7/40 = 7/40, empate); com 1,0 são ~14. O dono recalibra com jogadores reais.
 */
import { describe, expect, it, vi } from 'vitest';
import { M3_TILE_ELEMENTS, newRound, trySwap, validMoves } from './match3';
import { chooseMove, newCombat, newPvpCombat, playTurn, M3C_PVP_ENEMY_DMG_FACTOR, type M3Combat } from './match3Combat';
import { mulberry32 } from './combate/rng';

vi.setConfig({ testTimeout: 300_000 });

function partida(seed: number, mk: () => M3Combat): M3Combat {
  const { board, rng } = newRound(seed);
  const escolha = mulberry32(seed * 7 + 1);
  let c = mk(); let b = board; let streak = 1;
  while (c.outcome === 'playing') {
    const lances = validMoves(b);
    if (!lances.length) break;
    const x = lances[Math.floor(escolha() * lances.length)] ?? chooseMove(b)!;
    const r = trySwap(b, x.a, x.b, rng);
    if (!r.ok) throw new Error('lance inválido');
    const ex = playTurn(c, r.steps, r.board, rng, streak);
    c = ex.state; b = ex.board; streak = ex.extra ? streak + 1 : 1;
  }
  return c;
}
const taxa = (n: number, mk: (i: number) => M3Combat) => Array.from({ length: n }, (_, i) => partida(i + 1, () => mk(i))).filter(p => p.outcome === 'win').length / n;

describe('balanço PVP x Aventura', () => {
  it('com a mesma política e semente, o PVP vence menos que a Aventura', () => {
    const N = 80;
    const adv = taxa(N, i => newCombat(mulberry32(i + 99), ['a', 'b', 'c', 'd', 'e'], 'a', undefined, undefined, { elements: [...M3_TILE_ELEMENTS] }));
    const pvp = taxa(N, i => newPvpCombat(mulberry32(i + 99), [...M3_TILE_ELEMENTS]));
    expect(M3C_PVP_ENEMY_DMG_FACTOR).toBe(1);
    expect(pvp).toBeLessThan(adv - 0.1);
  });
});
