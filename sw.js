/**
 * sw.js — Mentorix PWA Service Worker Engine
 * Cache-First Static Assets, Network-First API Fallback, Versioned Cache Cleanup
 */

const CACHE_NAME = 'mentorix-shell-v1.1-a8ffd97';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/js/router.js',
  '/js/helpers.js',
  '/modules/questionEngine/QuestionEngine.js',
  '/js/services/moduleRegistry.js',
  '/js/services/indexedDBCache.js',
  '/data/pyqService.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for dynamic API / WebSocket
  if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  // Cache-first with network fallback for static assets & chapter JSONs
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
