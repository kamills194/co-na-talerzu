// CNT-035 / CNT-039: tylko dwa motywy, jasny i ciemny (theme-mode.js), oraz kontrakt arkusza theme.css.
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
  buttons = ['light', 'dark'].map(m => fakeElement({ 'data-theme-mode': m, 'aria-pressed': 'false' }));
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

test('Pierwsza wizyta: motyw raz z prefers-color-scheme i zapisany; potem liczy się tylko wybór użytkownika', () => {
  installDom({ dark: true });
  assert.equal(initThemeMode(), 'dark');
  assert.equal(localStorage.getItem(THEME_KEY), 'dark');
  assert.equal(html.getAttribute('data-theme'), 'dark');
  assert.equal(meta.getAttribute('content'), THEME_COLORS.dark);
  systemDark = false; // system zmienia się później — zapisany wybór zostaje
  assert.equal(initThemeMode(), 'dark');
  setThemeMode('light');
  systemDark = true;
  assert.equal(initThemeMode(), 'light');
  installDom({ dark: false });
  assert.equal(initThemeMode(), 'light');
  assert.equal(localStorage.getItem(THEME_KEY), 'light');
});

test('Zapisane „auto” ze starszej wersji i nieprawidłowe wartości są migrowane do motywu systemu', () => {
  for (const [bad, dark] of [['auto', true], ['auto', false], ['purple', true], ['', false], ['DARK', false], ['{"x":1}', true]]) {
    installDom({ stored: bad, dark });
    const want = dark ? 'dark' : 'light';
    assert.equal(initThemeMode(), want, bad);
    assert.equal(html.getAttribute('data-theme'), want, bad);
    assert.equal(localStorage.getItem(THEME_KEY), want, bad);
  }
  installDom({ stored: 'dark' });
  initThemeMode();
  assert.equal(setThemeMode('auto'), 'dark', 'tryb auto już nie istnieje — nic się nie zmienia');
  assert.equal(setThemeMode('sepia'), 'dark');
  assert.equal(localStorage.getItem(THEME_KEY), 'dark');
});

test('Brak dostępu do localStorage nie psuje motywu', () => {
  installDom({ throwing: true, dark: true });
  assert.equal(initThemeMode(), 'dark');
  assert.equal(setThemeMode('light'), 'light');
  assert.equal(html.getAttribute('data-theme'), 'light');
});

test('Przełącznik: dwa przyciski (Jasny, Ciemny) z aria-pressed, tłumaczenia z t() i polski zapas', () => {
  installDom({ stored: 'dark' });
  initThemeMode();
  const pl = themeToggleHTML(k => k); // t zwraca klucz = brak tłumaczenia
  assert.match(pl, /role="group" aria-label="Motyw"/);
  for (const text of ['Jasny', 'Ciemny']) assert.ok(pl.includes(text), text);
  assert.ok(!pl.includes('Automatyczny') && !pl.includes('auto'));
  assert.match(pl, /data-theme-mode="dark" aria-pressed="true"/);
  assert.match(pl, /data-theme-mode="light" aria-pressed="false"/);
  assert.equal((pl.match(/<button type="button"/g) || []).length, 2);
  const en = themeToggleHTML(k => ({ themeLight: 'Light', themeDark: 'Dark', themeLabel: 'Theme <x>' })[k]);
  assert.ok(en.includes('aria-label="Theme &lt;x&gt;"'));
  assert.ok(en.includes('>Light<') && en.includes('>Dark<'));
  assert.ok(themeToggleHTML().includes('Ciemny'));
});

test('Skrypt w <head> index.html ustawia data-theme przed arkuszami (bez mignięcia) i migruje tak samo jak moduł', async () => {
  const page = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
  const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.ok(page.indexOf('<script>') < page.indexOf('stylesheet'), 'skrypt przed arkuszami stylów');
  const run = ({ stored, dark, throwing = false }) => {
    installDom({ stored, dark, throwing });
    const fn = new Function('localStorage', 'matchMedia', 'document', script);
    let ls; try { ls = globalThis.localStorage; } catch { ls = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } }; }
    fn(ls, globalThis.matchMedia, globalThis.document);
    return html.getAttribute('data-theme');
  };
  assert.equal(run({ dark: true }), 'dark'); assert.equal(localStorage.getItem(THEME_KEY), 'dark');
  assert.equal(run({ dark: false }), 'light'); assert.equal(localStorage.getItem(THEME_KEY), 'light');
  assert.equal(run({ stored: 'auto', dark: true }), 'dark'); assert.equal(localStorage.getItem(THEME_KEY), 'dark');
  assert.equal(run({ stored: 'light', dark: true }), 'light');
  assert.equal(run({ stored: 'dark', dark: false }), 'dark'); assert.equal(meta.getAttribute('content'), THEME_COLORS.dark);
  assert.equal(run({ dark: true, throwing: true }), 'dark');
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

test('Motyw jasny i ciemny definiują ten sam zestaw kolorów', () => {
  // CNT-039: bez trybu automatycznego — data-theme ustawia zawsze skrypt w <head>, więc arkusz nie powiela ciemnego bloku.
  assert.doesNotMatch(css, /prefers-color-scheme/);
  assert.doesNotMatch(css, /--t-bunting/, 'girlanda z chorągiewek usunięta');
  const colors = [...props(lightBody)].filter(p => !['--t-sketch', '--t-card', '--t-wobble', '--t-shadow', '--t-serif', '--t-hand'].includes(p));
  assert.ok(colors.length > 20); // CNT-039: mniej zmiennych po usunięciu ozdobników (było > 30)
  assert.deepEqual(new Set(colors), props(darkAttr));
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

test('CNT-039 (uwaga nr 10): theme.css bez ozdobników — bez pseudo-elementów z grafiką, masek SVG, inicjału, falek i wzorków tła', () => {
  assert.doesNotMatch(css, /::(before|after|first-letter)/, 'pseudo-elementy ozdobne usunięte (zostaje funkcjonalne h3 button:after — klikalna karta)');
  assert.doesNotMatch(css, /mask(-image)?\s*:/);
  assert.doesNotMatch(css, /data:image\/svg/);
  assert.doesNotMatch(css, /text-decoration-style\s*:\s*wavy/);
  assert.doesNotMatch(css, /--t-(bunting|doodle|star|dot|deco|hero-sky|hero-edge|hero-hill)\b/);
  assert.doesNotMatch(css, /radial-gradient/, 'bez wzorków tła, słońc i łąk');
  assert.match(css, /\.art-caption,\.art-note\{display:none\}/, 'wstążka i karteczka przy ilustracji ukryte');
  // Brak „drukowanych” przesuniętych cieni (np. 6px 7px 0) na kartach, panelach i przyciskach.
  assert.doesNotMatch(css, /box-shadow:\s*-?\d+px\s+-?\d+px\s+0\s/);
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
