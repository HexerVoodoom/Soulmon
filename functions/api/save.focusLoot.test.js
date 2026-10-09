import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'jogador@example.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: save } = await import('./save.js');
const ID = 'b'.repeat(32);
function env() {
  const store = new Map();
  return { DIGIAPP_SAVES: {
    get: async key => store.get(key) ?? null,
    getWithMetadata: async key => ({ value: store.get(key) ?? null, metadata: null }),
    put: async (key, value) => store.set(key, value),
  }, store };
}
const post = (e, focusLoot) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { focusLoot } }) }),
  env: e,
});

describe('save.js — ledger da Oficina do Foco', () => {
  it('preserva o contador diário saneado e limita-o a oito recompensas', async () => {
    const e = env();
    await post(e, { day: '2026-10-09', items: 8, claims: ['sessao:focus-1'] });
    expect(JSON.parse(e.store.get(ID)).focusLoot).toEqual({ day: '2026-10-09', items: 8, claims: ['sessao:focus-1'] });
  });
  it('descarta ledger inválido, sem afetar o restante do save', async () => {
    const e = env();
    await post(e, { day: '2026-10-09', items: 80, claims: [] });
    expect(JSON.parse(e.store.get(ID)).focusLoot).toBeUndefined();
  });
});
