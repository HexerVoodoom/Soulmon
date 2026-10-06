/**
 * PARIDADE da tabela de portoes do Vinculo entre o app (`src/utils/gates.ts`) e o servidor (`_gates.js`).
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_gates.js';
import { GATES, gateFor, MASMORRA_ALTO_A_PARTIR_DO_ANDAR } from '../../src/utils/gates';
import { BOND_PVP_MIN_LEVEL } from './_bond.js';

describe('a tabela de portoes e a MESMA nos dois lados', () => {
  it('mesmas portas, mesmos numeros', () => {
    expect(srv.GATES).toEqual(GATES);
    expect(srv.MASMORRA_ALTO_A_PARTIR_DO_ANDAR).toBe(MASMORRA_ALTO_A_PARTIR_DO_ANDAR);
  });
  it('a decisao bate em todo Vinculo e em lixo', () => {
    for (const f of Object.keys(GATES)) {
      for (const l of [...Array.from({ length: 60 }, (_, i) => i - 2), NaN, null, undefined, 'x', Infinity, 4.9, 5.1]) {
        expect(srv.gateFor(f, l), `${f} ${String(l)}`).toEqual(gateFor(f, l));
      }
    }
  });
  it('o minimo de PvP do _bond.js vem da mesma tabela', () => {
    expect(BOND_PVP_MIN_LEVEL).toBe(srv.GATES.pvp.minBond);
  });
});
