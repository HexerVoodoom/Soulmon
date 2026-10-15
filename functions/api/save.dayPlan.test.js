import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'c'.repeat(32);
function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, dayPlan) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { dayPlan } }) }),
  env: e,
});

describe('save.js — plano do dia', () => {
  it('preserva o plano saneado', async () => {
    const e = env();
    await post(e, { day: '2026-10-15', offered: ['a', 'b'], picked: ['a'], confirmed: true });
    expect(JSON.parse(e.store.get(ID)).dayPlan).toEqual({ day: '2026-10-15', offered: ['a', 'b'], picked: ['a'], confirmed: true });
  });
  it('descarta plano inválido, sem afetar o restante do save', async () => {
    const e = env();
    await post(e, { day: 'ontem', offered: ['a'] });
    expect(JSON.parse(e.store.get(ID)).dayPlan).toBeUndefined();
  });
});
