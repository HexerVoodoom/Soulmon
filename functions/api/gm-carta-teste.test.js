import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { onRequestPost } from './gm-carta-teste.js';
import { onRequestGet as pagina } from '../gm/carta.js';
import { emailToSaveId } from './_auth.js';
import { ADMIN, OTHER, installJwks, token, envWith, fakeKV } from './admin.testkit.js';

beforeAll(() => installJwks());
afterAll(() => vi.unstubAllGlobals());

const post = (env, tok, body) => onRequestPost({ request: new Request('https://x/api/gm-carta-teste', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify(body ?? {}) }), env });

describe('gm-carta-teste (§244)', () => {
  it('403 sem token e com token que não é de GM; nada é gravado', async () => {
    const kv = fakeKV({});
    const env = envWith({ DIGIAPP_SAVES: kv });
    expect((await post(env, '')).status).toBe(403);
    expect((await post(env, await token(OTHER))).status).toBe(403);
    expect(await kv.get(`mail:${await emailToSaveId(OTHER)}`)).toBeNull();
  });
  it('vai só para a conta do GM, ignora destino no corpo, sem prêmio e uma vez por dia', async () => {
    const kv = fakeKV({});
    const env = envWith({ DIGIAPP_SAVES: kv });
    const t = await token(ADMIN);
    const alheio = 'c'.repeat(32);
    expect((await (await post(env, t, { id: alheio, ids: [alheio] })).json()).status).toBe('sent');
    expect((await (await post(env, t)).json()).status).toBe('already');
    expect(await kv.get(`mail:${alheio}`)).toBeNull();
    const rec = JSON.parse(await kv.get(`mail:${await emailToSaveId(ADMIN)}`));
    expect(rec.q).toHaveLength(1);
    expect(rec.q[0]).toMatchObject({ bits: 0, emblems: 0 });
  });
  it('a página não traz dado e não abre em iframe', async () => {
    const r = await pagina({ env: { FIREBASE_API_KEY: 'k', FIREBASE_AUTH_DOMAIN: 'd', FIREBASE_PROJECT_ID: 'p' } });
    expect(r.headers.get('X-Frame-Options')).toBe('DENY');
    expect(await r.text()).toContain('/api/gm-carta-teste');
  });
});
