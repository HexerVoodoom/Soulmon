/**
 * PR13 / ALTO-3 da auditoria: um save "veneno" de ~5 MB (o teto da gravação) como oponente. Listar oponentes parseava o
 * save inteiro (até 4x por chamada) e o `catch` não pega estouro de CPU do worker. Agora: acima de `DUEL_SAVE_MAX_CHARS`
 * o lado "não luta" e o save NEM é parseado.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequest } from './community.js';
import { DUEL_DAY_MS, DUEL_SAVE_MAX_CHARS } from './_duel.js';

const ME = 'a'.repeat(32);
const BOM = 'b'.repeat(32);
const VENENO = 'c'.repeat(32);
const PID = { [BOM]: 'p'.repeat(24), [VENENO]: 'q'.repeat(24) };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed)); const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = id => JSON.stringify({ id, name: id.slice(0, 3), petName: 'B', stage: 'rookie', pvpEnabled: true, pid: PID[id] });
const base = { evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000 };
const grande = (chars) => JSON.stringify({ ...base, x: 'A'.repeat(chars) });
const mkEnv = (venenoChars) => {
  const kv = fakeKV({
    [`profile:${ME}`]: JSON.stringify({ id: ME, name: 'me', stage: 'rookie', pvpEnabled: true, pid: 'm'.repeat(24) }),
    [`profile:${BOM}`]: perfil(BOM), [`pid:${PID[BOM]}`]: BOM,
    [`profile:${VENENO}`]: perfil(VENENO), [`pid:${PID[VENENO]}`]: VENENO,
    [ME]: JSON.stringify(base), [BOM]: JSON.stringify(base), [VENENO]: grande(venenoChars),
  });
  for (const k of [ME, BOM, VENENO]) kv.meta.set(k, { t: Date.now(), f: Date.now() - 90 * DUEL_DAY_MS });
  return { DIGIAPP_SAVES: kv };
};
const req = (env, action, method = 'GET', body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify({ id: ME, ...body }) : undefined }),
  env,
}).then(async r => ({ status: r.status, json: await r.json() }));

afterEach(() => vi.restoreAllMocks());

describe('ALTO-3: save gigante como oponente', () => {
  it('opponents NÃO parseia o save de 5 MB: nenhum JSON.parse recebe texto acima do teto', async () => {
    const env = mkEnv(5 * 1024 * 1024);
    const gigantes = [];
    const real = JSON.parse;
    vi.spyOn(JSON, 'parse').mockImplementation((t, r) => { if (typeof t === 'string' && t.length > DUEL_SAVE_MAX_CHARS) gigantes.push(t.length); return real(t, r); });
    const r = await req(env, 'opponents');
    expect(r.status).toBe(200);
    expect(gigantes).toEqual([]);
    const veneno = r.json.opponents.find(o => o.id === PID[VENENO]);
    const bom = r.json.opponents.find(o => o.id === PID[BOM]);
    if (veneno) expect(veneno.duel).toBeNull(); // continua listado como jogador, mas sem ficha de luta
    expect(bom.duel.level).toBeGreaterThan(0);
  });

  it('duelStart contra o save veneno: 404 e NENHUMA partida gasta; contra o save normal funciona', async () => {
    const env = mkEnv(5 * 1024 * 1024);
    const r = await req(env, 'duelStart', 'POST', { opponentId: PID[VENENO] });
    expect(r.status).toBe(404);
    expect([...env.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith('rank:'))).toBe(false);
    expect((await req(env, 'duelStart', 'POST', { opponentId: PID[BOM] })).status).toBe(200);
  });

  it('o save logo abaixo do teto ainda luta (o teto não pega save legítimo grande)', async () => {
    const env = mkEnv(DUEL_SAVE_MAX_CHARS - 500);
    expect((await req(env, 'duelStart', 'POST', { opponentId: PID[VENENO] })).status).toBe(200);
  });
});
