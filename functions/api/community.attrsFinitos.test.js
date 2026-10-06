/** PR13 / BAIXO B1: `profile.attrs` do cliente só grava número finito e não negativo (`1e999` virava `null` no JSON). */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const ID = 'a'.repeat(32);
function fakeKV() {
  const store = new Map(); const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}

describe('B1: attrs finitos', () => {
  it('1e999, -5 e texto viram 0; número normal passa', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    const res = await onRequest({
      request: new Request(`https://x.dev/api/community?action=profile&id=${ID}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        // texto cru: `JSON.stringify` já trocaria Infinity por null; o ataque manda o literal 1e999
        body: `{"id":"${ID}","name":"Ana","stage":"rookie","pvpEnabled":false,"attrs":{"power":1e999,"harmony":-5,"benevolence":7}}`,
      }),
      env,
    });
    expect(res.status).toBe(200);
    const p = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ID}`));
    expect(p.attrs).toEqual({ power: 0, harmony: 0, benevolence: 7 });
  });
});
