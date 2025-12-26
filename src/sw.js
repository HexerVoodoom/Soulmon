import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Clean up old caches
cleanupOutdatedCaches();

// Precache and route assets
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Skip waiting to activate strictly
self.skipWaiting();
clientsClaim();

// Custom Notification Logic
self.addEventListener("message", a => {
    if (a.data && a.data.type === "SHOW_NOTIFICATION") {
        self.registration.showNotification(a.data.title, {
            body: a.data.body,
            icon: "/favicon-192x192.png",
            badge: "/favicon-192x192.png"
        });
    }
});

self.addEventListener("push", a => {
    if (!a.data) return;
    const e = a.data.json();
    self.registration.showNotification(e.title, {
        body: e.body,
        icon: "/favicon-192x192.png",
        badge: "/favicon-192x192.png"
    });
});
