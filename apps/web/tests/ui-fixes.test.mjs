// CNT-034: poprawki po odbiorze na telefonie (17.11.2026, wieczór) — losowanie, porcje, wybór języka,
// czas powyżej 60 min, kuchnia na kartach, wyszukiwarka wykluczeń, grupy alergenów, pełne czyszczenie filtrów.
// Widok: app.js na atrapie DOM (jak surprise.test.mjs / promo-ui.test.mjs), każdy scenariusz w osobnym procesie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { recipes, products } from '../src/recipes.pl.js';
import { filterRecipes, addIngredients, parseServings, clampServings, TIME_OPTIONS, timeOption, suggestProducts, allergenProducts } from '../src/domain.js';
import { emptyState, validateState, KEY } from '../src/storage.js';
import { messages, allergens, cuisines } from '../src/i18n.js';

const url=p=>new URL(p,import.meta.url).href;
const src=name=>readFile(new URL('../src/'+name,import.meta.url),'utf8');
const byId=id=>recipes.find(r=>r.id===id);
const unesc=s=>String(s).replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const idByName=name=>recipes.find(r=>r.name===unesc(name))?.id;

// Atrapa DOM: elementy po selektorze (jak w pozostałych testach widoku), pola z value/validity, zdarzenia
// click/input/change/keydown przekazywane do zarejestrowanych procedur aplikacji.
function runApp({saved,lang,script}) {
  const code=`const els=new Map(),focused=[];
    const el=s=>{if(!els.has(s))els.set(s,{sel:s,innerHTML:'',textContent:'',value:'',open:false,attrs:{},classList:{add(){},remove(){}},showModal(){this.open=true},close(){this.open=false},focus(){focused.push(s)},addEventListener(){},removeEventListener(){},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},reportValidity(){const v=String(this.value);return v===''&&!this.attrs.required||/^\\d+$/.test(v)&&+v>=1&&+v<=20;},removeAttribute(k){delete this.attrs[k]},append(){},hidden:false,style:{},dataset:{}});return els.get(s);};
    const handlers={},store=new Map(${JSON.stringify(saved?[[KEY,JSON.stringify(saved)]]:[])});
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f,body:el('body'),documentElement:{lang:'pl',dir:'ltr'},title:''};
    Object.defineProperty(globalThis,'navigator',{value:{language:'pl-PL',languages:['pl-PL'],onLine:true},configurable:true});
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.CSS={escape:s=>String(s)};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,offers:[]})});
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,getAttribute:()=>null,...b})}});
    const change=t=>handlers.change({target:{dataset:{},closest:()=>null,...t}});
    // Pole liczby porcji: wartość jest i w atrapie elementu (#servings), i w zdarzeniu — jak w przeglądarce.
    const input=t=>{if(t.id&&t.value!==undefined)el('#'+t.id).value=t.value;return handlers.input({target:{dataset:{},validity:{valid:true},...el('#'+t.id),...t}});};
    const key=(id,k)=>{let prevented=false;handlers.keydown?.({key:k,target:{id,...el('#'+id)},preventDefault(){prevented=true},stopPropagation(){}});return prevented;};
    const detail=()=>el('#detail').innerHTML;
    const shown=()=>(detail().match(/<h2 id="detail-heading"[^>]*>([^<]*)<\\/h2>/)||[])[1];
    const ids=html=>[...html.matchAll(/<h3><button data-recipe="([^"]+)"/g)].map(m=>m[1]);
    const out={};
    ${lang?`await change({id:'language',value:${JSON.stringify(lang)}});`:''}
    ${script}
    out.focused=focused;out.saved=store.has(${JSON.stringify(KEY)})?JSON.parse(store.get(${JSON.stringify(KEY)})):null;
    console.log(JSON.stringify(out));`;
  const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  return JSON.parse(r.stdout);
}
const ids=html=>[...html.matchAll(/<h3><button data-recipe="([^"]+)"/g)].map(m=>m[1]);
const amountsIn=html=>Object.fromEntries([...html.matchAll(/data-amount="([^"]+)">([^<]*)</g)].map(m=>[m[1],m[2].replace(/[  ]/g,' ')]));

// ---------- 1. Porcje i losowanie: błędy znalezione w kodzie (każdy test był czerwony przed poprawką) ----------
test('Błąd 1: puste pole porcji dawało 0 i zapisywało na liście zakupów ilości 0 (każdy kolejny zapis się nie udawał)',()=>{
  const out=runApp({script:`click({dataset:{recipe:'owsianka'}});input({id:'servings',value:''});click({id:'add-shopping'});
    out.shopping=el('#nav').innerHTML;click({dataset:{favorite:'kakao'}});out.toast=el('#toast').textContent;out.oats=el('[data-amount="oats"]').textContent;`});
  // Nic nie trafia na listę z ilością 0, a zapis dalej działa (ulubione zapisane).
  assert.ok(!out.saved||out.saved.shopping.every(i=>i.amount>0),JSON.stringify(out.saved));
  assert.deepEqual(out.saved.favorites,['kakao']);
  assert.notEqual(out.toast,messages.storageError);
  assert.ok(!/^0 /.test(out.oats),`ilość po pustym polu: ${out.oats}`);
  // Funkcja domenowa nie dodaje zerowych/ujemnych/NaN ilości.
  for(const bad of [0,-1,NaN,undefined,'']) assert.deepEqual(addIngredients([],byId('owsianka'),bad),[],String(bad));
});
test('Błąd 2: ułamek lub liczba spoza 1–20 w polu porcji — bez cichego dodania złych ilości, komunikat przy polu',()=>{
  for(const value of ['2.5','0','21','-3','abc']){
    const out=runApp({script:`click({dataset:{recipe:'owsianka'}});input({id:'servings',value:${JSON.stringify(value)}});out.invalid=el('#servings').attrs['aria-invalid'];out.errorHidden=el('#servings-error').hidden;
      click({id:'add-shopping'});`});
    assert.equal(out.invalid,'true',value);assert.equal(out.errorHidden,false,value);
    assert.ok(!out.saved||!out.saved.shopping.length,`${value}: dodano ${JSON.stringify(out.saved?.shopping)}`);
  }
  assert.equal(parseServings('3'),3);assert.equal(parseServings(' 20 '),20);
  for(const bad of ['','0','21','2.5','1e1','-1','abc',null,undefined]) assert.equal(parseServings(bad),null,String(bad));
  assert.equal(clampServings(0),1);assert.equal(clampServings(99),20);assert.equal(clampServings(2.6),3);assert.equal(clampServings(NaN),1);
});
test('Błąd 3: „Wylosuj inne” wracało do domyślnej liczby porcji zamiast zachować wybraną',()=>{
  const out=runApp({script:`click({id:'random'});input({id:'servings',value:'4'});click({id:'reroll'});out.html=detail();out.name=shown();`});
  assert.match(out.html,/id="servings"[^>]*value="4"/);
  const r=byId(idByName(out.name)), a=amountsIn(out.html), first=r.ingredients[0];
  assert.ok(a[first.product].startsWith(String(first.amount*4/r.servings).replace('.',',')),`${first.product}: ${a[first.product]}`);
});
test('Błąd 4: przycisk „Zaskocz mnie” w nagłówku strony tylko przewijał, nie losował dania',()=>{
  const out=runApp({script:`out.hero=el('#main').innerHTML.slice(0,el('#main').innerHTML.indexOf('</section>'));click({id:'hero-random'});out.open=el('#detail').open;out.name=shown();out.html=detail();`});
  assert.ok(out.hero.includes('id="hero-random"'),'przycisk losowania w nagłówku');assert.ok(!out.hero.includes('href="#inspiration"'));
  assert.equal(out.open,true);assert.ok(idByName(out.name),out.name);assert.ok(out.html.includes('id="reroll"'));
});
test('Losowanie zgodne z widocznymi filtrami: wyszukiwanie, kuchnia, czas powyżej 60 min, wykluczenia; na zakładce Ulubione tylko ulubione',()=>{
  const out=runApp({saved:{...emptyState(),favorites:['makaron','spaghetti-aglio-e-olio','kakao']},script:`input({id:'search',value:'makaron'});click({dataset:{cuisine:'italian'}});click({id:'random'});out.draws=[shown()];
    for(let i=0;i<8;i++){click({id:'reroll'});out.draws.push(shown());}
    click({dataset:{tab:'favorites'}});click({id:'random'});out.fav=[shown()];for(let i=0;i<6;i++){click({id:'reroll'});out.fav.push(shown());}`});
  const expected=filterRecipes(recipes,{query:'makaron',cuisine:'italian'}).map(r=>r.id);
  for(const n of out.draws)assert.ok(expected.includes(idByName(n)),`${n} spoza filtrów (${expected})`);
  for(const n of out.fav)assert.ok(['makaron','spaghetti-aglio-e-olio'].includes(idByName(n)),`${n}: ulubione + filtry`);
});

// ---------- 5. Domyślnie 1 porcja, przyciski − / + ----------
test('Szczegóły: domyślnie 1 porcja, ilości przeliczone z recipe.servings; przyciski − i + z etykietami, granice 1–20',()=>{
  const r=byId('owsianka');
  const out=runApp({script:`click({dataset:{recipe:'owsianka'}});out.html=detail();
    click({id:'servings-dec'});out.afterDec=el('#servings').value;out.decDisabled=el('#servings-dec').attrs['aria-disabled'];
    click({id:'servings-inc'});click({id:'servings-inc'});out.afterInc=el('#servings').value;out.oats=el('[data-amount="oats"]').textContent;out.status=el('#servings-status').textContent;
    for(let i=0;i<30;i++)click({id:'servings-inc'});out.max=el('#servings').value;out.incDisabled=el('#servings-inc').attrs['aria-disabled'];
    input({id:'servings',value:'3'});click({id:'add-shopping'});
    click({dataset:{recipe:'owsianka'}});out.reopen=detail();`});
  assert.match(out.html,/<input id="servings" type="number"[^>]*min="1" max="20" step="1"[^>]*value="1"/);
  assert.match(out.html,/<button type="button" class="step" id="servings-dec" aria-controls="servings" aria-label="Zmniejsz liczbę porcji"[^>]*aria-disabled="true"/);
  assert.match(out.html,/<button type="button" class="step" id="servings-inc" aria-controls="servings" aria-label="Zwiększ liczbę porcji"/);
  assert.match(out.html,/<label for="servings">Porcje<\/label>/);
  assert.deepEqual(amountsIn(out.html),{oats:'50 g',milk:'200 ml',apple:'0,5 szt.',cinnamon:'0,25 łyżeczki'});
  assert.equal(r.servings,2,'dane bez zmian');
  assert.equal(out.afterDec,'1');assert.equal(out.decDisabled,'true');
  assert.equal(out.afterInc,'3');assert.equal(out.oats,'150 g');assert.equal(out.status,'3 porcje');
  assert.equal(out.max,'20');assert.equal(out.incDisabled,'true');
  // Lista zakupów dostaje wybraną liczbę porcji (3 z 2 w danych).
  assert.deepEqual(out.saved.shopping.map(i=>[i.product,i.amount]),[['oats',150],['milk',600],['apple',1.5],['cinnamon',0.75]]);
  // Ponowne otwarcie przepisu z karty: znów 1 porcja.
  assert.match(out.reopen,/id="servings"[^>]*value="1"/);
  // Wartości odżywcze nadal „na porcję” (niezależne od wybranej liczby porcji).
  assert.ok(out.html.includes('Wartości odżywcze na porcję'));
});
test('Porcje w przepisie przetłumaczonym (en): 1 serving, jednostki z liczbą mnogą',()=>{
  const out=runApp({lang:'en',script:`click({dataset:{recipe:'jajecznica'}});out.html=detail();click({id:'servings-inc'});out.status=el('#servings-status').textContent;out.bread=el('[data-amount="bread"]').textContent;`});
  assert.deepEqual(amountsIn(out.html),{egg:'2 pcs',butter:'5 g',tomato:'0.5 pcs',bread:'2 slices',salt:'0.13 tsp'});
  assert.ok(out.html.includes('aria-label="Fewer servings"'));assert.equal(out.status,'2 servings');assert.equal(out.bread,'4 slices');
});

// ---------- 2. Wybór języka w prawym górnym rogu, kompaktowy ----------
test('Wybór języka: kompaktowy (glob + kod), etykieta dostępna dla czytników, pole 44 px, w rogu nagłówka',async()=>{
  const out=runApp({script:`out.lang=el('#lang').innerHTML;`});
  assert.ok(out.lang.includes('<label for="language">'));
  assert.ok(out.lang.includes('<span class="sr-only">Język / Language</span>'));
  assert.ok(out.lang.includes('<span class="lang-code" aria-hidden="true">PL</span>'));
  const css=await src('styles.css'), block=css.slice(css.indexOf('/* CNT-034'));
  assert.ok(block.length>100,'blok CSS CNT-034 na końcu styles.css');
  assert.match(block,/\.lang-select select\{[^}]*height:44px/);assert.match(block,/\.lang-select label\{[^}]*height:3[6-9]px|\.lang-select label\{[^}]*height:40px/);
  assert.match(block,/header \.lang-picker\{[^}]*order:3/);
});

// ---------- 3. Czas: do 15/30/60, powyżej 60, bez limitu ----------
test('filterRecipes: minTime (powyżej 60 min) zgodny wstecz; opcje czasu w filtrze',()=>{
  const sample=[{id:'a',minutes:10},{id:'b',minutes:60},{id:'c',minutes:61},{id:'d',minutes:150}].map(r=>({name:r.id,category:'lunch',allergens:[],ingredients:[],...r}));
  const ids=f=>filterRecipes(sample,f).map(r=>r.id);
  assert.deepEqual(ids({}),['a','b','c','d']);assert.deepEqual(ids({maxTime:60}),['a','b']);assert.deepEqual(ids({minTime:61}),['c','d']);
  assert.deepEqual(ids({maxTime:'15'}),['a']);assert.deepEqual(ids({minTime:'61',maxTime:0}),['c','d']);assert.deepEqual(ids({minTime:0,maxTime:0}),['a','b','c','d']);
  assert.deepEqual(Object.keys(TIME_OPTIONS),['0','15','30','60','over60']);assert.deepEqual(TIME_OPTIONS.over60,{maxTime:0,minTime:61});
  assert.equal(timeOption({maxTime:30}),'30');assert.equal(timeOption({minTime:61}),'over60');assert.equal(timeOption({}),'0');
  const out=runApp({script:`out.bar=el('#main').innerHTML;change({id:'time',value:'over60'});out.over=ids(el('#results').innerHTML);out.bar2=el('#main').innerHTML;change({id:'time',value:'60'});out.sixty=ids(el('#results').innerHTML);`});
  const sel=out.bar.slice(out.bar.indexOf('<select id="time">'),out.bar.indexOf('</select>',out.bar.indexOf('<select id="time">')));
  assert.deepEqual([...sel.matchAll(/<option value="([^"]+)"[^>]*>([^<]+)</g)].map(m=>[m[1],m[2]]),[['15','Do 15 min'],['30','Do 30 min'],['60','Do 60 min'],['over60','Powyżej 60 min'],['0','Bez limitu']]);
  assert.ok(out.bar.includes('Czas przygotowania<select id="time">'));
  assert.deepEqual(out.over,recipes.filter(r=>r.minutes>60).map(r=>r.id));
  assert.deepEqual(out.sixty,recipes.filter(r=>r.minutes<=60).map(r=>r.id));
});

// ---------- 4. Kuchnia na kartach zamiast „DOMOWA KUCHNIA” ----------
test('Karty pokazują kuchnię dania (np. „Kuchnia włoska”), nie wspólną etykietę „DOMOWA KUCHNIA”; zakładki kuchni działają także w Ulubionych',()=>{
  const out=runApp({saved:{...emptyState(),favorites:['makaron','owsianka']},script:`out.html=el('#results').innerHTML;out.tabs=el('#cuisine-tabs').innerHTML;out.hidden=el('#cuisine-tabs').hidden;
    click({dataset:{tab:'favorites'}});out.favTabs=el('#cuisine-tabs').innerHTML;out.favHidden=el('#cuisine-tabs').hidden;click({dataset:{cuisine:'italian'}});out.fav=ids(el('#results').innerHTML);
    click({dataset:{recipe:'makaron'}});out.detail=detail();`});
  assert.ok(!out.html.includes('DOMOWA KUCHNIA'));assert.ok(!('cardSeries' in messages));
  const card=id=>{const s=out.html.indexOf(`<h3><button data-recipe="${id}"`);return out.html.slice(s,out.html.indexOf('</article>',s));};
  assert.ok(card('makaron').includes('<span class="card-cuisine">Kuchnia włoska</span>'),card('makaron'));
  assert.ok(card('owsianka').includes('<span class="card-cuisine">Kuchnia polska</span>'));
  assert.ok(card('tamagoyaki').includes('Kuchnia japońska'));
  for(const c of cuisines)assert.ok(messages[c+'Cuisine'],c);
  assert.equal(out.hidden,false);for(const c of cuisines)assert.ok(out.tabs.includes(`data-cuisine="${c}"`),c);
  assert.equal(out.favHidden,false);assert.ok(out.favTabs.includes('data-cuisine="italian"'));assert.ok(!out.favTabs.includes('data-cuisine="japanese"'));
  assert.deepEqual(out.fav,['makaron']);
  assert.ok(out.detail.includes('· Kuchnia włoska'));
});

// ---------- 6. Wyszukiwarka wykluczanych składników (combobox) ----------
test('suggestProducts: dopasowanie w języku UI i po polsku, najpierw początek nazwy, pomija wykluczone',()=>{
  assert.deepEqual(suggestProducts('ceb'),['onion']);
  assert.deepEqual(suggestProducts('mak'),['flour','potatostarch','pasta','mackerel'],'„mąka”, „makaron”, „makrela” — bez polskich znaków też');
  assert.deepEqual(suggestProducts('CEBULA',{skip:['onion']}),[]);assert.deepEqual(suggestProducts(''),[]);
  const en={onion:'Onion',pasta:'Wheat pasta (egg-free)'};
  assert.deepEqual(suggestProducts('onio',{nameOf:id=>en[id]??products[id][0]}),['onion']);
  assert.deepEqual(suggestProducts('cebu',{nameOf:id=>en[id]??products[id][0]}),['onion'],'polska nazwa działa także w innym języku');
  assert.ok(suggestProducts('a').length<=8);
});
test('Wyszukiwarka wykluczeń: zamiast listy pól wyboru combobox; wpisz → podpowiedzi → Enter → chip „× Cebula”; strzałki, Esc, komunikaty',()=>{
  const out=runApp({script:`out.bar=el('#main').innerHTML;
    input({id:'exclude-input',value:'ceb'});out.list=el('#exclude-options').innerHTML;out.listHidden=el('#exclude-options').hidden;out.expanded=el('#exclude-input').attrs['aria-expanded'];out.status=el('#exclude-status').textContent;
    out.down=key('exclude-input','ArrowDown');out.active=el('#exclude-input').attrs['aria-activedescendant'];
    out.enter=key('exclude-input','Enter');out.after=el('#main').innerHTML;out.results=ids(el('#results').innerHTML);out.toast=el('#toast').textContent;
    input({id:'exclude-input',value:'xyz'});out.none=el('#exclude-status').textContent;out.noneVisible=el('#exclude-empty').hidden;
    input({id:'exclude-input',value:'pom'});out.esc=key('exclude-input','Escape');out.escHidden=el('#exclude-options').hidden;out.escExpanded=el('#exclude-input').attrs['aria-expanded'];
    input({id:'exclude-input',value:'czos'});click({dataset:{excludeProduct:'garlic'}});out.two=el('#main').innerHTML;out.twoResults=ids(el('#results').innerHTML);
    click({dataset:{unexclude:'onion'}});out.back=ids(el('#results').innerHTML);out.backHtml=el('#main').innerHTML;`});
  assert.ok(!out.bar.includes('product-checks'),'długa lista pól wyboru produktów usunięta');
  assert.match(out.bar,/<label for="exclude-input">Wyklucz produkt<\/label>/);
  assert.match(out.bar,/<input id="exclude-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="exclude-options"/);
  assert.match(out.bar,/<ul id="exclude-options" role="listbox"[^>]*hidden><\/ul>/);
  assert.ok(out.list.includes('<li role="option" id="exclude-opt-onion" data-exclude-product="onion" aria-selected="false">Cebula</li>'),out.list);
  assert.equal(out.listHidden,false);assert.equal(out.expanded,'true');assert.equal(out.status,'1 podpowiedź');
  assert.equal(out.down,true);assert.equal(out.active,'exclude-opt-onion');assert.equal(out.enter,true);
  assert.ok(out.after.includes('<button class="exclude-chip" data-unexclude="onion" aria-label="Usuń wykluczenie: Cebula"><span aria-hidden="true">×</span> Cebula</button>'));
  assert.deepEqual(out.results,filterRecipes(recipes,{excludedProducts:['onion']}).map(r=>r.id));
  assert.equal(out.toast,'Wykluczono: Cebula');
  assert.equal(out.none,'Nie ma takiego produktu w przepisach.');assert.equal(out.noneVisible,false);
  assert.equal(out.esc,true);assert.equal(out.escHidden,true);assert.equal(out.escExpanded,'false');
  assert.ok(out.two.includes('data-unexclude="garlic"'));assert.deepEqual(out.twoResults,filterRecipes(recipes,{excludedProducts:['onion','garlic']}).map(r=>r.id));
  assert.deepEqual(out.back,filterRecipes(recipes,{excludedProducts:['garlic']}).map(r=>r.id));assert.ok(!out.backHtml.includes('data-unexclude="onion"'));
  assert.ok(out.focused.includes('#exclude-input'),'fokus zostaje w wyszukiwarce po wyborze');
});
test('Wyszukiwarka wykluczeń po angielsku dopasowuje nazwy angielskie i polskie',()=>{
  const out=runApp({lang:'en',script:`input({id:'exclude-input',value:'onio'});out.en=el('#exclude-options').innerHTML;input({id:'exclude-input',value:'cebu'});out.pl=el('#exclude-options').innerHTML;`});
  assert.ok(out.en.includes('data-exclude-product="onion"'));assert.ok(out.pl.includes('data-exclude-product="onion"'));
});

// ---------- 7. Grupy alergenów ----------
test('Grupy alergenów jako przełączniki z podpowiedzią produktów; wybór wyklucza przepisy z tym alergenem; wspólne podsumowanie z jednym „Wyczyść”',()=>{
  assert.deepEqual(allergenProducts('gluten').slice(0,3),['oats','bread','pasta']);
  const out=runApp({script:`out.bar=el('#main').innerHTML;
    globalThis.document.querySelectorAll=s=>s==='.checks input:checked'?[{value:'gluten'}]:[];change({id:'',value:'gluten',closest:s=>s==='.checks'?{}:null});globalThis.document.querySelectorAll=()=>[];
    out.results=ids(el('#results').innerHTML);
    input({id:'exclude-input',value:'ceb'});key('exclude-input','Enter');out.summary=el('#main').innerHTML;
    click({id:'clear-exclusions'});out.cleared=el('#main').innerHTML;out.all=ids(el('#results').innerHTML);`});
  for(const a of allergens)assert.ok(out.bar.includes(`<input type="checkbox" value="${a}" aria-describedby="allergen-hint-${a}"`),a);
  assert.ok(out.bar.includes('<span class="chip-hint" id="allergen-hint-gluten">np. płatki owsiane · chleb · makaron pszenny bez jajek…</span>'),out.bar.slice(out.bar.indexOf('allergen-hint-gluten'),out.bar.indexOf('allergen-hint-gluten')+200));
  assert.ok(out.bar.includes('id="allergen-hint-nuts">brak w obecnych przepisach</span>'));
  assert.deepEqual(out.results,recipes.filter(r=>!r.allergens.includes('gluten')).map(r=>r.id));
  assert.ok(out.results.every(id=>!byId(id).ingredients.some(i=>products[i.product][2].includes('gluten'))));
  const sum=out.summary.slice(out.summary.indexOf('class="exclusion-summary"'));
  assert.ok(sum.includes('data-unexclude-allergen="gluten" aria-label="Usuń wykluczenie: Gluten"'));assert.ok(sum.includes('data-unexclude="onion"'));
  assert.equal((sum.match(/id="clear-exclusions"/g)||[]).length,1);assert.ok(sum.includes('aria-label="Wyczyść wszystkie wykluczenia">Wyczyść</button>'));
  assert.ok(!out.cleared.includes('class="exclusion-summary"'));assert.equal(out.all.length,recipes.length);
});

// ---------- 8. „Wyczyść filtry” czyści wszystko, także kolejność promocyjną ----------
test('„Wyczyść filtry”: zapytanie, posiłek, kuchnia, czas, dieta, alergeny, produkty i kolejność; przycisk widoczny przy każdym aktywnym filtrze',()=>{
  const out=runApp({saved:{...emptyState(),settings:{sort:'promotions',showNutrition:false}},script:`out.start=el('#results').innerHTML;
    input({id:'search',value:'zupa'});change({id:'category',value:'lunch'});click({dataset:{cuisine:'polish'}});change({id:'time',value:'30'});change({id:'diet',value:'vegetarian'});
    globalThis.document.querySelectorAll=s=>s==='.checks input:checked'?[{value:'milk'}]:[];change({id:'',value:'milk',closest:s=>s==='.checks'?{}:null});globalThis.document.querySelectorAll=()=>[];
    input({id:'exclude-input',value:'ceb'});key('exclude-input','Enter');
    out.active=el('#results').innerHTML;
    click({id:'reset'});out.main=el('#main').innerHTML;out.results=el('#results').innerHTML;out.toast=el('#toast').textContent;`});
  assert.ok(out.start.includes('id="reset"'),'sama kolejność promocyjna to aktywny filtr — przycisk widoczny');
  assert.ok(out.active.includes('id="reset"'));
  assert.deepEqual(ids(out.results),recipes.map(r=>r.id));
  assert.match(out.main,/<input id="search"[^>]*value=""/);
  assert.match(out.main,/<option value="0" selected>Bez limitu<\/option>/);
  const cat=out.main.slice(out.main.indexOf('<select id="category">'),out.main.indexOf('</select>',out.main.indexOf('<select id="category">')));assert.ok(cat&&!cat.includes('selected'),'rodzaj posiłku: Wszystkie');
  assert.ok(out.main.includes('<button data-category="" aria-pressed="true">'));
  assert.match(out.main,/<option value="" selected>Bez preferencji<\/option>/);
  assert.ok(!out.main.includes('checked> Mleko'));assert.ok(!out.main.includes('class="exclusion-summary"'));
  assert.ok(out.results.includes('<option value="default" selected>'));assert.ok(!out.results.includes('id="reset"'),'po wyczyszczeniu nie ma czego czyścić');
  assert.deepEqual(out.saved.settings,{showNutrition:false,sort:'default'},'kolejność zapisana jako domyślna, inne ustawienia bez zmian');
  assert.equal(out.toast,'Wyczyszczono wszystkie filtry.');
  assert.ok(out.focused.includes('#search'));
  // Bez wyników: przycisk w stanie pustym (jeden #reset).
  const none=runApp({script:`input({id:'search',value:'xyzxyz'});out.r=el('#results').innerHTML;`});
  assert.equal((none.r.match(/id="reset"/g)||[]).length,1);
  // Stare dane wczytują się bez zmian.
  assert.deepEqual(validateState({version:1,favorites:[],shopping:[],offers:[]}),emptyState());
});

// ---------- 9. Teksty przez słownik, bez wpisanych na stałe polskich napisów ----------
test('Nowe teksty są w słowniku (pl) i w angielskim; app.js nie zawiera ich na stałe',async()=>{
  const en=(await import('../src/i18n.en.js')).messages, app=await src('app.js');
  for(const k of ['prepTime','timeUpTo','timeOver','servingsDecrease','servingsIncrease','servingsInvalid','excludeSearch','excludeHelp','excludeNoMatch','excludedAdded','removeExclusion','clearExclusions','clearExclusionsLabel','allergenExamples','allergenNone','filtersCleared','servingsCount_other','suggestions_other']){
    assert.ok(messages[k],k);assert.ok(en[k],`en ${k}`);const fixed=messages[k].split('{')[0].trim();if(!k.includes('_')&&fixed.length>=8)assert.ok(!app.includes(fixed),`„${messages[k]}” wpisane w app.js`);
  }
});
