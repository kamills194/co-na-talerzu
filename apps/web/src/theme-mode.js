// CNT-035 / CNT-039: motyw jasny albo ciemny — tylko dwa tryby (decyzja właściciela 17.11). Samodzielny moduł bez zależności.
// Tryb zawsze ustawia html[data-theme]. Przy pierwszej wizycie (nic nie zapisano) wybór jest brany RAZ z
// prefers-color-scheme i zapisywany; potem liczy się tylko wybór użytkownika. Zapisane 'auto' ze starszej wersji
// (albo inna nieznana wartość) jest migrowane tak samo: do motywu systemu w chwili migracji.
// To samo robi mały skrypt w <head> index.html przed pierwszym malowaniem (bez mignięcia jasnego motywu).
export const THEME_KEY = 'co-na-talerz:theme';
export const THEME_MODES = ['light', 'dark'];
// Kolory paska przeglądarki (<meta name="theme-color">): jasny = okładka książeczki, ciemny = neutralna ciemna szarość.
export const THEME_COLORS = { light: '#9a3824', dark: '#121212' };

const FALLBACK = { themeLabel: 'Motyw', themeLight: 'Jasny', themeDark: 'Ciemny' };
const ICONS = { light: '☀︎', dark: '☾︎' };
const KEYS = { light: 'themeLight', dark: 'themeDark' };

const valid = mode => THEME_MODES.includes(mode);
const doc = () => globalThis.document;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let current = 'light';

/** Motyw systemu (prefers-color-scheme): 'dark' albo 'light'. Używany tylko przy pierwszej wizycie i migracji. */
export function systemTheme() {
  try { return globalThis.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'; } catch { return 'light'; }
}

function readStored() {
  try { return globalThis.localStorage?.getItem(THEME_KEY) ?? null; } catch { return null; }
}

function store(mode) {
  try { globalThis.localStorage?.setItem(THEME_KEY, mode); } catch { /* prywatny tryb / brak miejsca: motyw działa do końca sesji */ }
}

/** Widoczny motyw: zawsze 'light' albo 'dark'. */
export function resolvedTheme(mode = current) { return valid(mode) ? mode : 'light'; }

function updateMetaColor() {
  const meta = doc()?.querySelector?.('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[current]);
}

function syncToggles() {
  const d = doc();
  if (!d?.querySelectorAll) return;
  for (const button of d.querySelectorAll('[data-theme-mode]'))
    button.setAttribute('aria-pressed', String(button.getAttribute('data-theme-mode') === current));
}

function apply(mode) {
  current = mode;
  const root = doc()?.documentElement;
  // A partial DOM (old browser, tests) must never stop the app from starting.
  if (root && typeof root.setAttribute === 'function') root.setAttribute('data-theme', mode);
  updateMetaColor();
  syncToggles();
}

/** Odczytuje zapisany wybór (albo raz ustala go z systemu i zapisuje) i ustawia motyw. Wywołaj przed pierwszym renderem. */
export function initThemeMode() {
  const stored = readStored();
  if (valid(stored)) apply(stored);
  else { const first = systemTheme(); store(first); apply(first); }
  return current;
}

/** Ustawia i zapamiętuje tryb 'light' albo 'dark'; nieznana wartość niczego nie zmienia. Zwraca bieżący tryb. */
export function setThemeMode(mode) {
  if (!valid(mode)) return current;
  store(mode);
  apply(mode);
  return current;
}

export function getThemeMode() { return current; }

/** Markup przełącznika z dwoma przyciskami (aria-pressed). `t` to funkcja tłumacząca aplikacji. */
export function themeToggleHTML(t) {
  const tr = key => {
    let text;
    try { text = typeof t === 'function' ? t(key) : undefined; } catch { text = undefined; }
    return !text || text === key ? FALLBACK[key] : text;
  };
  const buttons = THEME_MODES.map(mode => {
    const text = esc(tr(KEYS[mode]));
    return `<button type="button" data-theme-mode="${mode}" aria-pressed="${mode === current}" title="${text}"><span aria-hidden="true">${ICONS[mode]}</span><span class="theme-toggle-text">${text}</span></button>`;
  }).join('');
  return `<div class="theme-toggle" role="group" aria-label="${esc(tr('themeLabel'))}">${buttons}</div>`;
}

/** Podpina kliknięcia przełącznika (delegacja na `root`, domyślnie document). Zwraca funkcję odpinającą. */
export function bindThemeToggle(root = doc()) {
  if (!root?.addEventListener) return () => {};
  const onClick = event => {
    const button = event.target?.closest?.('[data-theme-mode]');
    if (!button || (root.contains && !root.contains(button))) return;
    setThemeMode(button.getAttribute('data-theme-mode'));
  };
  root.addEventListener('click', onClick);
  syncToggles();
  return () => root.removeEventListener('click', onClick);
}
