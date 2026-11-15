import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

// QA r4 C2 · A3 (REGISTRO §386): o cliente manda a âncora do dia do jogador e a tela usa o `bitsLeftToday` do SERVIDOR até
// `bitsResetAt` (a meia-noite do jogador), não mais o dia UTC do relógio do aparelho.

const store = new Map<string, string>();
beforeEach(() => {
  vi.resetModules();
  store.clear();
  store.set(STORAGE_KEYS.SAVE_ID, 'save-id-de-teste');
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('A3 · dia do jogador no cliente', () => {
  it('buyBitsPack manda zone/off da âncora playerDayTz', async () => {
    const corpos: Record<string, unknown>[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => { corpos.push(JSON.parse(String(init.body))); return resp(409, { ok: false, reason: 'daily-cap', leftToday: 0 }); }));
    const m = await import('./entitlements');
    await m.buyBitsPack('bits-200', undefined, { zone: 'America/Sao_Paulo', offsetMs: -3 * 3_600_000 });
    expect(corpos[0]).toMatchObject({ zone: 'America/Sao_Paulo', off: -3 * 3_600_000 });
  });

  it('o eco do que resta vale até bitsResetAt (meia-noite do jogador), mesmo depois da virada UTC', async () => {
    vi.useFakeTimers();
    const agora = Date.UTC(2026, 10, 14, 23, 0, 0); // 20:00 em Brasília
    vi.setSystemTime(agora);
    const reset = Date.UTC(2026, 10, 15, 3, 0, 0); // meia-noite de Brasília
    vi.stubGlobal('fetch', vi.fn(async () => resp(409, { ok: false, reason: 'daily-cap', leftToday: 0, bitsLeftToday: 0, bitsResetAt: reset })));
    const m = await import('./entitlements');
    await m.buyBitsPack('bits-200');
    expect(m.bitsPackLeftToday()).toBe(0);
    vi.setSystemTime(agora + 2 * 3_600_000); // 01:00 UTC do dia 15: o eco antigo (dia UTC) já teria zerado
    expect(m.bitsPackLeftToday()).toBe(0);
    vi.setSystemTime(reset + 1);
    expect(m.bitsPackLeftToday()).toBeNull();
  });

  it('o GET com bitsLeftToday/bitsResetAt alimenta o eco; servidor antigo (só bitsPackLeft) segue lido', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => resp(200, { tier: 'paid', credits: 5, adsLeft: 0, bitsLeftToday: 300, bitsResetAt: Date.now() + 3_600_000 })));
    const m = await import('./entitlements');
    await m.fetchEntitlement();
    expect(m.bitsPackLeftToday()).toBe(300);
    vi.stubGlobal('fetch', vi.fn(async () => resp(200, { tier: 'paid', credits: 5, adsLeft: 0, bitsPackLeft: 800 })));
    await m.fetchEntitlement();
    expect(m.bitsPackLeftToday()).toBe(800);
  });
});
