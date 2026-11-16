/** Duelo com companheiro (PR 2): o cliente (`simulatePvp`) e o servidor (`simulateDuel`) decidem igual, e sem `invoca` e o de hoje. */
import { describe, expect, it } from 'vitest';
import { simulatePvp, type DuelSide } from './duel';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { specialOf, SPECIAL_FAMILIES } from './specials';
import * as srv from '../../../functions/api/_duel.js';

const side = (L: number, fam: (typeof SPECIAL_FAMILIES)[number], invoca?: boolean): DuelSide => (
  { combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf(fam), ...(invoca ? { invoca, companheiro: 'lobo' } : {}) }
);

describe('simulatePvp x simulateDuel com invoca', () => {
  it('mesmos eventos e vencedor, com e sem companheiro, nas 7 familias', () => {
    for (const fam of SPECIAL_FAMILIES) {
      for (const seed of [3, 77, 4242]) {
        for (const invoca of [false, true]) {
          const me = side(20, fam, invoca);
          const opp = side(20, 'direct', invoca);
          const a = simulatePvp({ me, opp, seed, taps: [] });
          const b = srv.simulateDuel({ me, opp, seed, taps: [] });
          expect(b.events).toEqual(a.events);
          expect(b.winner).toBe(a.winner);
        }
      }
    }
  });
  it('sem invoca = o duelo de hoje (nenhum contador no rastro)', () => {
    const r = simulatePvp({ me: side(15, 'atkBuff'), opp: side(15, 'dot'), seed: 9, taps: [] });
    expect(JSON.stringify(r.fx)).not.toContain('"comp"');
  });
  it('com invoca o rastro leva o contador do companheiro', () => {
    const r = simulatePvp({ me: side(15, 'atkBuff', true), opp: side(15, 'direct'), seed: 9, taps: [] });
    expect(r.fx.some((p) => (p[0].comp ?? 0) > 0)).toBe(true);
  });
});
