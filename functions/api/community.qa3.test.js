/**
 * QA3 — superfície do Torneio no servidor.
 *  1. `opponents&id=<saveId>` respondia SEM autorizar: `me.duel` (ficha derivada do perfil)
 *     e `matchesLeft` de qualquer saveId — o oráculo e-mail→conta que `player` já fechou.
 *  2. `profile` gravava `unlockedStages` com elementos de qualquer tipo/tamanho; o
 *     diretório público devolve isso para todo mundo (amplificação de payload).
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

const ME = 'a'.repeat(32);
const VIT = 'b'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, extra = {}) => JSON.stringify({ id, name: 'N' + id[0], petName: 'B', stage: 'champion', pvpEnabled: true, pid: id[0].repeat(24), ...extra });

describe('opponents exige o dono quando recebe id', () => {
  it('sem token com auth ligada: 401, sem ficha nem cota de ninguém', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${VIT}`]: perfil(VIT) }), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const res = await onRequest({ request: new Request(`https://x.dev/api/community?action=opponents&id=${VIT}`), env });
    expect(res.status).toBe(401);
    expect(await res.text()).not.toMatch(/matchesLeft|duel/);
  });
  it('sem id continua respondendo (navegação anônima)', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${VIT}`]: perfil(VIT) }), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const res = await onRequest({ request: new Request('https://x.dev/api/community?action=opponents'), env });
    expect(res.status).toBe(200);
  });
});

describe('profile sanitiza unlockedStages', () => {
  it('só strings curtas, no máximo 16', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [`profile:${ME}`]: perfil(ME) }) };
    const lixo = [{ a: 'x'.repeat(5000) }, 7, null, ['y'], 'x'.repeat(500), 'rookie', 'champion-power'];
    const res = await onRequest({
      request: new Request(`https://x.dev/api/community?action=profile&id=${ME}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: ME, unlockedStages: lixo, pvpEnabled: true }),
      }),
      env,
    });
    expect(res.status).toBe(200);
    const p = JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ME}`));
    expect(p.unlockedStages.every(s => typeof s === 'string' && s.length <= 40)).toBe(true);
    expect(p.unlockedStages).toEqual(['rookie', 'champion-power']);
  });
});
