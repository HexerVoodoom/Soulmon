
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();
clientsClaim();

// ==============
// NOTIFICATIONS
// ==============

// A) Local Notifications (via postMessage)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: '/favicon-192x192.png',
            badge: '/favicon-192x192.png'
        });
    }
});

// B) Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon-192x192.png',
        badge: '/favicon-192x192.png'
    });
});
