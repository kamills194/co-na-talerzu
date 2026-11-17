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
// `extraText(recipe)` (optional, CNT-030) returns more searchable strings, e.g. the recipe and product names in
// the UI language; the Polish names are always searched as well.
// `minTime` (CNT-034, optional): only recipes taking at least that many minutes (e.g. 61 = "over 60 min");
// 0 or absent = no lower bound, so existing callers keep working.
// CNT-039: both bounds compare the displayed (bucketed) time, timeBucket(r.minutes).minutes, so "Do 30 min"
// shows exactly the dishes labelled 15 or 30 min. Stored minutes never change.
export function filterRecipes(recipes, {query='',category='',cuisine='',maxTime=0,minTime=0,diet='',excluded=[],excludedProducts=[]}={}, {extraText}={}) {
  const q=normalize(query);
  // A recipe without `cuisine` belongs to the Polish catalog (records older than CNT-024).
  return recipes.filter(r => (!category || r.category===category) && (!cuisine || (r.cuisine||'polish')===cuisine) && (!Number(maxTime) || timeBucket(r.minutes).minutes<=Number(maxTime)) && (!Number(minTime) || timeBucket(r.minutes).minutes>=Number(minTime)) && matchesDiet(r,diet) && !r.allergens.some(a=>excluded.includes(a)) && !r.ingredients.some(i=>excludedProducts.includes(i.product)) && (!q || normalize([r.name,...r.ingredients.map(i=>products[i.product][0]),...(extraText?extraText(r):[])].join(' ')).includes(q)));
}
export function surprise(recipes, filters, previousId, rng=Math.random) {
  const matches=filterRecipes(recipes,filters);
  const pool=matches.length>1 ? matches.filter(r=>r.id!==previousId) : matches;
  return pool.length ? pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))] : null;
}
export function addIngredients(list,recipe,servings) {
  const result=list.map(i=>({...i}));
  // CNT-034: an empty or invalid servings value (0, NaN, negative) must never add zero/negative amounts,
  // which the storage contract rejects (every later save would fail). The list is returned unchanged.
  if(!(Number.isFinite(servings) && servings>0)) return result;
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
// ---------- CNT-027 / CNT-029: recipes and ingredients by current promotions ----------
// Pantry staples do not count towards the promotion share of a recipe. `pepper` in the catalog is a
// fresh bell pepper (a real ingredient); the pantry pepper is `blackpepper`.
export const pantryProducts = Object.freeze(['salt','water','blackpepper','oil']);
// https only, no credentials and no characters that could break out of an HTML attribute; else null.
export function safeOfferUrl(url) {
  if(typeof url!=='string' || url.length>500 || !/^https:\/\/[^\s"'<>`]+$/.test(url)) return null;
  try { const u=new URL(url); return u.protocol==='https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
/**
 * Display record of one offer for the UI (CNT-029). Built only from offers that pass
 * isDisplayableAutomaticOffer (full CNT-016 contract and still current at `now`).
 * @typedef {Object} OfferView
 * @property {string} id         offer ID
 * @property {string} product    catalog product ID
 * @property {string} name       shop product name (plain text — escape before inserting into HTML)
 * @property {number} price      gross price in `currency`, for `unit`
 * @property {string} currency   ISO 4217, always the market currency (PLN)
 * @property {string} unit       shop unit text, e.g. "Cena za kg"
 * @property {string} store      shop name, e.g. "ALDI"
 * @property {string} from       first valid day (YYYY-MM-DD, market time zone)
 * @property {string} until      last valid day (YYYY-MM-DD, market time zone)
 * @property {string} validUntil exact end instant (ISO)
 * @property {?string} url       source URL if https (safe for href), otherwise null
 * @property {{type:'nationwide'|'region'|'unverified', note?:string, regions?:string[]}} scope
 * @property {string} conditions conditions text from the source
 * @property {?number} regularPrice strike-through price from the source, if numeric
 * @property {string} fetchedAt  read instant (ISO)
 */
function offerView(o) {
  return { id:o.id, product:o.product, name:o.name, price:o.price, currency:o.currency, unit:o.unit, store:o.store, from:o.from, until:o.until, validUntil:o.validUntil, url:safeOfferUrl(o.source),
    scope:o.scope.type==='region' ? {type:'region',regions:[...o.scope.regions]} : {type:o.scope.type,...(o.scope.note!==undefined?{note:o.scope.note}:{})},
    conditions:o.conditions, regularPrice:Number.isFinite(o.regularPrice)?o.regularPrice:null, fetchedAt:o.fetchedAt };
}
// Best offer per product: lowest nominal price; on a tie the one valid longer (later validUntil),
// then the smaller ID, so the result does not depend on the order of `offers`.
// Prices are compared as given: unit texts ("za kg", "za szt.") are not converted.
function bestOffers(offers,now) {
  const best=new Map();
  for(const o of Array.isArray(offers)?offers:[]) {
    if(!isDisplayableAutomaticOffer(o,now)) continue;
    const b=best.get(o.product);
    if(!b || o.price<b.price || o.price===b.price && (Date.parse(o.validUntil)>Date.parse(b.validUntil) || Date.parse(o.validUntil)===Date.parse(b.validUntil) && o.id<b.id)) best.set(o.product,o);
  }
  return best;
}
const countableProducts=recipe=>[...new Set(recipe.ingredients.map(i=>i.product))].filter(p=>!pantryProducts.includes(p));
function coverageFrom(recipe,best) {
  const countable=countableProducts(recipe);
  const matched=countable.filter(p=>best.has(p)).map(product=>({product,offer:offerView(best.get(product))}));
  return { matched, count:matched.length, countable:countable.length, share:countable.length ? matched.length/countable.length : 0 };
}
/**
 * Promotion coverage of a recipe at `now`.
 * @returns {{matched:{product:string,offer:OfferView}[], count:number, countable:number, share:number}}
 * `matched` follows ingredient order and holds only non-pantry products; `share` = count/countable (0 when
 * nothing is countable). No basket total is returned: offer prices are per different units
 * (kg, piece, pack) and are not converted to recipe amounts, so a sum would be a false price.
 */
export function promoCoverage(recipe,offers,now=new Date()) { return coverageFrom(recipe,bestOffers(offers,now)); }
// Recipes ordered by promotions: more matched ingredients first, then higher share, then original
// order (stable). Recipes without any match keep their original order after the others.
export function rankByPromotions(recipes,offers,now=new Date()) {
  const best=bestOffers(offers,now);
  return recipes.map((recipe,index)=>({recipe,index,c:coverageFrom(recipe,best)}))
    .sort((a,b)=>b.c.count-a.c.count || b.c.share-a.c.share || a.index-b.index).map(x=>x.recipe);
}
/**
 * Per ingredient (recipe order, pantry included and flagged) the best current offer or null.
 * @returns {{product:string, amount:number, pantry:boolean, offer:?OfferView}[]}
 */
export function ingredientOffers(recipe,offers,now=new Date()) {
  const best=bestOffers(offers,now);
  return recipe.ingredients.map(i=>({product:i.product,amount:i.amount,pantry:pantryProducts.includes(i.product),offer:best.has(i.product)?offerView(best.get(i.product)):null}));
}
// ---------- CNT-029 (rozszerzenie) / CNT-039: losowanie ważone promocjami, większa różnorodność ----------
// Uniform number in [0, 1) from crypto.getRandomValues when available (better spread than Math.random on some
// engines); falls back to Math.random. `source` is injectable for tests.
export function secureRandom(source=globalThis.crypto) {
  try { if(typeof source?.getRandomValues==='function'){ const a=new Uint32Array(1); source.getRandomValues(a); return a[0]/4294967296; } } catch { /* fall through */ }
  return Math.random();
}
// Promotion bias, softened in CNT-039 (was 1 + 2 × matched): weight = min(3, 1 + 0.5 × matched).
// 0 matched → 1, 1 → 1.5, 2 → 2, 3 → 2.5, 4 or more → 3 (cap). Every dish keeps a real chance.
export const PROMO_WEIGHT_STEP = 0.5, PROMO_WEIGHT_MAX = 3;
export const promoWeight = matched => Math.min(PROMO_WEIGHT_MAX, 1 + PROMO_WEIGHT_STEP * Math.max(0, Number(matched) || 0));
// How many recently drawn dishes to avoid: 15, or about 40% of the candidates when the pool is small
// (at least 1, so with two candidates the draw alternates).
export const RECENT_MAX = 15;
export const recentWindow = poolSize => Math.max(1, Math.min(RECENT_MAX, Math.floor(Math.max(0, Number(poolSize) || 0) * 0.4)));
/**
 * Draws one recipe from `candidates` (already filtered, e.g. by filterRecipes), mildly favouring dishes with
 * ingredients on a current promotion: weight = promoWeight(promoCoverage(recipe, offers, now).count).
 * With no current offers the draw is uniform. Recipes whose id is in `exclude` are skipped; null when nothing is left.
 * @param {object[]} candidates
 * @param {object[]} offers   automatic offers; only those displayable at `now` count
 * @param {Date} [now]
 * @param {{random?:()=>number, exclude?:string[]}} [options] `random` returns a number in [0, 1) (default secureRandom)
 * @returns {?object} one of `candidates` (same object) or null
 */
export function weightedSurprise(candidates,offers,now=new Date(),{random=secureRandom,exclude=[]}={}) {
  const pool=(Array.isArray(candidates)?candidates:[]).filter(r=>!exclude.includes(r.id));
  if(!pool.length) return null;
  const best=bestOffers(offers,now); // computed once; per recipe identical to promoCoverage(r,offers,now).count
  const weights=pool.map(r=>promoWeight(coverageFrom(r,best).count)), total=weights.reduce((a,b)=>a+b,0);
  let x=Math.min(Math.max(Number(random())||0,0),1)*total;
  for(let i=0;i<pool.length;i++){ x-=weights[i]; if(x<0) return pool[i]; }
  return pool[pool.length-1];
}
// ---------- CNT-039: preparation time shown in uniform buckets ----------
/**
 * Displayed preparation time: ≤15 → 15 min, ≤30 → 30 min, ≤60 → 60 min, above 60 rounded UP to the next
 * full 30 minutes and shown in hours (90 → 1.5 h, 120 → 2 h, 150 → 2.5 h …).
 * @returns {{minutes:number, unit:'min'|'h', value:number}} `minutes` is the bucketed value used for filtering.
 */
export function timeBucket(minutes) {
  const m=Math.max(0, Number(minutes) || 0);
  if(m<=15) return {minutes:15,unit:'min',value:15};
  if(m<=30) return {minutes:30,unit:'min',value:30};
  if(m<=60) return {minutes:60,unit:'min',value:60};
  const rounded=Math.ceil(m/30)*30;
  return {minutes:rounded,unit:'h',value:rounded/60};
}
// ---------- CNT-034: servings, time ranges, ingredient exclusion search, allergen groups ----------
export const SERVINGS_MIN = 1, SERVINGS_MAX = 20, SERVINGS_DEFAULT = 1;
// Whole number of servings from user input in [1, 20], or null when the text is empty or not such a number.
export function parseServings(value) {
  const text=String(value??'').trim();
  if(!/^\d+$/.test(text)) return null;
  const n=Number(text);
  return n>=SERVINGS_MIN && n<=SERVINGS_MAX ? n : null;
}
export const clampServings = n => Math.min(SERVINGS_MAX, Math.max(SERVINGS_MIN, Math.round(Number(n)) || SERVINGS_MIN));
// Time filter options: value → {maxTime, minTime}. 'over60' selects dishes taking more than 60 minutes.
export const TIME_OPTIONS = Object.freeze({ '0':{maxTime:0,minTime:0}, '15':{maxTime:15,minTime:0}, '30':{maxTime:30,minTime:0}, '60':{maxTime:60,minTime:0}, 'over60':{maxTime:0,minTime:61} });
export function timeOption({maxTime=0,minTime=0}={}) { return Number(minTime)>60 ? 'over60' : Object.keys(TIME_OPTIONS).find(k=>TIME_OPTIONS[k].maxTime===Number(maxTime)&&!TIME_OPTIONS[k].minTime) ?? String(Number(maxTime)||0); }
// Products carrying an allergen, in catalog order.
export function allergenProducts(allergen) { return Object.keys(products).filter(id=>products[id][2].includes(allergen)); }
// Suggestions for the exclusion search: products whose name (UI language via `nameOf`, and always Polish)
// contains the query; names starting with it first. Skips `skip` ids. Returns ids.
export function suggestProducts(query, {nameOf=id=>products[id][0], skip=[], limit=8}={}) {
  const q=normalize(query); if(!q) return [];
  const scored=[];
  for(const id of Object.keys(products)) {
    if(skip.includes(id)) continue;
    const names=[nameOf(id),products[id][0]].filter(Boolean).map(normalize);
    const words=names.flatMap(n=>n.split(/[\s,()-]+/));
    const rank=names.some(n=>n.startsWith(q))?0:words.some(w=>w.startsWith(q))?1:names.some(n=>n.includes(q))?2:-1;
    if(rank>=0) scored.push({id,rank,name:normalize(nameOf(id)||products[id][0])});
  }
  return scored.sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name)).slice(0,limit).map(x=>x.id);
}
