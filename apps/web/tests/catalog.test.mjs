import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes, products } from '../src/recipes.pl.js';
import { categories, allergens } from '../src/i18n.js';
import { filterRecipes } from '../src/domain.js';
// IDs of the 18 pilot recipes. Favorites stored on users' devices refer to them, so they must stay.
const ORIGINAL_IDS = ['owsianka','jajecznica','owsianka-wodna','twarożek','jogurt','hummus-kanapki','pomidorowa','kurczak','makaron','soczewica','salatka','omlet','grzanki','placuszki','pieczone-jablka','kakao','marchewki','pasta-fasolowa'];
// Product IDs of the pilot catalog. Shopping lists stored on users' devices refer to them.
const ORIGINAL_PRODUCTS = ['oats','milk','apple','cinnamon','egg','butter','bread','tomato','cheese','yogurt','radish','cucumber','banana','carrot','hummus','rice','passata','water','oil','salt','potato','chicken','paprika','pasta','onion','lentils','chickpeas','pepper','flour','sugar','cocoa','beans','lemon','garlic'];
// Products without a declared allergen that still exclude a diet. Extend when adding meat, fish or other animal products.
const MEAT = ['chicken'];
const FISH = Object.keys(products).filter(id=>products[id][2].includes('fish'));
const ANIMAL_ALLERGENS = ['milk','eggs','fish'];
const has = (r,ids) => r.ingredients.some(i=>ids.includes(i.product));
test('Katalog ma 30 przepisów o unikalnych ID i zachowuje 18 pierwotnych ID',()=>{
  assert.equal(recipes.length,30);
  assert.equal(new Set(recipes.map(r=>r.id)).size,30);
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
  assert.equal(new Set(recipes.map(r=>r.photoAlt)).size,30);
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
  assert.equal(new Set(recipes.map(r=>r.name)).size,30);
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
test('Każda kategoria ma co najmniej 3 przepisy',()=>{
  for(const c of categories) assert.ok(recipes.filter(r=>r.category===c).length>=3,c);
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
