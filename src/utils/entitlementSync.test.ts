import { describe, it, expect, vi } from 'vitest';
import { createEntitlementSync, ENTITLEMENT_RETRY_MS, ENTITLEMENT_VISIBLE_MIN_GAP_MS } from './entitlementSync';
import { adminFromEntitlement } from './adminFlag';

type Ent = { admin: boolean };
function harness(responses: Array<Ent | null>) {
  let t = 1_000_000;
  const timers: Array<{ fn: () => void; ms: number; live: boolean }> = [];
  const applied: Array<Ent | null> = [];
  let i = 0;
  const fetch = vi.fn(async () => responses[Math.min(i++, responses.length - 1)]);
  const sync = createEntitlementSync<Ent>({
    fetch, apply: e => applied.push(e), now: () => t,
    setTimer: (fn, ms) => { const h = { fn, ms, live: true }; timers.push(h); return h; },
    clearTimer: h => { (h as { live: boolean }).live = false; },
  });
  const flush = () => new Promise(r => setTimeout(r, 0));
  return { sync, fetch, applied, timers, flush, advance: (ms: number) => { t += ms; } };
}

describe('entitlementSync — a corrida do login', () => {
  it('1ª resposta null (token ainda não existia) → 1 retry curto → admin', async () => {
    const h = harness([null, { admin: true }]);
    h.sync.run('mount'); await h.flush();
    expect(adminFromEntitlement(h.applied.at(-1))).toBe(false);
    expect(h.timers).toHaveLength(1);
    expect(h.timers[0].ms).toBe(ENTITLEMENT_RETRY_MS);
    h.timers[0].fn(); await h.flush();
    expect(adminFromEntitlement(h.applied.at(-1))).toBe(true);
    expect(h.fetch).toHaveBeenCalledTimes(2);
  });
  it('o retry é ÚNICO: null de novo não agenda outro', async () => {
    const h = harness([null, null]);
    h.sync.run('mount'); await h.flush();
    h.timers[0].fn(); await h.flush();
    expect(h.timers).toHaveLength(1);
  });
  it('mudança de auth refaz a consulta mesmo dentro dos 30 s e sem mudar saveId', async () => {
    const h = harness([null, { admin: true }]);
    h.sync.run('mount'); await h.flush();
    h.sync.run('auth'); await h.flush();
    expect(adminFromEntitlement(h.applied.at(-1))).toBe(true);
  });
  it('visibilidade: no máx. 1 por 30 s; passado o intervalo, consulta', async () => {
    const h = harness([{ admin: false }, { admin: true }]);
    h.sync.run('mount'); await h.flush();
    h.advance(ENTITLEMENT_VISIBLE_MIN_GAP_MS - 1); h.sync.run('visible'); await h.flush();
    expect(h.fetch).toHaveBeenCalledTimes(1);
    h.advance(2); h.sync.run('visible'); await h.flush();
    expect(h.fetch).toHaveBeenCalledTimes(2);
    expect(adminFromEntitlement(h.applied.at(-1))).toBe(true);
  });
  it('resposta velha não vence a nova; dispose cancela retry e aplicação', async () => {
    let release!: (e: Ent | null) => void;
    const applied: Array<Ent | null> = [];
    let n = 0;
    const s = createEntitlementSync<Ent>({
      fetch: () => (n++ === 0 ? new Promise<Ent | null>(r => { release = r; }) : Promise.resolve({ admin: true })),
      apply: e => applied.push(e),
    });
    s.run('mount'); s.run('auth');
    await new Promise(r => setTimeout(r, 0));
    release(null); await new Promise(r => setTimeout(r, 0));
    expect(applied).toEqual([{ admin: true }]);
    const h = harness([null]);
    h.sync.run('mount'); await h.flush(); h.sync.dispose();
    expect(h.timers[0].live).toBe(false);
  });
});
