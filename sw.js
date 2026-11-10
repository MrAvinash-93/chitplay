/* ChitPlay service worker: instant repeat loads + offline play.
 * - Pages: network first (so updates arrive), cached copy when offline.
 * - Everything else (versioned JS/CSS, three.js, icons): cache first,
 *   refreshed in the background.
 */
const VERSION = 'chitplay-20261110-1259';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icon-192.png',
  './src/styles/tokens.css?v=20261110-1259',
  './src/styles/base.css?v=20261110-1259',
  './src/styles/layout.css?v=20261110-1259',
  './src/styles/world-3d.css?v=20261110-1259',
  './src/app/bootstrap.js?v=20261110-1259',
  './src/vendor/three.chitplay.min.js',
];

/* The daily reminder (only if the player turned it on): what it needs is kept in its own small cache. */
const REMINDER = 'chitplay-reminder';
const REMINDER_URL = './__reminder__';
self.addEventListener('message', (event) => {
  const m = event.data;
  if (m?.t !== 'reminder') return;
  event.waitUntil(caches.open(REMINDER).then(c => c.put(REMINDER_URL, new Response(JSON.stringify({ on: !!m.on, time: String(m.time || '19:00'), lines: Array.isArray(m.lines) ? m.lines.slice(0, 5) : [] })))));
});
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'chitplay-reminder') return;
  event.waitUntil((async () => {
    const c = await caches.open(REMINDER);
    const res = await c.match(REMINDER_URL);
    if (!res) return;
    const cfg = await res.json();
    if (!cfg.on || !cfg.lines.length) return;
    const now = new Date();
    const [h, m] = cfg.time.split(':').map(Number);
    const today = now.toDateString();
    if (now.getHours() * 60 + now.getMinutes() < h * 60 + m || cfg.sent === today) return;
    await self.registration.showNotification('ChitPlay', { body: cfg.lines[now.getDate() % cfg.lines.length], icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', tag: 'chitplay-daily' });
    await c.put(REMINDER_URL, new Response(JSON.stringify({ ...cfg, sent: today })));
  })());
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => (list[0] ? list[0].focus() : self.clients.openWindow('./'))));
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.allSettled(CORE.map(url => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== REMINDER).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
