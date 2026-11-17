// CNT-027 / CNT-029 (ekran): kolejność według promocji, liczba składników w promocji na karcie,
// cena i link promocji przy składnikach i na liście zakupów. app.js działa na atrapie DOM ze stałym
// zegarem i atrapą fetch (jak w market.test.mjs); każdy scenariusz to osobny proces potomny.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { recipes, products } from '../src/recipes.pl.js';
import { pantryProducts } from '../src/domain.js';
import { emptyState, validateState, KEY } from '../src/storage.js';

const url=p=>new URL(p,import.meta.url).href;
const plain=s=>s.replace(/[\u00a0\u202f]/g," ");
const evil='<img src=x onerror=alert(1)>';
const NOW='2026-11-17T12:00:00.000Z';
// Pełny kontrakt CNT-016: oferta ALDI ważna do 20.11.2026 (czasu polskiego), odczytana 2 h temu.
const offer=(product,patch={})=>({id:`t-${product}`,product,store:'ALDI',price:1.99,from:'2026-11-16',until:'2026-11-20',validUntil:'2026-11-20T22:59:59.000Z',
  source:`https://www.aldi.pl/produkty/${product}.html`,fetchedAt:'2026-11-17T10:00:00.000Z',name:`Produkt ${product}`,unit:'Cena za kg',conditions:'Z kartą',
  market:'PL',currency:'PLN',scope:{type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'},regularPrice:2.99,...patch});
const promoProducts=['tomato','onion','potato','egg','cucumber','garlic','butter','milk','carrot','apple','dill','sourcream','flour'];
const fixture=[
  ...promoProducts.filter(p=>!['tomato','egg','butter'].includes(p)).map(p=>offer(p)),
  offer('tomato',{price:0.99,name:'Pomidory malinowe',validUntil:'2026-11-17T22:59:59.000Z',until:'2026-11-17'}), // kończy się dziś o północy w Polsce
  offer('egg',{price:12.49,name:`Jaja ${evil}`,unit:`opak. 10 szt. ${evil}`,store:`ALDI ${evil}`,source:`https://www.aldi.pl/?q="><img src=x onerror=alert(1)>`,scope:{type:'unverified',note:`Uwaga ${evil}`}}),
  offer('butter',{price:6.99,name:'Masło extra',unit:'Cena za 200 g',source:'http://www.aldi.pl/maslo.html',scope:{type:'nationwide'}}), // nie-https → bez linku
  offer('salt',{price:0.89,name:'Sól kuchenna'}),offer('oil',{price:7.99,name:'Olej rzepakowy'}), // spiżarnia: bez ceny przy składniku
];

function runApp({saved,offers=fixture,script}) {
  const code=`const R=Date;let NOW=R.parse(${JSON.stringify(NOW)});globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const els=new Map(),el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},showModal(){},close(){},focus(){},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},hidden:false,style:{},dataset:{}});return els.get(s);};
    const handlers={},store=new Map(${JSON.stringify(saved?[[KEY,JSON.stringify(saved)]]:[])});let fetches=0;
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f};
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>{fetches++;return {ok:true,json:async()=>({version:1,offers:${JSON.stringify(offers)}})};};
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,...b})}});
    const change=t=>handlers.change({target:{dataset:{},closest:()=>null,...t}});
    const ids=html=>[...html.matchAll(/<h3><button data-recipe="([^"]+)">/g)].map(m=>m[1]);
    const out={};
    ${script}
    out.fetches=fetches;out.saved=store.has(${JSON.stringify(KEY)})?JSON.parse(store.get(${JSON.stringify(KEY)})):null;
    console.log(JSON.stringify(out));`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,TZ:'America/Los_Angeles'}});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const defaultIds=recipes.map(r=>r.id);
const matched=r=>new Set(r.ingredients.map(i=>i.product).filter(p=>!pantryProducts.includes(p)&&promoProducts.includes(p))).size;
// CNT-039: karta wymienia produkty w promocji (kolejność składników, najwyżej 3, potem „+N”), bez znaku %.
const promoIdsOf=(r,list=promoProducts)=>[...new Set(r.ingredients.map(i=>i.product))].filter(p=>!pantryProducts.includes(p)&&list.includes(p));
const lower=id=>products[id][0].toLocaleLowerCase('pl-PL').replace(/\s*\([^)]*\)/g,'').replace(/\s*\d+(?:[.,]\d+)?\s*%/g,'').trim(); // „śmietana 18%” → „śmietana”
const tagOf=ids=>`<p class="offer-tag">W promocji: ${ids.slice(0,3).map(lower).join(', ')}${ids.length>3?` <span aria-hidden="true">+${ids.length-3}</span><span class="sr-only">, ${ids.slice(3).map(lower).join(', ')}</span>`:''}</p>`;
const cardOf=(html,id)=>{const start=html.indexOf(`<h3><button data-recipe="${id}">`);return html.slice(start,html.indexOf('</article>',start));};

test('Kolejność domyślna bez zmian; „Najwięcej składników w promocji” stawia na początku dania z większą liczbą składników w promocji; wybór zapisany',()=>{
  const out=runApp({script:`out.before=el('#results').innerHTML;out.ids=ids(out.before);
    change({id:'sort',value:'promotions'});out.promo=el('#results').innerHTML;out.promoIds=ids(out.promo);
    change({id:'sort',value:'default'});out.backIds=ids(el('#results').innerHTML);`});
  assert.deepEqual(out.ids,defaultIds);
  assert.ok(out.before.includes('<select id="sort">'));assert.ok(out.before.includes('<option value="default" selected>Domyślna</option>'));
  assert.ok(out.before.includes('Najwięcej składników w promocji'));assert.ok(out.before.includes('Kolejność'));
  assert.equal(out.promoIds.length,defaultIds.length);
  const counts=out.promoIds.map(id=>matched(recipes.find(r=>r.id===id)));
  for(let i=1;i<counts.length;i++)assert.ok(counts[i-1]>=counts[i],`${out.promoIds[i-1]} (${counts[i-1]}) przed ${out.promoIds[i]} (${counts[i]})`);
  assert.ok(counts[0]>=5);assert.notDeepEqual(out.promoIds,defaultIds);
  // Przepisy bez promocji zostają na końcu w pierwotnej kolejności.
  assert.deepEqual(out.promoIds.filter(id=>!matched(recipes.find(r=>r.id===id))),defaultIds.filter(id=>!matched(recipes.find(r=>r.id===id))));
  assert.ok(out.promo.includes('<option value="promotions" selected '));assert.ok(!out.promo.includes('sort-hint'));
  assert.deepEqual(out.backIds,defaultIds);
  assert.equal(out.saved.settings.sort,'default');
});
test('Wybrana kolejność przetrwa ponowne uruchomienie; bez aktualnych promocji jest podpowiedź i kolejność bez zmian',()=>{
  const withPromo=runApp({saved:{...emptyState(),settings:{sort:'promotions'}},script:`out.ids=ids(el('#results').innerHTML);`});
  assert.equal(matched(recipes.find(r=>r.id===withPromo.ids[0])),Math.max(...recipes.map(matched)));
  const none=runApp({saved:{...emptyState(),settings:{sort:'promotions'}},offers:[],script:`out.html=el('#results').innerHTML;out.ids=ids(out.html);`});
  assert.deepEqual(none.ids,defaultIds);
  assert.ok(none.html.includes('<p class="sort-hint">Brak aktualnych promocji — kolejność bez zmian</p>'));
  assert.ok(none.html.includes('<option value="promotions" selected '));assert.ok(!none.html.includes('offer-tag'));
});
test('Znacznik na karcie (CNT-039): nazwy produktów w promocji zamiast liczby i znaku %; najwyżej 3, potem „+N”; spiżarnia się nie liczy',()=>{
  const out=runApp({script:`out.html=el('#results').innerHTML;out.nav=el('#nav').innerHTML;`});
  let more=0;
  for(const r of recipes){
    const ids=promoIdsOf(r), card=plain(cardOf(out.html,r.id));
    assert.equal(ids.length,matched(r));
    if(!ids.length){assert.ok(!card.includes('offer-tag'),r.id);continue;}
    assert.ok(card.includes(tagOf(ids)),`${r.id}: ${card.slice(card.indexOf('offer-tag')-10)}`);
    const tag=card.slice(card.indexOf('<p class="offer-tag">'));assert.ok(!tag.slice(0,tag.indexOf('</p>')).includes('%')&&!/składnik(i|ów)? w promocji/.test(card),r.id);
    if(ids.length>3)more++;
  }
  assert.ok(more>0,'jest karta z „+N”');
  assert.ok(!out.nav.includes('>%<'),'nawigacja bez ikony %');
  // Notatka użytkownika nadal oznacza kartę (jak przed CNT-029).
  const note={id:'local-1',product:'banana',store:'Targ',price:3.5,until:'2026-11-18',source:'ulotka'};
  const noted=runApp({saved:{...emptyState(),offers:[note]},offers:[],script:`out.html=el('#results').innerHTML;`});
  const banana=recipes.find(r=>r.ingredients.some(i=>i.product==='banana'));
  assert.ok(plain(cardOf(noted.html,banana.id)).includes('<p class="offer-tag">W promocji: banan</p>'));
});
test('Szczegóły przepisu: cena z walutą, jednostka, sklep, „do” i link przy składnikach w promocji; nic przy spiżarni; niebezpieczny URL bez linku; wszystko escapowane',()=>{
  const r=recipes.find(x=>x.id==='jajecznica');
  assert.deepEqual(r.ingredients.map(i=>i.product),['egg','butter','tomato','bread','salt']);
  const out=runApp({script:`click({dataset:{recipe:'jajecznica'}});out.detail=el('#detail').innerHTML;`});
  const d=plain(out.detail), list=d.slice(d.indexOf('<ul class="ingredients">'),d.indexOf('</ul>')), items=list.split('<li>').slice(1).map(s=>s.slice(0,s.indexOf('</li>')));
  assert.equal(items.length,5);
  const [egg,butter,tomato,bread,salt]=items;
  assert.ok(tomato.includes('<span class="promo-price">0,99 zł</span> · Cena za kg · ALDI: Pomidory malinowe · <span class="promo-until">do 17 lis 2026</span>'),tomato);
  assert.ok(tomato.includes('<a class="promo-link" href="https://www.aldi.pl/produkty/tomato.html" target="_blank" rel="noopener noreferrer">Zobacz promocję'));
  assert.ok(!/Zasięg|niepotwierdzon/.test(d),'CNT-041: bez zasięgu w szczegółach');
  assert.ok(butter.includes('6,99 zł</span> · Cena za 200 g · ALDI: Masło extra · <span class="promo-until">do 20 lis 2026</span>'));
  assert.ok(!butter.includes('<a '),'http:// nie daje linku');
  assert.ok(egg.includes('12,49 zł'));assert.ok(!egg.includes('<a '),'URL ze znakami HTML nie daje linku');
  assert.ok(egg.includes('opak. 10 szt. &lt;img src=x onerror=alert(1)&gt;'));assert.ok(egg.includes('ALDI &lt;img'));assert.ok(egg.includes('Jaja &lt;img'));
  assert.ok(!egg.includes('Uwaga'),'notatka zasięgu nie jest pokazywana');
  assert.ok(!bread.includes('promo-line'));assert.ok(!salt.includes('promo-line'),'sól (spiżarnia) bez ceny mimo oferty');
  assert.ok(!d.includes('<img src=x'));assert.ok(!/onerror=alert\(1\)>/.test(d.replace(/&gt;/g,'')));
  assert.ok(!/razem|suma/i.test(d),'brak wymyślonej sumy');
});
test('Wygasła oferta znika po chwili końca ważności bez nowego pobrania (karta, kolejność, szczegóły)',()=>{
  const out=runApp({script:`click({dataset:{recipe:'jajecznica'}});out.before=el('#detail').innerHTML;
    NOW=R.parse('2026-11-17T22:59:59.000Z');click({dataset:{recipe:'jajecznica'}});out.edge=el('#detail').innerHTML;
    NOW=R.parse('2026-11-17T23:00:00.000Z');click({dataset:{recipe:'jajecznica'}});out.after=el('#detail').innerHTML;
    change({id:'diet',value:''});out.cards=el('#results').innerHTML;`});
  assert.ok(out.before.includes('Pomidory malinowe'));assert.ok(out.edge.includes('Pomidory malinowe'),'w chwili validUntil jeszcze ważna');
  assert.ok(!out.after.includes('Pomidory malinowe'));assert.ok(out.after.includes('Masło extra'),'pozostałe oferty zostają');
  assert.equal(out.fetches,1);
  // jajecznica: jajko, masło, (pomidor wygasł) → dwa produkty na karcie.
  assert.ok(plain(cardOf(out.cards,'jajecznica')).includes(tagOf(['egg','butter'])));
});
test('Lista zakupów: cena i link przy produktach z aktualną ofertą; własne pozycje bez ceny',()=>{
  const saved={...emptyState(),shopping:[{id:'tomato',product:'tomato',amount:2,done:false},{id:'bread',product:'bread',amount:4,done:false},{id:'local-x',name:`Pomidory ${evil}`,done:false}]};
  const out=runApp({saved,script:`click({dataset:{tab:'shopping'}});out.html=el('#main').innerHTML;`});
  const html=plain(out.html), items=html.split('<li').slice(1);
  assert.equal(items.length,3);
  assert.ok(items[0].includes('<span class="promo-price">0,99 zł</span> · Cena za kg · ALDI: Pomidory malinowe · <span class="promo-until">do 17 lis 2026</span>'),items[0]);
  assert.ok(items[0].includes('href="https://www.aldi.pl/produkty/tomato.html" target="_blank" rel="noopener noreferrer"'));
  assert.ok(!items[1].includes('promo-line'));assert.ok(!items[2].includes('promo-line'));
  assert.ok(items[2].includes('Pomidory &lt;img'));assert.ok(!html.includes('<img src=x'));
});
test('Stare zapisane dane bez settings.sort wczytują się; nieznana kolejność wraca do domyślnej',()=>{
  const legacy={version:1,favorites:['kakao'],shopping:[],offers:[],settings:{showNutrition:false}};
  assert.deepEqual(validateState(legacy),legacy);
  assert.deepEqual(validateState({...emptyState()}),emptyState());
  assert.deepEqual(validateState({...emptyState(),settings:{sort:'promotions'}}),{...emptyState(),settings:{sort:'promotions'}});
  assert.deepEqual(validateState({...emptyState(),settings:{sort:'price'}}),emptyState());
  assert.deepEqual(validateState({...emptyState(),settings:{showNutrition:true,sort:'price'}}),{...emptyState(),settings:{showNutrition:true}});
  for(const bad of [5,null,{},['promotions']])assert.throws(()=>validateState({...emptyState(),settings:{sort:bad}}),JSON.stringify(bad));
  const out=runApp({saved:legacy,script:`out.ids=ids(el('#results').innerHTML);out.html=el('#results').innerHTML;change({id:'sort',value:'promotions'});`});
  assert.deepEqual(out.ids,defaultIds);assert.ok(out.html.includes('<option value="default" selected>'));
  assert.deepEqual(out.saved,{...legacy,settings:{showNutrition:false,sort:'promotions'}});
});
