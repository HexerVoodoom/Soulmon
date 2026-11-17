/** `delete-request` so gera token + plano barato: nenhuma varredura global (rank:/rkme:/rift-*) — em producao ela estourava em 503. */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest } = await import('./account.js');
const ID = 'a'.repeat(32);

it('delete-request nao lista prefixos globais e fica dentro de poucas operacoes de KV', async () => {
  const store = new Map([[ID, JSON.stringify({ totalXP: 5 })]]);
  for (let i = 0; i < 3000; i++) { store.set(`rank:2026-11:${i}`, '{}'); store.set(`rkme:g:p:${i}`, '1'); }
  const listados = []; let ops = 0;
  const kv = {
    get: async k => { ops++; return store.get(k) ?? null; },
    getWithMetadata: async k => { ops++; return { value: store.get(k) ?? null, metadata: {} }; },
    put: async (k, v) => { ops++; store.set(k, v); },
    delete: async k => { ops++; store.delete(k); },
    list: async ({ prefix = '' }) => { ops++; listados.push(prefix); return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; },
  };
  const res = await onRequest({ request: new Request(`https://x/api/account?action=delete-request&id=${ID}`, { method: 'POST', body: '{}' }), env: { DIGIAPP_SAVES: kv, FIREBASE_PROJECT_ID: 't' } });
  expect(res.status).toBe(200);
  expect((await res.json()).confirmToken).toBeTruthy();
  expect(listados.filter(p => ['rank:', 'rkme:', 'rift-pending:', 'rift-paid:'].includes(p))).toEqual([]);
  expect(ops).toBeLessThan(40);
});
