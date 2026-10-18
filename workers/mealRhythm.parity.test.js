/**
 * O RITMO DAS REFEIÇÕES — guard das três árvores (cliente · worker · rota de
 * inscrição) e do TETO de push, provado com o worker REAL varrendo o dia.
 *
 * Por que aqui e não só em `src/`: o worker é deploy MANUAL e nada no CI o
 * compara com o cliente; este arquivo é o único lugar onde horário, texto e
 * teto se encontram (mesmo motivo de `pushCopy.parity.test.js`).
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import worker, { mealNotifFor, cedeAoRitmo } from './push-scheduler.js';
import {
  MEAL_KEYS, MEAL_TICK_CRON, PUSH_DAILY_CAP, DEFAULT_MEAL_TIMES, MEAL_STEP_MIN,
  normalizeMealTimes, mealAtTick, openMealWindow, localMinutes, inRestArc,
} from '../functions/api/_mealRhythm.js';
import { mealInviteCopy, mealPushKind, MEAL_PUSH_KINDS, MEAL_PUSH_TAGS, PUSH_HOURS_UTC } from '../functions/api/_pushCopy.js';
import { refeicoesDeInscricao } from '../functions/api/_pushIdentity.js';

const RAIZ = resolve(__dirname, '..');
const ler = p => readFileSync(resolve(RAIZ, p), 'utf8');

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
beforeAll(async () => {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  SUB_KEYS = { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  VAPID = JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey));
});
afterEach(() => { vi.unstubAllGlobals(); });

const sub = over => JSON.stringify({
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: SUB_KEYS, petName: 'Bito', language: 'en-US', ...over,
});

/**
 * Varre 24 h de cron a partir de `inicio` (ms): as 48 passadas de 30 min + as
 * três de hora fixa que caem na janela. Devolve o que o worker REALMENTE
 * enviou (hora UTC do disparo → corpo do push é cifrado, então contamos
 * chamadas e guardamos o instante).
 */
async function varrerODia(subscricao, inicio) {
  const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': subscricao }), VAPID_JWK: VAPID };
  const enviosEm = [];
  let agora = 0;
  vi.stubGlobal('fetch', vi.fn(async () => { enviosEm.push(agora); return new Response('', { status: 201 }); }));
  for (let i = 0; i < 48; i++) {
    const t = inicio + i * 30 * 60_000;
    agora = t;
    await worker.scheduled({ scheduledTime: t, cron: MEAL_TICK_CRON }, env);
    const d = new Date(t);
    const hUtc = d.getUTCHours();
    if (d.getUTCMinutes() === 0 && PUSH_HOURS_UTC.includes(hUtc)) {
      await worker.scheduled({ scheduledTime: t, cron: `0 ${hUtc} * * *` }, env);
    }
  }
  return enviosEm;
}

// 2026-10-12 00:00 no fuso de cada teste, expresso em UTC
const meiaNoiteLocal = tzMin => Date.UTC(2026, 9, 12, 0, 0) - tzMin * 60_000;

describe('o cron das refeições está declarado e não confunde as horas fixas', () => {
  it('o wrangler.toml tem o cron de 30 min = MEAL_TICK_CRON', () => {
    const toml = ler('workers/wrangler.toml');
    expect(toml).toContain(`"${MEAL_TICK_CRON}"`);
  });
  it('o passo do cron é o passo do horário editável (30 min)', () => {
    expect(MEAL_TICK_CRON.startsWith('*/30')).toBe(true);
    expect(MEAL_STEP_MIN).toBe(30);
  });
});

describe('o TETO diário de push, com o worker real', () => {
  const MEALS = { t: [540, 810, 1200], tz: -180 };

  it.each([
    ['BRT sem janela de descanso', -180, undefined],
    ['BRT com janela 23:00–07:00', -180, [1380, 420]],
    ['Tóquio (+9) com janela', 540, [1380, 420]],
    ['Nova York (-5) sem janela', -300, undefined],
    ['Índia (+5:30) com janela', 330, [1380, 420]],
  ])('%s: nunca mais que PUSH_DAILY_CAP em 24 h', async (_n, tz, rest) => {
    const meals = { t: [540, 810, 1200], tz, ...(rest ? { rest } : {}) };
    const enviados = await varrerODia(sub({ meals }), meiaNoiteLocal(tz));
    expect(enviados.length).toBeGreaterThan(0);
    expect(enviados.length).toBeLessThanOrEqual(PUSH_DAILY_CAP);
  });

  it('com o ritmo ligado, os convites de 10h e 16h CEDEM — o dia tem as 3 refeições + o fechamento, não 5', async () => {
    const semRitmo = await varrerODia(sub({}), meiaNoiteLocal(-180));
    const comRitmo = await varrerODia(sub({ meals: MEALS }), meiaNoiteLocal(-180));
    expect(semRitmo).toHaveLength(3); // 10h, 16h, 22h — como sempre foi
    expect(comRitmo).toHaveLength(4); // 9h, 13h30, 20h, 22h
  });

  it('com janela de descanso o "boa noite" das 22h também cede ao lembrete de deitar: 3, não 4', async () => {
    const enviados = await varrerODia(sub({ meals: { ...MEALS, rest: [1380, 420] } }), meiaNoiteLocal(-180));
    expect(enviados).toHaveLength(3);
  });

  it('com ritmo + lembrete de deitar (sem rest): 3 refeicoes + lembrete = 4 = teto, o boa-noite cede', async () => {
    const enviados = await varrerODia(sub({ meals: MEALS, sleep: { s: 1380, tz: -180 } }), meiaNoiteLocal(-180));
    expect(enviados).toHaveLength(PUSH_DAILY_CAP);
  });

  it('so lembrete (sem ritmo): 10h, 16h e o lembrete = 3 (o boa-noite cede)', async () => {
    const enviados = await varrerODia(sub({ sleep: { s: 1380, tz: -180 } }), meiaNoiteLocal(-180));
    expect(enviados).toHaveLength(3);
  });

  it('quem NÃO ligou o ritmo recebe exatamente o que recebia (zero a mais, zero a menos)', async () => {
    const enviados = await varrerODia(sub({}), meiaNoiteLocal(-180));
    expect(enviados).toHaveLength(3);
    expect(cedeAoRitmo({}, 10)).toBe(false);
    expect(cedeAoRitmo({}, 16)).toBe(false);
    expect(cedeAoRitmo({}, 22)).toBe(false);
  });

  it('nunca dentro da janela de descanso: refeição cujo horário cai nela NÃO sai', async () => {
    // descanso 19:00–08:00 engole café (9:00 não: fora) e jantar (20:00)
    const meals = { t: [540, 810, 1200], tz: -180, rest: [1140, 480] };
    const hoje = Date.UTC(2026, 9, 12, 20 + 3, 0); // 20:00 BRT
    expect(mealNotifFor({ meals, petName: 'x', language: 'en-US' }, new Date(hoje))).toBeNull();
    const cafe = Date.UTC(2026, 9, 12, 9 + 3, 0);
    // café às 9:00 está dentro de 19:00–08:00? Não (08:00 termina antes) → sai
    expect(mealNotifFor({ meals, petName: 'x', language: 'en-US' }, new Date(cafe))).not.toBeNull();
  });

  it('nunca no dia do nascimento (D0)', async () => {
    const enviados = await varrerODia(
      sub({ meals: MEALS, bornAt: '2026-10-12' }),
      Date.UTC(2026, 9, 12, 3, 0), // 00:00 BRT do dia 12
    );
    // Só o fechamento das 22h cede por idade? Não — as 22h seguem a regra antiga
    // (pushCopy devolve null no D0), então NADA sai no D0 inteiro.
    expect(enviados).toHaveLength(0);
  });

  it('sem o campo `meals` a passada de 30 min não envia nada, nunca', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': sub({}) }), VAPID_JWK: VAPID };
    const f = vi.fn(async () => new Response('', { status: 201 }));
    vi.stubGlobal('fetch', f);
    for (let i = 0; i < 48; i++) {
      await worker.scheduled({ scheduledTime: Date.UTC(2026, 9, 12, 0, 0) + i * 1_800_000, cron: MEAL_TICK_CRON }, env);
    }
    expect(f).not.toHaveBeenCalled();
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(1); // e não apaga a inscrição por engano
  });
});

describe('o texto do convite: uma fonte, a mesma tag, o mesmo sorteio', () => {
  const idiomas = ['en-US', 'pt-BR'];

  it('a tag é UMA por refeição (é ela que funde alarme local e FCM)', () => {
    for (const meal of MEAL_KEYS) {
      for (const kind of ['snack', 'poop', 'pet', 'tenSeconds']) {
        for (const l of idiomas) expect(mealInviteCopy(meal, kind, 'Bito', l).tag).toBe(`meal-${meal}`);
      }
    }
    expect([...MEAL_PUSH_TAGS].sort()).toEqual(MEAL_KEYS.map(k => `meal-${k}`).sort());
  });

  it('o push nunca sorteia "poop" (o worker não sabe se há cocô na tela)', () => {
    expect(MEAL_PUSH_KINDS).not.toContain('poop');
    for (let d = 1; d <= 30; d++) {
      for (const meal of MEAL_KEYS) {
        expect(MEAL_PUSH_KINDS).toContain(mealPushKind(meal, `2026-10-${String(d).padStart(2, '0')}`));
      }
    }
  });

  it('é determinístico por (dia, refeição) e VARIA ao longo dos dias', () => {
    expect(mealPushKind('lunch', '2026-10-12')).toBe(mealPushKind('lunch', '2026-10-12'));
    const vistos = new Set();
    for (let d = 1; d <= 30; d++) vistos.add(mealPushKind('lunch', `2026-10-${String(d).padStart(2, '0')}`));
    expect(vistos.size).toBeGreaterThan(1);
  });

  it('EN e PT existem para tudo, sem texto vazio e sem o nome faltando', () => {
    for (const meal of MEAL_KEYS) {
      for (const kind of ['snack', 'poop', 'pet', 'tenSeconds']) {
        for (const l of idiomas) {
          const c = mealInviteCopy(meal, kind, 'Bito', l);
          expect(c.title.length).toBeGreaterThan(3);
          expect(c.body.length).toBeGreaterThan(3);
        }
        expect(mealInviteCopy(meal, kind, 'Bito', 'pt-BR').body).not.toBe(mealInviteCopy(meal, kind, 'Bito', 'en-US').body);
      }
    }
  });

  it('sem cobrança, sem culpa, sem fome-como-necessidade, sem número que desce (L1..L12, #15)', () => {
    const VETADO = /você perdeu|you missed|you lost|faltou|sentiu falta|miss(es|ed) you|esperand|waiting for you|sozinho|lonely|abandon|fome|hungry|starv|morrendo|dying|última chance|last chance|não perca|don'?t miss|hurry|corra|streak|sequência|dívida|debt|ainda não|you haven'?t/i;
    for (const meal of MEAL_KEYS) {
      for (const kind of ['snack', 'poop', 'pet', 'tenSeconds']) {
        for (const l of idiomas) {
          const c = mealInviteCopy(meal, kind, 'Bito', l);
          expect(`${c.title} ${c.body}`, `${meal}/${kind}/${l}`).not.toMatch(VETADO);
          expect(`${c.title} ${c.body}`).not.toMatch(/\d/); // nenhum número: nem contagem, nem hora
        }
      }
    }
  });
});

describe('a conta de horário é uma só (dono: functions/api/_mealRhythm.js)', () => {
  it('defaults: café 9:00, almoço 13:30, jantar 20:00', () => {
    expect(DEFAULT_MEAL_TIMES).toEqual({ breakfast: '09:00', lunch: '13:30', dinner: '20:00' });
  });

  it('o horário editável é arredondado à grade, limitado à faixa e ordenado — ou cai no padrão', () => {
    expect(normalizeMealTimes({ breakfast: '08:10', lunch: '12:50', dinner: '19:40' })).toEqual({ breakfast: '08:00', lunch: '13:00', dinner: '19:30' });
    expect(normalizeMealTimes({ breakfast: '03:00' }).breakfast).toBe('09:00'); // fora da faixa
    expect(normalizeMealTimes({ breakfast: 'abc', lunch: null })).toEqual(DEFAULT_MEAL_TIMES);
    expect(normalizeMealTimes(undefined)).toEqual(DEFAULT_MEAL_TIMES);
    // desordenado/colado → tudo volta ao padrão (um conjunto pela metade é pior)
    expect(normalizeMealTimes({ breakfast: '11:00', lunch: '11:30', dinner: '20:00' })).toEqual(DEFAULT_MEAL_TIMES);
  });

  it('mealAtTick só dispara no passo certo e tolera atraso de cron', () => {
    expect(mealAtTick(540, DEFAULT_MEAL_TIMES)).toBe('breakfast');
    expect(mealAtTick(543, DEFAULT_MEAL_TIMES)).toBe('breakfast'); // cron atrasou 3 min
    expect(mealAtTick(570, DEFAULT_MEAL_TIMES)).toBeNull();
    expect(mealAtTick(1200, DEFAULT_MEAL_TIMES)).toBe('dinner');
  });

  it('a janela fica aberta 2 h e fecha', () => {
    expect(openMealWindow(540, DEFAULT_MEAL_TIMES)).toBe('breakfast');
    expect(openMealWindow(659, DEFAULT_MEAL_TIMES)).toBe('breakfast');
    expect(openMealWindow(660, DEFAULT_MEAL_TIMES)).toBeNull();
    expect(openMealWindow(539, DEFAULT_MEAL_TIMES)).toBeNull();
  });

  it('o arco de descanso atravessa a meia-noite', () => {
    expect(inRestArc(1400, [1380, 420])).toBe(true);
    expect(inRestArc(60, [1380, 420])).toBe(true);
    expect(inRestArc(540, [1380, 420])).toBe(false);
    expect(inRestArc(540, null)).toBe(false);
  });

  it('localMinutes aplica o fuso e dá a volta no dia', () => {
    expect(localMinutes(new Date(Date.UTC(2026, 9, 12, 12, 0)), -180)).toBe(9 * 60);
    expect(localMinutes(new Date(Date.UTC(2026, 9, 12, 23, 30)), 540)).toBe(8 * 60 + 30);
  });
});

describe('a inscrição só guarda o ritmo se ele for válido (opt-in, sem lixo)', () => {
  it('aceita o payload do cliente', () => {
    expect(refeicoesDeInscricao({ t: [540, 810, 1200], tz: -180 })).toEqual({ t: [540, 810, 1200], tz: -180 });
    expect(refeicoesDeInscricao({ t: [540, 810, 1200], tz: 330, rest: [1380, 420] })).toEqual({ t: [540, 810, 1200], tz: 330, rest: [1380, 420] });
  });
  it.each([
    ['ausente', undefined],
    ['não é objeto', 'x'],
    ['só dois horários', { t: [540, 810], tz: 0 }],
    ['fora da grade de 30 min', { t: [541, 810, 1200], tz: 0 }],
    ['fora da faixa da refeição', { t: [180, 810, 1200], tz: 0 }],
    ['desordenado', { t: [810, 540, 1200], tz: 0 }],
    ['colado (< 3 h)', { t: [540, 600, 1200], tz: 0 }],
    ['fuso absurdo', { t: [540, 810, 1200], tz: 5000 }],
    ['fuso fora da grade de 15 min', { t: [540, 810, 1200], tz: 7 }],
    ['horário não inteiro', { t: [540.5, 810, 1200], tz: 0 }],
  ])('descarta: %s', (_n, v) => {
    expect(refeicoesDeInscricao(v)).toBeUndefined();
  });
  it('janela de descanso malformada é ignorada, a inscrição fica', () => {
    expect(refeicoesDeInscricao({ t: [540, 810, 1200], tz: 0, rest: [5000, 1] })).toEqual({ t: [540, 810, 1200], tz: 0 });
    expect(refeicoesDeInscricao({ t: [540, 810, 1200], tz: 0, rest: [100, 100] })).toEqual({ t: [540, 810, 1200], tz: 0 });
  });
  it('as duas rotas de inscrição usam o MESMO validador', () => {
    for (const arq of ['functions/api/subscribe.js', 'functions/api/fcm-subscribe.js']) {
      const src = ler(arq);
      expect(src, arq).toContain('refeicoesDeInscricao');
      expect(src, arq).toMatch(/\bmeals\b/);
    }
  });
});
