import { it, expect } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';
const ID = 'abcdefgh12345678abcdefgh12345678';
const mk = tier => { const m = new Map([[ENT_PREFIX + ID, JSON.stringify({ tier })]]); return { FIREBASE_PROJECT_ID: 'soulmon-app', SOULMON_SAVES: { get: async k => m.get(k) ?? null, put: async () => {}, delete: async () => {}, getWithMetadata: async k => ({ value: m.get(k) ?? null, metadata: null }) } }; };
const req = () => new Request('https://x/api/generate-sprite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ID, prompt: 'p', formId: 'rookie' }) });
it('REGRESSAO: sem login, conta paga e demo recebem a MESMA resposta (401)', async () => {
  const p = await onRequestPost({ request: req(), env: mk('paid') });
  const d = await onRequestPost({ request: req(), env: mk('demo') });
  expect([p.status, (await p.json()).error]).toEqual([d.status, 'unauthenticated']);
  expect(d.status).toBe(401);
});
