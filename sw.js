/**
 * MTs YASUA Pilangwetan — Service Worker
 * Progressive Web App (PWA) Offline Cache & Fast Loading
 */

const CACHE_NAME = 'mts-yasua-cache-v1.4';
const OFFLINE_URL = 'app.html';

// Critical core assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'app.html',
  'profil.html',
  'sambutan.html',
  'guru.html',
  'mou.html',
  'program.html',
  'ekskul.html',
  'kalender.html',
  'agenda.html',
  'prestasi.html',
  'alumni.html',
  'berita.html',
  'galeri.html',
  'kontak.html',
  'ppdb.html',
  'search.js',
  'pwa.js',
  'manifest.webmanifest',
  'logo.png',
  'logo.webp',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'apple-touch-icon.png',
  'foto-gedung.webp',
  'kepala-madrasah.webp',
  'banner_1.jpg',
  'banner_2.jpg',
  'banner_3.jpg'
];

// Install Event: pre-cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error resilience: cache what succeeds
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[PWA ServiceWorker] Failed to precache:', url, err);
          })
        )
      );
    })
  );
});

// Activate Event: clean old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[PWA ServiceWorker] Clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for HTML documents, Cache-first for images/fonts
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests and http/https schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // HTML navigation requests: Network-first, fallback to cache, then fallback to index.html
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match(OFFLINE_URL);
          if (fallback) return fallback;
          return new Response('<h1>MTs YASUA Offline</h1><p>Koneksi internet Anda sedang terputus. Silakan sambungkan kembali ke internet.</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Static assets (images, styles, scripts, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache (Stale While Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* Ignore background fetch failures */});
        return cachedResponse;
      }

      // Not in cache: fetch from network and cache if valid
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        // Cache same-origin assets or specific CDN assets
        if (url.origin === self.location.origin || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
