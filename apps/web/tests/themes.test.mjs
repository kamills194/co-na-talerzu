// CNT-031: warianty „bajkowej” szaty graficznej do wyboru. Pliki leżą poza src/ (docs/design/cnt-031/themes),
// bo build.mjs i test powłoki nie obsługują podkatalogów w src/. Testy pilnują, by warianty działały offline,
// szanowały „mniej ruchu” i nie celowały w nieistniejące klasy (literówki).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { categories } from '../src/i18n.js';

const themesDir = new URL('../../../docs/design/cnt-031/themes/', import.meta.url);
const themes = ['bajkowa-pastel.css', 'bajkowa-ksiazeczka.css', 'bajkowa-ogrod.css'];
const read = (file, base) => readFile(new URL(file, base), 'utf8');
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

async function knownClasses() {
  const src = new URL('../src/', import.meta.url);
  const text = (await Promise.all(['app.js', 'index.html', 'styles.css'].map(f => read(f, src)))).join('\n');
  // Best-effort: każde słowo z tych plików może być nazwą klasy; klasy budowane w szablonie dopisujemy jawnie.
  const words = new Set(text.match(/[A-Za-z_][\w-]*/g));
  for (const c of categories) words.add(`art-${c}`);
  return words;
}

// Zwraca nazwy klas z selektorów (pomija treść deklaracji, data URI, @-reguły i klatki animacji).
function selectorClasses(css) {
  const clean = stripComments(css).replace(/url\((["']?)[\s\S]*?\1\)/g, 'url()');
  const classes = new Set();
  for (const [, prelude] of clean.matchAll(/([^{};]+)\{/g)) {
    const p = prelude.trim();
    if (!p || p.startsWith('@') || /^(from|to|\d+%)(\s*,\s*(from|to|\d+%))*$/.test(p)) continue;
    for (const [, name] of p.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) classes.add(name);
  }
  return classes;
}

test('Każdy wariant motywu istnieje', async () => {
  for (const file of themes) await access(new URL(file, themesDir));
});

test('Warianty nie pobierają zasobów z sieci (działają offline)', async () => {
  for (const file of themes) {
    const css = stripComments(await read(file, themesDir));
    assert.doesNotMatch(css, /@import/i, `${file}: @import`);
    assert.doesNotMatch(css, /url\(\s*["']?\s*(https?:)?\/\//i, `${file}: zewnętrzny url()`);
    assert.doesNotMatch(css, /@font-face/i, `${file}: własna czcionka`);
    for (const [, , inner] of css.matchAll(/url\(\s*(["']?)([\s\S]*?)\1\s*\)/g))
      assert.ok(inner.startsWith('data:image/svg+xml,'), `${file}: url() inny niż wbudowany SVG: ${inner.slice(0, 40)}`);
  }
});

test('Warianty mają blok prefers-reduced-motion, a animacje są tylko w no-preference', async () => {
  for (const file of themes) {
    const css = stripComments(await read(file, themesDir));
    assert.match(css, /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/, `${file}: brak bloku reduce`);
    // Każda animacja i przejście muszą być wewnątrz @media(prefers-reduced-motion:no-preference).
    const outside = css.replace(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, '');
    assert.doesNotMatch(outside, /(^|[;{\s])(animation|transition)\s*:(?!\s*none\s*[;}])/, `${file}: ruch poza blokiem no-preference`);
  }
});

test('Selektory wariantów wskazują istniejące klasy (literówki)', async () => {
  const known = await knownClasses();
  for (const file of themes) {
    const missing = [...selectorClasses(await read(file, themesDir))].filter(c => !known.has(c));
    assert.deepEqual(missing, [], `${file}: nieznane klasy`);
  }
});

test('Sprawdzanie klas wykrywa literówkę', () => {
  assert.deepEqual([...selectorClasses('.recipe-crad:hover{color:red}@media(x){.a .b{}}@keyframes k{from{}to{}}')], ['recipe-crad', 'a', 'b']);
});
