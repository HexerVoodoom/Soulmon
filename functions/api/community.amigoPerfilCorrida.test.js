import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { ligarAmizade } from './_amigos.js';

// §439: "adiciono um amigo e logo depois ele some". O perfil guarda `friends[]` e o upsert do perfil (gravado o tempo todo
// pelo cloud save) lia o perfil NO INÍCIO e regravava `friends: prev.friends` no FIM: uma amizade ligada no meio desse
// intervalo (aceite do convite, convite cruzado) era sobrescrita pela lista velha. O upsert tem que reler a lista na hora de gravar.

const A = 'a'.repeat(32);
const B = 'b'.repeat(32);
const PA = 'pida0000000000000000000a';
const PB = 'pidb0000000000000000000b';

function kvComGancho() {
  const store = new Map();
  const kv = {
    store,
    gancho: null,
    get: async k => {
      const v = store.get(k) ?? null;
      if (k === `profile:${A}` && kv.gancho) { const g = kv.gancho; kv.gancho = null; await g(); }
      return v; // devolve o valor de ANTES do gancho: o upsert enxerga a lista velha
    },
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
  return kv;
}
const perfil = (id, pid) => JSON.stringify({ id, pid, name: `N${pid.slice(3, 4)}`, petName: 'pet', stage: 'rookie', pvpEnabled: true, attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now() });

describe('upsert de perfil não apaga amizade ligada durante a gravação', () => {
  it('amizade ligada entre a leitura e a escrita do perfil sobrevive', async () => {
    const kv = kvComGancho();
    kv.store.set(`profile:${A}`, perfil(A, PA));
    kv.store.set(`profile:${B}`, perfil(B, PB));
    kv.store.set(`pid:${PA}`, A);
    kv.store.set(`pid:${PB}`, B);
    const env = { DIGIAPP_SAVES: kv };
    kv.gancho = async () => { expect((await ligarAmizade(env, A, B)).ok).toBe(true); };
    const r = await onRequest({
      request: new Request(`https://x.dev/api/community?action=profile&id=${A}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Ana', stage: 'rookie' }),
      }), env,
    });
    expect(r.status).toBe(200);
    expect(JSON.parse(kv.store.get(`profile:${A}`)).friends).toEqual([B]);
  });
});
