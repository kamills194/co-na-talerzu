// CNT-035: tryb jasny/ciemny/automatyczny (theme-mode.js) oraz kontrakt arkusza theme.css.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { categories } from '../src/i18n.js';

// --- atrapy przeglądarki ---------------------------------------------------
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: k => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: k => data.delete(k),
  };
}
function fakeElement(attrs = {}) {
  const a = new Map(Object.entries(attrs));
  return {
    getAttribute: k => (a.has(k) ? a.get(k) : null),
    setAttribute: (k, v) => a.set(k, String(v)),
    removeAttribute: k => a.delete(k),
    hasAttribute: k => a.has(k),
  };
}
let html, meta, buttons, systemDark;
function installDom({ stored, throwing = false, dark = false } = {}) {
  html = fakeElement();
  meta = fakeElement({ name: 'theme-color', content: '#000000' });
  buttons = ['light', 'dark', 'auto'].map(m => fakeElement({ 'data-theme-mode': m, 'aria-pressed': 'false' }));
  systemDark = dark;
  globalThis.document = {
    documentElement: html,
    querySelector: sel => (sel === 'meta[name="theme-color"]' ? meta : null),
    querySelectorAll: sel => (sel === '[data-theme-mode]' ? buttons : []),
  };
  globalThis.matchMedia = () => ({ matches: systemDark, addEventListener() {}, removeEventListener() {} });
  if (throwing) {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  } else {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: fakeStorage(stored === undefined ? {} : { 'co-na-talerz:theme': stored }) });
  }
}

const mod = await import('../src/theme-mode.js');
const { initThemeMode, setThemeMode, getThemeMode, themeToggleHTML, bindThemeToggle, THEME_KEY, THEME_COLORS } = mod;

beforeEach(() => installDom());

test('Klucz pamięci motywu jest zgodny z konwencją aplikacji', () => {
  assert.equal(THEME_KEY, 'co-na-talerz:theme');
});

test('Zapisany tryb ciemny ustawia html[data-theme] i kolor paska', () => {
  installDom({ stored: 'dark' });
  assert.equal(initThemeMode(), 'dark');
  assert.equal(html.getAttribute('data-theme'), 'dark');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.dark);
  assert.equal(getThemeMode(), 'dark');
});

test('setThemeMode zapamiętuje wybór, a ponowne uruchomienie go odtwarza', () => {
  installDom();
  initThemeMode();
  setThemeMode('light');
  assert.equal(localStorage.getItem(THEME_KEY), 'light');
  assert.equal(html.getAttribute('data-theme'), 'light');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.light);
  html.removeAttribute('data-theme'); // „nowe uruchomienie” z tą samą pamięcią
  assert.equal(initThemeMode(), 'light');
  assert.equal(html.getAttribute('data-theme'), 'light');
});

test('Tryb automatyczny usuwa atrybut i bierze kolor paska z ustawień systemu', () => {
  installDom({ stored: 'dark', dark: true });
  initThemeMode();
  setThemeMode('auto');
  assert.equal(html.hasAttribute('data-theme'), false);
  assert.equal(localStorage.getItem(THEME_KEY), null);
  assert.equal(meta.getAttribute('content'), THEME_COLORS.dark);
  systemDark = false;
  setThemeMode('auto');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.light);
});

test('Nieprawidłowa zapisana wartość oznacza tryb automatyczny', () => {
  for (const bad of ['purple', '', 'DARK', '{"x":1}']) {
    installDom({ stored: bad });
    html.setAttribute('data-theme', 'dark');
    assert.equal(initThemeMode(), 'auto', bad);
    assert.equal(html.hasAttribute('data-theme'), false, bad);
  }
  installDom();
  assert.equal(setThemeMode('sepia'), 'auto');
});

test('Brak dostępu do localStorage nie psuje motywu', () => {
  installDom({ throwing: true });
  assert.equal(initThemeMode(), 'auto');
  assert.equal(setThemeMode('dark'), 'dark');
  assert.equal(html.getAttribute('data-theme'), 'dark');
});

test('Przełącznik: trzy przyciski z aria-pressed, tłumaczenia z t() i polski zapas', () => {
  installDom({ stored: 'dark' });
  initThemeMode();
  const pl = themeToggleHTML(k => k); // t zwraca klucz = brak tłumaczenia
  assert.match(pl, /role="group" aria-label="Motyw"/);
  for (const text of ['Jasny', 'Ciemny', 'Automatyczny']) assert.ok(pl.includes(text), text);
  assert.match(pl, /data-theme-mode="dark" aria-pressed="true"/);
  assert.match(pl, /data-theme-mode="light" aria-pressed="false"/);
  assert.equal((pl.match(/<button type="button"/g) || []).length, 3);
  const en = themeToggleHTML(k => ({ themeLight: 'Light', themeDark: 'Dark', themeAuto: 'Auto', themeLabel: 'Theme <x>' })[k]);
  assert.ok(en.includes('aria-label="Theme &lt;x&gt;"'));
  assert.ok(en.includes('>Light<') && en.includes('>Auto<'));
  assert.ok(themeToggleHTML().includes('Automatyczny'));
});

test('bindThemeToggle przełącza tryb po kliknięciu i aktualizuje aria-pressed', () => {
  installDom();
  initThemeMode();
  let handler;
  const root = { addEventListener: (type, fn) => { handler = fn; }, removeEventListener() {}, contains: () => true };
  const off = bindThemeToggle(root);
  const target = { closest: () => buttons[1] };
  handler({ target });
  assert.equal(getThemeMode(), 'dark');
  assert.equal(html.getAttribute('data-theme'), 'dark');
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
  handler({ target: { closest: () => null } }); // klik obok przełącznika nic nie zmienia
  assert.equal(getThemeMode(), 'dark');
  assert.equal(typeof off, 'function');
});

// --- kontrakt theme.css ------------------------------------------------------
const css = (await readFile(new URL('../src/theme.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
const blockAfter = (source, start) => {
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error('niedomknięty blok');
};
const props = body => new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const lightBody = blockAfter(css, css.indexOf(':root{'));
const darkAttr = blockAfter(css, css.indexOf('html[data-theme="dark"]{'));
const mediaStart = css.search(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root:not\(\[data-theme\]\)\{/);
const darkMedia = blockAfter(css, css.indexOf(':root:not([data-theme]){', mediaStart));

test('Motyw jasny i ciemny definiują ten sam zestaw kolorów', () => {
  assert.ok(mediaStart > 0, 'brak bloku prefers-color-scheme: dark dla trybu automatycznego');
  const colors = [...props(lightBody)].filter(p => !['--t-sketch', '--t-card', '--t-wobble', '--t-shadow', '--t-serif', '--t-hand'].includes(p));
  assert.ok(colors.length > 30);
  assert.deepEqual(new Set(colors), props(darkAttr));
  assert.deepEqual(props(darkAttr), props(darkMedia));
  assert.equal(darkAttr.replace(/\s+/g, ''), darkMedia.replace(/\s+/g, ''), 'bloki ciemnego motywu muszą być identyczne');
  assert.match(lightBody, /color-scheme:\s*light/);
  assert.match(darkAttr, /color-scheme:\s*dark/);
  assert.match(css, /html\[data-theme="light"\]|:root\{/);
});

test('theme.css ma blok prefers-reduced-motion, a ruch tylko w no-preference', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  const outside = css.replace(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, '');
  assert.doesNotMatch(outside, /(^|[;{\s])(animation|transition)\s*:(?!\s*none\s*[;}])/);
});

test('theme.css nie pobiera niczego z sieci', () => {
  assert.doesNotMatch(css, /@import/i);
  assert.doesNotMatch(css, /@font-face/i);
  for (const [, , inner] of css.matchAll(/url\(\s*(["']?)([\s\S]*?)\1\s*\)/g))
    assert.ok(inner.startsWith('data:image/svg+xml,'), `url() inny niż wbudowany SVG: ${inner.slice(0, 40)}`);
});

test('Dekoracje z pseudo-elementów nie przechwytują kliknięć i nie mają czytanego tekstu', () => {
  for (const [, , body] of css.matchAll(/([^{}]*::?(?:before|after))\s*\{([^{}]*)\}/g)) {
    if (/content\s*:/.test(body)) assert.match(body, /content\s*:\s*''/, `pseudo-element z tekstem: ${body.slice(0, 60)}`);
    if (/position\s*:\s*absolute/.test(body)) assert.match(body, /pointer-events\s*:\s*none/, body.slice(0, 60));
  }
});

test('Selektory theme.css wskazują istniejące klasy', async () => {
  const src = new URL('../src/', import.meta.url);
  const text = (await Promise.all(['app.js', 'index.html', 'styles.css', 'theme-mode.js'].map(f => readFile(new URL(f, src), 'utf8')))).join('\n');
  const known = new Set(text.match(/[A-Za-z_][\w-]*/g));
  for (const c of categories) known.add(`art-${c}`);
  const clean = css.replace(/url\((["']?)[\s\S]*?\1\)/g, 'url()');
  const used = new Set();
  for (const [, prelude] of clean.matchAll(/([^{};]+)\{/g)) {
    const p = prelude.trim();
    if (!p || p.startsWith('@') || /^(from|to|\d+%)/.test(p)) continue;
    for (const [, name] of p.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) used.add(name);
  }
  assert.deepEqual([...used].filter(c => !known.has(c)), []);
});
