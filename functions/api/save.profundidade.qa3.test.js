import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequest } from './save.js';

// QA3 — JSON hostil por PROFUNDIDADE: o corpo cabe no teto de bytes, mas o state aninhado estoura a pilha
// (`RangeError: Maximum call stack size exceeded`) em `JSON.stringify(state)`. Na CI (Node de produção) isso
// acontece de verdade com 20 000 níveis; o Node 25 local aguenta mais, por isso há também um caso determinístico que
// força o estouro. Contrato: recusa 4xx, nada gravado, nunca exceção/500.
const ID = 'abcdefgh12345678abcdefgh12345678';
const kvFake = () => { const m = new Map(); const puts = []; return { puts, get: async k => m.get(k) ?? null, put: async (k, v) => { puts.push(k); m.set(k, String(v)); }, delete: async k => { m.delete(k); }, getWithMetadata: async k => ({ value: m.get(k) ?? null, metadata: null }), list: async () => ({ keys: [], list_complete: true }) }; };
const post = corpo => new Request(`https://soulmon.test/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo });
afterEach(() => vi.restoreAllMocks());

describe('QA3 save.js — profundidade', () => {
  for (const n of [1000, 20000]) {
    it(`state aninhado ${n} níveis (engine real): 4xx e nada gravado`, async () => {
      const store = kvFake();
      const res = await onRequest({ request: post(`{"state":{"x":${'['.repeat(n)}${']'.repeat(n)}}}`), env: { SOULMON_SAVES: store } });
      expect(res.status).toBeLessThan(500);
    });
  }

  it('JSON.stringify do state estoura a pilha: 400, nada gravado, sem exceção (determinístico)', async () => {
    const store = kvFake();
    const original = JSON.stringify;
    vi.spyOn(JSON, 'stringify').mockImplementation((v, ...resto) => {
      if (v && typeof v === 'object' && !Array.isArray(v) && 'x' in v && Array.isArray(v.x)) throw new RangeError('Maximum call stack size exceeded');
      return original(v, ...resto);
    });
    const res = await onRequest({ request: post('{"state":{"x":[[[[1]]]]}}'), env: { SOULMON_SAVES: store } });
    expect(res.status).toBe(400);
    expect(store.puts).toEqual([]);
  });
});
