// CNT-039: automatyczne zgłaszanie błędów strony (bot „zgłaszający”).
// Zwykły skrypt ładowany przed app.js, żeby złapać także błędy wczytywania modułów.
// Wysyła wyłącznie techniczny opis błędu (komunikat, plik, wiersz, stos, zakładka, język, przeglądarka) —
// bez danych z formularzy, list zakupów ani ulubionych. Działa tylko na produkcyjnej domenie (report.php na nazwa.pl).
(function () {
  'use strict';
  var HOSTS = ['conatalerz.pl', 'www.conatalerz.pl'];
  if (typeof window === 'undefined' || HOSTS.indexOf(location.hostname) < 0) return;
  var ENDPOINT = './report.php', MAX = 5, sent = 0, seen = {};
  function cut(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }
  // Ścieżki zamiast pełnych adresów (bez parametrów zapytania), żeby nie przenosić niczego z adresu strony.
  function path(u) { try { var x = new URL(u, location.href); return x.origin === location.origin ? x.pathname : x.origin + x.pathname; } catch (e) { return cut(u, 200); } }
  function report(kind, message, source, line, col, stack) {
    if (sent >= MAX) return;
    var key = kind + '|' + message + '|' + source + '|' + line;
    if (seen[key]) return; seen[key] = 1; sent++;
    var body = JSON.stringify({
      v: 1, kind: kind, message: cut(message, 500), source: path(source || ''), line: +line || 0, col: +col || 0,
      stack: cut(String(stack || '').replace(/https?:\/\/[^/\s)]+/g, ''), 2000),
      page: cut(location.pathname, 200), lang: cut(document.documentElement.lang, 10),
      standalone: !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
      online: navigator.onLine !== false, ua: cut(navigator.userAgent, 300), at: new Date().toISOString()
    });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'omit' }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    // Błąd wczytania zasobu (skrypt, styl). Zdjęcia obsługuje app.js — ich brak nie jest błędem strony.
    if (t && t !== window && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) { report('resource', 'Nie wczytano zasobu', t.src || t.href, 0, 0, ''); return; }
    if (t && t !== window) return;
    report('error', e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason || {};
    report('rejection', r.message || String(r), '', 0, 0, r.stack);
  });
})();
