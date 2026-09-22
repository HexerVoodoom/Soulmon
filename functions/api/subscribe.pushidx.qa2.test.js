/**
 * QA rodada 2 (22/09/2026) — `pushidx:` envenenável (`01-seguranca-r2` §2,
 * `00-skeptic-r2` #2).
 *
 * Antes: `subscribe.js`/`fcm-subscribe.js` gravavam o `saveId` do corpo SEM
 * prova de posse, e `gravarSeMudou` o indexava em `pushidx:<saveId>`. Dezessete
 * POSTs anônimos com o `saveId` da vítima expulsavam a inscrição REAL dela do
 * índice (`PUSHIDX_MAX` = 16) — e a exclusão de conta não a alcançava mais.
 *
 * Agora: (a) o `saveId` só entra se `authorizeSaveAccess` aprovar; sem prova, o
 * registro é gravado SEM conta (compat); (b) a inscrição expulsa do índice é
 * apagada junto (invariante: toda inscrição viva com `saveId` está no índice);
 * (c) `deletePushSubscriptions` varre também quando o índice está cheio.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost as subscribePost } from './subscribe.js';
import { onRequestPost as fcmPost } from './fcm-subscribe.js';
import { indexarInscricao, lerIndice, PUSHIDX_MAX, chaveDoIndice } from './_pushIdentity.js';

// Só `requireVerifiedOwner` (a exclusão, fail-closed) é substituído; o
// `authorizeSaveAccess` real é o que os blocos (a) exercitam.
vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'x@y.z' }),
}));

const VITIMA = 'v'.repeat(32);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const ops = [];
  return {
    store, ops,
    get: async k => { ops.push(['get', k]); return store.get(k) ?? null; },
    put: async (k, v) => { ops.push(['put', k]); store.set(k, v); },
    delete: async k => { ops.push(['delete', k]); store.delete(k); },
    list: async ({ prefix = '' }) => { ops.push(['list', prefix]); return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; },
  };
}

const post = (url, body) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const webBody = (i, saveId) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/ep${i}`, keys: { p256dh: 'A'.repeat(20), auth: 'B'.repeat(20) }, saveId });

afterEach(() => vi.restoreAllMocks());

describe('(a) saveId só com prova de posse', () => {
  // Auth LIGADA (FIREBASE_PROJECT_ID) e nenhum token: é exatamente o POST anônimo do ataque.
  it('17 POSTs anônimos com o saveId da vítima: NENHUM é indexado; a inscrição real dela fica no índice', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const push = fakeKV({
      'push:real': JSON.stringify({ endpoint: 'real', saveId: VITIMA }),
      [chaveDoIndice(VITIMA)]: JSON.stringify({ v: 1, keys: { 'push:real': 1 }, updatedAt: Date.now() }),
    });
    const env = { PUSH_SUBSCRIPTIONS: push, DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' };
    for (let i = 0; i < 17; i++) {
      const r = await subscribePost({ request: post('https://x/api/subscribe', webBody(i, VITIMA)), env });
      expect(r.status).toBe(201);
    }
    const idx = await lerIndice(push, VITIMA);
    expect(Object.keys(idx.keys)).toEqual(['push:real']);
    expect(push.store.has('push:real')).toBe(true);
    // As 17 foram gravadas — SEM saveId (compat: continuam recebendo push).
    const anonimas = [...push.store.entries()].filter(([k]) => k.startsWith('push:') && k !== 'push:real');
    expect(anonimas).toHaveLength(17);
    for (const [, v] of anonimas) expect(JSON.parse(v).saveId).toBeUndefined();
  });

  it('fcm-subscribe: mesma regra', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const push = fakeKV();
    const env = { PUSH_SUBSCRIPTIONS: push, DIGIAPP_SAVES: fakeKV(), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const r = await fcmPost({ request: post('https://x/api/fcm-subscribe', { token: 't'.repeat(64), saveId: VITIMA }), env });
    expect(r.status).toBe(201);
    expect(push.store.has(chaveDoIndice(VITIMA))).toBe(false);
    const [rec] = [...push.store.values()].map(v => JSON.parse(v));
    expect(rec.saveId).toBeUndefined();
  });

  it('auth desligada (sem FIREBASE_PROJECT_ID) continua fail-open declarado: saveId entra', async () => {
    const push = fakeKV();
    const env = { PUSH_SUBSCRIPTIONS: push, DIGIAPP_SAVES: fakeKV() };
    await subscribePost({ request: post('https://x/api/subscribe', webBody(1, VITIMA)), env });
    expect(push.store.has(chaveDoIndice(VITIMA))).toBe(true);
  });

  it('as duas rotas anunciam Authorization no CORS', async () => {
    const { onRequestOptions: a } = await import('./subscribe.js');
    const { onRequestOptions: b } = await import('./fcm-subscribe.js');
    expect((await a()).headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect((await b()).headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });
});

describe('(b) invariante: inscrição expulsa do índice é apagada junto', () => {
  it('a 17ª reinstalação apaga a inscrição mais velha em vez de a deixar viva e órfã', async () => {
    const kv = fakeKV();
    for (let i = 0; i < PUSHIDX_MAX; i++) {
      kv.store.set(`push:k${i}`, JSON.stringify({ endpoint: `e${i}`, saveId: VITIMA }));
      // `updatedAt`/timestamps crescentes: k0 é a mais velha.
      await indexarInscricao(kv, VITIMA, `push:k${i}`);
      kv.store.set(chaveDoIndice(VITIMA), JSON.stringify({ ...JSON.parse(kv.store.get(chaveDoIndice(VITIMA))), keys: Object.fromEntries([...Array(i + 1)].map((_, j) => [`push:k${j}`, j + 1])) }));
    }
    kv.store.set('push:nova', JSON.stringify({ endpoint: 'nova', saveId: VITIMA }));
    await indexarInscricao(kv, VITIMA, 'push:nova');
    const idx = await lerIndice(kv, VITIMA);
    expect(Object.keys(idx.keys)).toHaveLength(PUSHIDX_MAX);
    expect(idx.keys['push:nova']).toBeDefined();
    expect(idx.keys['push:k0'], 'a mais velha saiu do índice').toBeUndefined();
    expect(kv.store.has('push:k0'), 'e foi APAGADA — nada vivo fora do índice').toBe(false);
    // Toda inscrição viva com saveId está no índice:
    const vivas = [...kv.store.keys()].filter(k => k.startsWith('push:'));
    expect(vivas.sort()).toEqual(Object.keys(idx.keys).sort());
  });
});

describe('(c) exclusão com índice cheio varre também', () => {
  it('índice com PUSHIDX_MAX entradas: a inscrição fora do índice (legado) também cai', async () => {
    const { onRequest } = await import('./account.js');
    const keys = {};
    const push = fakeKV();
    for (let i = 0; i < PUSHIDX_MAX; i++) {
      push.store.set(`push:i${i}`, JSON.stringify({ endpoint: `e${i}`, saveId: VITIMA }));
      keys[`push:i${i}`] = i + 1;
    }
    push.store.set(chaveDoIndice(VITIMA), JSON.stringify({ v: 1, keys, updatedAt: Date.now() }));
    push.store.set('push:fora', JSON.stringify({ endpoint: 'fora', saveId: VITIMA })); // expulsa antes da correção
    push.store.set('push:alheia', JSON.stringify({ endpoint: 'a', saveId: 'o'.repeat(32) }));
    const saves = fakeKV({ [VITIMA]: JSON.stringify({ petName: 'B' }) });
    const env = { DIGIAPP_SAVES: saves, PUSH_SUBSCRIPTIONS: push, FIREBASE_PROJECT_ID: 'soulmon-test' };
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const pedido = await (await onRequest({ request: post(`https://x/api/account?action=delete-request&id=${VITIMA}`, {}), env })).json();
    const r = await onRequest({ request: post(`https://x/api/account?action=delete-confirm&id=${VITIMA}`, { confirmToken: pedido.confirmToken }), env });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.executado.inscricoesDePushApagadas).toBe(PUSHIDX_MAX + 1);
    expect(push.store.has('push:fora')).toBe(false);
    expect(push.store.has('push:alheia')).toBe(true);
    expect(push.ops.some(o => o[0] === 'list'), 'varreu porque o índice estava cheio').toBe(true);
  });
});
