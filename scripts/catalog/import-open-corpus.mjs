import { readFile, writeFile } from 'node:fs/promises';
import { recipes } from '../../apps/web/src/recipes.pl.js';
import { normalize } from '../../apps/web/src/domain.js';

const directory = process.argv[2];
if (!directory) throw new Error('Pass the Open Recipe Corpus data directory');
const revision = '86102603bac07d79b94bc35cba5b50346798cc09';
const records = async path => (await readFile(`${directory}/${path}`, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
const [entries, polish, english] = await Promise.all(['recipes.jsonl', 'text/pl.jsonl', 'text/en.jsonl'].map(records));
const byId = rows => new Map(rows.map(row => [row.id, row]));
const pl = byId(polish), en = byId(english);
const normalizeName = name => normalize(name).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const seen = new Set(recipes.map(recipe => normalizeName(recipe.name)));
const volumes = Object.create(null);
const allowedCategories = ['breakfast','snack','lunch','dinner','dessert','side'];
const allowedKinds = ['main','dessert','soup','side','salad','snack','breakfast','bread','cake','cookie'];
const risky = /\b(tatar|tatara|carpaccio|kogel-mogel|surowe mleko|surowe mięso|pasteryzuj|trujące|muchomor)\b/i;

const ordered = entries.toSorted((a,b) =>
  Number(b.id === 'plwb:2755') - Number(a.id === 'plwb:2755') ||
  Number(a.cuisine === 'polish') - Number(b.cuisine === 'polish') ||
  Number(!en.has(a.id)) - Number(!en.has(b.id))
);
const output = [];
for (const row of ordered) {
  const p = pl.get(row.id);
  if (!p || seen.has(normalizeName(p.name)) || risky.test(p.name) || p.steps.some(step => risky.test(step))) continue;
  if (!allowedCategories.includes(row.category) || !allowedKinds.includes(row.dish_type)) continue;
  if (row.servings < 1 || row.servings > 30 || p.steps.length < 3 || p.ingredients.length < 3 || p.ingredients.length !== row.ingredients.length) continue;
  if (!p.ingredients.every(i => i.name) || row.ingredients.filter(i => Number.isFinite(i.qty) && i.qty > 0).length < 2) continue;
  if (!row.provenance?.url?.startsWith('https://pl.wikibooks.org/') && !row.provenance?.url?.startsWith('https://pl.wikisource.org/')) continue;
  const limits = { jewish:32, other:28 };
  if ((volumes[row.cuisine] ?? 0) >= (limits[row.cuisine] ?? 430)) continue;
  const localized = text => ({
    name: text.name, summary: text.summary, steps: text.steps,
    items: text.ingredients.map((i,j) => [i.name, row.ingredients[j].qty, row.ingredients[j].unit, i.note ?? ''])
  });
  const e = en.get(row.id);
  const cuisine = ({greek:'mediterranean',middle_eastern:'levantine',nordic:'scandinavian',other:'international'})[row.cuisine] ?? row.cuisine;
  output.push({
    id:`open-${row.id.replace(':','-')}`, category:row.category === 'side' || row.dish_type === 'side' ? 'starter' : row.category,
    cuisine, minutes:row.time_min.prep + row.time_min.cook, servings:row.servings,
    allergens:[...new Set(row.allergens.map(a => ({egg:'eggs',tree_nuts:'nuts',shellfish:'crustaceans'})[a] ?? a))],
    pl:localized(p), ...(e && e.ingredients.length === row.ingredients.length ? {en:localized(e)} : {}),
    credit:row.provenance.attribution, source:row.provenance.url,
    history:row.provenance.history_url, license:row.provenance.license, changes:row.provenance.changes,
  });
  seen.add(normalizeName(p.name));
  volumes[row.cuisine] = (volumes[row.cuisine] ?? 0) + 1;
  if (output.length === 430) break;
}
if (output.length !== 430) throw new Error(`Only ${output.length} eligible recipes`);
const target = new URL('../../apps/web/src/catalog-world.js', import.meta.url);
await writeFile(target, `// Open Recipe Corpus, revision ${revision}. Recipe text and adaptations: CC BY-SA 4.0.\n// Per-recipe attribution is included below and displayed in the app.\nexport const worldRecipes = [\n${output.map(row => JSON.stringify(row)).join(',\n')}\n];\n`);
console.log(output.length, output.filter(r => r.en).length, volumes);
