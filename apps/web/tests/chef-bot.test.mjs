// Bot „kucharz” (scripts/bots/chef.mjs): walidator, odczyt strumienia API i niezmienniki dań dodanych przez bota.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipes, products, cuisines } from '../src/recipes.pl.js';
import { data as bot } from '../src/recipes.bot.pl.js';
import { categories, allergens } from '../src/i18n.js';
import { MEAT_PRODUCTS, NUTRITION, UNIT_GRAMS, DENSITY, nutritionPerServing } from '../src/nutrition.js';
import { validateCandidate, acceptedSources, pickRegion, mergeAccepted, kindOf, LANGS, KINDS } from '../../../scripts/bots/chef-validate.mjs';
import { readStream } from '../../../scripts/bots/chef.mjs';

const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/chef-candidate.json', import.meta.url)));
const UNITS = ['g','ml','szt.','łyżeczka','kromka','ząbek','pęczek','szczypta','doniczka'];
const ctx = { products, recipes, cuisines, categories, allergens, meat: MEAT_PRODUCTS, nutrition: NUTRITION, unitGrams: UNIT_GRAMS, density: DENSITY, botKinds: bot.kinds, units: UNITS };
const fresh = () => { const c = fixture(); if (recipes.some(r => r.id === c.id)) { c.id += '-test'; c.texts.pl.name += ' (test)'; c.texts.pl.photoAlt += ' (test)'; } if ('hotpaprika' in products) { c.newProducts.hotpaprika2 = { ...c.newProducts.hotpaprika, name: 'Papryka ostra mielona (test)' }; delete c.newProducts.hotpaprika; c.ingredients.find(i => i.product === 'hotpaprika').product = 'hotpaprika2'; } return c; };
const errorsOf = c => validateCandidate(c, ctx).errors.join(' | ');

test('Walidator przyjmuje poprawne danie i sam liczy alergeny oraz diety', () => {
  const v = validateCandidate(fresh(), ctx);
  assert.ok(v.ok, v.errors.join('; '));
  assert.equal(v.recipe.vegan, true); assert.equal(v.recipe.vegetarian, true);
  assert.deepEqual(v.recipe.allergens, []);
  assert.equal(v.recipe.review, 'bot'); assert.equal(v.recipe.servings, 2); assert.equal(v.recipe.photo, null);
  for (const l of LANGS.slice(1)) assert.equal(v.translations[l].recipe.steps.length, v.recipe.steps.length, l);
});
test('Walidator: dieta z modelu niezgodna z produktami, mięso i ryby', () => {
  const c = fresh(); c.ingredients.push({ product: 'chicken', amount: 300 });
  c.texts.pl.steps[1] += ' Dodaj kurczaka i smaż do pełnego dogotowania.';
  assert.match(errorsOf(c), /vegan=true/);
  c.vegan = false; c.vegetarian = false;
  const v = validateCandidate(c, ctx); assert.equal(v.recipe?.vegetarian ?? false, false);
  const fish = fresh(); fish.newProducts.salmon = { name: 'Łosoś, filet', unit: 'g', allergens: [], kind: 'plant', nutrition: [200, 20, 13, 0], names: Object.fromEntries(LANGS.slice(1).map(l => [l, 'Salmon'])) };
  fish.ingredients.push({ product: 'salmon', amount: 200 });
  assert.match(errorsOf(fish), /rybę/); assert.match(errorsOf(fish), /tekst|krok|składnik|rybę/);
});
test('Walidator wymaga alergenu wskazanego nazwą (owoce morza, orzeszki ziemne) i zna rodzaj seafood', () => {
  const prawns = () => ({ name: 'Krewetki koktajlowe', unit: 'g', allergens: [], kind: 'seafood', nutrition: [90, 20, 1, 0], names: Object.fromEntries(LANGS.slice(1).map(l => [l, 'Prawns'])) });
  const c = fresh(); c.newProducts.prawns = prawns(); c.ingredients.push({ product: 'prawns', amount: 200 });
  c.texts.pl.steps[2] += ' Dodaj krewetki i smaż 3 minuty.'; c.vegan = false; c.vegetarian = false;
  assert.match(errorsOf(c), /crustaceans/);
  c.newProducts.prawns.allergens = ['crustaceans'];
  const v = validateCandidate(c, ctx); assert.ok(v.ok, v.errors.join('; '));
  assert.equal(v.recipe.vegetarian, false); assert.ok(v.recipe.allergens.includes('crustaceans'));
  const d = fresh(); Object.values(d.newProducts)[0].allergens = ['shellfish']; assert.match(errorsOf(d), /alergeny spoza listy/);
  const pb = fresh(); Object.assign(Object.values(pb.newProducts)[0], { name: 'Masło orzechowe' }); assert.match(errorsOf(pb), /peanuts/);
  assert.equal(kindOf('wine', products, MEAT_PRODUCTS), 'plant'); assert.ok(products.wine[2].includes('sulphites'));
});
test('Walidator: kroki w każdym języku, znaki HTML, duplikaty, jednostki i czas', () => {
  const c = fresh(); c.texts.de.steps.pop(); assert.match(errorsOf(c), /de: liczba kroków/);
  const h = fresh(); h.texts.en.name = 'Lecsó <b>'; assert.match(errorsOf(h), /niedozwolony znak/);
  const dup = fresh(); dup.texts.pl.name = recipes[0].name; assert.match(errorsOf(dup), /już jest w katalogu/);
  const id = fresh(); id.id = recipes[0].id; assert.match(errorsOf(id), /już istnieje/);
  const u = fresh(); Object.values(u.newProducts)[0].unit = 'łyżka'; assert.match(errorsOf(u), /jednostka/);
  const t = fresh(); t.minutes = 300; assert.match(errorsOf(t), /czas/);
  const e = fresh(); e.emoji = '🫑🍅'; assert.match(errorsOf(e), /emoji/);
  const k = fresh(); k.ingredients[0].amount = 40; k.ingredients[1].amount = 30; assert.match(errorsOf(k), /ilość|kcal/);
});
test('Źródła: liczą się tylko adresy z wyników wyszukiwania', () => {
  assert.deepEqual(acceptedSources(['https://a.example/x/', 'https://wymyslone.example/y', 'javascript:alert(1)'], new Set(['https://a.example/x?utm=1'])), ['https://a.example/x']);
  assert.deepEqual(acceptedSources(undefined, new Set()), []);
});
test('Wybór regionu: jedna z trzech najmniej licznych kuchni', () => {
  const list = [{ cuisine: 'polish' }, { cuisine: 'polish' }, { cuisine: 'italian' }];
  for (const r of [0, 0.5, 0.99]) assert.ok(['german', 'french', 'italian'].includes(pickRegion(['polish', 'italian', 'german', 'french'], list, () => r)));
});
test('Scalanie nie zmienia danych wejściowych i dopisuje tłumaczenia', () => {
  const v = validateCandidate(fresh(), ctx);
  const pl = { products: {}, kinds: {}, nutrition: {}, unitGrams: {}, recipes: [] }, langs = Object.fromEntries(LANGS.slice(1).map(l => [l, { products: {}, recipes: {} }]));
  const out = mergeAccepted(pl, langs, [v]);
  assert.equal(pl.recipes.length, 0); assert.equal(out.pl.recipes.length, 1);
  assert.equal(out.langs.en.recipes[v.recipe.id].name, v.translations.en.recipe.name);
});
test('Odczyt strumienia API składa wywołanie narzędzia i wyniki wyszukiwania', async () => {
  const ev = [
    { type: 'message_start', message: { id: 'm', content: [] } },
    { type: 'content_block_start', index: 0, content_block: { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a.example/' }] } },
    { type: 'content_block_stop', index: 0 },
    { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', name: 'submit_review', input: {} } },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"reviews":[{"id":' } },
    { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"x"}]}' } },
    { type: 'content_block_stop', index: 1 },
    { type: 'message_delta', delta: { stop_reason: 'tool_use' } },
  ];
  const text = ev.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
  const enc = new TextEncoder().encode(text);
  async function* chunks() { for (let i = 0; i < enc.length; i += 37) yield enc.slice(i, i + 37); }
  const msg = await readStream(chunks());
  assert.equal(msg.stop_reason, 'tool_use');
  assert.equal(msg.content[0].content[0].url, 'https://a.example/');
  assert.deepEqual(msg.content[1].input, { reviews: [{ id: 'x' }] });
});

// ---------- Niezmienniki danych bota (sprawdzane przy każdym commicie bota) ----------
test('Dania bota: kompletne rekordy, źródła, diety i alergeny zgodne z produktami', () => {
  const botIds = new Set(bot.recipes.map(r => r.id));
  assert.equal(recipes.filter(r => r.review === 'bot').length, bot.recipes.length, 'danie bota nadpisało przepis redakcji');
  for (const r of recipes.filter(x => botIds.has(x.id))) {
    assert.equal(r.review, 'bot', r.id);
    assert.ok(cuisines.includes(r.cuisine) && categories.includes(r.category), r.id);
    assert.ok(Array.isArray(r.sources) && r.sources.length >= 1 && r.sources.every(u => /^https?:\/\//.test(u)), `${r.id}: brak źródeł`);
    const kinds = r.ingredients.map(i => kindOf(i.product, products, MEAT_PRODUCTS, bot.kinds));
    assert.equal(r.vegetarian, !kinds.some(k => k === 'meat' || k === 'fish' || k === 'seafood'), `${r.id}: vegetarian`);
    assert.equal(r.vegan, kinds.every(k => k === 'plant'), `${r.id}: vegan`);
    assert.deepEqual([...r.allergens].sort(), [...new Set(r.ingredients.flatMap(i => products[i.product][2]))].sort(), `${r.id}: alergeny`);
    const n = nutritionPerServing(r); assert.ok(n && n.kcal >= 40 && n.kcal <= 1500, `${r.id}: kcal`);
    if (r.variantOf) assert.ok(recipes.some(x => x.id === r.variantOf), `${r.id}: nieznane danie bazowe`);
  }
  for (const [id, p] of Object.entries(bot.products)) {
    assert.ok(KINDS.includes(bot.kinds[id]), `${id}: rodzaj`);
    assert.ok(p[2].every(a => allergens.includes(a)), `${id}: alergeny`);
    assert.ok(Array.isArray(bot.nutrition[id]), `${id}: wartości odżywcze`);
    if (!['g', 'ml'].includes(p[1])) assert.ok(bot.unitGrams[id] > 0, `${id}: przeliczenie jednostki`);
  }
});
test('Dania bota mają tłumaczenia we wszystkich językach z tą samą liczbą kroków', async () => {
  for (const l of LANGS.slice(1)) {
    const { data } = await import(`../src/recipes.bot.${l}.js`);
    for (const r of bot.recipes) {
      const tr = data.recipes[r.id];
      assert.ok(tr?.name && tr.photoAlt && tr.steps?.length === r.steps.length, `${l}: ${r.id}`);
    }
    for (const id of Object.keys(bot.products)) assert.ok(data.products[id], `${l}: produkt ${id}`);
  }
});
test('Wersje dań: danie bota z variantOf dołącza do grupy dania bazowego', async () => {
  const { variantsOf } = await import('../src/domain.js');
  const list = [...recipes, { id: 'pierogi-z-jagodami-bot', variantOf: 'pierogi-ruskie' }, { id: 'lecso-bot', variantOf: 'lecso-base' }, { id: 'lecso-base' }];
  assert.ok(variantsOf('pierogi-ruskie', list).includes('pierogi-z-jagodami-bot'));
  assert.ok(variantsOf('pierogi-z-jagodami-bot', list).includes('pierogi-z-miesem'));
  assert.deepEqual(variantsOf('lecso-base', list), ['lecso-bot']);
  assert.deepEqual(variantsOf('lecso-bot', list), ['lecso-base']);
  assert.deepEqual(variantsOf('owsianka'), []);
});
