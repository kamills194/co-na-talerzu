import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterRecipes, surprise } from '../src/domain.js';
import { cuisines, categories, messages, t } from '../src/i18n.js';
import { recipes } from '../src/recipes.pl.js';

// Synthetic records: the real catalog gets `cuisine` in a separate change.
const recipe = (id, extra = {}) => ({ id, name: id, category: 'lunch', minutes: 20, servings: 2, vegetarian: false, vegan: false, allergens: [], ingredients: [], steps: [], ...extra });
const sample = [
  recipe('pierogi', { cuisine: 'polish', vegetarian: true }),
  recipe('zurek'), // no `cuisine` → Polish
  recipe('bez-kuchni', { cuisine: undefined, category: 'dinner', vegetarian: true, vegan: true }),
  recipe('risotto', { cuisine: 'italian', vegetarian: true, minutes: 35 }),
  recipe('bruschetta', { cuisine: 'italian', category: 'starter', vegetarian: true, vegan: true, minutes: 10, allergens: ['gluten'] }),
  recipe('kartoffelsalat', { cuisine: 'german', category: 'dinner', vegetarian: true }),
  recipe('omlet', { cuisine: 'french', category: 'breakfast', vegetarian: true, minutes: 10, allergens: ['eggs'] }),
  recipe('ratatouille', { cuisine: 'french', vegetarian: true, vegan: true, minutes: 45 }),
  recipe('miso', { cuisine: 'japanese', category: 'dinner', vegetarian: true, vegan: true, minutes: 15, allergens: ['soy'] }),
];
const ids = list => list.map(r => r.id);

test('Lista kuchni ma ustaloną kolejność i każda kuchnia ma etykietę w słowniku', () => {
  assert.deepEqual(cuisines, ['polish', 'italian', 'german', 'french', 'japanese', 'indian', 'mexican', 'american', 'mediterranean', 'asian', 'chinese', 'thai', 'vietnamese', 'korean', 'spanish', 'portuguese', 'turkish', 'hungarian', 'ukrainian', 'georgian', 'british', 'scandinavian', 'latinamerican', 'african']); // CNT-039 + regiony bota „kucharz”: etykiety nowych kuchni przed danymi
  assert.equal(new Set(cuisines).size, cuisines.length);
  for (const id of cuisines) { assert.ok(messages[id]?.trim(), id); assert.equal(t(id), messages[id]); }
  for (const key of ['cuisine', 'allCuisines', 'cuisineCount']) assert.ok(messages[key]?.trim(), key);
  assert.equal(new Set(cuisines.map(id => messages[id])).size, cuisines.length, 'etykiety kuchni są różne');
  for (const id of cuisines) assert.ok(!categories.includes(id), `${id} koliduje z rodzajem posiłku`);
});
test('Pusty filtr kuchni zwraca wszystkie przepisy', () => {
  assert.equal(filterRecipes(sample, {}).length, sample.length);
  assert.equal(filterRecipes(sample, { cuisine: '' }).length, sample.length);
  assert.equal(filterRecipes(sample).length, sample.length);
});
test('Filtr kuchni wybiera tylko przepisy tej kuchni', () => {
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'italian' })), ['risotto', 'bruschetta']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'german' })), ['kartoffelsalat']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'french' })), ['omlet', 'ratatouille']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'japanese' })), ['miso']);
  assert.deepEqual(filterRecipes(sample, { cuisine: 'thai' }), []);
});
test('Przepis bez pola cuisine liczy się jako kuchnia polska', () => {
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'polish' })), ['pierogi', 'zurek', 'bez-kuchni']);
  for (const c of cuisines.filter(c => c !== 'polish')) assert.ok(!filterRecipes(sample, { cuisine: c }).some(r => r.cuisine === undefined), c);
});
test('Każdy przepis próbki trafia do dokładnie jednej kuchni', () => {
  const total = cuisines.reduce((sum, c) => sum + filterRecipes(sample, { cuisine: c }).length, 0);
  assert.equal(total, sample.length);
});
test('Filtr kuchni łączy się z rodzajem posiłku, dietą, czasem, alergenami i wyszukiwaniem', () => {
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'italian', category: 'starter' })), ['bruschetta']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'italian', category: 'dessert' })), []);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'french', diet: 'vegan' })), ['ratatouille']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'polish', diet: 'vegetarian' })), ['pierogi', 'bez-kuchni']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'polish', category: 'dinner', diet: 'vegan' })), ['bez-kuchni']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'french', maxTime: 15 })), ['omlet']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'french', excluded: ['eggs'] })), ['ratatouille']);
  assert.deepEqual(ids(filterRecipes(sample, { cuisine: 'italian', query: 'RISO' })), ['risotto']);
  assert.deepEqual(ids(filterRecipes(sample, { category: 'dinner' })), ['bez-kuchni', 'kartoffelsalat', 'miso']);
});
test('Losowanie respektuje wybraną kuchnię i unika poprzedniego wyniku', () => {
  for (const rng of [() => 0, () => 0.5, () => 0.999]) {
    assert.equal(surprise(sample, { cuisine: 'italian' }, null, rng).cuisine, 'italian');
    assert.equal(surprise(sample, { cuisine: 'japanese' }, null, rng).id, 'miso');
    assert.ok(['pierogi', 'zurek', 'bez-kuchni'].includes(surprise(sample, { cuisine: 'polish' }, null, rng).id));
  }
  assert.equal(surprise(sample, { cuisine: 'italian' }, 'risotto', () => 0).id, 'bruschetta');
  assert.equal(surprise(sample, { cuisine: 'japanese' }, 'miso', () => 0).id, 'miso', 'jedyny pasujący przepis może się powtórzyć');
  assert.equal(surprise(sample, { cuisine: 'german', category: 'dessert' }), null);
  assert.equal(surprise(sample, { cuisine: 'thai' }), null);
});
test('Obecny katalog działa z filtrem kuchni przed i po dodaniu pola cuisine', () => {
  const total = cuisines.reduce((sum, c) => sum + filterRecipes(recipes, { cuisine: c }).length, 0);
  assert.equal(total, recipes.length, 'każdy przepis katalogu należy do jednej ze znanych kuchni');
  assert.ok(filterRecipes(recipes, { cuisine: 'polish' }).length > 0);
  for (const r of recipes) if (r.cuisine !== undefined) assert.ok(cuisines.includes(r.cuisine), `${r.id}: ${r.cuisine}`);
});
test('Ekran katalogu ma zakładki kuchni ze stanem, a reset czyści kuchnię', async () => {
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(app, /id="cuisine-tabs" role="group" aria-label="\$\{t\('cuisine'\)\}"/);
  assert.match(app, /data-cuisine="\$\{esc\(c\)\}" aria-pressed="\$\{c===filters\.cuisine\}"/);
  assert.match(app, /t\(c\|\|'allCuisines'\)/);
  assert.match(app, /if\(b\.id==='reset'\|\|b\.id==='reset-top'\)\{filters=\{query:'',category:'',cuisine:'',/);
  assert.match(app, /refocus\(`#cuisine-tabs \[data-cuisine=/);
  assert.ok(!/import \{[^}]*cuisines[^}]*\} from '\.\/recipes\.pl\.js'/.test(app), 'lista kuchni pochodzi z i18n.js');
  assert.match(css, /\.cuisine-tabs\{[^}]*overflow-x:auto/);
  assert.match(css, /\.cuisine-tabs button\{[^}]*min-height:4[4-9]px/);
});
