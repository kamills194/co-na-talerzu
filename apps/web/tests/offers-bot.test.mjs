import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAldi, aldiDeal, extraSources } from '../scripts/offer-parser.mjs';
import { validAutomaticOffer } from '../src/domain.js';

// Fixture shaped like www.aldi.pl/oferty.html (CNT-040 diagnostic run, 17.11.2026): products are
// JSON text inside pageProps.apiData, most deals are multi-buy tags without a strike price.
const from=1794783600, until=1795301999, now=new Date((from+3600)*1000);
const tag=(price,promo,info)=>({priceValue:price,priceTagLabels:{promoText1:promo},basePrice:info?[{basePriceAdditionalInformation:info}]:[],validFrom:from,validUntil:until});
const items=[
  {objectID:'497',name:'Masło ekstra',salesUnit:'Opak. 200 g',shortDescription:'Limit: 6 szt. na klienta.\n\nzawartość tłuszczu: 83%',promotionPrices:[tag(3.99,'-33% PRZY ZAKUPIE 2 SZT.','CENA PRZY ZAKUPIE 2 SZT. / Cena regularna: 5,99 zł/szt. (kg=29,95 zł)')]},
  {objectID:'3059',name:'Jaja z wolnego wybiegu L',salesUnit:'Opak. 10 szt.',promotionPrices:[tag(6.49,'-50% CO DRUGA SZT.','CENA REGULARNA: 12,99 zł/szt. (szt.=1,30 zł)')]},
  {objectID:'3791',name:'Pomidory malinowe',salesUnit:'Cena za kg',currentPrice:{priceValue:11.99,strikePrice:{strikePriceValue:17.99},priceTagLabels:{promoText1:'33% TANIEJ'},validFrom:from,validUntil:until}},
  {objectID:'777',name:'Miód polski',salesUnit:'Słoik 400 g',promotionPrices:[tag(17.99,'1+1 GRATIS','CENA REGULARNA: 17,99 zł/szt.')]},
  {objectID:'888',name:'Oliwa z oliwek z przyprawami',salesUnit:'Butelka',promotionPrices:[tag(22.99,'AKCJA',null)]},
  {objectID:'999',name:'Rękawice kuchenne',salesUnit:'Zestaw',currentPrice:{priceValue:17.99,validFrom:from,validUntil:until}},
];
const html=`<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{pageProps:{apiData:JSON.stringify({results:[{hits:items}]})}}})}</script></html>`;

test('Bot czyta produkty zapisane jako tekst JSON na stronie ofert tygodnia',()=>{
  const r=parseAldi(html,{source:'https://www.aldi.pl/oferty.html',now});
  assert.equal(r.productsSeen,6);
  const byProduct=Object.fromEntries(r.offers.map(o=>[o.product,o]));
  assert.deepEqual(Object.keys(byProduct).sort(),['butter','egg','tomato']);
  for(const o of r.offers) assert.ok(validAutomaticOffer(o),o.id);
});
test('Promocje wielosztukowe: cena średnia przy spełnieniu warunku, warunek i limit zawsze podane',()=>{
  const b=aldiDeal(items[0].promotionPrices[0],items[0]);
  assert.deepEqual([b.price,b.regular],[3.99,5.99]); assert.match(b.conditions,/przy zakupie 2 szt\./i); assert.match(b.conditions,/Limit: 6 szt\. na klienta/);
  const e=aldiDeal(items[1].promotionPrices[0],items[1]);
  assert.deepEqual([e.price,e.regular],[9.74,12.99]); assert.match(e.conditions,/druga za 6,49 zł/);
  const h=aldiDeal(items[3].promotionPrices[0],items[3]);
  assert.deepEqual([h.price,h.regular],[8.99,17.99]); assert.match(h.conditions,/1\+1 gratis/);
  assert.deepEqual([aldiDeal({priceValue:6,priceTagLabels:{promoText1:'2+2 GRATIS'},basePrice:[{basePriceAdditionalInformation:'CENA REGULARNA: 7,99 zł/szt.'}]}).price],[4]);
});
test('Bez obniżki nie ma oferty: „AKCJA”, brak ceny regularnej, cena wyższa niż regularna',()=>{
  assert.equal(aldiDeal(items[4].promotionPrices[0],items[4]),null);
  assert.equal(aldiDeal(items[5].currentPrice,items[5]),null);
  assert.equal(aldiDeal({priceValue:7,priceTagLabels:{promoText1:'-10% PRZY ZAKUPIE 2 SZT.'},basePrice:[{basePriceAdditionalInformation:'Cena regularna: 6,99 zł/szt.'}]}),null);
  assert.equal(aldiDeal({priceValue:0}),null);
});
test('Oferta przed startem lub po końcu nie jest publikowana',()=>{
  assert.equal(parseAldi(html,{source:'x',now:new Date((from-10)*1000)}).offers.length,0);
  assert.equal(parseAldi(html,{source:'x',now:new Date((until+10)*1000)}).offers.length,0);
});
test('Dodatkowe źródła: tylko /produkty/… i /oferty.html na www.aldi.pl przez https',()=>{
  assert.deepEqual(extraSources(['https://www.aldi.pl/oferty.html']),['https://www.aldi.pl/oferty.html']);
  assert.throws(()=>extraSources(['https://www.aldi.pl/gazetki.html']));
  assert.throws(()=>extraSources(['http://www.aldi.pl/oferty.html']));
});
