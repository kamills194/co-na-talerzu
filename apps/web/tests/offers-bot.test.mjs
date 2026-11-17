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

// ---------- CNT-041: wszystkie bieżące promocje spożywcze („deals”) do widoku sklepu ----------
import { aldiProductUrl, ALDI_PRODUCT_URL_VERIFIED, dealCategory, departmentOf, isFoodCategory } from '../scripts/offer-parser.mjs';
import { validDeal, isDisplayableDeal } from '../src/domain.js';
const cat=name=>({hierarchicalCategories:{lvl0:[name],lvl1:[`${name} > Coś`]}});
const strike=(price,was)=>({priceValue:price,strikePrice:{strikePriceValue:was},priceTagLabels:{promoText1:'TANIEJ'},validFrom:from,validUntil:until});
const dealItems=[
  {objectID:'497',name:'Masło ekstra',productSlug:'maslo-ekstra-497',salesUnit:'Opak. 200 g',...cat('Nabiał i jaja'),promotionPrices:[tag(3.99,'-33% PRZY ZAKUPIE 2 SZT.','Cena regularna: 5,99 zł/szt.')]},
  {objectID:'5001',name:'Czekolada mleczna z orzechami',productSlug:'czekolada-5001',salesUnit:'100 g',...cat('Słodycze i przekąski'),currentPrice:strike(2.99,4.49)}, // brak produktu w przepisach
  {objectID:'5002',name:'Patelnia 28 cm',productSlug:'patelnia-5002',salesUnit:'szt.',...cat('Dom i ogród'),currentPrice:strike(39.99,59.99)},
  {objectID:'5003',name:'Karma dla kota',salesUnit:'400 g',...cat('Artykuły dla zwierząt'),currentPrice:strike(3.49,4.99)},
  {objectID:'5004',name:'Szampon',salesUnit:'250 ml',hierarchicalCategories:{lvl0:'Kosmetyki i higiena'},currentPrice:strike(7.99,9.99)},
  {objectID:'5005',name:'Pomarańcze',productSlug:'Pomarancze_5005',salesUnit:'Cena za kg',currentPrice:strike(4.99,6.99)}, // bez kategorii → dział ze źródła
  {objectID:'5006',name:'Banany <img src=x onerror=alert(1)>',productSlug:'../../evil',salesUnit:'Cena za kg',currentPrice:{priceValue:5.99,validFrom:from,validUntil:until}}, // bez obniżki
];
const page=hits=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{pageProps:{hits}}}).replace(/</g,'\\u003c')}</script>`;
const fruitSource='https://www.aldi.pl/produkty/owoce-i-warzywa/owoce.html';

test('Deals: wszystkie bieżące obniżki spożywcze, nie tylko dopasowane do przepisów; kontrakt validDeal',()=>{
  const r=parseAldi(page(dealItems),{source:fruitSource,now});
  assert.deepEqual(r.offers.map(o=>o.product).sort(),['butter','orange'],'oferty do przepisów bez zmian');
  assert.deepEqual(r.deals.map(d=>d.name),['Masło ekstra','Czekolada mleczna z orzechami','Pomarańcze']);
  for(const d of r.deals){
    assert.ok(validDeal(d),d.id);assert.ok(isDisplayableDeal(d,now),d.id);
    assert.deepEqual(Object.keys(d).sort(),['category','conditions','currency','fetchedAt','from','id','name','price','regularPrice','store','unit','until','url','validUntil']);
    assert.equal(d.store,'ALDI');assert.equal(d.currency,'PLN');assert.equal(d.fetchedAt,now.toISOString());
  }
  const [butter,choco,orange]=r.deals;
  assert.equal(butter.category,'Nabiał i jaja');assert.equal(choco.category,'Słodycze i przekąski');
  assert.equal(orange.category,'Owoce i warzywa','bez kategorii: nazwa działu z adresu źródła');
  assert.deepEqual([butter.price,butter.regularPrice],[3.99,5.99]);assert.match(butter.conditions,/przy zakupie 2 szt\./i);
  assert.deepEqual([choco.price,choco.regularPrice,choco.from,choco.until],[2.99,4.49,'2026-11-16','2026-11-21']);
  assert.equal(butter.id,r.offers.find(o=>o.product==='butter').id,'ten sam identyfikator co oferta');
  // Na stronie ofert tygodnia bez kategorii i bez działu → „Inne”.
  assert.equal(parseAldi(page([dealItems[5]]),{source:'https://www.aldi.pl/oferty.html',now}).deals[0].category,'Inne');
  // Poza oknem ważności nic.
  assert.equal(parseAldi(page(dealItems),{source:fruitSource,now:new Date((until+10)*1000)}).deals.length,0);
});
test('Deals: artykuły nieżywnościowe pomijane (lista słów w kategorii)',()=>{
  for(const c of ['Dom i ogród','Dom','Odzież i obuwie','Zabawki','Chemia gospodarcza','Kosmetyki i higiena','Artykuły dla zwierząt','Elektronika','Zwierzęta','Higiena osobista','Ogród'])assert.equal(isFoodCategory(c),false,c);
  for(const c of ['Nabiał i jaja','Owoce i warzywa','Domowe wypieki','Mięso','Słodycze i przekąski','Inne','Pieczywo'])assert.equal(isFoodCategory(c),true,c);
  const names=parseAldi(page(dealItems),{source:fruitSource,now}).deals.map(d=>d.name).join('|');
  assert.ok(!/Patelnia|Karma|Szampon/.test(names),names);
  assert.equal(dealCategory({hierarchicalCategories:{lvl0:['  ']}},fruitSource),'Owoce i warzywa');
  assert.equal(departmentOf('https://www.aldi.pl/produkty/sosy--dressingi-i-przeciery/pesto.html'),'Sosy, dressingi i przeciery');
  assert.equal(departmentOf('https://www.aldi.pl/produkty/nowy-dzial/x.html'),'Nowy dzial');assert.equal(departmentOf('nie-url'),null);
});
test('Deals: adres produktu tylko ze sluga [a-z0-9-] i dopiero po weryfikacji wzoru; dziś zawsze null',()=>{
  assert.equal(ALDI_PRODUCT_URL_VERIFIED,false,'wzór adresu strony produktu nie jest zweryfikowany');
  for(const d of parseAldi(page(dealItems),{source:fruitSource,now}).deals)assert.equal(d.url,null,d.id);
  assert.equal(aldiProductUrl('maslo-ekstra-497'),null);
  assert.equal(aldiProductUrl('maslo-ekstra-497',{verified:true}),'https://www.aldi.pl/produkty/maslo-ekstra-497.html');
  for(const bad of ['Pomarancze_5005','../../evil','a b','maslo/1','',undefined,null,42,'x'.repeat(201),'ą-ę'])assert.equal(aldiProductUrl(bad,{verified:true}),null,String(bad));
  // Gdyby wzór był zweryfikowany, wynik przechodzi kontrakt (https, bez znaków HTML).
  const d=parseAldi(page(dealItems),{source:fruitSource,now}).deals[0];
  assert.ok(validDeal({...d,url:aldiProductUrl('maslo-ekstra-497',{verified:true})}));
});
