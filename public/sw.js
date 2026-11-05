// Soulmon Service Worker — cache-first for static assets

const CACHE_VERSION = 'v257';
const STATIC_CACHE = `soulmon-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `soulmon-runtime-${CACHE_VERSION}`;
/**
 * O ACERVO DE ASSETS (05/11/2026, pedido do dono: "com internet ruim demora a carregar o cenário").
 * Até aqui todo `/assets/*` morava no STATIC_CACHE, que tem a versão no nome — e o `activate` apaga
 * tudo que não é da versão atual. Cada bump de CACHE_VERSION (centenas, ~100 MB de assets) jogava
 * fora os cenários, sprites e chunks que NÃO mudaram, e o jogador baixava tudo de novo.
 * Os arquivos de `/assets/` têm HASH DE CONTEÚDO no nome (arquivo mudou = nome mudou; guard em
 * `src/deploy/swCache.contract.test.ts`), então são imutáveis: moram aqui, num cache SEM versão no
 * nome que o bump não apaga. Só o que mudou é baixado. Teto `ASSET_CACHE_MAX` entradas (as mais
 * antigas saem primeiro, no `activate`) para os nomes velhos não encherem o aparelho.
 * Trocar o NOME deste cache (v1 → v2) é o único jeito de esvaziá-lo de propósito.
 */
const ASSET_CACHE = 'soulmon-assets-v1';
const ASSET_CACHE_MAX = 6000;
/** Nome com hash de conteúdo (`cenario-AbC123xY.webp`): imutável, pode ir para o ASSET_CACHE. */
const temHash = (pathname) => /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/.test(pathname);
const cacheDoAsset = (pathname) => (temHash(pathname) ? ASSET_CACHE : STATIC_CACHE);

/**
 * Melhor-esforço: antes de apagar os caches de versão, os `/assets/` com hash que já estão neles passam
 * para o ASSET_CACHE — quem já tem tudo guardado não baixa de novo na primeira versão com o acervo.
 */
function migrarParaAcervo(nomes) {
  return caches.open(ASSET_CACHE).then((acervo) => Promise.all(nomes.map((nome) =>
    caches.open(nome).then((c) => c.keys().then((reqs) => Promise.all(reqs.map((req) => {
      const p = new URL(req.url).pathname;
      if (!p.startsWith('/assets/') || !temHash(p)) return undefined;
      return c.match(req).then((res) => (res ? acervo.put(req, res) : undefined)).catch(() => undefined);
    })))).catch(() => undefined),
  ))).catch(() => undefined);
}

/** Melhor-esforço: mantém o ASSET_CACHE abaixo do teto apagando os mais antigos (ordem de inserção). */
function podarAcervo() {
  return caches.open(ASSET_CACHE).then((c) => c.keys().then((keys) => {
    const sobra = keys.length - ASSET_CACHE_MAX;
    if (sobra <= 0) return undefined;
    return Promise.all(keys.slice(0, sobra).map((k) => c.delete(k).catch(() => false)));
  })).catch(() => undefined);
}

// Core shell — always cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-192x192.png',
  '/push-large-192.png',
  '/badge-96.png',
];

/**
 * Esta resposta pode entrar no cache?
 *
 * O `fetch` handler ja recusa outra origem na entrada, mas isso sozinho NAO
 * garante que a RESPOSTA veio de nos: uma URL nossa pode redirecionar para
 * fora (redirect aberto, hospedagem de terceiro, proxy), e o `cache.put` grava
 * o corpo do destino sob a NOSSA chave. Dai o SW passa a servir HTML/JS de
 * fonte nao controlada a partir da nossa origem, e serve para sempre — ate o
 * proximo bump de CACHE_VERSION.
 *
 * As tres condicoes, cada uma fechando um caminho distinto:
 *  - `ok`         : nao grava 404/500 sob o nome do recurso (a pagina de erro
 *                   viraria o "asset" ate a proxima versao);
 *  - `basic`      : exclui resposta opaca e de outra origem — um subrecurso
 *                   `no-cors` que termina fora do dominio volta como 'opaque',
 *                   um corpo que nem da para inspecionar;
 *  - `!redirected`: a URL final tem que ser a URL da chave. E este o caso do
 *                   redirect para fora numa navegacao, que volta 'basic'.
 */
function cacheavel(res) {
  // `status === 200`, nao `ok`: um 206 (range request do <video>, `.mp4`)
  // e `ok` e o `Cache.put` lanca "Partial response (status code 206) is
  // unsupported" — visto no console em 21/09/2026 (QA geral, etapa 4).
  return !!res && res.status === 200 && res.type === 'basic' && !res.redirected;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((todas) => migrarParaAcervo(todas.filter((k) => k.startsWith('soulmon-static-'))).then(() => todas)).then((keys) =>
      Promise.all(
        keys
          // O prefixo antigo (`digiapp-`) continua na varredura DE PROPÓSITO:
          // os caches com o nome velho existem no navegador de quem abriu uma
          // versão anterior, e só esta limpeza os alcança. Tirá-lo da lista
          // deixaria lixo permanente na origem — a única coisa que o rename de
          // 07/09/2026 poderia quebrar, e ela fica coberta.
          .filter((k) => (k.startsWith('soulmon-') || k.startsWith('digiapp-')) && k !== STATIC_CACHE && k !== RUNTIME_CACHE && k !== ASSET_CACHE)
          // `.catch` por chave: se UMA delecao falhar (cache em uso, quota,
          // storage em modo estrito), o `Promise.all` rejeitaria e o
          // `self.clients.claim()` abaixo — que esta no `.then` — nunca
          // rodaria. O usuario ficaria com o SW ANTIGO no controle da aba ate
          // recarregar, que e o oposto do que o skipWaiting/claim existe para
          // fazer. Limpeza e melhor-esforco; assumir o controle nao e.
          .map((k) => caches.delete(k).catch(() => false))
      )
    ).then(() => self.clients.claim(), () => self.clients.claim()).then(() => { podarAcervo(); })
  );
});

// Cache-first for same-origin assets (JS, CSS, images, fonts)
// Network-first for navigation (HTML) so updates reach the user
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Música-tema (S17) e músicas de combate (`/sounds/musica-*`, 19/10/2026): ~2,4 MB em streaming. Um `<audio>` pede por faixa de bytes
  // (`Range` → 206), e `cache.put` de 206 lança ou grava um pedaço sob a chave do
  // arquivo inteiro. O SW não toca nesses pedidos — o navegador cuida do Range e
  // do cache HTTP. (E ela nunca entra em PRECACHE_URLS: só baixa após o gesto.)
  if (request.headers.get('range') || url.pathname.startsWith('/sounds/tema-') || url.pathname.startsWith('/sounds/musica-')) return;

  // Never cache API calls (e.g. /api/save) — a cached cloud save could be
  // served stale offline and overwrite fresher local state.
  if (url.pathname.startsWith('/api/')) return;

  // /embed (utils/embedMode.ts): a página é servida com cabeçalhos PRÓPRIOS (frame-ancestors
  // liberado só para o portfólio). Nunca passa pelo SW: um index.html vindo do cache ou
  // gravado de outra rota carregaria X-Frame-Options: DENY e o iframe ficaria em branco.
  if (request.mode === 'navigate' && url.pathname === '/embed') return;

  // Navigation: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (cacheavel(res)) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (hashed filenames in /assets/): cache-first.
  // For PNG images, transparently serve the WebP version if the browser supports it.
  if (url.pathname.startsWith('/assets/')) {
    const acceptsWebP =
      url.pathname.endsWith('.png') &&
      (request.headers.get('Accept') || '').includes('image/webp');

    if (acceptsWebP) {
      const webpUrl = request.url.replace(/\.png$/, '.webp');
      const webpRequest = new Request(webpUrl, { headers: request.headers });
      event.respondWith(
        caches.match(webpRequest).then((cached) => {
          if (cached) return cached;
          return fetch(webpRequest)
            .then((res) => {
              if (!cacheavel(res)) throw new Error('WebP not found');
              const clone = res.clone();
              caches.open(cacheDoAsset(new URL(webpUrl).pathname)).then((c) => c.put(webpRequest, clone));
              return res;
            })
            .catch(() =>
              caches.match(request).then(
                (c) =>
                  c ||
                  fetch(request).then((res) => {
                    if (cacheavel(res)) {
                      const clone = res.clone();
                      caches.open(cacheDoAsset(url.pathname)).then((cache) => cache.put(request, clone));
                    }
                    return res;
                  })
              )
            );
        })
      );
      return;
    }

    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (cacheavel(res)) {
              const clone = res.clone();
              caches.open(cacheDoAsset(url.pathname)).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Other same-origin resources (manifest, icons): network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (cacheavel(res)) {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

/**
 * Os dois ícones do push (canvas Fora do app, D-F14/D-F15, X6/X9):
 *  · `icon` = o ícone GRANDE, um mini-visor REDONDO com a chama da marca — o
 *    Android 12+ recorta o largeIcon em círculo, então o PNG já nasce círculo
 *    (`#071413` + a chama de `src/brand/flame.ts` a 1×, ponto mais distante do
 *    centro a 63 < 96).
 *  · `badge` = ALFA-ONLY: a barra de status pinta só a silhueta e descarta a
 *    cor. Até 20/09/2026 o badge era o favicon (quadrado escuro cheio), que
 *    virava um BLOCO PRETO na barra de status — e o Web Push também roda no
 *    WebView do APK. `badge-96.png` é a chama branca em transparente, o mesmo
 *    desenho do `ic_notification.xml` do Android.
 * Os dois vêm de `src/brand/flame.ts` (gerados com Pillow; ver o commit).
 */
const PUSH_ICON = '/push-large-192.png';
const PUSH_BADGE = '/badge-96.png';

// Show notification triggered from app via postMessage
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title, {
        body: event.data.body,
        icon: event.data.icon || PUSH_ICON,
        badge: PUSH_BADGE,
        tag: event.data.tag,
        requireInteraction: false,
        data: { url: '/' },
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: PUSH_ICON,
      badge: PUSH_BADGE,
      tag: data.tag,
      renotify: false,
      data: { url: '/' },
    })
  );
});

// Focus or open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      /* WP0.11 — `?src=push` marca a ORIGEM da abertura. Existe para uma
         decisão só: cortar notificação que traz alguém e não vira dia ativo.
         Um push que interrompe e não serve para nada é atenção alheia gasta.
         (Aba já aberta é `focus()` acima e não recebe a marca — ela não foi
         ABERTA pelo push.) */
      return self.clients.openWindow('/?src=push');
    })
  );
});
