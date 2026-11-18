// CNT-043: poprawki z listy właściciela (18.11.2026): filtr posiłku bez skoku na górę, nazwa w nagłówku w języku interfejsu,
// odświeżenie zostaje na zakładce, lista języków się chowa, wersje dania, serduszko w oknie (także wylosowanego) dania.
// Widok: app.js na atrapie DOM (jak ui-fixes.test.mjs), każdy scenariusz w osobnym procesie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { recipes, products } from '../src/recipes.pl.js';
import { filterRecipes, timeBucket, promoWeight, recentWindow, secureRandom, weightedSurprise, pantryProducts, RECENT_MAX } from '../src/domain.js';
import { emptyState, KEY } from '../src/storage.js';
import { messages, cuisines, languages, languageCodes, isKnownKey } from '../src/i18n.js';
import { messages as messagesEn } from '../src/i18n.en.js';

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
    const always=new Set(['#main','#results','#detail','#toast','#nav','#lang','#cuisine-tabs','#net-status','body','.exclusions','#footer-text','#privacy','.skip','.brand small','.brand','.brand-name','#filters-reset','meta[name="description"]']);
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

test('CNT-043: wybór rodzaju posiłku (przycisk i lista) nie przewija strony na górę i nie przerysowuje całego widoku',()=>{
  const out=runApp({script:`globalThis.scrollY=900;await click({dataset:{category:'dinner'}});out.y1=globalThis.scrollY;await change({id:'category',value:'dessert'});out.y2=globalThis.scrollY;out.ids=ids(el('#results').innerHTML);`});
  assert.equal(out.y1,900); assert.equal(out.y2,900);
  assert.ok(out.ids.length&&out.ids.every(id=>recipes.find(r=>r.id===id).category==='dessert'));
});
test('CNT-043: nazwa w nagłówku zmienia się z językiem interfejsu',()=>{
  const pl=runApp({script:`out.name=el('.brand-name').textContent;`}), en=runApp({lang:'en',script:`out.name=el('.brand-name').textContent;`}), de=runApp({lang:'de',script:`out.name=el('.brand-name').textContent;`});
  assert.equal(pl.name,'Co na talerz'); assert.equal(en.name,messagesEn.brandName); assert.notEqual(de.name,'Co na talerz');
});
test('CNT-043: po wyborze języka fokus nie wraca na listę wyboru (lista się chowa)',()=>{
  const out=runApp({lang:'en',script:''});
  assert.ok(!out.focused.some(([s])=>s==='#language'),JSON.stringify(out.focused));
});
test('CNT-043: wylosowane danie ma serduszko — dodaje i usuwa z ulubionych bez zamykania okna',()=>{
  const out=runApp({script:`await click({id:'random'});const html=el('#detail').innerHTML;out.has=/class="secondary detail-favorite[^"]*" data-favorite="([^"]+)"/.exec(html)?.[1];out.label=html.includes('Dodaj do ulubionych');
    await click({dataset:{favorite:out.has}});out.after=JSON.parse(JSON.stringify(globalThis.localStorage.getItem(${JSON.stringify(KEY)})));out.open=el('#detail').open;`});
  assert.ok(out.has); assert.ok(out.label); assert.ok(out.open);
  assert.ok(out.saved.favorites.includes(out.has));
});
test('CNT-043: okno pierogów ruskich proponuje inne wersje dania, a przycisk otwiera wybraną',()=>{
  const out=runApp({script:`await click({dataset:{recipe:'pierogi-ruskie'}});out.html=el('#detail').innerHTML;await click({dataset:{variant:'pierogi-z-owocami'}});out.now=shown();`});
  for(const id of ['pierogi-z-miesem','pierogi-z-kapusta-i-grzybami','pierogi-z-owocami']) assert.ok(out.html.includes(`data-variant="${id}"`),id);
  assert.ok(out.html.includes(messages.variantsTitle));
  assert.equal(out.now,recipes.find(r=>r.id==='pierogi-z-owocami').name);
});
test('CNT-044: odświeżenie zostaje na zakładce (adres), ale resetuje filtry, otwarty przepis i przewinięcie',async()=>{
  const app=await src('app.js');
  assert.match(app,/history\.replaceState/); assert.match(app,/function render\(\) \{ writeRoute\(\);/);
  assert.match(app,/const route=readRoute\(\); if\(route\.tab\)tab=route\.tab; shell\(\); render\(\); window\.scrollTo/);
  assert.match(app,/scrollRestoration='manual'/);
  assert.doesNotMatch(app,/sessionStorage/); assert.doesNotMatch(app,/openRecipe\(route/);
});
test('CNT-044: „Wyczyść filtry” jest także w panelu filtrów i czyści wszystkie filtry',()=>{
  const out=runApp({script:`await click({dataset:{category:'dinner'}});out.top=el('#filters-reset').innerHTML;await click({id:'reset-top'});out.after=el('#filters-reset').innerHTML;out.count=ids(el('#results').innerHTML).length;`});
  assert.match(out.top,/id="reset-top"/); assert.equal(out.after,''); assert.equal(out.count,recipes.length);
});
