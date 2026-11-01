/**
 * CONTRATO: a forja de HEX é do SERVIDOR (REGISTRO §216). `POST /api/save?id=&action=hexForge { itemId }` lê o save gravado, confere o
 * saldo com `HEX_COSTS`, debita e entrega numa escrita só; o POST normal do save NÃO acrescenta HEX (a posse gravada vale sempre).
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
  const meta = new Map();
  return { DIGIAPP_SAVES: {
    get: async (key) => store.get(key) ?? null,
    getWithMetadata: async (key) => ({ value: store.get(key) ?? null, metadata: meta.get(key) ?? null }),
    put: async (key, value, opts) => { store.set(key, value); meta.set(key, opts?.metadata ?? null); },
  }, store };
}
const req = (e, qs, body) => save({
  request: new Request(`https://x/api/save?id=${ID}${qs}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  env: e,
});
const post = (e, state) => req(e, '', { state });
const forge = async (e, itemId, extra = {}) => { const r = await req(e, '&action=hexForge', { itemId, ...extra }); return { status: r.status, body: await r.json() }; };
const gravado = (e) => JSON.parse(e.store.get(ID));
const base = { gamePoints: 10_000, foodInventory: { 'potion:agua': 5 }, equipment: { owned: [], equipped: {}, fragments: 30 }, hexsmith: { owned: [], equipped: {} } };
const E = HEX_COSTS.element;
const C = HEX_COSTS.coroa;

describe('hexForge — a forja do servidor', () => {
  it('forja legítima: debita poções + Bits (elemento) e fragmentos + Bits (coroa), entrega e equipa', async () => {
    const e = env();
    await post(e, base);
    const a = await forge(e, 'garra:agua');
    expect(a.status).toBe(200);
    expect(a.body).toMatchObject({ ok: true, already: false, revision: 2, gamePoints: 10_000 - E.bits });
    const b = await forge(e, 'coroa:heal');
    expect(b.body.revision).toBe(3);
    const s = gravado(e);
    expect(s.gamePoints).toBe(10_000 - E.bits - C.bits);
    expect(s.foodInventory['potion:agua']).toBe(5 - E.potions);
    expect(s.equipment.fragments).toBe(30 - C.fragments);
    expect(s.hexsmith).toEqual({ owned: ['garra:agua', 'coroa:heal'], equipped: { garra: 'garra:agua', coroa: 'coroa:heal' } });
  });

  it('saldo insuficiente: 402 e nada muda (poções, fragmentos; Bits de Crédito não pagam)', async () => {
    const e = env();
    await post(e, { ...base, foodInventory: { 'potion:agua': E.potions - 1 }, equipment: { ...base.equipment, fragments: C.fragments - 1 } });
    const antes = e.store.get(ID);
    expect((await forge(e, 'garra:agua')).body.error).toBe('potions');
    const f = await forge(e, 'coroa:heal');
    expect(f.status).toBe(402);
    expect(f.body.error).toBe('fragments');
    expect(e.store.get(ID)).toBe(antes);
    const e2 = env();
    await post(e2, { ...base, gamePoints: E.bits, bitsOrigin: { day: '2026-11-01', free: 0, fromCredits: E.bits, paidLeft: E.bits } });
    expect((await forge(e2, 'garra:agua')).body.error).toBe('bits');
  });

  it('repetição não cobra duas vezes (already, sem gravar)', async () => {
    const e = env();
    await post(e, base);
    await forge(e, 'luvas:melee');
    const depois = e.store.get(ID);
    const r = await forge(e, 'luvas:melee');
    expect(r.body).toMatchObject({ ok: true, already: true, revision: 2 });
    expect(e.store.get(ID)).toBe(depois);
    expect(gravado(e).gamePoints).toBe(10_000 - HEX_COSTS.luvas.bits);
  });

  it('item inválido = 400; sem save gravado = 404; revisão velha = 409', async () => {
    const e = env();
    expect((await forge(e, 'garra:agua')).status).toBe(404);
    await post(e, base);
    expect((await forge(e, 'garra:nao_existe')).status).toBe(400);
    expect((await forge(e, 'garra:agua', { baseRevision: 0 })).status).toBe(409);
    expect(gravado(e).hexsmith.owned).toEqual([]);
  });
});

describe('save.js — o cliente não acrescenta HEX', () => {
  it('save do cliente tentando adicionar HEX (mesmo "pagando") é ignorado; o resto do save grava', async () => {
    const e = env();
    await post(e, base);
    await post(e, {
      ...base, totalXP: 77, gamePoints: base.gamePoints - E.bits, foodInventory: {},
      hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } },
    });
    expect(gravado(e).hexsmith).toEqual({ owned: [], equipped: {} });
    expect(gravado(e).totalXP).toBe(77);
  });

  it('conta nova não nasce com HEX', async () => {
    const e = env();
    await post(e, { ...base, hexsmith: { owned: ['luvas:melee'], equipped: { luvas: 'luvas:melee' } } });
    expect(gravado(e).hexsmith).toEqual({ owned: [], equipped: {} });
  });

  it('ganhar Bits no mesmo intervalo não afeta nada: posse forjada fica, Bits do cliente valem, equipado troca livre', async () => {
    const e = env();
    await post(e, base);
    await forge(e, 'garra:agua');
    // o cliente aplicou o débito e ganhou 900 Bits antes do próximo save; também desequipa e "esquece" a posse
    await post(e, { ...base, gamePoints: 10_000 - E.bits + 900, foodInventory: { 'potion:agua': 5 - E.potions }, hexsmith: { owned: [], equipped: {} } });
    expect(gravado(e).hexsmith).toEqual({ owned: ['garra:agua'], equipped: {} });
    expect(gravado(e).gamePoints).toBe(10_000 - E.bits + 900);
    await post(e, { ...base, hexsmith: { owned: ['garra:agua'], equipped: { garra: 'garra:agua' } } });
    expect(gravado(e).hexsmith).toEqual({ owned: ['garra:agua'], equipped: { garra: 'garra:agua' } });
    // save sem o campo mantém a posse gravada
    await post(e, { totalXP: 1 });
    expect(gravado(e).hexsmith.owned).toEqual(['garra:agua']);
  });
});
