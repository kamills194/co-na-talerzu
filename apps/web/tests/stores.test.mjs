// CNT-041: kafelki sieci sklepów, okno promocji ALDI podzielone na kategorie, kontrakt „deals” i brak zasięgu w UI.
// Widok: app.js na atrapie DOM ze stałym zegarem i atrapą fetch (jak market.test.mjs / promo-ui.test.mjs), osobny proces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { STORES, storeById, storeInitial } from '../src/stores.js';
import { validDeal, isCurrentDeal, isDisplayableDeal, groupDeals, safeOfferUrl } from '../src/domain.js';
import { messages } from '../src/i18n.js';
import { KEY } from '../src/storage.js';

const url=p=>new URL(p,import.meta.url).href;
const src=f=>readFile(new URL('../src/'+f,import.meta.url),'utf8');
const plain=s=>s.replace(/[  ]/g,' ');
const evil='<img src=x onerror=alert(1)>';
const NOW='2026-11-17T12:00:00.000Z';
const deal=(id,patch={})=>({id:`aldi-${id}`,store:'ALDI',name:`Produkt ${id}`,price:2.99,regularPrice:3.99,currency:'PLN',unit:'Cena za kg',conditions:'Cena regularna 3,99 zł',
  from:'2026-11-16',until:'2026-11-20',validUntil:'2026-11-20T22:59:59.000Z',category:'Inne',url:null,fetchedAt:'2026-11-17T10:00:00.000Z',...patch});

// ---------- Moduł sklepów ----------
test('stores.js: 11 sieci w ustalonej kolejności, kształt {id,name,leafletUrl,inApp}, zamrożone',()=>{
  assert.deepEqual(STORES.map(s=>s.id),['aldi','lidl','biedronka','kaufland','netto','carrefour','auchan','dino','stokrotka','intermarche','penny']);
  assert.deepEqual(STORES.map(s=>s.name),['ALDI','Lidl','Biedronka','Kaufland','Netto','Carrefour','Auchan','Dino','Stokrotka','Intermarché','Penny']);
  assert.ok(Object.isFrozen(STORES));
  for(const s of STORES){
    assert.deepEqual(Object.keys(s),['id','name','leafletUrl','inApp'],s.id);assert.ok(Object.isFrozen(s),s.id);
    assert.equal(typeof s.inApp,'boolean');assert.match(s.id,/^[a-z]+$/);
  }
  assert.deepEqual(STORES.filter(s=>s.inApp).map(s=>s.id),['aldi'],'tylko ALDI ma dane w aplikacji');
  assert.equal(storeById('dino').name,'Dino');assert.equal(storeById('nie-ma'),null);
  assert.deepEqual(STORES.map(storeInitial),['A','L','B','K','N','C','A','D','S','I','P']);
});
test('stores.js: tylko podane adresy https (gazetki albo strony główne), bezpieczne dla href',async()=>{
  const expected={aldi:'https://www.aldi.pl/gazetki.html',biedronka:'https://www.biedronka.pl/pl/gazetki',netto:'https://www.netto.pl/gazetka-netto/',dino:'https://marketdino.pl/gazetki/lista/standard',
    stokrotka:'https://stokrotka.pl/oferta/gazetki-promocyjne/',intermarche:'https://intermarche.pl/gazetki-promocyjne/',lidl:'https://www.lidl.pl/',kaufland:'https://www.kaufland.pl/',
    carrefour:'https://www.carrefour.pl/',auchan:'https://www.auchan.pl/pl',penny:'https://www.penny.pl/'};
  assert.deepEqual(Object.fromEntries(STORES.map(s=>[s.id,s.leafletUrl])),expected);
  for(const s of STORES){assert.ok(s.leafletUrl.startsWith('https://'),s.id);assert.equal(safeOfferUrl(s.leafletUrl),s.leafletUrl,s.id);}
  const text=await src('stores.js');
  for(const id of ['lidl','kaufland','carrefour','auchan','penny'])assert.match(text,new RegExp(`store\\('${id}'[^\\n]*niezweryfikowany`),`${id}: komentarz o niezweryfikowanym adresie`);
});
test('Bez logotypów: żadnych obrazów, SVG ani kolorów marek w module sklepów i kafelkach',async()=>{
  const text=await src('stores.js');
  assert.doesNotMatch(text,/<svg|<img|\.png|\.svg|\.webp|data:|#[0-9a-f]{3,6}\b|logo(?:Url)?\s*:/i);
  const css=await src('styles.css'), block=css.slice(css.indexOf('/* CNT-041'));
  assert.doesNotMatch(block,/url\(|#[0-9a-f]{3,8}\b/i,'kafelki tylko w kolorach motywu');
});

// ---------- Kontrakt deals i reguły czasu ----------
test('validDeal: pełny kontrakt, fail closed',()=>{
  const ok=deal('1');
  assert.ok(validDeal(ok));assert.ok(validDeal({...ok,regularPrice:null}));assert.ok(validDeal({...ok,market:'PL'}));
  assert.ok(validDeal({...ok,url:'https://www.aldi.pl/produkty/maslo-ekstra-497.html'}));
  const bad=[null,undefined,[],'x',{...ok,id:''},{...ok,id:'x'.repeat(100)},{...ok,store:''},{...ok,name:'  '},{...ok,name:'x'.repeat(201)},{...ok,unit:undefined},
    {...ok,conditions:'x'.repeat(501)},{...ok,category:''},{...ok,category:'x'.repeat(101)},{...ok,currency:'EUR'},{...ok,currency:undefined},{...ok,market:'DE'},
    {...ok,price:0},{...ok,price:-1},{...ok,price:NaN},{...ok,price:'2.99'},{...ok,price:100001},{...ok,regularPrice:'3'},{...ok,regularPrice:0},
    {...ok,url:undefined},{...ok,url:'http://www.aldi.pl/x.html'},{...ok,url:'javascript:alert(1)'},{...ok,url:`https://www.aldi.pl/?q=${evil}`},{...ok,url:'https://user:pw@aldi.pl/'},
    {...ok,from:'2026-11-21'},{...ok,from:'2026-02-30'},{...ok,until:'20.11.2026'},{...ok,validUntil:'2026-11-20T23:30:00.000Z'},{...ok,validUntil:'nie'},{...ok,fetchedAt:'nie'},{...ok,fetchedAt:undefined}];
  for(const d of bad)assert.equal(validDeal(d),false,JSON.stringify(d)?.slice(0,120));
});
test('Deals: te same reguły czasu co oferty automatyczne (koniec włącznie, odczyt ≤ 48 h, start według dnia w Polsce)',()=>{
  const d=deal('t',{until:'2026-11-30',validUntil:'2026-11-30T22:59:59.000Z'}), fetched=Date.parse(d.fetchedAt), h48=48*3600*1000;
  assert.ok(isDisplayableDeal(d,new Date(fetched)));assert.ok(isDisplayableDeal(d,new Date(fetched+h48)));
  assert.ok(!isDisplayableDeal(d,new Date(fetched+h48+1)),'nieświeży odczyt');assert.ok(!isDisplayableDeal(d,new Date(fetched-1)),'odczyt z przyszłości');
  const short=deal('s'), end=Date.parse(short.validUntil);
  assert.ok(!isCurrentDeal(short,new Date(end-3600*1000)),'odczyt sprzed ponad 48 h, choć promocja trwa');
  const late={...short,fetchedAt:'2026-11-20T10:00:00.000Z'};
  assert.ok(isDisplayableDeal(late,new Date(end)));assert.ok(!isDisplayableDeal(late,new Date(end+1)));
  const future=deal('f',{from:'2026-11-18',fetchedAt:'2026-11-17T20:00:00.000Z'});
  assert.ok(!isDisplayableDeal(future,new Date('2026-11-17T22:59:59.999Z')));assert.ok(isDisplayableDeal(future,new Date('2026-11-17T23:00:00.000Z')));
  assert.ok(!isDisplayableDeal({...d,currency:'EUR'},new Date(fetched)),'niepełny kontrakt nie jest pokazywany');
  assert.equal(isCurrentDeal(null),false);
});
test('groupDeals: tylko jeden sklep, bez duplikatów i nieaktualnych; kategorie według liczby, potem nazwy',()=>{
  const now=new Date(NOW);
  const list=[deal('a',{category:'Nabiał i jaja',name:'Ser'}),deal('b',{category:'Mięso',name:'Schab'}),deal('c',{category:'Nabiał i jaja',name:'Masło'}),deal('d',{category:'Mięso',name:'Boczek'}),
    deal('e',{category:'Owoce i warzywa'}),deal('a',{category:'Nabiał i jaja',name:'Duplikat'}),deal('x',{store:'Lidl',category:'Owoce i warzywa'}),deal('y',{currency:'EUR',category:'Owoce i warzywa'}),
    deal('z',{fetchedAt:'2026-11-15T11:59:59.000Z',category:'Owoce i warzywa'})];
  const g=groupDeals(list,'ALDI',now);
  assert.deepEqual(g.map(x=>[x.category,x.deals.map(d=>d.name)]),[['Mięso',['Boczek','Schab']],['Nabiał i jaja',['Masło','Ser']],['Owoce i warzywa',['Produkt e']]]);
  assert.deepEqual(groupDeals(undefined,'ALDI',now),[]);assert.deepEqual(groupDeals(list,'Lidl',now).map(x=>x.category),['Owoce i warzywa']);
});

// ---------- Widok (atrapa DOM) ----------
const legacyUser={id:'local-1',product:'apple',store:'Sklep osiedlowy',price:2.49,until:'2026-11-20',source:'Gazetka papierowa',region:`Krzyki ${evil}`};
const autoOffer={id:'t-tomato',product:'tomato',store:'ALDI',price:0.99,from:'2026-11-16',until:'2026-11-20',validUntil:'2026-11-20T22:59:59.000Z',source:'https://www.aldi.pl/produkty/owoce-i-warzywa/warzywa.html',
  fetchedAt:'2026-11-17T10:00:00.000Z',name:'Pomidory malinowe',unit:'Cena za kg',conditions:'Z kartą',market:'PL',currency:'PLN',scope:{type:'unverified',note:'Zasięg: niepotwierdzony test'},regularPrice:1.99};
const fixtureDeals=[
  deal('o1',{category:'Owoce i warzywa',name:'Pomidory malinowe'}),deal('o2',{category:'Owoce i warzywa',name:'Banany',until:'2026-11-17',validUntil:'2026-11-17T22:59:59.000Z'}),deal('o3',{category:'Owoce i warzywa',name:'Awokado'}),
  deal('n1',{category:'Nabiał i jaja',name:'Masło ekstra',price:3.99,conditions:'Cena przy zakupie 2 szt.',url:'https://www.aldi.pl/produkty/maslo-ekstra-497.html'}),deal('n2',{category:'Nabiał i jaja',name:'Jaja L'}),
  deal('m1',{category:'Mięso',name:`Schab ${evil}`,unit:`opak. ${evil}`,conditions:`Limit ${evil}`}),deal('m2',{category:'Mięso',name:'Boczek wędzony'}),
  deal('r1',{category:`Ryby ${evil}`,name:'Łosoś'}),deal('s1',{category:'Słodycze',name:'Czekolada gorzka'}),
  // Niepokazywane: inna waluta, http, nieświeże, przyszłe, inny sklep, duplikat.
  deal('x1',{category:'Owoce i warzywa',name:'UKRYTA-A',currency:'EUR'}),deal('x2',{category:'Owoce i warzywa',name:'UKRYTA-B',url:'http://www.aldi.pl/x.html'}),
  deal('x3',{category:'Owoce i warzywa',name:'UKRYTA-C',fetchedAt:'2026-11-15T11:59:59.000Z'}),deal('x4',{category:'Owoce i warzywa',name:'UKRYTA-D',from:'2026-11-18'}),
  deal('x5',{category:'Owoce i warzywa',name:'UKRYTA-E',store:'Lidl'}),deal('o1',{category:'Inne',name:'UKRYTA-F'}),
];
function runApp({saved,data,script}) {
  const code=`const R=Date;let NOW=R.parse(${JSON.stringify(NOW)});globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const els=new Map(),focused=[],el=s=>{if(!els.has(s)){const o={innerHTML:'',textContent:'',open:false,listeners:{},classList:{add(){},remove(){}},
      showModal(){this.open=true;},close(){this.open=false;for(const f of this.listeners.close||[])f({});},focus(opts){focused.push([s,opts]);},addEventListener(n,f){(this.listeners[n]??=[]).push(f);},removeEventListener(){},setAttribute(){},removeAttribute(){},append(){},hidden:false,style:{},dataset:{}};els.set(s,o);}return els.get(s);};
    const handlers={},store=new Map(${JSON.stringify(saved?[[KEY,JSON.stringify(saved)]]:[])});
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f,body:el('body')};
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>({ok:true,json:async()=>(${JSON.stringify(data)})});
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:k=>k in (b.attrs||{}),...b})}});
    const out={};
    ${script}
    out.focused=focused;out.saved=store.has(${JSON.stringify(KEY)})?JSON.parse(store.get(${JSON.stringify(KEY)})):null;
    console.log(JSON.stringify(out));`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,TZ:'America/Los_Angeles'}});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const panelOf=html=>html.slice(html.indexOf('<section class="panel stores-panel"'),html.indexOf('</section>',html.indexOf('stores-panel'))+10);
const headings=html=>[...html.matchAll(/<h3 id="deal-cat-\d+">(.*?) <span class="chip-count">(\d+)<\/span><\/h3>/g)].map(m=>[m[1],Number(m[2])]);

test('Ekran Promocje: na górze siatka 11 kafelków; ALDI otwiera okno, pozostałe linkują do gazetki w nowej karcie',()=>{
  const out=runApp({data:{version:1,offers:[autoOffer],deals:fixtureDeals},script:`click({dataset:{tab:'offers'}});out.main=el('#main').innerHTML;`});
  const main=plain(out.main), panel=panelOf(main);
  assert.ok(main.indexOf('stores-panel')<main.indexOf('class="notice"'),'kafelki nad komunikatem i ofertami');
  assert.ok(panel.includes('<h2 id="stores-heading">Sklepy i gazetki</h2>'));
  const tiles=panel.split('<li>').slice(1);assert.equal(tiles.length,11);
  assert.ok(tiles[0].startsWith('<button class="store-tile" data-store="aldi" aria-haspopup="dialog"><span class="store-badge" aria-hidden="true">A</span>'),tiles[0]);
  assert.ok(tiles[0].includes('<span class="store-name">ALDI</span><span class="store-line">9 promocji w aplikacji</span>'),tiles[0]);
  for(const [i,s] of STORES.entries()){
    if(s.inApp)continue;
    const tile=tiles[i];
    assert.ok(tile.includes(`<a class="store-tile" href="${s.leafletUrl}" target="_blank" rel="noopener noreferrer">`),tile);
    assert.ok(tile.includes(`<span class="store-badge" aria-hidden="true">${storeInitial(s)}</span>`));assert.ok(tile.includes(`<span class="store-name">${s.name}</span>`));
    assert.ok(tile.includes('Gazetka <span aria-hidden="true">↗</span>'));assert.ok(tile.includes('<span class="sr-only"> (otwiera się w nowej karcie)</span>'),'podpowiedź dla czytnika');
  }
  assert.doesNotMatch(panel,/<img|<svg|style=/,'bez logotypów i kolorów marek');
  assert.ok(!/Zasięg|zasięg|niepotwierdzon/.test(main),'bez zasięgu na ekranie promocji');
});
test('Okno ALDI: wszystkie aktualne promocje w kategoriach z nagłówkami (liczba malejąco, potem nazwa), link do gazetki, escapowanie',()=>{
  const out=runApp({data:{version:1,offers:[autoOffer],deals:fixtureDeals},script:`click({dataset:{tab:'offers'}});click({dataset:{store:'aldi'}});out.d=el('#detail').innerHTML;out.open=el('#detail').open;
    NOW=R.parse('2026-11-17T23:00:00.000Z');el('#detail').close();click({dataset:{store:'aldi'}});out.later=el('#detail').innerHTML;`});
  const d=plain(out.d);
  assert.equal(out.open,true);
  assert.ok(d.startsWith('<div class="dialog-head"><h2 id="detail-heading">Promocje ALDI</h2><button class="close" data-close aria-label="Zamknij">×</button></div>'),d.slice(0,200));
  assert.ok(d.includes('<a class="promo-link store-leaflet" href="https://www.aldi.pl/gazetki.html" target="_blank" rel="noopener noreferrer">Gazetka ALDI <span aria-hidden="true">↗</span><span class="sr-only"> (otwiera się w nowej karcie)</span></a>'));
  assert.ok(d.indexOf('store-leaflet')<d.indexOf('deal-group'),'link do gazetki na górze');
  assert.deepEqual(headings(d),[['Owoce i warzywa',3],['Mięso',2],['Nabiał i jaja',2],['Ryby &lt;img src=x onerror=alert(1)&gt;',1],['Słodycze',1]]);
  assert.ok(d.includes('9 promocji w aplikacji'));
  const group=name=>{const s=d.indexOf(`>${name} <span`);return d.slice(s,d.indexOf('</section>',s));};
  assert.deepEqual([...group('Owoce i warzywa').matchAll(/<span class="deal-name">(.*?)<\/span>/g)].map(m=>m[1]),['Awokado','Banany','Pomidory malinowe'],'w kategorii według nazwy');
  const butter=group('Nabiał i jaja');
  assert.ok(butter.includes('<span class="deal-name">Masło ekstra</span><p class="promo-line"><span class="promo-price">3,99 zł</span> · Cena za kg · Cena przy zakupie 2 szt. · <span class="promo-until">do 20 lis 2026</span></p><a class="promo-link" href="https://www.aldi.pl/produkty/maslo-ekstra-497.html" target="_blank" rel="noopener noreferrer">Zobacz w ALDI<span class="sr-only"> — Masło ekstra (otwiera się w nowej karcie)</span></a>'),butter);
  assert.equal((butter.match(/Zobacz w ALDI/g)||[]).length,1,'link tylko przy promocji z adresem');
  assert.ok(d.includes('Schab &lt;img src=x onerror=alert(1)&gt;'));assert.ok(d.includes('opak. &lt;img'));assert.ok(d.includes('Limit &lt;img'));
  assert.ok(!d.includes('<img'),'wszystko escapowane');assert.ok(!/UKRYTA/.test(d),'niepełne, nieświeże, przyszłe, inne sklepy i duplikaty ukryte');
  assert.ok(!/Zasięg|zasięg/.test(d));
  // Po północy w Polsce, bez nowego pobrania: banany wygasły, kolejność kategorii według nazwy przy równej liczbie.
  assert.deepEqual(headings(plain(out.later)).slice(0,3),[['Mięso',2],['Nabiał i jaja',2],['Owoce i warzywa',2]]);
  assert.ok(!out.later.includes('Banany'));
});
test('Okno ALDI: fokus wraca na kafelek po zamknięciu (przycisk ×, Esc); pusty stan z linkiem do gazetki; plik bez deals działa',()=>{
  const out=runApp({data:{version:1,offers:[autoOffer]},script:`click({dataset:{tab:'offers'}});out.tile=el('#main').innerHTML;click({dataset:{store:'aldi'}});out.d=el('#detail').innerHTML;
    click({attrs:{'data-close':''}});out.closed=!el('#detail').open;click({dataset:{store:'aldi'}});el('#detail').close();
    click({dataset:{tab:'recipes'}});out.cards=el('#results').innerHTML;`});
  const d=plain(out.d);
  assert.ok(plain(out.tile).includes('<span class="store-line">0 promocji w aplikacji</span>'));
  assert.ok(d.includes('<p class="store-empty">Brak aktualnych promocji tego sklepu w aplikacji. Sprawdź gazetkę.</p><a class="promo-link store-leaflet" href="https://www.aldi.pl/gazetki.html" target="_blank" rel="noopener noreferrer">'));
  assert.ok(!d.includes('deal-group'));
  assert.equal(out.closed,true);
  const back=out.focused.filter(([s])=>s==='[data-store="aldi"]');
  assert.equal(back.length,2,'fokus na kafelku ALDI po każdym zamknięciu');assert.deepEqual(back[0][1],{preventScroll:true});
  assert.ok(out.cards.includes('offer-tag'),'karty przepisów nadal korzystają z ofert dopasowanych do przepisów');
});
test('Bez zasięgu nigdzie (CNT-041): karty, szczegóły, ekran promocji; stara notatka z regionem wczytuje się i nie jest pokazywana',async()=>{
  const saved={version:1,favorites:[],shopping:[],offers:[legacyUser]};
  const out=runApp({saved,data:{version:1,offers:[autoOffer],deals:fixtureDeals},script:`out.cards=el('#results').innerHTML;click({dataset:{recipe:'jajecznica'}});out.detail=el('#detail').innerHTML;el('#detail').close();
    click({dataset:{tab:'offers'}});out.offers=el('#main').innerHTML;click({dataset:{store:'aldi'}});out.store=el('#detail').innerHTML;`});
  const all=plain(out.cards+out.detail+out.offers+out.store);
  assert.ok(!/Zasięg|zasięg|Krzyki|niepotwierdzon|name="region"/.test(all));
  assert.ok(plain(out.offers).includes('2,49 zł / opakowanie'),'stara notatka jest na liście');
  assert.ok(plain(out.detail).includes('Pomidory malinowe'),'cena przy składniku bez zmian');
  const app=await src('app.js');assert.doesNotMatch(app,/scope|region/i,'widok nie czyta zasięgu ani regionu');
  for(const key of ['scopeLabel','scopeNationwide','scopeRegion','scopeUnverified','scopeNotGiven','regionOptional'])assert.ok(!(key in messages),key);
  for(const code of ['en','de','uk','fr','da','es','it']){const {messages:m}=await import(`../src/i18n.${code}.js`);assert.ok(!Object.keys(m).some(k=>/^scope|^region/.test(k)),code);}
  assert.ok(!Object.values(messages).some(v=>/Zasięg|zasięg/.test(v)),'żaden tekst słownika nie mówi o zasięgu');
});
