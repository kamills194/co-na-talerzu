// CNT-041: odczyt promocji z gazetek ALDI (gazetki.aldi.pl, przeglądarka iPaper).
// Strona gazetki zawiera publiczny tekst każdej strony (`pageTexts`), z którego czytamy pary
// „cena promocyjna + cena sprzed obniżki” oraz ceny „AKCJA”. Odczyt jest zachowawczy (fail closed):
//  - produkt musi mieć nazwę zakończoną jednostką sprzedaży (Cena za kg, Opak. …, Sztuka, Butelka …),
//  - nazwa musi jednoznacznie pasować do produktu z katalogu (matchProduct z offer-parser.mjs),
//  - musi być znany okres obowiązywania (z tej samej strony albo z całej gazetki),
//  - promocje wielosztukowe („PRZY ZAKUPIE 2 SZT.”, „NA CO DRUGI PRODUKT”, „2+1 GRATIS”) są pomijane:
//    w tekście gazetki cena i nazwa nie zawsze stoją obok siebie, więc mogłyby trafić do złego produktu.
import { matchProduct } from './offer-parser.mjs';
import { markets, marketDate } from '../src/market.js';

const PL = markets.PL;
const SCOPE = Object.freeze({ type: 'unverified', note: 'Oferta z gazetki ogólnopolskiej sklepu; dostępność w Twoim sklepie niepotwierdzona' });
const DAY = '(?:pon|wt|śr|sr|czw|pt|sob|niedz|nd)\\.';
const RANGE = new RegExp(`${DAY}\\s*(\\d{1,2})\\.(\\d{1,2})\\.?\\s*[–-]\\s*${DAY}\\s*(\\d{1,2})\\.(\\d{1,2})`, 'g');
// Zdarzenia cenowe w kolejności występowania w tekście strony:
//  strike: „11 , 99 17,99 *”   (cena promocyjna, cena sprzed obniżki z gwiazdką)
//  unit:   „10 , 99 /szt.”     (cena za sztukę w promocjach wielosztukowych — tylko granica odcinka)
//  bare:   „2 , 49”            (sama cena; przyjmowana tylko przy oznaczeniu AKCJA w tym samym odcinku)
const PRICE = /(\d{1,4}) , (\d{2})(?: (\d{1,4},\d{2}) \*| ?\/)?/g;
const SIZE = '[\\d,/]+(?: x [\\d,]+)? ?(?:g|kg|ml|l|szt\\.?)(?: \\([^)]{0,40}\\))?';
const UNIT = new RegExp(`(Cena za (?:kg|\\d+ g(?: \\([^)]{0,30}\\))?)|Opak\\.? ${SIZE}|Sztuka(?: \\d+ g(?: \\([^)]{0,30}\\))?)?|Koszyk [\\d,]+ kg|(?:Butelka|Puszka|Słoik) ${SIZE}|Pęczek|Paczka ${SIZE})`, 'g');
const STOP = /[%*]|^\d|\.$|^(?:AI|AKCJA|CENY|REGULARNA|DO|AŻ|TANIEJ|KG|XXL|I|WYGENEROWANO|SPECJAŁY|WARZYWA|OKAZJE|SMACZNE|SUPER)$/;

const num = s => Number(String(s).replace(',', '.'));
const pad = n => String(n).padStart(2, '0');

// Wydobywa tablicę `pageTexts` z HTML przeglądarki iPaper (pierwsza tablica JSON po kluczu).
export function extractPageTexts(html) {
  const key = String(html).indexOf('"pageTexts":');
  if (key < 0) return null;
  let i = String(html).indexOf('[', key), depth = 0, inStr = false, esc = false;
  if (i < 0) return null;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === '[') depth++; else if (c === ']' && --depth === 0) {
      try { const a = JSON.parse(html.slice(i, j + 1)); return Array.isArray(a) && a.every(x => typeof x === 'string') ? a : null; } catch { return null; }
    }
  }
  return null;
}
// Rok i tydzień z adresu gazetki (…/2026/kw47/… albo …/2026_cw47_…).
export function leafletYearWeek(url) {
  const m = /(20\d\d)\/kw(\d{1,2})\//i.exec(url) || /(20\d\d)_cw(\d{1,2})_/i.exec(url);
  return m ? { year: +m[1], week: +m[2] } : null;
}
// Daty z „pon. 16.11 – sob. 21.11”; rok z gazetki, z przejściem grudzień → styczeń.
function ranges(text, year) {
  return [...String(text).matchAll(RANGE)].map(m => {
    const [d1, m1, d2, m2] = m.slice(1).map(Number);
    if (!(m1 >= 1 && m1 <= 12 && m2 >= 1 && m2 <= 12 && d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31)) return null;
    const y1 = year, y2 = m2 < m1 ? year + 1 : year;
    const from = `${y1}-${pad(m1)}-${pad(d1)}`, until = `${y2}-${pad(m2)}-${pad(d2)}`;
    return from <= until ? { from, until, index: m.index } : null;
  }).filter(Boolean);
}
// Koniec dnia `until` w strefie rynku jako moment UTC (marketDate(wynik) === until).
export function endOfMarketDay(day, market = PL) {
  const [y, m, d] = day.split('-').map(Number);
  for (const off of [-1, -2, 0, -3, 1]) {
    const t = new Date(Date.UTC(y, m - 1, d, 23, 59, 59) + off * 3600e3);
    const hour = new Intl.DateTimeFormat('en-GB', { timeZone: market.timeZone, hour: '2-digit', hourCycle: 'h23' }).format(t);
    if (marketDate(t, market) === day && hour === '23') return t.toISOString();
  }
  return null;
}
// Nazwa i jednostka: ostatnia jednostka sprzedaży w odcinku i do 7 słów tuż przed nią.
export function nameAndUnit(segment) {
  const units = [...String(segment).matchAll(UNIT)];
  for (let k = units.length - 1; k >= 0; k--) {
    const u = units[k], words = segment.slice(0, u.index).trim().split(/\s+/), name = [];
    while (words.length && name.length < 7) { const w = words.pop(); if (!w || STOP.test(w)) break; name.unshift(w); }
    // Zostaw co najwyżej jedno słowo pisane wielkimi literami na początku (marka), resztę haseł reklamowych utnij.
    while (name.length > 1 && /^[A-ZĄĆĘŁŃÓŚŹŻ’'.-]{2,}$/.test(name[0]) && /^[A-ZĄĆĘŁŃÓŚŹŻ’'.-]{2,}$/.test(name[1])) name.shift();
    if (name.length && /\p{Ll}/u.test(name.join(' '))) return { name: name.join(' '), unit: u[0].trim() };
  }
  return null;
}

/**
 * Oferty z tekstów stron gazetki.
 * @param {string[]} pageTexts
 * @param {{source:string, leafletUrl:string, now?:Date, id?:string}} opts  source — adres strony gazetki na aldi.pl
 */
export function parseLeafletTexts(pageTexts, { source, leafletUrl, now = new Date(), id } = {}) {
  if (!Array.isArray(pageTexts)) throw Error('Brak tekstu gazetki (pageTexts); adapter wymaga aktualizacji.');
  const yw = leafletYearWeek(leafletUrl || source || '') || { year: Number(marketDate(now).slice(0, 4)) };
  const all = pageTexts.flatMap(t => ranges(t, yw.year));
  const leafletRange = all[0] || null;
  const slug = (id || String(leafletUrl || source).replace(/\/+$/, '').split('/').pop() || 'gazetka').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  const out = new Map(); let seen = 0, unmapped = 0, skipped = 0;
  pageTexts.forEach((text, page) => {
    // Zniekształcony tekst z grafik (np. „p w opar k o od w u a k n t iu”): ≥3 kolejne 1–2-literowe słowa → granica „*”.
    const t = String(text).replace(/\s+/g, ' ').replace(/(?:(?<=^|\s)\p{Ll}{1,2}(?=\s)\s*){3,}/gu, ' * ');
    const pageRanges = ranges(t, yw.year);
    let last = 0;
    for (const m of t.matchAll(PRICE)) {
      const segment = t.slice(last, m.index); last = m.index + m[0].length;
      const isUnit = m[0].trimEnd().endsWith('/'), strike = m[3];
      if (isUnit) continue;
      if (!strike && !/\bAKCJA\b/.test(segment)) continue;
      // Promocje wielosztukowe w odcinku → pomijamy (patrz nagłówek pliku).
      if (/PRZY ZAKUPIE|NA CO DRUGI|GRATIS|Cena za co drugą|DRUGI TAŃSZY/i.test(segment)) { skipped++; continue; }
      const nu = nameAndUnit(segment); if (!nu) continue;
      seen++;
      const product = matchProduct(nu.name); if (!product) { unmapped++; continue; }
      const price = num(`${m[1]}.${m[2]}`), regular = strike ? num(strike) : undefined;
      if (!(price > 0) || (regular !== undefined && !(price < regular))) { skipped++; continue; }
      // Okres: zakres z tego odcinka, inaczej ostatni wcześniejszy na stronie, inaczej pierwszy na stronie, inaczej z gazetki.
      const local = ranges(segment, yw.year)[0] || pageRanges.filter(r => r.index < m.index).pop() || pageRanges[0] || leafletRange;
      if (!local) { skipped++; continue; }
      const validUntil = endOfMarketDay(local.until); if (!validUntil) { skipped++; continue; }
      const offerId = `aldi-g-${slug}-${page + 1}-${product}-${local.from}`.slice(0, 99);
      const regularText = regular !== undefined ? `cena sprzed obniżki (najniższa z 30 dni wg gazetki): ${String(regular.toFixed(2)).replace('.', ',')} zł` : 'cena promocyjna „AKCJA” — gazetka nie podaje ceny sprzed obniżki';
      out.set(offerId, {
        id: offerId, product, market: PL.id, currency: PL.currency, scope: { ...SCOPE }, store: 'ALDI', price,
        ...(regular !== undefined ? { regularPrice: regular } : {}),
        from: local.from, until: local.until, validUntil, source: safeUrl(leafletUrl ? `${leafletUrl.replace(/#.*$/, '')}#/page/${page + 1}` : source),
        fetchedAt: now.toISOString(), name: nu.name.slice(0, 200), unit: nu.unit.slice(0, 100),
        conditions: `Gazetka ALDI, strona ${page + 1}: ${regularText}. Sprawdź warunki w gazetce i w sklepie.`.slice(0, 500),
        origin: 'leaflet', evidence: segment.slice(-300) + m[0],
      });
    }
  });
  return { offers: [...out.values()], productsSeen: seen, unmapped, skipped, range: leafletRange && { from: leafletRange.from, until: leafletRange.until } };
}
const safeUrl = u => (typeof u === 'string' && /^https:\/\/[^\s"'<>`]+$/.test(u) ? u : '');

// ---------- Lista gazetek ----------
// Adresy gazetek z https://www.aldi.pl/gazetki.html (kolejność jak na stronie, bez duplikatów).
export function leafletPages(html, base = 'https://www.aldi.pl') {
  // Linki są w HTML (href) albo w danych strony (__NEXT_DATA__, także z ucieczką \/), względne lub pełne.
  const text = String(html).replace(/\\\//g, '/');
  // W danych strony ścieżka bywa bez „.html” ("path":"/gazetki/2026_cw47_mo_promotion_26k47g01").
  // Tylko gazetki z rokiem i tygodniem w nazwie (RRRR_cwNN_…) — starsze strony specjalne są pomijane.
  const urls = [...text.matchAll(/(?<![a-z0-9.-])((?:https:\/\/www\.aldi\.pl)?\/gazetki\/(20\d\d_cw\d{1,2}_[a-z0-9_-]+?))(?:\.html)?(?![a-z0-9_-])/gi)].map(m => new URL(m[1] + '.html', base).href);
  return [...new Set(urls)].filter(u => !/raport|marnowanie/i.test(u));
}
// Adres przeglądarki iPaper ze strony gazetki na aldi.pl.
export function ipaperUrl(html) {
  const m = /https:\/\/gazetki\.aldi\.pl\/[a-z0-9_./-]+\//i.exec(String(html).replace(/\\\//g, '/'));
  return m ? m[0] : null;
}
// Czytelny tytuł gazetki z adresu (np. 2026_cw47_mo_special_26k47g07_wykwintne-smaki → „Wykwintne smaki”).
// Gazetka do pokazania: ma okres obowiązywania albo jest z ostatnich 12 tygodni (wg nazwy RRRR_cwNN).
export function isRecentLeaflet(url, range, now = new Date()) {
  if (range?.until) return range.until >= marketDate(now);
  const yw = leafletYearWeek(url); if (!yw) return false;
  const weekStart = Date.UTC(yw.year, 0, 4) + (yw.week - 1) * 7 * 864e5;
  return now.getTime() - weekStart <= 12 * 7 * 864e5;
}
export function leafletTitle(url) {
  const name = String(url).split('/').pop().replace(/\.html$/, '');
  const special = /_special_[a-z0-9]+_([a-z-]+)$/i.exec(name);
  // Adresy nie mają polskich znaków — znane nazwy z pisownią ze strony ALDI.
  const KNOWN = { 'ceny-w-dol': 'Ceny w dół', 'wykwintne-smaki': 'Wykwintne smaki', 'zabawki': 'Katalog zabawkowy', 'prezenty': 'Katalog prezentowy', 'dekoracje': 'Katalog dekoracyjny' };
  if (special) { if (KNOWN[special[1].toLowerCase()]) return KNOWN[special[1].toLowerCase()]; const s = special[1].replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  if (/non-food/i.test(name)) return 'Artykuły przemysłowe i tekstylia';
  if (/weekend/i.test(name)) return 'Okazje na weekend';
  if (/promotion/i.test(name)) return 'Gazetka tygodniowa';
  return 'Gazetka';
}
export const isFoodLeaflet = url => !/non-food|zabawk|prezent|dekorac|ogrod|textil|tekstyl/i.test(url);
