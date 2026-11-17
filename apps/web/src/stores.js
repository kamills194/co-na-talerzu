// CNT-041: sieci sklepów na ekranie „Promocje” (kafelki). Tylko ALDI udostępnia oferty w postaci danych, które bot
// czyta i które aplikacja pokazuje (`inApp:true`). Pozostałe sieci publikują gazetki jako obrazy/flipbooki, a część
// odrzuca zapytania automatyczne (diagnostyka w GitHub Actions 17–18.11.2026: Kaufland i Carrefour HTTP 403, Lidl bez
// odpowiedzi) — kafelek prowadzi wtedy po prostu do strony z gazetką.
//
// Adresy gazetek: zweryfikowane (aldi, biedronka, netto, dino, stokrotka, intermarche). Dla lidl, kaufland, carrefour,
// auchan i penny adresu strony z gazetką NIE udało się zweryfikować — to strony główne sieci (oficjalne domeny).
//
// Znak towarowy: w interfejsie jest wyłącznie nazwa sieci w neutralnej plakietce z inicjałem. Nie rysujemy ani nie
// kopiujemy logotypów, kolorystyki ani znaków słownych sieci. Nazwy sklepów nie są tłumaczone.
const store = (id, name, leafletUrl, inApp = false) => Object.freeze({ id, name, leafletUrl, inApp });
export const STORES = Object.freeze([
  store('aldi', 'ALDI', 'https://www.aldi.pl/gazetki.html', true),
  store('lidl', 'Lidl', 'https://www.lidl.pl/'),                    // strona główna — adres gazetki niezweryfikowany
  store('biedronka', 'Biedronka', 'https://www.biedronka.pl/pl/gazetki'),
  store('kaufland', 'Kaufland', 'https://www.kaufland.pl/'),        // strona główna — adres gazetki niezweryfikowany
  store('netto', 'Netto', 'https://www.netto.pl/gazetka-netto/'),
  store('carrefour', 'Carrefour', 'https://www.carrefour.pl/'),     // strona główna — adres gazetki niezweryfikowany
  store('auchan', 'Auchan', 'https://www.auchan.pl/pl'),            // strona główna — adres gazetki niezweryfikowany
  store('dino', 'Dino', 'https://marketdino.pl/gazetki/lista/standard'),
  store('stokrotka', 'Stokrotka', 'https://stokrotka.pl/oferta/gazetki-promocyjne/'),
  store('intermarche', 'Intermarché', 'https://intermarche.pl/gazetki-promocyjne/'),
  store('penny', 'Penny', 'https://www.penny.pl/'),                 // strona główna — adres gazetki niezweryfikowany
]);
export const storeById = id => STORES.find(s => s.id === id) || null;
// First letter of the name for the neutral badge ("ALDI" → "A", "Intermarché" → "I").
export const storeInitial = s => String(s?.name ?? '').trim().charAt(0).toLocaleUpperCase('pl-PL');
