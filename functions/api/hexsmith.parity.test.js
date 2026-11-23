/**
 * PARIDADE da Hexsmith entre o app (`src/utils/hexsmith.ts`) e o servidor (`_hexsmith.js`), e a validacao do campo `hexsmith` no save
 * (01/11/2026). Mudou regra de um lado, mude os dois.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_hexsmith.js';
import * as app from '../../src/utils/hexsmith';
import { ALL_ELEMENT_IDS } from '../../src/utils/elementDex';
import { SPECIAL_FAMILIES } from '../../src/utils/combate/specials';

// A missao diaria da Hexsmith (12/11/2026, REGISTRO secao 309) conta no CLIENTE (`dailyMissions`); o servidor nao mexe nesse campo.
const semDiaria = ({ dailyMissions: _d, ...resto }) => resto;

describe('hexsmith: servidor = app', () => {
  it('constantes', () => {
    expect(srv.HEX_SLOTS).toEqual([...app.HEX_SLOTS]);
    expect(srv.HEX_ELEMENT_SLOTS).toEqual([...app.HEX_ELEMENT_SLOTS]);
    expect(srv.HEX_STRIKES).toEqual([...app.HEX_STRIKES]);
    expect(srv.HEX_MAX_OWNED).toBe(app.HEX_MAX_OWNED);
  });
  it('custos: HEX_COSTS e hexCost iguais (o servidor cobra o que o app cobra, §216)', () => {
    expect(srv.HEX_COSTS).toEqual(app.HEX_COSTS);
    for (const id of ['garra:agua', 'amuleto:fogo', 'couraca:terra', 'coroa:heal', 'coroa:hot', 'coroa:slow', 'coroa:silence', 'luvas:melee-slash', 'luvas:magic', 'x:y']) expect(srv.hexCost(id)).toEqual(app.hexCost(id));
  });
  it('forja do servidor = forgeHexItem do app (debito, Bit de Credito, recusa, ja possuido)', () => {
    const estados = [
      { gamePoints: 5000, foodInventory: { 'potion:agua': 3 }, equipment: { owned: [], equipped: {}, fragments: 25 }, hexsmith: { owned: [], equipped: {} } },
      { gamePoints: 2500, foodInventory: {}, equipment: { owned: [], equipped: {}, fragments: 20 }, bitsOrigin: { day: 'd', free: 0, fromCredits: 600, paidLeft: 600 }, hexsmith: { owned: ['coroa:dot'], equipped: { coroa: 'coroa:dot' } } },
      { gamePoints: 100, foodInventory: { 'potion:agua': 9 }, equipment: { owned: [], equipped: {}, fragments: 0 } },
    ];
    for (const st of estados) {
      for (const id of ['garra:agua', 'coroa:heal', 'coroa:dot', 'luvas:melee-slash']) {
        const a = app.forgeHexItem(st, id);
        const r = srv.forgeOnServer(st, id);
        if (a === st) expect(r.ok === false || r.already).toBe(true);
        else { expect(r.ok && !r.already).toBe(true); expect(r.state).toEqual(semDiaria(a)); }
      }
    }
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
      { owned: ['garra:agua', 'garra:agua', 'coroa:heal', 'lixo'], equipped: { garra: 'garra:agua', coroa: 'garra:agua', luvas: 'luvas:melee-slash' } },
      { owned: ['amuleto:fogo', 'couraca:terra', 'luvas:magic', 'coroa:dot'], equipped: { amuleto: 'amuleto:fogo', couraca: 'couraca:terra', luvas: 'luvas:magic', coroa: 'coroa:dot' } },
      { owned: ['coroa:hot', 'coroa:slow', 'coroa:silence'], equipped: { coroa: 'coroa:silence' } },
    ];
    for (const c of casos) {
      expect(srv.sanitizeHexsmith(c)).toEqual(app.sanitizeHexsmith(c));
      expect(srv.hexOverrides(c)).toEqual(app.hexOverrides(c));
    }
  });
  it('luvas: 4 ataques e migracao identicos (legado ranged/melee)', () => {
    for (const id of ['luvas:ranged', 'luvas:melee', 'luvas:magic', 'luvas:ranged-slash', 'luvas:melee-slash', 'luvas:melee-smash']) {
      expect(srv.migrateHexId(id)).toEqual(app.migrateHexId(id));
      expect(srv.parseHexItem(id)).toEqual(app.parseHexItem(id));
      expect(srv.hexCost(id)).toEqual(app.hexCost(id));
    }
    const legado = { owned: ['luvas:ranged', 'luvas:melee', 'luvas:magic'], equipped: { luvas: 'luvas:ranged' } };
    expect(srv.sanitizeHexsmith(legado)).toEqual(app.sanitizeHexsmith(legado));
    expect(srv.sanitizeHexsmith(legado)).toEqual({ owned: ['luvas:magic', 'luvas:melee-slash'], equipped: { luvas: 'luvas:magic' } });
    expect(srv.hexOverrides(legado)).toEqual(app.hexOverrides(legado));
    const st = { gamePoints: 5000, foodInventory: {}, equipment: { owned: [], equipped: {}, fragments: 20 } };
    const r = srv.forgeOnServer(st, 'luvas:melee');
    expect(r.ok && r.state.hexsmith.owned).toEqual(['luvas:melee-slash']);
    expect(r.state).toEqual(semDiaria(app.forgeHexItem(st, 'luvas:melee')));
  });
});
