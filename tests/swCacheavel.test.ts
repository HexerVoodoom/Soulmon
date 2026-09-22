// ===========================================================================
// GUARD — `cacheavel()` do `public/sw.js` (bump v157, QA geral etapa 4,
// 21/09/2026): SÓ `status === 200` + `type === 'basic'` + `!redirected` entra
// no cache. Um 206 (range request do <video>) é `ok` e o `Cache.put` lança
// "Partial response (status code 206) is unsupported" — o motivo da troca de
// `res.ok` por `status === 200`. Mesmo molde de `swOrigemDaResposta.test.ts`:
// o `sw.js` de produção roda de verdade num ambiente falso.
// ===========================================================================
import { describe, it, expect } from 'vitest';
import fonteSw from '../public/sw.js?raw';

const ORIGEM = 'https://soulmon.mateus-sprnd.workers.dev';

interface FakeResponse { ok: boolean; status: number; type: string; redirected: boolean; corpo: string; clone(): FakeResponse }
function resposta(o: Partial<FakeResponse>): FakeResponse {
  const r: FakeResponse = {
    ok: o.ok ?? (o.status !== undefined ? o.status >= 200 && o.status < 300 : true),
    status: o.status ?? 200, type: o.type ?? 'basic', redirected: o.redirected ?? false, corpo: o.corpo ?? 'x',
    clone() { return { ...r, clone: r.clone }; },
  };
  return r;
}
interface FakeRequest { url: string; method?: string; mode?: string; headers?: { get(k: string): string | null } }

function montar(rede: Record<string, FakeResponse>) {
  const armazem = new Map<string, Map<string, FakeResponse>>();
  const handlers: Record<string, (e: Record<string, unknown>) => void> = {};
  const puts: Array<{ cache: string; url: string; status: number }> = [];
  const abrir = (nome: string) => {
    if (!armazem.has(nome)) armazem.set(nome, new Map());
    const m = armazem.get(nome)!;
    return Promise.resolve({
      put: (req: FakeRequest | string, res: FakeResponse) => {
        // O Cache real lança em 206 — reproduzimos para o teste ver o estouro
        // caso o SW volte a deixar passar.
        if (res.status === 206) return Promise.reject(new TypeError('Partial response (status code 206) is unsupported'));
        m.set(typeof req === 'string' ? req : req.url, res);
        puts.push({ cache: nome, url: typeof req === 'string' ? req : req.url, status: res.status });
        return Promise.resolve();
      },
      addAll: () => Promise.resolve(),
    });
  };
  const cachesFalso = {
    open: abrir,
    keys: () => Promise.resolve([...armazem.keys()]),
    delete: (n: string) => Promise.resolve(armazem.delete(n)),
    match: (req: FakeRequest | string) => {
      const chave = typeof req === 'string' ? new URL(req, ORIGEM).href : req.url;
      for (const m of armazem.values()) if (m.has(chave)) return Promise.resolve(m.get(chave));
      return Promise.resolve(undefined);
    },
  };
  const self = {
    location: { origin: ORIGEM },
    addEventListener: (t: string, fn: (e: Record<string, unknown>) => void) => { handlers[t] = fn; },
    skipWaiting: () => {}, clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([]), openWindow: () => Promise.resolve(null) },
    registration: { showNotification: () => Promise.resolve() },
  };
  const fetchFalso = (req: FakeRequest | string) => {
    const url = typeof req === 'string' ? req : req.url;
    return url in rede ? Promise.resolve(rede[url]) : Promise.reject(new Error(`sem rede: ${url}`));
  };
  const RequestFalso = function (this: FakeRequest, url: string, init?: { headers?: unknown }) {
    this.url = url; this.method = 'GET'; this.headers = (init?.headers as FakeRequest['headers']) ?? { get: () => null };
  } as unknown as new (u: string, i?: unknown) => FakeRequest;
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('self', 'caches', 'fetch', 'Request', 'URL', fonteSw)(self, cachesFalso, fetchFalso, RequestFalso, URL);

  const rejeicoes: unknown[] = [];
  const onRej = (e: unknown) => rejeicoes.push(e);
  return {
    puts,
    rejeicoes,
    async disparar(req: FakeRequest) {
      process.on('unhandledRejection', onRej);
      let saidaP: Promise<FakeResponse> | undefined;
      handlers.fetch({
        request: { method: 'GET', mode: 'no-cors', headers: { get: () => null }, ...req },
        respondWith: (p: Promise<FakeResponse>) => { saidaP = p; },
        waitUntil: () => {},
      });
      const saida = saidaP ? await saidaP.catch(() => undefined) : undefined;
      for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0));
      process.off('unhandledRejection', onRej);
      return saida;
    },
  };
}

const VERSAO = fonteSw.match(/const CACHE_VERSION = '([^']+)'/)?.[1] ?? '';

describe('cacheavel — só 200 basic não-redirecionado entra', () => {
  it('a função existe no fonte com a forma esperada (status === 200, não ok)', () => {
    expect(VERSAO).toMatch(/^v\d+$/);
    const corpo = fonteSw.match(/function cacheavel\(res\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(corpo).toContain('res.status === 200');
    expect(corpo).not.toMatch(/\bres\.ok\b/);
  });

  const casos: Array<[string, Partial<FakeResponse>, boolean]> = [
    ['200 basic', { status: 200 }, true],
    ['206 basic (range do <video>) — `ok` mas parcial', { status: 206 }, false],
    ['204 basic — `ok` sem corpo', { status: 204 }, false],
    ['304 basic — não é `ok`, corpo vazio', { status: 304 }, false],
    ['200 redirected', { status: 200, redirected: true }, false],
    ['200 cors', { status: 200, type: 'cors' }, false],
    ['200 opaque (status 0 na prática)', { status: 0, ok: false, type: 'opaque' }, false],
    ['200 opaqueredirect', { status: 0, ok: false, type: 'opaqueredirect' }, false],
    ['201 basic — `ok`, mas não é 200', { status: 201 }, false],
    ['299 basic — borda alta do `ok`', { status: 299 }, false],
  ];

  for (const [nome, o, deveEntrar] of casos) {
    it(`asset em /assets/: ${nome} → ${deveEntrar ? 'ENTRA' : 'não entra'}`, async () => {
      const url = `${ORIGEM}/assets/coisa-abc12345.mp4`;
      const amb = montar({ [url]: resposta(o) });
      await amb.disparar({ url });
      expect(amb.puts.some(p => p.url === url), nome).toBe(deveEntrar);
      expect(amb.rejeicoes, 'nenhum Cache.put estourou sem tratamento').toEqual([]);
    });

    it(`navegação: ${nome} → ${deveEntrar ? 'ENTRA' : 'não entra'}`, async () => {
      const url = `${ORIGEM}/pagina`;
      const amb = montar({ [url]: resposta({ ...o, corpo: 'html' }) });
      await amb.disparar({ url, mode: 'navigate' });
      expect(amb.puts.some(p => p.url === url), nome).toBe(deveEntrar);
      expect(amb.rejeicoes).toEqual([]);
    });
  }

  it('o 206 ainda é ENTREGUE à página (o <video> precisa dele) — só não é gravado', async () => {
    const url = `${ORIGEM}/assets/intro-abc12345.mp4`;
    const amb = montar({ [url]: resposta({ status: 206, corpo: 'bytes parciais' }) });
    const res = await amb.disparar({ url });
    expect(res?.status).toBe(206);
    expect(res?.corpo).toBe('bytes parciais');
    expect(amb.puts).toEqual([]);
  });
});
