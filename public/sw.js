// DigiApp Service Worker — cache-first for static assets

const CACHE_VERSION = 'v11';
const STATIC_CACHE = `digiapp-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `digiapp-runtime-${CACHE_VERSION}`;

// Core shell — always cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon-192x192.png',
];

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
          .filter((k) => k.startsWith('digiapp-') && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
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
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
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
              if (!res.ok) throw new Error('WebP not found');
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(webpRequest, clone));
              return res;
            })
            .catch(() =>
              caches.match(request).then(
                (c) =>
                  c ||
                  fetch(request).then((res) => {
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, res.clone()));
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
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
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
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// Show notification triggered from app via postMessage
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(event.data.title, {
        body: event.data.body,
        icon: event.data.icon || '/favicon-192x192.png',
        badge: '/favicon-192x192.png',
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
      icon: '/favicon-192x192.png',
      badge: '/favicon-192x192.png',
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
      return self.clients.openWindow('/');
    })
  );
});
