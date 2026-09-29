import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest } from './guild.js';
import { onRequest as community } from './community.js';
import { resetRateLimits } from './_rateLimit.js';
import { coopKey, coopOfKey, coopCodeKey, coopCkKey, grupoDe, semanaDe } from './_coop.js';

/**
 * As cinco invariantes que o QA achou SEM teste (`qa/L1-conformidade.md` §1:
 * M2, M7b, M8, M9, M13) e os três casos de corrida/fuso do `qa/L1-codigo.md`
 * (ALTO-1, ALTO-2, MÉDIO-2). Cada `describe` nomeia a mutação que ele mata.
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
/** Um id de save válido (32 chars) a partir de um rótulo curto. */
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'pet', stage: 'mega-virus', attrs: { virus: 9, data: 9, vaccine: 9 }, friends: [], createdAt: Date.now(), ...extra });
function req(action, { method = 'GET', body, params = {}, ip } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(ip ? { 'CF-Connecting-IP': ip } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const [ANA, BIA, CAU] = ['ana', 'bia', 'cau'].map(sid);
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const post = (e, action, body, extra = {}) => chamar(e, action, { method: 'POST', body, ...extra });
const novoEnv = () => ({ DIGIAPP_SAVES: fakeKV({ [`profile:${ANA}`]: perfil(ANA, 'Ana'), [`profile:${BIA}`]: perfil(BIA, 'Bia'), [`profile:${CAU}`]: perfil(CAU, 'Cau') }) });
async function criar(e, id = ANA) {
  const r = await post(e, 'guildCreate', { id, name: 'Roda' });
  expect(r.status).toBe(200);
  return (await r.json()).guild;
}
/** KV cujo `put` cede a vez antes de gravar — é o que faz duas requisições intercalarem. */
function comAtraso(kv) {
  const put = kv.put;
  kv.put = async (k, v, o) => { await Promise.resolve(); await Promise.resolve(); return put(k, v, o); };
  return kv;
}

describe('M2 — o check-in escreve SÓ na chave do próprio membro', () => {
  it('toda escrita do check-in é em coopCk:<gid>:<eu> ou regrava byte a byte o que já estava', async () => {
    const e = novoEnv();
    const g = await criar(e);
    await post(e, 'guildJoin', { id: BIA, code: g.code });
    const antes = new Map(e.DIGIAPP_SAVES.store);
    e.DIGIAPP_SAVES.puts.length = 0;
    expect((await post(e, 'guildCheckin', { id: BIA })).status).toBe(200);
    const minha = coopCkKey(g.id, BIA);
    expect(e.DIGIAPP_SAVES.puts.some(p => p.k === minha)).toBe(true);
    for (const p of e.DIGIAPP_SAVES.puts) {
      if (p.k === minha) continue;
      expect(p.v, `escrita em ${p.k} mudou o valor`).toBe(antes.get(p.k));
    }
    // O blob do grupo nunca carrega check-in de ninguém.
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id))).checkins).toEqual({});
  });
});

describe('M7b — ponteiro órfão coopOf: é limpo na leitura', () => {
  it('ponteiro para guilda que não existe → null e o ponteiro some', async () => {
    const e = novoEnv();
    e.DIGIAPP_SAVES.store.set(coopOfKey(ANA), 'g'.repeat(24));
    const r = await (await chamar(e, 'guild', { params: { id: ANA } })).json();
    expect(r.guild).toBeNull();
    expect(e.DIGIAPP_SAVES.store.has(coopOfKey(ANA))).toBe(false);
  });
  it('ponteiro para guilda da qual a pessoa não é membro → null e o ponteiro some', async () => {
    const e = novoEnv();
    const g = await criar(e);
    e.DIGIAPP_SAVES.store.set(coopOfKey(BIA), g.id);
    expect(await grupoDe(e, BIA)).toBeNull();
    expect(e.DIGIAPP_SAVES.store.has(coopOfKey(BIA))).toBe(false);
  });
});

describe('M8 — entra-se SÓ por código', () => {
  it('guildJoin com body.groupId (sem código) → 404 e ninguém entra', async () => {
    const e = novoEnv();
    const g = await criar(e);
    for (const body of [{ id: BIA, groupId: g.id }, { id: BIA, groupId: g.id, code: '' }, { id: BIA, gid: g.id, guildId: g.id }]) {
      const r = await post(e, 'guildJoin', body);
      expect(r.status).toBe(404);
    }
    const r2 = await community({ request: new Request('https://x.dev/api/community?action=coopJoin', { method: 'POST', body: JSON.stringify({ id: BIA, groupId: g.id }) }), env: e });
    expect(r2.status).toBe(404);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(g.id))).members).toEqual([ANA]);
    expect(e.DIGIAPP_SAVES.store.has(coopOfKey(BIA))).toBe(false);
  });
});

describe('M9 — classe LEVE do rate limit para guild* e coop*', () => {
  beforeEach(() => resetRateLimits());
  afterEach(() => resetRateLimits());
  it('guild: 60 leituras por minuto passam, a 61ª é 429 com Retry-After', async () => {
    const e = novoEnv();
    for (let i = 0; i < 60; i++) {
      const r = await chamar(e, 'guild', { params: { id: ANA }, ip: '203.0.113.9' });
      expect(r.status, `chamada ${i + 1}`).toBe(200);
    }
    const r = await chamar(e, 'guild', { params: { id: ANA }, ip: '203.0.113.9' });
    expect(r.status).toBe(429);
    expect((await r.json()).error).toBe('rate limited');
    expect(r.headers.get('Retry-After')).toBeTruthy();
  });
  it('coop* em community.js: passa das 20/min da classe PESADA (é LEVE, 120)', async () => {
    const e = novoEnv();
    for (const action of ['coop', 'coopCheckin', 'coopLeave']) {
      resetRateLimits();
      for (let i = 0; i < 25; i++) {
        const method = action === 'coop' ? 'GET' : 'POST';
        const qs = new URLSearchParams({ action, ...(method === 'GET' ? { id: ANA } : {}) });
        const r = await community({ request: new Request(`https://x.dev/api/community?${qs}`, { method, headers: { 'CF-Connecting-IP': '203.0.113.7' }, body: method === 'POST' ? JSON.stringify({ id: ANA }) : undefined }), env: e });
        expect(r.status, `${action} #${i + 1}`).not.toBe(429);
      }
    }
  });
});

describe('M13 — código de convite colidido é re-sorteado, nunca roubado', () => {
  afterEach(() => vi.restoreAllMocks());
  it('primeiro sorteio cai num código em uso → outro código, e o antigo segue do dono', async () => {
    const e = novoEnv();
    e.DIGIAPP_SAVES.store.set(coopCodeKey('AAAAAAAA'), 'dono-antigo-000000000000');
    // Byte 0 → 'A' no alfabeto: o 1º sorteio é exatamente 'AAAAAAAA'.
    const real = crypto.getRandomValues.bind(crypto);
    let primeira = true;
    vi.spyOn(crypto, 'getRandomValues').mockImplementation(arr => {
      if (primeira && arr.length === 8) { primeira = false; arr.fill(0); return arr; }
      return real(arr);
    });
    const g = await criar(e);
    expect(primeira).toBe(false);
    expect(g.code).not.toBe('AAAAAAAA');
    expect(e.DIGIAPP_SAVES.store.get(coopCodeKey('AAAAAAAA'))).toBe('dono-antigo-000000000000');
  });
});

describe('ALTO-1 — o dia é o DO JOGADOR (dayKey a ±1 do UTC)', () => {
  afterEach(() => vi.useRealTimers());
  it('22:30 BRT e 20:00 BRT do dia seguinte contam DOIS dias, não um', async () => {
    const e = novoEnv();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T01:30:00Z')); // 22:30 de terça (29) em BRT
    await criar(e);
    let g = (await (await post(e, 'guildCheckin', { id: ANA, dayKey: 'Tue Sep 29 2026' })).json()).guild;
    expect(g.mine.cameToday).toBe(true);
    vi.setSystemTime(new Date('2026-09-30T23:00:00Z')); // 20:00 de quarta (30) em BRT
    g = (await (await chamar(e, 'guild', { params: { id: ANA, dayKey: 'Wed Sep 30 2026' } })).json()).guild;
    expect(g.mine.cameToday).toBe(false); // o botão NÃO some: é outro dia do jogador
    g = (await (await post(e, 'guildCheckin', { id: ANA, dayKey: 'Wed Sep 30 2026' })).json()).guild;
    expect(g.progress).toBe(2);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopCkKey(g.id, ANA))).days).toEqual(['2026-09-29', '2026-09-30']);
  });
  it('domingo 22h BRT (segunda UTC) conta na semana do DOMINGO', async () => {
    const e = novoEnv();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-28T01:00:00Z')); // domingo 27, 22:00 BRT
    await criar(e);
    const g = (await (await post(e, 'guildCheckin', { id: ANA, dayKey: '2026-09-27' })).json()).guild;
    expect(g.weekKey).toBe(semanaDe(new Date('2026-09-27T12:00:00Z')));
    expect(g.weekKey).not.toBe(semanaDe(new Date('2026-09-28T01:00:00Z')));
    expect(g.progress).toBe(1);
  });
  it('dia fora de ±1 do UTC, ou mal formado → 400 invalid day, nada gravado', async () => {
    const e = novoEnv();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
    const g = await criar(e);
    for (const dayKey of ['2026-10-02', 'Sun Sep 27 2026', '2026-02-30', 'ontem', '2026-9-30']) {
      const r = await post(e, 'guildCheckin', { id: ANA, dayKey });
      expect(r.status, dayKey).toBe(400);
      expect((await r.json()).error).toBe('invalid day');
    }
    expect(e.DIGIAPP_SAVES.store.has(coopCkKey(g.id, ANA))).toBe(false);
  });
  it('trocar o formato do mesmo dia não rende dois check-ins', async () => {
    const e = novoEnv();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-30T12:00:00Z'));
    await criar(e);
    await post(e, 'guildCheckin', { id: ANA, dayKey: 'Wed Sep 30 2026' });
    const g = (await (await post(e, 'guildCheckin', { id: ANA, dayKey: '2026-09-30' })).json()).guild;
    expect(g.progress).toBe(1);
  });
});

describe('ALTO-2 — dois toques em "criar" no mesmo instante', () => {
  it('fica UMA guilda, um código, o ponteiro aponta para ela; o outro toque é 409 com a vista', async () => {
    const e = novoEnv();
    comAtraso(e.DIGIAPP_SAVES);
    const [r1, r2] = await Promise.all([
      post(e, 'guildCreate', { id: ANA, name: 'Roda' }),
      post(e, 'guildCreate', { id: ANA, name: 'Roda' }),
    ]);
    const status = [r1.status, r2.status].sort();
    expect(status).toEqual([200, 409]);
    const blobs = [...e.DIGIAPP_SAVES.store.keys()].filter(k => /^coop:/.test(k));
    const codigos = [...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith('coopCode:'));
    expect(blobs).toHaveLength(1);
    expect(codigos).toHaveLength(1);
    const gid = blobs[0].slice('coop:'.length);
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(ANA))).toBe(gid);
    const perdedor = await (r1.status === 409 ? r1 : r2).json();
    expect(perdedor.error).toBe('already in a guild');
    expect(perdedor.guild.id).toBe(gid);
  });
});

describe('MÉDIO-2 — sair × entrar ao mesmo tempo', () => {
  /** Simula a entrada de `quem` COMPLETANDO dentro da janela da saída: o que a
   *  gravação de `coopJoin` deixaria no KV (membro no blob + ponteiro). */
  function injetarEntrada(kv, gid, quem) {
    const g = JSON.parse(kv.store.get(coopKey(gid)));
    g.members.push(quem);
    kv.store.set(coopKey(gid), JSON.stringify(g));
    kv.store.set(coopOfKey(quem), gid);
  }

  it('2+ membros: a entrada que acontece no meio da saída NÃO é apagada', async () => {
    const e = novoEnv();
    const g = await criar(e);
    await post(e, 'guildJoin', { id: BIA, code: g.code });
    const kv = e.DIGIAPP_SAVES;
    const del = kv.delete;
    // A saída já leu o grupo; a entrada de CAU termina logo depois.
    kv.delete = async k => { if (k === coopOfKey(ANA)) injetarEntrada(kv, g.id, CAU); return del(k); };
    expect((await post(e, 'guildLeave', { id: ANA })).status).toBe(200);
    const membros = JSON.parse(kv.store.get(coopKey(g.id))).members;
    expect(membros).toEqual([BIA, CAU]);
  });

  it('membro único: a saída não apaga a guilda em que alguém acabou de entrar', async () => {
    const e = novoEnv();
    const g = await criar(e);
    const kv = e.DIGIAPP_SAVES;
    const get = kv.get;
    let leituras = 0;
    // A entrada de BIA termina DEPOIS da releitura da saída (2ª leitura do blob).
    kv.get = async k => {
      const v = await get(k);
      if (k === coopKey(g.id) && ++leituras === 2) injetarEntrada(kv, g.id, BIA);
      return v;
    };
    expect((await post(e, 'guildLeave', { id: ANA })).status).toBe(200);
    kv.get = get;
    const dela = await grupoDe(e, BIA);
    expect(dela, 'BIA recebeu "você entrou" e a guilda evaporou').not.toBeNull();
    expect(dela.members).toEqual([BIA]);
    expect(dela.hostSave).toBe(BIA);
    expect(kv.store.get(coopCodeKey(g.code))).toBe(g.id);
    expect(await grupoDe(e, ANA)).toBeNull();
  });

  it('corrida real (Promise.all): quem recebeu 200 continua numa guilda viva', async () => {
    const e = novoEnv();
    const g = await criar(e);
    comAtraso(e.DIGIAPP_SAVES);
    const [entrou] = await Promise.all([
      post(e, 'guildJoin', { id: BIA, code: g.code }),
      post(e, 'guildLeave', { id: ANA }),
    ]);
    if (entrou.status === 200) expect(await grupoDe(e, BIA)).not.toBeNull();
    else expect(e.DIGIAPP_SAVES.store.has(coopOfKey(BIA))).toBe(false);
    expect(await grupoDe(e, ANA)).toBeNull();
  });
});

describe('toda ação da Guilda exige o dono autenticado', () => {
  it('sem token → 401/403 e o KV não é tocado, em TODAS as ações de GUILD_ACTIONS', async () => {
    const { GUILD_ACTIONS } = await import('./guild.js');
    for (const [action, method] of Object.entries(GUILD_ACTIONS)) {
      const e = { ...novoEnv(), FIREBASE_PROJECT_ID: 'soulmon-test' };
      const antes = new Map(e.DIGIAPP_SAVES.store);
      const r = await chamar(e, action, { method, body: { id: ANA, name: 'Roda', code: 'ABCDEFGH' }, params: method === 'GET' ? { id: ANA } : {} });
      expect([401, 403], `${action} devolveu ${r.status}`).toContain(r.status);
      expect(e.DIGIAPP_SAVES.store).toEqual(antes);
    }
  });
});
