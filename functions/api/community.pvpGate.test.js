/**
 * O gate de PvP no SERVIDOR — a trava, não a experiência.
 *
 * `POST profile` aceitava `pvpEnabled` do cliente e gravava `!!body.pvpEnabled`
 * sem perguntar mais nada. Como o perfil é gravado junto do cloud save, um
 * cliente adulterado (ou um `curl`) entrava no diretório público e na fila de
 * oponentes sem nenhum investimento — o risco que o desenho registrou em
 * `level-de-conta.md` §7 ("se o gate for checado só no cliente, é forjável").
 *
 * O servidor tem o save (`totalXP` sincroniza por `/api/save`, chave = saveId),
 * então ele deriva o Vínculo e decide. Duas regras do dono, travadas aqui:
 *  1. o PvP nasce DESLIGADO e só liga a partir do nível 5;
 *  2. quem JÁ ligou continua ligado — o gate vale para LIGAR, nunca para tirar
 *     de quem já consentiu.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { xpForLevel } from '../../src/utils/bond';

const ALICE = 'a'.repeat(32);
const XP_NIVEL_5 = xpForLevel(5);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    }),
  };
}

const postProfile = (env, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }),
  env,
});

const perfilGravado = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${id}`));

describe('gate de PvP no servidor — nível mínimo 5', () => {
  it('cliente pedindo pvpEnabled:true SEM Vínculo suficiente não entra', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [ALICE]: JSON.stringify({ totalXP: XP_NIVEL_5 - 1 }) }) };
    const res = await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: true });
    expect(res.status).toBe(200); // o resto do perfil é gravado; só o PvP não liga
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(false);
    expect((await res.json()).pvpBlocked).toBe(true);
  });

  it('com o Vínculo no nível 5, liga', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [ALICE]: JSON.stringify({ totalXP: XP_NIVEL_5 }) }) };
    await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: true });
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(true);
  });

  it('sem save no servidor, NÃO liga — ausência de prova não é prova', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({}) };
    await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: true });
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(false);
  });

  it('save com totalXP forjado como string/NaN não libera', async () => {
    const env = { DIGIAPP_SAVES: fakeKV({ [ALICE]: JSON.stringify({ totalXP: 'muito' }) }) };
    await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: true });
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(false);
  });
});

describe('não se tira de quem já tem', () => {
  it('quem JÁ estava com pvpEnabled:true continua ligado mesmo com Vínculo baixo', async () => {
    const env = {
      DIGIAPP_SAVES: fakeKV({
        [ALICE]: JSON.stringify({ totalXP: 0 }),
        [`profile:${ALICE}`]: JSON.stringify({ id: ALICE, name: 'Alice', pvpEnabled: true, friends: [] }),
      }),
    };
    await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: true });
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(true);
  });

  it('desligar continua sendo direito de quem quiser sair, em qualquer nível', async () => {
    const env = {
      DIGIAPP_SAVES: fakeKV({
        [ALICE]: JSON.stringify({ totalXP: XP_NIVEL_5 * 10 }),
        [`profile:${ALICE}`]: JSON.stringify({ id: ALICE, name: 'Alice', pvpEnabled: true, friends: [] }),
      }),
    };
    await postProfile(env, ALICE, { name: 'Alice', pvpEnabled: false });
    expect(perfilGravado(env, ALICE).pvpEnabled).toBe(false);
  });
});
