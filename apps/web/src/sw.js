// The build replaces this name with a content hash, so every released change refreshes the cache.
const CACHE = 'co-na-talerz-v4';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./domain.js','./storage.js','./i18n.js','./recipes.pl.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('co-na-talerz-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  // Cache first for the shell. Opening the app with a query string (e.g. a shared link) or
  // offline must still return the cached shell instead of a browser error page.
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).catch(async error => {
    if (e.request.mode === 'navigate') { const shell = await caches.match('./index.html'); if (shell) return shell; }
    throw error;
  })));
});


