// CNT-041: odczyt promocji z gazetki ALDI (tekst stron iPaper). Fragmenty w formacie gazetki z 16–21.11.2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRecentLeaflet, extractPageTexts, parseLeafletTexts, nameAndUnit, endOfMarketDay, leafletPages, ipaperUrl, leafletTitle, isFoodLeaflet, leafletYearWeek } from '../scripts/leaflet-parser.mjs';
import { validAutomaticOffer, isDisplayableAutomaticOffer } from '../src/domain.js';

const PAGES = [
  '3791 7820 3059 0497 8024619',
  '3791 6173 WYGENEROWANO AI Pomidory malinowe Cena za kg klasa I pon. 16.11 – sob. 21.11 ŚWIEŻE WARZYWA 33% TANIEJ DO 11 , 99 17,99 * 53% Ogórki szklarniowe Cena za kg 53% 6 , 99 14,99 * Ziemniaki Cena za kg 50% 0 , 99 1,99 * Kalafior Sztuka 2 WYBIERAM JAKOŚĆ, UWIELBIAM SUPER CENY 30% 6 , 99 9,99 * Papryka czerwona Cena za kg klasa I 33% 11 , 99 17,99 * *Najniższa cena sprzed pierwszej obniżki.',
  '8274 523 pon. 16.11 – sob. 21.11 Awokado Sztuka p w opar k o od w u a k n t iu 33% 3 , 99 5,99 * Mandarynki Cena za kg klasa I 22% 6 , 99 8,99 * AKCJA Jabłka polskie Cena za kg klasa I 2 , 49 WYBIERAM JAKOŚĆ, 3 UWIELBIAM SUPER CENY',
  'pon. 16.11 – sob. 21.11 Kapusta gołąbkowa Cena za kg 30 WYBIERAM JAKOŚĆ, UWIELBIAM SUPER CENY 16% 4 , 99 5,99 * Cebula żółta Cena za kg 14% 2 , 99 3,49 *',
  'pon. 16.11 – sob. 21.11 SOKOŁÓW Parówki Sokoliki Opak. 140 g (1 kg = 23,50) 4 19 , /szt. Cena regularna /najniższa cena sprzed pierwszej obniżki 21% PRZY ZAKUPIE 2 SZT. 3 , 29 /szt. ALL SEASONS Passata Rustica Butelka 690 g (1 kg = 7,23) do wyboru: klasyczna lub z ziołami *Najniższa cena z 30 dni przed obniżką. 26% 4 , 99 6,75 * ALL SEASONS Koncentrat pomidorowy Puszka 70 g (1 kg = 35,57) 2+2 GRATIS 2 , 49 /szt. cena regularna',
  'bez dat: Ziemniaki Cena za kg 50% 0 , 99 1,99 *',
];
const URL_ = 'https://gazetki.aldi.pl/2026/kw47/2026_cw47_mo_promotion_26k47g01_tu67/';
const now = new Date('2026-11-18T10:00:00Z');
const parse = (pages = PAGES) => parseLeafletTexts(pages, { source: 'https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html', leafletUrl: URL_, now });

test('Gazetka: ceny promocyjne z ceną sprzed obniżki i „AKCJA”, tylko produkty z katalogu', () => {
  const { offers } = parse();
  const got = Object.fromEntries(offers.map(o => [`${o.product}@${o.price}`, o]));
  for (const k of ['tomato@11.99', 'cucumber@6.99', 'potato@0.99', 'pepper@11.99', 'avocado@3.99', 'apple@2.49', 'onion@2.99', 'passata@4.99']) assert.ok(got[k], `brak ${k}: ${Object.keys(got)}`);
  assert.equal(got['tomato@11.99'].regularPrice, 17.99); assert.equal(got['tomato@11.99'].name, 'Pomidory malinowe'); assert.equal(got['tomato@11.99'].unit, 'Cena za kg');
  assert.equal(got['passata@4.99'].unit, 'Butelka 690 g (1 kg = 7,23)'); assert.equal(got['passata@4.99'].regularPrice, 6.75);
  assert.equal(got['apple@2.49'].regularPrice, undefined); assert.match(got['apple@2.49'].conditions, /AKCJA/);
  assert.ok(!offers.some(o => o.product === 'cabbage'), 'kapusta gołąbkowa ≠ kapusta biała');
  assert.ok(!offers.some(o => /Koncentrat|Parówki/.test(o.name)), 'promocje wielosztukowe są pomijane');
});

test('Gazetka: daty, strefa czasowa, kontrakt oferty i odnośnik do strony gazetki', () => {
  const { offers, range } = parse();
  assert.deepEqual(range, { from: '2026-11-16', until: '2026-11-21' });
  for (const o of offers) {
    assert.equal(o.from, '2026-11-16'); assert.equal(o.until, '2026-11-21'); assert.equal(o.validUntil, '2026-11-21T22:59:59.000Z');
    assert.ok(validAutomaticOffer(o), o.id); assert.ok(isDisplayableAutomaticOffer(o, now), o.id);
    assert.match(o.source, /^https:\/\/gazetki\.aldi\.pl\/.+#\/page\/\d+$/); assert.equal(o.scope.type, 'unverified'); assert.ok(o.id.length < 100);
  }
  // Strona bez dat dostaje okres gazetki.
  assert.ok(offers.some(o => o.source.endsWith('#/page/6') && o.product === 'potato'));
  // Bez żadnych dat nic nie jest publikowane.
  assert.equal(parse(['Ziemniaki Cena za kg 50% 0 , 99 1,99 *']).offers.length, 0);
  assert.equal(endOfMarketDay('2026-07-04'), '2026-07-04T21:59:59.000Z');
  assert.deepEqual(parseLeafletTexts(['pon. 28.12 – sob. 2.01 Ziemniaki Cena za kg 0 , 99 1,99 *'], { leafletUrl: 'https://gazetki.aldi.pl/2026/kw53/x/', now }).range, { from: '2026-12-28', until: '2027-01-02' });
});

test('Gazetka: nazwa przed jednostką, bez haseł reklamowych; cena wyższa od wcześniejszej odrzucona', () => {
  assert.deepEqual(nameAndUnit('WYGENEROWANO AI Pomidory malinowe Cena za kg klasa I'), { name: 'Pomidory malinowe', unit: 'Cena za kg' });
  assert.deepEqual(nameAndUnit('NOWA CENA REGULARNA PIĄTNICA Serek wiejski Opak. 200 g (1 kg = 12,45) *Najniższa'), { name: 'PIĄTNICA Serek wiejski', unit: 'Opak. 200 g (1 kg = 12,45)' });
  assert.equal(nameAndUnit('TANIEJ DO 20%'), null);
  assert.equal(parse(['pon. 16.11 – sob. 21.11 Ziemniaki Cena za kg 2 , 99 1,99 *']).offers.length, 0);
});

test('Gazetka: tekst stron z HTML iPaper, lista gazetek i tytuły', () => {
  const html = `<script>var x={"a":1,"pageTexts":["str 1","Pomidory \\"malinowe\\" ] [x"],"b":[1]};</script>`;
  assert.deepEqual(extractPageTexts(html), ['str 1', 'Pomidory "malinowe" ] [x']);
  assert.equal(extractPageTexts('<html></html>'), null);
  const list = '<a href="/gazetki/2026_cw47_mo_promotion_26k47g01.html">x</a><a href="https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html">y</a><a href="/gazetki/raport-marnowanie-zywnosci-2025.html">r</a><a href="/gazetki/24k32g07.html">old</a><a href="/gazetki/2026_cw47_mo_special_26k47g07_wykwintne-smaki.html">w</a>';
  assert.deepEqual(leafletPages(list), ['https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html', 'https://www.aldi.pl/gazetki/2026_cw47_mo_special_26k47g07_wykwintne-smaki.html']);
  // Linki w danych strony (JSON z ucieczką \/) i bez duplikatów z href.
  const json = '<script id="__NEXT_DATA__">{"link":"\\/gazetki\\/2026_cw47_mo_promotion_26k47g01.html","b":"https:\\/\\/www.aldi.pl\\/gazetki\\/2026_cw47_mo_special_26k47g07_wykwintne-smaki.html","c":"https://gazetki.aldi.pl/gazetki/x.html"}</script>';
  assert.deepEqual(leafletPages(json), ['https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html', 'https://www.aldi.pl/gazetki/2026_cw47_mo_special_26k47g07_wykwintne-smaki.html']);
  // Tak zapisuje je strona ALDI (18.11.2026): "reference":{"path":"/gazetki/…"} bez rozszerzenia.
  assert.deepEqual(leafletPages('{"reference":{"type":"pages","path":"/gazetki/2026_cw47_mo_promotion_26k47g01"},"x":"/gazetki/24k32g07","img":"kafle-gazetki/26KW47_gazetki_all_01.jpg"}'), ['https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html']);
  assert.equal(ipaperUrl('{"link":"https:\\/\\/gazetki.aldi.pl\\/2026\\/kw47\\/2026_cw47_mo_promotion_26k47g01_tu67\\/"}'), URL_);
  assert.equal(leafletTitle('https://www.aldi.pl/gazetki/2026_cw47_mo_special_26k47g07_wykwintne-smaki.html'), 'Wykwintne smaki');
  assert.equal(leafletTitle('https://www.aldi.pl/gazetki/2026_cw47_mo_promotion_26k47g01.html'), 'Gazetka tygodniowa');
  assert.equal(leafletTitle('https://www.aldi.pl/gazetki/2026_cw47_we_promotion_non-food_26k47g02.html'), 'Artykuły przemysłowe i tekstylia');
  assert.equal(leafletTitle('https://www.aldi.pl/gazetki/2026_cw47_th_promotion_weekend_26k47g03.html'), 'Okazje na weekend');
  assert.equal(leafletTitle('https://www.aldi.pl/gazetki/2026_cw38_mo_special_26k38g07_ceny-w-dol.html'), 'Ceny w dół');
  assert.ok(!isFoodLeaflet('https://www.aldi.pl/gazetki/2026_cw44_mo_special_26k44g07_zabawki.html'));
  assert.deepEqual(leafletYearWeek(URL_), { year: 2026, week: 47 });
});

test('Gazetka: zniekształcony tekst z grafik nie trafia do nazw; stare gazetki bez dat są ukrywane', () => {
  const { offers } = parse(['pon. 16.11 – sob. 21.11 Kapusta Cena za kg 16% 4 , 99 5,99 * p w opar k o od w u a k n t iu Cebula żółta Cena za kg 14% 2 , 99 3,49 *']);
  assert.equal(offers.find(o => o.product === 'onion')?.name, 'Cebula żółta');
  const now = new Date('2026-11-18T10:00:00Z');
  assert.ok(isRecentLeaflet('https://www.aldi.pl/gazetki/2026_cw38_mo_special_26k38g07_ceny-w-dol.html', null, now));
  assert.ok(!isRecentLeaflet('https://www.aldi.pl/gazetki/2026_cw09_mo_special_26k09g07_katalog_ogrodowy.html', null, now));
  assert.ok(isRecentLeaflet('x', { until: '2026-11-21' }, now)); assert.ok(!isRecentLeaflet('x', { until: '2026-11-14' }, now));
  assert.ok(!isFoodLeaflet('https://www.aldi.pl/gazetki/2026_cw09_mo_special_26k09g07_katalog_ogrodowy.html'));
});
