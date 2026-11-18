// CNT-042: sieci sklepów z gazetkami. Kafelek każdego sklepu jest widoczny zawsze; okres gazetki
// dopisuje bot ofert (offers.json → leaflets), gdy uda mu się go odczytać ze strony sklepu.
// Kolory to barwy rozpoznawcze sieci (tylko tło nazwy, bez logotypów). `ink` — kolor tekstu na tym tle (kontrast ≥ 4.5:1).
export const STORES = Object.freeze([
  { id: 'biedronka', name: 'Biedronka', color: '#c8102e', ink: '#ffffff', url: 'https://www.biedronka.pl/pl/gazetki' },
  { id: 'lidl', name: 'Lidl', color: '#0050aa', ink: '#ffffff', url: 'https://www.lidl.pl/c/nasze-gazetki/s10008614' },
  { id: 'kaufland', name: 'Kaufland', color: '#b5101f', ink: '#ffffff', url: 'https://sklep.kaufland.pl/gazeta-reklamowa.html' },
  { id: 'aldi', name: 'ALDI', color: '#00005f', ink: '#ffffff', url: 'https://www.aldi.pl/gazetki.html' },
  { id: 'carrefour', name: 'Carrefour', color: '#004e9f', ink: '#ffffff', url: 'https://www.carrefour.pl/gazetka-handlowa' },
  { id: 'auchan', name: 'Auchan', color: '#d6001c', ink: '#ffffff', url: 'https://www.auchan.pl/pl/gazetki' },
  { id: 'netto', name: 'Netto', color: '#ffd200', ink: '#1a1a1a', url: 'https://netto.pl/gazetka-netto/' },
  { id: 'dino', name: 'Dino', color: '#00703c', ink: '#ffffff', url: 'https://marketdino.pl/gazetki/lista/standard' },
  { id: 'intermarche', name: 'Intermarché', color: '#c00d1e', ink: '#ffffff', url: 'https://intermarche.pl/gazetki-promocyjne/' },
  { id: 'stokrotka', name: 'Stokrotka', color: '#3f7d1f', ink: '#ffffff', url: 'https://stokrotka.pl/oferta/gazetki-promocyjne/' },
]);
export const storeById = id => STORES.find(s => s.id === id) || null;
