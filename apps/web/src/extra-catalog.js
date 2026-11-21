import { worldRecipes } from './catalog-world.js';

const emojis = { breakfast:'🥣', snack:'🍴', lunch:'🍲', dinner:'🍽️', dessert:'🍰', starter:'🥗' };
const categories = Object.keys(emojis);
const additions = new Map();
const worldLocale = new Map();
const worldIds = new Set(worldRecipes.map(row => row.id));
const knownSources = new Set(worldRecipes.flatMap(row => [row.pl&&'pl:'+row.source,row.en&&'en:'+row.source].filter(Boolean)));

export function isExtraRecipeId(id) {
  return worldIds.has(id) || (typeof id === 'string' && /^web-[a-z]{2}-[a-z0-9-]{1,90}$/.test(id));
}
export function addWebRecipes(rows) {
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || !isExtraRecipeId(row.id) || worldIds.has(row.id) || !categories.includes(row.category)) continue;
    if (knownSources.has((row.pl?'pl:':'en:')+row.source)) continue;
    additions.set(row.id,row);
  }
}
function localize(row, language) {
  const text = row[language];
  if (!text || typeof text.name !== 'string' || !Array.isArray(text.steps) ||
      !Array.isArray(row.allergens) || !Array.isArray(text.items) ||
      !text.items.every(item => Array.isArray(item) && typeof item[0] === 'string')) return [];
  return [{ ...row, ...text, external:true, emoji:emojis[row.category], ingredients:[] }];
}
export function extraRecipes(language) {
  if(!worldLocale.has(language))worldLocale.set(language,worldRecipes.flatMap(row=>localize(row,language)));
  return [...worldLocale.get(language),...[...additions.values()].flatMap(row=>localize(row,language))];
}
const units = {
  pl:{ pcs:'szt.', tbsp:'łyżka', tsp:'łyżeczka', cup:'szklanka', pinch:'szczypta', clove:'ząbek', bunch:'pęczek', packet:'opak.', piece:'szt.', slice:'plaster', glass:'szklanka', handful:'garść', stalk:'łodyga', sprig:'gałązka', dash:'odrobina' },
  en:{ pcs:'pc', tbsp:'tbsp', tsp:'tsp', cup:'cup', pinch:'pinch', clove:'clove', bunch:'bunch', packet:'packet', piece:'pc', slice:'slice', glass:'glass', handful:'handful', stalk:'stalk', sprig:'sprig', dash:'dash' },
};
export function extraAmount([,qty,unit], language, formatter) {
  if (!(Number.isFinite(qty) && qty > 0)) return '';
  if (unit === 'to_taste' || unit === 'unspecified') return formatter(qty);
  const unitText = units[language]?.[unit] ?? unit ?? '';
  return `${formatter(qty)} ${unitText}`.trim();
}

// Exact plain-name matches only. Unlike an alias or a similar-looking product,
// an exact match with compatible units can use the existing shopping-list quantities.
export function mappedExtraItem([name,qty,unit], productLookup) {
  if (!(Number.isFinite(qty) && qty > 0)) return null;
  const match=productLookup.get(name.normalize('NFC').trim().toLocaleLowerCase('pl'));
  if(!match)return null;
  const [product,target]=match;
  const compatible={g:['g',1], kg:['g',1000], ml:['ml',1], l:['ml',1000],
    pcs:['szt.',1], piece:['szt.',1], 'szt.':['szt.',1], tsp:['łyżeczka',1], clove:['ząbek',1]};
  const conversion=compatible[unit];
  return conversion && conversion[0]===target ? {product,amount:qty*conversion[1]} : null;
}
