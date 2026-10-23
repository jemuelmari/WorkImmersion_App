const CACHE_NAME = 'wi-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install Service Worker at i-cache ang mga basic files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Kunin sa cache kung offline, kung wala, kunin sa internet
self.addEventListener('fetch', event => {
  // Huwag i-cache ang mga API requests (tulad ng login at time in/out)
  if (event.request.url.includes('/api/proxy')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Ibabalik ang naka-cache
        }
        return fetch(event.request); // Kung wala sa cache, kukunin sa internet
      })
  );
});

// I-update ang cache kapag may bagong version
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
