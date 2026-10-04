import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spendCredits } from './entitlements';
import { STORAGE_KEYS } from './storageKeys';

// QA1 (rodada 6) — créditos são DINHEIRO REAL. O servidor debita e responde;
// se a RESPOSTA se perde (a conexão cai depois do débito), o cliente via
// `null`, mostrava "Créditos insuficientes" e NÃO aplicava o efeito — o jogador
// pagava sem receber. O servidor já é idempotente por `opId` (WP5.3), mas o
// cliente nunca reenviava o gesto com o MESMO id. Agora reenvia uma vez,
// com o mesmo `opId`, só quando a requisição lançou (rede) — recusa
// do servidor (402/4xx) continua sendo recusa.

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  store.set(STORAGE_KEYS.SAVE_ID, 'save-id-de-teste');
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const ok = (credits: number) => new Response(JSON.stringify({ ok: true, tier: 'paid', credits, adsLeft: 3 }), { status: 200 });

describe('spendCredits (cliente) — resposta perdida', () => {
  it('rede lançou na 1ª tentativa → reenvia com o MESMO opId e devolve o resultado', async () => {
    const corpos: any[] = [];
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      corpos.push(JSON.parse(String(init.body)));
      if (++n === 1) throw new TypeError('network lost');
      return ok(40);
    }));
    const r = await spendCredits(10, 'exchange-bits');
    expect(r?.credits).toBe(40);
    expect(corpos).toHaveLength(2);
    expect(corpos[1].opId).toBe(corpos[0].opId);
  });

  it('recusa do servidor (402) NÃO reenvia', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: false, reason: 'insufficient' }), { status: 402 }));
    vi.stubGlobal('fetch', f);
    expect(await spendCredits(10, 'reroll')).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('as duas tentativas caem → null (sem laço)', async () => {
    const f = vi.fn(async () => { throw new TypeError('offline'); });
    vi.stubGlobal('fetch', f);
    expect(await spendCredits(10, 'reroll')).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });
});
