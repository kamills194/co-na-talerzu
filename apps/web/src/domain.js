import { products } from './recipes.pl.js';
export const normalize = s => String(s).toLocaleLowerCase('pl-PL').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').trim();
export function filterRecipes(recipes, {query='',category='',maxTime=0,diet='',excluded=[],excludedProducts=[]}={}) {
  const q=normalize(query);
  return recipes.filter(r => (!category || r.category===category) && (!Number(maxTime) || r.minutes<=Number(maxTime)) && (!diet || r[diet]===true) && !r.allergens.some(a=>excluded.includes(a)) && !r.ingredients.some(i=>excludedProducts.includes(i.product)) && (!q || normalize([r.name,...r.ingredients.map(i=>products[i.product][0])].join(' ')).includes(q)));
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
export function localDate(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function validOffer(o) { return o && typeof o.id==='string' && o.id.length<100 && o.product in products && typeof o.store==='string' && !!o.store.trim() && o.store.length<=100 && Number.isFinite(o.price) && o.price>0 && o.price<=100000 && typeof o.source==='string' && !!o.source.trim() && o.source.length<=500 && /^\d{4}-\d{2}-\d{2}$/.test(o.until) && !Number.isNaN(Date.parse(o.until)) && new Date(o.until).toISOString().slice(0,10)===o.until; }
export function matchingOffers(recipe,offers,today=localDate()) { return offers.filter(o=>validOffer(o)&&o.until>=today&&recipe.ingredients.some(i=>i.product===o.product)); }
export function isCurrentAutomaticOffer(o,now=new Date()) {
  const fetched=Date.parse(o?.fetchedAt), end=Date.parse(o?.validUntil);
  return validOffer(o) && Number.isFinite(fetched) && Number.isFinite(end) && fetched<=now.getTime() && now.getTime()-fetched<=48*60*60*1000 && end>=now.getTime() && o.from<=localDate(now);
}
