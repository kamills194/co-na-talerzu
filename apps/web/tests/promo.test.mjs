// CNT-027 / CNT-028 / CNT-029: mapa produktów parsera, ranking przepisów według promocji,
// oferta przy składniku. Oferty syntetyczne, stała chwila `now`, bez zależności od strefy urządzenia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { products, recipes } from '../src/recipes.pl.js';
import { data as bot } from '../src/recipes.bot.pl.js';
import { promoCoverage, rankByPromotions, ingredientOffers, pantryProducts, safeOfferUrl, isDisplayableAutomaticOffer } from '../src/domain.js';
import { productRules, excludedProducts, matchProduct, parseAldi, extraSources } from '../scripts/offer-parser.mjs';

// ---------- A. Mapa produktów (CNT-028) ----------
test('Mapa: każdy produkt katalogu jest zmapowany albo jawnie wyłączony z powodem',()=>{
  const mapped=productRules.map(([id])=>id);
  assert.equal(new Set(mapped).size,mapped.length,'produkt zmapowany dwukrotnie');
  for(const id of [...mapped,...excludedProducts.keys()]) assert.ok(id in products,`nieznany produkt ${id}`);
  for(const id of Object.keys(products)) assert.ok(mapped.includes(id)!==excludedProducts.has(id),`${id}: brak mapy lub mapa i wyłączenie jednocześnie`);
  for(const [id,reason] of excludedProducts) assert.ok(typeof reason==='string'&&reason.length>=10,`${id}: brak powodu`);
  assert.deepEqual([...excludedProducts.keys()].filter(id=>!(id in bot.products)).sort(),['salt','water']);
});

const positive=[
  ['Pomidory malinowe','tomato'],['pomidor malinowy','tomato'],['POMIDORY','tomato'],['Pomidorki koktajlowe','tomato'],['Pomidor','tomato'],
  ['Ogórki szklarniowe','cucumber'],['Ogórek gruntowy','cucumber'],['Ziemniaki jadalne sałatkowe','potato'],['Ziemniaki młode','potato'],
  ['Marchew','carrot'],['Marchewka myta','carrot'],['Cebula','onion'],['Cebula czerwona','onion'],['Banany','banana'],['Jabłka','apple'],['Jabłko Gala','apple'],
  ['Jaja z wolnego wybiegu M','egg'],['Jajka ściółkowe L','egg'],['Mleko UHT 3,2%','milk'],['Mleko świeże 2%','milk'],['Masło extra 82%','butter'],
  ['Chleb żytni na zakwasie','bread'],['Twaróg półtłusty','cheese'],['Ser żółty Gouda w plastrach','yellowcheese'],['Ser Edamski','yellowcheese'],
  ['Mozzarella kulka','mozzarella'],['Jogurt naturalny 2%','yogurt'],['Jogurt grecki','yogurt'],['Rzodkiewka pęczek','radish'],['Hummus klasyczny','hummus'],
  ['Ryż basmati','rice'],['Ryż do sushi','sushirice'],['Passata pomidorowa','passata'],['Olej rzepakowy','oil'],['Pierś z kurczaka','chicken'],
  ['Filety z piersi kurczaka','chicken'],['Papryka słodka mielona','paprika'],['Papryka czerwona','pepper'],['Papryka mix','pepper'],
  ['Makaron spaghetti z pszenicy durum','pasta'],['Makaron penne bez jaj','pasta'],['Soczewica czerwona','lentils'],['Ciecierzyca konserwowa','chickpeas'],
  ['Mąka pszenna typ 450','flour'],['Mąka ziemniaczana','potatostarch'],['Cukier biały','sugar'],['Kakao naturalne','cocoa'],['Fasola czerwona konserwowa','beans'],
  ['Cytryny','lemon'],['Czosnek','garlic'],['Kasza manna','semolina'],['Kasza gryczana prażona','buckwheat'],['Kefir 2%','kefir'],['Śmietana 18%','sourcream'],
  ['Śmietana kwaśna 18 %','sourcream'],['Makrela wędzona','mackerel'],['Filet z makreli wędzonej','mackerel'],['Szczypiorek','chives'],['Koperek','dill'],
  ['Pieprz czarny mielony','blackpepper'],['Oliwa z oliwek extra vergine','oliveoil'],['Bazylia w doniczce','basil'],['Natka pietruszki','parsley'],
  ['Cukinia','zucchini'],['Bakłażan','eggplant'],['Kapusta biała','cabbage'],['Pieczarki','mushroom'],['Pomarańcze','orange'],['Owoce leśne mrożone','berries'],
  ['Ocet jabłkowy','vinegar'],['Tuńczyk w sosie własnym','tuna'],['Mięso mielone wieprzowe','mincedpork'],['Szynka gotowana plastry','ham'],['Sos sojowy','soysauce'],
  ['Pasta miso','miso'],['Tofu naturalne','tofu'],['Nori arkusze','nori'],['Sezam łuskany','sesame'],['Płatki owsiane górskie','oats'],['Cynamon mielony','cinnamon'],
  // CNT-033 (three names moved here from the negative list: they are now catalog products).
  ['Wołowina gulaszowa','beef'],['Wołowina na zrazy','beefslices'],['Zrazy wołowe','beefslices'],['Mięso mielone wołowe','mincedbeef'],
  ['Udka z kurczaka','chickenthigh'],['Podudzia z kurczaka','chickenthigh'],['Łopatka wieprzowa bez kości','porkshoulder'],['Boczek wędzony plastry','bacon'],
  ['Kapusta kiszona','sauerkraut'],['Wino czerwone wytrawne','wine'],['Seler korzeniowy','celeriac'],['Pietruszka korzeń','parsleyroot'],['Por','leek'],
  ['Liść laurowy','bayleaf'],['Ziele angielskie','allspice'],['Musztarda sarepska','mustard'],['Ogórki konserwowe','gherkin'],['Korniszony','gherkin'],
  ['Drożdże świeże','yeast'],['Imbir','ginger'],['Przyprawa curry','curry'],
  // CNT-038 ("Ogórki kiszone" moved here from the negative list: it is now a catalog product).
  ['Schab wieprzowy bez kości','porkloin'],['Schab bez kości','porkloin'],['Bułka tarta','breadcrumbs'],['Ogórki kiszone','picklecucumber'],['Ogórek kiszony','picklecucumber'],
  ['Zakwas na żurek','sourstarter'],['Kiełbasa biała surowa','whitesausage'],['Majeranek','marjoram'],['Parmezan','parmesan'],['Parmigiano Reggiano','parmesan'],
  ['Makaron lasagne','lasagnesheets'],['Lasagne płaty','lasagnesheets'],['Mascarpone','mascarpone'],['Serek mascarpone','mascarpone'],['Biszkopty podłużne','ladyfingers'],
  ['Biszkopty savoiardi','ladyfingers'],['Kawa rozpuszczalna','coffee'],['Mleczko kokosowe','coconutmilk'],['Kolendra świeża','coriander'],['Kumin mielony','cumin'],
  ['Kmin rzymski mielony','cumin'],['Chili mielone','chili'],['Papryka chili mielona','chili'],['Kukurydza konserwowa','corn'],['Kukurydza słodka','corn'],
  ['Tortille pszenne','tortilla'],['Awokado Hass','avocado'],['Limonki','lime'],['Bułki do burgerów','bun'],['Bułki hamburgerowe','bun'],['Sałata lodowa','lettuce'],
  ['Czekolada gorzka 70%','chocolate'],['Czekolada deserowa','chocolate'],['Proszek do pieczenia','bakingpowder'],['Ser feta','feta'],['Feta','feta'],
  ['Oliwki czarne bez pestek','olives'],['Oregano suszone','oregano'],['Chlebek pita','pita'],['Pita pszenna','pita'],['Tahini','tahini'],['Pasta sezamowa tahini','tahini'],
];
const negative=[
  'Sok pomidorowy','Pomidory suszone','Pomidory krojone w puszce','Koncentrat pomidorowy','Ketchup łagodny','Ogórki małosolne',
  'Masło orzechowe','Masło shea','Mleko kokosowe','Mleko owsiane','Napój sojowy','Bulion z kurczaka','Kostka rosołowa z kurczaka','Pierś z kurczaka wędzona',
  'Twarożek ze szczypiorkiem','Ser topiony','Jogurt truskawkowy','Jogurt pitny naturalny','Jogurt bez cukru','Chleb chrupki','Ocet balsamiczny',
  'Mus jabłkowy','Sok jabłkowy','Chipsy bananowe','Makaron jajeczny','Makaron 4-jajeczny','Makaron ryżowy','Ryż preparowany wafle','Wafle ryżowe',
  'Papryka marynowana','Papryka chili','Mąka pszenna pełnoziarnista','Cukier puder','Cukier wanilinowy','Napój kakaowy instant','Fasolka szparagowa',
  'Fasolka po bretońsku','Herbata z cytryną','Czosnek granulowany','Kasza gryczana niepalona','Kefir truskawkowy','Śmietana 30%','Makrela w pomidorach',
  'Koper włoski','Pieprz czarny ziarnisty','Pesto z bazylią','Kapusta pekińska','Pieczarki marynowane',
  'Sok pomarańczowy','Tuńczyk w oleju','Mięso mielone wołowo-wieprzowe','Szynka parmeńska','Tofu wędzone','Karma dla kota z kurczakiem','Szampon jabłkowy',
  'Sałatka z tuńczykiem','Pizza z mozzarellą','Ser z czosnkiem','Pomidory i ogórki zestaw','Sól himalajska','Woda mineralna','Jabłka prażone','',
  // CNT-033
  'Mięso mielone wołowo-wieprzowe','Wołowina','Udka z kurczaka pieczone','Mięso mielone z indyka','Boczek parzony','Wino czerwone półsłodkie','Wino białe wytrawne',
  'Wino czerwone bezalkoholowe wytrawne','Seler naciowy','Sok z kiszonej kapusty','Musztarda w proszku','Sos musztardowy','Drożdże instant','Imbir mielony','Imbir marynowany',
  'Pasta curry','Tofu curry','Porcja rosołowa',
  // CNT-038
  'Schab wędzony','Schab pieczony','Kiełbasa biała parzona','Ogórki konserwowe krojone','Ogórki kiszone krojone','Zakwas na barszcz biały','Żurek',
  'Ser sałatkowy typu feta','Feta z ziołami','Ser typu parmezan','Oliwki zielone','Oliwki czarne z pestką','Kolendra mielona','Kminek','Tortilla chips',
  'Tortille kukurydziane','Kawa ziarnista','Kawa rozpuszczalna 3w1','Lasagne bolognese','Kukurydza w kolbach','Pasta z awokado','Sos chili słodki',
  'Czekolada mleczna','Czekolada gorzka z orzechami','Bułki pszenne','Chałwa sezamowa','Mleczko kokosowe w proszku','Deser mascarpone','Majeranek świeży','Sałata masłowa',
];
test(`Mapa: ${positive.length} nazw sklepowych trafia w produkt`,()=>{ for(const [name,id] of positive) assert.equal(matchProduct(name),id,name); });
test(`Mapa: ${negative.length} nazw podobnych lub pochodnych nie trafia w żaden produkt`,()=>{ for(const name of negative) assert.equal(matchProduct(name),null,name); assert.equal(matchProduct(undefined),null); });
test('Mapa: wielkość liter, diakrytyki i interpunkcja nie zmieniają wyniku',()=>{
  for(const name of ['ŚMIETANA 18%','smietana 18%','Śmietana, 18%']) assert.equal(matchProduct(name),'sourcream',name);
  for(const name of ['JAJKA','jajka','Jajka.']) assert.equal(matchProduct(name),'egg',name);
});
test('Mapa: każdy zmapowany produkt ma co najmniej jeden przypadek pozytywny',()=>{
  const covered=new Set(positive.map(([,id])=>id));
  for(const [id] of productRules) assert.ok(covered.has(id),`brak przypadku dla ${id}`);
});

const epoch=iso=>Date.parse(iso)/1000;
const html=items=>`<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props:{items}})}</script>`;
const parseNow=new Date('2026-11-15T12:00:00Z');
const item=(objectID,name)=>({objectID,name,salesUnit:'1 szt.',currentPrice:{priceValue:4.99,strikePrice:{strikePriceValue:6.99},validFrom:epoch('2026-11-13T23:00:00Z'),validUntil:epoch('2026-11-15T22:59:59Z')}});
test('Parser ALDI używa nowej mapy i zachowuje kontrakt CNT-016',()=>{
  const r=parseAldi(html([item('1','Masło extra 82%'),item('2','Masło orzechowe'),item('3','Śmietana 18%'),item('4','Mleko kokosowe')]),{source:'https://www.aldi.pl/produkty/nabial.html',now:parseNow});
  assert.deepEqual(r.offers.map(o=>o.product),['butter','sourcream']);assert.equal(r.unmapped,2);assert.equal(r.productsSeen,4);
  for(const o of r.offers){assert.equal(o.market,'PL');assert.equal(o.currency,'PLN');assert.equal(o.scope.type,'unverified');assert.ok(isDisplayableAutomaticOffer(o,parseNow));}
});
test('Bot: dodatkowe źródła tylko https://www.aldi.pl/produkty/',()=>{
  assert.deepEqual(extraSources(['https://www.aldi.pl/produkty/nabial.html#x']),['https://www.aldi.pl/produkty/nabial.html']);
  assert.deepEqual(extraSources([]),[]);
  for(const bad of ['http://www.aldi.pl/produkty/a.html','https://aldi.pl.evil.example/produkty/a.html','https://www.aldi.pl/koszyk','https://u:p@www.aldi.pl/produkty/a.html','nie-url']) assert.throws(()=>extraSources([bad]),bad);
});

// ---------- B. Ranking i pokrycie (CNT-027) ----------
const now=new Date('2026-11-15T12:00:00Z');
const base={market:'PL',currency:'PLN',store:'ALDI',from:'2026-11-14',until:'2026-11-15',validUntil:'2026-11-15T22:59:59.000Z',fetchedAt:'2026-11-15T10:00:00.000Z',
  unit:'Cena za kg',conditions:'Sprawdź warunki w sklepie',scope:{type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'},source:'https://www.aldi.pl/produkty/x.html'};
let seq=0;
const mk=(product,patch={})=>({...base,id:`t-${product}-${++seq}`,product,name:`Produkt ${product}`,price:5,regularPrice:7,...patch});
const R=(id,items)=>({id,ingredients:items.map(product=>({product,amount:1}))});

test('Pokrycie: liczy dopasowane składniki i udział bez produktów spiżarnianych',()=>{
  assert.deepEqual([...pantryProducts].sort(),['blackpepper','oil','salt','water']);
  const r=R('a',['egg','tomato','butter','salt','water','blackpepper','oil']);
  const c=promoCoverage(r,[mk('egg'),mk('tomato'),mk('salt'),mk('oil')],now);
  assert.equal(c.count,2);assert.equal(c.countable,3);assert.equal(c.share,2/3);
  assert.deepEqual(c.matched.map(m=>m.product),['egg','tomato']);
  assert.equal(c.matched[0].offer.store,'ALDI');assert.equal(c.cheapestTotal,undefined);
  assert.deepEqual(promoCoverage(R('p',['salt','water']),[mk('salt')],now),{matched:[],count:0,countable:0,share:0});
  // `pepper` to świeża papryka — liczy się jako składnik.
  assert.equal(promoCoverage(R('q',['pepper']),[mk('pepper')],now).share,1);
});
test('Pokrycie: pomija wygasłe, nieświeże, przyszłe, obce waluty, niepełne i notatki użytkownika',()=>{
  const r=R('a',['egg']);
  const bad=[mk('egg',{validUntil:'2026-11-14T22:59:59.000Z',until:'2026-11-14',from:'2026-11-13'}),mk('egg',{fetchedAt:'2026-11-13T11:59:59.000Z'}),
    mk('egg',{from:'2026-11-16',until:'2026-11-16',validUntil:'2026-11-16T22:59:59.000Z'}),mk('egg',{currency:'EUR'}),mk('egg',{market:'DE'}),
    mk('egg',{scope:undefined}),mk('egg',{unit:''}),mk('egg',{price:NaN}),mk('egg',{conditions:undefined}),mk('egg',{product:'nieznany'}),
    {id:'notatka',product:'egg',store:'Sklep',price:1,until:'2026-11-20',source:'Gazetka'},null,'x'];
  for(const o of bad) assert.equal(promoCoverage(r,[o],now).count,0,JSON.stringify(o));
  assert.equal(promoCoverage(r,'nie-lista',now).count,0);
  // Granica: ostatnia chwila ważności jeszcze się liczy, sekunda później już nie.
  assert.equal(promoCoverage(r,[mk('egg')],new Date('2026-11-15T22:59:59.000Z')).count,1);
  assert.equal(promoCoverage(r,[mk('egg')],new Date('2026-11-15T23:00:00.000Z')).count,0);
});
test('Ranking: więcej dopasowań, potem wyższy udział, potem kolejność pierwotna; bez dopasowań na końcu',()=>{
  const list=[R('zero1',['milk']),R('one-of-4',['egg','milk','apple','oats']),R('two-of-4',['egg','tomato','milk','apple']),R('zero2',['rice','salt']),
    R('one-of-1',['egg','salt']),R('two-of-2',['egg','tomato']),R('one-of-1-b',['tomato','water']),R('zero3',['kefir'])];
  const offers=[mk('egg'),mk('tomato')];
  assert.deepEqual(rankByPromotions(list,offers,now).map(r=>r.id),['two-of-2','two-of-4','one-of-1','one-of-1-b','one-of-4','zero1','zero2','zero3']);
  assert.deepEqual(rankByPromotions(list,[],now).map(r=>r.id),list.map(r=>r.id));
  assert.deepEqual(list.map(r=>r.id)[0],'zero1','wejście nie jest modyfikowane');
  assert.equal(rankByPromotions(list,offers,now)[0],list[5],'zwraca te same obiekty przepisów');
});
test('Ranking działa na katalogu i nie zależy od kolejności ofert',()=>{
  const offers=[mk('egg'),mk('butter'),mk('tomato'),mk('bread')];
  const a=rankByPromotions(recipes,offers,now).map(r=>r.id), b=rankByPromotions(recipes,[...offers].reverse(),now).map(r=>r.id);
  assert.deepEqual(a,b);assert.equal(a[0],'jajecznica');assert.equal(a.length,recipes.length);assert.equal(new Set(a).size,recipes.length);
});
test('Ranking nie zależy od strefy czasowej urządzenia',()=>{
  const code=`import {rankByPromotions} from ${JSON.stringify(new URL('../src/domain.js',import.meta.url).href)};
    import {recipes} from ${JSON.stringify(new URL('../src/recipes.pl.js',import.meta.url).href)};
    const offers=${JSON.stringify([mk('egg'),mk('apple',{from:'2026-11-15'})])};
    console.log(JSON.stringify(rankByPromotions(recipes,offers,new Date('2026-11-14T23:30:00Z')).slice(0,5).map(r=>r.id)));`;
  const out=new Set(['UTC','America/Los_Angeles','Pacific/Kiritimati','Europe/Warsaw'].map(TZ=>{const r=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',env:{...process.env,TZ}});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}));
  assert.equal(out.size,1);
});

// ---------- C. Oferta przy składniku (CNT-029) ----------
test('Składniki: najtańsza ważna oferta, remis — dłużej ważna, potem ID; pola dla widoku',()=>{
  const r={id:'r',ingredients:[{product:'egg',amount:4},{product:'salt',amount:0.25},{product:'tomato',amount:1}]};
  const offers=[mk('egg',{id:'e-drogie',price:9.99}),mk('egg',{id:'e-tanie-wygasle',price:1,validUntil:'2026-11-15T11:00:00.000Z'}),mk('egg',{id:'e-tanie',price:6.49,regularPrice:undefined}),
    mk('egg',{id:'e-euro',price:2,currency:'EUR'}),mk('salt',{id:'s',price:1.5}),
    mk('tomato',{id:'t-b',price:5}),mk('tomato',{id:'t-a',price:5}),mk('tomato',{id:'t-dluzej',price:5,until:'2026-11-16',validUntil:'2026-11-16T22:59:59.000Z'})];
  const list=ingredientOffers(r,offers,now);
  assert.deepEqual(list.map(x=>[x.product,x.amount,x.pantry,x.offer?.id]),[['egg',4,false,'e-tanie'],['salt',0.25,true,'s'],['tomato',1,false,'t-dluzej']]);
  const e=list[0].offer;
  assert.deepEqual(Object.keys(e).sort(),['conditions','currency','fetchedAt','from','id','name','price','product','regularPrice','scope','store','unit','until','url','validUntil'].sort());
  assert.equal(e.price,6.49);assert.equal(e.currency,'PLN');assert.equal(e.unit,'Cena za kg');assert.equal(e.store,'ALDI');assert.equal(e.until,'2026-11-15');
  assert.equal(e.url,'https://www.aldi.pl/produkty/x.html');assert.equal(e.regularPrice,null);assert.equal(e.scope.type,'unverified');
  assert.equal(e.evidence,undefined,'surowy dowód nie trafia do widoku');
  assert.equal(ingredientOffers(r,offers.filter(o=>o.id!=='t-dluzej'),now)[2].offer.id,'t-a');
  assert.equal(ingredientOffers(r,[],now).every(x=>x.offer===null),true);
});
test('Składniki: niebezpieczne adresy źródła dają url = null, oferta zostaje',()=>{
  for(const source of ['http://www.aldi.pl/x','javascript:alert(1)','https://u:p@www.aldi.pl/','https://www.aldi.pl/"><script>','Gazetka papierowa',' https://www.aldi.pl/','https://'+'a'.repeat(495)])
    assert.equal(ingredientOffers(R('r',['egg']),[mk('egg',{source})],now)[0].offer?.url??null,null,source);
  assert.equal(safeOfferUrl('https://www.aldi.pl/produkty/a.html?x=1'),'https://www.aldi.pl/produkty/a.html?x=1');
  assert.equal(safeOfferUrl(undefined),null);
});
test('Składniki: zasięg regionalny jest kopiowany, nie współdzielony z ofertą',()=>{
  const o=mk('egg',{scope:{type:'region',regions:['mazowieckie']}});
  const v=ingredientOffers(R('r',['egg']),[o],now)[0].offer;
  assert.deepEqual(v.scope,{type:'region',regions:['mazowieckie']});v.scope.regions.push('x');assert.deepEqual(o.scope.regions,['mazowieckie']);
});
