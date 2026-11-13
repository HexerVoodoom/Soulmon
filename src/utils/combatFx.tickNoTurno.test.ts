/** §334: o tick de DoT entra em cena no começo da ação do golpe de quem o carrega (`sceneTimeOf`). */
import { describe, expect, it } from 'vitest';
import { sceneTimeOf } from './combatFx';

type E = { kind: 'attack' | 'cast' | 'tick' | 'ko'; t: number };
const lead = (e: E) => (e.kind === 'attack' ? 0.3 : e.kind === 'cast' ? 0.8 : 0);

describe('sceneTimeOf', () => {
  it('o tick sai quando a ação do golpe do mesmo instante começa (lead antes)', () => {
    const ev: E[] = [{ kind: 'attack', t: 1 }, { kind: 'tick', t: 2 }, { kind: 'tick', t: 2 }, { kind: 'attack', t: 2 }];
    expect(sceneTimeOf(ev, 1, lead)).toBeCloseTo(1.7);
    expect(sceneTimeOf(ev, 2, lead)).toBeCloseTo(1.7);
    expect(sceneTimeOf(ev, 3, lead)).toBe(2);
    expect(sceneTimeOf(ev, 0, lead)).toBe(1);
  });
  it('tick que derruba (seguido de ko, sem golpe): no próprio instante', () => {
    const ev: E[] = [{ kind: 'tick', t: 3 }, { kind: 'ko', t: 3 }];
    expect(sceneTimeOf(ev, 0, lead)).toBe(3);
  });
  it('o especial também é turno (dono, 13/11/2026): o tick sai quando a ação do especial começa', () => {
    const ev: E[] = [{ kind: 'tick', t: 5 }, { kind: 'cast', t: 5 }, { kind: 'attack', t: 5 }];
    expect(sceneTimeOf(ev, 0, lead)).toBeCloseTo(4.2);
    expect(sceneTimeOf(ev, 1, lead)).toBe(5);
  });
  it('tick sem nada depois no mesmo instante: no próprio instante', () => {
    expect(sceneTimeOf([{ kind: 'tick', t: 4 }, { kind: 'attack', t: 5 }] as E[], 0, lead)).toBe(4);
  });
});
