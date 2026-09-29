/**
 * Decisão do dono **#62** (22/09/2026): o RENASCIMENTO zera `aiLifetime.sprite`.
 *
 * O rebirth é de CLIENTE (`src/utils/rebirth.ts`, `GameState.rebirth`) e o
 * contador vitalício é de SERVIDOR (`ent:<saveId>`, o único limite de IA que o
 * cliente não alcança). A ponte é `POST /api/entitlements?action=rebirth-reset`.
 *
 * O que este teste guarda — cada linha aqui é dinheiro (26 gerações × ~R$ 0,10):
 *   · zera `aiLifetime.sprite`, e SÓ ele (`aiForms`, créditos e tier intactos);
 *   · exige `state.rebirth` no save do titular (sem save renascido → 409);
 *   · exige o dono do save (`authorizeSaveAccess`);
 *   · **uma vez por conta** — a segunda chamada é 200 `jaFeito: true` e não
 *     rezera um contador que voltou a subir depois do renascimento.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

let autorizado = true;
vi.mock('./_auth.js', () => ({
  authorizeSaveAccess: async () => (autorizado
    ? { ok: true, enforced: false }
    : { ok: false, reason: 'forbidden', enforced: true }),
  authStatus: a => (a.ok ? 200 : 403),
}));

const { onRequestPost } = await import('./entitlements.js');
const { ENT_PREFIX, REBIRTH_SPRITE_RESET_FIELD } = await import('./_entitlements.js');

const ID = 'a'.repeat(32);
const REBIRTH = { criatura: 'lobo de brasa', escola: 'arcano', elemento: 'fogo', at: '2026-09-22T10:00:00.000Z', fromStage: 'ultra' };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const ENT_BASE = {
  tier: 'paid', credits: 7, consumedOrders: ['GPA.1'], orderDetails: [],
  aiLifetime: { sprite: 20 }, aiForms: { 'mega-power': 3 },
};

const env = ({ ent = ENT_BASE, save = { petName: 'Bolha', rebirth: REBIRTH } } = {}) => ({
  DIGIAPP_SAVES: fakeKV({
    [ENT_PREFIX + ID]: JSON.stringify(ent),
    ...(save ? { [ID]: JSON.stringify(save) } : {}),
  }),
});

const chamar = e => onRequestPost({
  request: new Request('https://x/api/entitlements?action=rebirth-reset', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID }),
  }),
  env: e,
});

const lerEnt = e => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + ID));

beforeEach(() => { autorizado = true; });

describe('#62 — renascer zera o teto vitalício de sprite', () => {
  it('zera `aiLifetime.sprite` quando o save carrega um renascimento', async () => {
    const e = env();
    const res = await chamar(e);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.jaFeito).toBe(false);
    expect(lerEnt(e).aiLifetime.sprite).toBe(0);
  });

  it('não toca em NADA além do contador de sprite', async () => {
    const e = env();
    await chamar(e);
    const ent = lerEnt(e);
    expect(ent.aiForms, 'teto por FORMA: as formas já geradas continuam gastas').toEqual({ 'mega-power': 3 });
    expect(ent.tier).toBe('paid');
    expect(ent.credits).toBe(7);
    expect(ent.consumedOrders).toEqual(['GPA.1']);
  });

  it('save SEM renascimento → 409, e o contador fica de pé', async () => {
    const e = env({ save: { petName: 'Bolha' } });
    const res = await chamar(e);
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toBe('rebirth-not-found');
    expect(lerEnt(e).aiLifetime.sprite).toBe(20);
  });

  it('save inexistente (ou `rebirth` truncado) → 409', async () => {
    for (const save of [null, { rebirth: {} }, { rebirth: { at: '2026-09-22T10:00:00.000Z' } }, { rebirth: true }]) {
      const e = env({ save });
      expect((await chamar(e)).status, JSON.stringify(save)).toBe(409);
      expect(lerEnt(e).aiLifetime.sprite).toBe(20);
    }
  });

  it('quem não é o dono do save não zera nada', async () => {
    autorizado = false;
    const e = env();
    expect((await chamar(e)).status).toBe(403);
    expect(lerEnt(e).aiLifetime.sprite).toBe(20);
  });

  it('UMA VEZ por conta: a 2ª chamada é `jaFeito` e não rezera o que subiu depois', async () => {
    const e = env();
    await chamar(e);
    expect(lerEnt(e)[REBIRTH_SPRITE_RESET_FIELD]).toBeGreaterThan(0);

    // O jogador gasta 5 gerações na árvore nova e chama de novo (retry, outro
    // aparelho, cliente adulterado): o teto NÃO volta a zero.
    const ent = lerEnt(e);
    ent.aiLifetime.sprite = 5;
    e.DIGIAPP_SAVES.store.set(ENT_PREFIX + ID, JSON.stringify(ent));

    const res = await chamar(e);
    expect(res.status).toBe(200);
    expect((await res.json()).jaFeito).toBe(true);
    expect(lerEnt(e).aiLifetime.sprite).toBe(5);
  });

  it('conta sem entitlement ainda assim fica marcada — o reset não é reutilizável depois', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [ID]: JSON.stringify({ rebirth: REBIRTH }) }) };
    expect((await chamar(e)).status).toBe(200);
    const ent = JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + ID));
    expect(ent.aiLifetime.sprite).toBe(0);
    expect(ent[REBIRTH_SPRITE_RESET_FIELD]).toBeGreaterThan(0);
  });
});
