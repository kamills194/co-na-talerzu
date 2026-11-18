import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes as allRecipes, products as allProducts, cuisines } from '../src/recipes.pl.js';
import { data as bot } from '../src/recipes.bot.pl.js';
// These tests pin the editorial catalog (CNT-011…CNT-038). Dishes added by the recipe bot (review:'bot')
// are checked by catalog-bot.test.mjs with the same rules plus the bot's own validator.
const recipes = allRecipes.filter(r => r.review !== 'bot');
const products = Object.fromEntries(Object.entries(allProducts).filter(([id]) => !(id in bot.products)));
const BOT_CUISINES = ['chinese','thai','vietnamese','korean','spanish','portuguese','turkish','hungarian','ukrainian','georgian','british','scandinavian','latinamerican','african'];
import { categories, allergens } from '../src/i18n.js';
import { filterRecipes } from '../src/domain.js';
// IDs of the 18 pilot recipes. Favorites stored on users' devices refer to them, so they must stay.
const ORIGINAL_IDS = ['owsianka','jajecznica','owsianka-wodna','twarożek','jogurt','hummus-kanapki','pomidorowa','kurczak','makaron','soczewica','salatka','omlet','grzanki','placuszki','pieczone-jablka','kakao','marchewki','pasta-fasolowa'];
// Product IDs of the pilot catalog. Shopping lists stored on users' devices refer to them.
const ORIGINAL_PRODUCTS = ['oats','milk','apple','cinnamon','egg','butter','bread','tomato','cheese','yogurt','radish','cucumber','banana','carrot','hummus','rice','passata','water','oil','salt','potato','chicken','paprika','pasta','onion','lentils','chickpeas','pepper','flour','sugar','cocoa','beans','lemon','garlic'];
// Products without a declared allergen that still exclude a diet. Extend when adding meat, fish or other animal products.
const MEAT = ['chicken','ham','mincedpork','beef','beefslices','mincedbeef','chickenthigh','porkshoulder','bacon','porkloin','whitesausage'];
// Explicit on purpose: a new fish product must be added here by hand, the test below compares it with the allergen data.
const FISH = ['mackerel','tuna'];
// IDs of the 30 recipes published before CNT-023 (18 pilot + 12 from CNT-015).
const CATALOG_30_IDS = [...ORIGINAL_IDS,'pasta-jajeczna','kasza-manna','pasta-z-makreli','koktajl-kefirowy','placki-ziemniaczane','leniwe','potrawka-z-kurczaka','kasza-z-jajkiem','ziemniaki-z-gzikiem','nalesniki-z-twarogiem','surowka-z-marchewki','mizeria'];
// Products available before CNT-023, with units. Shopping lists stored on users' devices refer to them.
const CATALOG_30_PRODUCTS = {oats:'g',milk:'ml',apple:'szt.',cinnamon:'łyżeczka',egg:'szt.',butter:'g',bread:'kromka',tomato:'szt.',cheese:'g',yogurt:'g',radish:'szt.',cucumber:'szt.',banana:'szt.',carrot:'szt.',hummus:'g',rice:'g',passata:'ml',water:'ml',oil:'ml',salt:'łyżeczka',potato:'g',chicken:'g',paprika:'łyżeczka',pasta:'g',onion:'szt.',lentils:'g',chickpeas:'g',pepper:'szt.',flour:'g',sugar:'g',cocoa:'g',beans:'g',lemon:'szt.',garlic:'ząbek',semolina:'g',buckwheat:'g',kefir:'ml',sourcream:'g',mackerel:'g',chives:'pęczek',dill:'pęczek',blackpepper:'szczypta'};
// Pantry basics that do not count toward the limit of 8 ingredients of a simple dish.
const UNCOUNTED = ['salt','water','oil','blackpepper'];
const isNew = r => !CATALOG_30_IDS.includes(r.id);
// The 40 simple dishes added in CNT-023. The "at most 30 minutes, at most 8 ingredients" rule applies to this batch only.
const CNT023_IDS = ['chleb-w-jajku','kanapki-z-jajkiem-i-rzodkiewka','ryz-na-mleku','strammer-max','tamagoyaki','omlet-francuski','kanapki-z-serem-i-pomidorem','twarozek-z-bananem','onigiri-z-tunczykiem','croque-monsieur','salatka-makaronowa','zupa-ziemniaczana','makaron-z-twarogiem','jajka-w-sosie-koperkowym','spaghetti-aglio-e-olio','makaron-z-tunczykiem','frykadele','ratatouille','oyakodon','yakisoba','zapiekanki-z-pieczarkami','placki-z-cukinii','frittata-z-cukinia','bratkartoffeln','flammkuchen','salatka-nicejska','zupa-miso','omurice','racuszki-z-jablkami','budyn-kakaowy','omlet-biszkoptowy','rote-grutze','tosty-francuskie','macedonia','surowka-z-kapusty','caprese','bruschetta','kartoffelsalat','zupa-cebulowa','sunomono'];
// The 16 longer dishes added in CNT-033 (over 60 minutes including passive time), with their cuisine.
const CNT033 = {golabki:'polish',bigos:'polish',rosol:'polish',szarlotka:'polish','ragu-bolognese':'italian',focaccia:'italian',parmigiana:'italian',gulaschsuppe:'german',rinderrouladen:'german',apfelstrudel:'german','boeuf-bourguignon':'french','coq-au-vin':'french','tarte-tatin':'french',ramen:'japanese',gyoza:'japanese','kare-raisu':'japanese'};
const CNT033_IDS = Object.keys(CNT033);
// The 24 popular dishes added in CNT-038, with their cuisine.
const CNT038 = {'pierogi-ruskie':'polish','kotlet-schabowy':'polish','zupa-ogorkowa':'polish',zurek:'polish','pizza-margherita':'italian',carbonara:'italian',
  lasagne:'italian',tiramisu:'italian','kurczak-curry':'indian','chana-masala':'indian',dal:'indian',naan:'indian','chili-con-carne':'mexican',
  'tacos-z-kurczakiem':'mexican',quesadilla:'mexican',guacamole:'mexican',burger:'american',pancakes:'american','mac-and-cheese':'american',brownie:'american',
  szakszuka:'mediterranean','gyros-w-picie':'mediterranean','salatka-grecka':'mediterranean',falafel:'mediterranean'};
const CNT038_IDS = Object.keys(CNT038);
// CNT-043: other versions of popular dishes (pierogi, pizza), appended after CNT-038.
const CNT043 = {'pierogi-z-miesem':'polish','pierogi-z-kapusta-i-grzybami':'polish','pierogi-z-owocami':'polish','pizza-funghi':'italian','pizza-z-szynka':'italian'};
const CNT043_IDS = Object.keys(CNT043);
// Cuisines before CNT-038 and the four added in CNT-038.
const START_CUISINES = ['polish','italian','german','french','japanese'];
const CNT038_CUISINES = ['indian','mexican','american','mediterranean'];
// Product IDs available in CNT-023 (shopping lists stored on users' devices refer to them).
const CATALOG_70_PRODUCTS = [...Object.keys(CATALOG_30_PRODUCTS),'yellowcheese','mozzarella','oliveoil','basil','parsley','zucchini','eggplant','cabbage','mushroom','orange','berries','potatostarch','vinegar','tuna','mincedpork','ham','sushirice','soysauce','miso','tofu','nori','sesame'];
// Products added in CNT-038, with units.
const CNT038_PRODUCTS = {porkloin:'g',breadcrumbs:'g',picklecucumber:'szt.',sourstarter:'ml',whitesausage:'g',marjoram:'łyżeczka',parmesan:'g',lasagnesheets:'g',
  mascarpone:'g',ladyfingers:'g',coffee:'g',coconutmilk:'ml',coriander:'pęczek',cumin:'łyżeczka',chili:'łyżeczka',corn:'g',tortilla:'szt.',avocado:'szt.',lime:'szt.',
  bun:'szt.',lettuce:'szt.',chocolate:'g',bakingpowder:'łyżeczka',feta:'g',olives:'g',oregano:'łyżeczka',pita:'szt.',tahini:'g'};
const ANIMAL_ALLERGENS = ['milk','eggs','fish'];
const has = (r,ids) => r.ingredients.some(i=>ids.includes(i.product));
test('Katalog ma 115 przepisów o unikalnych ID i zachowuje 18 pierwotnych ID',()=>{
  assert.equal(recipes.length,115);
  assert.equal(new Set(recipes.map(r=>r.id)).size,115);
  assert.equal(ORIGINAL_IDS.length,18);
  for(const id of ORIGINAL_IDS) assert.ok(recipes.some(r=>r.id===id),`brak pierwotnego przepisu ${id}`);
});
test('Pierwotne ID i jednostki produktów pozostają bez zmian',()=>{
  for(const id of ORIGINAL_PRODUCTS) assert.ok(id in products,`brak pierwotnego produktu ${id}`);
  const units={oats:'g',milk:'ml',apple:'szt.',cinnamon:'łyżeczka',egg:'szt.',bread:'kromka',salt:'łyżeczka',garlic:'ząbek',oil:'ml',potato:'g'};
  for(const [id,unit] of Object.entries(units)) assert.equal(products[id][1],unit,id);
});
test('Każdy produkt ma nazwę, jednostkę i alergeny z listy aplikacji',()=>{
  for(const [id,p] of Object.entries(products)){
    assert.equal(p.length,3,id);
    assert.ok(typeof p[0]==='string'&&p[0].trim(),id);
    assert.ok(typeof p[1]==='string'&&p[1].trim(),id);
    assert.ok(Array.isArray(p[2])&&p[2].every(a=>allergens.includes(a)),id);
  }
  for(const id of MEAT) assert.ok(id in products,id);
  assert.ok(FISH.length>0);
});
test('Jawna lista ryb zgadza się z alergenami produktów, a mięso nie jest oznaczone jako ryba',()=>{
  assert.deepEqual([...FISH].sort(),Object.keys(products).filter(id=>products[id][2].includes('fish')).sort());
  for(const id of FISH) assert.ok(id in products,id);
  for(const id of MEAT) assert.ok(!products[id][2].includes('fish'),id);
  assert.ok(!MEAT.some(id=>FISH.includes(id)));
});
test('Produkty o ukrytych alergenach mają je oznaczone',()=>{
  const expect={soysauce:['soy','gluten'],miso:['soy'],tofu:['soy'],sesame:['sesame'],hummus:['sesame'],tuna:['fish'],mackerel:['fish'],mozzarella:['milk'],yellowcheese:['milk'],ham:['soy','milk','celery','mustard'],
    bacon:['gluten','soy','milk','celery','mustard'],celeriac:['celery'],mustard:['mustard'],gherkin:['mustard'],curry:['mustard','celery'],
    whitesausage:['gluten','soy','milk','celery','mustard'],picklecucumber:['mustard'],sourstarter:['gluten'],breadcrumbs:['gluten'],lasagnesheets:['gluten','eggs'],
    ladyfingers:['gluten','eggs'],mascarpone:['milk'],parmesan:['milk'],feta:['milk'],tortilla:['gluten'],pita:['gluten'],bun:['gluten','sesame','milk','eggs'],
    chocolate:['milk','soy'],bakingpowder:['gluten'],tahini:['sesame']};
  for(const [id,list] of Object.entries(expect)) for(const a of list) assert.ok(products[id][2].includes(a),`${id}: brak ${a}`);
  assert.deepEqual(products.nori[2],[]);
});
test('Każdy produkt jest użyty w co najmniej jednym przepisie',()=>{
  const used=new Set(recipes.flatMap(r=>r.ingredients.map(i=>i.product)));
  for(const id of Object.keys(products)) assert.ok(used.has(id),`nieużywany produkt ${id}`);
});
test('Każdy przepis ma pochodzenie, stan przeglądu, pole zdjęcia i opis alternatywny',()=>{
  for(const r of recipes){
    assert.ok(typeof r.origin==='string'&&r.origin.trim().length>0,`${r.id}: origin`);
    assert.equal(r.review,'editorial',`${r.id}: review`);
    assert.equal(r.photo,null,`${r.id}: photo`);
    assert.ok(typeof r.photoAlt==='string'&&r.photoAlt.trim().length>=10,`${r.id}: photoAlt`);
    assert.ok(!/\.$/.test(r.photoAlt.trim()),`${r.id}: photoAlt bez kropki na końcu`);
  }
  assert.equal(new Set(recipes.map(r=>r.photoAlt)).size,115);
});
// Upper bound 180 minutes: the longest CNT-033 dish (bœuf bourguignon) braises for over two hours.
test('Każdy przepis ma nazwę, 2 porcje, realny czas i co najmniej 3 niepuste kroki',()=>{
  for(const r of recipes){
    assert.ok(typeof r.name==='string'&&r.name.trim(),r.id);
    assert.equal(r.servings,2,r.id);
    assert.ok(Number.isInteger(r.minutes)&&r.minutes>=5&&r.minutes<=180,r.id);
    assert.ok(r.steps.length>=3,r.id);
    assert.ok(r.steps.every(s=>typeof s==='string'&&s.trim().length>=15),r.id);
    assert.ok(r.ingredients.length>=2,r.id);
  }
  assert.equal(new Set(recipes.map(r=>r.name)).size,115);
});
test('Żaden przepis nie wymienia dwa razy tego samego produktu',()=>{
  for(const r of recipes) assert.equal(new Set(r.ingredients.map(i=>i.product)).size,r.ingredients.length,r.id);
});
test('Przepisy wegańskie nie zawierają mleka, jaj, ryb ani mięsa',()=>{
  const vegan=recipes.filter(r=>r.vegan);
  assert.ok(vegan.length>=5);
  for(const r of vegan){
    assert.equal(r.vegetarian,true,r.id);
    assert.ok(!r.allergens.some(a=>ANIMAL_ALLERGENS.includes(a)),`${r.id}: alergen odzwierzęcy`);
    assert.ok(!r.ingredients.some(i=>products[i.product][2].some(a=>ANIMAL_ALLERGENS.includes(a))),`${r.id}: produkt odzwierzęcy`);
    assert.ok(!has(r,MEAT)&&!has(r,FISH),`${r.id}: mięso lub ryba`);
  }
});
test('Przepisy wegetariańskie nie zawierają mięsa ani ryb, a mięsne i rybne nie mają oznaczeń diety',()=>{
  for(const r of recipes){
    const animalFlesh=has(r,MEAT)||has(r,FISH);
    if(r.vegetarian) assert.ok(!animalFlesh,`${r.id}: mięso lub ryba w daniu wegetariańskim`);
    if(animalFlesh){assert.equal(r.vegetarian,false,r.id);assert.equal(r.vegan,false,r.id);}
  }
  assert.ok(recipes.some(r=>has(r,MEAT)));
  assert.ok(recipes.some(r=>has(r,FISH)));
});
test('Oznaczenia diety nie są zaniżone: danie bez mięsa i ryb jest wegetariańskie, a bez produktów odzwierzęcych wegańskie',()=>{
  for(const r of recipes){
    const vegetarian=!has(r,MEAT)&&!has(r,FISH);
    const vegan=vegetarian&&!r.allergens.some(a=>ANIMAL_ALLERGENS.includes(a));
    assert.equal(r.vegetarian,vegetarian,`${r.id}: vegetarian`);
    assert.equal(r.vegan,vegan,`${r.id}: vegan`);
  }
});
test('Każda kategoria ma co najmniej 8 przepisów',()=>{
  for(const c of categories) assert.ok(recipes.filter(r=>r.category===c).length>=8,c);
  assert.ok(recipes.every(r=>categories.includes(r.category)));
});
test('Wykluczenie ryb usuwa pastę z makreli, a filtr diety nie pokazuje jej wegetarianom',()=>{
  assert.ok(recipes.find(r=>r.id==='pasta-z-makreli').allergens.includes('fish'));
  assert.ok(!filterRecipes(recipes,{excluded:['fish']}).some(r=>r.id==='pasta-z-makreli'));
  assert.ok(!filterRecipes(recipes,{diet:'vegetarian'}).some(r=>['pasta-z-makreli','kurczak','potrawka-z-kurczaka'].includes(r.id)));
});
test('Nowe przepisy bez glutenu i mleka są poprawnie filtrowane po alergenach',()=>{
  const ids=filterRecipes(recipes,{excluded:['gluten','milk','eggs']}).map(r=>r.id);
  assert.ok(ids.includes('surowka-z-marchewki'));
  for(const id of ['kasza-manna','placki-ziemniaczane','leniwe','potrawka-z-kurczaka','nalesniki-z-twarogiem','mizeria','ziemniaki-z-gzikiem','kasza-z-jajkiem']) assert.ok(!ids.includes(id),id);
});
test('Katalog zachowuje 30 wcześniejszych ID przepisów oraz ID i jednostki wcześniejszych produktów',()=>{
  assert.equal(CATALOG_30_IDS.length,30);
  assert.equal(new Set(CATALOG_30_IDS).size,30);
  for(const id of CATALOG_30_IDS) assert.ok(recipes.some(r=>r.id===id),`brak wcześniejszego przepisu ${id}`);
  assert.equal(recipes.filter(isNew).length,85);
  assert.equal(Object.keys(CATALOG_30_PRODUCTS).length,42);
  for(const [id,unit] of Object.entries(CATALOG_30_PRODUCTS)){
    assert.ok(id in products,`brak wcześniejszego produktu ${id}`);
    assert.equal(products[id][1],unit,id);
  }
});
test('Lista kuchni to pięć kuchni startowych i cztery z CNT-038, a każdy przepis ma jedną z nich',()=>{
  assert.deepEqual(cuisines,[...START_CUISINES,...CNT038_CUISINES,...BOT_CUISINES]);
  for(const r of recipes) assert.ok(cuisines.includes(r.cuisine),`${r.id}: kuchnia ${r.cuisine}`);
});
test('Każda kuchnia startowa ma co najmniej 6 przepisów, a kuchnie inne niż polska obejmują kilka kategorii',()=>{
  for(const c of START_CUISINES){
    const list=recipes.filter(r=>r.cuisine===c);
    assert.ok(list.length>=6,`${c}: ${list.length}`);
    assert.ok(new Set(list.map(r=>r.category)).size>=4,`${c}: za mało kategorii`);
  }
});
test('Klasyfikacja wcześniejszych przepisów: dania domowe pozostają w kuchni polskiej',()=>{
  const foreign=recipes.filter(r=>!isNew(r)&&r.cuisine!=='polish').map(r=>r.id);
  assert.deepEqual(foreign,['makaron']);
  assert.equal(recipes.find(r=>r.id==='makaron').cuisine,'italian');
});
test('Przepisy z CNT-023 są proste: najwyżej 30 minut i najwyżej 8 liczonych składników',()=>{
  assert.equal(CNT023_IDS.length,40);
  assert.deepEqual(recipes.filter(r=>isNew(r)&&!CNT033_IDS.includes(r.id)&&!CNT038_IDS.includes(r.id)&&!CNT043_IDS.includes(r.id)).map(r=>r.id),CNT023_IDS);
  for(const r of recipes.filter(r=>CNT023_IDS.includes(r.id))){
    assert.ok(r.minutes<=30,`${r.id}: ${r.minutes} min`);
    const counted=r.ingredients.filter(i=>!UNCOUNTED.includes(i.product)).length;
    assert.ok(counted>=2&&counted<=8,`${r.id}: ${counted} składników`);
  }
});
test('Alergeny nowych kuchni są filtrowane: soja, sezam, seler i gorczyca',()=>{
  const without=ex=>filterRecipes(recipes,{excluded:ex}).map(r=>r.id);
  for(const id of ['tamagoyaki','onigiri-z-tunczykiem','oyakodon','yakisoba','zupa-miso','sunomono','strammer-max','croque-monsieur']) assert.ok(!without(['soy']).includes(id),`soja: ${id}`);
  assert.ok(without(['soy']).includes('omurice'));
  assert.ok(!without(['sesame']).includes('sunomono'));
  for(const a of ['celery','mustard']) for(const id of ['strammer-max','croque-monsieur']) assert.ok(!without([a]).includes(id),`${a}: ${id}`);
  for(const id of ['tamagoyaki','oyakodon','yakisoba','zupa-miso','sunomono','onigiri-z-tunczykiem']) assert.ok(!without(['gluten']).includes(id),`gluten w sosie sojowym lub miso: ${id}`);
  for(const id of ['onigiri-z-tunczykiem','makaron-z-tunczykiem','salatka-nicejska']) assert.ok(!without(['fish']).includes(id),`ryby: ${id}`);
});
test('Nowe dania mięsne i rybne nie trafiają do filtrów diety',()=>{
  const vegetarian=filterRecipes(recipes,{diet:'vegetarian'}).map(r=>r.id);
  for(const id of ['strammer-max','croque-monsieur','frykadele','oyakodon','onigiri-z-tunczykiem','makaron-z-tunczykiem','salatka-nicejska']) assert.ok(!vegetarian.includes(id),id);
  const vegan=filterRecipes(recipes,{diet:'vegan'}).map(r=>r.id);
  for(const id of ['spaghetti-aglio-e-olio','ratatouille','yakisoba','zupa-miso','macedonia','surowka-z-kapusty','bruschetta','kartoffelsalat','sunomono']) assert.ok(vegan.includes(id),id);
});
// ---------- CNT-033: dishes over 60 minutes and a more even cuisine split ----------
test('CNT-033: 16 nowych dań trwa ponad 60 minut, ma najwyżej 12 składników, co najmniej 4 kroki i kompletny rekord',()=>{
  assert.equal(CNT033_IDS.length,16);
  for(const [id,cuisine] of Object.entries(CNT033)){
    const r=recipes.find(x=>x.id===id);
    assert.ok(r,`brak przepisu ${id}`);
    assert.equal(r.cuisine,cuisine,id);
    assert.ok(r.minutes>60&&r.minutes<=180,`${id}: ${r.minutes} min`);
    assert.ok(r.ingredients.length<=12,`${id}: ${r.ingredients.length} składników`);
    assert.ok(r.steps.length>=4,`${id}: ${r.steps.length} kroków`);
    assert.equal(r.servings,2,id);
    assert.equal(r.origin,'Autorski przepis redakcji Co na talerz',id);
    assert.equal(r.review,'editorial',id);
    assert.equal(r.photo,null,id);
  }
  // Appended at the end: the order of the earlier 70 recipes is unchanged.
  assert.deepEqual(recipes.slice(70,86).map(r=>r.id),CNT033_IDS);
  assert.deepEqual(recipes.slice(30,70).map(r=>r.id),CNT023_IDS);
  // Mostly lunches and dinners, plus desserts and a baked snack.
  const cats=new Set(CNT033_IDS.map(id=>recipes.find(r=>r.id===id).category));
  for(const c of ['lunch','dinner','dessert','snack','starter']) assert.ok(cats.has(c),c);
});
test('CNT-033: każda kuchnia ma co najmniej 9 przepisów, a kuchnia polska poniżej 55% katalogu',()=>{
  const count=c=>recipes.filter(r=>r.cuisine===c).length;
  for(const c of START_CUISINES) assert.ok(count(c)>=9,`${c}: ${count(c)}`);
  // Counts after CNT-038 (Polish +4, Italian +4) and CNT-043 (Polish +3, Italian +2); German, French and Japanese unchanged since CNT-033.
  assert.deepEqual(Object.fromEntries(START_CUISINES.map(c=>[c,count(c)])),{polish:54,italian:17,german:9,french:9,japanese:10});
  assert.ok(count('polish')/recipes.length<0.55,`udział kuchni polskiej ${count('polish')}/${recipes.length}`);
  for(const c of START_CUISINES.filter(c=>c!=='polish')) assert.ok(CNT033_IDS.filter(id=>CNT033[id]===c).length>=3,c);
});
test('CNT-033: wcześniejsze 64 produkty zachowują ID i jednostki, a nowe są w katalogu',()=>{
  assert.equal(CATALOG_70_PRODUCTS.length,64);
  for(const id of CATALOG_70_PRODUCTS) assert.ok(id in products,`brak produktu ${id}`);
  const added={beef:'g',beefslices:'g',mincedbeef:'g',chickenthigh:'g',porkshoulder:'g',bacon:'g',sauerkraut:'g',wine:'ml',celeriac:'g',parsleyroot:'szt.',leek:'szt.',bayleaf:'szt.',allspice:'szt.',mustard:'g',gherkin:'szt.',yeast:'g',ginger:'g',curry:'łyżeczka'};
  for(const [id,unit] of Object.entries(added)) assert.equal(products[id]?.[1],unit,id);
  assert.deepEqual(Object.keys(products).sort(),[...CATALOG_70_PRODUCTS,...Object.keys(added),...Object.keys(CNT038_PRODUCTS)].sort());
});
test('CNT-033: alergeny i diety nowych dań są filtrowane',()=>{
  const without=ex=>filterRecipes(recipes,{excluded:ex}).map(r=>r.id);
  for(const id of ['rosol','ragu-bolognese','bigos','rinderrouladen','kare-raisu']) assert.ok(!without(['celery']).includes(id),`seler: ${id}`);
  for(const id of ['rinderrouladen','bigos','kare-raisu']) assert.ok(!without(['mustard']).includes(id),`gorczyca: ${id}`);
  for(const id of ['ramen','gyoza','kare-raisu','bigos','rinderrouladen']) assert.ok(!without(['soy']).includes(id),`soja: ${id}`);
  assert.ok(!without(['sesame']).includes('ramen'));
  assert.ok(!without(['eggs']).includes('szarlotka'));
  // Dishes without the allergen stay visible.
  for(const id of ['golabki','gulaschsuppe']) assert.ok(without(['gluten','milk','eggs','soy','celery','mustard','sesame']).includes(id),id);
  assert.ok(without(['celery','mustard']).includes('boeuf-bourguignon'));
  const vegetarian=filterRecipes(recipes,{diet:'vegetarian'}).map(r=>r.id);
  for(const id of ['szarlotka','focaccia','parmigiana','apfelstrudel','tarte-tatin']) assert.ok(vegetarian.includes(id),id);
  for(const id of ['golabki','bigos','rosol','ragu-bolognese','gulaschsuppe','rinderrouladen','boeuf-bourguignon','coq-au-vin','ramen','gyoza','kare-raisu']) assert.ok(!vegetarian.includes(id),id);
  assert.deepEqual(filterRecipes(recipes,{diet:'vegan'}).map(r=>r.id).filter(id=>CNT033_IDS.includes(id)),['focaccia']);
  // The 60-minute filter hides every new dish.
  assert.ok(!filterRecipes(recipes,{maxTime:60}).some(r=>CNT033_IDS.includes(r.id)));
});
// ---------- CNT-038: popular dishes, new cuisines and dish icons ----------
const graphemes = s => [...new Intl.Segmenter('pl',{granularity:'grapheme'}).segment(s)].length;
test('CNT-038: 24 nowe popularne dania są w katalogu z kuchnią i kompletnym rekordem, dopisane na końcu',()=>{
  assert.equal(CNT038_IDS.length,24);
  for(const [id,cuisine] of Object.entries(CNT038)){
    const r=recipes.find(x=>x.id===id);
    assert.ok(r,`brak przepisu ${id}`);
    assert.equal(r.cuisine,cuisine,id);
    assert.ok(r.minutes>=5&&r.minutes<=180,`${id}: ${r.minutes} min`);
    assert.ok(r.ingredients.length<=12,`${id}: ${r.ingredients.length} składników`);
    assert.ok(r.steps.length>=3,`${id}: ${r.steps.length} kroków`);
    assert.equal(r.servings,2,id);
    assert.equal(r.origin,'Autorski przepis redakcji Co na talerz',id);
    assert.equal(r.review,'editorial',id);
    assert.equal(r.photo,null,id);
    assert.ok(r.photoAlt.trim().length>=10,id);
  }
  assert.deepEqual(recipes.slice(86,110).map(r=>r.id),CNT038_IDS);
  for(const c of categories) assert.ok(CNT038_IDS.some(id=>recipes.find(r=>r.id===id).category===c),c);
});
test('CNT-038: są pierogi ruskie, pizza i curry; nowe dania nie dublują wcześniejszych nazw',()=>{
  const name=id=>recipes.find(r=>r.id===id).name;
  assert.match(name('pierogi-ruskie'),/pierogi ruskie/i);
  assert.ok(recipes.some(r=>/pizza/i.test(r.name)),'pizza');
  assert.ok(recipes.filter(r=>CNT038_IDS.includes(r.id)&&/curry/i.test(r.name)).length>=2,'curry');
  const earlier=new Set(recipes.slice(0,86).map(r=>r.name.toLowerCase()));
  for(const id of CNT038_IDS) assert.ok(!earlier.has(name(id).toLowerCase()),id);
});
test('CNT-038: każda nowa kuchnia ma co najmniej 4 przepisy z co najmniej 3 kategorii, a polska najwyżej 55%',()=>{
  const count=c=>recipes.filter(r=>r.cuisine===c).length;
  for(const c of CNT038_CUISINES){
    assert.ok(count(c)>=4,`${c}: ${count(c)}`);
    assert.ok(new Set(recipes.filter(r=>r.cuisine===c).map(r=>r.category)).size>=3,`${c}: za mało kategorii`);
  }
  assert.deepEqual(Object.fromEntries(CNT038_CUISINES.map(c=>[c,count(c)])),{indian:4,mexican:4,american:4,mediterranean:4});
  assert.ok(count('polish')/recipes.length<=0.55,`udział kuchni polskiej ${count('polish')}/${recipes.length}`);
  assert.equal(cuisines.reduce((n,c)=>n+count(c),0),recipes.length);
  assert.equal(cuisines.reduce((n,c)=>n+allRecipes.filter(r=>r.cuisine===c).length,0),allRecipes.length);
});
test('CNT-038: każdy przepis ma jedną niepustą ikonę emoji (jeden grafem)',()=>{
  for(const r of recipes){
    assert.ok(typeof r.emoji==='string'&&r.emoji.trim(),`${r.id}: brak emoji`);
    assert.equal(graphemes(r.emoji),1,`${r.id}: ${r.emoji}`);
    assert.match(r.emoji,/^\p{Extended_Pictographic}\uFE0F?$/u,`${r.id}: ${r.emoji}`);
  }
  // Fitting icons for the dishes named by the owner.
  const icon=id=>recipes.find(r=>r.id===id).emoji;
  assert.equal(icon('pierogi-ruskie'),'🥟');assert.equal(icon('pizza-margherita'),'🍕');assert.equal(icon('kurczak-curry'),'🍛');assert.equal(icon('burger'),'🍔');
  assert.equal(icon('owsianka'),'🥣');assert.equal(icon('rosol'),'🍜');assert.equal(icon('nalesniki-z-twarogiem'),'🥞');
});
test('CNT-038: nowe produkty mają jednostki, a nowe mięsa są na liście mięsa',()=>{
  assert.equal(Object.keys(CNT038_PRODUCTS).length,28);
  for(const [id,unit] of Object.entries(CNT038_PRODUCTS)) assert.equal(products[id]?.[1],unit,id);
  assert.equal(Object.keys(products).length,110);
  for(const id of ['porkloin','whitesausage']) assert.ok(MEAT.includes(id),id);
});
test('CNT-038: alergeny i diety nowych dań są filtrowane',()=>{
  const without=ex=>filterRecipes(recipes,{excluded:ex}).map(r=>r.id);
  for(const id of ['kurczak-curry','chana-masala','dal']) assert.ok(!without(['mustard']).includes(id)&&!without(['celery']).includes(id),`curry: ${id}`);
  for(const id of ['falafel','burger']) assert.ok(!without(['sesame']).includes(id),`sezam: ${id}`);
  for(const id of ['tiramisu','lasagne','carbonara','pancakes','brownie']) assert.ok(!without(['eggs']).includes(id),`jaja: ${id}`);
  for(const id of ['brownie','zurek','carbonara']) assert.ok(!without(['soy']).includes(id),`soja: ${id}`);
  assert.ok(!without(['gluten']).includes('guacamole'),'chipsy z tortilli pszennej');
  assert.ok(without(['gluten','milk','eggs','soy','celery','mustard','sesame']).includes('chili-con-carne'));
  const vegan=filterRecipes(recipes,{diet:'vegan'}).map(r=>r.id).filter(id=>CNT038_IDS.includes(id));
  assert.deepEqual(vegan,['chana-masala','dal','guacamole','falafel']);
  const vegetarian=filterRecipes(recipes,{diet:'vegetarian'}).map(r=>r.id);
  for(const id of ['kotlet-schabowy','zurek','carbonara','lasagne','kurczak-curry','chili-con-carne','tacos-z-kurczakiem','burger','gyros-w-picie']) assert.ok(!vegetarian.includes(id),id);
  for(const id of ['pierogi-ruskie','zupa-ogorkowa','pizza-margherita','tiramisu','naan','quesadilla','pancakes','mac-and-cheese','brownie','szakszuka','salatka-grecka']) assert.ok(vegetarian.includes(id),id);
});

// ---------- CNT-043: kilka wersji jednego dania ----------
import { VARIANT_GROUPS, variantsOf } from '../src/domain.js';
test('CNT-043: nowe wersje pierogów i pizzy są dopisane na końcu, z kompletnym rekordem',()=>{
  assert.deepEqual(recipes.slice(110).map(r=>r.id),CNT043_IDS);
  for(const [id,cuisine] of Object.entries(CNT043)){
    const r=recipes.find(x=>x.id===id);
    assert.equal(r.cuisine,cuisine,id); assert.equal(r.servings,2,id); assert.ok(r.ingredients.length<=12,id);
    assert.ok(r.steps.length>=4,id); assert.equal(r.origin,'Autorski przepis redakcji Co na talerz',id);
  }
  const name=id=>recipes.find(r=>r.id===id).name;
  assert.match(name('pierogi-z-miesem'),/pierogi z mięsem/i); assert.match(name('pierogi-z-owocami'),/owocami/i); assert.match(name('pizza-funghi'),/pizza/i);
  const vegetarian=filterRecipes(recipes,{diet:'vegetarian'}).map(r=>r.id), vegan=filterRecipes(recipes,{diet:'vegan'}).map(r=>r.id);
  for(const id of ['pierogi-z-miesem','pizza-z-szynka']) assert.ok(!vegetarian.includes(id),id);
  for(const id of ['pierogi-z-owocami','pizza-funghi']) assert.ok(vegetarian.includes(id)&&!vegan.includes(id),id);
  assert.ok(vegan.includes('pierogi-z-kapusta-i-grzybami'));
});
test('CNT-043: grupy wersji wskazują istniejące przepisy, a każde danie widzi pozostałe wersje',()=>{
  const ids=new Set(recipes.map(r=>r.id)), all=VARIANT_GROUPS.flat();
  assert.equal(new Set(all).size,all.length);
  for(const id of all) assert.ok(ids.has(id),id);
  assert.deepEqual(variantsOf('pierogi-ruskie'),['pierogi-z-miesem','pierogi-z-kapusta-i-grzybami','pierogi-z-owocami']);
  assert.ok(variantsOf('pizza-funghi').includes('pizza-margherita'));
  assert.deepEqual(variantsOf('owsianka'),[]);
});
