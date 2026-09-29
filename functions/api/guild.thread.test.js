import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  coopKey, coopFioKey, lerGrupo, metaDoFioCumprida, META_DO_FIO, STAGE_UNLOCK_DAYS, gravarGrupo,
} from './_coop.js';

/**
 * O FIO (`guildThread`, WPG-3a, `PLANO-GUILDA.md` §3 linha 🧵).
 *
 * - 1 por (dia do jogador, pessoa), idempotente;
 * - o dia vale só a ±1 do UTC (override de G6);
 * - a meta que firma é a de CORAÇÃO (G1, `META_DO_FIO`);
 * - a escrita é SÓ a chave `coopFio:<gid>:<save>`, nunca o blob (I3);
 * - 7 dias DISTINTOS, não seguidos, liberam os cenários (LV-G9);
 * - viajante sai do denominador sem nada visível;
 * - o fio renova o prazo junto do blob (G17a).
 */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v, opts) => { puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const A = sid('aa'), B = sid('bb'), C = sid('cc');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, stage: 'rookie', friends: [] });
function req(action, { method = 'POST', body, params = {} } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const dia = n => new Date(Date.UTC(2026, 8, 1 + n, 12)).toISOString().slice(0, 10);
const noDia = n => vi.setSystemTime(new Date(Date.UTC(2026, 8, 1 + n, 12)));

afterEach(() => vi.useRealTimers());

async function roda(membros = [A, B]) {
  vi.useFakeTimers({ toFake: ['Date'] });
  noDia(0);
  const seed = {};
  for (const m of [A, B, C]) seed[`profile:${m}`] = perfil(m, `N${m[0]}`);
  const e = { DIGIAPP_SAVES: fakeKV(seed) };
  const g = (await (await chamar(e, 'guildCreate', { body: { id: membros[0], name: 'Roda' } })).json()).guild;
  for (const m of membros.slice(1)) await chamar(e, 'guildJoin', { body: { id: m, code: g.code } });
  return { e, gid: g.id };
}
const fio = async (e, id, extra = {}) => chamar(e, 'guildThread', { body: { id, kind: 'fio', dayKey: extra.dayKey, goal: extra.goal } });

describe('guildThread: um fio por pessoa por dia', () => {
  it('dois fios no mesmo dia = um (distinctDays 1), e a resposta diz threadToday', async () => {
    const { e, gid } = await roda();
    const r1 = await fio(e, A);
    expect(r1.status).toBe(200);
    expect((await r1.json()).guild.mine.threadToday).toBe(true);
    await fio(e, A);
    const f = JSON.parse(e.DIGIAPP_SAVES.store.get(coopFioKey(gid, A)));
    expect(f.distinctDays).toBe(1);
    expect(f.days).toEqual([dia(0)]);
  });

  it('o dia do jogador vale a ±1 do UTC; a 2 dias de distância é 400 invalid day', async () => {
    const { e, gid } = await roda();
    expect((await fio(e, A, { dayKey: dia(1) })).status).toBe(200);
    expect((await fio(e, A, { dayKey: dia(-1) })).status).toBe(200);
    const longe = await fio(e, A, { dayKey: dia(2) });
    expect(longe.status).toBe(400);
    expect((await longe.json()).error).toBe('invalid day');
    const f = JSON.parse(e.DIGIAPP_SAVES.store.get(coopFioKey(gid, A)));
    expect(f.distinctDays).toBe(2);
  });

  it('sem guilda: 404; kind desconhecido: 400', async () => {
    const { e } = await roda([A]);
    expect((await fio(e, C)).status).toBe(404);
    const r = await chamar(e, 'guildThread', { body: { id: A, kind: 'semente' } });
    expect(r.status).toBe(400);
  });

  it('a escrita do fio é SÓ na chave do próprio membro — o blob do grupo não é gravado', async () => {
    const { e, gid } = await roda();
    await chamar(e, 'guild', { method: 'GET', params: { id: A } }); // fecha o que houver
    e.DIGIAPP_SAVES.puts.length = 0;
    await fio(e, B);
    const escritas = e.DIGIAPP_SAVES.puts.map(p => p.k);
    expect(escritas).toEqual([coopFioKey(gid, B)]);
    expect(escritas).not.toContain(coopKey(gid));
  });
});

describe('META_DO_FIO: a meta de CORAÇÃO (G1)', () => {
  it('a régua é a do coração', () => {
    expect(META_DO_FIO).toBe('heart');
    // mega: dia completo pede 6, o coração pede 4 — 4 firma o fio.
    expect(metaDoFioCumprida({ done: 4, heart: 4, full: 6 })).toBe(true);
    expect(metaDoFioCumprida({ done: 3, heart: 4, full: 3 })).toBe(false);
    expect(metaDoFioCumprida({ done: 'x', heart: 4, full: 6 })).toBe(false);
    expect(metaDoFioCumprida({ done: 1, heart: 0, full: 0 })).toBe(true);
    expect(metaDoFioCumprida({ done: 0, heart: 0, full: 0 })).toBe(false);
  });

  it('o servidor recusa goal que não cumpre o coração (400 goal not met) e aceita o que cumpre', async () => {
    const { e } = await roda();
    const nao = await fio(e, A, { goal: { done: 2, heart: 3, full: 2 } });
    expect(nao.status).toBe(400);
    expect((await nao.json()).error).toBe('goal not met');
    const sim = await fio(e, A, { goal: { done: 3, heart: 3, full: 5 } });
    expect(sim.status).toBe(200);
  });
});

describe('Bosque: dias-de-guilda proporcionais, fechados na leitura', () => {
  it('dois de dois firmam ontem → +1,0 dia-de-guilda; o estágio sai, o número não', async () => {
    const { e, gid } = await roda();
    await fio(e, A); await fio(e, B);
    noDia(1); await fio(e, A); await fio(e, B);
    // A1: o dia só fecha quando terminou em todos os fusos (UTC ≥ D+2).
    noDia(3);
    const v = (await (await chamar(e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    const g = await lerGrupo(e, gid);
    expect(g.bosqueProgress).toBeCloseTo(2, 5);
    expect(v.bosque.stage).toBe('clareira');
    expect(v.bosque.stageIndex).toBe(1);
    expect(JSON.stringify(v)).not.toMatch(/bosqueProgress|"progress":2\b|faltam/);
  });

  it('um de dois → +0,5; fechar duas vezes o mesmo dia não soma de novo', async () => {
    const { e, gid } = await roda();
    await fio(e, A);
    noDia(2);
    await chamar(e, 'guild', { method: 'GET', params: { id: A } });
    await chamar(e, 'guild', { method: 'GET', params: { id: B } });
    expect((await lerGrupo(e, gid)).bosqueProgress).toBeCloseTo(0.5, 5);
  });

  it('viajante (4 semanas sem fio) sai do denominador: 1 de 1 ativo vale 1,0', async () => {
    const { e, gid } = await roda();
    // B firma no dia 0 e some. A firma do dia 29 em diante.
    await fio(e, B);
    noDia(29); await fio(e, A);
    noDia(31);
    const antes = (await lerGrupo(e, gid)).bosqueProgress ?? 0;
    await chamar(e, 'guild', { method: 'GET', params: { id: A } });
    const depois = (await lerGrupo(e, gid)).bosqueProgress;
    // Dia 29: B está a 29 dias do último fio (viajante) → A sozinho = 1,0.
    expect(depois - antes).toBeGreaterThanOrEqual(1 - 1e-9);
    // e nada disso aparece na vista
    const txt = await (await chamar(e, 'guild', { method: 'GET', params: { id: A } })).text();
    expect(txt).not.toMatch(/viajante|traveler|inativ/i);
  });

  it(`cenários de estágio só com ${STAGE_UNLOCK_DAYS} dias DISTINTOS de fio — não seguidos`, async () => {
    const { e } = await roda();
    let v;
    for (let k = 0; k < STAGE_UNLOCK_DAYS; k++) {
      noDia(k * 3); // um dia sim, dois não
      v = (await (await fio(e, A)).json()).guild;
      expect(v.mine.groveScenes).toBe(k + 1 >= STAGE_UNLOCK_DAYS);
    }
    const vb = (await (await chamar(e, 'guild', { method: 'GET', params: { id: B } })).json()).guild;
    expect(vb.mine.groveScenes).toBe(false);
  });
});

describe('G17(a): o fio renova o prazo junto do grupo', () => {
  it('com progresso > 0, gravarGrupo regrava o coopFio SEM TTL; sem progresso, com 120 d', async () => {
    const { e, gid } = await roda();
    await fio(e, A);
    const g = await lerGrupo(e, gid);
    e.DIGIAPP_SAVES.puts.length = 0;
    await gravarGrupo(e, { ...g, bosqueProgress: 0, prazoAte: undefined }); // A3: renovação conjunta devida
    const comPrazo = e.DIGIAPP_SAVES.puts.find(p => p.k === coopFioKey(gid, A));
    expect(comPrazo.opts).toEqual({ expirationTtl: 86400 * 120 });
    e.DIGIAPP_SAVES.puts.length = 0;
    await gravarGrupo(e, { ...g, bosqueProgress: 0.5, semPrazoGravado: undefined });
    const semPrazo = e.DIGIAPP_SAVES.puts.find(p => p.k === coopFioKey(gid, A));
    expect(semPrazo.opts).toEqual({});
    for (const p of e.DIGIAPP_SAVES.puts) expect(p.opts, p.k).toEqual({});
  });
});

describe('mutantes que sobreviveram à 1ª rodada', () => {
  it('o fio de hoje conta como presença: ≤4 marca cameToday, ≥5 acende threadedToday — sem check-in', async () => {
    const { e } = await roda([A, B]);
    const v = (await (await fio(e, B)).json()).guild;
    expect(v.presence.find(p => p.cameToday)).toBeTruthy();
    const seed = {};
    const cinco = ['q1', 'q2', 'q3', 'q4', 'q5'].map(sid);
    for (const m of cinco) seed[`profile:${m}`] = perfil(m, m.slice(0, 2));
    const e5 = { DIGIAPP_SAVES: fakeKV(seed) };
    const g = (await (await chamar(e5, 'guildCreate', { body: { id: cinco[0], name: 'Roda' } })).json()).guild;
    for (const m of cinco.slice(1)) await chamar(e5, 'guildJoin', { body: { id: m, code: g.code } });
    const antes = (await (await chamar(e5, 'guild', { method: 'GET', params: { id: cinco[0] } })).json()).guild;
    expect(antes.threadedToday).toBeNull();
    const depois = (await (await fio(e5, cinco[3])).json()).guild;
    expect(depois.threadedToday).toBe(true);
  });

  it('quem CRIOU e nunca firmou vira viajante depois de 4 semanas (a referência é o dia de entrada)', async () => {
    const { e, gid } = await roda([A, B]);
    for (let n = 0; n <= 30; n++) { noDia(n); await fio(e, B); }
    noDia(32);
    await chamar(e, 'guild', { method: 'GET', params: { id: B } });
    const p = (await lerGrupo(e, gid)).bosqueProgress;
    // dias 0..27: 1 de 2 = 0,5 cada (14); dias 28..30: A é viajante, 1 de 1 (3) = 17.
    expect(p).toBeCloseTo(17, 9);
  });
});
