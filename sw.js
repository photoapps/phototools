/* PhotoTools+ service worker: abre sin conexión y se actualiza solo cuando hay red. */
const CACHE = 'phototools-priv-v1';
const CORE = ['./', './index.html', './app.enc', './apoyo.enc', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // mapas, aviones, ISS... van siempre a la red
  if (url.pathname.startsWith('/p/')) return;                                  // proxies de datos en vivo: nunca en caché
  // Red primero (versión nueva si hay conexión), caché si no hay.
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
