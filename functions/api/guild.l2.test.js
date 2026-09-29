import { describe, it, expect, afterEach, vi } from 'vitest';
import { coopHitKey, semanaDe, coopKey, coopOfKey, coopCodeKey, lerGrupo, fecharDiasDoBosque, firmarFio, idOpacoDoMembro } from './_coop.js';
import { onRequest as community } from './community.js';
import { onRequest } from './guild.js';

/**
 * Revisão adversarial L2 do backend da Guilda (`docs/reviews/guilda/qa/L2-backend.md`):
 * um teste por achado fechado, pelo comportamento.
 */

/** KV em memória que CONTA leituras/escritas/exclusões (orçamento, A3). */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  const conta = { get: 0, put: 0, delete: 0 };
  return {
    store, puts, conta,
    zerar() { conta.get = 0; conta.put = 0; conta.delete = 0; puts.length = 0; },
    get: async k => {
      if (Array.isArray(k)) { conta.get += k.length; return new Map(k.map(x => [x, store.get(x) ?? null])); }
      conta.get++; return store.get(k) ?? null;
    },
    put: async (k, v, opts) => { conta.put++; puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { conta.delete++; store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, stage: 'rookie', friends: [], ...extra });
function req(action, { method = 'POST', body, params = {} } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const MEMBROS = Array.from({ length: 12 }, (_, i) => sid(`m${String(i).padStart(2, '0')}`));

/** Uma guilda de `n` membros (de `MEMBROS`), criada pelas rotas. */
async function guildaDe(n) {
  const seed = {};
  MEMBROS.forEach((m, i) => { seed[`profile:${m}`] = perfil(m, `Nome${i}`); });
  const e = { DIGIAPP_SAVES: fakeKV(seed) };
  const g = (await (await chamar(e, 'guildCreate', { body: { id: MEMBROS[0], name: 'Roda' } })).json()).guild;
  for (const m of MEMBROS.slice(1, n)) await chamar(e, 'guildJoin', { body: { id: m, code: g.code } });
  return { e, gid: g.id, code: g.code };
}

afterEach(() => vi.useRealTimers());
const em = iso => vi.setSystemTime(new Date(iso));
const [A, B, C] = MEMBROS;

describe('A1 — o dia só fecha quando terminou em todos os fusos', () => {
  it('membro em UTC+9 abrindo depois da meia-noite dele NÃO fecha o dia dos que ainda estão nele', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    em('2026-09-01T10:00:00Z');
    const { e, gid } = await guildaDe(3);
    await chamar(e, 'guildThread', { body: { id: A, kind: 'fio', dayKey: '2026-09-01' } });
    // 20:00 UTC: em UTC+9 já é dia 2. C abre a vista com o dia dele.
    em('2026-09-01T20:00:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: C, dayKey: '2026-09-02' } });
    // 02:00 UTC do dia 2 = 23:00 do dia 1 em UTC−3: B firma o dia 1.
    em('2026-09-02T02:00:00Z');
    await chamar(e, 'guildThread', { body: { id: B, kind: 'fio', dayKey: 'Tue Sep 01 2026' } });
    // C volta de manhã (dia 3 dele) — ainda NÃO fecha o dia 1.
    em('2026-09-02T23:30:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: C, dayKey: '2026-09-03' } });
    expect((await lerGrupo(e, gid)).bosqueProgress ?? 0).toBe(0);
    em('2026-09-03T12:00:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: A } });
    // 2 de 3 no dia 1 — não 1 de 3 (0,083 do PoC era 1 de 12).
    expect((await lerGrupo(e, gid)).bosqueProgress).toBeCloseTo(2 / 3, 9);
  });
});

describe('A4 — a vista não entrega o pid público de ninguém', () => {
  it('nenhum pid sai; o id opaco não abre community?action=player', async () => {
    const { e, gid } = await guildaDe(3);
    const txt = await (await chamar(e, 'guild', { method: 'GET', params: { id: A } })).text();
    const v = JSON.parse(txt).guild;
    for (const m of MEMBROS.slice(0, 3)) {
      const pid = JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${m}`)).pid;
      expect(txt).not.toContain(pid);
    }
    expect(txt).not.toContain('"pid"');
    for (const m of v.members) {
      expect(m.id).toBe(m.memberId);
      expect(m.memberId).toMatch(/^[0-9a-f]{16}$/);
      const r = await (await community({ request: new Request(`https://x.dev/api/community?action=player&id=${m.memberId}`), env: e })).json();
      expect(JSON.stringify(r)).not.toMatch(/rookie|stage|friends/);
    }
    expect(v.presence.map(p => p.memberId)).toEqual(v.members.map(m => m.memberId));
    // Estável na guilda, diferente entre guildas.
    expect(v.members.find(m => m.euMesmo).memberId).toBe(await idOpacoDoMembro(e, gid, A));
    expect(await idOpacoDoMembro(e, 'outraGuilda', A)).not.toBe(await idOpacoDoMembro(e, gid, A));
  });
});

describe('A2 — sair e voltar não infla o Bosque (1 fio por pessoa por dia)', () => {
  it('12 membros, só A firma: 100 voltas de sair→entrar→firmar no mesmo dia valem 1/12, não ~0,90', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    em('2026-09-01T12:00:00Z');
    const { e, gid, code } = await guildaDe(12);
    // A não é o anfitrião nesta volta (quem sai é A; o código continua valendo).
    const X = MEMBROS[5];
    await chamar(e, 'guildThread', { body: { id: X, kind: 'fio' } });
    for (let k = 0; k < 100; k++) {
      await chamar(e, 'guildLeave', { body: { id: X } });
      expect((await chamar(e, 'guildJoin', { body: { id: X, code } })).status).toBe(200);
      await chamar(e, 'guildThread', { body: { id: X, kind: 'fio' } });
    }
    const blob = await lerGrupo(e, gid);
    expect(blob.fiosAvulsos['2026-09-01']).toHaveLength(1);
    em('2026-09-03T12:00:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: A } });
    expect((await lerGrupo(e, gid)).bosqueProgress).toBeCloseTo(1 / 12, 9);
  }, 30_000);

  it('puro: avulso e membro com o MESMO id contam uma vez; teto de 1,0 por dia', () => {
    const g = { id: 'g', members: ['a', 'b'], desde: {}, bosqueProgress: 0, progressDay: '2026-01-01', fiosAvulsos: { '2026-01-02': ['ta', 'tz'] } };
    const fios = { a: firmarFio(null, '2026-01-02'), b: null };
    fecharDiasDoBosque(g, fios, '2026-01-03', { a: 'ta', b: 'tb' });
    // roda = {ta, tz, tb} = 3; firmados = {ta, tz} = 2.
    expect(g.bosqueProgress).toBeCloseTo(2 / 3, 9);
  });

  it('teto: firmados > roda (formato antigo inconsistente) nunca soma mais de 1,0 no dia', () => {
    // Avulsos numéricos antigos + os dois membros firmando: 4 de 4 = 1,0, e o
    // teto segura mesmo se a roda encolher por viajante.
    const g = { id: 'g', members: ['a'], desde: { a: '2025-01-01' }, bosqueProgress: 0, progressDay: '2026-01-01', fiosAvulsos: { '2026-01-02': 3 } };
    fecharDiasDoBosque(g, { a: firmarFio(null, '2026-01-02') }, '2026-01-03');
    expect(g.bosqueProgress).toBeCloseTo(1, 9);
  });
});

describe('M1 — progress não reconstrói "N de M vieram hoje"', () => {
  it('com 5+ membros progress é null em qualquer hora do dia; com ≤4 segue o número', async () => {
    const cinco = await guildaDe(5);
    const antes = (await (await chamar(cinco.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    for (const m of MEMBROS.slice(0, 3)) await chamar(cinco.e, 'guildCheckin', { body: { id: m } });
    const depois = (await (await chamar(cinco.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    expect(antes.progress).toBeNull();
    expect(depois.progress).toBeNull();
    const quatro = await guildaDe(4);
    await chamar(quatro.e, 'guildCheckin', { body: { id: A } });
    expect((await (await chamar(quatro.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild.progress).toBe(1);
  });
});

describe('M2 — guildJoin relê antes de gravar e não ressuscita quem saiu', () => {
  it('a cópia velha do blob (com B, que já saiu) não volta a ser gravada', async () => {
    const { e, gid, code } = await guildaDe(3);
    const velho = e.DIGIAPP_SAVES.store.get(coopKey(gid));
    await chamar(e, 'guildLeave', { body: { id: B } });
    // A PRIMEIRA leitura do blob devolve a versão de antes da saída (KV
    // eventualmente consistente); as seguintes, a verdadeira.
    const kv = e.DIGIAPP_SAVES;
    const get = kv.get;
    let servido = false;
    kv.get = async k => { if (k === coopKey(gid) && !servido) { servido = true; return velho; } return get(k); };
    const D = MEMBROS[3];
    expect((await chamar(e, 'guildJoin', { body: { id: D, code } })).status).toBe(200);
    kv.get = get;
    const g = await lerGrupo(e, gid);
    expect(g.members).toContain(D);
    expect(g.members).not.toContain(B);
    expect(kv.store.has(coopOfKey(B))).toBe(false);
  });
});

describe('B4 — grupo órfão de criação dupla não recebe ninguém', () => {
  it('código de um blob sem ponteiro de volta: 404 e o órfão some', async () => {
    const { e, gid, code } = await guildaDe(1);
    // Simula a intercalação A-grava/A-relê/B-grava/B-relê: o ponteiro do
    // anfitrião aponta para OUTRO grupo.
    e.DIGIAPP_SAVES.store.set(coopOfKey(A), 'outroGrupoQualquer0');
    const r = await chamar(e, 'guildJoin', { body: { id: B, code } });
    expect(r.status).toBe(404);
    expect(e.DIGIAPP_SAVES.store.has(coopKey(gid))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopCodeKey(code))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopOfKey(B))).toBe(false);
  });
});

describe('M5 — os golpes saem com a pessoa em toda saída', () => {
  it('saída comum apaga coopHit do titular (4 semanas) e não toca o de outro membro', async () => {
    const { e, gid } = await guildaDe(2);
    const agora = new Date();
    const semanas = [0, 1, 2, 3].map(k => semanaDe(new Date(agora.getTime() - k * 7 * 86400000)));
    for (const w of semanas) {
      e.DIGIAPP_SAVES.store.set(coopHitKey(gid, w, B), JSON.stringify({ week: w, days: [], dmg: 5 }));
      e.DIGIAPP_SAVES.store.set(coopHitKey(gid, w, A), JSON.stringify({ week: w, days: [], dmg: 5 }));
    }
    await chamar(e, 'guildLeave', { body: { id: B } });
    for (const w of semanas) {
      expect(e.DIGIAPP_SAVES.store.has(coopHitKey(gid, w, B))).toBe(false);
      expect(e.DIGIAPP_SAVES.store.has(coopHitKey(gid, w, A))).toBe(true);
    }
  });
});

describe('B1 — golpe na semana que já terminou', () => {
  it('segunda 13:00 UTC com dayKey de domingo: 409 raid closed; segunda 02:00 UTC ainda vale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    em('2026-09-27T12:00:00Z'); // domingo
    const { e } = await guildaDe(3);
    em('2026-09-28T02:00:00Z'); // segunda 02:00 UTC = domingo 23:00 em UTC−3
    expect((await chamar(e, 'guildRaidHit', { body: { id: A, dayKey: '2026-09-27' } })).status).toBe(200);
    em('2026-09-28T13:00:00Z');
    const r = await chamar(e, 'guildRaidHit', { body: { id: B, dayKey: '2026-09-27' } });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('raid closed');
    // A semana corrente segue aberta.
    expect((await chamar(e, 'guildRaidHit', { body: { id: B, dayKey: '2026-09-28' } })).status).toBe(200);
  });
});

describe('B5 — gesto numa roda de 2 não diz o tipo', () => {
  it('2 membros: gestures [] e gestureReceived true; 3 membros: o tipo sai', async () => {
    const dois = await guildaDe(2);
    await chamar(dois.e, 'guildGesture', { body: { id: B, kind: 'luz' } });
    const v2 = (await (await chamar(dois.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    expect(v2.gestures).toEqual([]);
    expect(v2.gestureReceived).toBe(true);
    const tres = await guildaDe(3);
    const v0 = (await (await chamar(tres.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    expect(v0.gestureReceived).toBeNull();
    await chamar(tres.e, 'guildGesture', { body: { id: B, kind: 'luz' } });
    const v3 = (await (await chamar(tres.e, 'guild', { method: 'GET', params: { id: A } })).json()).guild;
    expect(v3.gestures).toEqual(['luz']);
  });
});
