import { products } from './recipes.pl.js';
import { market, marketDate } from './market.js';
import { nutritionPerServing, MEAT_PRODUCTS } from './nutrition.js';
export const normalize = s => String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').trim();
// Diets offered in the UI (CNT-025), in display order. The first five follow from ingredients,
// the last three from the per-serving nutrition estimate (nutrition.js); without an estimate they fail closed.
export const DIETS = ['vegetarian','vegan','pescatarian','glutenFree','dairyFree','highProtein','lowCarb','light'];
const dietRules = {
  pescatarian: r => !r.ingredients.some(i=>MEAT_PRODUCTS.includes(i.product)),
  glutenFree: r => !r.allergens.includes('gluten'),
  dairyFree: r => !r.allergens.includes('milk'),
  highProtein: r => { const n=nutritionPerServing(r); return !!n && n.kcal>0 && n.protein>=20 && n.protein*4/n.kcal>=0.2; },
  lowCarb: r => { const n=nutritionPerServing(r); return !!n && n.carbs<=20; },
  light: r => { const n=nutritionPerServing(r); return !!n && n.kcal<=450; },
};
// '' = no preference; 'vegetarian'/'vegan' (and any other key) keep the original recipe-flag rule.
export function matchesDiet(r, diet) { return !diet || (Object.hasOwn(dietRules,diet) ? dietRules[diet](r) : r[diet]===true); }
export function filterRecipes(recipes, {query='',category='',cuisine='',maxTime=0,diet='',excluded=[],excludedProducts=[]}={}) {
  const q=normalize(query);
  // A recipe without `cuisine` belongs to the Polish catalog (records older than CNT-024).
  return recipes.filter(r => (!category || r.category===category) && (!cuisine || (r.cuisine||'polish')===cuisine) && (!Number(maxTime) || r.minutes<=Number(maxTime)) && matchesDiet(r,diet) && !r.allergens.some(a=>excluded.includes(a)) && !r.ingredients.some(i=>excludedProducts.includes(i.product)) && (!q || normalize([r.name,...r.ingredients.map(i=>products[i.product][0])].join(' ')).includes(q)));
}
export function surprise(recipes, filters, previousId, rng=Math.random) {
  const matches=filterRecipes(recipes,filters);
  const pool=matches.length>1 ? matches.filter(r=>r.id!==previousId) : matches;
  return pool.length ? pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))] : null;
}
export function addIngredients(list,recipe,servings) {
  const result=list.map(i=>({...i}));
  for (const item of recipe.ingredients) {
    const amount=item.amount*servings/recipe.servings;
    // Match by product only; a custom (named) entry never absorbs recipe amounts.
    const found=result.find(i=>i.product===item.product);
    if(found) { found.amount=Math.round((found.amount+amount)*1000)/1000; found.done=false; }
    else result.push({id:item.product,product:item.product,amount:Math.round(amount*1000)/1000,done:false});
  }
  return result;
}
// Device-local calendar day. Kept for compatibility (file names, legacy callers); offer validity
// must use marketDate() so that a phone in another time zone sees the same offers as one in Poland.
export function localDate(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
const isDay=v=>typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
const isText=(v,max)=>typeof v==='string' && !!v.trim() && v.length<=max;
// Base contract shared by user notes and automatic offers. `region` is an optional free-text
// scope of a user note; records saved before it existed stay valid.
export function validOffer(o) { return !!o && typeof o.id==='string' && o.id.length<100 && o.product in products && typeof o.store==='string' && !!o.store.trim() && o.store.length<=100 && Number.isFinite(o.price) && o.price>0 && o.price<=100000 && typeof o.source==='string' && !!o.source.trim() && o.source.length<=500 && isDay(o.until) && (o.region===undefined || typeof o.region==='string' && o.region.length<=100); }
// `until` is the last valid day, inclusive, in the market time zone.
export function isOfferExpired(o,now=new Date()) { return !(o?.until>=marketDate(now)); }
export function matchingOffers(recipe,offers,today=marketDate()) { return offers.filter(o=>validOffer(o)&&o.until>=today&&recipe.ingredients.some(i=>i.product===o.product)); }
// Scope of an automatic offer: explicit nationwide, explicit regions, or honestly unverified.
// There is no default: a record without scope is not displayable.
export function validScope(s) {
  if(!s || typeof s!=='object' || Array.isArray(s)) return false;
  if(s.type==='nationwide') return s.note===undefined || isText(s.note,300);
  if(s.type==='region') return Array.isArray(s.regions) && s.regions.length>0 && s.regions.length<=50 && s.regions.every(r=>isText(r,100));
  if(s.type==='unverified') return isText(s.note,300);
  return false;
}
// Full contract of an automatic (bot) offer for the active market. Fail closed on any gap.
export function validAutomaticOffer(o) {
  if(!validOffer(o) || o.market!==market.id || o.currency!==market.currency) return false;
  if(!isText(o.name,200) || !isText(o.unit,100) || !isText(o.conditions,500) || !validScope(o.scope)) return false;
  if(!isDay(o.from) || o.from>o.until || typeof o.fetchedAt!=='string' || typeof o.validUntil!=='string') return false;
  const fetched=Date.parse(o.fetchedAt), end=Date.parse(o.validUntil);
  // `until` must be the market-zone day of the exact end instant, otherwise the record is inconsistent.
  return Number.isFinite(fetched) && Number.isFinite(end) && marketDate(new Date(end))===o.until;
}
// Time rules only: read at most 48 h ago (inclusive), not read in the future, end instant not
// passed (inclusive) and already started on the market calendar. Exact instants do not depend on
// the device time zone; the start day is compared in the market time zone.
export function isCurrentAutomaticOffer(o,now=new Date()) {
  const fetched=Date.parse(o?.fetchedAt), end=Date.parse(o?.validUntil);
  return validOffer(o) && Number.isFinite(fetched) && Number.isFinite(end) && fetched<=now.getTime() && now.getTime()-fetched<=48*60*60*1000 && end>=now.getTime() && o.from<=marketDate(now);
}
// What the UI may show and recommend: complete contract AND still current.
export function isDisplayableAutomaticOffer(o,now=new Date()) { return validAutomaticOffer(o) && isCurrentAutomaticOffer(o,now); }
