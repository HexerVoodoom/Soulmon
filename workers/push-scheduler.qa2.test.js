/**
 * QA Rodada 2 (22/09/2026) — o que `push-scheduler.test.js` ainda não cobria:
 * idade D1/D2/D30 por hora e idioma, `bornAt` de jogador em fuso À FRENTE do
 * UTC, FCM com token de acesso vencido no meio da drenagem e OAuth fora do ar.
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import worker, { ageDaysOf } from './push-scheduler.js';

const TOKEN_FCM = `dQw4w9WgXcQ:APA91b${'H'.padEnd(140, 'x')}`;

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

let SERVICE_ACCOUNT;
beforeAll(async () => {
  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8))).replace(/(.{64})/g, '$1\n');
  SERVICE_ACCOUNT = JSON.stringify({
    project_id: 'projeto-teste',
    client_email: 'push@projeto-teste.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`,
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

/** 14/08/2026 às `h` BRT, em UTC. `h + 3` SEM módulo: 22h BRT é 01:00 UTC de
 *  15/08; o `% 24` antigo devolvia 01:00 UTC de 14/08 (= 13/08 22h BRT), um
 *  dia atrás — e escondia o furo do `00-skeptic-r2` #11. */
const brt = h => ({ scheduledTime: Date.UTC(2026, 7, 14, h + 3, 0, 0) });

/** Canal FCM (payload em claro). `responder` decide o que o Google devolve por chamada. */
function stubFcm(responder = () => Response.json({ name: 'ok' })) {
  const enviados = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    const u = String(url);
    if (u.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'tk', expires_in: 3600 });
    const body = JSON.parse(init.body);
    enviados.push(body.message);
    return responder(enviados.length, body);
  }));
  return enviados;
}
const fcmSub = (over = {}) => JSON.stringify({ token: TOKEN_FCM, petName: 'Bito', language: 'en-US', ...over });

describe('idade × hora × idioma', () => {
  it.each([
    [10, '2026-08-13', 'pt-BR', /Bito acordou/, 'D1 manhã PT'],
    [10, '2026-08-12', 'en-US', /Bito woke up/, 'D2 manhã EN'],
    [16, '2026-08-13', 'pt-BR', /está por aí/, 'D1 tarde = copy de sempre'],
    [22, '2026-08-13', 'en-US', /good night/i, 'D1 noite = copy de sempre'],
    [10, '2026-07-15', 'pt-BR', /passou pra dizer oi/, 'D30 = copy de sempre'],
    [10, '2026-08-11', 'pt-BR', /passou pra dizer oi/, 'D3 = copy de sempre'],
  ])('às %ih, nascido em %s, %s → %s (%s)', async (h, bornAt, language, re) => {
    const enviados = stubFcm();
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': fcmSub({ bornAt, language }) }), FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT };
    await worker.scheduled(brt(h), env);
    expect(enviados).toHaveLength(1);
    expect(JSON.stringify(enviados[0])).toMatch(re);
  });

  it('bornAt ilegível ("2026-13-45", "ontem", 20260814, "") = idade desconhecida → copy de sempre, sem apagar', async () => {
    for (const bornAt of ['2026-13-45', 'ontem', 20260814, '']) {
      vi.unstubAllGlobals();
      const enviados = stubFcm();
      const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': fcmSub({ bornAt }) }), FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT };
      await worker.scheduled(brt(10), env);
      expect(enviados, String(bornAt)).toHaveLength(1);
      expect(JSON.stringify(enviados[0])).toMatch(/stopped by/);
      expect(env.PUSH_SUBSCRIPTIONS.store.has('fcm:1')).toBe(true);
    }
  });
});

describe('D0 em fuso à FRENTE do UTC', () => {
  // `bornAt` é o DIA DO JOGADOR (`playerDayKey`). Quem está em Tóquio (UTC+9)
  // e nasce em 15/08 às 00:30 JST gravou bornAt='2026-08-15' — mas isso é
  // 14/08 15:30 UTC. O cron das 16h BRT (19:00 UTC de 14/08) via
  // `Date.parse('2026-08-15T00:00:00Z')` > agora → dias = -1 → `null` →
  // "idade desconhecida" → COPY DE SEMPRE no D0. A regra do `_pushCopy.js`
  // ("nunca no D0") furava para o jogador mais distante.
  it('ageDaysOf: nascimento ainda "no futuro" em UTC é D0, não idade desconhecida', () => {
    const cron16hBrt = new Date(Date.UTC(2026, 7, 14, 19, 0, 0));
    expect(ageDaysOf({ bornAt: '2026-08-15' }, cron16hBrt)).toBe(0);
    // Mas um `bornAt` DIAS no futuro (relógio adulterado) continua desconhecido.
    expect(ageDaysOf({ bornAt: '2026-08-20' }, cron16hBrt)).toBeNull();
  });
  // `00-skeptic-r2` #11: a base do dia é meia-noite BRT. Sem isso o cron das
  // 22h BRT (01:00 UTC de T+1) via `dias = 1` para quem nasceu em T e mandava
  // push no D0 — o único dia em que ele não pode sair.
  it('ageDaysOf: 22h BRT do dia do nascimento ainda é D0 (base T03:00:00Z, não T00:00:00Z)', () => {
    const cron22hBrt = new Date(Date.UTC(2026, 7, 16, 1, 0, 0)); // 15/08 22:00 BRT
    expect(ageDaysOf({ bornAt: '2026-08-15' }, cron22hBrt)).toBe(0);
    // Às 10h BRT do dia seguinte já é D1.
    expect(ageDaysOf({ bornAt: '2026-08-15' }, new Date(Date.UTC(2026, 7, 16, 13, 0, 0)))).toBe(1);
  });
  it('o push das 22h BRT NÃO sai para quem nasceu hoje em BRT', async () => {
    const enviados = stubFcm();
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:br': fcmSub({ bornAt: '2026-08-14' }) }), FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT };
    await worker.scheduled(brt(22), env);
    expect(enviados).toHaveLength(0);
  });
  it('o push das 16h BRT NÃO sai para quem já é D0 em Tóquio', async () => {
    const enviados = stubFcm();
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:tokyo': fcmSub({ bornAt: '2026-08-15' }) }), FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT };
    await worker.scheduled(brt(16), env);
    expect(enviados).toHaveLength(0);
    expect(env.PUSH_SUBSCRIPTIONS.store.has('fcm:tokyo')).toBe(true);
  });
});

describe('FCM — token de acesso e OAuth', () => {
  it('401 do FCM (access token vencido no meio) → "failed", a inscrição FICA, o worker não renova nem tenta de novo', async () => {
    let chamadasOauth = 0;
    const enviados = [];
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('oauth2.googleapis.com')) { chamadasOauth++; return Response.json({ access_token: 'tk', expires_in: 3600 }); }
      enviados.push(1);
      return Response.json({ error: { status: 'UNAUTHENTICATED' } }, { status: 401 });
    }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': fcmSub(), 'fcm:2': fcmSub() }), FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT };
    await worker.scheduled(brt(10), env);
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(2);
    expect(enviados).toHaveLength(2);
    // Documentado: um token só por disparo (cache de módulo). Sem retry.
    expect(chamadasOauth).toBeLessThanOrEqual(1);
    expect(log.mock.calls.map(c => c.join(' ')).join('\n')).toMatch(/fcm: sent 0, failed 2/);
  });

  it('OAuth fora do ar: o Web Push JÁ SAIU antes, e o disparo termina com erro (não silencioso)', async () => {
    const chamadas = [];
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const u = String(url);
      chamadas.push(u);
      if (u.includes('oauth2.googleapis.com')) return new Response('nope', { status: 503 });
      return new Response('', { status: 201 });
    }));
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
    const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({
        'push:1': JSON.stringify({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) }, petName: 'Bito', language: 'en-US' }),
        'fcm:1': fcmSub(),
      }),
      VAPID_JWK: JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey)),
      FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT,
    };
    // `getFcmAccessToken` guarda o token em cache de MÓDULO — um teste anterior
    // já mintou um; recarrega o módulo para o OAuth ser chamado de verdade.
    vi.resetModules();
    const { default: fresco } = await import('./push-scheduler.js');
    await expect(fresco.scheduled(brt(10), env)).rejects.toThrow(/FCM token exchange failed/);
    expect(chamadas.filter(u => u.includes('/fcm/send/abc'))).toHaveLength(1);
    expect(chamadas.filter(u => u.includes('fcm.googleapis.com/v1'))).toHaveLength(0);
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(2);
  });
});
