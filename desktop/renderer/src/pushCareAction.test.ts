import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pushCareAction, fetchRemoteSnapshot } from './cloudSync';
// O endpoint REAL, não uma imitação. É esse o ponto: `cloudSync.test.ts` trava
// a paridade das TABELAS copiadas (saveId, HP, energia), mas nunca tocou no
// contrato HTTP — e é lá que a cópia divergiu.
import { onRequest } from '../../../functions/api/save.js';

const EMAIL = 'mateus@exemplo.com';

function fakeKV(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map<string, unknown>();
  return {
    store,
    meta,
    get: async (k: string) => store.get(k) ?? null,
    // `getWithMetadata` entrou junto com a renovacao preguicosa do TTL do save
    // (`SAVE_TTL_SECONDS` em functions/api/save.js): o GET le a data de
    // gravacao para decidir se reescreve. Sem isto aqui, o falso divergia da
    // API real do KV e o teste do desktop quebrava por motivo que nao tem
    // nada a ver com o desktop.
    getWithMetadata: async (k: string) => ({
      value: store.get(k) ?? null,
      metadata: meta.get(k) ?? null,
    }),
    put: async (k: string, v: string, opts?: { metadata?: unknown }) => {
      store.set(k, v);
      if (opts?.metadata !== undefined) meta.set(k, opts.metadata);
    },
    delete: async (k: string) => { store.delete(k); meta.delete(k); },
  };
}

let kv: ReturnType<typeof fakeKV>;

/**
 * Liga o `fetch` do renderer no handler real da Pages Function. Se o desktop
 * montar a URL de um jeito que o servidor não entende, isto quebra — que é
 * exatamente o que um mock de fetch (que só devolve 200) esconderia.
 */
function wireFetchToServer() {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(typeof input === 'string' ? input : String(input), init);
    return onRequest({ request: req, env: { DIGIAPP_SAVES: kv } });
  });
}

beforeEach(async () => {
  kv = fakeKV();
  // `window.soulmonDesktop` é a ponte do Electron; no teste não há sessão.
  vi.stubGlobal('window', { soulmonDesktop: undefined });
  wireFetchToServer();

  // Semeia um save como o do celular.
  const { emailToSaveId } = await import('./cloudSync');
  const id = await emailToSaveId(EMAIL);
  await kv.put(id, JSON.stringify({
    evolutionStage: 'rookie', healthPoints: 2, maxHealthPoints: 3, energyPoints: 1,
    perfectDays: 7, foodInventory: { '🍎': 2 }, tasks: [],
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
  }));
});

afterEach(() => { vi.unstubAllGlobals(); });

describe('leitura do desktop bate com o servidor', () => {
  it('fetchRemoteSnapshot lê o save real (GET usa ?id=, e funciona)', async () => {
    const res = await fetchRemoteSnapshot(EMAIL);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.snapshot.hearts).toBe(2);
      expect(res.snapshot.maxHearts).toBe(3);
      expect(res.snapshot.foodInventory).toEqual({ '🍎': 2 });
    }
  });
});

describe('a escrita de volta do desktop chega no servidor', () => {
  // REGRESSÃO TRANCADA: `pushCareAction` fazia `POST ${APP_URL}/api/save` com
  // `{ id, state }` no CORPO e sem `?id=` na URL, enquanto `save.js` lia o id
  // SÓ do query string — 400 "Invalid save ID", traduzido pelo desktop para
  // `reason: 'network'`. Na prática, carinho, comida e "marcar tarefa" (as três
  // únicas ações do overlay) não gravavam NADA, com a rede perfeita.
  // Nenhum teste pegou porque `cloudSync.test.ts` nunca chama `pushCareAction`
  // e a leitura (que usa `?id=`) funciona, então a tela parecia viva.
  it('pushCareAction grava de verdade no save real', async () => {
    const antes = kv.store.size;

    const res = await pushCareAction(EMAIL, (state) => ({ ...state, healthPoints: 3 }));

    expect(res.ok).toBe(true);
    if (res.ok) expect(res.snapshot.hearts).toBe(3);

    // E o que ficou no KV é o estado novo, não o antigo.
    const { emailToSaveId } = await import('./cloudSync');
    const id = await emailToSaveId(EMAIL);
    const salvo = JSON.parse(kv.store.get(id)!);
    expect(salvo.healthPoints).toBe(3);
    expect(salvo.perfectDays).toBe(7); // o resto do save não foi perdido
    expect(kv.store.size).toBe(antes);
  });

  it('a URL do POST não carrega o id que o servidor exige', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input);
      if (init?.method === 'POST') urls.push(url);
      const req = new Request(url, init);
      return onRequest({ request: req, env: { DIGIAPP_SAVES: kv } });
    });

    await pushCareAction(EMAIL, (state) => ({ ...state, healthPoints: 3 }));

    expect(urls).toHaveLength(1);
    // A regressão que este teste tranca: o POST TEM que levar ?id=.
    const { emailToSaveId } = await import('./cloudSync');
    expect(new URL(urls[0]).searchParams.get('id')).toBe(await emailToSaveId(EMAIL));
  });
});

describe('410 account-deleted (QA rodada 2): o overlay para, limpa a sessão e devolve `deleted`', () => {
  // Servidor real, com a LÁPIDE gravada no KV do jeito que `account.js` grava
  // (`del:done:<saveId>`). Assim o teste prova o contrato de verdade — se o
  // backend mudar o formato da lápide ou o status, isto quebra aqui.
  it('GET (fetchRemoteSnapshot) e POST (pushCareAction) → `deleted`; `clearAuth` da ponte é chamado; nada é gravado', async () => {
    const { emailToSaveId } = await import('./cloudSync');
    const id = await emailToSaveId(EMAIL);
    await kv.put(`del:done:${id}`, JSON.stringify({ at: Date.now() }));
    const clearAuth = vi.fn();
    vi.stubGlobal('window', { soulmonDesktop: { clearAuth, getAuth: async () => null } });
    const antes = kv.store.get(id);

    const leitura = await fetchRemoteSnapshot(EMAIL);
    expect(leitura).toEqual({ ok: false, reason: 'deleted' });

    const escrita = await pushCareAction(EMAIL, s => ({ ...s, healthPoints: 3 }));
    expect(escrita).toEqual({ ok: false, reason: 'deleted' });
    expect(kv.store.get(id)).toBe(antes);
    expect(clearAuth).toHaveBeenCalledTimes(2);
  });

  it('sem a ponte (browser puro) o 410 não lança — só devolve `deleted`', async () => {
    const { emailToSaveId } = await import('./cloudSync');
    await kv.put(`del:done:${await emailToSaveId(EMAIL)}`, JSON.stringify({ at: Date.now() }));
    vi.stubGlobal('window', { soulmonDesktop: undefined });
    await expect(fetchRemoteSnapshot(EMAIL)).resolves.toEqual({ ok: false, reason: 'deleted' });
  });
});
