/**
 * sw.js — Mentorix Service Worker v55
 * NETWORK-FIRST for JS/CSS/JSON so code changes always reach users.
 * PYQ data files always bypass cache (never stale).
 */

const CACHE_NAME = 'mentorix-v71';

// Files to pre-cache on install (only truly static: html, images, manifest)
const CORE_ASSETS = [
  './',
  './index.html',
  './logo.png',
  './manifest.json',
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: nuke ALL old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // AI proxy — never cache, let browser handle
  if (url.includes('mentorix-proxy') || url.includes('groq.com') ||
      url.includes('googleapis') || url.includes('cloudflare') ||
      url.includes('workers.dev')) {
    return;
  }

  // PYQ data files — ALWAYS network, never cache (data changes frequently)
  if (url.includes('/data/pyq/') || url.includes('pyqService') ||
      url.includes('master_index')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Navigation (HTML) — network-first
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok && e.request.url.startsWith('http')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // JS / CSS / JSON — NETWORK-FIRST (so updates always reach browser)
  if (url.match(/\.(js|css|json)$/)) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok && e.request.method === 'GET' && e.request.url.startsWith('http')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else (images, fonts) — cache-first
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(response => {
            if (response.ok && e.request.method === 'GET' && e.request.url.startsWith('http')) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return response;
          });
      })
  );
});


// Files to cache on install — the core app shell
