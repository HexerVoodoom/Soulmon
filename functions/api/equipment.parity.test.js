/**
 * PARIDADE do equipamento entre o app (`src/utils/equipment.ts`) e o servidor (`_equipment.js`), a validacao do campo no
 * `save.js` e o canal de bonus do duelo (Combate v3 / PR8). Nunca confiar no cliente: slot forjado e descartado.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_equipment.js';
import { EQUIP_CATALOG, EQUIP_SLOTS, SLOT_ATTR, TIER_PCT, FRAGMENTS_MAX, sanitizeEquipment, equipAttrBonus } from '../../src/utils/equipment';
import { sanitizeBitsOrigin } from '../../src/utils/bitsOrigin';
import { onRequest } from './save.js';
import { duelSide } from './_duel.js';
import { xpForLevel } from '../../src/utils/bond';
import { COMBAT_BONUS_CAP } from '../../src/utils/combate/bonus';

describe('o catalogo do servidor e o do app sao o MESMO', () => {
  it('mesmos itens, slots, atributos e percentuais', () => {
    expect(Object.keys(srv.EQUIP).sort()).toEqual(EQUIP_CATALOG.map((i) => i.id).sort());
    for (const i of EQUIP_CATALOG) {
      expect(srv.EQUIP[i.id].slot, i.id).toBe(i.slot);
      expect(srv.EQUIP[i.id].pct, i.id).toBe(i.pct);
    }
    expect(srv.EQUIP_SLOTS).toEqual([...EQUIP_SLOTS]);
    expect(srv.SLOT_ATTR).toEqual(SLOT_ATTR);
    expect(srv.TIER_PCT).toEqual([...TIER_PCT]);
    expect(srv.FRAGMENTS_MAX).toBe(FRAGMENTS_MAX);
  });

  it('sanear e o bonus batem em vetores gerados (inclusive lixo)', () => {
    const ids = [...EQUIP_CATALOG.map((i) => i.id), 'eq-xxx', '__proto__', 7, null, 'constructor'];
    let s = 987654;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
    const pick = () => ids[Math.floor(rnd() * ids.length)];
    for (let i = 0; i < 3000; i++) {
      const raw = {
        owned: Array.from({ length: Math.floor(rnd() * 12) }, pick),
        equipped: { nucleo: pick(), carapaca: pick(), rastro: pick(), extra: pick() },
        fragments: [0, 5, -3, 1e9, NaN, 'x', 12.7][Math.floor(rnd() * 7)],
      };
      expect(srv.sanitizeEquipment(raw), JSON.stringify(raw)).toEqual(sanitizeEquipment(raw));
      const a = srv.equipAttrBonus(raw), b = equipAttrBonus(raw);
      for (const k of ['atk', 'def', 'spd']) expect(a[k], k).toBeCloseTo(b[k], 12);
    }
    for (const lixo of [null, undefined, 3, 'x', [], {}]) expect(srv.equipAttrBonus(lixo)).toEqual(equipAttrBonus(lixo));
  });

  it('o registro de procedencia dos Bits tem a mesma forma nos dois lados', () => {
    for (const raw of [null, {}, { day: 3 }, { day: 'd', free: 5, fromCredits: 2, paidLeft: 1 }, { day: 'd', free: 1e15, fromCredits: -1, paidLeft: 'x' }, { day: 'x'.repeat(60) }]) {
      expect(srv.sanitizeBitsOrigin(raw), JSON.stringify(raw)).toEqual(sanitizeBitsOrigin(raw));
    }
  });
});

const ID = 'c'.repeat(32);
function fakeKV() {
  const store = new Map(); const meta = new Map();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async (k) => { store.delete(k); meta.delete(k); },
  };
}
async function salva(state) {
  const env = { DIGIAPP_SAVES: fakeKV() };
  const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }), env });
  expect(res.status).toBe(200);
  return JSON.parse(env.DIGIAPP_SAVES.store.get(ID));
}

describe('save.js saneia o equipamento e a procedencia dos Bits', () => {
  it('equipamento valido passa intacto', async () => {
    const eq = { owned: ['eq-nucleo-t1', 'eq-rastro-t3'], equipped: { nucleo: 'eq-nucleo-t1', rastro: 'eq-rastro-t3' }, fragments: 12 };
    expect((await salva({ equipment: eq })).equipment).toEqual(eq);
  });
  it('slot forjado, item inventado e fragmentos absurdos sao descartados peca a peca', async () => {
    const out = await salva({ equipment: { owned: ['eq-nucleo-t1', 'eq-zzz'], equipped: { rastro: 'eq-nucleo-t1', nucleo: 'eq-carapaca-t3' }, fragments: 1e12 } });
    expect(out.equipment).toEqual({ owned: ['eq-nucleo-t1'], equipped: {}, fragments: FRAGMENTS_MAX });
    expect((await salva({ equipment: 'tudo' })).equipment).toEqual({ owned: [], equipped: {}, fragments: 0 });
  });
  it('procedencia: forma e clamp; sem `day` valido o registro e descartado; save sem os campos continua sem eles', async () => {
    expect((await salva({ bitsOrigin: { day: 'Mon Oct 05 2026', free: 5, fromCredits: 1, paidLeft: 1 } })).bitsOrigin).toEqual({ day: 'Mon Oct 05 2026', free: 5, fromCredits: 1, paidLeft: 1 });
    expect('bitsOrigin' in (await salva({ bitsOrigin: { day: 7 } }))).toBe(false);
    const nu = await salva({ totalXP: 5 });
    expect('equipment' in nu).toBe(false);
    expect('bitsOrigin' in nu).toBe(false);
  });
});

describe('o duelo usa o equipamento pelo canal de bonus POR ATRIBUTO, no teto unico', () => {
  const base = { evolutionStage: 'rookie', perfectDays: 3, powerPoints: 2, harmonyPoints: 2, benevolencePoints: 2 };
  const b0 = duelSide(base).combatant;
  const canais = (c) => ({ atk: c.bonus, def: (1 + c.def / 8) / (1 + b0.def / 8) - 1, spd: (1 + c.spd / 8) / (1 + b0.spd / 8) - 1 });
  const cheio = { owned: ['eq-nucleo-t3', 'eq-carapaca-t3', 'eq-rastro-t3'], equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' }, fragments: 0 };

  it('cada slot no seu canal', () => {
    const so = (slot, id) => canais(duelSide({ ...base, equipment: { owned: [id], equipped: { [slot]: id }, fragments: 0 } }).combatant);
    expect(so('nucleo', 'eq-nucleo-t2').atk).toBeCloseTo(0.01, 9);
    expect(so('nucleo', 'eq-nucleo-t2').def).toBeCloseTo(0, 12);
    expect(so('carapaca', 'eq-carapaca-t2').def).toBeCloseTo(0.01, 9);
    expect(so('rastro', 'eq-rastro-t2').spd).toBeCloseTo(0.01, 9);
    expect(so('rastro', 'eq-rastro-t2').atk).toBe(0);
  });
  it('slot forjado vale 0; sem equipamento vale 0', () => {
    const c = canais(duelSide({ ...base, equipment: { owned: ['eq-nucleo-t3'], equipped: { rastro: 'eq-nucleo-t3' }, fragments: 0 } }).combatant);
    expect(c.atk + c.def + c.spd).toBeCloseTo(0, 12);
    expect(duelSide(base).combatant).toEqual(b0);
  });
  it('equipamento cheio + talento cheio: a SOMA dos tres canais corta nos 5%', () => {
    const talent = [...Array(4).fill('tal-pvp-01'), ...Array(4).fill('tal-pvp-02'), ...Array(4).fill('tal-pvp-03')];
    const c = canais(duelSide({ ...base, totalXP: xpForLevel(20), talentPicks: talent, equipment: cheio }).combatant);
    expect(c.atk + c.def + c.spd).toBeCloseTo(COMBAT_BONUS_CAP, 9);
    const so = canais(duelSide({ ...base, equipment: cheio }).combatant);
    expect(so.atk + so.def + so.spd).toBeCloseTo(0.045, 9);
  });
});
