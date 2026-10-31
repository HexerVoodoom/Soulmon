// Regressão (decisão do dono, 31/10/2026): `ent:` corrompido FALHA (503 tipado) e nunca segue com a conta vazia —
// antes, a leitura devolvia um registro vazio e a próxima gravação apagava tier pago, Créditos e `consumedOrders`.
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  readEntitlement, spendCredits, grantAdReward, grantRankPrize, requirePaidTier,
  EntitlementIlegivelError, comEntitlementLegivel, ENT_PREFIX,
} from './_entitlements.js';

const SAVE = 'a'.repeat(32);
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const kv = { store, puts: [], get: async k => store.get(k) ?? null, put: async (k, v) => { kv.puts.push(k); store.set(k, v); }, delete: async k => { store.delete(k); } };
  return kv;
}
const envCom = raw => ({ DIGIAPP_SAVES: fakeKV({ [ENT_PREFIX + SAVE]: raw }) });

afterEach(() => vi.restoreAllMocks());

describe('ent: ilegível', () => {
  for (const [nome, raw] of [['JSON quebrado', '{"tier":"paid","cred'], ['null', 'null'], ['lista', '[1,2]'], ['número', '7']]) {
    it(`${nome}: readEntitlement lança EntitlementIlegivelError (503) e loga`, async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(readEntitlement(envCom(raw), SAVE)).rejects.toBeInstanceOf(EntitlementIlegivelError);
      expect(err.mock.calls.some(c => String(c[0]).includes('entitlement.unreadable'))).toBe(true);
    });
  }

  it('nenhuma gravação: gastar, anúncio e prêmio não sobrescrevem o registro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = envCom('{quebrado');
    await expect(spendCredits(env, SAVE, 5, 'op-12345678')).rejects.toBeInstanceOf(EntitlementIlegivelError);
    await expect(grantAdReward(env, SAVE)).rejects.toBeInstanceOf(EntitlementIlegivelError);
    await expect(grantRankPrize(env, SAVE, 10, 'rift:2026-10')).rejects.toBeInstanceOf(EntitlementIlegivelError);
    expect(env.DIGIAPP_SAVES.puts).toEqual([]);
    expect(env.DIGIAPP_SAVES.store.get(ENT_PREFIX + SAVE)).toBe('{quebrado');
  });

  it('requirePaidTier recusa com 503 (fail-closed), não 402', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await requirePaidTier(envCom('{x'), SAVE)).toMatchObject({ ok: false, status: 503 });
  });

  it('comEntitlementLegivel: erro tipado vira 503 com os cabeçalhos da rota; outro erro sobe', async () => {
    const h = comEntitlementLegivel(async () => { throw new EntitlementIlegivelError(SAVE); }, { 'X-Rota': '1' });
    const r = await h({});
    expect(r.status).toBe(503);
    expect(r.headers.get('X-Rota')).toBe('1');
    expect(await r.json()).toEqual({ error: 'entitlement-unavailable' });
    await expect(comEntitlementLegivel(async () => { throw new Error('outro'); }, {})({})).rejects.toThrow('outro');
  });

  it('registro legível segue igual', async () => {
    const ent = await readEntitlement(envCom(JSON.stringify({ tier: 'paid', credits: 3 })), SAVE);
    expect(ent).toMatchObject({ tier: 'paid', credits: 3 });
  });
});
