// CNT-042: okresy gazetek z publicznych stron sieci sklepów. Czyste funkcje (HTML/JSON → lista gazetek);
// pobieraniem, robots.txt i limitami zajmuje się offers-bot.mjs.
// Gazetka: { title, url, from?: 'RRRR-MM-DD', until?: 'RRRR-MM-DD' }. Daty tylko wtedy, gdy strona je podaje —
// nic nie jest zgadywane (Biedronka podaje tylko początek, Auchan — nic bez zabezpieczonego API).
import { marketDate, markets } from '../src/market.js';

const pad = n => String(n).padStart(2, '0');
const iso = (y, m, d) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${pad(m)}-${pad(d)}` : null);
const decode = s => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const clean = s => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
// Tytuły pisane wielkimi literami → zdanie („OD PONIEDZIAŁKU W SKLEPACH” → „Od poniedziałku w sklepach”).
export const tidyTitle = s => { const t = clean(s).replace(/^Gazetka\s+Carrefour\s*,?\s*/i, '').replace(/^[,\s]+/, ''); return (t === t.toUpperCase() && /\p{L}{4}/u.test(t) ? t.charAt(0) + t.slice(1).toLowerCase() : t).slice(0, 80); };
const MONTHS = { stycznia: 1, lutego: 2, marca: 3, kwietnia: 4, maja: 5, czerwca: 6, lipca: 7, sierpnia: 8, września: 9, wrzesnia: 9, października: 10, pazdziernika: 10, listopada: 11, grudnia: 12 };
// Rok, gdy strona go nie podaje: najbliższy względem dzisiaj (grudzień ↔ styczeń).
function guessYear(month, now) {
  const [y, m] = marketDate(now).split('-').map(Number);
  if (month - m > 6) return y - 1; if (m - month > 6) return y + 1; return y;
}
/**
 * Okres z tekstu: „od 16.11 do 21.11.2026”, „od 12 do 18.11”, „OD 10-11-2026 DO 18-11-2026”,
 * „od 16 listopada 2026 do 21 listopada 2026”, „Oferta obowiązuje do 30.11.2026”.
 */
export function parseRange(text, now = new Date()) {
  const t = clean(text).toLowerCase();
  const word = Object.keys(MONTHS).join('|');
  let m = new RegExp(`od\\s+(\\d{1,2})\\s+(${word})(?:\\s+(\\d{4}))?\\s*(?:r\\.)?\\s*do\\s+(\\d{1,2})\\s+(${word})(?:\\s+(\\d{4}))?`).exec(t);
  if (m) { const m1 = MONTHS[m[2]], m2 = MONTHS[m[5]]; const y2 = +m[6] || guessYear(m2, now), y1 = +m[3] || (m1 > m2 ? y2 - 1 : y2); return valid(iso(y1, m1, +m[1]), iso(y2, m2, +m[4])); }
  m = /od\s+(\d{1,2})(?:[.\-/](\d{1,2}))?(?:[.\-/](\d{4}))?\.?\s*(?:r\.)?\s*(?:do|-|–)\s*(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/.exec(t);
  if (m) {
    const m2 = +m[5], y2 = m[6] ? (m[6].length === 2 ? 2000 + +m[6] : +m[6]) : guessYear(m2, now);
    let m1 = m[2] ? +m[2] : m2, y1 = m[3] ? +m[3] : y2;
    if (!m[2] && +m[1] > +m[4]) m1 = m2 === 1 ? 12 : m2 - 1;
    if (!m[3] && m1 > m2) y1 = y2 - 1;
    return valid(iso(y1, m1, +m[1]), iso(y2, m2, +m[4]));
  }
  m = /(?:obowiązuje|ważna|wazna)\s+do\s+(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{4}))?/.exec(t);
  if (m) { const until = iso(+m[3] || guessYear(+m[2], now), +m[2], +m[1]); return until ? { until } : null; }
  return null;
}
const valid = (from, until) => (from && until && from <= until ? { from, until } : null);
const dayOf = (ms, now) => (Number.isFinite(ms) ? marketDate(new Date(ms), markets.PL) : null);

// ---------- Adaptery ----------
// Lidl: lista gazetek (identyfikator, nazwa, tytuł). Okres dopisuje API leaflets.schwarz (lidlFlyer).
export function lidlList(html) {
  const out = [];
  for (const m of String(html).matchAll(/<a href="(https:\/\/www\.lidl\.pl\/l\/pl\/gazetki\/([a-z0-9-]+)\/ar\/0)[^"]*"[^>]*class="flyer"[\s\S]{0,1500}?class="flyer__name">([\s\S]*?)<\/div>[\s\S]{0,200}?class="flyer__title">([\s\S]*?)<\/span>/g))
    if (!out.some(x => x.id === m[2])) out.push({ id: m[2], url: m[1], title: tidyTitle(`${clean(m[3])} ${clean(m[4])}`) });
  return out;
}
export function lidlFlyer(json) {
  const f = json?.flyer || json?.flyers?.[0] || json;
  const from = f?.offerStartDate || f?.startDate, until = f?.offerEndDate || f?.endDate;
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(until) && from <= until ? { from, until, name: f?.name } : null;
}
// Kaufland: daty są w nazwach plików PDF, tuż przed odnośnikiem do przeglądarki gazetki.
export function kaufland(html) {
  const out = [];
  for (const m of String(html).replace(/\s+/g, ' ').matchAll(/assets\.leaflets\.schwarz\/leaflets\/pdfs\/[^"]+?\/([^"/]+?)-(\d{2})-(\d{2})-(\d{4})-(\d{2})-(\d{2})-(\d{4})-\d+\.pdf[\s\S]{0,400}?(https:\/\/leaflets\.kaufland\.com\/[^"\s]+)/g)) {
    const r = valid(iso(+m[4], +m[3], +m[2]), iso(+m[7], +m[6], +m[5]));
    if (r && !out.some(x => x.url === m[8])) out.push({ title: m[1] === 'Kaufland' ? 'Gazetka' : m[1].replace(/-/g, ' '), url: m[8], ...r });
  }
  return out;
}
// Carrefour: dane strony (__NEXT_DATA__) z dateFrom/dateTo w milisekundach; odnośnik /gazetka-handlowa/<uuid>.
export function carrefour(html, now = new Date()) {
  const out = [];
  for (const m of String(html).matchAll(/\{"publishStatus":"PUBLIC","dateTo":(\d+),"name":"((?:[^"\\]|\\.)*)"[\s\S]{0,400}?"dateFrom":(\d+)[\s\S]{0,600}?"uuid":"(\d+)"\}/g)) {
    const r = valid(dayOf(+m[3], now), dayOf(+m[1], now));
    if (r) out.push({ title: tidyTitle(JSON.parse(`"${m[2]}"`)), url: `https://www.carrefour.pl/gazetka-handlowa/${m[4]}`, ...r });
  }
  return out;
}
// Biedronka: kafle gazetek; strona podaje tylko początek („…-od-16-11”), więc okres ma samo `from`.
export function biedronka(html, now = new Date()) {
  const out = [];
  for (const m of String(html).matchAll(/data-slot-id="([^"]+)"[^>]*>\s*<a class="page-slot-columns" href="(https:\/\/www\.biedronka\.pl\/pl\/press,id,[a-z0-9]+,title,([a-z0-9-]+))[^"]*"/g)) {
    // Tylko gazetki z ofertą tygodnia („…-p-oferta-od-16-11”); kafle tematyczne i katalogi pomijamy.
    const d = /oferta-od-(\d{1,2})-(\d{1,2})$/.exec(m[3]); if (!d) continue;
    const from = iso(guessYear(+d[2], now), +d[2], +d[1]); if (!from) continue;
    const title = m[3].replace(/-p?-?oferta-od-.*$|-od-\d.*$/, '').replace(/-/g, ' ');
    out.push({ title: title.charAt(0).toUpperCase() + title.slice(1), url: m[2], from });
  }
  return out;
}
/**
 * Strony z okresem w zwykłym tekście (Netto, Dino, Intermarché, Stokrotka): każdy okres łączy się
 * z najbliższym wcześniejszym tytułem i odnośnikiem pasującym do `link` (inaczej adres strony listy).
 */
export function textCards(html, { base, link, now = new Date() }) {
  const body = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<!--[\s\S]*?-->/g, '');
  const SKIP = /^(?:oferta(?: handlowa)? ważna|aktualna gazetka|zobacz gazetkę|sprawdź ofertę|wkrótce|pozostało.*|gazetka|gazetki|nowa)$/i;
  const out = []; let title = '', url = '';
  for (const m of body.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*?(?:\btitle="([^"]*)")?[^>]*(?=>)|>([^<>]+)</g)) {
    if (m[1]) { let u; try { u = new URL(decode(m[1]), base).href; } catch { continue; } if (link.test(u)) { url = u; if (m[2] && clean(m[2]).length > 2) title = clean(m[2]); } continue; }
    const text = clean(m[3] || ''); if (!text) continue;
    const r = parseRange(text, now);
    // Tytuł bywa sam z datami („Gazetka promocyjna od 12 do 18.11”) — wtedy jest i tytułem, i okresem.
    if (r) { if (!/^(?:oferta|od\b|do\b|aktualna|każdy|każda)/i.test(text) && text.length <= 90) title = text; if (title) out.push({ title: tidyTitle(title), url: url || base, ...r }); continue; }
    if (text.length >= 3 && text.length <= 90 && !SKIP.test(text) && /\p{L}{3}/u.test(text) && !/^\d/.test(text)) title = text;
  }
  // Ten sam odnośnik bywa na stronie kilka razy — zostaje pierwszy wpis.
  return out.filter((x, i) => out.findIndex(y => y.url === x.url && y.title === x.title) === i);
}

// ---------- Wybór gazetki na kafelek ----------
// Gazetki nie-spożywcze (zabawki, prezenty, dekoracje, alkohol, chemia, odzież…) pomijamy.
export const NON_FOOD = /\bkatalog|zabaw|prezent|dekorac|porządk|porzadk|alkohol|win(?:a|o)\b|karta win|piwnicz|tekstyl|przemysł|odzież|drogeri|kosmety|chemi|ogród|ogrod|black friday|home\b|\bdom\b|elektron|rtv|agd|pikne|piękne|toast|barek/i;
/** Główna gazetka sklepu: aktualna (od ≤ dziś ≤ do), inaczej najbliższa przyszła; tylko spożywcze. */
export function mainLeaflet(list, now = new Date()) {
  const today = marketDate(now);
  const food = (list || []).filter(l => l && l.url && !NON_FOOD.test(`${l.title} ${l.url}`));
  const current = food.filter(l => (!l.from || l.from <= today) && (!l.until || l.until >= today) && (l.from || l.until));
  // Najkrótsza aktualna = zwykle gazetka tygodniowa (katalogi miesięczne trwają dłużej).
  const len = l => (l.from && l.until ? Date.parse(l.until) - Date.parse(l.from) : 1e13);
  current.sort((a, b) => len(a) - len(b) || String(b.from).localeCompare(String(a.from)));
  if (current[0]) return current[0];
  const upcoming = food.filter(l => l.from && l.from > today).sort((a, b) => a.from.localeCompare(b.from));
  return upcoming[0] || null;
}
