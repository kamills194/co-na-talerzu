// CNT-039: boty — reguły redakcyjne, grupowanie zgłoszeń błędów, pliki wdrożenia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tidy, lint } from '../../../scripts/bots/text-rules.mjs';
import { fingerprint, isNoise, browser, group } from '../../../scripts/bots/collect-errors.mjs';
const root = p => readFile(new URL('../../../' + p, import.meta.url), 'utf8');

test('Redaktor: bezpieczne poprawki tekstu', () => {
  assert.equal(tidy('Wymieszaj  mąkę , jajka i mleko ...', 'pl'), 'Wymieszaj mąkę, jajka i mleko…');
  assert.equal(tidy(' Dodaj sól ! ', 'pl'), 'Dodaj sól!');
  assert.equal(tidy('Mélangez : la farine ; puis cuire !', 'fr'), 'Mélangez : la farine ; puis cuire !', 'francuska spacja przed : ; ! zostaje');
  assert.equal(tidy('Ajoutez le sel , puis …', 'fr'), 'Ajoutez le sel, puis…');
  assert.equal(tidy('Piecz 1 .5 h', 'pl'), 'Piecz 1 .5 h', 'liczby nie są ruszane');
  assert.equal(tidy('Wiersz 1\nWiersz 2', 'pl'), 'Wiersz 1\nWiersz 2');
});

test('Redaktor: uwagi do ręcznego przejrzenia', () => {
  assert.deepEqual(lint('Dodaj dodaj cukier.', 'pl'), ['powtórzone słowo „Dodaj”']);
  assert.deepEqual(lint('Pokrój (drobno cebulę.', 'pl'), ['liczba nawiasów ( ) się nie zgadza']);
  assert.ok(lint('Pokrój cebulę w kostkę.', 'en').length === 1, 'polski tekst w tłumaczeniu');
  assert.deepEqual(lint('Serve the gzik with potatoes.', 'en'), [], 'nazwy dań mogą mieć polskie litery');
  assert.deepEqual(lint('Cut the onion.', 'en'), []);
});

test('Zgłoszenia błędów: grupowanie, szum, przeglądarki', () => {
  const e = (msg, extra = {}) => ({ kind: 'error', message: msg, source: '/app.js', line: 10, received: '2026-11-18T10:00:00Z', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1', ...extra });
  assert.equal(fingerprint(e('x is undefined at 12')), fingerprint(e('x is undefined at 99')), 'liczby nie rozbijają grupy');
  assert.notEqual(fingerprint(e('a')), fingerprint(e('a', { line: 11 })));
  assert.ok(isNoise(e('Script error.'))); assert.ok(isNoise(e('x', { source: 'chrome-extension://abc/x.js' }))); assert.ok(!isNoise(e('TypeError: x')));
  assert.equal(browser('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36'), 'Chrome / Android');
  assert.equal(browser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17 Safari/604.1'), 'Safari / iOS');
  const g = group([e('TypeError: a'), e('TypeError: a', { received: '2026-11-18T11:00:00Z', standalone: true }), e('Script error.'), null, e('TypeError: b')]);
  assert.equal(g.length, 2); assert.equal(g[0].count, 2); assert.equal(g[0].installed, 1); assert.equal(g[0].last, '2026-11-18T11:00:00Z');
});

test('Wdrożenie: report.php i blokada _reports; strona ładuje errors.js przed app.js tylko na produkcji', async () => {
  const deploy = await root('.github/workflows/deploy-nazwa.yml'), ht = await root('deploy/nazwa.pl/.htaccess'), php = await root('deploy/nazwa.pl/report.php');
  assert.match(deploy, /deploy\/nazwa\.pl\/report\.php/); assert.match(ht, /\^_reports/);
  assert.match(php, /REQUEST_METHOD/); assert.doesNotMatch(php, /'ip'\s*=>/, 'adres IP nie jest zapisywany');
  const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('errors.js') > 0 && html.indexOf('errors.js') < html.indexOf('app.js'));
  const errors = await readFile(new URL('../src/errors.js', import.meta.url), 'utf8');
  assert.match(errors, /conatalerz\.pl/); assert.match(errors, /MAX = 5/);
});

test('Nagłówki: kod aplikacji (sw.js, app.js, index.html) bez długiego cache — CDN nie może serwować starej wersji', async () => {
  const ht = await root('deploy/nazwa.pl/.htaccess');
  const blocks = [...ht.matchAll(/<FilesMatch "([^"]+)">\s*Header set Cache-Control "([^"]+)"/g)].map(m => [new RegExp(m[1]), m[2]]);
  // Ostatni pasujący blok wygrywa (Apache) — sprawdzamy wynik dla każdego pliku.
  const cc = f => blocks.filter(([r]) => r.test(f)).pop()?.[1] || '';
  for (const f of ['sw.js', 'app.js', 'index.html', 'errors.js', 'styles.css', 'offers.json', 'manifest.webmanifest']) assert.equal(cc(f), 'no-cache', f);
  assert.match(cc('icon-512.png'), /max-age/);
});
