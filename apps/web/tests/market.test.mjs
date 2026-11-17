// CNT-016 / CNT-018: rynek oddzielony od języka UI, kontrakt oferty, granice ważności.
// Wszystkie chwile są stałe; strefa urządzenia jest ustawiana jawnie w procesie potomnym.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { recipes } from '../src/recipes.pl.js';
import { locale as uiLocale, messages } from '../src/i18n.js';
import { market, markets, marketDate, formatCurrency, currencySymbol, formatMarketDay, formatMarketDateTime } from '../src/market.js';
import { validOffer, matchingOffers, isOfferExpired, validScope, validAutomaticOffer, isCurrentAutomaticOffer, isDisplayableAutomaticOffer } from '../src/domain.js';
import { emptyState, validateState, load, save, KEY } from '../src/storage.js';
import { parseAldi } from '../scripts/offer-parser.mjs';

const url=p=>new URL(p,import.meta.url).href;
const plain=s=>s.replace(/[  ]/g,' ');
// Runs an ES module snippet with a chosen device time zone and returns its JSON output.
function inZone(TZ,code) {
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,TZ}});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const deviceZones=['UTC','America/Los_Angeles','Pacific/Kiritimati','Europe/Warsaw'];

// ---------- A. Rynek ----------
test('Rynek: aktywna jest wyłącznie Polska, bez atrap DE/GB',()=>{
  assert.deepEqual({...market},{id:'PL',locale:'pl-PL',currency:'PLN',timeZone:'Europe/Warsaw',units:'metric'});
  assert.deepEqual(Object.keys(markets),['PL']);
  assert.equal(markets.PL,market);
  assert.ok(Object.isFrozen(markets)&&Object.isFrozen(market));
});
test('Rynek, język UI i waluta to osobne pojęcia w kodzie',async()=>{
  assert.equal(typeof uiLocale,'string');
  const i18n=await readFile(new URL('../src/i18n.js',import.meta.url),'utf8');
  assert.ok(!/market\.js/.test(i18n),'słownik UI nie zależy od rynku');
  // Waluta oferty i język formatowania są niezależnymi parametrami.
  assert.equal(plain(formatCurrency(1.5,{currency:'PLN',locale:'en-GB'})),'PLN 1.50');
  assert.equal(plain(formatCurrency(1.5,{currency:'EUR',locale:'pl-PL'})),'1,50 €');
});
test('Waluta: formatowanie przez Intl z walutą rynku, bez sztywnego „zł” w widoku',async()=>{
  assert.equal(plain(formatCurrency(0.99)),'0,99 zł');
  assert.equal(plain(formatCurrency(1299)),'1299,00 zł');
  assert.equal(plain(formatCurrency(12999.5)),'12 999,50 zł');
  assert.equal(currencySymbol(),'zł');
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  assert.ok(!/\bzł\b/.test(app),'app.js nie zawiera wpisanej na stałe waluty');
  assert.ok(!/\(zł\)/.test(messages.price),'etykieta ceny nie zawiera waluty na stałe');
});
const boundaries=[
  ['2026-11-15T22:59:59.999Z','2026-11-15'],['2026-11-15T23:00:00.000Z','2026-11-16'], // zima, UTC+1
  ['2026-07-01T21:59:59.999Z','2026-07-01'],['2026-07-01T22:00:00.000Z','2026-07-02'], // lato, UTC+2
  ['2026-03-28T22:59:59.999Z','2026-03-28'],['2026-03-28T23:00:00.000Z','2026-03-29'], // noc zmiany na czas letni
  ['2026-03-29T21:59:59.999Z','2026-03-29'],['2026-03-29T22:00:00.000Z','2026-03-30'], // doba 23-godzinna
  ['2026-10-24T21:59:59.999Z','2026-10-24'],['2026-10-24T22:00:00.000Z','2026-10-25'], // noc zmiany na czas zimowy
  ['2026-10-25T22:59:59.999Z','2026-10-25'],['2026-10-25T23:00:00.000Z','2026-10-26'], // doba 25-godzinna
  ['2026-12-31T22:59:59.999Z','2026-12-31'],['2026-12-31T23:00:00.000Z','2027-01-01'],
];
test('marketDate: dzień kalendarzowy w Europe/Warsaw, także przy zmianie czasu',()=>{
  for(const [iso,day] of boundaries) assert.equal(marketDate(new Date(iso)),day,iso);
  assert.throws(()=>marketDate(new Date('x')),RangeError);
  assert.throws(()=>marketDate('2026-11-15'),RangeError);
});
test('marketDate nie zależy od strefy urządzenia; localDate pozostaje dniem urządzenia',()=>{
  const code=`import {marketDate} from ${JSON.stringify(url('../src/market.js'))};import {localDate} from ${JSON.stringify(url('../src/domain.js'))};
    const b=${JSON.stringify(boundaries.map(b=>b[0]))};console.log(JSON.stringify({market:b.map(i=>marketDate(new Date(i))),device:localDate(new Date('2026-11-15T23:30:00Z')),compat:localDate(new Date(2026,10,15,23))}));`;
  const device={UTC:'2026-11-15','America/Los_Angeles':'2026-11-15','Pacific/Kiritimati':'2026-11-16','Europe/Warsaw':'2026-11-16'};
  for(const tz of deviceZones){const out=inZone(tz,code);assert.deepEqual(out.market,boundaries.map(b=>b[1]),tz);assert.equal(out.device,device[tz],tz);assert.equal(out.compat,'2026-11-15',tz);}
});
test('Formatowanie dat do wyświetlenia: dzień oferty i chwila odczytu w strefie rynku',()=>{
  assert.equal(formatMarketDay('2026-11-15','pl-PL'),'15 lis 2026');
  assert.equal(formatMarketDay('<b>','pl-PL'),'<b>'); // zwracane bez zmian; widok i tak stosuje esc()
  assert.equal(plain(formatMarketDateTime('2026-11-15T23:21:43.185Z','pl-PL')),'16 lis 2026, 00:21');
  assert.equal(formatMarketDateTime('brak','pl-PL'),'brak');
});

// ---------- B. Kontrakt oferty ----------
const now=new Date('2026-11-15T12:00:00Z');
const epoch=iso=>Date.parse(iso)/1000;
const aldiItem={objectID:'1',name:'Pomidory malinowe',salesUnit:'Cena za kg',currentPrice:{priceValue:0.99,strikePrice:{strikePriceValue:1299},priceTagLabels:{promoText1:'Z kartą'},validFrom:epoch('2026-11-13T23:00:00Z'),validUntil:epoch('2026-11-15T22:59:59Z')}};
const html=items=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{items}})}</script>`;
const parse=(item=aldiItem,at=now)=>parseAldi(html([item]),{source:'https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html',now:at}).offers;
const auto=parse()[0];
test('Adapter ALDI: rekord ma rynek, walutę, uczciwy zasięg, jednostkę, warunki i okres',()=>{
  assert.equal(parse().length,1);
  assert.equal(auto.market,'PL');assert.equal(auto.currency,'PLN');
  assert.deepEqual(auto.scope,{type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'});
  assert.notEqual(auto.scope.type,'nationwide');assert.equal(auto.scope.regions,undefined);
  assert.equal(auto.store,'ALDI');assert.equal(auto.price,0.99);assert.equal(auto.regularPrice,1299);
  assert.equal(auto.unit,'Cena za kg');assert.equal(auto.conditions,'Z kartą');
  // Granice dnia liczone w strefie rynku: 23:00Z 13.11 to już 14.11 w Warszawie; koniec 23:59:59 czasu polskiego.
  assert.equal(auto.from,'2026-11-14');assert.equal(auto.until,'2026-11-15');assert.equal(auto.validUntil,'2026-11-15T22:59:59.000Z');
  assert.equal(auto.fetchedAt,now.toISOString());assert.match(auto.source,/^https:\/\/www\.aldi\.pl\//);
  assert.ok(validAutomaticOffer(auto));assert.ok(isDisplayableAutomaticOffer(auto,now));
});
test('Adapter ALDI: brak jednostki lub warunków daje jawny tekst zastępczy, nie pustą wartość',()=>{
  const [o]=parse({...aldiItem,salesUnit:undefined,currentPrice:{...aldiItem.currentPrice,priceTagLabels:undefined}});
  assert.equal(o.unit,'Sprawdź jednostkę w źródle');assert.equal(o.conditions,'Sprawdź warunki w sklepie');assert.ok(validAutomaticOffer(o));
  const [blank]=parse({...aldiItem,salesUnit:'   ',currentPrice:{...aldiItem.currentPrice,priceTagLabels:{a:' ',b:5}}});
  assert.equal(blank.unit,'Sprawdź jednostkę w źródle');assert.equal(blank.conditions,'Sprawdź warunki w sklepie');
});
test('Adapter ALDI wynik nie zależy od strefy urządzenia',()=>{
  const code=`import {parseAldi} from ${JSON.stringify(url('../scripts/offer-parser.mjs'))};
    const o=parseAldi(${JSON.stringify(html([aldiItem]))},{source:'https://www.aldi.pl/',now:new Date(${JSON.stringify(now.toISOString())})}).offers[0];console.log(JSON.stringify([o.from,o.until]));`;
  for(const tz of deviceZones)assert.deepEqual(inZone(tz,code),['2026-11-14','2026-11-15'],tz);
});
test('Oferta automatyczna bez daty, ceny, jednostki, warunków, zasięgu, waluty lub rynku nie jest pokazywana',()=>{
  const without=k=>{const c={...auto};delete c[k];return c;};
  for(const k of ['price','until','from','validUntil','fetchedAt','unit','conditions','scope','currency','market','name','source','store','product','id']){
    assert.ok(!validAutomaticOffer(without(k)),k);assert.ok(!isDisplayableAutomaticOffer(without(k),now),k);
  }
  for(const patch of [{unit:''},{unit:'  '},{conditions:''},{conditions:null},{price:0},{price:NaN},{price:'0.99'},{currency:'EUR'},{currency:'zł'},{market:'DE'},{market:'GB'},{until:'2026-02-30'},{from:'2026-11-16'},{from:'14.11.2026'},{until:'2026-11-16'},{validUntil:'jutro'},{fetchedAt:'wczoraj'},{fetchedAt:1794700000000},{scope:null},{scope:'PL'},{scope:[]},{scope:{}},{name:''}])
    assert.ok(!validAutomaticOffer({...auto,...patch}),JSON.stringify(patch));
  assert.ok(!validAutomaticOffer(null));assert.ok(!validAutomaticOffer(undefined));assert.ok(!isDisplayableAutomaticOffer(undefined,now));
});
test('Zasięg: jawnie ogólnopolski, jawne regiony albo niepotwierdzony — nigdy domyślny',()=>{
  assert.ok(validScope({type:'nationwide'}));assert.ok(validScope({type:'nationwide',note:'Według gazetki ogólnopolskiej'}));
  assert.ok(validScope({type:'region',regions:['mazowieckie','Kraków']}));
  assert.ok(validScope({type:'unverified',note:'Zasięg niepotwierdzony'}));
  for(const bad of [undefined,null,'nationwide',{},{type:'region'},{type:'region',regions:[]},{type:'region',regions:['']},{type:'region',regions:'mazowieckie'},{type:'region',regions:[5]},{type:'unverified'},{type:'unverified',note:' '},{type:'nationwide',note:''},{type:'PL'},{type:'local'},['region']])
    assert.ok(!validScope(bad),JSON.stringify(bad));
  assert.ok(validAutomaticOffer({...auto,scope:{type:'region',regions:['mazowieckie']}}));
});
test('Rekordy z poprzedniego formatu offers.json (bez zasięgu i waluty) nie są wyświetlane',async()=>{
  const legacy={id:'aldi-6173-1794697200',product:'cucumber',store:'ALDI',price:6.99,until:'2026-11-15',from:'2026-11-15',source:'https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html',fetchedAt:'2026-11-15T21:21:43.185Z',name:'Ogórki szklarniowe',unit:'Cena za kg',regularPrice:14.99,validUntil:'2026-11-15T22:59:59.000Z',conditions:'53% TANIEJ'};
  const at=new Date('2026-11-15T21:30:00Z');
  assert.ok(isCurrentAutomaticOffer(legacy,at));assert.ok(!isDisplayableAutomaticOffer(legacy,at));
  const shipped=JSON.parse(await readFile(new URL('../src/offers.json',import.meta.url),'utf8'));
  assert.equal(shipped.version,1);assert.ok(Array.isArray(shipped.offers));
  for(const o of shipped.offers)assert.equal(isDisplayableAutomaticOffer(o,new Date(Date.parse(o.fetchedAt)+1)),validAutomaticOffer(o)&&isCurrentAutomaticOffer(o,new Date(Date.parse(o.fetchedAt)+1)));
});

// ---------- B. Oferty użytkownika: zgodność wstecz ----------
const memoryStorage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),raw:m};};
const legacyUser={id:'local-1',product:'apple',store:'Sklep osiedlowy',price:2.49,until:'2026-11-20',source:'Gazetka papierowa'};
test('Zapisane wcześniej oferty użytkownika (bez nowych pól) nadal się wczytują bez zmian',()=>{
  assert.equal(KEY,'co-na-talerz:v1');assert.equal(emptyState().version,1);
  const s=memoryStorage();s.raw.set(KEY,JSON.stringify({version:1,favorites:['kakao'],shopping:[],offers:[legacyUser]}));
  const state=load(s);
  assert.deepEqual(state,{version:1,favorites:['kakao'],shopping:[],offers:[legacyUser]});
  assert.ok(!('region' in state.offers[0]));
  save(s,state);assert.deepEqual(JSON.parse(s.raw.get(KEY)),{version:1,favorites:['kakao'],shopping:[],offers:[legacyUser]});
});
test('Opcjonalny zasięg wpisu użytkownika jest zapisywany, przycinany i walidowany',()=>{
  const withRegion={...legacyUser,region:'  Wrocław, Krzyki '};
  assert.ok(validOffer(withRegion));
  const s=memoryStorage();save(s,{...emptyState(),offers:[withRegion]});
  assert.deepEqual(load(s).offers,[{...legacyUser,region:'Wrocław, Krzyki'}]);
  assert.deepEqual(validateState({...emptyState(),offers:[{...legacyUser,region:''}]}).offers,[legacyUser]);
  assert.ok(!validOffer({...legacyUser,region:'x'.repeat(101)}));assert.ok(!validOffer({...legacyUser,region:5}));assert.ok(!validOffer({...legacyUser,region:null}));
  assert.throws(()=>validateState({...emptyState(),offers:[{...legacyUser,region:{type:'nationwide'}}]}));
  // Pola oferty automatycznej nie przenikają do notatek użytkownika.
  assert.deepEqual(validateState({...emptyState(),offers:[{...legacyUser,scope:{type:'nationwide'},currency:'EUR',market:'DE'}]}).offers,[legacyUser]);
});

// ---------- C. Granice ważności ----------
test('Oferta automatyczna: dokładnie w chwili validUntil jeszcze ważna, milisekundę później już nie',()=>{
  const end=Date.parse(auto.validUntil);
  assert.ok(isDisplayableAutomaticOffer(auto,new Date(end)));
  assert.ok(!isDisplayableAutomaticOffer(auto,new Date(end+1)));
  assert.ok(isDisplayableAutomaticOffer(auto,new Date(end-1)));
});
test('Oferta automatyczna: dokładnie 48 h po odczycie jeszcze świeża, potem znika; odczyt z przyszłości odrzucony',()=>{
  const long={...auto,until:'2026-11-30',validUntil:'2026-11-30T22:59:59.000Z'};
  const fetched=Date.parse(long.fetchedAt), h48=48*60*60*1000;
  assert.ok(validAutomaticOffer(long));
  assert.ok(isDisplayableAutomaticOffer(long,new Date(fetched)));
  assert.ok(isDisplayableAutomaticOffer(long,new Date(fetched+h48)));
  assert.ok(!isDisplayableAutomaticOffer(long,new Date(fetched+h48+1)));
  assert.ok(!isDisplayableAutomaticOffer(long,new Date(fetched-1)));
});
test('Oferta automatyczna: początek liczony według dnia w Warszawie, nie urządzenia',()=>{
  const future={...auto,from:'2026-11-16',until:'2026-11-30',validUntil:'2026-11-30T22:59:59.000Z',fetchedAt:'2026-11-15T20:00:00.000Z'};
  assert.ok(validAutomaticOffer(future));
  assert.ok(!isDisplayableAutomaticOffer(future,new Date('2026-11-15T22:59:59.999Z'))); // 23:59:59 w Polsce
  assert.ok(isDisplayableAutomaticOffer(future,new Date('2026-11-15T23:00:00.000Z')));  // północ w Polsce
  const code=`import {isDisplayableAutomaticOffer as d} from ${JSON.stringify(url('../src/domain.js'))};const o=${JSON.stringify(future)};
    console.log(JSON.stringify([d(o,new Date('2026-11-15T22:59:59.999Z')),d(o,new Date('2026-11-15T23:00:00.000Z')),d(o,new Date('2026-11-30T22:59:59.000Z')),d({...o,fetchedAt:'2026-11-29T00:00:00Z'},new Date('2026-11-30T22:59:59.001Z'))]));`;
  for(const tz of deviceZones)assert.deepEqual(inZone(tz,code),[false,true,false,false],tz);
});
test('Zmiana czasu: koniec dnia oferty wypada o innej godzinie UTC latem i zimą',()=>{
  const mk=(from,until,validUntil,fetchedAt)=>({...auto,from,until,validUntil,fetchedAt});
  // Ostatni dzień czasu letniego (sobota 24.10.2026): północ w Polsce to 22:00Z.
  const summer=mk('2026-10-24','2026-10-24','2026-10-24T21:59:59.000Z','2026-10-24T08:00:00.000Z');
  assert.ok(validAutomaticOffer(summer));
  assert.ok(isDisplayableAutomaticOffer(summer,new Date('2026-10-24T21:59:59.000Z')));assert.ok(!isDisplayableAutomaticOffer(summer,new Date('2026-10-24T22:00:00.000Z')));
  // Doba 25-godzinna (niedziela 25.10.2026): 22:00Z–23:00Z.
  const long=mk('2026-10-25','2026-10-25','2026-10-25T22:59:59.000Z','2026-10-25T08:00:00.000Z');
  assert.ok(validAutomaticOffer(long));
  assert.ok(!isDisplayableAutomaticOffer(long,new Date('2026-10-24T21:59:59.999Z')));
  assert.ok(isDisplayableAutomaticOffer(long,new Date('2026-10-25T22:30:00.000Z')));assert.ok(!isDisplayableAutomaticOffer(long,new Date('2026-10-25T23:00:00.000Z')));
  // Niespójny rekord: dzień „until” policzony w UTC zamiast w strefie rynku.
  assert.ok(!validAutomaticOffer(mk('2026-10-25','2026-10-25','2026-10-25T23:30:00.000Z','2026-10-25T08:00:00.000Z')));
  // Doba 23-godzinna (niedziela 29.03.2026): 23:00Z poprzedniego dnia – 22:00Z.
  const short=mk('2026-03-29','2026-03-29','2026-03-29T21:59:59.000Z','2026-03-29T05:00:00.000Z');
  assert.ok(validAutomaticOffer(short));
  assert.ok(isDisplayableAutomaticOffer(short,new Date('2026-03-29T21:59:59.000Z')));assert.ok(!isDisplayableAutomaticOffer(short,new Date('2026-03-29T22:00:00.000Z')));
});
test('Oferta użytkownika: ważna do końca dnia „until” w Polsce niezależnie od urządzenia',()=>{
  const o={...legacyUser,until:'2026-11-15'};
  assert.equal(isOfferExpired(o,new Date('2026-11-15T22:59:59.999Z')),false);
  assert.equal(isOfferExpired(o,new Date('2026-11-15T23:00:00.000Z')),true);
  assert.equal(isOfferExpired({...o,until:undefined},now),true);assert.equal(isOfferExpired(undefined,now),true);
  // Symulacja zegara: domyślne „dziś” w matchingOffers to dzień rynku.
  const code=`const R=Date;let NOW=0;globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const {matchingOffers,isOfferExpired}=await import(${JSON.stringify(url('../src/domain.js'))});const {recipes}=await import(${JSON.stringify(url('../src/recipes.pl.js'))});
    const o=${JSON.stringify(o)},r=recipes.find(r=>r.ingredients.some(i=>i.product==='apple')),out=[];
    for(const iso of ['2026-11-15T22:59:59.999Z','2026-11-15T23:00:00.000Z']){NOW=R.parse(iso);out.push(matchingOffers(r,[o]).length,isOfferExpired(o));}console.log(JSON.stringify(out));`;
  for(const tz of deviceZones)assert.deepEqual(inZone(tz,code),[1,false,0,true],tz);
});
test('Wygasłe i nieświeże oferty znikają z rekomendacji bez nowego pobrania',()=>{
  const recipe=recipes.find(r=>r.ingredients.some(i=>i.product==='tomato'));
  const fetchedOnce=[auto,{...auto,id:'bez-zasiegu',scope:undefined}];
  const recommended=at=>matchingOffers(recipe,fetchedOnce.filter(o=>isDisplayableAutomaticOffer(o,at)),marketDate(at)).map(o=>o.id);
  assert.deepEqual(recommended(now),[auto.id]);
  assert.deepEqual(recommended(new Date('2026-11-15T22:59:59.000Z')),[auto.id]);
  assert.deepEqual(recommended(new Date('2026-11-15T23:00:00.000Z')),[]);
  const stale=[{...auto,until:'2026-11-30',validUntil:'2026-11-30T22:59:59.000Z'}];
  assert.equal(stale.filter(o=>isDisplayableAutomaticOffer(o,new Date('2026-11-17T12:00:00.000Z'))).length,1);
  assert.equal(stale.filter(o=>isDisplayableAutomaticOffer(o,new Date('2026-11-17T12:00:00.001Z'))).length,0);
});

// ---------- C. Widok ofert (app.js z atrapą DOM, urządzenie w innej strefie) ----------
test('Ekran promocji pokazuje jednostkę, warunki, walutę i okres (bez zasięgu, CNT-041); ukrywa niepełne i wygasłe; escapuje dane',()=>{
  const evil='<img src=x onerror=alert(1)>';
  const mk=(id,patch)=>({...auto,id,...patch});
  const offers=[
    mk('ok',{name:`Pomidory ${evil}`,unit:`Cena za kg ${evil}`,conditions:`Z kartą ${evil}`,store:`ALDI ${evil}`,source:`https://www.aldi.pl/?q=${evil}`,scope:{type:'unverified',note:`Niepotwierdzony ${evil}`}}),
    mk('region',{product:'cucumber',name:'Ogórki szklarniowe',scope:{type:'region',regions:['mazowieckie',evil]}}),
    mk('kraj',{product:'apple',name:'Jabłka',scope:{type:'nationwide'}}),
    mk('bez-zasiegu',{name:'UKRYTA-A',scope:undefined}),mk('bez-waluty',{name:'UKRYTA-B',currency:undefined}),mk('bez-jednostki',{name:'UKRYTA-C',unit:''}),
    mk('euro',{name:'UKRYTA-D',currency:'EUR'}),mk('stara',{name:'UKRYTA-E',fetchedAt:'2026-11-13T11:59:59.000Z'}),mk('przyszla',{name:'UKRYTA-F',from:'2026-11-16',until:'2026-11-16',validUntil:'2026-11-16T22:59:59.000Z'}),
  ];
  const saved={version:1,favorites:[],shopping:[],offers:[{...legacyUser,until:'2026-11-15'},{...legacyUser,id:'local-2',until:'2026-11-14',region:`Krzyki ${evil}`}]};
  const code=`const R=Date;let NOW=R.parse('2026-11-15T12:00:00Z');globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const els=new Map(),el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},showModal(){},close(){},focus(){},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},hidden:false,style:{},dataset:{}});return els.get(s);};
    const handlers={},store=new Map([[${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(saved))}]]);
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f};
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,offers:${JSON.stringify(offers)}})});
    globalThis.FormData=class{constructor(t){this.t=t}get(k){return this.t.values[k]??null}};
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,...b})}});
    const out={cards:el('#results').innerHTML};
    await click({dataset:{tab:'offers'}});out.offers=el('#main').innerHTML;
    handlers.submit({target:{id:'offer-form',values:{product:'apple',store:' Targ ',price:'3.5',until:'2026-11-15',source:'ulotka',region:' Wrocław '}},preventDefault(){}});
    handlers.submit({target:{id:'offer-form',values:{product:'apple',store:'Wczoraj',price:'3.5',until:'2026-11-14',source:'ulotka'}},preventDefault(){}});
    out.saved=JSON.parse(store.get(${JSON.stringify(KEY)})).offers;
    NOW=R.parse('2026-11-15T23:00:00Z');await click({dataset:{tab:'offers'}});out.later=el('#main').innerHTML;
    await click({dataset:{tab:'recipes'}});out.laterCards=el('#results').innerHTML;
    console.log(JSON.stringify(out));`;
  for(const tz of ['America/Los_Angeles','Pacific/Kiritimati','Europe/Warsaw']){
    const out=inZone(tz,code), page=plain(out.offers);
    assert.ok(!page.includes('<img'),tz);assert.ok(page.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(page.includes('0,99 zł'));assert.ok(page.includes('Cena za kg'));assert.ok(page.includes('Warunki: Z kartą'));assert.ok(page.includes('Waluta: PLN'));
    assert.ok(page.includes('Ważna od: 14 lis 2026'));assert.ok(page.includes('Ważna do: 15 lis 2026'));assert.ok(page.includes('Odczyt: 15 lis 2026, 13:00'));
    // CNT-041: zasięg (region) nie jest nigdzie pokazywany — ani dla ofert bota, ani dla notatek użytkownika.
    assert.ok(!/Zasięg|zasięg|mazowieckie|Niepotwierdzony/.test(page),tz);
    assert.ok(!/UKRYTA/.test(page),'niepełne, obcowalutowe, nieświeże i przyszłe oferty są ukryte');
    assert.ok(page.includes('3 ofert'));
    // Notatki użytkownika: stary rekord bez zasięgu i rekord wygasły wczoraj (czasu polskiego).
    assert.ok(page.includes('2,49 zł / opakowanie'));assert.ok(!page.includes('Krzyki'),'stary region notatki wczytany, ale niepokazany');
    assert.equal(page.split('Oferta wygasła').length-1,1,tz);
    assert.ok(page.includes('Cena za opakowanie (zł)'));assert.ok(page.includes('min="2026-11-15"'),tz);assert.ok(!page.includes('name="region"'),'formularz bez pola regionu');
    assert.ok(out.cards.includes('offer-tag'));
    assert.deepEqual(out.saved.map(o=>o.store),['Sklep osiedlowy','Sklep osiedlowy','Targ']);assert.ok(!('region' in out.saved[2]),'nowa notatka bez regionu');assert.ok(!('region' in out.saved[0]));
    assert.equal(out.saved[1].region,`Krzyki ${evil}`,'stary region zostaje w danych (zgodność wstecz)');
    // Po północy w Polsce, bez nowego pobrania: brak ofert bota i brak rekomendacji z wygasłych wpisów.
    const later=plain(out.later);
    assert.ok(!later.includes('Pomidory'));assert.ok(later.includes(messages.botEmpty));assert.equal(later.split('Oferta wygasła').length-1,3,tz);assert.ok(later.includes('min="2026-11-16"'),tz);
    assert.ok(!out.laterCards.includes('offer-tag'),tz);
  }
});
