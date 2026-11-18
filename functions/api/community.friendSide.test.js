import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onRequest } from './community.js';
import { resetRateLimits } from './_rateLimit.js';

// Treino com amigo (17/11/2026): a ficha REAL do amigo (inclusive o companheiro invocado) sai só entre amigos.
const ME = 'a'.repeat(32), AMIGA = 'm'.repeat(32), ESTRANHA = 'e'.repeat(32), ESCONDIDA = 'h'.repeat(32);
const PID = { [ME]: 'aa'.repeat(12), [AMIGA]: 'mm'.repeat(12), [ESTRANHA]: 'ee'.repeat(12), [ESCONDIDA]: 'hh'.repeat(12) };
const kv = (seed) => { const s = new Map(Object.entries(seed)); return { get: async k => s.get(k) ?? null, getWithMetadata: async k => ({ value: s.get(k) ?? null, metadata: null }), put: async (k, v) => { s.set(k, v); }, delete: async k => { s.delete(k); }, list: async ({ prefix }) => ({ keys: [...s.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }) }; };
const perfil = (id, extra = {}) => JSON.stringify({ id, pid: PID[id], name: id.slice(0, 3), stage: 'ultimate', attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: 1, ...extra });
const saveEvocador = { evolutionStage: 'ultimate', perfectDays: 3, soulmonCompanheiro: { id: 'ent' }, soulmonEvocacao: { ultimate: { evocador: true } } };
function mundo() {
  const seed = {
    [`profile:${ME}`]: perfil(ME, { friends: [AMIGA, ESCONDIDA] }),
    [`profile:${AMIGA}`]: perfil(AMIGA, { pvpEnabled: false }),
    [`profile:${ESTRANHA}`]: perfil(ESTRANHA),
    [`profile:${ESCONDIDA}`]: perfil(ESCONDIDA, { publicHidden: true }),
    [ME]: JSON.stringify({ evolutionStage: 'rookie' }), [AMIGA]: JSON.stringify(saveEvocador), [ESTRANHA]: JSON.stringify(saveEvocador), [ESCONDIDA]: JSON.stringify(saveEvocador),
  };
  for (const s of Object.keys(PID)) seed[`pid:${PID[s]}`] = s;
  return { DIGIAPP_SAVES: kv(seed) };
}
const get = (env, friend) => onRequest({ request: new Request(`https://x.dev/api/community?${new URLSearchParams({ action: 'friendSide', id: ME, friend })}`), env });

beforeEach(() => { resetRateLimits(); vi.stubGlobal('caches', undefined); });

describe('friendSide', () => {
  it('amiga evocadora (Maslin-like) volta com invoca + companheiro e SÓ o lado', async () => {
    const res = await get(mundo(), PID[AMIGA]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body)).toEqual(['side']);
    expect(body.side.invoca).toBe(true);
    expect(body.side.companheiro).toBe('ent');
    expect(JSON.stringify(body)).not.toContain(AMIGA);
  });
  it('quem não é amigo ou está escondido responde 403 igual', async () => {
    expect((await get(mundo(), PID[ESTRANHA])).status).toBe(403);
    expect((await get(mundo(), PID[ESCONDIDA])).status).toBe(403);
  });
});
