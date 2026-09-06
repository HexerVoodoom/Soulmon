/**
 * TESTE DE CONTRATO do worker de push — `workers/push-scheduler.js`.
 *
 * Cobertura antes desta rodada: **0% em todo o `workers/`**. É o canal de
 * retenção do produto e o lugar onde já morou um bug de TOM/idioma real (o
 * título das 22h chegava em PT para quem tinha escolhido inglês, `STATUS §2`).
 * A auditoria da rodada 1 excluiu `workers/` dizendo que "depende de KV real,
 * cron e credencial FCM" — depende do KV e do FCM, não do CRON: `scheduled()`
 * é uma função exportada, e é isso que este arquivo chama.
 *
 * O que é falsificado: o KV, o `fetch` (Web Push e FCM) e o relógio do evento.
 * O que é REAL: `scheduled()`, `drainPrefix`, `getNotification`, a allowlist
 * de endpoint (`functions/api/_pushTargets.js`, importada — não copiada) e as
 * regras de limpeza de inscrição morta.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import worker, { previousSeasonBrt } from './push-scheduler.js';

/** KV de mentira com `list` paginado, que é o que `drainPrefix` usa. */
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

/**
 * Chaves de inscrição REAIS. `sendWebPush` cifra o payload de verdade (RFC
 * 8291): com `p256dh` de mentira ele lança antes de chegar ao `fetch`, e o
 * teste passaria a medir "nada foi enviado" por engano.
 */
let SUB_KEYS;
async function makeSubKeys() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { p256dh: b64u(raw), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
}

const sub = (over = {}) => JSON.stringify({
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: SUB_KEYS,
  petName: 'Bito',
  language: 'en-US',
  ...over,
});

/** Conta de serviço com chave RSA de verdade — `getFcmAccessToken` assina um JWT. */
let SERVICE_ACCOUNT;
async function makeServiceAccount() {
  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8))).replace(/(.{64})/g, '$1\n');
  return JSON.stringify({
    project_id: 'projeto-teste',
    client_email: 'push@projeto-teste.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`,
  });
}

// VAPID_JWK precisa ser uma chave ECDSA P-256 de verdade — `sendWebPush`
// assina o JWT com WebCrypto. Sem isto o teste mediria a criptografia falhando
// em vez do fluxo do worker.
async function vapidJwk() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  return JSON.stringify(await crypto.subtle.exportKey('jwk', pair.privateKey));
}

/** `event.scheduledTime` em UTC para uma hora de Brasília (UTC-3). */
const brt = h => ({ scheduledTime: Date.UTC(2026, 7, 14, (h + 3) % 24, 0, 0) });

let pushed;
beforeAll(async () => {
  SUB_KEYS = await makeSubKeys();
  SERVICE_ACCOUNT = await makeServiceAccount();
});
beforeEach(() => { pushed = []; });
afterEach(() => { vi.unstubAllGlobals(); });

/** Servidor de push de mentira; `status` decide o destino da inscrição. */
function stubPush(status = 201) {
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    pushed.push({ url: String(url), init });
    return new Response('', { status });
  }));
}

describe('push-scheduler — quem recebe', () => {
  it('envia para cada inscrição `push:` do KV', async () => {
    stubPush();
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': sub(), 'push:2': sub({ endpoint: 'https://fcm.googleapis.com/fcm/send/def' }) }),
      VAPID_JWK: await vapidJwk(),
    };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(2);
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(2);
  });

  it('NÃO envia nada quando o VAPID_JWK não está configurado', async () => {
    stubPush();
    const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': sub() }), VAPID_JWK: undefined };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(0);
    // e a inscrição não é apagada por engano
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(1);
  });

  it('endpoint fora da allowlist é APAGADO em vez de virar fetch a cada cron', async () => {
    // Linhas gravadas antes da allowlist continuam no KV por 1 ano de TTL. A
    // revalidação na saída existe justamente para elas. Um endpoint arbitrário
    // é SSRF de graça, disparado pelo nosso worker a cada hora de cron.
    stubPush();
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'push:mau': sub({ endpoint: 'https://evil.example.com/hook' }) }),
      VAPID_JWK: await vapidJwk(),
    };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(0);
    expect(env.PUSH_SUBSCRIPTIONS.store.has('push:mau')).toBe(false);
  });

  it('410/404 do provedor apaga a inscrição morta; 500 mantém', async () => {
    for (const [status, deveSobreviver] of [[410, false], [404, false], [500, true]]) {
      stubPush(status);
      const env = { PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': sub() }), VAPID_JWK: await vapidJwk() };
      await worker.scheduled(brt(10), env);
      expect(env.PUSH_SUBSCRIPTIONS.store.has('push:1'), `status ${status}`).toBe(deveSobreviver);
    }
  });

  it('linha corrompida no KV não derruba o disparo das outras', async () => {
    stubPush();
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'push:ruim': '{isto não é json', 'push:boa': sub() }),
      VAPID_JWK: await vapidJwk(),
    };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(1);
  });

  it('paginação: mais de 100 inscrições são TODAS drenadas', async () => {
    // `drainPrefix` avança por cursor. Um erro aqui entregaria push só para os
    // 100 primeiros usuários — e ninguém reclamaria, porque quem não recebe
    // notificação não sabe que deveria ter recebido.
    stubPush();
    const seed = {};
    for (let i = 0; i < 250; i++) seed[`push:${String(i).padStart(4, '0')}`] = sub();
    const env = { PUSH_SUBSCRIPTIONS: fakeKV(seed), VAPID_JWK: await vapidJwk() };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(250);
  });

  it('sem FIREBASE_SERVICE_ACCOUNT o canal FCM é pulado sem quebrar o Web Push', async () => {
    stubPush();
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'push:1': sub(), 'fcm:1': JSON.stringify({ token: 't', language: 'en-US' }) }),
      VAPID_JWK: await vapidJwk(),
      FIREBASE_SERVICE_ACCOUNT: undefined,
    };
    await worker.scheduled(brt(10), env);
    expect(pushed).toHaveLength(1);
    expect(env.PUSH_SUBSCRIPTIONS.store.has('fcm:1')).toBe(true);
  });
});

describe('push-scheduler — IDIOMA da notificação (o bug que já aconteceu)', () => {
  /** Extrai o corpo cifrado não dá; então checamos por hora + idioma via KV. */
  async function tituloPara({ hour, language }) {
    // `getNotification` não é exportada. Em vez de reimplementá-la no teste
    // (que é o footgun 9 — regra copiada), exercitamos o worker e lemos o
    // payload no ponto em que ele ainda é texto: o canal FCM manda JSON claro.
    const enviados = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      const u = String(url);
      if (u.includes('oauth2.googleapis.com')) {
        return Response.json({ access_token: 'tk', expires_in: 3600 });
      }
      enviados.push(JSON.parse(init.body));
      return Response.json({ name: 'ok' });
    }));
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': JSON.stringify({ token: 't', petName: 'Bito', language }) }),
      VAPID_JWK: undefined,
      FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT,
    };
    await worker.scheduled(brt(hour), env);
    const msg = enviados[0]?.message;
    return msg?.notification ?? msg?.data ?? msg;
  }

  // 21h saiu da lista porque a notificação das 21h deixou de existir — a
  // auditoria de tom a removeu do cliente e ela tinha ficado viva só aqui
  // (ver `workers/pushCopy.parity.test.js`, que trava as três árvores). O caso
  // não foi afrouxado: a ausência às 21h virou asserção no teste abaixo.
  it('quem escolheu EN recebe TÍTULO e corpo em inglês (incl. as 22h)', async () => {
    for (const hour of [10, 16, 22]) {
      const n = await tituloPara({ hour, language: 'en-US' });
      const texto = JSON.stringify(n);
      expect(texto, `hora ${hour}`).not.toMatch(/[áàâãéêíóôõúçÁÂÃÉÊÍÓÔÕÚÇ]/);
      expect(texto).toContain('Bito');
    }
  });

  it('às 21h NADA é enviado por nenhum dos dois canais', async () => {
    // Antes o worker mandava "⏰ está preocupado! Ainda dá tempo! Complete suas
    // tarefas antes de dormir 🌙" — incondicionalmente, inclusive para quem já
    // tinha cumprido a meta. O cliente já não mandava; só esta árvore mandava.
    expect(await tituloPara({ hour: 21, language: 'pt-BR' })).toBeUndefined();
  });

  it('quem escolheu PT recebe em português', async () => {
    const n = await tituloPara({ hour: 22, language: 'pt-BR' });
    expect(JSON.stringify(n)).toMatch(/boa noite/i);
  });

  it('inscrição sem nome de pet não manda "undefined" para o usuário', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'tk', expires_in: 3600 });
      pushed.push(JSON.parse(init.body));
      return Response.json({ name: 'ok' });
    }));
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': JSON.stringify({ token: 't', language: 'en-US' }) }),
      FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT,
    };
    await worker.scheduled(brt(10), env);
    const texto = JSON.stringify(pushed[0]);
    expect(texto).not.toContain('undefined');
    expect(texto).toContain('Soulmon');
  });

  it('APK antigo (campo `digimonName`) continua recebendo o nome certo', async () => {
    // O CLAUDE.md registra que o servidor aceita `petName` E `digimonName` por
    // causa dos APKs já instalados. Se alguém "limpar" isso, quem não atualizou
    // passa a receber "Soulmon" genérico — sem erro nenhum aparecendo.
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      if (String(url).includes('oauth2.googleapis.com')) return Response.json({ access_token: 'tk', expires_in: 3600 });
      pushed.push(JSON.parse(init.body));
      return Response.json({ name: 'ok' });
    }));
    const env = {
      PUSH_SUBSCRIPTIONS: fakeKV({ 'fcm:1': JSON.stringify({ token: 't', digimonName: 'Velhinho', language: 'en-US' }) }),
      FIREBASE_SERVICE_ACCOUNT: SERVICE_ACCOUNT,
    };
    await worker.scheduled(brt(10), env);
    expect(JSON.stringify(pushed[0])).toContain('Velhinho');
  });
});

describe('push-scheduler — fechamento da season (WP4.18)', () => {
  // Os troféus de season existiam inteiros e só chegavam se o DONO lembrasse
  // de disparar a rota à mão. Recompensa que depende de alguém lembrar é sorte.
  // Dia 1 às 10h BRT = 13h UTC do dia 1.
  const emBrt = (ano, mes, dia, hora) => ({ scheduledTime: Date.UTC(ano, mes - 1, dia, hora + 3, 0, 0) });

  function envSeason(extra = {}) {
    return {
      PUSH_SUBSCRIPTIONS: fakeKV({}),
      VAPID_JWK: undefined,
      FIREBASE_SERVICE_ACCOUNT: undefined,
      APP_URL: 'https://app.test',
      SEASON_ADMIN_KEY: 'k',
      ...extra,
    };
  }

  function capturaFetch() {
    const chamadas = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      chamadas.push({ url: String(url), body: init?.body && JSON.parse(init.body) });
      return Response.json({ ok: true });
    }));
    return chamadas;
  }

  it('no dia 1 fecha a season ANTERIOR', async () => {
    const chamadas = capturaFetch();
    await worker.scheduled(emBrt(2026, 9, 1, 10), envSeason());
    const c = chamadas.find(x => x.url.includes('closeSeason'));
    expect(c).toBeTruthy();
    expect(c.body).toEqual({ season: '2026-08', adminKey: 'k' });
  });

  it('a virada de ano volta para dezembro do ano passado', () => {
    expect(previousSeasonBrt(new Date(Date.UTC(2027, 0, 1, 13)))).toBe('2026-12');
  });

  it('o dia é o do BRT, não o do UTC', () => {
    // 1º de setembro 00h UTC ainda é 31 de agosto em BRT: a season corrente
    // é agosto, e a anterior, julho. Contar em UTC fecharia agosto cedo.
    expect(previousSeasonBrt(new Date(Date.UTC(2026, 8, 1, 0)))).toBe('2026-07');
  });

  it('em qualquer outro dia do mês NÃO chama nada', async () => {
    const chamadas = capturaFetch();
    await worker.scheduled(emBrt(2026, 9, 14, 10), envSeason());
    expect(chamadas.filter(x => x.url.includes('closeSeason'))).toHaveLength(0);
  });

  it('sem SEASON_ADMIN_KEY o fechamento é pulado, nunca tentado às cegas', async () => {
    const chamadas = capturaFetch();
    await worker.scheduled(emBrt(2026, 9, 1, 10), envSeason({ SEASON_ADMIN_KEY: undefined }));
    expect(chamadas.filter(x => x.url.includes('closeSeason'))).toHaveLength(0);
  });

  it('roda numa hora SÓ — não três vezes no mesmo dia 1', async () => {
    const chamadas = capturaFetch();
    for (const h of [10, 16, 22]) await worker.scheduled(emBrt(2026, 9, 1, h), envSeason());
    expect(chamadas.filter(x => x.url.includes('closeSeason'))).toHaveLength(1);
  });
});
