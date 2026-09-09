/**
 * 200 COM CORPO ILEGÍVEL É FALHA — não sucesso vazio.
 *
 * ## O defeito, medido no navegador (09/09/2026)
 *
 * O helper `call()` de `utils/community.ts` fazia
 * `await res.json().catch(() => ({}))`. Quando a resposta vinha 200 com corpo
 * que não é JSON, o `catch` engolia o erro, `res.ok` era `true`, nada lançava,
 * e o chamador recebia `{}` **como se fosse a resposta do servidor**.
 *
 * O que isso produziu na tela do Torneio, aba Ranking:
 *
 *  · `getRank()` resolvia com `{}` → `r.rank` é `undefined`;
 *  · `setRank(undefined)` deixava `rank` FALSO;
 *  · os dois ramos de estado — "a season ainda não tem placar" e "falhou,
 *    tentar de novo" — exigem `rank` verdadeiro, então **nenhum dos dois
 *    aparecia**: a área do ranking ficava em branco, sem explicação;
 *  · e o efeito, que depende de `!rank`, disparava a requisição DUAS vezes
 *    (as duas chamadas idênticas apareceram no painel de rede).
 *
 * O jogador vê uma aba que carrega e não mostra nada, para sempre. É o pior
 * dos três estados possíveis: pior que "vazio" (que informa) e pior que "deu
 * erro" (que oferece tentar de novo).
 *
 * ⚠️ Não é hipótese de laboratório. 200 com HTML é exatamente o que devolve um
 * portal cativo de Wi-Fi, um proxy corporativo, uma página de erro de CDN e o
 * servidor de desenvolvimento do Vite. Todas as ações de
 * `functions/api/community.js` respondem pelo helper `json` (→
 * `Response.json`), então corpo ilegível ali **nunca** é resposta legítima.
 *
 * ## Por que o teste é no HELPER
 *
 * Porque o defeito não era do Torneio: era de `call()`, e `call()` é o caminho
 * de TODA a superfície de comunidade — perfil, amigos, presentes, troféus,
 * grupo, PvP, ranking. Consertar só a tela deixaria o mesmo buraco nas outras.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* `./auth` fala com o Firebase; o assunto aqui é o PARSE da resposta, então o
   dublê devolve cabeçalho vazio. `importOriginal` para não sumir com o resto
   do módulo — outros consumidores dele podem entrar nesta suíte depois. */
vi.mock('./auth', async importOriginal => ({
  ...(await importOriginal<typeof import('./auth')>()),
  authHeaders: async () => ({}),
}));

const respostas: Array<{ url: string }> = [];

/** Um `fetch` que devolve o que o teste mandar, e registra as chamadas. */
function stub(body: string, init: ResponseInit = { status: 200 }) {
  respostas.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: unknown) => {
    respostas.push({ url: String(url) });
    return new Response(body, init);
  }));
}

beforeEach(() => { respostas.length = 0; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('🔴 corpo ilegível não vira resposta', () => {
  it('200 com HTML LANÇA — era o caso que virava `{}` em silêncio', async () => {
    // O corpo é o de um portal cativo / servidor de dev respondendo index.html.
    stub('<!DOCTYPE html><html><body>Wi-Fi login</body></html>');
    const { getRank } = await import('./community');
    await expect(getRank()).rejects.toThrow(/ileg[íi]vel/i);
  });

  it('200 com corpo VAZIO também lança — `Response.json()` não aceita vazio', async () => {
    stub('');
    const { getRank } = await import('./community');
    await expect(getRank()).rejects.toThrow();
  });

  it('200 com JSON de verdade PASSA — senão o conserto teria quebrado a rota', async () => {
    stub(JSON.stringify({ season: '2026-09', rank: [{ id: 'a', name: 'Alguém', points: 10 }] }));
    const { getRank } = await import('./community');
    const r = await getRank();
    expect(r.rank).toHaveLength(1);
  });

  it('200 com JSON SEM o campo esperado resolve — e a decisão é do chamador', async () => {
    // Aqui o helper não tem como saber o que faltou; quem sabe é a tela. Por
    // isso o `TournamentPage` também ganhou `?? []` (defesa em duas camadas), e
    // o caso abaixo trava essa defesa.
    stub(JSON.stringify({ season: '2026-09' }));
    const { getRank } = await import('./community');
    const r = await getRank();
    expect(r.rank).toBeUndefined();
  });

  it('erro com JSON continua trazendo a MENSAGEM do servidor', async () => {
    // O conserto não podia custar a mensagem: ela é o que a tela mostra.
    stub(JSON.stringify({ error: 'rate limited' }), { status: 429 });
    const { getRank } = await import('./community');
    await expect(getRank()).rejects.toThrow('rate limited');
  });

  it('erro SEM JSON traz o status, e não a palavra "ilegível"', async () => {
    // 502 com HTML é falha de infraestrutura: o status é a informação útil.
    stub('<html>502 Bad Gateway</html>', { status: 502 });
    const { getRank } = await import('./community');
    await expect(getRank()).rejects.toThrow(/502/);
  });

  it('uma chamada é UMA requisição — o defeito disparava duas', async () => {
    stub(JSON.stringify({ season: '2026-09', rank: [] }));
    const { getRank } = await import('./community');
    await getRank();
    expect(respostas).toHaveLength(1);
  });
});

describe('a tela do Torneio não deixa `rank` indefinido', () => {
  it('o `?? []` está no lugar — é o que separa "em branco" de "vazio"', async () => {
    // Afirmação sobre o CÓDIGO porque o caminho depende de efeito + aba, e o
    // que precisa não regredir é uma linha: `setRank(r.rank ?? [])`. Sem ela,
    // um JSON válido sem `rank` reproduz o branco original.
    const { readFileSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const src = readFileSync(
      join(resolve(__dirname, '..'), 'components/TournamentPage.tsx'), 'utf8',
    );
    expect(src).toMatch(/setRank\(r\.rank \?\? \[\]\)/);
    // E os dois estados que dependem disso continuam existindo.
    expect(src).toMatch(/rank && rank\.length === 0 && !rankFailed/);
    expect(src).toMatch(/rankFailed &&/);
  });
});
