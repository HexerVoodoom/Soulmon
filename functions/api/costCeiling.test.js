import { describe, it, expect, beforeEach, vi } from 'vitest';

/** Chaves de Web Push com FORMA plausível. `subscribe.js` passou a exigir
 *  base64url com teto em 08/09/2026: par torto grava uma linha que nunca
 *  recebe push, e o serviço responde 400 — que a limpeza do cron NÃO trata
 *  (ela só apaga em 410/404), então a linha ficaria tentando 4×/dia por um
 *  ano. Placeholders de um caractere não passam mais, e isso é de propósito. */
const CHAVES = { p256dh: 'BEl'.padEnd(87, 'A'), auth: 'c2VncmVkbzE2Ynl0ZQ' };
import { onRequest as community } from './community.js';
import { onRequestPost as subscribePost, onRequestDelete as subscribeDelete } from './subscribe.js';
import { resetRateLimits } from './_rateLimit.js';

// O-8 do investor-skeptic: `action=players` faz até 300 leituras de KV por
// chamada e `subscribe` grava sem teto — o modelo de custo do produto sendo
// definido por um estranho. Estes casos travam o teto e, mais importante,
// medem o EFEITO no KV (a resposta pode mentir; a contagem de leituras não).

const IP = { 'CF-Connecting-IP': '203.0.113.9' };

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const counts = { get: 0, put: 0, list: 0 };
  return {
    store, counts,
    get: async k => { counts.get++; return store.get(k) ?? null; },
    put: async (k, v) => { counts.put++; store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => {
      counts.list++;
      return {
        keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
        list_complete: true,
      };
    },
  };
}

const perfil = id => JSON.stringify({
  id, name: `n-${id.slice(0, 4)}`, petName: 'pet', stage: 'rookie',
  pvpEnabled: true, attrs: { power: 1, harmony: 1, benevolence: 1 },
  friends: [], createdAt: Date.now(),
});

function seedComPerfis(n) {
  const seed = {};
  for (let i = 0; i < n; i++) seed[`profile:${String(i).padStart(32, 'x')}`] = perfil(String(i).padStart(32, 'x'));
  return seed;
}

const get = (qs, headers = IP) =>
  new Request(`https://soulmon.test/api/community?${qs}`, { headers });

beforeEach(() => {
  resetRateLimits();
  // `caches` não existe no runtime de teste; o handler já trata isso, e este
  // stub garante que a ausência é o caminho exercitado (sem cache, todo acerto
  // vira KV — ou seja, os números abaixo são o PIOR caso).
  vi.stubGlobal('caches', undefined);
});

describe('community: teto por IP nas ações que varrem o KV', () => {
  it('a 21ª varredura no mesmo minuto é 429 com Retry-After — e NÃO toca o KV', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(seedComPerfis(5)) };
    for (let i = 0; i < 20; i++) {
      const res = await community({ request: get('action=players'), env });
      expect(res.status).toBe(200);
    }
    const leiturasAntes = env.DIGIAPP_SAVES.counts.get;
    const barrado = await community({ request: get('action=players'), env });
    expect(barrado.status).toBe(429);
    expect(Number(barrado.headers.get('Retry-After'))).toBeGreaterThan(0);
    // O ponto inteiro do teto: a requisição recusada custa ZERO leitura de KV.
    expect(env.DIGIAPP_SAVES.counts.get).toBe(leiturasAntes);
  });

  it('o 429 mantém o CORS (senão o app vê "erro de rede" e nunca o 429)', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    for (let i = 0; i < 20; i++) await community({ request: get('action=players'), env });
    const barrado = await community({ request: get('action=players'), env });
    expect(barrado.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('as ações leves têm cota própria e mais folgada (não punem uso normal)', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(seedComPerfis(2)) };
    for (let i = 0; i < 20; i++) await community({ request: get('action=players'), env });
    expect((await community({ request: get('action=players'), env })).status).toBe(429);
    // Mesmo IP, ação leve: continua atendido.
    const leve = await community({ request: get('action=player&id=zzzz'), env });
    expect(leve.status).toBe(200);
  });

  it('outro IP não é afetado pelo abusador', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(seedComPerfis(2)) };
    for (let i = 0; i < 21; i++) await community({ request: get('action=players'), env });
    const outro = await community({
      request: get('action=players', { 'CF-Connecting-IP': '198.51.100.5' }),
      env,
    });
    expect(outro.status).toBe(200);
  });

  it('o caminho feliz continua respondendo o mesmo conteúdo', async () => {
    const env = { DIGIAPP_SAVES: fakeKV(seedComPerfis(3)) };
    const res = await community({ request: get('action=players'), env });
    const body = await res.json();
    expect(Array.isArray(body.players)).toBe(true);
    expect(body.players).toHaveLength(3);
    expect(body.players[0].id).not.toMatch(/^x+/); // pid, nunca saveId
  });
});

describe('subscribe: escrita sem teto era custo de KV + fetch do cron por 1 ano', () => {
  const sub = (endpoint, headers = IP) =>
    new Request('https://soulmon.test/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        endpoint,
        keys: { p256dh: CHAVES.p256dh, auth: CHAVES.auth },
        petName: 'Bicho',
        language: 'pt-BR',
      }),
    });

  it('a 11ª inscrição do mesmo IP no minuto é 429 e não grava nada', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    for (let i = 0; i < 10; i++) {
      const res = await subscribePost({ request: sub(`https://fcm.googleapis.com/x${i}`), env });
      expect(res.status).toBe(201);
    }
    const gravadosAntes = env.PUSH_SUBSCRIPTIONS.store.size;
    const barrado = await subscribePost({ request: sub('https://fcm.googleapis.com/x99'), env });
    expect(barrado.status).toBe(429);
    expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(gravadosAntes);
  });

  it('reenviar a MESMA inscrição não gasta uma escrita de KV (o cliente reenvia a cada abertura)', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ep = 'https://fcm.googleapis.com/mesmo';
    await subscribePost({ request: sub(ep), env });
    const escritasDepoisDaPrimeira = env.PUSH_SUBSCRIPTIONS.counts.put;
    expect(escritasDepoisDaPrimeira).toBe(1);
    await subscribePost({ request: sub(ep), env });
    await subscribePost({ request: sub(ep), env });
    expect(env.PUSH_SUBSCRIPTIONS.counts.put).toBe(1);
  });

  it('mudança real (idioma/nome do pet) AINDA grava — a economia não pode virar bug', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ep = 'https://fcm.googleapis.com/mesmo';
    await subscribePost({ request: sub(ep), env });
    const req2 = new Request('https://soulmon.test/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...IP },
      body: JSON.stringify({ endpoint: ep, keys: { p256dh: CHAVES.p256dh, auth: CHAVES.auth }, petName: 'Bicho', language: 'en-US' }),
    });
    await subscribePost({ request: req2, env });
    expect(env.PUSH_SUBSCRIPTIONS.counts.put).toBe(2);
    expect(JSON.parse(env.PUSH_SUBSCRIPTIONS.store.get([...env.PUSH_SUBSCRIPTIONS.store.keys()][0])).language)
      .toBe('en-US');
  });

  it('registro velho é reescrito para RENOVAR o TTL — senão o push some no aniversário', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ep = 'https://fcm.googleapis.com/velho';
    await subscribePost({ request: sub(ep), env });
    const chave = [...env.PUSH_SUBSCRIPTIONS.store.keys()][0];
    const rec = JSON.parse(env.PUSH_SUBSCRIPTIONS.store.get(chave));
    rec.refreshedAt = Date.now() - 40 * 24 * 60 * 60 * 1000; // 40 dias
    env.PUSH_SUBSCRIPTIONS.store.set(chave, JSON.stringify(rec));
    await subscribePost({ request: sub(ep), env });
    expect(env.PUSH_SUBSCRIPTIONS.counts.put).toBe(2);
  });

  it('endpoint fora da allowlist continua sendo recusado antes de qualquer escrita', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const res = await subscribePost({ request: sub('https://storage.googleapis.com/x'), env });
    expect(res.status).toBe(400);
    expect(env.PUSH_SUBSCRIPTIONS.counts.put).toBe(0);
  });

  it('DELETE também passa pelo teto (é a mesma rota de custo)', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const del = () => new Request('https://soulmon.test/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...IP },
      body: JSON.stringify({ endpoint: 'https://fcm.googleapis.com/x' }),
    });
    for (let i = 0; i < 10; i++) await subscribeDelete({ request: del(), env });
    expect((await subscribeDelete({ request: del(), env })).status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// ORDEM cache→teto. Achado da rodada 4: o teto rodava ANTES do cache, então um
// acerto de cache (custo ~zero) gastava uma das 20 varreduras/min do IP. Sob
// CGNAT / escola / empresa, dezenas de jogadores REAIS dividem um IP e eram
// barrados exatamente na resposta mais barata da rota. Teto de custo que recusa
// requisição sem custo só produz dano.
// ---------------------------------------------------------------------------
describe('community: acerto de cache não gasta o teto PESADO (falso positivo sob CGNAT)', () => {
  /** Cache de borda falso, sempre com acerto. */
  function cacheSempreAcerta() {
    const resposta = () => new Response(JSON.stringify({ players: [], cached: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
    return { default: { match: async () => resposta(), put: async () => {} } };
  }

  it('AUTOVERIFICAÇÃO: o cache falso realmente responde sem tocar no KV', async () => {
    vi.stubGlobal('caches', cacheSempreAcerta());
    const kv = fakeKV(seedComPerfis(5));
    const res = await community({ request: get('action=players'), env: { DIGIAPP_SAVES: kv } });
    expect(res.status).toBe(200);
    expect((await res.json()).cached).toBe(true);
    expect(kv.counts.list + kv.counts.get).toBe(0);
  });

  it('50 acertos de cache no mesmo minuto continuam 200 (o teto pesado é 20)', async () => {
    vi.stubGlobal('caches', cacheSempreAcerta());
    const kv = fakeKV(seedComPerfis(5));
    for (let i = 0; i < 50; i++) {
      const res = await community({ request: get('action=players'), env: { DIGIAPP_SAVES: kv } });
      expect(res.status).toBe(200);
    }
    expect(kv.counts.list).toBe(0);
  });

  it('mas o teto LEVE continua valendo — cache não é passe livre infinito', async () => {
    vi.stubGlobal('caches', cacheSempreAcerta());
    const kv = fakeKV(seedComPerfis(5));
    let barrados = 0;
    for (let i = 0; i < 130; i++) {
      const res = await community({ request: get('action=players'), env: { DIGIAPP_SAVES: kv } });
      if (res.status === 429) barrados++;
    }
    expect(barrados).toBeGreaterThan(0);
  });

  it('sem cache, a 21ª varredura continua 429 (a proteção de KV não afrouxou)', async () => {
    vi.stubGlobal('caches', undefined);
    const kv = fakeKV(seedComPerfis(5));
    for (let i = 0; i < 20; i++) {
      expect((await community({ request: get('action=players'), env: { DIGIAPP_SAVES: kv } })).status).toBe(200);
    }
    expect((await community({ request: get('action=players'), env: { DIGIAPP_SAVES: kv } })).status).toBe(429);
  });
});
