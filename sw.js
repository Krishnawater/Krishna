// ⚠️ IMPORTANT: Every time you upload a NEW index.html to your server,
// change this CACHE_VERSION number (v1 -> v2 -> v3 ...). That single
// change is what tells every phone/browser "a new version is available"
// so they fetch fresh files instead of using the old cached copy.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'krishna-proforma-' + CACHE_VERSION;

// Only list files that rarely change (icons). Do NOT list index.html here —
// index.html is always fetched fresh from the network (see fetch handler below).
const STATIC_ASSETS = [
  'manifest.json',
  'icon-192.png',
  'apple-touch-icon.png'
];

// Install: cache static assets, then activate this new SW immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete every OLD cache version, take control of all open tabs now
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - index.html (and any HTML/navigation request) -> ALWAYS try network first.
//   Only fall back to cache if the phone is offline. This is what stops the
//   "same link, old content" problem.
// - everything else (icons etc.) -> cache first, network fallback.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
