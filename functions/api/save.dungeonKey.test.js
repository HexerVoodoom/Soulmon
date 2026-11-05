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
const post = (e, dungeonKeyDay) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { dungeonKeyDay } }) }),
  env: e,
});

describe('save.js: chave do Calabouço (§239)', () => {
  it('guarda um dia válido e descarta lixo', async () => {
    const ok = env();
    await post(ok, '2026-11-05');
    expect(JSON.parse(ok.store.get(ID)).dungeonKeyDay).toBe('2026-11-05');
    const bad = env();
    await post(bad, { sempre: true });
    expect(JSON.parse(bad.store.get(ID)).dungeonKeyDay).toBeUndefined();
  });
});
