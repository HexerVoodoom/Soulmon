import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';

// Bosque do Cla (22/11/2026): o cartao `coopMem:<gid>:<save>` e cache do que a vista da guilda mostra (inclui o sprite) e so era renovado
// por acao de guilda do PROPRIO membro. Quem evoluia sem agir na guilda ficava no Bosque com a arte antiga (caso Maslin: perfil = ultimate,
// cartao = arte de antes). Gravar o perfil com `spriteUrl` novo agora renova o cartao da guilda da pessoa. Aditivo: sem guilda, nada muda.

const BRUNO = 'b'.repeat(32);
const PID_B = 'bb'.repeat(12);
const GID = 'g'.repeat(24);
const VELHO = '/api/sprite-image?k=' + '1'.repeat(32);
const NOVO = '/api/sprite-image?k=' + '2'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = JSON.stringify({ id: BRUNO, pid: PID_B, name: 'Bruno', petName: 'p', stage: 'rookie', pvpEnabled: true, spriteUrl: VELHO,
  attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), tasksDone: 0 });
const mundo = (comGuilda = true) => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${BRUNO}`]: perfil, [`pid:${PID_B}`]: BRUNO, [BRUNO]: JSON.stringify({ evolutionStage: 'rookie' }),
    ...(comGuilda ? { [`coopOf:${BRUNO}`]: GID, [`coopMem:${GID}:${BRUNO}`]: JSON.stringify({ v: 1, name: 'Bruno', sprite: VELHO, ck: null, fio: null, gest: null, hits: {}, casa: null }) } : {}),
  }),
});
const salvar = (env, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${BRUNO}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: BRUNO, name: 'Bruno', pvpEnabled: true, ...body }),
  }), env,
});
const cartao = env => JSON.parse(env.DIGIAPP_SAVES.store.get(`coopMem:${GID}:${BRUNO}`));

describe('perfil publico renova o cartao da guilda quando o sprite muda', () => {
  it('spriteUrl novo no perfil => o sprite do cartao acompanha', async () => {
    const env = mundo();
    expect((await salvar(env, { spriteUrl: NOVO })).status).toBe(200);
    expect(cartao(env).sprite).toBe(NOVO);
  });
  it('sprite igual ao gravado: cartao intocado (sem escrita extra)', async () => {
    const env = mundo();
    await salvar(env, { spriteUrl: VELHO });
    expect(cartao(env).casa).toBeNull(); // o cartao semeado segue como estava (renovar o recriaria com `casa` montada)
  });
  it('sem guilda: perfil grava normalmente e nenhum cartao nasce', async () => {
    const env = mundo(false);
    expect((await salvar(env, { spriteUrl: NOVO })).status).toBe(200);
    expect([...env.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith('coopMem:'))).toBe(false);
  });
});
