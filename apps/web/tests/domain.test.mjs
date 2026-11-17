import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes, products } from '../src/recipes.pl.js';
import { categories, allergens, t } from '../src/i18n.js';
import { normalize, filterRecipes, surprise, addIngredients, matchingOffers, validOffer, localDate, isCurrentAutomaticOffer } from '../src/domain.js';
import { emptyState, validateState, load, save, KEY } from '../src/storage.js';
import { parseAldi, robotsDisallows } from '../scripts/offer-parser.mjs';
test('Katalog: unikalne ID, wszystkie kategorie, składniki i komplet instrukcji',()=>{
  assert.equal(recipes.length,110);assert.equal(new Set(recipes.map(r=>r.id)).size,110);
  for(const c of categories) assert.ok(recipes.some(r=>r.category===c));
  for(const r of recipes){assert.ok(r.steps.length>=3);assert.ok(r.minutes>0);assert.ok(r.servings>0);assert.ok(categories.includes(r.category));assert.ok(r.ingredients.every(i=>products[i.product]&&i.amount>0));assert.deepEqual([...r.allergens].sort(),[...new Set(r.ingredients.flatMap(i=>products[i.product][2]))].sort());if(r.vegan)assert.equal(r.vegetarian,true);}
  for(const a of allergens)assert.ok(t(a));
});
test('Wyszukiwanie ignoruje wielkość liter i polskie znaki',()=>{assert.equal(normalize(' ŁÓDŹ '),'lodz');assert.ok(filterRecipes(recipes,{query:'TWAROZEK'}).some(r=>r.id==='twarożek'));assert.ok(filterRecipes(recipes,{query:'ziemniaki'}).some(r=>r.id==='kurczak'));});
test('Filtry czasu, kategorii, diety i alergenów działają łącznie',()=>{const list=filterRecipes(recipes,{category:'dinner',maxTime:15,diet:'vegan',excluded:['gluten']});assert.deepEqual(list.map(r=>r.id),['salatka']);});
test('Wykluczenia obejmują także ukryty sezam w hummusie',()=>{assert.ok(!filterRecipes(recipes,{excluded:['sesame']}).some(r=>r.id==='hummus-kanapki'));});
test('Wykluczenie zwykłego składnika obejmuje wyszukiwanie i losowanie',()=>{const f={category:'lunch',excludedProducts:['onion']};assert.deepEqual(filterRecipes(recipes,f).map(r=>r.id),['kurczak','leniwe','makaron-z-twarogiem','jajka-w-sosie-koperkowym','spaghetti-aglio-e-olio','kotlet-schabowy','carbonara','mac-and-cheese']);assert.equal(surprise(recipes,f,null,()=>0).id,'kurczak');});
test('Losowanie respektuje filtry i unika poprzedniego wyniku',()=>{const f={category:'dessert',maxTime:15};// CNT-039: filtr czasu porównuje czas zaokrąglony (najmniej 15 min)
assert.equal(surprise(recipes,f,null,()=>0).id,'kakao');assert.equal(surprise(recipes,{category:'lunch',maxTime:5}),null);assert.notEqual(surprise(recipes,{},recipes[0].id,()=>0).id,recipes[0].id);});
test('Lista sumuje składniki i skaluje porcje bez zmiany wejścia',()=>{const r=recipes[0];const first=addIngredients([],r,4);first[0].done=true;const second=addIngredients(first,r,2);assert.equal(first[0].amount,200);assert.equal(second[0].amount,300);assert.equal(second[0].done,false);assert.equal(second.length,r.ingredients.length);});
test('Zapis i odczyt zachowują ulubione i stan zakupów',()=>{const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};const s=emptyState();s.favorites=['kakao'];s.shopping=addIngredients([],recipes[0],2);save(storage,s);assert.deepEqual(load(storage),s);memory.set(KEY,'{');assert.throws(()=>load(storage));});
test('Import odrzuca uszkodzone, nieznane i zduplikowane rekordy',()=>{assert.throws(()=>validateState({version:2}));assert.throws(()=>validateState({...emptyState(),favorites:['unknown']}));assert.throws(()=>validateState({...emptyState(),shopping:[{id:'x',product:'milk',amount:-1,done:false}]}));assert.throws(()=>validateState({...emptyState(),favorites:['kakao','kakao']}));});
const offer={id:'test',product:'apple',store:'Sklep testowy',price:2,until:'2026-11-15',source:'Dane testowe'};
test('Oferty mają cenę, źródło i poprawną datę',()=>{assert.ok(validOffer(offer));assert.ok(!validOffer({...offer,price:NaN}));assert.ok(!validOffer({...offer,source:''}));assert.ok(!validOffer({...offer,until:'2026-02-30'}));});
test('Wygasłe oferty nie trafiają do dopasowania',()=>{assert.equal(matchingOffers(recipes[0],[offer],'2026-11-16').length,0);assert.equal(matchingOffers(recipes[0],[offer],'2026-11-15').length,1);assert.equal(localDate(new Date(2026,10,15,23)),'2026-11-15');});
const now=new Date('2026-11-15T12:00:00Z');
test('Automatyczne oferty znikają po terminie i po 48 godzinach od odczytu',()=>{const o={...offer,from:'2026-11-14',fetchedAt:'2026-11-15T10:00:00Z',validUntil:'2026-11-15T22:59:59Z'};assert.ok(isCurrentAutomaticOffer(o,new Date('2026-11-15T12:00:00Z')));assert.ok(!isCurrentAutomaticOffer(o,new Date('2026-11-16T00:00:00Z')));assert.ok(!isCurrentAutomaticOffer({...o,fetchedAt:'2026-11-10T12:00:00Z'},now));});
const p={objectID:'1',name:'Pomidory malinowe',salesUnit:'Cena za kg',currentPrice:{priceValue:5,strikePrice:{strikePriceValue:7},validFrom:now.getTime()/1000-3600,validUntil:now.getTime()/1000+3600}};
const html=items=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{items}})}</script>`;
test('Bot odczytuje cenę, jednostkę, daty i pochodzenie',()=>{const parsed=parseAldi(html([p]),{source:'https://www.aldi.pl/',now});assert.equal(parsed.offers.length,1);assert.equal(parsed.offers[0].product,'tomato');assert.equal(parsed.offers[0].price,5);assert.equal(parsed.offers[0].unit,'Cena za kg');assert.equal(parsed.offers[0].fetchedAt,now.toISOString());});
test('Bot odrzuca przyszłe, wygasłe i niedatowane ceny oraz zwykłe ceny',()=>{for(const price of [{...p.currentPrice,validFrom:now.getTime()/1000+1},{...p.currentPrice,validUntil:now.getTime()/1000-1},{...p.currentPrice,validUntil:undefined},{...p.currentPrice,strikePrice:undefined}])assert.equal(parseAldi(html([{...p,currentPrice:price}]),{now}).offers.length,0);});
test('Bot nie dopasowuje nieznanych produktów i wykrywa zmianę struktury',()=>{assert.equal(parseAldi(html([{...p,name:'Ogórki małosolne'}]),{now}).offers.length,0);assert.throws(()=>parseAldi('<html>Blokada</html>',{now}));});
test('Bot usuwa duplikaty po ID produktu i dacie początku',()=>{assert.equal(parseAldi(html([p,p]),{now}).offers.length,1);});
test('robots.txt: grupy agentów, wzorce * i $ oraz brak reguł dla innych botów',()=>{
  const robots='User-agent: *\nUser-agent: InnyBot\nDisallow: /koszyk\nDisallow: /*.pdf$\n\nUser-agent: Obcy\nDisallow: /produkty/\n';
  assert.ok(robotsDisallows(robots,'/koszyk/1'));assert.ok(robotsDisallows(robots,'/gazetka/plik.pdf'));assert.ok(!robotsDisallows(robots,'/gazetka/plik.pdf.html'));
  assert.ok(!robotsDisallows(robots,'/produkty/owoce-i-warzywa/warzywa.html'));assert.ok(robotsDisallows('User-agent: *\nDisallow: /','/produkty/x.html'));assert.ok(!robotsDisallows('User-agent: *\nDisallow:','/produkty/x.html'));
});
test('Własny wpis nie może przejąć ID produktu, a nowe ilości są zaokrąglane',()=>{
  assert.throws(()=>validateState({...emptyState(),shopping:[{id:'milk',name:'Mleko owsiane',done:false}]}));
  const r={servings:3,ingredients:[{product:'milk',amount:100}]};assert.equal(addIngredients([],r,1)[0].amount,33.333);
  const withCustom=addIngredients([{id:'local-1',name:'Mleko',done:true}],recipes[0],2);assert.equal(withCustom[0].done,true);assert.doesNotThrow(()=>validateState({...emptyState(),shopping:withCustom}));
});

// CNT-040: pusta kategoria ALDI (np. „Serki wiejskie” 18.11.2026: nbHits 0) nie jest błędem struktury.
const algolia=results=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{pageProps:{algoliaState:{initialResults:{an_prd_pl_pl_products2:{results}}}}}})}</script>`;
test('Bot: pusta kategoria to poprawny odczyt z 0 produktów; brak wyników nadal jest błędem struktury',()=>{
  assert.deepEqual(parseAldi(algolia([{hits:[],nbHits:0}]),{now}),{offers:[],deals:[],productsSeen:0,unmapped:0,empty:true});
  assert.throws(()=>parseAldi(algolia([]),{now}),/Nie rozpoznano/);
  assert.throws(()=>parseAldi(algolia([{hits:[{foo:1}],nbHits:1}]),{now}),/Nie rozpoznano/);
  assert.throws(()=>parseAldi(algolia([{nbHits:0}]),{now}),/Nie rozpoznano/);
  assert.equal(parseAldi(algolia([{hits:[p],nbHits:1}]),{now}).offers.length,1);
});
