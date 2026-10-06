/**
 * PR13 / MEDIO-6 e MEDIO-5 da auditoria: o corpo do `save` é medido ANTES de ser lido/parseado (Content-Length e texto),
 * o teto é em BYTES, a gravação tem rate limit (IP e conta) — e o `f` (1ª gravação) nasce na 1ª gravação, então o save
 * legítimo novo não fica preso no level 1 (o `maxLevelFor` sem `f` agora vale 1).
 */
import { describe, it, expect } from 'vitest';
import { onRequest as saveRoute } from './save.js';
import { onRequest as communityRoute } from './community.js';
import { DUEL_DAY_MS } from './_duel.js';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed)); const meta = new Map(); const puts = [];
  return {
    store, meta, puts,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { puts.push(k); store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const post = (env, id, body, headers = {}) => saveRoute({
  request: new Request(`https://x.dev/api/save?id=${id}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body }),
  env,
});

describe('MEDIO-6: limites do save', () => {
  it('Content-Length acima do teto: 413 SEM ler o corpo e sem gravar', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    let lido = false;
    const request = new Request(`https://x.dev/api/save?id=${'l'.repeat(32)}`, { method: 'POST', body: '{}' });
    Object.defineProperty(request, 'headers', { value: new Headers({ 'content-length': String(9 * 1024 * 1024) }) });
    request.text = async () => { lido = true; return '{}'; };
    request.json = async () => { lido = true; return {}; };
    const res = await saveRoute({ request, env });
    expect(res.status).toBe(413);
    expect(lido).toBe(false);
    expect(kv.puts).toEqual([]);
  });

  it('corpo de 8 MB sem Content-Length: 413 antes do JSON.parse, sem gravar', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const corpo = JSON.stringify({ state: { x: 'A'.repeat(8 * 1024 * 1024) } });
    const res = await post(env, 'm'.repeat(32), corpo);
    expect(res.status).toBe(413);
    expect(kv.puts).toEqual([]);
  });

  it('o teto é em BYTES: 2 milhões de caracteres de 3 bytes (6 MB) cabem no teto em caracteres mas são recusados', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const res = await post(env, 'n'.repeat(32), JSON.stringify({ state: { x: '€'.repeat(2_000_000) } }));
    expect(res.status).toBe(413);
    expect(kv.puts).toEqual([]);
  });

  it('save normal continua gravando (200)', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const res = await post(env, 'o'.repeat(32), JSON.stringify({ state: { petName: 'Bolha' } }));
    expect(res.status).toBe(200);
    expect(kv.puts).toEqual(['o'.repeat(32)]);
  });

  it('30 POSTs/min da mesma conta passam; o 31º devolve 429 com Retry-After, sem gravar', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const id = 'r'.repeat(32);
    for (let i = 0; i < 30; i++) expect((await post(env, id, JSON.stringify({ state: { i } }))).status).toBe(200);
    const res = await post(env, id, JSON.stringify({ state: { i: 31 } }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(kv.puts).toHaveLength(30);
    // outra conta não é afetada
    expect((await post(env, 'q'.repeat(32), JSON.stringify({ state: { i: 1 } }))).status).toBe(200);
  });
});

describe('MEDIO-5: save legítimo novo ganha `f` na 1ª gravação e não fica preso', () => {
  it('a 1ª gravação escreve metadata.f; a seguinte o preserva', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const id = 'f'.repeat(32);
    await post(env, id, JSON.stringify({ state: { evolutionStage: 'rookie', perfectDays: 40, totalXP: 5000 } }));
    const f1 = kv.meta.get(id).f;
    expect(f1).toBeGreaterThan(0);
    await post(env, id, JSON.stringify({ state: { evolutionStage: 'rookie', perfectDays: 41, totalXP: 5000 } }));
    expect(kv.meta.get(id).f).toBe(f1);
  });

  it('save antigo SEM f: luta no level 1 até a próxima gravação; depois dela ganha `f` e o teto passa a crescer 1 level/dia', async () => {
    const A = 'a'.repeat(32), B = 'b'.repeat(32), PB = 'p'.repeat(24);
    const kv = fakeKV({
      [`profile:${A}`]: JSON.stringify({ id: A, name: 'a', pvpEnabled: true, pid: 'm'.repeat(24) }),
      [`profile:${B}`]: JSON.stringify({ id: B, name: 'b', petName: 'B', stage: 'rookie', pvpEnabled: true, pid: PB }), [`pid:${PB}`]: B,
      [A]: JSON.stringify({ evolutionStage: 'champion-power', perfectDays: 30, totalXP: 5000 }),
      [B]: JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000 }),
    });
    kv.meta.set(A, { t: Date.now() }); // gravado antes da regra: sem f
    kv.meta.set(B, { t: Date.now(), f: Date.now() - 90 * DUEL_DAY_MS });
    const env = { DIGIAPP_SAVES: kv };
    const duelStart = () => communityRoute({
      request: new Request(`https://x.dev/api/community?action=duelStart&id=${A}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: A, opponentId: PB }) }),
      env,
    }).then(r => r.json());
    expect((await duelStart()).me.combatant.level).toBe(1);
    // a próxima gravação do app escreve o `f`
    await post(env, A, JSON.stringify({ state: { evolutionStage: 'champion-power', perfectDays: 30, totalXP: 5000 } }));
    expect(kv.meta.get(A).f).toBeGreaterThan(0);
    // 5 dias depois (relógio do `f` recuado): o teto é 6, não 1
    kv.meta.set(A, { ...kv.meta.get(A), f: Date.now() - 5 * DUEL_DAY_MS - 1000 });
    const k = [...kv.store.keys()].find(x => x.startsWith('rank:'));
    const rec = JSON.parse(kv.store.get(k)); rec.pending = null; rec.matchesToday = 0; kv.store.set(k, JSON.stringify(rec));
    expect((await duelStart()).me.combatant.level).toBe(6);
  });
});
