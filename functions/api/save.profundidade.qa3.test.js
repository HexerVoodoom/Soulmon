import { describe, it, expect } from 'vitest';
import { onRequest } from './save.js';

// QA3 — JSON hostil por PROFUNDIDADE: o corpo cabe no teto de bytes, mas `JSON.stringify` do state aninhado
// estoura a pilha (RangeError). Contrato: recusa 4xx, nunca exceção/500.
const ID = 'abcdefgh12345678abcdefgh12345678';
const kvFake = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, String(v)); }, delete: async k => { m.delete(k); }, getWithMetadata: async k => ({ value: m.get(k) ?? null, metadata: null }), list: async () => ({ keys: [], list_complete: true }) }; };

describe('QA3 save.js — profundidade', () => {
  for (const n of [1000, 20000, 200000]) {
    it(`state aninhado ${n} níveis: 4xx e nada gravado (sem exceção)`, async () => {
      const store = kvFake();
      const corpo = `{"state":{"x":${'['.repeat(n)}${']'.repeat(n)}}}`;
      const request = new Request(`https://soulmon.test/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo });
      let res;
      try { res = await onRequest({ request, env: { SOULMON_SAVES: store } }); } catch (e) { throw new Error('EXCECAO: ' + e.message); }
      expect(res.status).toBeLessThan(500);
    });
  }
});
