import { describe, it, expect, vi } from 'vitest';
import { sanitizeNightmares } from './_nightmares.js';
import { sanitizeNightmareState } from '../../src/utils/nightmares';

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
const post = (e, nightmares) => save({
  request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { nightmares } }) }),
  env: e,
});

const CORPUS = [
  null, undefined, 1, 'x', [], {}, { fought: {} }, { fought: ['a', 3, 'a', 'b'] },
  { fought: [], pending: 'p' }, { pending: 7 }, { pending: 'x'.repeat(65) },
  { lurkDays: ['1', '2', '3', '4', '5', '6', '7', 9] }, { lurkDays: 'nope' },
  { goodDream: true }, { goodDream: 'sim' }, { goodDream: 1 },
  { goodDreams: 12.7 }, { goodDreams: -4 }, { goodDreams: 1e9 }, { goodDreams: NaN }, { goodDreams: '3' },
  { fought: Array.from({ length: 40 }, (_, i) => `d${i}`), lurkDays: ['a', 'b'], goodDream: true, goodDreams: 2 },
];

describe('paridade: sanitizeNightmares (servidor) = sanitizeNightmareState (cliente)', () => {
  it('as duas devolvem o MESMO sobre todo o corpus', () => {
    for (const raw of CORPUS) expect(sanitizeNightmares(raw), JSON.stringify(raw)).toEqual(sanitizeNightmareState(raw));
  });
});

describe('save.js — pesadelos (ciclo do sonho bom)', () => {
  it('preserva o ciclo saneado', async () => {
    const e = env();
    await post(e, { fought: ['d1'], lurkDays: ['d1', 'd2'], goodDream: true, goodDreams: 3 });
    expect(JSON.parse(e.store.get(ID)).nightmares).toEqual({ fought: ['d1'], lurkDays: ['d1', 'd2'], goodDream: true, goodDreams: 3 });
  });
  it('campos forjados viram nada, sem recusar o save', async () => {
    const e = env();
    const r = await post(e, { fought: [1, {}], lurkDays: Array.from({ length: 50 }, (_, i) => `x${i}`), goodDream: 'true', goodDreams: 1e12, extra: 'lixo' });
    expect(r.status).toBe(200);
    const salvo = JSON.parse(e.store.get(ID)).nightmares;
    expect(salvo.fought).toEqual([]);
    expect(salvo.lurkDays).toHaveLength(6);
    expect(salvo.goodDream).toBeUndefined();
    expect(salvo.goodDreams).toBe(9999);
    expect(salvo.extra).toBeUndefined();
  });
  it('save sem o campo continua sem o campo', async () => {
    const e = env();
    await save({
      request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state: { gamePoints: 1 } }) }),
      env: e,
    });
    expect(JSON.parse(e.store.get(ID)).nightmares).toBeUndefined();
  });
});
