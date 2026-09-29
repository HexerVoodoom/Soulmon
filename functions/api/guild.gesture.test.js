import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import { GUILD_GESTURES, coopGestKey } from './_coop.js';

/**
 * GESTOS (`PLANO-GUILDA.md` §4): três fixos — Aceno, Luz, Descanso —, anônimos,
 * para a roda inteira (nunca para uma pessoa escolhida), sem texto livre, sem
 * push; um de cada por pessoa por dia; recebidos EM LOTE, só os tipos, sem
 * quem e sem quantos.
 */
function fakeKV() {
  const store = new Map();
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { puts.push({ k, v, o }); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const M = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'].map(sid);
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const ver = async (e, id) => (await (await chamar(e, 'guild', { id }, 'GET')).json()).guild;
afterEach(() => vi.useRealTimers());

async function roda(n) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: `Nome ${m[0]}`, pid: `P${m[0]}${'q'.repeat(22)}` }));
  const g = (await (await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' })).json()).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id };
}

describe('guildGesture', () => {
  it('são exatamente três, fixos', () => {
    expect(GUILD_GESTURES).toEqual(['aceno', 'luz', 'descanso']);
  });

  it('um de cada por dia: o 2º igual é 429 daily limit; os outros dois passam', async () => {
    const { e } = await roda(2);
    expect((await chamar(e, 'guildGesture', { id: M[0], kind: 'aceno' })).status).toBe(200);
    const again = await chamar(e, 'guildGesture', { id: M[0], kind: 'aceno' });
    expect(again.status).toBe(429);
    expect((await again.json()).error).toBe('daily limit');
    expect((await chamar(e, 'guildGesture', { id: M[0], kind: 'luz' })).status).toBe(200);
    const r = await chamar(e, 'guildGesture', { id: M[0], kind: 'descanso' });
    expect((await r.json()).guild.mine.gesturesSent).toEqual(['aceno', 'luz', 'descanso']);
  });

  it('no dia seguinte o teto recomeça', async () => {
    const { e } = await roda(2);
    await chamar(e, 'guildGesture', { id: M[0], kind: 'aceno' });
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    expect((await chamar(e, 'guildGesture', { id: M[0], kind: 'aceno' })).status).toBe(200);
  });

  it('sem texto livre nem destinatário: kind fora da lista é 400; campos extras são ignorados e não gravados', async () => {
    const { e, gid } = await roda(2);
    const r = await chamar(e, 'guildGesture', { id: M[0], kind: 'oi, tudo bem?' });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe('invalid kind');
    await chamar(e, 'guildGesture', { id: M[0], kind: 'luz', to: M[1], text: 'volta logo' });
    const gravado = e.DIGIAPP_SAVES.store.get(coopGestKey(gid, M[0]));
    expect(gravado).not.toMatch(/volta logo|to|bb0/);
  });

  it('sem guilda: 404', async () => {
    const { e } = await roda(1);
    expect((await chamar(e, 'guildGesture', { id: M[5], kind: 'aceno' })).status).toBe(404);
  });

  it('recebido em LOTE e anônimo: só os tipos, sem quem nem quantos; o próprio gesto não volta como recebido', async () => {
    const { e } = await roda(6);
    await chamar(e, 'guildGesture', { id: M[1], kind: 'aceno' });
    await chamar(e, 'guildGesture', { id: M[2], kind: 'aceno' });
    await chamar(e, 'guildGesture', { id: M[3], kind: 'luz' });
    await chamar(e, 'guildGesture', { id: M[0], kind: 'descanso' });
    const v = await ver(e, M[0]);
    expect(v.gestures).toEqual(['aceno', 'luz']);
    const txt = JSON.stringify(v.gestures);
    expect(txt).not.toMatch(/\d/);
    for (const m of M) expect(JSON.stringify(v)).not.toContain(m);
    const outro = await ver(e, M[4]);
    expect(outro.gestures).toEqual(['aceno', 'luz', 'descanso']);
    expect(outro.mine.gesturesSent).toEqual([]);
  });

  it('gestos de ontem não chegam hoje', async () => {
    const { e } = await roda(2);
    await chamar(e, 'guildGesture', { id: M[1], kind: 'aceno' });
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    expect((await ver(e, M[0])).gestures).toEqual([]);
  });
});
