const CACHE_NAME = 'wi-cache-v7'; // <-- PALITAN ITO (v8, v9...) TUWING MAY BAGONG UPDATE
const urlsToCache = [
  '/',
  '/index.html',
  '/teacher.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// 1. I-install at i-cache ang mga bagong files
self.addEventListener('install', event => {
  self.skipWaiting(); // Pipilitin nitong i-activate agad ang bagong version
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. I-activate at i-delete ang lumang cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Burahin ang lumang version
          }
        })
      );
    }).then(() => self.clients.claim()) // Agad na kunin ang kontrol ng page
  );
});

// 3. Fetch Logic
self.addEventListener('fetch', event => {
  // Huwag i-cache ang mga API calls (para laging sariwa ang data)
  if (event.request.url.includes('/api/proxy')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response; // Ibalik ang naka-cache kung meron
      }
      return fetch(event.request); // Kung wala, kunin sa internet
    })
  );
});
