// The build replaces this name with a content hash, so every released change refreshes the cache.
const CACHE = 'co-na-talerz-d62b837596cb';
const ASSETS = ['./','./index.html','./styles.css','./theme.css','./theme-mode.js','./app.js','./catalog-world.js','./extra-catalog.js','./features-i18n.js','./baskets.js','./community.js','./measurement.js','./site-settings.js','./regulamin.html','./domain.js','./market.js','./photos.js','./storage.js','./i18n.js','./recipes.pl.js','./recipes.bot.pl.js','./i18n.en.js','./recipes.en.js','./recipes.bot.en.js','./i18n.de.js','./recipes.de.js','./recipes.bot.de.js','./i18n.uk.js','./recipes.uk.js','./recipes.bot.uk.js','./i18n.fr.js','./recipes.fr.js','./recipes.bot.fr.js','./i18n.da.js','./recipes.da.js','./recipes.bot.da.js','./i18n.es.js','./recipes.es.js','./recipes.bot.es.js','./i18n.it.js','./recipes.it.js','./recipes.bot.it.js','./nutrition.js','./install.js','./polityka-prywatnosci.html','./stores.js','./errors.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
// cache:'reload' — pliki nowej wersji zawsze z serwera, nigdy z pamięci HTTP przeglądarki (inaczej nowa nazwa cache mogłaby dostać stare pliki).
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(()=>self.skipWaiting())));
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


