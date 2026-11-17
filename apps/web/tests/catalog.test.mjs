import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes, products, cuisines } from '../src/recipes.pl.js';
import { categories, allergens } from '../src/i18n.js';
import { filterRecipes } from '../src/domain.js';
// IDs of the 18 pilot recipes. Favorites stored on users' devices refer to them, so they must stay.
const ORIGINAL_IDS = ['owsianka','jajecznica','owsianka-wodna','twarożek','jogurt','hummus-kanapki','pomidorowa','kurczak','makaron','soczewica','salatka','omlet','grzanki','placuszki','pieczone-jablka','kakao','marchewki','pasta-fasolowa'];
// Product IDs of the pilot catalog. Shopping lists stored on users' devices refer to them.
const ORIGINAL_PRODUCTS = ['oats','milk','apple','cinnamon','egg','butter','bread','tomato','cheese','yogurt','radish','cucumber','banana','carrot','hummus','rice','passata','water','oil','salt','potato','chicken','paprika','pasta','onion','lentils','chickpeas','pepper','flour','sugar','cocoa','beans','lemon','garlic'];
// Products without a declared allergen that still exclude a diet. Extend when adding meat, fish or other animal products.
const MEAT = ['chicken','ham','mincedpork'];
// Explicit on purpose: a new fish product must be added here by hand, the test below compares it with the allergen data.
const FISH = ['mackerel','tuna'];
// IDs of the 30 recipes published before CNT-023 (18 pilot + 12 from CNT-015).
const CATALOG_30_IDS = [...ORIGINAL_IDS,'pasta-jajeczna','kasza-manna','pasta-z-makreli','koktajl-kefirowy','placki-ziemniaczane','leniwe','potrawka-z-kurczaka','kasza-z-jajkiem','ziemniaki-z-gzikiem','nalesniki-z-twarogiem','surowka-z-marchewki','mizeria'];
// Products available before CNT-023, with units. Shopping lists stored on users' devices refer to them.
const CATALOG_30_PRODUCTS = {oats:'g',milk:'ml',apple:'szt.',cinnamon:'łyżeczka',egg:'szt.',butter:'g',bread:'kromka',tomato:'szt.',cheese:'g',yogurt:'g',radish:'szt.',cucumber:'szt.',banana:'szt.',carrot:'szt.',hummus:'g',rice:'g',passata:'ml',water:'ml',oil:'ml',salt:'łyżeczka',potato:'g',chicken:'g',paprika:'łyżeczka',pasta:'g',onion:'szt.',lentils:'g',chickpeas:'g',pepper:'szt.',flour:'g',sugar:'g',cocoa:'g',beans:'g',lemon:'szt.',garlic:'ząbek',semolina:'g',buckwheat:'g',kefir:'ml',sourcream:'g',mackerel:'g',chives:'pęczek',dill:'pęczek',blackpepper:'szczypta'};
// Pantry basics that do not count toward the limit of 8 ingredients of a simple dish.
const UNCOUNTED = ['salt','water','oil','blackpepper'];
const isNew = r => !CATALOG_30_IDS.includes(r.id);
const ANIMAL_ALLERGENS = ['milk','eggs','fish'];
const has = (r,ids) => r.ingredients.some(i=>ids.includes(i.product));
test('Katalog ma 70 przepisów o unikalnych ID i zachowuje 18 pierwotnych ID',()=>{
  assert.equal(recipes.length,70);
  assert.equal(new Set(recipes.map(r=>r.id)).size,70);
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
  const expect={soysauce:['soy','gluten'],miso:['soy'],tofu:['soy'],sesame:['sesame'],hummus:['sesame'],tuna:['fish'],mackerel:['fish'],mozzarella:['milk'],yellowcheese:['milk'],ham:['soy','milk','celery','mustard']};
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
  assert.equal(new Set(recipes.map(r=>r.photoAlt)).size,70);
});
test('Każdy przepis ma nazwę, 2 porcje, realny czas i co najmniej 3 niepuste kroki',()=>{
  for(const r of recipes){
    assert.ok(typeof r.name==='string'&&r.name.trim(),r.id);
    assert.equal(r.servings,2,r.id);
    assert.ok(Number.isInteger(r.minutes)&&r.minutes>=5&&r.minutes<=120,r.id);
    assert.ok(r.steps.length>=3,r.id);
    assert.ok(r.steps.every(s=>typeof s==='string'&&s.trim().length>=15),r.id);
    assert.ok(r.ingredients.length>=2,r.id);
  }
  assert.equal(new Set(recipes.map(r=>r.name)).size,70);
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
  assert.equal(recipes.filter(isNew).length,40);
  assert.equal(Object.keys(CATALOG_30_PRODUCTS).length,42);
  for(const [id,unit] of Object.entries(CATALOG_30_PRODUCTS)){
    assert.ok(id in products,`brak wcześniejszego produktu ${id}`);
    assert.equal(products[id][1],unit,id);
  }
});
test('Lista kuchni to pięć kuchni startowych, a każdy przepis ma jedną z nich',()=>{
  assert.deepEqual(cuisines,['polish','italian','german','french','japanese']);
  for(const r of recipes) assert.ok(cuisines.includes(r.cuisine),`${r.id}: kuchnia ${r.cuisine}`);
});
test('Każda kuchnia ma co najmniej 6 przepisów, a kuchnie inne niż polska obejmują kilka kategorii',()=>{
  for(const c of cuisines){
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
test('Nowe przepisy są proste: najwyżej 30 minut i najwyżej 8 liczonych składników',()=>{
  for(const r of recipes.filter(isNew)){
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
