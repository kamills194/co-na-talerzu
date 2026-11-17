// Nutrition estimates (CNT-026). Values per 100 g of the product as used in the recipe
// (raw/dry unless the product name says otherwise, e.g. canned and drained): [kcal, protein, fat, carbohydrates].
// APPROXIMATE GENERIC VALUES written from knowledge of standard food composition tables
// (Polish IŻŻ/NIZP-PZH tables, USDA FoodData Central generic entries). They were NOT looked up
// while writing (no network) and are NOT readings of any product label. Brands differ; treat every
// result as an estimate, not a dietitian's assessment or a measurement.
import { products } from './recipes.pl.js';
export const NUTRITION = {
  oats:[372,13.0,7.0,62.0], milk:[51,3.3,2.0,4.8], apple:[52,0.3,0.2,13.8], cinnamon:[247,4.0,1.2,80.6],
  egg:[143,12.6,9.5,0.7], butter:[735,0.7,81.0,0.7], bread:[250,8.0,2.5,49.0], tomato:[18,0.9,0.2,3.9],
  cheese:[133,18.7,4.7,3.7], yogurt:[60,4.3,2.0,6.2], radish:[16,0.7,0.1,3.4], cucumber:[15,0.7,0.1,3.6],
  banana:[89,1.1,0.3,22.8], carrot:[41,0.9,0.2,9.6], hummus:[166,7.9,9.6,14.3], rice:[360,6.7,0.7,79.0],
  passata:[32,1.5,0.2,6.0], water:[0,0,0,0], oil:[884,0,100,0], salt:[0,0,0,0],
  potato:[77,2.0,0.1,17.5], chicken:[105,22.5,1.6,0], paprika:[282,14.0,13.0,54.0],
  pasta:[365,12.5,1.5,74.0], onion:[40,1.1,0.1,9.3], lentils:[350,24.0,2.0,60.0],
  chickpeas:[139,7.0,2.6,22.5], pepper:[31,1.0,0.3,6.0], flour:[347,10.0,1.2,74.0], sugar:[400,0,0,100],
  cocoa:[330,20.0,12.0,35.0], beans:[115,7.5,0.5,20.0], lemon:[22,0.4,0.2,6.9], garlic:[149,6.4,0.5,33.0],
  semolina:[355,10.3,1.0,76.0], buckwheat:[350,12.6,3.1,69.0], kefir:[51,3.4,2.0,4.7], sourcream:[186,2.5,18.0,3.6],
  mackerel:[222,20.7,15.5,0], chives:[30,3.3,0.7,4.4], dill:[43,3.5,1.1,7.0], blackpepper:[0,0,0,0],
  yellowcheese:[345,25.0,27.0,0.5], mozzarella:[240,18.0,18.0,1.0], oliveoil:[884,0,100,0], basil:[23,3.2,0.6,2.7],
  parsley:[36,3.0,0.8,6.3], zucchini:[17,1.2,0.3,3.1], eggplant:[25,1.0,0.2,5.9], cabbage:[25,1.3,0.1,5.8],
  mushroom:[22,3.1,0.3,3.3], orange:[47,0.9,0.1,11.8], berries:[45,0.9,0.4,10.0], potatostarch:[335,0.1,0.1,83.0],
  vinegar:[21,0,0,0.9], tuna:[116,25.5,0.8,0], mincedpork:[263,16.9,21.2,0],
  ham:[115,18.0,4.0,1.5], sushirice:[360,6.5,0.6,80.0], soysauce:[53,8.1,0.6,4.9],
  miso:[199,12.8,6.0,26.5], tofu:[120,12.5,7.0,2.0], nori:[300,41.0,3.0,30.0], sesame:[573,17.7,49.7,23.4],
};
// Salt, water and a pinch of black pepper are counted as 0 kcal (negligible or none).
export const ZERO_KCAL = ['water','salt','blackpepper'];
// Grams per one recipe unit for products not measured in g/ml: typical edible part of a medium piece
// (assumption, not a weighed value). Lemon: juice of one fruit (recipes use it for juice).
export const UNIT_GRAMS = {
  apple:160, cinnamon:2.5, egg:50, bread:35, tomato:150, radish:15, cucumber:300, banana:120, carrot:85,
  salt:6, paprika:2.5, onion:110, pepper:160, lemon:50, garlic:5, chives:25, dill:30, blackpepper:0.3,
  basil:20, parsley:30, zucchini:300, eggplant:300, orange:150, nori:2.5,
};
// ml → g. Water-like liquids ≈ 1 g/ml; oils are lighter.
export const DENSITY = { oil:0.92, oliveoil:0.91 };
// Products that are meat (CNT-025). Products carry no meat marker, so the list is explicit; a test
// fails when a product whose name suggests meat is missing here. Fish is detected by the fish allergen.
export const MEAT_PRODUCTS = ['chicken','ham','mincedpork'];
// Grams of one unit of a product, or null when unknown.
export function gramsPerUnit(id) {
  const unit=products[id]?.[1];
  if(unit==='g') return 1;
  if(unit==='ml') return DENSITY[id] ?? 1;
  return Number.isFinite(UNIT_GRAMS[id]) && UNIT_GRAMS[id]>0 ? UNIT_GRAMS[id] : null;
}
const cache=new WeakMap();
// Per-serving estimate {kcal, protein, fat, carbs}, or null when any ingredient lacks data
// (a partial sum would be misleadingly low).
export function nutritionPerServing(recipe) {
  if(!recipe || typeof recipe!=='object') return null;
  if(cache.has(recipe)) return cache.get(recipe);
  let result=null;
  if(Number.isFinite(recipe.servings) && recipe.servings>0 && Array.isArray(recipe.ingredients)) {
    const sum=[0,0,0,0]; let ok=true;
    for(const i of recipe.ingredients) {
      const n=NUTRITION[i?.product], g=gramsPerUnit(i?.product);
      if(!n || g===null || !Number.isFinite(i.amount) || i.amount<0) { ok=false; break; }
      n.forEach((v,k)=>{ sum[k]+=v*i.amount*g/100; });
    }
    if(ok) { const [kcal,protein,fat,carbs]=sum.map(v=>v/recipe.servings); const r1=v=>Math.round(v*10)/10; result={kcal:Math.round(kcal),protein:r1(protein),fat:r1(fat),carbs:r1(carbs)}; }
  }
  cache.set(recipe,result);
  return result;
}
