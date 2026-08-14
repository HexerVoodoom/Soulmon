import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ===========================================================================
// GUARD — "usuário com service worker antigo recebe deploy novo".
//
// A pergunta original ("bump manual do CACHE_VERSION, e se alguém esquecer?")
// não é testável de dentro do repo: exige dois deploys reais e um navegador com
// o SW anterior instalado. A rodada 4 registrou isso como ABERTO e se recusou a
// inventar um resultado.
//
// O que É testável, e é o que decide a pergunta: o bundle novo só pode ficar
// preso em cache velho se UMA das invariantes abaixo cair. Enquanto as seis
// valerem, ESQUECER o bump do CACHE_VERSION não prende ninguém num bundle
// velho — o efeito fica restrito ao fallback OFFLINE (ver §7). Cada invariante
// vira um caso.
//
// Isto não é uma prova de que o deploy funciona. É a prova de que o modo de
// falha "JS novo, cache velho" está fechado POR CONSTRUÇÃO, e a delimitação
// honesta do que sobra.
// ===========================================================================

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(RAIZ, p), 'utf8');
const sw = ler('public/sw.js');
const headers = ler('public/_headers');
const distHtml = existsSync(resolve(RAIZ, 'dist/index.html')) ? ler('dist/index.html') : null;

/** URLs de asset que o HTML publicado manda o navegador buscar. */
function assetsDoHtml(html: string): string[] {
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]);
}

describe('1. o nome do bundle muda a cada build (cache-first não alcança bundle novo)', () => {
  it('todo asset do HTML publicado tem hash de conteúdo no nome', () => {
    expect(distHtml, 'rode `npm run build` antes').not.toBeNull();
    const assets = assetsDoHtml(distHtml!);
    expect(assets.length, 'AUTOVERIFICAÇÃO: o extrator achou assets').toBeGreaterThan(0);
    for (const a of assets) {
      // `index-DKHQ7iRe.js` — sufixo de ≥8 chars base64url antes da extensão.
      expect(a, `${a} não tem hash: um deploy novo reusaria a MESMA URL e o
        handler cache-first de /assets/ serviria o arquivo velho para sempre`)
        .toMatch(/-[A-Za-z0-9_-]{8,}\.(js|css)$/);
    }
  });

  it('AUTOVERIFICAÇÃO: o guard reprova um nome sem hash', () => {
    expect(assetsDoHtml('<script src="/assets/index.js">')[0]).not.toMatch(/-[A-Za-z0-9_-]{8,}\.(js|css)$/);
  });

  it('o HTML publicado não aponta para asset que não foi publicado', () => {
    // Modo de falha oposto e igualmente branco: dist/index.html commitado sem
    // o dist/assets/ correspondente.
    for (const a of assetsDoHtml(distHtml!)) {
      expect(existsSync(resolve(RAIZ, 'dist', a.slice(1))), `${a} não existe em dist/`).toBe(true);
    }
  });
});

describe('2. o precache do install não consegue fixar um bundle', () => {
  it('PRECACHE_URLS não contém nenhum JS/CSS nem nada de /assets/', () => {
    const bloco = sw.match(/const PRECACHE_URLS = \[([\s\S]*?)\]/)?.[1] ?? '';
    const urls = [...bloco.matchAll(/'([^']+)'/g)].map(m => m[1]);
    expect(urls.length, 'AUTOVERIFICAÇÃO: leu a lista').toBeGreaterThan(0);
    for (const u of urls) {
      expect(u, `${u} no precache prenderia esta versão até o próximo bump`)
        .not.toMatch(/\.(js|css)$|^\/assets\//);
    }
  });
});

describe('3. a navegação é network-first (o HTML novo sempre chega antes do cache)', () => {
  const nav = sw.match(/if \(request\.mode === 'navigate'\) \{([\s\S]*?)\n {4}return;/)?.[1] ?? '';

  it('AUTOVERIFICAÇÃO: o bloco de navegação foi encontrado', () => {
    expect(nav.length).toBeGreaterThan(50);
  });

  it('busca a rede PRIMEIRO e só cai no cache no `.catch`', () => {
    const posFetch = nav.indexOf('fetch(request)');
    const posCache = nav.indexOf('caches.match');
    expect(posFetch).toBeGreaterThanOrEqual(0);
    expect(posCache).toBeGreaterThan(posFetch); // cache depois = fallback
    expect(nav).toMatch(/\.catch\(\(\)\s*=>\s*caches\.match/);
    // O oposto — `caches.match(...).then(c => c || fetch(...))` — serviria o
    // index.html velho enquanto o cache existisse. É o padrão proibido aqui.
    expect(nav).not.toMatch(/caches\.match\([^)]*\)\s*\.then\([^)]*\|\|\s*fetch/);
  });
});

describe('4. ativar um SW novo APAGA os caches das versões anteriores', () => {
  const act = sw.match(/addEventListener\('activate'([\s\S]*?)\n\}\);/)?.[1] ?? '';

  it('AUTOVERIFICAÇÃO: o handler de activate foi encontrado', () => {
    expect(act).toContain('caches.keys');
  });

  it('apaga toda chave que não seja a STATIC/RUNTIME atuais', () => {
    expect(act).toMatch(/k !== STATIC_CACHE && k !== RUNTIME_CACHE/);
    expect(act).toMatch(/caches\.delete\(k\)/);
  });

  it('os nomes dos caches derivam do CACHE_VERSION (senão a limpeza nunca dispara)', () => {
    expect(sw).toMatch(/const STATIC_CACHE = `[^`]*\$\{CACHE_VERSION\}`/);
    expect(sw).toMatch(/const RUNTIME_CACHE = `[^`]*\$\{CACHE_VERSION\}`/);
    // O filtro tem que casar com o PREFIXO real dos nomes, senão o activate
    // "limpa" um conjunto vazio e o bump vira placebo.
    const prefixoDoFiltro = act.match(/startsWith\('([^']+)'\)/)?.[1];
    expect(prefixoDoFiltro).toBeTruthy();
    expect(sw).toMatch(new RegExp(`const STATIC_CACHE = \`${prefixoDoFiltro}`));
  });
});

describe('5. o SW novo assume na PRIMEIRA carga, não na segunda', () => {
  it('install chama skipWaiting e activate chama clients.claim', () => {
    expect(sw).toMatch(/addEventListener\('install'[\s\S]*?self\.skipWaiting\(\)/);
    expect(sw).toMatch(/addEventListener\('activate'[\s\S]*?self\.clients\.claim\(\)/);
  });
});

describe('6. o navegador não pode servir SW nem HTML velhos do cache HTTP', () => {
  /** Regra do arquivo `_headers` do Cloudflare Pages para um caminho. */
  function regra(caminho: string): string {
    const bloco = headers.split(/\n(?=\S)/).find(b => b.trimStart().startsWith(caminho));
    return bloco ?? '';
  }

  it('AUTOVERIFICAÇÃO: o parser de `_headers` acha um bloco conhecido', () => {
    expect(regra('/assets/*')).toMatch(/immutable/);
  });

  it('/sw.js é no-store — sem isto o deploy novo demora até o cache HTTP expirar', () => {
    expect(regra('/sw.js')).toMatch(/no-store/);
  });

  it('/index.html não é cacheado', () => {
    expect(regra('/index.html')).toMatch(/no-cache|no-store/);
  });

  it('e /assets/* PODE ser immutable — justamente porque o nome tem hash (§1)', () => {
    expect(regra('/assets/*')).toMatch(/max-age=31536000/);
  });
});

describe('7. o que o CACHE_VERSION ainda protege — e o que continua sem cobertura', () => {
  it('/api/ nunca é cacheado (um save velho servido do cache é perda de save)', () => {
    expect(sw).toMatch(/url\.pathname\.startsWith\('\/api\/'\)\)\s*return;/);
  });

  it('LIMITE DECLARADO: o fallback OFFLINE serve o index.html do precache', () => {
    // O único caminho em que o bump do CACHE_VERSION é load-bearing: sem rede,
    // a navegação cai em `caches.match('/index.html')`, que é a cópia gravada
    // no INSTALL do SW. Se o HTML mudou sem bump, o usuário OFFLINE (e só ele)
    // recebe o HTML da instalação. Este caso documenta o fato em vez de fingir
    // que está coberto — a verificação de ponta a ponta exige dois deploys
    // reais e um navegador com o SW anterior, o que não é reproduzível daqui.
    expect(sw).toContain("caches.match('/index.html')");
    expect(sw.match(/const CACHE_VERSION = '(v\d+)'/)?.[1]).toMatch(/^v\d+$/);
  });
});
