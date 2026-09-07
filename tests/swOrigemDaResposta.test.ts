// ===========================================================================
// GUARD — "o service worker so guarda resposta que e NOSSA".
//
// As duas auditorias de 26/ago/2026 (`auditoria-rotas.md`,
// `auditoria-cliente.md`) declararam o `sw.js` fora de escopo. Ele e o pior
// lugar para deixar sem cobertura: nao e caminho de DADO, e caminho de
// EXECUCAO. Um HTML ou JS que entre no cache passa a ser servido a partir da
// nossa origem, com a nossa sessao, para SEMPRE — ate o proximo bump de
// CACHE_VERSION.
//
// O que este arquivo cobre, e que `src/deploy/swCache.contract.test.ts` (que
// cobre versionamento e frescor) nao cobria: a ORIGEM da resposta gravada.
// A checagem de entrada (`url.origin !== self.location.origin`) filtra a
// REQUISICAO, nao a RESPOSTA — uma URL nossa que redireciona para fora volta
// com corpo de terceiro e era gravada sob a NOSSA chave.
//
// Aqui o `sw.js` de producao roda DE VERDADE num ambiente falso de service
// worker (sem navegador): registramos os handlers, disparamos `fetch` e
// olhamos o que sobrou no cache. Nao e leitura de texto — e comportamento.
// ===========================================================================
import { describe, it, expect } from 'vitest';
import fonteSw from '../public/sw.js?raw';

const ORIGEM = 'https://soulmon.mateus-sprnd.workers.dev';

/** Resposta falsa com o minimo que o `sw.js` toca. */
function resposta(opts: Partial<FakeResponse> = {}): FakeResponse {
  const r: FakeResponse = {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    type: opts.type ?? 'basic',
    redirected: opts.redirected ?? false,
    corpo: opts.corpo ?? 'nosso',
    clone() {
      return { ...r, clone: r.clone };
    },
  };
  return r;
}
interface FakeResponse {
  ok: boolean;
  status: number;
  type: string;
  redirected: boolean;
  corpo: string;
  clone(): FakeResponse;
}

interface Ambiente {
  disparar(req: FakeRequest): Promise<FakeResponse | undefined>;
  ativar(): Promise<void>;
  cacheDe(nome: string): Map<string, FakeResponse>;
  todosOsCaches(): Map<string, Map<string, FakeResponse>>;
  claims: number;
}
interface FakeRequest {
  url: string;
  method?: string;
  mode?: string;
  headers?: { get(k: string): string | null };
}

/**
 * Monta o ambiente e EXECUTA o `sw.js` de producao dentro dele.
 *
 * @param rede o que a rede responde para cada URL; `null` = falha de rede.
 */
function montar(
  rede: Record<string, FakeResponse | null>,
  cachesIniciais: string[] = [],
  /** Nome de cache cuja delecao FALHA — simula cache em uso / quota / storage estrito. */
  deleteQueFalha?: string,
): Ambiente {
  const armazem = new Map<string, Map<string, FakeResponse>>();
  for (const nome of cachesIniciais) armazem.set(nome, new Map());
  const pendentes: Promise<unknown>[] = [];
  const handlers: Record<string, (e: Record<string, unknown>) => void> = {};
  const ambiente: Partial<Ambiente> = { claims: 0 };

  const abrir = (nome: string) => {
    if (!armazem.has(nome)) armazem.set(nome, new Map());
    const m = armazem.get(nome)!;
    return Promise.resolve({
      put: (req: FakeRequest | string, res: FakeResponse) => {
        m.set(typeof req === 'string' ? req : req.url, res);
        return Promise.resolve();
      },
      addAll: (urls: string[]) => {
        for (const u of urls) m.set(new URL(u, ORIGEM).href, resposta());
        return Promise.resolve();
      },
    });
  };

  const cachesFalso = {
    open: abrir,
    keys: () => Promise.resolve([...armazem.keys()]),
    delete: (nome: string) =>
      nome === deleteQueFalha
        ? Promise.reject(new Error('cache em uso'))
        : Promise.resolve(armazem.delete(nome)),
    match: (req: FakeRequest | string) => {
      const chave = typeof req === 'string' ? new URL(req, ORIGEM).href : req.url;
      for (const m of armazem.values()) if (m.has(chave)) return Promise.resolve(m.get(chave));
      return Promise.resolve(undefined);
    },
  };

  const self = {
    location: { origin: ORIGEM },
    addEventListener: (tipo: string, fn: (e: Record<string, unknown>) => void) => {
      handlers[tipo] = fn;
    },
    skipWaiting: () => {},
    clients: {
      claim: () => {
        (ambiente.claims as number)++;
        return Promise.resolve();
      },
      matchAll: () => Promise.resolve([]),
      openWindow: () => Promise.resolve(null),
    },
    registration: { showNotification: () => Promise.resolve() },
  };

  const fetchFalso = (req: FakeRequest | string) => {
    const url = typeof req === 'string' ? req : req.url;
    const r = rede[url];
    if (r === undefined || r === null) return Promise.reject(new Error(`sem rede: ${url}`));
    return Promise.resolve(r);
  };

  const RequestFalso = function (this: FakeRequest, url: string, init?: { headers?: unknown }) {
    this.url = url;
    this.method = 'GET';
    this.headers = (init?.headers as FakeRequest['headers']) ?? { get: () => null };
  } as unknown as new (u: string, i?: unknown) => FakeRequest;

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const rodar = new Function('self', 'caches', 'fetch', 'Request', 'URL', fonteSw);
  rodar(self, cachesFalso, fetchFalso, RequestFalso, URL);

  ambiente.disparar = async (req) => {
    let saidaP: Promise<FakeResponse> | undefined;
    handlers.fetch({
      request: { method: 'GET', mode: 'no-cors', headers: { get: () => null }, ...req },
      respondWith: (p: Promise<FakeResponse>) => {
        saidaP = p;
      },
      waitUntil: (p: Promise<unknown>) => pendentes.push(p),
    });
    const saida = saidaP ? await saidaP : undefined;
    // Os `cache.put` sao disparados sem await dentro do handler (de proposito:
    // a resposta nao espera a gravacao). Duas voltas de microtask bastam.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    return saida;
  };
  ambiente.ativar = async () => {
    let espera: Promise<unknown> = Promise.resolve();
    handlers.activate({ waitUntil: (p: Promise<unknown>) => (espera = p) });
    await espera.catch(() => {});
    await Promise.resolve();
    await Promise.resolve();
  };
  ambiente.cacheDe = (nome) => armazem.get(nome) ?? new Map();
  ambiente.todosOsCaches = () => armazem;
  return ambiente as Ambiente;
}

/** Nome do cache estatico atual, lido do proprio arquivo (segue o bump). */
const VERSAO = fonteSw.match(/const CACHE_VERSION = '([^']+)'/)?.[1] ?? '';
const STATIC = `soulmon-static-${VERSAO}`;
const RUNTIME = `soulmon-runtime-${VERSAO}`;

describe('0. AUTOVERIFICACAO do ambiente falso', () => {
  it('a versao foi lida e o caminho feliz grava no cache', async () => {
    expect(VERSAO).toMatch(/^v\d+$/);
    const amb = montar({ [`${ORIGEM}/assets/app-abc12345.js`]: resposta() });
    await amb.disparar({ url: `${ORIGEM}/assets/app-abc12345.js` });
    expect(amb.cacheDe(STATIC).has(`${ORIGEM}/assets/app-abc12345.js`)).toBe(true);
  });
});

describe('1. resposta REDIRECIONADA nunca entra no cache', () => {
  it('navegacao que termina fora do dominio nao vira o nosso HTML', async () => {
    // O cenario: qualquer redirect aberto (ou hospedagem/proxy mal
    // configurado) em uma rota nossa. O corpo que volta e de terceiro, mas a
    // CHAVE do cache e a nossa URL. Gravado, o SW passa a servir aquele HTML
    // a partir da nossa origem — com o nosso localStorage e a nossa sessao.
    const url = `${ORIGEM}/entrar`;
    const amb = montar({ [url]: resposta({ redirected: true, corpo: 'HTML DO ATACANTE' }) });
    const res = await amb.disparar({ url, mode: 'navigate' });
    expect(res?.corpo, 'a resposta ainda passa para a pagina — quem decide e o navegador').toBe('HTML DO ATACANTE');
    expect(amb.cacheDe(STATIC).has(url), 'mas NAO pode ter ficado no cache').toBe(false);
  });

  it('asset redirecionado tambem nao entra (cache-first o serviria para sempre)', async () => {
    const url = `${ORIGEM}/assets/app-abc12345.js`;
    const amb = montar({ [url]: resposta({ redirected: true, corpo: 'JS DE FORA' }) });
    await amb.disparar({ url });
    expect(amb.cacheDe(STATIC).has(url)).toBe(false);
  });
});

describe('2. resposta OPACA / de outra origem nunca entra no cache', () => {
  it('type opaque num subrecurso e recusado', async () => {
    const url = `${ORIGEM}/assets/sprite-abc12345.png`;
    const amb = montar({ [url]: resposta({ type: 'opaque', ok: false, status: 0 }) });
    await amb.disparar({ url });
    expect(amb.cacheDe(STATIC).has(url)).toBe(false);
  });

  it('type cors tambem e recusado no cache de runtime', async () => {
    const url = `${ORIGEM}/manifest.json`;
    const amb = montar({ [url]: resposta({ type: 'cors' }) });
    await amb.disparar({ url });
    expect(amb.cacheDe(RUNTIME).has(url)).toBe(false);
  });
});

describe('3. resposta de ERRO nunca entra no cache', () => {
  it('um 500 na navegacao nao congela a pagina de erro sob a URL real', async () => {
    const url = `${ORIGEM}/jogo`;
    const amb = montar({ [url]: resposta({ ok: false, status: 500, corpo: 'erro do servidor' }) });
    await amb.disparar({ url, mode: 'navigate' });
    expect(amb.cacheDe(STATIC).has(url)).toBe(false);
  });

  it('um 404 de asset nao vira o asset', async () => {
    const url = `${ORIGEM}/assets/app-abc12345.js`;
    const amb = montar({ [url]: resposta({ ok: false, status: 404, corpo: 'not found' }) });
    await amb.disparar({ url });
    expect(amb.cacheDe(STATIC).has(url)).toBe(false);
  });
});

describe('4. o que ja estava CERTO continua certo (nao regredir ao consertar)', () => {
  it('outra origem nem chega ao handler — nada e gravado', async () => {
    const url = 'https://cdn.exemplo.com/x.js';
    const amb = montar({ [url]: resposta() });
    const res = await amb.disparar({ url });
    expect(res, 'sem respondWith: o navegador cuida sozinho').toBeUndefined();
    for (const m of amb.todosOsCaches().values()) expect(m.has(url)).toBe(false);
  });

  it('/api/ nunca e cacheado (save velho servido do cache e perda de save)', async () => {
    const url = `${ORIGEM}/api/save`;
    const amb = montar({ [url]: resposta() });
    expect(await amb.disparar({ url })).toBeUndefined();
    for (const m of amb.todosOsCaches().values()) expect(m.has(url)).toBe(false);
  });

  it('a navegacao offline cai no index.html do precache', async () => {
    const amb = montar({}, [STATIC]);
    amb.cacheDe(STATIC).set(`${ORIGEM}/index.html`, resposta({ corpo: 'casca offline' }));
    const res = await amb.disparar({ url: `${ORIGEM}/jogo`, mode: 'navigate' });
    expect(res?.corpo).toBe('casca offline');
  });
});

describe('5. a limpeza de cache velho e melhor-esforco — o claim nao e', () => {
  it('apaga as versoes anteriores e assume o controle', async () => {
    // Os dois prefixos entram: os caches `digiapp-*` existem no navegador de
    // quem abriu uma versão anterior ao rename de 07/09/2026, e só esta
    // limpeza os alcança. `outro-app-cache` é de outra origem e fica.
    const amb = montar({}, ['digiapp-static-v1', 'soulmon-runtime-v1', STATIC, 'outro-app-cache']);
    await amb.ativar();
    expect([...amb.todosOsCaches().keys()]).toEqual([STATIC, 'outro-app-cache']);
    expect(amb.claims).toBe(1);
  });

  it('se UMA delecao falhar, o SW novo AINDA assume o controle da aba', async () => {
    // Sem isto o `Promise.all` rejeita, o `.then` nunca roda e o
    // `clients.claim()` nunca acontece: a aba continua com o SW ANTIGO no
    // controle ate um recarregamento — o oposto exato do que o par
    // skipWaiting/claim existe para garantir. Falha de `caches.delete` nao e
    // hipotetica: cache em uso, quota estourada, storage em modo estrito.
    const amb = montar({}, ['digiapp-static-v1', 'soulmon-runtime-v1', STATIC], 'digiapp-static-v1');
    await amb.ativar();
    // a que falhou continua la; a outra foi apagada assim mesmo
    expect(amb.todosOsCaches().has('digiapp-static-v1')).toBe(true);
    expect(amb.todosOsCaches().has('soulmon-runtime-v1')).toBe(false);
    expect(amb.claims, 'o claim tem que acontecer mesmo com a limpeza falhando').toBe(1);
  });
});
