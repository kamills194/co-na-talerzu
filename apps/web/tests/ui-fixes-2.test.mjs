import { extraRecipes } from '../src/extra-catalog.js';
// CNT-039: poprawki po teście właściciela na telefonie (17.11.2026, 20:34) — większa losowość, czas w przedziałach
// 15/30/60 min i pełnych półgodzinach, czyszczenie filtrów bez skoku do wyszukiwarki, nazwy produktów w promocji
// zamiast „%”, przerywnik kuchenny zamiast chorągiewek, flagi przy językach, tylko dwa motywy, etykiety nowych kuchni.
// Widok: app.js na atrapie DOM (jak ui-fixes.test.mjs), każdy scenariusz w osobnym procesie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { recipes, products } from '../src/recipes.pl.js';
import { filterRecipes, timeBucket, promoWeight, recentWindow, secureRandom, weightedSurprise, pantryProducts, RECENT_MAX } from '../src/domain.js';
import { emptyState, KEY } from '../src/storage.js';
import { messages, cuisines, languages, languageCodes, isKnownKey } from '../src/i18n.js';

const url=p=>new URL(p,import.meta.url).href;
const src=name=>readFile(new URL('../src/'+name,import.meta.url),'utf8');
const plain=s=>String(s).replace(/[  ]/g,' ');
const unesc=s=>String(s).replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const idByName=name=>recipes.find(r=>r.name===unesc(name))?.id;
const NOW='2026-11-17T12:00:00.000Z';
const offer=(product,patch={})=>({id:`t-${product}`,product,store:'ALDI',price:1.99,from:'2026-11-16',until:'2026-11-20',validUntil:'2026-11-20T22:59:59.000Z',
  source:`https://www.aldi.pl/produkty/${product}.html`,fetchedAt:'2026-11-17T10:00:00.000Z',name:`Produkt ${product}`,unit:'Cena za kg',conditions:'Z kartą',
  market:'PL',currency:'PLN',scope:{type:'nationwide'},...patch});
// jajecznica: jajko, masło, pomidor, chleb (+ sól ze spiżarni) → cztery produkty w promocji.
const fixture=['egg','butter','tomato','bread','salt'].map(p=>offer(p));

// Atrapa DOM. Element o selektorze „#id” istnieje tylko wtedy, gdy id jest w wyrenderowanym HTML (tak jak w przeglądarce),
// fokus zapisuje selektor i opcje, a przerysowanie #main symuluje skok strony (scrollY = 0), który aplikacja musi cofnąć.
function runApp({saved,lang,offers=[],script,dark=false,crypto=false}) {
  const code=`const R=Date;const NOW=R.parse(${JSON.stringify(NOW)});globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const els=new Map(),focused=[],scrolls=[];globalThis.scrollY=900;globalThis.scrollX=0;let randomCalls=0;
    ${crypto?`{let seed=99;Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>'u-'+(++seed),getRandomValues(a){randomCalls++;for(let i=0;i<a.length;i++){seed=(seed*1103515245+12345)>>>0;a[i]=seed;}return a;}}});}`:''}
    const make=s=>{let html='';const o={sel:s,textContent:'',value:'',open:false,attrs:{},tagName:s==='#search'||s==='#exclude-input'?'INPUT':'DIV',classList:{add(){},remove(){}},showModal(){this.open=true},close(){this.open=false},
      focus(opts){focused.push([s,opts]);if(o.tagName==='INPUT')globalThis.scrollY=0;},addEventListener(){},removeEventListener(){},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]},append(){},hidden:false,style:{},dataset:{}};
      Object.defineProperty(o,'innerHTML',{get:()=>html,set:v=>{html=String(v);if(s==='#main')globalThis.scrollY=0;}});return o;};
    const el=s=>{if(!els.has(s))els.set(s,make(s));return els.get(s);};
    const always=new Set(['#main','#results','#detail','#toast','#nav','#lang','#cuisine-tabs','#net-status','body','.exclusions','#footer-text','#privacy','.skip','.brand small','.brand','meta[name="description"]']);
    const exists=s=>{if(always.has(s))return true;const m=/^#([\\w-]+)$/.exec(s);const all=[...els.values()].map(e=>e.innerHTML).join('');if(m)return all.includes('id="'+m[1]+'"');if(s==='.exclusions summary')return all.includes('<summary>');if(s.startsWith('.exclusion-summary'))return all.includes('class="exclusion-summary"');return true;};
    const handlers={},store=new Map(${JSON.stringify(saved?[[KEY,JSON.stringify(saved)]]:[])});
    globalThis.document={querySelector:s=>exists(s)?el(s):null,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f,body:el('body'),documentElement:{lang:'pl',dir:'ltr',attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]}},title:''};
    Object.defineProperty(globalThis,'navigator',{value:{language:'pl-PL',languages:['pl-PL'],onLine:true},configurable:true});
    globalThis.matchMedia=q=>({matches:${dark}&&q.includes('dark'),addEventListener(){},removeEventListener(){}});
    globalThis.window={scrollTo(o){scrolls.push(o);globalThis.scrollY=o.top;},addEventListener(){}};globalThis.CSS={escape:s=>String(s)};
    globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
    globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,offers:${JSON.stringify(offers)}})});
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,getAttribute:()=>null,...b})}});
    const change=t=>handlers.change({target:{dataset:{},closest:()=>null,...t}});
    const input=t=>{if(t.id&&t.value!==undefined)el('#'+t.id).value=t.value;return handlers.input({target:{dataset:{},validity:{valid:true},...t}});};
    const key=(id,k)=>handlers.keydown?.({key:k,target:{id,...el('#'+id)},preventDefault(){},stopPropagation(){}});
    const shown=()=>(el('#detail').innerHTML.match(/<h2 id="detail-heading"[^>]*>([^<]*)<\\/h2>/)||[])[1];
    const ids=html=>[...html.matchAll(/<h3><button data-recipe="([^"]+)"/g)].map(m=>m[1]);
    const out={};
    ${lang?`await change({id:'language',value:${JSON.stringify(lang)}});`:''}
    ${script}
    out.focused=focused;out.scrolls=scrolls;out.scrollY=globalThis.scrollY;out.randomCalls=randomCalls;out.theme=store.get('co-na-talerz:theme')??null;out.dataTheme=document.documentElement.attrs['data-theme']??null;
    out.saved=store.has(${JSON.stringify(KEY)})?JSON.parse(store.get(${JSON.stringify(KEY)})):null;
    console.log(JSON.stringify(out));`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,TZ:'Europe/Warsaw'}});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const cardOf=(html,id)=>{const s=html.indexOf(`<h3><button data-recipe="${id}"`);const a=html.lastIndexOf('<article',s);return html.slice(a,html.indexOf('</article>',s));};
const timeOf=card=>(plain(card).match(/◷ ([^<·]+?)(?: ·|<)/)||[])[1]?.trim();

// ---------- 1. Większa losowość ----------
test('1. Waga promocji złagodzona: min(3, 1 + 0,5 × liczba składników); okno powtórek 15 albo ~40% małej puli',()=>{
  assert.deepEqual([0,1,2,3,4,5,9].map(promoWeight),[1,1.5,2,2.5,3,3,3]);
  assert.equal(promoWeight(undefined),1);assert.equal(promoWeight(-2),1);
  assert.equal(RECENT_MAX,15);
  assert.deepEqual([0,1,2,3,4,5,10,20,37,38,40,100].map(recentWindow),[1,1,1,1,1,2,4,8,14,15,15,15]);
  // Statystycznie: 5 produktów w promocji (waga 3, limit) ≈ 3× częściej niż 0 — wcześniej ≈ 11×.
  const five=recipes.find(r=>new Set(r.ingredients.map(i=>i.product).filter(p=>!pantryProducts.includes(p))).size>=5), zero=recipes.find(r=>r.id==='owsianka-wodna');
  const offers=[...new Set(five.ingredients.map(i=>i.product))].filter(p=>!pantryProducts.includes(p)&&!zero.ingredients.some(i=>i.product===p)).map(p=>offer(p));
  let seed=5;const random=()=>{seed=(seed*1103515245+12345)>>>0;return seed/4294967296;};
  const c={[five.id]:0,[zero.id]:0};for(let i=0;i<20000;i++)c[weightedSurprise([five,zero],offers,new Date(NOW),{random}).id]++;
  const ratio=c[five.id]/c[zero.id];assert.ok(ratio>2.7&&ratio<3.3,`stosunek ${ratio.toFixed(2)}`);
});
test('1. secureRandom używa crypto.getRandomValues (wynik w [0, 1)), a bez niego Math.random; wstrzyknięte random zostaje deterministyczne',()=>{
  let calls=0;const fake={getRandomValues(a){calls++;a[0]=4294967295;return a;}};
  const v=secureRandom(fake);assert.equal(calls,1);assert.ok(v>=0&&v<1,String(v));
  assert.equal(secureRandom({getRandomValues(a){a[0]=0;return a;}}),0);
  for(const broken of [null,{},{getRandomValues(){throw new Error('x');}}]){const x=secureRandom(broken);assert.ok(x>=0&&x<1);}
  const pool=recipes.slice(0,10);
  assert.equal(weightedSurprise(pool,[],new Date(NOW),{random:()=>0}).id,pool[0].id);
  assert.equal(weightedSurprise(pool,[],new Date(NOW),{random:()=>0.95}).id,pool[9].id);
});
test('1. Aplikacja losuje przez crypto.getRandomValues i nie powtarza dań w oknie: 15 przy dużej puli, ~40% przy małej',()=>{
  const big=runApp({crypto:true,script:`click({id:'random'});out.draws=[shown()];for(let i=0;i<40;i++){click({id:'reroll'});out.draws.push(shown());}`});
  assert.ok(big.randomCalls>=41,`wywołania getRandomValues: ${big.randomCalls}`);
  const ids=big.draws.map(idByName);assert.ok(ids.every(Boolean));
  for(let i=0;i+16<=ids.length;i++)assert.equal(new Set(ids.slice(i,i+16)).size,16,`powtórka w oknie 16: ${ids.slice(i,i+16)}`);
  // Mała pula (desery do 15 min): okno = recentWindow(n).
  const pool=filterRecipes(recipes,{category:'dessert',maxTime:15}).map(r=>r.id), w=recentWindow(pool.length);
  assert.ok(pool.length>=3&&w>=1,`${pool.length}/${w}`);
  const small=runApp({crypto:true,script:`change({id:'category',value:'dessert'});change({id:'time',value:'15'});click({id:'random'});out.draws=[shown()];for(let i=0;i<20;i++){click({id:'reroll'});out.draws.push(shown());}`});
  const s=small.draws.map(idByName);assert.ok(s.every(id=>pool.includes(id)),s.join());
  for(let i=0;i+w+1<=s.length;i++)assert.equal(new Set(s.slice(i,i+w+1)).size,w+1,s.slice(i,i+w+1).join());
  assert.ok(new Set(s).size===pool.length,'w 21 losowaniach pojawia się każde danie z małej puli');
});

// ---------- 2. Czas w przedziałach ----------
test('2. timeBucket: ≤15 → 15 min, ≤30 → 30, ≤60 → 60, powyżej w górę do pełnych 30 min w godzinach',()=>{
  const cases=[[0,15,'min',15],[5,15,'min',15],[15,15,'min',15],[16,30,'min',30],[30,30,'min',30],[31,60,'min',60],[55,60,'min',60],[60,60,'min',60],
    [61,90,'h',1.5],[75,90,'h',1.5],[90,90,'h',1.5],[95,120,'h',2],[120,120,'h',2],[121,150,'h',2.5],[150,150,'h',2.5],[180,180,'h',3],[181,210,'h',3.5]];
  for(const [m,minutes,unit,value] of cases)assert.deepEqual(timeBucket(m),{minutes,unit,value},String(m));
  assert.deepEqual(timeBucket('abc'),{minutes:15,unit:'min',value:15});
  for(const r of recipes){const b=timeBucket(r.minutes);assert.ok(b.minutes>=r.minutes,r.id);assert.ok([15,30,60].includes(b.minutes)||b.minutes%30===0,r.id);}
  assert.equal(recipes.find(r=>r.id==='kakao').minutes,5,'dane bez zmian');
});
test('2. Karty i szczegóły pokazują czas w przedziałach (pl „1,5 h”, en „1.5 h”); filtr „Do 30 min” = dokładnie dania z etykietą 15 lub 30 min',()=>{
  const long=recipes.find(r=>r.minutes>60&&r.minutes<=90), longer=recipes.find(r=>r.minutes>120&&r.minutes<=150);
  const out=runApp({script:`out.all=el('#results').innerHTML;click({dataset:{recipe:${JSON.stringify(long.id)}}});out.detail=el('#detail').innerHTML;
    change({id:'time',value:'30'});out.thirty=el('#results').innerHTML;change({id:'time',value:'15'});out.fifteen=el('#results').innerHTML;
    change({id:'time',value:'60'});out.sixty=el('#results').innerHTML;change({id:'time',value:'over60'});out.over=el('#results').innerHTML;`});
  const labels=recipes.map(r=>[r.id,timeOf(cardOf(out.all,r.id))]);
  for(const [id,label] of labels)assert.match(label,/^(15|30|60) min$|^\d+(,5)? h$/,`${id}: ${label}`);
  assert.equal(timeOf(cardOf(out.all,'kakao')),'15 min');assert.equal(timeOf(cardOf(out.all,long.id)),'1,5 h');assert.equal(timeOf(cardOf(out.all,longer.id)),'2,5 h');
  assert.ok(plain(out.detail).includes('◷ 1,5 h · '),out.detail.slice(0,400));
  const ids=html=>[...html.matchAll(/<h3><button data-recipe="([^"]+)"/g)].map(m=>m[1]);
  const labelled=set=>labels.filter(([,l])=>set.includes(l)).map(([id])=>id);
  assert.deepEqual(ids(out.thirty),labelled(['15 min','30 min']));
  assert.deepEqual(ids(out.fifteen),labelled(['15 min']));
  assert.deepEqual(ids(out.sixty),labelled(['15 min','30 min','60 min']));
  assert.deepEqual(ids(out.over),labels.filter(([,l])=>l.endsWith(' h')).map(([id])=>id));
  assert.deepEqual(ids(out.thirty),filterRecipes(recipes,{maxTime:30}).map(r=>r.id));
  const en=runApp({lang:'en',script:`out.all=el('#results').innerHTML;`});
  assert.equal(timeOf(cardOf(en.all,long.id)),'1.5 h');assert.equal(timeOf(cardOf(en.all,'kakao')),'15 min');
  const de=runApp({lang:'de',script:`out.all=el('#results').innerHTML;`});
  assert.equal(timeOf(cardOf(de.all,longer.id)),'2,5 Std.');
});

// ---------- 3. Czyszczenie filtrów tylko czyści filtry ----------
test('3. „Wyczyść filtry” czyści wszystko, ale nie przenosi fokusu do wyszukiwarki, nie przewija i nie otwiera klawiatury',()=>{
  const out=runApp({saved:{...emptyState(),settings:{sort:'promotions'}},script:`input({id:'search',value:'zupa'});change({id:'category',value:'lunch'});change({id:'time',value:'30'});change({id:'diet',value:'vegetarian'});
    input({id:'exclude-input',value:'ceb'});key('exclude-input','Enter');
    globalThis.scrollY=900;const before=focused.length;out.heading=el('#results').innerHTML;
    click({id:'reset'});out.after=focused.slice(before);out.y=globalThis.scrollY;out.main=el('#main').innerHTML;out.results=el('#results').innerHTML;out.toast=el('#toast').textContent;`});
  assert.ok(out.heading.includes('<p role="status" id="results-count" tabindex="-1">'));
  assert.deepEqual(out.after.map(f=>f[0]),['#results-count'],'fokus na nagłówku wyników (przycisk zniknął)');
  assert.deepEqual(out.after[0][1],{preventScroll:true});
  assert.ok(!out.after.some(([s])=>['#search','#exclude-input'].includes(s)),'żadne pole tekstowe nie dostaje fokusu');
  assert.equal(out.y,900,'pozycja przewinięcia zachowana');
  assert.match(out.main,/<input id="search"[^>]*value=""/);assert.ok(!out.main.includes('class="exclusion-summary"'));
  assert.ok(out.results.includes('<option value="default" selected>'));assert.deepEqual(out.saved.settings,{sort:'default'});
  assert.equal(out.toast,'Wyczyszczono wszystkie filtry.');
  assert.equal([...out.results.matchAll(/<h3><button data-recipe/g)].length,recipes.length);
});
test('3. Każda ścieżka czyszczenia: przycisk w stanie pustym i „Wyczyść” wykluczeń — bez skoku i bez fokusu w polu tekstowym',()=>{
  const empty=runApp({script:`input({id:'search',value:'xyzxyz'});out.r=el('#results').innerHTML;globalThis.scrollY=700;const b=focused.length;click({id:'reset'});out.after=focused.slice(b);out.y=globalThis.scrollY;out.main=el('#main').innerHTML;`});
  assert.equal((empty.r.match(/id="reset"/g)||[]).length,1);
  assert.deepEqual(empty.after.map(f=>f[0]),['#results-count']);assert.equal(empty.after[0][1].preventScroll,true);assert.equal(empty.y,700);
  assert.match(empty.main,/<input id="search"[^>]*value=""/);
  const excl=runApp({script:`input({id:'exclude-input',value:'ceb'});key('exclude-input','Enter');input({id:'exclude-input',value:'czos'});key('exclude-input','Enter');
    globalThis.scrollY=640;const b=focused.length;click({id:'clear-exclusions'});out.after=focused.slice(b);out.y=globalThis.scrollY;out.main=el('#main').innerHTML;`});
  assert.deepEqual(excl.after.map(f=>f[0]),['.exclusions summary']);assert.equal(excl.after[0][1].preventScroll,true);assert.equal(excl.y,640);
  assert.ok(!excl.main.includes('class="exclusion-summary"'));
  // Usunięcie jednego wykluczenia: fokus na kolejnym chipie, bez skoku.
  const one=runApp({script:`input({id:'exclude-input',value:'ceb'});key('exclude-input','Enter');input({id:'exclude-input',value:'czos'});key('exclude-input','Enter');
    globalThis.scrollY=500;const b=focused.length;click({dataset:{unexclude:'onion'}});out.after=focused.slice(b);out.y=globalThis.scrollY;`});
  assert.deepEqual(one.after.map(f=>f[0]),['.exclusion-summary .exclude-chip']);assert.equal(one.y,500);
});
test('3. Reset z aktywnym filtrem, gdy przycisk nadal istnieje, zostawia na nim fokus (kod: najpierw #reset)',async()=>{
  const app=await src('app.js');
  assert.match(app,/if\(b\.id==='reset'\|\|b\.id==='reset-top'\)\{[^\n]*keepPlace\(catalog,\['#reset','#results-count'\]\)/);
  assert.ok(!/if\(b\.id==='reset'\)[^\n]*refocus\('#search'\)/.test(app));
  assert.match(app,/focus\(\{preventScroll:true\}\)/);
});

// ---------- 4. Produkty w promocji zamiast „%” ----------
test('4. Karta wymienia produkty w promocji („W promocji: jajko, masło, pomidor +1”), bez % na kartach, w szczegółach i w nawigacji',()=>{
  const out=runApp({offers:fixture,script:`out.html=el('#results').innerHTML;out.nav=el('#nav').innerHTML;click({dataset:{recipe:'jajecznica'}});out.detail=el('#detail').innerHTML;`});
  const card=plain(cardOf(out.html,'jajecznica'));
  assert.ok(card.includes('<p class="offer-tag">W promocji: jajko, masło, pomidor <span aria-hidden="true">+1</span><span class="sr-only">, chleb</span></p>'),card);
  for(const r of recipes){const c=cardOf(out.html,r.id);const tag=c.includes('offer-tag')?c.slice(c.indexOf('<p class="offer-tag">'),c.indexOf('</p>',c.indexOf('<p class="offer-tag">'))):'';assert.ok(!tag.includes('%'),r.id);assert.ok(!c.includes('<span aria-hidden="true">%</span>'),r.id);}
  assert.ok(!/salt|sól/i.test(card.slice(card.indexOf('offer-tag'))),'spiżarnia (sól) nie jest wymieniana');
  assert.ok(!out.nav.includes('>%<'));assert.ok(out.nav.includes('data-tab="offers"'));
  const d=plain(out.detail);
  for(const p of ['egg','butter','tomato','bread'])assert.ok(d.includes(`href="https://www.aldi.pl/produkty/${p}.html"`),p);
  assert.ok(d.includes('<span class="promo-price">1,99 zł</span> · Cena za kg · ALDI: Produkt egg'));
  assert.ok(!/<span[^>]*>%<\/span>/.test(d));
  // Po angielsku nazwy produktów w języku interfejsu.
  const en=runApp({lang:'en',offers:fixture,script:`out.html=el('#results').innerHTML;`});
  assert.ok(plain(cardOf(en.html,'jajecznica')).includes('<p class="offer-tag">On offer: egg, butter, tomato <span aria-hidden="true">+1</span>'),cardOf(en.html,'jajecznica'));
});
test('4. Nazwa produktu z procentem tłuszczu na karcie bez „%” („śmietana 18%” → „śmietana”), pełna nazwa w szczegółach',()=>{
  const r=recipes.find(x=>x.ingredients.some(i=>i.product==='sourcream')&&x.ingredients.filter(i=>!pantryProducts.includes(i.product)).length<=3)??recipes.find(x=>x.ingredients.some(i=>i.product==='sourcream'));
  const out=runApp({offers:[offer('sourcream')],script:`out.html=el('#results').innerHTML;click({dataset:{recipe:${JSON.stringify(r.id)}}});out.detail=el('#detail').innerHTML;`});
  assert.ok(plain(cardOf(out.html,r.id)).includes('<p class="offer-tag">W promocji: śmietana</p>'),cardOf(out.html,r.id));
  assert.ok(out.detail.includes(products.sourcream[0]));
});

// ---------- 5 + 10. Bez chorągiewek i bez innych ozdobników ----------
test('5/10. Girlanda chorągiewek usunięta, nagłówek oddziela zwykła cienka linia; żadnych ozdobnych pseudo-elementów',async()=>{
  const css=(await src('theme.css')).replace(/\/\*[\s\S]*?\*\//g,'');
  assert.doesNotMatch(css,/bunting/);assert.doesNotMatch(css,/header::after/);
  assert.match(css,/header\{[^}]*border-bottom:1px solid var\(--t-line\)/);
  assert.doesNotMatch(css,/::(before|after)/);
  const html=await src('index.html');assert.ok(!/bunting|girland/i.test(html));
  // Funkcjonalne elementy zostają: talerz z jedzeniem, emoji dań, ikony w nawigacji, obwódka fokusu.
  assert.match(css,/\.plate\{/);assert.match(css,/:focus-visible\{outline:3px solid var\(--t-focus\)/);
  const out=runApp({script:`out.main=el('#main').innerHTML;out.nav=el('#nav').innerHTML;out.results=el('#results').innerHTML;`});
  assert.ok(out.main.includes('<div class="plate">'));assert.ok(out.nav.includes('<span aria-hidden="true">⌂</span>'));
  assert.ok(out.results.includes('<span aria-hidden="true">🥣</span>')||/<div class="card-art[^"]*"><span aria-hidden="true">/.test(out.results));
});

// ---------- 6. Flagi przy językach ----------
test('6. Wybór języka: flaga emoji + nazwa własna (bez tłumaczenia nazwy), plakietka przy globie to flaga SVG obecnego języka',()=>{
  const want={pl:'🇵🇱 Polski',en:'🇬🇧 English',de:'🇩🇪 Deutsch',uk:'🇺🇦 Українська',fr:'🇫🇷 Français',da:'🇩🇰 Dansk',es:'🇪🇸 Español',it:'🇮🇹 Italiano'};
  assert.deepEqual(Object.fromEntries(languages.map(l=>[l.code,`${l.flag} ${l.name}`])),want);
  const colours={pl:'#dc143c',en:'#012169',de:'#ffce00',uk:'#0057b7',fr:'#0055a4',da:'#c8102e',es:'#f1bf00',it:'#009246'};
  const out=runApp({script:`out.badges={};out.lists={};for(const c of ${JSON.stringify(languageCodes)}){await change({id:'language',value:c});out.badges[c]=el('#lang').innerHTML;}`});
  for(const code of languageCodes){
    const html=out.badges[code], badge=html.slice(html.indexOf('<span class="lang-code"'),html.indexOf('</span>',html.indexOf('<span class="lang-code"'))+7);
    assert.ok(badge.startsWith('<span class="lang-code" aria-hidden="true"><svg class="flag" aria-hidden="true" focusable="false" viewBox="0 0 30 20"'),`${code}: ${badge}`);
    assert.ok(badge.includes(colours[code]),`${code}: kolor flagi`);
    assert.ok(!/>[A-Z]{2}</.test(badge),`${code}: bez kodu tekstowego`);
    for(const l of languages)assert.ok(html.includes(`<option value="${l.code}" lang="${l.code}" ${l.code===code?'selected':''}>${want[l.code]}</option>`),`${code}/${l.code}`);
    assert.ok(!html.includes(' — '),`${code}: bez „— ukraiński”`);
    assert.match(html,/<span class="sr-only">[^<]*Language<\/span>/,'nazwa dostępna wyboru zostaje');
  }
});

// ---------- 7. Tylko dwa motywy ----------
test('7. Przełącznik ma dwa przyciski (Jasny, Ciemny); pierwsza wizyta zapisuje motyw systemu; brak klucza themeAuto w słownikach',async()=>{
  const light=runApp({script:`out.lang=el('#lang').innerHTML;`});
  assert.equal((light.lang.match(/data-theme-mode=/g)||[]).length,2);
  assert.ok(light.lang.includes('data-theme-mode="light" aria-pressed="true"'));assert.ok(!light.lang.includes('data-theme-mode="auto"'));
  assert.ok(light.lang.includes('>Jasny<')&&light.lang.includes('>Ciemny<'));
  assert.equal(light.theme,'light');assert.equal(light.dataTheme,'light');
  const dark=runApp({dark:true,script:`out.lang=el('#lang').innerHTML;`});
  assert.equal(dark.theme,'dark');assert.equal(dark.dataTheme,'dark');assert.ok(dark.lang.includes('data-theme-mode="dark" aria-pressed="true"'));
  assert.ok(!('themeAuto' in messages));assert.equal(isKnownKey('themeAuto'),false);
  for(const code of languageCodes.filter(c=>c!=='pl')){const ui=(await import(`../src/i18n.${code}.js`)).messages;assert.ok(!('themeAuto' in ui),code);}
  const tm=await src('theme-mode.js');assert.ok(!tm.includes("'auto'")||tm.includes("Zapisane 'auto'"),'tryb auto usunięty z modułu');
  assert.doesNotMatch(await src('theme.css'),/prefers-color-scheme\s*:\s*dark\s*\)\s*\{/);
});

// ---------- 8. Etykiety nowych kuchni przed danymi ----------
test('8. Kuchnie: kolejność listy, etykiety (zakładka i karta) w polskim i wszystkich siedmiu językach; zakładki bez przepisów ukryte',async()=>{
  assert.deepEqual(cuisines,['polish','italian','german','french','japanese','indian','mexican','american','mediterranean','asian','chinese','thai','vietnamese','korean','spanish','portuguese','turkish','hungarian','ukrainian','georgian','british','scandinavian','latinamerican','african']);
  assert.deepEqual(['indian','mexican','american','mediterranean','asian'].map(c=>messages[c]),['Indyjska','Meksykańska','Amerykańska','Śródziemnomorska','Azjatycka']);
  assert.deepEqual(['indian','mexican','american','mediterranean','asian'].map(c=>messages[c+'Cuisine']),['Kuchnia indyjska','Kuchnia meksykańska','Kuchnia amerykańska','Kuchnia śródziemnomorska','Kuchnia azjatycka']);
  for(const code of languageCodes.filter(c=>c!=='pl')){
    const ui=(await import(`../src/i18n.${code}.js`)).messages;
    for(const c of cuisines)for(const k of [c,c+'Cuisine'])assert.ok(ui[k]?.trim(),`${code}: ${k}`);
    for(const k of ['hours','promoOn'])assert.ok(ui[k]?.trim(),`${code}: ${k}`);
    assert.ok(ui.promoOn.includes('{list}'),code);
    assert.equal(new Set(cuisines.map(c=>ui[c])).size,cuisines.length,`${code}: różne etykiety kuchni`);
  }
  const out=runApp({script:`out.tabs=el('#cuisine-tabs').innerHTML;`});
  for(const c of cuisines){const has=[...recipes,...extraRecipes('pl')].some(r=>(r.cuisine||'polish')===c);assert.equal(out.tabs.includes(`data-cuisine="${c}"`),has,c);}
});

// CNT-045: „Wyczyść listę” usuwa całą listę jednym kliknięciem; „Cofnij” w komunikacie przywraca ją.
test('Lista zakupów: jednym kliknięciem cała lista znika, „Cofnij” ją przywraca', () => {
  const saved={...emptyState(),shopping:[{id:'egg',product:'egg',amount:3,done:false},{id:'c1',name:'Kawa',done:true}]};
  const out=runApp({saved,script:`
    await click({dataset:{tab:'shopping'}});
    out.before=el('#main').innerHTML.includes('id="clear-all"');
    await click({id:'clear-all'});
    out.afterClear=JSON.parse(store.get(${JSON.stringify(KEY)})).shopping.length;
    out.toast=el('#toast').textContent;
    out.emptyShown=el('#main').innerHTML.includes('class="empty"');
    await click({id:'toast-undo'});`});
  assert.equal(out.before,true);
  assert.equal(out.afterClear,0);
  assert.equal(out.toast,messages.clearedAll);
  assert.equal(out.emptyShown,true);
  assert.deepEqual(out.saved.shopping.map(i=>i.id),['egg','c1']);
});
