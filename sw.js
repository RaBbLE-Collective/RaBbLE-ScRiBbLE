/* sw.js — ScRiBbLE offline app shell.
 * Cache-first for same-origin app files (so the board still opens with no
 * network); network-first with cache fallback for the cross-origin Aether/
 * NeBuLA CDN bundles (so a real deploy always gets the latest bundle, but a
 * flight-mode reload still renders using whatever was cached last time).
 * Bump CACHE_NAME on any app-shell change to evict stale entries.
 */
const CACHE_NAME = 'rabble-scribble-shell-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/css/RaBbLE-scribble.css',
  '/src/js/RaBbLE-canvas-engine.js',
  '/src/js/RaBbLE-render.js',
  '/src/js/RaBbLE-toolbar.js',
  '/src/js/RaBbLE-text-tool.js',
  '/src/js/RaBbLE-store.js',
  '/src/js/RaBbLE-app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Cross-origin (Aether/NeBuLA CDN) — network-first, cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
