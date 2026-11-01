/**
 * PARIDADE da Hexsmith entre o app (`src/utils/hexsmith.ts`) e o servidor (`_hexsmith.js`), e a validacao do campo `hexsmith` no save
 * (01/11/2026). Mudou regra de um lado, mude os dois.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_hexsmith.js';
import * as app from '../../src/utils/hexsmith';
import { ALL_ELEMENT_IDS } from '../../src/utils/elementDex';
import { SPECIAL_FAMILIES } from '../../src/utils/combate/specials';

describe('hexsmith: servidor = app', () => {
  it('constantes', () => {
    expect(srv.HEX_SLOTS).toEqual([...app.HEX_SLOTS]);
    expect(srv.HEX_ELEMENT_SLOTS).toEqual([...app.HEX_ELEMENT_SLOTS]);
    expect(srv.HEX_STRIKES).toEqual([...app.HEX_STRIKES]);
    expect(srv.HEX_MAX_OWNED).toBe(app.HEX_MAX_OWNED);
  });
  it('todo item valido do app e valido no servidor, e vice-versa', () => {
    for (const slot of app.HEX_SLOTS) {
      for (const v of app.hexValuesOf(slot)) expect(srv.parseHexItem(`${slot}:${v}`)).toEqual(app.parseHexItem(`${slot}:${v}`));
    }
    for (const bad of ['garra:nao_existe', 'coroa:agua', 'luvas:fogo', 'x:y', 7, null]) expect(srv.parseHexItem(bad)).toBeUndefined();
    expect(ALL_ELEMENT_IDS.length).toBe(210);
    expect(SPECIAL_FAMILIES.length).toBe(7);
  });
  it('sanitize e overrides iguais em saves hostis', () => {
    const casos = [
      undefined, null, 3, 'x', { owned: 'x' },
      { owned: ['garra:agua', 'garra:agua', 'coroa:heal', 'lixo'], equipped: { garra: 'garra:agua', coroa: 'garra:agua', luvas: 'luvas:melee' } },
      { owned: ['amuleto:fogo', 'couraca:terra', 'luvas:ranged', 'coroa:dot'], equipped: { amuleto: 'amuleto:fogo', couraca: 'couraca:terra', luvas: 'luvas:ranged', coroa: 'coroa:dot' } },
    ];
    for (const c of casos) {
      expect(srv.sanitizeHexsmith(c)).toEqual(app.sanitizeHexsmith(c));
      expect(srv.hexOverrides(c)).toEqual(app.hexOverrides(c));
    }
  });
});
