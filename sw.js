/* Service Worker de Actitud & Bienestar
   Permite instalar la aplicación como PWA y funciona offline.
   Solo almacena en caché los archivos de la "shell" de la app;
   NO intercepta las peticiones al API para no interferir con la
   sincronización con el backend. */
const CACHE = 'ayb-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './frontend/css/styles.css',
  './frontend/js/app.js',
  './js/app.js',
  './logo/LOGO ACTITUD Y BIENESTAR SIN FONDO.png',
  './logo/icon-192.png',
  './logo/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // No tocar las peticiones al backend / API
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
    return;
  }
  // Estrategia: cache-first para la shell, red como respaldo (network fallback)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
