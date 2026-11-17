// CNT-035: tryb motywu (jasny / ciemny / automatyczny). Samodzielny moduł bez zależności.
// 'light' i 'dark' ustawiają html[data-theme]; 'auto' usuwa atrybut, a theme.css idzie za prefers-color-scheme.
// Wybór jest zapisywany w localStorage (klucz poniżej); brak dostępu do pamięci nie psuje aplikacji.
export const THEME_KEY = 'co-na-talerz:theme';
export const THEME_MODES = ['light', 'dark', 'auto'];
// Kolory paska przeglądarki (<meta name="theme-color">): jasny = okładka książeczki, ciemny = nocny papier.
export const THEME_COLORS = { light: '#9a3824', dark: '#1c1a33' };

const FALLBACK = { themeLabel: 'Motyw', themeLight: 'Jasny', themeDark: 'Ciemny', themeAuto: 'Automatyczny' };
const ICONS = { light: '☀︎', dark: '☾︎', auto: '◑' };
const KEYS = { light: 'themeLight', dark: 'themeDark', auto: 'themeAuto' };

const valid = mode => THEME_MODES.includes(mode);
const doc = () => globalThis.document;
const darkQuery = () => {
  try { return globalThis.matchMedia ? globalThis.matchMedia('(prefers-color-scheme: dark)') : null; } catch { return null; }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let current = 'auto';
let watching = null;

function readStored() {
  try {
    const value = globalThis.localStorage?.getItem(THEME_KEY);
    return valid(value) ? value : 'auto';
  } catch { return 'auto'; }
}

function store(mode) {
  try {
    if (mode === 'auto') globalThis.localStorage?.removeItem(THEME_KEY);
    else globalThis.localStorage?.setItem(THEME_KEY, mode);
  } catch { /* prywatny tryb / brak miejsca: motyw działa do końca sesji */ }
}

/** Motyw faktycznie widoczny: 'light' albo 'dark' (dla 'auto' według ustawień systemu). */
export function resolvedTheme(mode = current) {
  if (mode === 'light' || mode === 'dark') return mode;
  return darkQuery()?.matches ? 'dark' : 'light';
}

function updateMetaColor() {
  const meta = doc()?.querySelector?.('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[resolvedTheme()]);
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
  if (root && typeof root.setAttribute === 'function') {
    if (mode === 'auto') root.removeAttribute?.('data-theme');
    else root.setAttribute('data-theme', mode);
  }
  updateMetaColor();
  syncToggles();
}

/** Odczytuje zapisany wybór i ustawia motyw. Wywołaj jak najwcześniej (przed pierwszym renderem). */
export function initThemeMode() {
  apply(readStored());
  const query = darkQuery();
  if (query && !watching) {
    // W trybie automatycznym zmiana ustawień systemu zmienia też kolor paska przeglądarki.
    watching = () => { if (current === 'auto') updateMetaColor(); };
    if (query.addEventListener) query.addEventListener('change', watching);
    else query.addListener?.(watching);
  }
  return current;
}

/** Ustawia i zapamiętuje tryb; nieznana wartość = 'auto'. Zwraca ustawiony tryb. */
export function setThemeMode(mode) {
  const next = valid(mode) ? mode : 'auto';
  store(next);
  apply(next);
  return next;
}

export function getThemeMode() { return current; }

/** Markup przełącznika z trzema przyciskami (aria-pressed). `t` to funkcja tłumacząca aplikacji. */
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
