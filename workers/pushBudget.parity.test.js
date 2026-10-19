/**
 * O TETO DE 4 PUSHES/DIA com os pushes de EVENTO (REGISTRO §113): o worker REAL
 * varrendo as 48 passadas do dia em CINCO fusos + o planejador do cliente
 * (`src/utils/petPushEvents.ts`) decidindo o que fica e o que o worker deve calar
 * (campo `x` da inscrição).
 *
 * Total do dia = pushes que o worker mandou + eventos que dispararam (cocô, fome,
 * energia cheia, progresso). Prova: nunca passa de `PUSH_DAILY_CAP`.
 *
 * Por que aqui: o worker é deploy manual e o planejador sobe sozinho com o
 * cliente; este é o único lugar onde os dois se encontram (mesmo motivo de
 * `mealRhythm.parity.test.js`).
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import worker, { mealNotifFor, sleepNotifFor, suprimidoHoje } from './push-scheduler.js';
import { MEAL_TICK_CRON, PUSH_DAILY_CAP, DEFAULT_MEAL_TIMES, mealMinutes } from '../functions/api/_mealRhythm.js';
import { PUSH_HOURS_UTC } from '../functions/api/_pushCopy.js';
import { suprimidosDeInscricao } from '../functions/api/_pushIdentity.js';
import {
  ledgerWithPlan, localDayKey, planDayPushes, rollLedger, serverSkipPayload,
} from '../src/utils/petPushEvents';
import { HUNGER_FULL_TO_EMPTY_HOURS, HUNGER_MAX } from '../src/utils/hunger';

const H = 3600_000;
const DECAY = HUNGER_MAX / (HUNGER_FULL_TO_EMPTY_HOURS * H);

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
  if (TZ_ORIGINAL === undefined) delete process.env.TZ; else process.env.TZ = TZ_ORIGINAL;
});

const FUSOS = [
  ['America/Sao_Paulo', 'BRT'],
  ['Asia/Tokyo', 'Tóquio +9'],
  ['America/New_York', 'Nova York'],
  ['Asia/Kolkata', 'Índia +5:30'],
  ['Pacific/Auckland', 'Auckland +13'],
];
const REST_MIN = [1380, 420]; // 23:00–07:00
const REST = { start: '23:00', end: '07:00' };

/**
 * Um dia inteiro (48 passadas do cron de 30 min + as horas fixas) num fuso: a cada
 * passada o CLIENTE replaneja (ledger incluído), grava `x` na inscrição e o WORKER
 * REAL envia o que sobra. Devolve { worker, eventos, total, plano }.
 */
async function viverUmDia(zone, cenario) {
  process.env.TZ = zone;
  const dayStart = new Date(2026, 9, 12, 0, 0, 0, 0).getTime();
  const at = h => dayStart + h * H;
  const tz = -new Date(dayStart).getTimezoneOffset();
  const day = localDayKey(dayStart);

  const meals = cenario.meals === false ? undefined : { t: mealMinutes(DEFAULT_MEAL_TIMES), tz, rest: REST_MIN };
  const sleep = cenario.sleep === false ? undefined : { s: REST_MIN[0], tz };
  const baseSub = () => ({
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: SUB_KEYS, petName: 'Bito', language: 'en-US',
    bornAt: '2026-09-01', ...(meals ? { meals } : {}), ...(sleep ? { sleep } : {}),
  });
  const kv = fakeKV({ 'push:1': JSON.stringify(baseSub()) });
  const env = { PUSH_SUBSCRIPTIONS: kv, VAPID_JWK: VAPID };
  let enviadosWorker = 0;
  vi.stubGlobal('fetch', vi.fn(async () => { enviadosWorker++; return new Response('', { status: 201 }); }));

  const sched = cenario.poop ?? [at(9.5), at(18)];
  let ledger;
  let ultimoPlano;
  for (let i = 0; i < 48; i++) {
    const t = dayStart + i * 30 * 60_000;
    ledger = rollLedger(ledger, t - 60_000);
    // O cliente replaneja um minuto ANTES do tick do cron (um replano na própria hora já veria a refeição como "passada").
    ultimoPlano = planDayPushes({
      nowMs: t - 60_000, petName: 'Bito', language: 'en-US', enabled: true, isSleeping: false, ageDays: 20,
      restWindow: REST,
      mealRhythm: cenario.meals === false ? { push: false, inApp: true, times: { ...DEFAULT_MEAL_TIMES } } : { push: true, inApp: true, times: { ...DEFAULT_MEAL_TIMES } },
      sleepReminderOn: cenario.sleep !== false,
      state: {
        // dia cheio: a fome cruza 60 às ~12h36 e a energia enche às 08h; dia calmo: fome e energia estáveis
        hunger: cenario.calmo ? undefined : { v: 100, at: at(7) },
        energyPoints: cenario.calmo ? 8 : 4, energyClock: { at: dayStart, carry: 0 }, evolutionStage: 'rookie',
        poopEventsScheduled: sched, poopEventsShown: sched.map((s, k) => (s <= t - 60_000 ? k : -1)).filter(k => k >= 0),
        foodCount: 3,
      },
      ledger,
    });
    ledger = ledgerWithPlan(ledger, ultimoPlano, t - 60_000);
    // o cliente reenvia a inscrição com `x` (o servidor valida e guarda)
    const x = suprimidosDeInscricao(serverSkipPayload(ultimoPlano) ?? undefined);
    kv.store.set('push:1', JSON.stringify({ ...baseSub(), ...(x ? { x } : {}) }));

    await worker.scheduled({ scheduledTime: t, cron: MEAL_TICK_CRON }, env);
    const d = new Date(t);
    if (d.getUTCMinutes() === 0 && PUSH_HOURS_UTC.includes(d.getUTCHours())) {
      await worker.scheduled({ scheduledTime: t, cron: `0 ${d.getUTCHours()} * * *` }, env);
    }
  }
  ledger = rollLedger(ledger, dayStart + 24 * H - 1);
  // eventos que dispararam = os ids de evento do ledger do dia (a virada os promoveu ao passar da hora)
  const eventos = (ledger.day === day ? ledger.fired : []).length;
  return { worker: enviadosWorker, eventos, total: enviadosWorker + eventos, plano: ultimoPlano, ledger };
}

describe.each(FUSOS)('o TETO de %s com eventos + worker real: nunca passa de PUSH_DAILY_CAP', (zone, nome) => {
  it(`${nome}: dia CHEIO (cocô×2 + fome + energia): os 4 eventos ficam e o worker não manda NADA de refeição`, async () => {
    const r = await viverUmDia(zone, {});
    expect(r.eventos).toBe(4);
    expect(r.worker).toBe(0); // refeições, lembrete de deitar e progresso cederam
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });

  it(`${nome}: dia CALMO (só 2 cocôs): total ≤ 4, com lembrete de deitar e a 1ª refeição`, async () => {
    const r = await viverUmDia(zone, { calmo: true, poop: [new Date(2026, 9, 12, 10).getTime(), new Date(2026, 9, 12, 18).getTime()] });
    expect(r.eventos).toBe(2);
    expect(r.worker).toBe(2); // o lembrete de deitar (maior prioridade que refeição) + a 1ª refeição; almoço e jantar cederam
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });

  it(`${nome}: sem ritmo nem lembrete (só os convites de hora fixa do worker): total ≤ 4`, async () => {
    const r = await viverUmDia(zone, { meals: false, sleep: false });
    expect(r.total).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });
});

describe('a varredura usa mesmo o fuso de cada cidade', () => {
  it('o fuso do processo muda com TZ (senão os 5 fusos seriam 1)', () => {
    const off = z => { process.env.TZ = z; return -new Date(2026, 9, 12).getTimezoneOffset(); };
    expect([off('America/Sao_Paulo'), off('Asia/Tokyo'), off('Asia/Kolkata'), off('Pacific/Auckland')]).toEqual([-180, 540, 330, 780]);
  });
});

describe('o worker obedece ao `x`, e só no dia dele', () => {
  const sub = over => ({
    petName: 'Bito', language: 'en-US', bornAt: '2026-09-01',
    meals: { t: mealMinutes(DEFAULT_MEAL_TIMES), tz: -180 }, ...over,
  });
  const quandoAlmoco = new Date(Date.UTC(2026, 9, 12, 16, 30)); // 13:30 BRT
  it('sem `x`: a refeição sai como sempre', () => {
    expect(mealNotifFor(sub({}), quandoAlmoco)).not.toBeNull();
  });
  it('com `x` do dia cortando o almoço: não sai; outro dia ou outra chave: sai', () => {
    expect(mealNotifFor(sub({ x: { d: '2026-10-12', k: ['lunch'] } }), quandoAlmoco)).toBeNull();
    expect(mealNotifFor(sub({ x: { d: '2026-10-11', k: ['lunch'] } }), quandoAlmoco)).not.toBeNull();
    expect(mealNotifFor(sub({ x: { d: '2026-10-12', k: ['dinner'] } }), quandoAlmoco)).not.toBeNull();
  });
  it('o lembrete de deitar também cede ao `x`', () => {
    const s = { petName: 'Bito', language: 'en-US', bornAt: '2026-09-01', sleep: { s: 1380, tz: -180 } };
    const t = new Date(Date.UTC(2026, 9, 13, 1, 30)); // 22:30 BRT de 12/10
    expect(sleepNotifFor(s, t)).not.toBeNull();
    expect(sleepNotifFor({ ...s, x: { d: '2026-10-12', k: ['sleep'] } }, t)).toBeNull();
  });
  it('o validador descarta lixo (= nada cortado) e só aceita chaves conhecidas', () => {
    expect(suprimidosDeInscricao({ d: 'ontem', k: ['lunch'] })).toBeUndefined();
    expect(suprimidosDeInscricao({ d: '2026-10-12', k: 'lunch' })).toBeUndefined();
    expect(suprimidosDeInscricao({ d: '2026-10-12', k: ['lunch', 'poop', '<script>'] })).toEqual({ d: '2026-10-12', k: ['lunch'] });
    expect(suprimidoHoje({ x: 'lixo' }, 'lunch', quandoAlmoco, -180)).toBe(false);
  });
});
