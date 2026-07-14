/**
 * sw.js — Mentorix Service Worker
 * Provides offline caching so the app works without internet.
 * AI features (Groq proxy) won't work offline — that's expected and shown via the offline banner.
 */

const CACHE_NAME = 'mentorix-v38';

// Files to cache on install — the core app shell
const CORE_ASSETS = [
  './',
  './index.html',
  './index.css',
  './manifest.json',
  './logo.png',
  './js/helpers.js',
  './js/constants.js',
  './js/storage.js',
  './js/router.js',
  './js/ai.js',
  './js/auth.js',
  './js/xp.js',
  './js/screens/dashboard.js',
  './js/screens/courses.js',
  './js/screens/learn.js',
  './js/screens/mentor.js',
  './js/screens/revision.js',
  './js/screens/recovery.js',
  './js/screens/notebook.js',
  './js/screens/tests.js',
  './js/screens/doubt.js',
  './js/screens/progress.js',
  './js/screens/settings.js',
  './js/screens/explore.js',
  './js/screens/careers.js',
  './js/screens/roadmap.js',
  './js/screens/comp.js',
];

// Install: cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML/navigation, cache-first for static assets
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache AI proxy calls — these must always go to network
  if (url.includes('mentorix-proxy') || url.includes('groq.com') ||
      url.includes('googleapis') || url.includes('cloudflare')) {
    return; // let browser handle normally
  }

  // Navigation requests (HTML pages): NETWORK-FIRST
  // This ensures updated index.html is always served fresh
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets (JS, CSS, images): CACHE-FIRST
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request)
          .then(response => {
            if (response.ok && e.request.method === 'GET' &&
                url.startsWith(self.location.origin)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return response;
          });
      })
  );
});
