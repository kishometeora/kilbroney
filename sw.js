// Keeps a full copy of the map on the phone so it works in the forest without signal.
// Change VERSION whenever the map is updated so phones pick up the new copy.
const VERSION = 'kilbroney-20260930-2235';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './bg/light.jpg', './bg/light-dark.jpg', './bg/terrain.jpg', './bg/terrain-dark.jpg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/index.html');
  if (isPage) {
    // the page itself: try for the newest version, fall back to the saved copy when there's no signal
    e.respondWith(Promise.race([
      fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; }),
      new Promise((_, reject) => setTimeout(reject, 4000))
    ]).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
