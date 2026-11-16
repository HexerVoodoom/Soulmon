/** Duelo com companheiro (PR 2): o cliente (`simulatePvp`) e o servidor (`simulateDuel`) decidem igual, e sem `invoca` e o de hoje. */
import { describe, expect, it } from 'vitest';
import { simulatePvp, type DuelSide } from './duel';
import { combatantAt, REFERENCE_BUILDS } from './level';
import { specialOf, SPECIAL_FAMILIES } from './specials';
import * as srv from '../../../functions/api/_duel.js';
import { companheiroDoEstado } from '../companheiroInvocado';
import { hexOverrides } from '../hexsmith';

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

describe('Coroa da Hexsmith equipada: o rastro e o de um jogador sem companheiro com a mesma Coroa', () => {
  const evoc = { evolutionStage: 'champion', soulmonCompanheiro: { id: 'lobo' }, soulmonEvocacao: { champion: { evocador: true } } } as const;
  for (const coroa of ['dot', 'hot', 'slow', 'silence', 'defBuff']) {
    it(`coroa:${coroa}`, () => {
      const hexsmith = { owned: [`coroa:${coroa}`], equipped: { coroa: `coroa:${coroa}` } };
      const hx = hexOverrides(hexsmith);
      const fam = hx.specialFamily ?? 'direct';
      const mk = (invoca: boolean): DuelSide => ({
        combatant: combatantAt(20, REFERENCE_BUILDS.balanced), special: specialOf(fam, hx.specialEffect), ...(invoca ? { invoca, companheiro: 'lobo' } : {}),
      });
      // com a Coroa equipada, a porta devolve null: o lado do evocador sai SEM invoca
      const invoca = companheiroDoEstado({ ...evoc, hexsmith }, true) !== null;
      expect(invoca).toBe(false);
      // sem a Coroa a mesma ficha invocaria
      expect(companheiroDoEstado(evoc, true)).toBe('lobo');
      for (const seed of [5, 91]) {
        const a = simulatePvp({ me: mk(invoca), opp: side(20, 'direct'), seed, taps: [] });
        const ref = simulatePvp({ me: mk(false), opp: side(20, 'direct'), seed, taps: [] });
        expect(a.events).toEqual(ref.events);
        expect(srv.simulateDuel({ me: mk(invoca), opp: side(20, 'direct'), seed, taps: [] }).events).toEqual(ref.events);
      }
    });
  }
});
