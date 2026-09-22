/**
 * Índice inverso `pushidx:<saveId>` (QA rodada 1, `03-arquitetura-r1.md` §2.2).
 * Unidade (`indexarInscricao`/`desindexarInscricao`/`lerIndice`) e rota
 * (`subscribe.js`/`fcm-subscribe.js` gravam no POST e removem no DELETE).
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  gravarSeMudou, indexarInscricao, desindexarInscricao, lerIndice, chaveDoIndice,
  PUSHIDX_MAX, TTL_INSCRICAO,
} from './_pushIdentity.js';
import { onRequestPost as subPost, onRequestDelete as subDelete } from './subscribe.js';
import { onRequestPost as fcmPost, onRequestDelete as fcmDelete } from './fcm-subscribe.js';

const ID = 'a'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const gravacoes = [];
  return {
    store, gravacoes,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { gravacoes.push({ k, v, o }); store.set(k, v); },
    delete: async k => { store.delete(k); },
  };
}

const idx = kv => JSON.parse(kv.store.get(chaveDoIndice(ID)) ?? 'null');

describe('indexarInscricao — unidade', () => {
  it('cria o índice com a chave, forma `{ v:1, keys, updatedAt }` e TTL de 1 ano', async () => {
    const kv = fakeKV();
    expect(await indexarInscricao(kv, ID, 'push:h1')).toBe(true);
    const i = idx(kv);
    expect(i.v).toBe(1);
    expect(Object.keys(i.keys)).toEqual(['push:h1']);
    expect(i.updatedAt).toBeGreaterThan(0);
    expect(kv.gravacoes.at(-1).o.expirationTtl).toBe(TTL_INSCRICAO);
    expect(TTL_INSCRICAO).toBe(365 * 86400);
  });

  it('chave já presente e índice fresco: NÃO reescreve (custo de KV)', async () => {
    const kv = fakeKV();
    await indexarInscricao(kv, ID, 'push:h1');
    expect(await indexarInscricao(kv, ID, 'push:h1')).toBe(false);
    expect(kv.gravacoes).toHaveLength(1);
  });

  it('índice VELHO (> 30 dias) é reescrito mesmo sem chave nova — renova o TTL', async () => {
    const kv = fakeKV();
    await indexarInscricao(kv, ID, 'push:h1');
    const velho = idx(kv);
    velho.updatedAt = Date.now() - 40 * 86400 * 1000;
    kv.store.set(chaveDoIndice(ID), JSON.stringify(velho));
    expect(await indexarInscricao(kv, ID, 'push:h1')).toBe(true);
    expect(kv.gravacoes).toHaveLength(2);
  });

  it(`teto de ${PUSHIDX_MAX}: a 17ª entrada expulsa a mais VELHA`, async () => {
    expect(PUSHIDX_MAX).toBe(16);
    const kv = fakeKV();
    const agora = Date.now();
    const keys = {};
    for (let i = 0; i < 16; i++) keys[`push:k${String(i).padStart(2, '0')}`] = agora - (16 - i) * 1000; // k00 é a mais velha
    kv.store.set(chaveDoIndice(ID), JSON.stringify({ v: 1, keys, updatedAt: agora }));

    await indexarInscricao(kv, ID, 'fcm:nova');
    const depois = Object.keys(idx(kv).keys);
    expect(depois).toHaveLength(16);
    expect(depois).toContain('fcm:nova');
    expect(depois).not.toContain('push:k00');
    expect(depois).toContain('push:k01');
  });

  it('índice corrompido ou fora da forma é lido como VAZIO, e a escrita seguinte o refaz', async () => {
    for (const lixo of ['{nope', '[]', JSON.stringify({ keys: [1, 2] }), JSON.stringify({ keys: { 'ent:abc': 1, 'push:ok': 2 } })]) {
      const kv = fakeKV({ [chaveDoIndice(ID)]: lixo });
      const lido = await lerIndice(kv, ID);
      // Só chaves push:/fcm: sobrevivem à leitura.
      for (const k of Object.keys(lido.keys)) expect(k).toMatch(/^(push|fcm):/);
      await indexarInscricao(kv, ID, 'push:h1');
      expect(Object.keys(idx(kv).keys)).toContain('push:h1');
      expect(Object.keys(idx(kv).keys)).not.toContain('ent:abc');
    }
  });

  it('KV que rejeita NÃO lança — o índice é melhor-esforço, a inscrição vale mais', async () => {
    const kv = { get: async () => { throw new Error('KV fora'); }, put: async () => { throw new Error('KV fora'); }, delete: async () => {} };
    await expect(indexarInscricao(kv, ID, 'push:h1')).resolves.toBe(false);
    await expect(desindexarInscricao(kv, 'push:h1')).resolves.toBe(false);
  });
});

describe('desindexarInscricao — unidade', () => {
  it('remove a chave do índice da conta dona do registro; índice vazio é APAGADO', async () => {
    const kv = fakeKV({
      'push:h1': JSON.stringify({ endpoint: 'e', saveId: ID }),
      'push:h2': JSON.stringify({ endpoint: 'f', saveId: ID }),
    });
    await indexarInscricao(kv, ID, 'push:h1');
    await indexarInscricao(kv, ID, 'push:h2');

    expect(await desindexarInscricao(kv, 'push:h1')).toBe(true);
    expect(Object.keys(idx(kv).keys)).toEqual(['push:h2']);
    expect(await desindexarInscricao(kv, 'push:h2')).toBe(true);
    expect(kv.store.has(chaveDoIndice(ID))).toBe(false);
  });

  it('registro sem `saveId`, inexistente ou não indexado: não faz nada e não lança', async () => {
    const kv = fakeKV({ 'push:semconta': JSON.stringify({ endpoint: 'e' }) });
    expect(await desindexarInscricao(kv, 'push:semconta')).toBe(false);
    expect(await desindexarInscricao(kv, 'push:nao-existe')).toBe(false);
    kv.store.set('push:h9', JSON.stringify({ endpoint: 'e', saveId: ID }));
    expect(await desindexarInscricao(kv, 'push:h9')).toBe(false); // sem índice
  });
});

describe('gravarSeMudou indexa quando há `saveId` — inclusive sem mudança (migração sozinha)', () => {
  it('registro IGUAL ao gravado antes do índice existir: não regrava o registro, mas CRIA o índice', async () => {
    const kv = fakeKV();
    const registro = { endpoint: 'e', petName: 'Bito', saveId: ID };
    // Estado "antes do índice": registro fresco no KV, sem pushidx.
    kv.store.set('push:h1', JSON.stringify({ ...registro, refreshedAt: Date.now() }));
    const gravou = await gravarSeMudou(kv, 'push:h1', registro);
    expect(gravou).toBe(false);
    expect(Object.keys(idx(kv).keys)).toEqual(['push:h1']);
  });

  it('registro sem `saveId` não cria índice nenhum', async () => {
    const kv = fakeKV();
    await gravarSeMudou(kv, 'push:h1', { endpoint: 'e', petName: 'Bito' });
    expect([...kv.store.keys()].some(k => k.startsWith('pushidx:'))).toBe(false);
  });
});

// ── Rotas ───────────────────────────────────────────────────────────────────
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/idx-abc';
const CHAVES = { p256dh: 'BEl'.padEnd(87, 'A'), auth: 'c2VncmVkbzE2Ynl0ZQ' };
const TOKEN_FCM = 'f'.repeat(152);
let n = 0;
const ipNovo = () => `198.51.77.${(n = (n + 1) % 250) + 1}`;
const req = (url, body, method = 'POST') => new Request(url, {
  method, headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ipNovo() }, body: JSON.stringify(body),
});

describe('rotas: POST indexa, DELETE desindexa', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });
  afterEach(() => vi.restoreAllMocks());

  it('POST /api/subscribe com saveId deixa `pushidx:` com a chave `push:<hash>`; DELETE a tira', async () => {
    const r = await subPost({ request: req('https://x/api/subscribe', { endpoint: ENDPOINT, keys: CHAVES, saveId: ID }), env });
    expect(r.status).toBe(201);
    const chavePush = env.PUSH_SUBSCRIPTIONS.gravacoes.find(g => g.k.startsWith('push:')).k;
    expect(Object.keys(idx(env.PUSH_SUBSCRIPTIONS).keys)).toEqual([chavePush]);

    await subDelete({ request: req('https://x/api/subscribe', { endpoint: ENDPOINT }, 'DELETE'), env });
    expect(env.PUSH_SUBSCRIPTIONS.store.has(chavePush)).toBe(false);
    expect(env.PUSH_SUBSCRIPTIONS.store.has(chaveDoIndice(ID))).toBe(false);
  });

  it('POST /api/fcm-subscribe com saveId indexa `fcm:<hash>`; os dois canais no MESMO índice', async () => {
    await subPost({ request: req('https://x/api/subscribe', { endpoint: ENDPOINT, keys: CHAVES, saveId: ID }), env });
    const r = await fcmPost({ request: req('https://x/api/fcm-subscribe', { token: TOKEN_FCM, saveId: ID }), env });
    expect(r.status).toBe(201);
    const keys = Object.keys(idx(env.PUSH_SUBSCRIPTIONS).keys).sort();
    expect(keys).toHaveLength(2);
    expect(keys.some(k => k.startsWith('push:'))).toBe(true);
    expect(keys.some(k => k.startsWith('fcm:'))).toBe(true);

    await fcmDelete({ request: req('https://x/api/fcm-subscribe', { token: TOKEN_FCM }, 'DELETE'), env });
    const restantes = Object.keys(idx(env.PUSH_SUBSCRIPTIONS).keys);
    expect(restantes).toHaveLength(1);
    expect(restantes[0]).toMatch(/^push:/);
  });

  it('POST sem saveId (cliente antigo): 201 e NENHUM índice', async () => {
    await subPost({ request: req('https://x/api/subscribe', { endpoint: ENDPOINT, keys: CHAVES }), env });
    expect([...env.PUSH_SUBSCRIPTIONS.store.keys()].some(k => k.startsWith('pushidx:'))).toBe(false);
  });

  it('reenviar a mesma inscrição custa +1 get e ZERO put extra (o índice já tem a chave)', async () => {
    const body = { endpoint: ENDPOINT, keys: CHAVES, saveId: ID };
    await subPost({ request: req('https://x/api/subscribe', body), env });
    const antes = env.PUSH_SUBSCRIPTIONS.gravacoes.length; // registro + índice
    expect(antes).toBe(2);
    await subPost({ request: req('https://x/api/subscribe', body), env });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes.length).toBe(2);
  });
});
