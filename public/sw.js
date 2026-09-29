// Soulmon Service Worker — cache-first for static assets

const CACHE_VERSION = 'v172';
const STATIC_CACHE = `soulmon-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `soulmon-runtime-${CACHE_VERSION}`;

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
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // O prefixo antigo (`digiapp-`) continua na varredura DE PROPÓSITO:
          // os caches com o nome velho existem no navegador de quem abriu uma
          // versão anterior, e só esta limpeza os alcança. Tirá-lo da lista
          // deixaria lixo permanente na origem — a única coisa que o rename de
          // 07/09/2026 poderia quebrar, e ela fica coberta.
          .filter((k) => (k.startsWith('soulmon-') || k.startsWith('digiapp-')) && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          // `.catch` por chave: se UMA delecao falhar (cache em uso, quota,
          // storage em modo estrito), o `Promise.all` rejeitaria e o
          // `self.clients.claim()` abaixo — que esta no `.then` — nunca
          // rodaria. O usuario ficaria com o SW ANTIGO no controle da aba ate
          // recarregar, que e o oposto do que o skipWaiting/claim existe para
          // fazer. Limpeza e melhor-esforco; assumir o controle nao e.
          .map((k) => caches.delete(k).catch(() => false))
      )
    ).then(() => self.clients.claim(), () => self.clients.claim())
  );
});

// Cache-first for same-origin assets (JS, CSS, images, fonts)
// Network-first for navigation (HTML) so updates reach the user
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API calls (e.g. /api/save) — a cached cloud save could be
  // served stale offline and overwrite fresher local state.
  if (url.pathname.startsWith('/api/')) return;

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
              caches.open(STATIC_CACHE).then((c) => c.put(webpRequest, clone));
              return res;
            })
            .catch(() =>
              caches.match(request).then(
                (c) =>
                  c ||
                  fetch(request).then((res) => {
                    if (cacheavel(res)) {
                      const clone = res.clone();
                      caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
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
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
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
