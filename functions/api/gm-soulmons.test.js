import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequestGet } from './gm-soulmons.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith, fakeKV } from './admin.testkit.js';

beforeAll(() => installJwks());
afterAll(() => vi.unstubAllGlobals());

const mk = () => envWith({ DIGIAPP_SAVES: fakeKV({
  'sprite:img:abc123:mega-power': JSON.stringify({ image: 'https://x/api/sprite-image?k=aa', at: 5, email: 'u@e.test', provider: 'gemini' }),
  'profile:abc123': JSON.stringify({ name: 'Zeca' }),
  'ent:abc123': '{}',
}) });
const call = (env, tok) => onRequestGet({ request: reqWith(tok, 'https://x/api/gm-soulmons'), env });

describe('gm-soulmons', () => {
  it('403 sem token', async () => { const r = await call(mk(), ''); expect(r.status).toBe(403); expect(await r.text()).not.toContain('u@e.test'); });
  it('403 com token não-GM', async () => { expect((await call(mk(), await token(OTHER))).status).toBe(403); });
  it('200 com GM, lista com nome e e-mail', async () => {
    const r = await call(mk(), await token(ADMIN));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.items).toEqual([expect.objectContaining({ name: 'Zeca', email: 'u@e.test', formId: 'mega-power' })]);
  });
});
