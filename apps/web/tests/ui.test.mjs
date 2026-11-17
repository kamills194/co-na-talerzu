import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { photos, photoFor, requiredPhotoFields, safeLink } from '../src/photos.js';
import { recipes } from '../src/recipes.pl.js';
import { messages } from '../src/i18n.js';

const complete = { file:'./photos/test.webp', author:'Autorka Testowa', sourceUrl:'https://example.org/zdjecie', license:'CC BY 4.0', licenseUrl:'https://creativecommons.org/licenses/by/4.0/', acquired:'2026-11-16', usage:'aplikacja', attribution:'Fot. Autorka Testowa', modifications:'', sha256:'0'.repeat(64) };
const src = name => readFile(new URL('../src/' + name, import.meta.url), 'utf8');

test('Rejestr zdjęć nie zawiera wpisów bez prawdziwych plików i praw', () => {
  assert.deepEqual(Object.keys(photos), []);
});
test('photoFor zwraca rekord tylko dla przypisanego zdjęcia z kompletnym wpisem', () => {
  const registry = { ok: complete };
  assert.equal(photoFor({ photo:'ok' }, registry), complete);
  assert.equal(photoFor({ photo:'ok', photoAlt:'Opis' }, registry), complete);
});
test('photoFor zwraca null bez zdjęcia, bez wpisu i dla przepisu bez pól photo', () => {
  const registry = { ok: complete };
  for (const recipe of [{}, { photo:null }, { photo:undefined }, { photo:'' }, { photo:'  ' }, { photo:42 }, { photo:'brak' }, null, undefined])
    assert.equal(photoFor(recipe, registry), null, JSON.stringify(recipe));
  assert.equal(photoFor({ photo:'ok' }), null, 'domyślny rejestr jest pusty');
  assert.equal(photoFor({ photo:'toString' }, registry), null, 'pola dziedziczone nie są wpisami');
});
test('photoFor odrzuca niekompletny wpis rejestru', () => {
  for (const field of requiredPhotoFields) {
    for (const bad of [undefined, null, '', '   ', 7]) {
      const registry = { x: { ...complete, [field]: bad } };
      assert.equal(photoFor({ photo:'x' }, registry), null, `${field}=${JSON.stringify(bad)}`);
    }
  }
  assert.deepEqual(requiredPhotoFields, ['file', 'author', 'license', 'attribution']);
  assert.equal(photoFor({ photo:'x' }, { x:null }), null);
  assert.equal(photoFor({ photo:'x' }, { x:'./plik.webp' }), null);
});
test('Odnośniki z rejestru zdjęć są ograniczone do https', () => {
  assert.equal(safeLink('https://example.org/a?b=1'), 'https://example.org/a?b=1');
  for (const bad of ['http://example.org', 'javascript:alert(1)', 'https://example.org/"onclick', ' https://example.org', '', null, undefined, 5]) assert.equal(safeLink(bad), '');
});
test('Każde zdjęcie przypisane w katalogu ma kompletny wpis praw i opis alternatywny', () => {
  for (const recipe of recipes) {
    if (recipe.photo === undefined || recipe.photo === null) continue;
    assert.ok(photoFor(recipe), `${recipe.id}: zdjęcie ${recipe.photo} bez kompletnego wpisu w rejestrze`);
    assert.ok(typeof recipe.photoAlt === 'string' && recipe.photoAlt.trim(), `${recipe.id}: brak photoAlt`);
  }
});
test('Teksty ekranów przeniesione z app.js są w słowniku, nie w szablonach', async () => {
  const app = await src('app.js');
  const moved = { eyebrowIdea:'POMYSŁ NA DZIŚ', eyebrowCollection:'TWOJA KOLEKCJA', eyebrowShopping:'Z KUCHNI DO SKLEPU', cardSeries:'DOMOWA KUCHNIA', heroArtCaption:'smakuje jak w domu', heroArtNote:'odrobina inspiracji\nna każdy dzień' };
  for (const [key, text] of Object.entries(moved)) {
    assert.equal(messages[key], text);
    assert.ok(app.includes(`t('${key}')`), key);
    assert.ok(!app.includes(text.split('\n')[0]), `„${text}” nadal jest wpisane w app.js`);
  }
  for (const key of ['offlineNotice', 'offlineOffers', 'backOnline', 'browseRecipes', 'photoCredit', 'photoLicense', 'photoChanges']) assert.ok(messages[key]?.trim(), key);
});
test('Powłoka ma stan offline, zdjęcie z zapasową grafiką i ograniczenie ruchu', async () => {
  const [app, html, css] = await Promise.all([src('app.js'), src('index.html'), src('styles.css')]);
  assert.match(html, /id="net-status"[^>]*role="status"[^>]*hidden/);
  assert.match(html, /<dialog id="detail" aria-labelledby="detail-heading">/);
  assert.match(app, /addEventListener\('offline'/);
  assert.match(app, /addEventListener\('online'/);
  assert.match(app, /addEventListener\('error',[^\n]*,true\);/, 'błąd wczytania zdjęcia wraca do grafiki emoji');
  assert.match(app, /<img class="photo"[^`]*alt="\$\{esc\(r\.photoAlt\|\|r\.name\)\}"[^`]*width="\d+" height="\d+"[^`]*loading="lazy"/);
  assert.match(app, /esc\(photo\.attribution\)|creditLink\(photo\.attribution/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.ok(!/user-scalable\s*=\s*no|maximum-scale/.test(html), 'powiększanie strony nie może być blokowane');
});
