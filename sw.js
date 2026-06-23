/* Unit Calculator — Service Worker
   Strategy: cache-first for all app files.
   Bump CACHE_NAME when you deploy a new version. */

const CACHE_NAME = 'unit-calc-v1';

const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

/* Install: pre-cache all app shell files */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* Activate: delete any old caches from previous versions */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: serve from cache, fall back to network */
self.addEventListener('fetch', (event) => {
  /* Only handle GET requests for same-origin resources */
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          /* Only cache valid same-origin responses */
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'opaque'
          ) {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, toCache)
          );
          return response;
        })
        .catch(() => {
          /* Network failed and nothing in cache — return offline fallback */
          return caches.match('./index.html');
        });
    })
  );
});
