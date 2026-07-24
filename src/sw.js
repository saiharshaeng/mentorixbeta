/**
 * sw.js — Mentorix Service Worker v75
 * Network-First with safe fallback responses to eliminate fetch promise rejections.
 */

const CACHE_NAME = 'mentorix-v76';

const CORE_ASSETS = [
  './',
  './index.html',
  './logo.png',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(CORE_ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  const url = e.request.url;

  // Bypass Service Worker for sw.js itself & external APIs
  if (url.includes('sw.js') || url.includes('mentorix-proxy') || url.includes('groq.com') ||
      url.includes('googleapis') || url.includes('cloudflare') ||
      url.includes('workers.dev')) {
    return;
  }

  // PYQ data files — Network-First with Cache / JS Fallback
  if (url.includes('/data/pyq/') || url.includes('pyqService') || url.includes('master_index')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || new Response('/* Offline fallback */', {
            status: 200,
            headers: { 'Content-Type': 'text/javascript' }
          });
        });
      })
    );
    return;
  }

  // Navigation (HTML) — Network-First with index.html Fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          if (response && response.ok && e.request.url.startsWith('http')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          }
          return response;
        })
        .catch(function() {
          return caches.match('./index.html').then(function(cached) {
            return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }

  // JS / CSS / JSON — Network-First with Cache / JS Fallback
  if (url.match(/\.(js|css|json)$/)) {
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          if (response && response.ok && e.request.method === 'GET' && e.request.url.startsWith('http')) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          }
          return response;
        })
        .catch(function() {
          return caches.match(e.request).then(function(cached) {
            return cached || new Response('/* Offline fallback */', {
              status: 200,
              headers: { 'Content-Type': 'text/javascript' }
            });
          });
        })
    );
    return;
  }

  // Everything else — Cache-First with Network Fallback
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.ok && e.request.method === 'GET' && e.request.url.startsWith('http')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      return new Response('', { status: 404, statusText: 'Not Found' });
    })
  );
});
