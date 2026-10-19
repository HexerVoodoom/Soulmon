import { describe, it, expect } from 'vitest';
import { comboOrigin, powerShots } from './match3Powers';
import { newRound, trySwap, validMoves, M3_TILE_ELEMENTS, type Step } from './match3';
import { applyPlayerSteps, applyEnemySteps, newCombat } from './match3Combat';
import { mulberry32 } from './combate/rng';

const step = (cleared: Array<[number, number]>, kinds: number[]): Step => ({
  cleared: cleared.map(([r, c]) => ({ r, c })), kinds, triggered: [], created: [], chain: 1, gained: 0, after: [],
});

describe('comboOrigin: de onde sai o poder', () => {
  it('prefere a célula da troca que entrou no combo', () => {
    const st = step([[2, 1], [2, 2], [2, 3]], [0, 0, 0]);
    expect(comboOrigin(st, 0, [{ r: 2, c: 3 }, { r: 3, c: 3 }])).toEqual({ r: 2, c: 3 });
  });
  it('sem troca no combo (cascata) usa a célula do meio das peças do tipo', () => {
    const st = step([[2, 1], [2, 2], [2, 3]], [1, 1, 1]);
    expect(comboOrigin(st, 1, [])).toEqual({ r: 2, c: 2 });
  });
  it('separa os tipos e devolve null para tipo que não foi limpo', () => {
    const st = step([[0, 0], [0, 1], [0, 2], [5, 5], [5, 6], [5, 4]], [0, 0, 0, 3, 3, 3]);
    expect(comboOrigin(st, 3, [{ r: 0, c: 0 }])).toEqual({ r: 5, c: 5 });
    expect(comboOrigin(st, 2)).toBeNull();
  });
});

describe('powerShots: dano mostrado = dano aplicado', () => {
  it('cada evento do jogador vira um poder na célula de um combo do seu elemento, com o dano do log', () => {
    const { board, rng } = newRound(7);
    const m = validMoves(board)[0];
    const r = trySwap(board, m.a, m.b, rng);
    if (!r.ok) throw new Error('inválida');
    let c = newCombat(mulberry32(1), []);
    for (const st of r.steps) {
      const next = applyPlayerSteps(c, [st]);
      const novos = next.log.slice(c.log.length);
      const shots = powerShots(st, novos, st.chain === 1 ? [m.a, m.b] : []);
      expect(shots.length).toBe(novos.length);
      shots.forEach((s, i) => {
        expect(s.dmg).toBe(novos[i].dmg);
        expect(s.by).toBe('player');
        expect(s.target).toBe(novos[i].target);
        const k = M3_TILE_ELEMENTS.indexOf(s.element);
        const idx = st.cleared.findIndex((p, j) => p.r === s.from.r && p.c === s.from.c && st.kinds[j] === k);
        expect(idx).toBeGreaterThanOrEqual(0); // a origem É uma célula limpa daquele elemento
      });
      c = next;
    }
  });
  it('o inimigo também: alvo = o jogador, dano = o do log do inimigo', () => {
    const { board, rng } = newRound(11);
    const m = validMoves(board)[0];
    const r = trySwap(board, m.a, m.b, rng);
    if (!r.ok) throw new Error('inválida');
    const c = newCombat(mulberry32(2), []);
    const next = applyEnemySteps(c, [r.steps[0]]);
    const shots = powerShots(r.steps[0], next.log, [m.a, m.b]);
    expect(shots.every(s => s.by === 'enemy' && s.target === 'player')).toBe(true);
    expect(shots.map(s => s.dmg)).toEqual(next.log.map(e => e.dmg));
  });
});
