/**
 * O PUSH DE COCÔ COM O APP FECHADO (REGISTRO §144): o cliente manda a AGENDA DO DIA
 * (`poop = { d, tz, t: [[slot, instante]] }`) na inscrição e o worker dispara na passada
 * de 30 min. Aqui se prova, com o worker REAL e o planejador REAL do cliente:
 *  · validação/sanitização do campo (`agendaCocoDeInscricao`) e as duas rotas de inscrição;
 *  · orçamento: nunca passa de PUSH_DAILY_CAP em 48 passadas x 5 fusos com cocô agendado;
 *  · idempotência (cada instante cai em UMA passada; tag = a do alarme local do APK);
 *  · nunca dormindo, nunca no D0, expira com o dia, nunca antes do instante;
 *  · compatibilidade: inscrição antiga sem o campo segue igual e o campo novo é aditivo.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import worker, { poopNotifFor, mealNotifFor } from './push-scheduler.js';
import { MEAL_TICK_CRON, PUSH_DAILY_CAP, DEFAULT_MEAL_TIMES, mealMinutes } from '../functions/api/_mealRhythm.js';
import { PUSH_HOURS_UTC, poopPushCopy } from '../functions/api/_pushCopy.js';
import { agendaCocoDeInscricao, POOP_AGENDA_MAX, suprimidosDeInscricao } from '../functions/api/_pushIdentity.js';
import { onRequestPost as subscribePost } from '../functions/api/subscribe.js';
import { onRequestPost as fcmPost } from '../functions/api/fcm-subscribe.js';
import {
  ledgerWithPlan, localDayKey, planDayPushes, rollLedger, serverPoopPayload, serverSkipPayload,
} from '../src/utils/petPushEvents';

const H = 3600_000;
const MIN = 60_000;

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', cursor, limit = 100 } = {}) => {
      const all = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const start = cursor ? all.indexOf(cursor) : 0;
      const page = all.slice(start, start + limit);
      const next = start + limit < all.length ? all[start + limit] : undefined;
      return { keys: page.map(name => ({ name })), cursor: next, list_complete: !next };
    },
  };
}

let SUB_KEYS;
let VAPID;
const TZ_ORIGINAL = process.env.TZ;
beforeAll(async () => {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  SUB_KEYS = { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  VAPID = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (TZ_ORIGINAL === undefined) delete process.env.TZ; else process.env.TZ = TZ_ORIGINAL;
});

// 12/10/2026, BRT (-180).
const TZ_BRT = -180;
const brt = (h, m = 0) => Date.UTC(2026, 9, 12, h + 3, m);
const AGORA = brt(8);

describe('agendaCocoDeInscricao: validação e sanitização', () => {
  const ok = { d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(9, 47)], [1, brt(18, 10)]] };
  it('aceita a agenda do dia e devolve só instantes ordenados', () => {
    expect(agendaCocoDeInscricao({ ...ok, t: [[1, brt(18, 10)], [0, brt(9, 47)]] }, AGORA)).toEqual(ok);
  });
  it('lixo descarta o campo inteiro (= sem push de cocô com o app fechado)', () => {
    const lixos = [null, 'x', [], {}, { ...ok, d: 'hoje' }, { ...ok, tz: 7 }, { ...ok, tz: 900 }, { ...ok, t: [] }, { ...ok, t: 'x' },
      { ...ok, t: Array.from({ length: 9 }, (_, i) => [i % 4, brt(9)]) }, { ...ok, d: '2026-10-20' }];
    for (const v of lixos) expect(agendaCocoDeInscricao(v, AGORA)).toBeUndefined();
  });
  it('descarta o par torto sem derrubar o resto; slot repetido e instante fora do dia caem', () => {
    const r = agendaCocoDeInscricao({ ...ok, t: [[0, brt(9, 47)], [0, brt(11)], [9, brt(12)], ['a', 1], [2, brt(9) + 2 * 24 * H], [1, '2026'], 'x', [3, 1.5]] }, AGORA);
    expect(r).toEqual({ d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(9, 47)]] });
  });
  it('limite de tamanho: no maximo POOP_AGENDA_MAX (2) por dia, e isso cabe no teto', () => {
    const r = agendaCocoDeInscricao({ ...ok, t: [[0, brt(8)], [1, brt(12)], [2, brt(16)], [3, brt(18)]] }, AGORA);
    expect(r.t).toHaveLength(POOP_AGENDA_MAX);
    expect(POOP_AGENDA_MAX).toBeLessThan(PUSH_DAILY_CAP);
  });
  it('nao guarda nada alem do dia, do fuso e dos instantes (sem dado pessoal)', () => {
    const r = agendaCocoDeInscricao({ ...ok, nome: 'Fulano', email: 'a@b.c' }, AGORA);
    expect(Object.keys(r).sort()).toEqual(['d', 't', 'tz']);
    expect(r.t.every(p => p.length === 2 && p.every(Number.isInteger))).toBe(true);
  });
});

describe('as rotas de inscricao gravam o campo, e o apagam quando ele para de vir', () => {
  const agenda = () => {
    const d = new Date(Date.now() + TZ_BRT * MIN).toISOString().slice(0, 10);
    const base = Date.parse(`${d}T00:00:00Z`) - TZ_BRT * MIN;
    return { d, tz: TZ_BRT, t: [[0, base + 9 * H], [1, base + 18 * H]] };
  };
  const reqOf = (url, body, ip) => new Request(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body),
  });
  const TOKEN = `dQw4w9WgXcQ:APA91b${'H'.padEnd(140, 'x')}`;

  it('Web Push: grava `poop`, e a reinscricao SEM o campo (toggle desligado) o remove', async () => {
    const kv = fakeKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };
    const corpo = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: { p256dh: 'BEl'.padEnd(87, 'A'), auth: 'c2VncmVkbzE2Ynl0ZQ' }, petName: 'Bito', language: 'pt-BR',
    };
    const a = agenda();
    expect((await subscribePost({ request: reqOf('https://x.dev/api/subscribe', { ...corpo, poop: a }, '198.51.100.1'), env })).status).toBe(201);
    const [k] = [...kv.store.keys()];
    expect(JSON.parse(kv.store.get(k)).poop).toEqual(a);
    await subscribePost({ request: reqOf('https://x.dev/api/subscribe', corpo, '198.51.100.1'), env });
    expect(JSON.parse(kv.store.get(k)).poop).toBeUndefined();
    await subscribePost({ request: reqOf('https://x.dev/api/subscribe', { ...corpo, poop: { d: 'x' } }, '198.51.100.1'), env });
    expect(JSON.parse(kv.store.get(k)).poop).toBeUndefined();
  });

  it('FCM: mesma regra', async () => {
    const kv = fakeKV();
    const env = { PUSH_SUBSCRIPTIONS: kv };
    const a = agenda();
    const res = await fcmPost({ request: reqOf('https://x.dev/api/fcm-subscribe', { token: TOKEN, petName: 'Bito', language: 'en-US', poop: a }, '198.51.100.2'), env });
    expect(res.status).toBe(201);
    const [k] = [...kv.store.keys()];
    expect(JSON.parse(kv.store.get(k)).poop).toEqual(a);
    await fcmPost({ request: reqOf('https://x.dev/api/fcm-subscribe', { token: TOKEN, petName: 'Bito', language: 'en-US' }, '198.51.100.2'), env });
    expect(JSON.parse(kv.store.get(k)).poop).toBeUndefined();
  });
});

describe('poopNotifFor: o worker dispara no horario agendado', () => {
  const sub = over => ({
    petName: 'Bito', language: 'pt-BR', bornAt: '2026-09-01',
    poop: { d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(9, 47)], [1, brt(18, 10)]] }, ...over,
  });
  const passada = (h, m) => new Date(brt(h, m));

  it('sai na 1a passada EM OU DEPOIS do instante (nunca antes) e em UMA passada so', () => {
    const disparos = [];
    for (let t = brt(0); t < brt(24); t += 30 * MIN) {
      if (poopNotifFor(sub(), new Date(t))) disparos.push(new Date(t - 3 * H).toISOString().slice(11, 16));
    }
    expect(disparos).toEqual(['10:00', '18:30']);
  });
  it('instante exatamente na passada sai nela', () => {
    const s = sub({ poop: { d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(9, 30)]] } });
    expect(poopNotifFor(s, passada(9, 30))).not.toBeNull();
    expect(poopNotifFor(s, passada(10, 0))).toBeNull();
  });
  it('a tag e a do alarme local do APK e do aviso de dentro do app (poop-event-<slot>): o SO funde', () => {
    expect(poopNotifFor(sub(), passada(10, 0)).tag).toBe('poop-event-0');
    expect(poopNotifFor(sub(), passada(18, 30)).tag).toBe('poop-event-1');
    expect(poopNotifFor(sub(), passada(10, 0))).toEqual(poopPushCopy('Bito', 'pt-BR', 0));
  });
  it('reexecutar a mesma passada devolve exatamente a mesma notificacao (idempotente)', () => {
    expect(poopNotifFor(sub(), passada(10, 0))).toEqual(poopNotifFor(sub(), passada(10, 0)));
  });
  it('copy so de convite: sem culpa, medo nem cobranca', () => {
    for (const lang of ['pt-BR', 'en-US']) {
      const n = poopNotifFor(sub({ language: lang }), passada(10, 0));
      expect(`${n.title} ${n.body}`).not.toMatch(/(culpa|doente|morr|abandon|esquec|urgente|corra|sick|die|forgot|hurry|neglect|you must)/i);
    }
  });
  it('agenda de OUTRO dia local expirou: nao dispara', () => {
    expect(poopNotifFor(sub(), new Date(brt(10, 0) + 24 * H))).toBeNull();
    expect(poopNotifFor(sub(), new Date(brt(10, 0) - 24 * H))).toBeNull();
  });
  it('nunca dormindo: meals.rest e, so com `sleep`, 10 h a partir do inicio', () => {
    const noite = { poop: { d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(23, 30)]] } };
    const comRest = sub({ ...noite, meals: { t: mealMinutes(DEFAULT_MEAL_TIMES), tz: TZ_BRT, rest: [1380, 420] } });
    expect(poopNotifFor(comRest, passada(23, 30))).toBeNull();
    expect(poopNotifFor(sub({ ...noite, sleep: { s: 1380, tz: TZ_BRT } }), passada(23, 30))).toBeNull();
    expect(poopNotifFor({ ...comRest, poop: { d: '2026-10-12', tz: TZ_BRT, t: [[0, brt(9, 30)]] } }, passada(9, 30))).not.toBeNull();
  });
  it('D0 (nascimento hoje) nunca recebe', () => {
    expect(poopNotifFor(sub({ bornAt: '2026-10-12' }), passada(10, 0))).toBeNull();
  });
  it('inscricao ANTIGA (sem o campo) e campo torto: nada de coco; o campo novo e aditivo para o resto', () => {
    expect(poopNotifFor({ petName: 'Bito', language: 'pt-BR' }, passada(10, 0))).toBeNull();
    expect(poopNotifFor(sub({ poop: 'lixo' }), passada(10, 0))).toBeNull();
    const m = { petName: 'Bito', language: 'en-US', bornAt: '2026-09-01', meals: { t: mealMinutes(DEFAULT_MEAL_TIMES), tz: TZ_BRT } };
    const almoco = new Date(Date.UTC(2026, 9, 12, 16, 30));
    expect(mealNotifFor({ ...m, poop: sub().poop }, almoco)).toEqual(mealNotifFor(m, almoco));
    expect(mealNotifFor(m, almoco)).not.toBeNull();
  });
  it('coco nao e cortavel pelo `x` (a maior prioridade): o validador nem aceita a chave', () => {
    expect(suprimidosDeInscricao({ d: '2026-10-12', k: ['poop'] })).toBeUndefined();
    expect(poopNotifFor(sub({ x: { d: '2026-10-12', k: ['lunch'] } }), passada(10, 0))).not.toBeNull();
  });
});

const FUSOS = [
  ['America/Sao_Paulo', 'BRT'], ['Asia/Tokyo', 'Toquio +9'], ['America/New_York', 'Nova York'],
  ['Asia/Kolkata', 'India +5:30'], ['Pacific/Auckland', 'Auckland +13'],
];
const REST_MIN = [1380, 420];
const REST = { start: '23:00', end: '07:00' };

/** 48 passadas: o cliente replaneja, manda `x` + `poop`; o worker REAL entrega. */
async function viverUmDia(zone, cenario) {
  process.env.TZ = zone;
  const dayStart = new Date(2026, 9, 12, 0, 0, 0, 0).getTime();
  const at = h => dayStart + h * H;
  const tz = -new Date(dayStart).getTimezoneOffset();
  const day = localDayKey(dayStart);
  const base = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: SUB_KEYS, petName: 'Bito', language: 'en-US', bornAt: '2026-09-01',
    meals: { t: mealMinutes(DEFAULT_MEAL_TIMES), tz, rest: REST_MIN }, sleep: { s: REST_MIN[0], tz },
  };
  const kv = fakeKV({ 'push:1': JSON.stringify(base) });
  const env = { PUSH_SUBSCRIPTIONS: kv, VAPID_JWK: VAPID };
  let enviados = 0;
  vi.stubGlobal('fetch', vi.fn(async () => { enviados++; return new Response('', { status: 201 }); }));
  const sched = cenario.poop;
  let ledger;
  let poopsDoWorker = 0;
  // `fechaAs` (horas): o app FECHA e a inscricao fica congelada no que o cliente mandou por ultimo — o worker
  // sozinho entrega o resto do dia; os eventos de hora (alarme local do APK) vem do ultimo plano.
  const fechaTick = (cenario.fechaAs ?? 24) * 2;
  let registro;
  let ultimoPlano;
  let ledgerAoFechar;
  for (let i = 0; i < 48; i++) {
    const t = dayStart + i * 30 * MIN;
    if (i < fechaTick) {
    ledger = rollLedger(ledger, t - MIN);
    const plano = planDayPushes({
      nowMs: t - MIN, petName: 'Bito', language: 'en-US', enabled: true, isSleeping: false, ageDays: 20, restWindow: REST,
      mealRhythm: { push: true, inApp: true, times: { ...DEFAULT_MEAL_TIMES } }, sleepReminderOn: true,
      state: {
        hunger: cenario.calmo ? undefined : { v: 100, at: at(7) },
        energyPoints: cenario.calmo ? 8 : 4, energyClock: { at: dayStart, carry: 0 }, evolutionStage: 'rookie',
        poopEventsScheduled: sched, poopEventsShown: sched.map((s, k) => (s <= t - MIN ? k : -1)).filter(k => k >= 0), foodCount: 3,
      },
      ledger,
    });
    ledger = ledgerWithPlan(ledger, plano, t - MIN);
    ultimoPlano = plano;
    ledgerAoFechar = ledger;
    const x = suprimidosDeInscricao(serverSkipPayload(plano) ?? undefined);
    const poop = agendaCocoDeInscricao(serverPoopPayload(plano, tz) ?? undefined, t - MIN);
    registro = { ...base, ...(x ? { x } : {}), ...(poop ? { poop } : {}) };
    kv.store.set('push:1', JSON.stringify(registro));
    }
    if (poopNotifFor(registro, new Date(t))) poopsDoWorker++;
    await worker.scheduled({ scheduledTime: t, cron: MEAL_TICK_CRON }, env);
    const d = new Date(t);
    if (d.getUTCMinutes() === 0 && PUSH_HOURS_UTC.includes(d.getUTCHours())) {
      await worker.scheduled({ scheduledTime: t, cron: `0 ${d.getUTCHours()} * * *` }, env);
    }
  }
  const tipos = new Set(['poop', 'hunger', 'energyFull', 'progress']);
  let eventos;
  if (fechaTick >= 48) {
    ledger = rollLedger(ledger, dayStart + 24 * H - 1);
    eventos = (ledger.day === day ? ledger.fired : []).length;
  } else {
    // app fechado: o que ja saiu + o que o ultimo plano deixou agendado (alarme local do APK)
    eventos = ledgerAoFechar.fired.length + ultimoPlano.kept.filter(p => tipos.has(p.kind)).length;
  }
  // o coco que o worker mandou E um dos eventos do ledger (mesma tag): conta uma vez so
  return { enviados, poopsDoWorker, eventos, total: enviados + eventos - poopsDoWorker };
}

describe.each(FUSOS)('orcamento com coco agendado e o worker real: %s', (zone, nome) => {
  it(`${nome}: dia CHEIO (coco x2 + fome + energia): os 2 cocos chegam do worker, total <= ${PUSH_DAILY_CAP}`, async () => {
    process.env.TZ = zone;
    const sched = [new Date(2026, 9, 12, 9, 47).getTime(), new Date(2026, 9, 12, 18, 10).getTime()];
    const r = await viverUmDia(zone, { poop: sched, fechaAs: 8 });
    expect(r.poopsDoWorker).toBe(2);
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });
  it(`${nome}: dia CALMO: 2 cocos + o que sobra do teto, total <= ${PUSH_DAILY_CAP}`, async () => {
    process.env.TZ = zone;
    const sched = [new Date(2026, 9, 12, 10).getTime(), new Date(2026, 9, 12, 18).getTime()];
    const r = await viverUmDia(zone, { calmo: true, poop: sched, fechaAs: 8 });
    expect(r.poopsDoWorker).toBe(2);
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });
  it(`${nome}: app SEMPRE aberto (cocos alinhados): o worker repete o cocô com a MESMA tag e o total conta uma vez`, async () => {
    process.env.TZ = zone;
    const sched = [new Date(2026, 9, 12, 10).getTime(), new Date(2026, 9, 12, 18).getTime()];
    const r = await viverUmDia(zone, { calmo: true, poop: sched });
    expect(r.poopsDoWorker).toBe(2);
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });
  it(`${nome}: coco e refeicao na MESMA passada: os dois saem e o teto vale`, async () => {
    process.env.TZ = zone;
    const sched = [new Date(2026, 9, 12, 13, 30).getTime(), new Date(2026, 9, 12, 20).getTime()];
    const r = await viverUmDia(zone, { calmo: true, poop: sched, fechaAs: 8 });
    expect(r.poopsDoWorker).toBe(2);
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });
});
