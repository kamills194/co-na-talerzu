// CNT-029 (rozszerzenie): losowanie ważone promocjami i „Wylosuj inne”.
// Losowanie testowane deterministycznie (PRNG z ziarnem); widok — app.js na atrapie DOM (jak market.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { recipes } from '../src/recipes.pl.js';
import { weightedSurprise, promoCoverage, filterRecipes } from '../src/domain.js';
import { emptyState, KEY } from '../src/storage.js';

const url=p=>new URL(p,import.meta.url).href;
// mulberry32 — prosty generator z ziarnem, wynik w [0, 1).
const seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const NOW=new Date('2026-11-17T12:00:00.000Z');
const offer=(product,patch={})=>({id:`t-${product}`,product,store:'ALDI',price:1.99,from:'2026-11-16',until:'2026-11-20',validUntil:'2026-11-20T22:59:59.000Z',
  source:`https://www.aldi.pl/produkty/${product}.html`,fetchedAt:'2026-11-17T10:00:00.000Z',name:`Produkt ${product}`,unit:'Cena za kg',conditions:'Z kartą',
  market:'PL',currency:'PLN',scope:{type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'},...patch});
const byId=id=>recipes.find(r=>r.id===id);
// jajecznica: jajko, masło, pomidor, chleb, sól → 3 składniki w promocji; owsianka-wodna: płatki, woda, banan, cynamon → 0.
const offers=['egg','butter','tomato'].map(p=>offer(p));
const count=(draw,n,ids)=>{const c=Object.fromEntries(ids.map(i=>[i,0]));for(let i=0;i<n;i++)c[draw().id]++;return c;};

test('weightedSurprise: waga 1 + 2 × liczba składników w promocji (3 składniki ≈ 7× częściej niż 0)',()=>{
  const three=byId('jajecznica'), zero=byId('owsianka-wodna');
  assert.equal(promoCoverage(three,offers,NOW).count,3);assert.equal(promoCoverage(zero,offers,NOW).count,0);
  const random=seeded(2026);
  const c=count(()=>weightedSurprise([three,zero],offers,NOW,{random}),10000,[three.id,zero.id]);
  const ratio=c[three.id]/c[zero.id];
  assert.ok(ratio>6&&ratio<8,`stosunek ${ratio.toFixed(2)} (${c[three.id]}:${c[zero.id]})`);
  assert.ok(c[zero.id]>0,'danie bez promocji zachowuje szansę');
  // Deterministycznie: to samo ziarno → ta sama sekwencja.
  const a=seeded(7),b=seeded(7);
  assert.deepEqual(Array.from({length:50},()=>weightedSurprise(recipes,offers,NOW,{random:a}).id),Array.from({length:50},()=>weightedSurprise(recipes,offers,NOW,{random:b}).id));
});
test('weightedSurprise: bez aktualnych ofert losowanie jednostajne; oferty wygasłe się nie liczą',()=>{
  const pool=recipes.slice(0,4), ids=pool.map(r=>r.id);
  for(const off of [[],offers.map(o=>({...o,validUntil:'2026-11-17T10:30:00.000Z',until:'2026-11-17'}))]){
    const random=seeded(11);
    const c=count(()=>weightedSurprise(pool,off,NOW,{random}),10000,ids);
    for(const id of ids)assert.ok(Math.abs(c[id]-2500)<200,`${id}: ${c[id]}`);
  }
});
test('weightedSurprise: exclude jest respektowane; pusta pula → null; zwraca ten sam obiekt',()=>{
  const pool=recipes.slice(0,6), random=seeded(3);
  for(let i=0;i<2000;i++){const r=weightedSurprise(pool,offers,NOW,{random,exclude:['owsianka','jajecznica']});assert.ok(!['owsianka','jajecznica'].includes(r.id));assert.ok(pool.includes(r));}
  assert.equal(weightedSurprise(pool,offers,NOW,{exclude:pool.map(r=>r.id)}),null);
  assert.equal(weightedSurprise([],offers,NOW),null);assert.equal(weightedSurprise(undefined,offers,NOW),null);
  assert.equal(weightedSurprise([byId('kakao')],[],NOW,{random:()=>0.9999999}).id,'kakao');
  assert.equal(weightedSurprise([byId('kakao')],[],NOW,{random:()=>1}).id,'kakao','wartość spoza [0,1) nie psuje wyniku');
});

function runApp({saved,script}) {
  const code=`const R=Date;let NOW=R.parse(${JSON.stringify(NOW.toISOString())});globalThis.Date=class extends R{constructor(...a){a.length?super(...a):super(NOW)}static now(){return NOW}};
    const els=new Map(),focused=[],el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){}},showModal(){this.open=true},close(){this.open=false},focus(){focused.push(s)},addEventListener(){},removeEventListener(){},setAttribute(){},removeAttribute(){},append(){},hidden:false,style:{},dataset:{}});return els.get(s);};
    const handlers={},store=new Map(${JSON.stringify(saved?[[KEY,JSON.stringify(saved)]]:[])});
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f,body:el('body')};
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.CSS={escape:s=>String(s)};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,offers:${JSON.stringify(offers)}})});
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,...b})}});
    const change=t=>handlers.change({target:{dataset:{},closest:()=>null,...t}});
    const input=t=>handlers.input({target:{dataset:{},validity:{valid:true},...t}});
    const shown=()=>{const h=el('#detail').innerHTML;return {name:(h.match(/<h2 id="detail-heading">([^<]*)<\\/h2>/)||[])[1],reroll:h.includes('id="reroll"'),disabled:/id="reroll" disabled/.test(h),hint:h.includes('id="reroll-hint"')};};
    const out={};
    ${script}
    out.focused=focused;console.log(JSON.stringify(out));`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const idByName=name=>recipes.find(r=>r.name===name.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&'))?.id;

test('„Wylosuj inne” jest tylko po „Zaskocz mnie”, losuje inne danie i oddaje fokus przyciskowi',()=>{
  const out=runApp({script:`click({dataset:{recipe:'owsianka'}});out.card=shown();
    click({id:'random'});out.first=shown();out.draws=[out.first.name];
    for(let i=0;i<12;i++){click({id:'reroll'});out.draws.push(shown().name);}
    out.last=shown();`});
  assert.equal(out.card.reroll,false,'z karty bez przycisku');
  assert.equal(out.first.reroll,true);assert.equal(out.first.disabled,false);
  const ids=out.draws.map(idByName);assert.ok(ids.every(Boolean),JSON.stringify(out.draws));
  for(let i=1;i<ids.length;i++)assert.notEqual(ids[i],ids[i-1],`powtórka pod rząd: ${ids[i]}`);
  // 70 kandydatów: w każdym oknie 6 kolejnych losowań brak powtórek (ostatnie 5 jest pomijane).
  for(let i=0;i+6<=ids.length;i++)assert.equal(new Set(ids.slice(i,i+6)).size,6,ids.slice(i,i+6).join(','));
  assert.equal(out.focused.filter(s=>s==='#reroll').length,12,'fokus wraca na „Wylosuj inne” po każdym losowaniu');
  assert.equal(out.last.reroll,true);
});
test('„Wylosuj inne” respektuje filtry (posiłek, kuchnia, dieta, czas, wykluczenia, ulubione); 2 kandydatów — zawsze ten drugi',()=>{
  const flt={category:'breakfast',cuisine:'polish',diet:'vegetarian',maxTime:15};
  const expected=filterRecipes(recipes,{...flt,excluded:['eggs']}).map(r=>r.id);
  assert.ok(expected.length>=2,expected.join());
  const out=runApp({script:`change({id:'category',value:'breakfast'});click({dataset:{cuisine:'polish'}});change({id:'diet',value:'vegetarian'});change({id:'time',value:'15'});
    globalThis.document.querySelectorAll=s=>s==='.checks input:checked'?[{value:'eggs'}]:[];change({id:'x',closest:s=>s==='.checks'?{}:null});globalThis.document.querySelectorAll=()=>[];
    click({id:'random'});out.draws=[shown().name];for(let i=0;i<20;i++){click({id:'reroll'});out.draws.push(shown().name);}`});
  for(const n of out.draws)assert.ok(expected.includes(idByName(n)),`${n} spoza filtrów`);
  // Ulubione: losowanie tylko z ulubionych; przy dwóch kandydatach zawsze na zmianę.
  const fav=runApp({saved:{...emptyState(),favorites:['kakao','omlet']},script:`click({dataset:{tab:'favorites'}});click({id:'random'});out.draws=[shown().name];out.first=shown();
    for(let i=0;i<9;i++){click({id:'reroll'});out.draws.push(shown().name);}`});
  const favIds=fav.draws.map(idByName);
  assert.ok(favIds.every(id=>['kakao','omlet'].includes(id)),favIds.join());assert.equal(fav.first.disabled,false);
  for(let i=1;i<favIds.length;i++)assert.notEqual(favIds[i],favIds[i-1]);
});
test('Jeden kandydat: przycisk wyłączony z krótką podpowiedzią; brak kandydatów — komunikat zamiast okna',()=>{
  const out=runApp({script:`input({id:'search',value:'Tamagoyaki'});click({id:'random'});out.one=shown();out.html=el('#detail').innerHTML;
    click({id:'reroll'});out.after=shown();input({id:'search',value:'xyzxyz'});el('#detail').innerHTML='';click({id:'random'});out.none=el('#detail').innerHTML;out.toast=el('#toast').textContent;`});
  assert.equal(idByName(out.one.name),'tamagoyaki');assert.equal(out.one.reroll,true);assert.equal(out.one.disabled,true);assert.equal(out.one.hint,true);
  assert.ok(out.html.includes('To jedyny przepis pasujący do wybranych filtrów.'));assert.ok(out.html.includes('aria-describedby="reroll-hint"'));
  assert.equal(idByName(out.after.name),'tamagoyaki');
  assert.equal(out.none,'');assert.equal(out.toast,'Brak pasującego przepisu. Zmień filtry i spróbuj ponownie.');
});
test('Pole kolejności: krótka etykieta „Promocje najpierw”, opisowa nazwa dostępna',()=>{
  const out=runApp({script:`out.html=el('#results').innerHTML;`});
  assert.ok(out.html.includes('aria-label="Promocje najpierw — Najwięcej składników w promocji" title="Najwięcej składników w promocji">Promocje najpierw</option>'));
});
