/**
 * CONTRATO: o servidor confere o PAGAMENTO dos HEXes da Hexsmith (REGISTRO §216, `_hexsmith.js` › `enforceHexPayment`).
 * HEX novo na posse precisa da queda correspondente (gravado → recebido) de poções do elemento, fragmentos e Bits (`HEX_COSTS`).
 */
import { describe, it, expect, vi } from 'vitest';
import { HEX_COSTS } from './_hexsmith.js';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'd'.repeat(32);
function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async (key) => store.get(key) ?? null,
    getWithMetadata: async (key) => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, state) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }),
  env: e,
});
const gravado = (e) => JSON.parse(e.store.get(ID));
const base = { gamePoints: 10_000, foodInventory: { 'potion:agua': 5 }, equipment: { owned: [], equipped: {}, fragments: 30 }, hexsmith: { owned: [], equipped: {} } };
const E = HEX_COSTS.element;
const C = HEX_COSTS.coroa;

describe('save.js — pagamento dos HEXes', () => {
  it('compra legítima passa (poções + Bits do elemento; fragmentos + Bits da coroa)', async () => {
    const e = env();
    await post(e, base);
    await post(e, {
      ...base,
      gamePoints: base.gamePoints - E.bits - C.bits,
      foodInventory: { 'potion:agua': 5 - E.potions },
      equipment: { ...base.equipment, fragments: 30 - C.fragments },
      hexsmith: { owned: ['garra:agua', 'coroa:heal'], equipped: { garra: 'garra:agua', coroa: 'coroa:heal' } },
    });
    expect(gravado(e).hexsmith).toEqual({ owned: ['garra:agua', 'coroa:heal'], equipped: { garra: 'garra:agua', coroa: 'coroa:heal' } });
  });

  it('ganho sem pagamento é barrado (item revertido, resto do save gravado)', async () => {
    const e = env();
    await post(e, base);
    await post(e, { ...base, totalXP: 77, hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } });
    expect(gravado(e).hexsmith).toEqual({ owned: [], equipped: {} });
    expect(gravado(e).totalXP).toBe(77);
  });

  it('pagamento parcial (Bits caíram, poções não) também é barrado', async () => {
    const e = env();
    await post(e, base);
    await post(e, { ...base, gamePoints: base.gamePoints - E.bits, hexsmith: { owned: ['garra:agua'], equipped: {} } });
    expect(gravado(e).hexsmith.owned).toEqual([]);
  });

  it('saldo insuficiente: queda que cobre só um de dois itens mantém só o primeiro', async () => {
    const e = env();
    await post(e, { ...base, gamePoints: 2000 });
    await post(e, {
      ...base, gamePoints: 2000 - E.bits, foodInventory: {},
      hexsmith: { owned: ['amuleto:agua', 'couraca:agua'], equipped: { amuleto: 'amuleto:agua', couraca: 'couraca:agua' } },
    });
    expect(gravado(e).hexsmith).toEqual({ owned: ['amuleto:agua'], equipped: { amuleto: 'amuleto:agua' } });
  });

  it('sem save gravado (conta nova) nenhum HEX nasce de graça', async () => {
    const e = env();
    await post(e, { ...base, hexsmith: { owned: ['luvas:melee'], equipped: { luvas: 'luvas:melee' } } });
    expect(gravado(e).hexsmith).toEqual({ owned: [], equipped: {} });
  });

  it('HEX já possuído não cobra de novo (saves seguintes sem queda mantêm o item; trocar o equipado é livre)', async () => {
    const e = env();
    await post(e, base);
    const pago = { ...base, gamePoints: base.gamePoints - E.bits, foodInventory: { 'potion:agua': 5 - E.potions }, hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } };
    await post(e, pago);
    await post(e, { ...pago, gamePoints: pago.gamePoints + 300, hexsmith: { owned: ['garra:agua'], equipped: {} } });
    await post(e, { ...pago, hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } });
    expect(gravado(e).hexsmith).toEqual({ owned: ['garra:agua'], equipped: { garra: 'garra:agua' } });
    expect(gravado(e).gamePoints).toBe(pago.gamePoints);
  });
});
