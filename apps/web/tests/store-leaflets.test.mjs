// CNT-042: okresy gazetek sieci sklepów — fragmenty w formacie stron sklepów z 18.11.2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lidlStart, parseRange, lidlList, lidlFlyer, kaufland, carrefour, biedronka, textCards, mainLeaflet, tidyTitle } from '../scripts/store-leaflets.mjs';
import { STORES } from '../src/stores.js';
const now = new Date('2026-11-18T09:00:00Z');

test('Okres z tekstu w formatach sklepów', () => {
  assert.deepEqual(parseRange('Oferta obowiązuje od 16.11 do 21.11.2026 r. lub do wyczerpania zapasów.', now), { from: '2026-11-16', until: '2026-11-21' });
  assert.deepEqual(parseRange('Oferta ważna od 18.11 do 24.11', now), { from: '2026-11-18', until: '2026-11-24' });
  assert.deepEqual(parseRange('Oferta ważna od 12 do 18.11', now), { from: '2026-11-12', until: '2026-11-18' });
  assert.deepEqual(parseRange('Oferta ważna od 28 do 3.12', now), { from: '2026-11-28', until: '2026-12-03' });
  assert.deepEqual(parseRange('OD 10-11-2026 DO 2-12-2026', now), { from: '2026-11-10', until: '2026-12-02' });
  assert.deepEqual(parseRange('Oferta handlowa ważna od 16 listopada 2026 do 21 listopada 2026', now), { from: '2026-11-16', until: '2026-11-21' });
  assert.deepEqual(parseRange('Oferta obowiązuje do 30.11.2026 r.', now), { until: '2026-11-30' });
  assert.deepEqual(parseRange('od 29.12 do 3.01', new Date('2026-12-30T10:00:00Z')), { from: '2026-12-29', until: '2027-01-03' });
  assert.equal(parseRange('Regulamin akcji kuponowej na niedzielę 28.06.2026', now), null);
  assert.equal(parseRange('od 21.11 do 16.11.2026', now), null, 'koniec przed początkiem');
});

test('Lidl: lista gazetek i okres z API', () => {
  const html = '<a href="https://www.lidl.pl/l/pl/gazetki/gazetka-16-11-pon-kw47/ar/0?_ab=1" target="_self" class="flyer" id="f1"> <div class="flyer__image_wrapper"><img src="x.jpg"/></div> <div class="flyer__content"> <div class="flyer__name"> Gazetka </div> <span class="flyer__title"> 16.11 </span> </div></a>'
    + '<a href="https://www.lidl.pl/l/pl/gazetki/gazetka-16-11-katalog-kw47/ar/0?_ab=1" class="flyer"><div class="flyer__name"> Katalog </div> <span class="flyer__title"> 16.11 </span></a>';
  assert.deepEqual(lidlList(html), [{ id: 'gazetka-16-11-pon-kw47', url: 'https://www.lidl.pl/l/pl/gazetki/gazetka-16-11-pon-kw47/ar/0', title: 'Gazetka 16.11' }, { id: 'gazetka-16-11-katalog-kw47', url: 'https://www.lidl.pl/l/pl/gazetki/gazetka-16-11-katalog-kw47/ar/0', title: 'Katalog 16.11' }]);
  assert.deepEqual(lidlFlyer({ success: true, flyer: { name: 'Gazetka', offerStartDate: '2026-11-16', offerEndDate: '2026-11-18', startDate: '2026-11-15', endDate: '2026-11-18' } }), { from: '2026-11-16', until: '2026-11-18', name: 'Gazetka' });
  assert.equal(lidlFlyer({ success: false }), null);
});

test('Kaufland, Carrefour, Biedronka', () => {
  const k = '<a href="https://assets.leaflets.schwarz/leaflets/pdfs/01a1/Gazetka-tygodnia-19-11-2026-25-11-2026-00.pdf">pdf</a> <a href="https://leaflets.kaufland.com/pl-PL/PL_pl_KDZ_1060_PL47-LFT/ar/1060">Zobacz</a>'
    + '<a href="https://assets.leaflets.schwarz/leaflets/pdfs/01a2/Gazetka-tygodnia-12-11-2026-18-11-2026-00.pdf">pdf</a> <a href="https://leaflets.kaufland.com/pl-PL/PL_pl_KDZ_1060_PL46-LFT/ar/1060">Zobacz</a>';
  assert.deepEqual(kaufland(k).map(x => [x.title, x.from, x.until]), [['Gazetka tygodnia', '2026-11-19', '2026-11-25'], ['Gazetka tygodnia', '2026-11-12', '2026-11-18']]);
  const c = '{"items":[{"publishStatus":"PUBLIC","dateTo":1795301940000,"name":"Gazetka Carrefour, Market w SUMIE najlepszy, od poniedziałku","displayName":"x","alcohol":false,"dateFrom":1794783600000,"images":[{"name":"a.jpg","width":935,"height":1559}],"defaultImage":{"name":"a.jpg","width":935,"height":1559},"id":"331","uuid":"7202"},{"publishStatus":"PUBLIC","dateTo":1795906740000,"name":"Gazetka Carrefour Prezenty","displayName":"x","alcohol":false,"dateFrom":1794178800000,"images":[],"defaultImage":{"name":"b.jpg","width":1,"height":1},"id":"330","uuid":"7189"}]}';
  assert.deepEqual(carrefour(c, now)[0], { title: 'Market w SUMIE najlepszy, od poniedziałku', url: 'https://www.carrefour.pl/gazetka-handlowa/7202', from: '2026-11-16', until: '2026-11-21' });
  const b = '<div class="adwrapper" data-slot-id="2026_T47A_W_TYM_TYGODNI" data-slot-type="gazetka"> <a class="page-slot-columns" href="https://www.biedronka.pl/pl/press,id,j35d8zcvl,title,codziennie-niskie-ceny-p-oferta-od-16-11#page=1" target="_self">'
    + '<div class="adwrapper" data-slot-id="2026_T47_FESTIWAL_WEDLIN" > <a class="page-slot-columns" href="https://www.biedronka.pl/pl/press,id,j357ufbbx,title,festiwal-wdlin-od-17-11" target="_self">';
  assert.deepEqual(biedronka(b, now), [{ title: 'Codziennie niskie ceny', url: 'https://www.biedronka.pl/pl/press,id,j35d8zcvl,title,codziennie-niskie-ceny-p-oferta-od-16-11', from: '2026-11-16' }]);
});

test('Tekst strony: Netto, Dino, Intermarché, Stokrotka', () => {
  const netto = '<h3 class="text-heading-3xl">OD PONIEDZIAŁKU W SKLEPACH</h3><span class="t">Każdy tydzień to nowe okazje w sklepach Netto. Oferta obowiązuje od 16.11 do 21.11.2026 r. lub do wyczerpania zapasów. </span>';
  assert.deepEqual(textCards(netto, { base: 'https://netto.pl/gazetka-netto/', link: /netto\.pl\/gazetka-netto\/./, now }), [{ title: 'Od poniedziałku w sklepach', url: 'https://netto.pl/gazetka-netto/', from: '2026-11-16', until: '2026-11-21' }]);
  const dino = '<div class="text-base font-semibold md:text-xl">Gazetka 47 / 2026</div><div class="mt-1 text-xs font-medium"><!--[-->Oferta ważna od 18.11 do 24.11<!--]--></div>';
  assert.deepEqual(textCards(dino, { base: 'https://marketdino.pl/gazetki/lista/standard', link: /marketdino\.pl\/gazetki\/(?!lista)/, now })[0], { title: 'Gazetka 47 / 2026', url: 'https://marketdino.pl/gazetki/lista/standard', from: '2026-11-18', until: '2026-11-24' });
  const itm = '<a href="https://intermarche.pl/g/gazetka-promocyjna-od-12-18-11/"><img src="a.jpg" alt="" /></a> <h3><a href="https://intermarche.pl/g/gazetka-promocyjna-od-12-18-11/">Gazetka promocyjna od 12 do 18.11</a></h3> <span> Oferta ważna od 12 do 18.11 </span> <a href="https://intermarche.pl/g/swiezy-hit-53/"><img/></a> <h3><a href="https://intermarche.pl/g/swiezy-hit-53/">Świeży Hit</a></h3> <span> Oferta ważna od 12 do 18.11 </span>';
  const r = textCards(itm, { base: 'https://intermarche.pl/gazetki-promocyjne/', link: /intermarche\.pl\/g\//, now });
  assert.equal(r.length, 2); assert.equal(r[1].title, 'Świeży Hit'); assert.equal(r[1].url, 'https://intermarche.pl/g/swiezy-hit-53/'); assert.equal(r[0].from, '2026-11-12');
  const stok = '<a href="https://stokrotka.pl/oferta/gazetki-promocyjne/supermarket-1470.html" title="Supermarket" class="NAME"> <span class="cbp">Supermarket</span></a> <a title="Supermarket" href="https://stokrotka.pl/oferta/gazetki-promocyjne/supermarket-1470.html"> <p class="valid-date">AKTUALNA GAZETKA </p> <p class="valid-date">OD 10-11-2026 DO 18-11-2026</p></a>';
  assert.deepEqual(textCards(stok, { base: 'https://stokrotka.pl/oferta/gazetki-promocyjne/', link: /gazetki-promocyjne\/[a-z0-9-]+\.html/, now }), [{ title: 'Supermarket', url: 'https://stokrotka.pl/oferta/gazetki-promocyjne/supermarket-1470.html', from: '2026-11-10', until: '2026-11-18' }]);
});

test('Gazetka na kafelek: aktualna, najkrótsza (tygodniowa), spożywcza; inaczej najbliższa przyszła', () => {
  const list = [
    { title: 'Gazetka tygodnia', url: 'a', from: '2026-11-19', until: '2026-11-25' },
    { title: 'Gazetka', url: 'b', from: '2026-11-12', until: '2026-11-25' },
    { title: 'Gazetka tygodnia', url: 'c', from: '2026-11-12', until: '2026-11-18' },
    { title: 'Katalog zabawek', url: 'd', from: '2026-11-01', until: '2026-11-19' },
  ];
  assert.equal(mainLeaflet(list, now).url, 'c');
  assert.equal(mainLeaflet(list.slice(0, 1), now).url, 'a', 'przyszła, gdy brak aktualnej');
  // Kaufland 18.11.2026: „Mocny Start” 16–18.11 jest krótsza, ale na kafelek idzie „Gazetka tygodnia” 12–18.11.
  assert.equal(mainLeaflet([{ title: 'Mocny Start', url: 'm', from: '2026-11-16', until: '2026-11-18' }, { title: 'Gazetka tygodnia', url: 'g', from: '2026-11-12', until: '2026-11-18' }], now).url, 'g');
  assert.equal(lidlStart('Gazetka 16.11', now), '2026-11-16'); assert.equal(lidlStart('Katalog zabawek', now), null);
  assert.equal(mainLeaflet([{ title: 'Codziennie niskie ceny', url: 'e', from: '2026-11-16' }], now).url, 'e');
  assert.equal(mainLeaflet([{ title: 'Stara', url: 'f', from: '2026-11-01', until: '2026-11-07' }], now), null);
  assert.equal(tidyTitle('Gazetka Carrefour, Market ACT FOR FOOD'), 'Market ACT FOR FOOD');
});

test('Sklepy: komplet danych, kontrast nazwy na tle koloru', () => {
  const lum = hex => { const c = hex.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  for (const s of STORES) {
    assert.ok(s.id && s.name && /^https:\/\//.test(s.url), s.id);
    const [a, b] = [lum(s.color), lum(s.ink)].sort((x, y) => y - x);
    assert.ok((a + 0.05) / (b + 0.05) >= 4.5, `${s.name}: kontrast ${((a + 0.05) / (b + 0.05)).toFixed(2)}`);
  }
});
