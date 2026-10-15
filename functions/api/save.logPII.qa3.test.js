// QA3 REGRESSAO: o save.js logava o saveId INTEIRO (hash derivável do e-mail) em recusas;
// a regra do projeto (e o manual api-workers.md) é só `saveIdPrefix` (8 chars).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequest } from './save.js';

const ID = 'abcdefgh12345678abcdefgh12345678';
const kvFake = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, String(v)); }, delete: async k => { m.delete(k); }, getWithMetadata: async k => ({ value: m.get(k) ?? null, metadata: null }), list: async () => ({ keys: [], list_complete: true }) }; };
const post = body => new Request(`https://soulmon.test/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'content-length': undefined }, body });
afterEach(() => vi.restoreAllMocks());

function espiao() {
  const linhas = [];
  for (const n of ['log', 'warn', 'info', 'error']) vi.spyOn(console, n).mockImplementation((...a) => linhas.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')));
  return linhas;
}

describe('QA3 save.js: log de recusa sem o saveId inteiro', () => {
  it('state que não é objeto: warn leva só o prefixo', async () => {
    const linhas = espiao();
    const r = await onRequest({ request: post(JSON.stringify({ state: [1] })), env: { SOULMON_SAVES: kvFake() } });
    expect(r.status).toBe(400);
    const tudo = linhas.join('\n');
    expect(tudo).toContain('abcdefgh');
    expect(tudo).not.toContain(ID);
  });
  it('state acima do teto (413): warn leva só o prefixo', async () => {
    const linhas = espiao();
    const grande = JSON.stringify({ state: { x: 'a'.repeat(5 * 1024 * 1024 + 10) } });
    const r = await onRequest({ request: post(grande), env: { SOULMON_SAVES: kvFake() } });
    expect(r.status).toBe(413);
    expect(linhas.join('\n')).not.toContain(ID);
  });
});
