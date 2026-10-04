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

describe('profile — texto livre PÚBLICO passa pela régua de contato (D-1)', () => {
  const post = async (env, body) => {
    const res = await onRequest({
      request: new Request(`https://x.dev/api/community?action=profile&id=${ME}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: ME, pvpEnabled: true, ...body }),
      }),
      env,
    });
    expect(res.status).toBe(200);
    return JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${ME}`));
  };
  const mk = () => ({ DIGIAPP_SAVES: fakeKV({ [`profile:${ME}`]: perfil(ME, { petName: 'Kuro', stage: 'champion' }) }) });

  it('petName com contato é descartado (fica o anterior); nome comum passa', async () => {
    let p = await post(mk(), { petName: 'zap: 11 98888-7777' });
    expect(p.petName).toBe('Kuro');
    p = await post(mk(), { petName: 'me chama no whatsapp: 11988887777' });
    expect(p.petName).toBe('Kuro');
    p = await post(mk(), { petName: 'joao@mail.com' });
    expect(p.petName).toBe('Kuro');
    p = await post(mk(), { petName: 'Bolinha' });
    expect(p.petName).toBe('Bolinha');
  });

  it('stage e unlockedStages só aceitam id de estágio (nunca frase livre)', async () => {
    let p = await post(mk(), { stage: 'chame no zap 5511988887777' });
    expect(p.stage).toBe('champion'); // recusa: fica o anterior
    p = await post(mk(), { stage: 'champion-power', unlockedStages: ['rookie', 'me liga 5511 9888', 'mega-harmony'] });
    expect(p.stage).toBe('champion-power');
    expect(p.unlockedStages).toEqual(['rookie', 'mega-harmony']);
  });
});

describe('corpo do POST', () => {
  const env = () => ({ DIGIAPP_SAVES: fakeKV({ [`profile:${ME}`]: perfil(ME) }) });
  const raw = (body) => onRequest({
    request: new Request(`https://x.dev/api/community?action=profile&id=${ME}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body }),
    env: env(),
  });
  it('JSON `null`/número/lista não derruba com 500 (vira corpo vazio)', async () => {
    for (const b of ['null', '7', '[1,2]', '"x"']) {
      const res = await raw(b);
      expect(res.status, b).toBeLessThan(500);
    }
  });
  it('corpo gigante é recusado com 413 antes de virar objeto', async () => {
    const res = await raw(JSON.stringify({ id: ME, lixo: 'x'.repeat(200_000) }));
    expect(res.status).toBe(413);
  });
});
