import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recipes, products } from '../src/recipes.pl.js';
import { NUTRITION, UNIT_GRAMS, ZERO_KCAL, MEAT_PRODUCTS, gramsPerUnit, nutritionPerServing } from '../src/nutrition.js';
import { filterRecipes, matchesDiet, DIETS, normalize } from '../src/domain.js';
import { emptyState, validateState, load, save, KEY } from '../src/storage.js';
import { messages, t } from '../src/i18n.js';

const ids = rs => rs.map(r => r.id);
const mk = (id, items, extra = {}) => ({ id, servings:2, vegan:false, vegetarian:false, ...extra, ingredients:items.map(([product,amount])=>({product,amount})), allergens:[...new Set(items.flatMap(([p])=>products[p][2]))] });

test('Każdy produkt ma wartości odżywcze i przeliczenie na gramy', () => {
  for (const id of Object.keys(products)) {
    const n = NUTRITION[id];
    assert.ok(Array.isArray(n) && n.length === 4 && n.every(v => Number.isFinite(v) && v >= 0), `${id}: brak wartości odżywczych`);
    assert.ok(n[0] <= 900 && n[1] + n[2] + n[3] <= 100.5, `${id}: wartości poza zakresem na 100 g`);
    const g = gramsPerUnit(id);
    assert.ok(Number.isFinite(g) && g > 0, `${id}: brak przeliczenia jednostki ${products[id][1]}`);
  }
  assert.deepEqual(Object.keys(NUTRITION).filter(id => !(id in products)), [], 'wartości dla nieistniejących produktów');
  assert.deepEqual(Object.keys(UNIT_GRAMS).filter(id => !(id in products) || ['g','ml'].includes(products[id][1])), []);
  for (const id of ZERO_KCAL) assert.equal(NUTRITION[id][0], 0, id);
});
test('Każda jednostka użyta w przepisach ma przeliczenie dla danego produktu', () => {
  const units = new Set();
  for (const r of recipes) for (const i of r.ingredients) { units.add(products[i.product][1]); assert.ok(gramsPerUnit(i.product) > 0, `${r.id}: ${i.product}`); }
  for (const u of units) if (!['g','ml'].includes(u)) assert.ok(Object.keys(UNIT_GRAMS).some(id => products[id][1] === u), u);
  assert.equal(gramsPerUnit('oil'), 0.92);
  assert.equal(gramsPerUnit('milk'), 1);
  assert.equal(gramsPerUnit('nieznany'), null);
});
test('nutritionPerServing: wynik dla każdego przepisu w rozsądnym zakresie i zgodny z makro', () => {
  for (const r of recipes) {
    const n = nutritionPerServing(r);
    assert.ok(n, `${r.id}: brak wyniku`);
    assert.ok(Number.isInteger(n.kcal), r.id);
    for (const k of ['protein','fat','carbs']) assert.equal(n[k], Math.round(n[k] * 10) / 10, `${r.id}.${k}`);
    // Lower bound 40 kcal, not 50: side salads (mizeria, sunomono) are mostly cucumber and water.
    assert.ok(n.kcal >= 40 && n.kcal <= 1500, `${r.id}: ${n.kcal} kcal`);
    const fromMacros = 4 * n.protein + 4 * n.carbs + 9 * n.fat;
    assert.ok(Math.abs(fromMacros - n.kcal) <= 0.25 * n.kcal, `${r.id}: ${fromMacros} vs ${n.kcal}`);
  }
});
test('nutritionPerServing liczy na porcję, a przy braku danych zwraca null', () => {
  const r = mk('test', [['sugar',100],['water',500],['salt',1]]);
  assert.deepEqual(nutritionPerServing(r), { kcal:200, protein:0, fat:0, carbs:50 });
  assert.deepEqual(nutritionPerServing({ ...r, servings:4 }), { kcal:100, protein:0, fat:0, carbs:25 });
  assert.equal(nutritionPerServing(mk('x', [['oil',100]])).kcal, Math.round(884 * 0.92 / 2));
  assert.equal(nutritionPerServing({ ...r, ingredients:[...r.ingredients, { product:'nieznany', amount:1 }] }), null);
  assert.equal(nutritionPerServing({ ...r, servings:0 }), null);
  assert.equal(nutritionPerServing(null), null);
});
test('Lista mięsa obejmuje każdy produkt o nazwie wskazującej na mięso', () => {
  const stems = ['kurczak','szynk','mies','wieprz','wolow','boczek','kielbas','indyk'];
  for (const [id, [name]] of Object.entries(products))
    if (stems.some(s => normalize(name).includes(s))) assert.ok(MEAT_PRODUCTS.includes(id), `${id} (${name}) brak w MEAT_PRODUCTS`);
  for (const id of MEAT_PRODUCTS) { assert.ok(id in products, id); assert.ok(!products[id][2].includes('fish'), id); }
  for (const r of recipes) if (r.vegetarian) assert.ok(!r.ingredients.some(i => MEAT_PRODUCTS.includes(i.product)), r.id);
});
test('Diety na przepisach syntetycznych', () => {
  const meat = mk('meat', [['chicken',300],['rice',100]]);
  const fish = mk('fish', [['tuna',200],['rice',100]]);
  const veg = mk('veg', [['cheese',200],['bread',2]], { vegetarian:true });
  const vegan = mk('vegan', [['tofu',300],['cabbage',200]], { vegetarian:true, vegan:true });
  const sweet = mk('sweet', [['sugar',300],['butter',100]], { vegetarian:true });
  const all = [meat, fish, veg, vegan, sweet];
  assert.deepEqual(ids(filterRecipes(all, { diet:'pescatarian' })), ['fish','veg','vegan','sweet']);
  assert.deepEqual(ids(filterRecipes(all, { diet:'glutenFree' })), ['meat','fish','vegan','sweet']);
  assert.deepEqual(ids(filterRecipes(all, { diet:'dairyFree' })), ['meat','fish','vegan']);
  // Per serving: meat ≈338 kcal/37 g protein, fish 296/28.8, veg ≈220/21.5, vegan 205/20.1 (just above 20 g), sweet ≈967/0.4.
  assert.deepEqual(ids(filterRecipes(all, { diet:'highProtein' })), ['meat','fish','veg','vegan']);
  assert.deepEqual(ids(filterRecipes(all, { diet:'lowCarb' })), ['vegan']);
  assert.deepEqual(ids(filterRecipes(all, { diet:'light' })), ['meat','fish','veg','vegan']);
  // A recipe without a nutrition estimate never matches a nutrition-based diet (fail closed).
  const unknown = { ...vegan, ingredients:[{ product:'nieznany', amount:1 }] };
  for (const d of ['highProtein','lowCarb','light']) assert.equal(matchesDiet(unknown, d), false, d);
  // Protein share: 25 g protein in 1000 kcal is not "high protein".
  const fatty = mk('fatty', [['chicken',220],['oil',200]]);
  assert.ok(nutritionPerServing(fatty).protein >= 20);
  assert.equal(matchesDiet(fatty, 'highProtein'), false);
});
test("Zgodność wsteczna: '', 'vegetarian' i 'vegan' działają jak dotąd", () => {
  const old = (diet) => recipes.filter(r => !diet || r[diet] === true);
  for (const diet of ['', 'vegetarian', 'vegan']) assert.deepEqual(ids(filterRecipes(recipes, { diet })), ids(old(diet)), diet || 'brak');
  assert.equal(filterRecipes(recipes, {}).length, recipes.length);
  assert.deepEqual(ids(filterRecipes(recipes, { diet:'emoji' })), [], 'nieznana dieta jak dawniej: r[diet]===true');
});
test('Każda z 8 diet zwraca co najmniej 3 przepisy z katalogu i ma polską etykietę', () => {
  assert.equal(DIETS.length, 8);
  for (const d of DIETS) {
    assert.ok(t(d).trim(), d);
    const list = filterRecipes(recipes, { diet:d });
    assert.ok(list.length >= 3, `${d}: ${list.length}`);
    assert.ok(list.length < recipes.length, `${d}: dieta nie zawęża katalogu`);
  }
  const veg = new Set(ids(filterRecipes(recipes, { diet:'vegetarian' })));
  const pesc = new Set(ids(filterRecipes(recipes, { diet:'pescatarian' })));
  for (const id of veg) assert.ok(pesc.has(id), `wegetariański ${id} musi pasować do diety z rybami`);
  for (const r of filterRecipes(recipes, { diet:'glutenFree' })) assert.ok(!r.allergens.includes('gluten'), r.id);
  for (const r of filterRecipes(recipes, { diet:'dairyFree' })) assert.ok(!r.allergens.includes('milk'), r.id);
  assert.equal(messages.anyDiet, 'Bez preferencji');
});
test('Stan bez ustawień nadal się wczytuje, a ustawienie jest opcjonalne i walidowane', () => {
  const memory = new Map(), storage = { getItem:k => memory.get(k), setItem:(k,v) => memory.set(k,v) };
  memory.set(KEY, JSON.stringify({ version:1, favorites:['kakao'], shopping:[], offers:[] }));
  const loaded = load(storage);
  assert.deepEqual(loaded, { version:1, favorites:['kakao'], shopping:[], offers:[] });
  assert.equal(loaded.settings, undefined);
  assert.equal(KEY, 'co-na-talerz:v1');
  const off = { ...emptyState(), settings:{ showNutrition:false } };
  save(storage, off);
  assert.deepEqual(load(storage), off);
  assert.deepEqual(validateState({ ...emptyState(), settings:{} }), emptyState());
  for (const bad of [null, 'x', [], { showNutrition:'nie' }, { showNutrition:0 }]) assert.throws(() => validateState({ ...emptyState(), settings:bad }), JSON.stringify(bad));
});
test('Interfejs: lista diet, blok wartości, przełącznik i esc dla wartości', async () => {
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /\['',\.\.\.DIETS\]\.map/);
  assert.match(app, /id="show-nutrition"/);
  assert.match(app, /t\('nutritionTitle'\)/);
  assert.match(app, /t\('nutritionNote'\)/);
  assert.match(app, /\$\{kcalText\(r\)\}/);
  assert.match(app, /esc\(n\.kcal\)/);
  for (const key of ['nutritionTitle','nutritionNote','showNutrition','nutritionMissing']) assert.ok(messages[key]?.trim(), key);
  assert.equal(messages.nutritionTitle, 'Wartości odżywcze na porcję (szacunkowo)');
  assert.equal(messages.showNutrition, 'Pokazuj kalorie');
});
