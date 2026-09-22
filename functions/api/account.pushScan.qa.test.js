/**
 * QA (rodada A, 21/09/2026) — `deletePushSubscriptions` (decisão #23) sob KV
 * REAL de Cloudflare: `list` é PAGINADO (`list_complete:false` + `cursor`),
 * e o `fakeKV` de `account.test.js` devolve tudo numa página só — então a
 * cobertura existente nunca exercitou o `cursor`. Aqui a página tem 2 chaves.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');

const ID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);

/** KV com `list` paginado de verdade: `limit` ignorado, página fixa de `pageSize`. */
function fakeKVPaginado(seed = {}, pageSize = 2) {
  const store = new Map(Object.entries(seed));
  const listCalls = [];
  return {
    store,
    listCalls,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', cursor }) => {
      listCalls.push({ prefix, cursor });
      const todas = [...store.keys()].filter(k => k.startsWith(prefix)).sort();
      const inicio = cursor ? Number(cursor) : 0;
      const pagina = todas.slice(inicio, inicio + pageSize);
      const fim = inicio + pageSize;
      return fim >= todas.length
        ? { keys: pagina.map(name => ({ name })), list_complete: true, cursor: undefined }
        : { keys: pagina.map(name => ({ name })), list_complete: false, cursor: String(fim) };
    },
  };
}

const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
});

function envCom(pushSeed, pageSize) {
  const saves = fakeKVPaginado({
    [ID]: JSON.stringify({ petName: 'Bolha' }),
    [`profile:${ID}`]: JSON.stringify({ id: ID, name: 'Ana', friends: [] }),
  }, 1000);
  return {
    DIGIAPP_SAVES: saves,
    PUSH_SUBSCRIPTIONS: fakeKVPaginado(pushSeed, pageSize),
    FIREBASE_PROJECT_ID: 'soulmon-test',
  };
}

async function excluir(e) {
  const { confirmToken } = await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json();
  const res = await onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
  expect(res.status).toBe(200);
  return res.json();
}

describe('deletePushSubscriptions — paginação do KV', () => {
  it('7 inscrições push:* em páginas de 2: o loop segue o cursor e apaga TODAS as do titular', async () => {
    const seed = {};
    for (let i = 0; i < 7; i++) seed[`push:${String(i).padStart(4, '0')}`] = JSON.stringify({ endpoint: `e${i}`, saveId: ID });
    seed['push:zzzz'] = JSON.stringify({ endpoint: 'ez', saveId: OTHER });
    seed['fcm:0001'] = JSON.stringify({ token: 't', saveId: ID });
    seed['fcm:0002'] = JSON.stringify({ token: 't2' }); // legado sem saveId
    const e = envCom(seed, 2);
    const body = await excluir(e);
    expect(body.executado.inscricoesDePushApagadas).toBe(8);
    const push = e.PUSH_SUBSCRIPTIONS;
    expect([...push.store.keys()].sort()).toEqual(['fcm:0002', 'push:zzzz']);
    // Prova de que paginou: 8 chaves push:* em páginas de 2 = 4 chamadas de list com prefixo push:
    const chamadasPush = push.listCalls.filter(c => c.prefix === 'push:');
    expect(chamadasPush.length).toBe(4);
    expect(chamadasPush.map(c => c.cursor)).toEqual([undefined, '2', '4', '6']);
  });

  it('caso do enunciado: 2 do dono + 1 alheia + 1 antiga sem saveId → apaga só as 2', async () => {
    const e = envCom({
      'push:aaaa': JSON.stringify({ endpoint: 'x', saveId: ID }),
      'fcm:bbbb': JSON.stringify({ token: 't', saveId: ID }),
      'push:cccc': JSON.stringify({ endpoint: 'y', saveId: OTHER }),
      'push:dddd': JSON.stringify({ endpoint: 'z' }),
    }, 1);
    const body = await excluir(e);
    expect(body.executado.inscricoesDePushApagadas).toBe(2);
    expect([...e.PUSH_SUBSCRIPTIONS.store.keys()].sort()).toEqual(['push:cccc', 'push:dddd']);
  });

  it('saveId com tipo errado no registro (array contendo o id, prefixo do id) NÃO casa', async () => {
    const e = envCom({
      'push:a1': JSON.stringify({ endpoint: 'x', saveId: [ID] }),
      'push:a2': JSON.stringify({ endpoint: 'x', saveId: ID.slice(0, 16) }),
      'push:a3': JSON.stringify({ endpoint: 'x', saveId: ID + 'x' }),
      'push:a4': JSON.stringify({ endpoint: 'x', saveId: ID.toUpperCase() }),
      'push:a5': 'null',
      'push:a6': JSON.stringify([ID]),
      'push:a7': JSON.stringify({ endpoint: 'x', saveId: ID }),
    }, 3);
    const body = await excluir(e);
    expect(body.executado.inscricoesDePushApagadas).toBe(1);
    expect(e.PUSH_SUBSCRIPTIONS.store.has('push:a7')).toBe(false);
    expect(e.PUSH_SUBSCRIPTIONS.store.size).toBe(6);
  });

  it('REGRESSÃO: `list` que rejeita (KV de push fora) NÃO derruba a exclusão — 200, save apagado, 0 push', async () => {
    // Antes do conserto: o handler não tinha try/catch em volta da varredura,
    // o erro subia (500) DEPOIS de o save já ter sido apagado, e o retry da
    // pessoa encontrava uma conta que não existe mais. Push é melhor-esforço
    // nos dois lados (cliente: `revokePushBeforeDelete`); aqui também.
    const e = envCom({ 'push:aaaa': JSON.stringify({ endpoint: 'x', saveId: ID }) }, 2);
    e.PUSH_SUBSCRIPTIONS.list = async () => { throw new Error('KV indisponível'); };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const body = await excluir(e);
    expect(body.ok).toBe(true);
    expect(body.executado.inscricoesDePushApagadas).toBe(0);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(false);
    expect(e.PUSH_SUBSCRIPTIONS.store.has('push:aaaa'), 'a inscrição fica — declarada em naoIncluido').toBe(true);
    vi.restoreAllMocks();
  });

  it('REGRESSÃO: `delete` que rejeita no meio da varredura mantém o que já apagou e segue', async () => {
    const e = envCom({
      'push:0001': JSON.stringify({ endpoint: 'x', saveId: ID }),
      'push:0002': JSON.stringify({ endpoint: 'x', saveId: ID }),
      'push:0003': JSON.stringify({ endpoint: 'x', saveId: ID }),
    }, 2);
    const original = e.PUSH_SUBSCRIPTIONS.delete;
    let n = 0;
    e.PUSH_SUBSCRIPTIONS.delete = async k => { if (++n === 2) throw new Error('quota'); return original(k); };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const body = await excluir(e);
    expect(body.ok).toBe(true);
    expect(body.executado.inscricoesDePushApagadas).toBe(1);
    expect(e.PUSH_SUBSCRIPTIONS.store.has('push:0001')).toBe(false);
    vi.restoreAllMocks();
  });
});
