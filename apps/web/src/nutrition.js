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
  // CNT-033. chickenthigh: per 100 g AS BOUGHT, bone included (about 25% bone; edible part with skin ≈ 210 kcal).
  // wine: kcal include alcohol (≈ 7 kcal/g), which has no macronutrient column, and part of the alcohol
  // evaporates during long braising, so recipes with wine are rough estimates.
  beef:[160,20.0,9.0,0], beefslices:[130,22.0,4.5,0], mincedbeef:[215,18.5,15.5,0],
  chickenthigh:[158,12.8,11.6,0], porkshoulder:[200,17.0,14.5,0], bacon:[450,14.0,43.0,1.0],
  sauerkraut:[19,0.9,0.1,4.3], wine:[85,0.1,0,2.6], celeriac:[42,1.5,0.3,9.2], parsleyroot:[45,2.6,0.5,9.0],
  leek:[61,1.5,0.3,14.2], bayleaf:[313,7.6,8.4,75.0], allspice:[263,6.1,8.7,72.1],
  mustard:[140,6.0,7.0,11.0], gherkin:[25,0.5,0.1,5.5], yeast:[105,8.4,1.9,18.1],
  ginger:[80,1.8,0.8,17.8], curry:[325,14.3,14.0,55.8],
  // CNT-038. sourstarter: liquid rye starter for żurek (about 8% rye flour). coconutmilk: canned, full fat.
  // corn: canned, drained. chocolate: 70% cocoa solids.
  porkloin:[143,21.0,6.5,0], breadcrumbs:[380,12.5,4.5,72.0], picklecucumber:[12,0.5,0.1,2.0], sourstarter:[27,0.8,0.2,5.5],
  whitesausage:[270,14.5,23.0,1.0], marjoram:[271,12.7,7.0,60.6], parmesan:[392,35.8,25.8,3.2], lasagnesheets:[360,12.5,1.5,73.0],
  mascarpone:[420,4.8,43.0,3.6], ladyfingers:[385,8.5,4.0,77.0], coffee:[240,12.0,0.5,42.0], coconutmilk:[190,1.8,19.5,2.8],
  coriander:[23,2.1,0.5,3.7], cumin:[375,17.8,22.3,44.2], chili:[282,13.5,14.3,49.7], corn:[80,2.7,1.2,15.5],
  tortilla:[310,8.5,7.5,51.0], avocado:[160,2.0,14.7,8.5], lime:[25,0.4,0.1,8.4], bun:[280,9.0,5.0,49.0],
  lettuce:[14,0.9,0.1,3.0], chocolate:[570,8.0,41.0,36.0], bakingpowder:[53,0,0,27.7], feta:[264,14.2,21.3,4.1],
  olives:[115,0.8,10.7,6.3], oregano:[265,9.0,4.3,69.0], pita:[275,9.1,1.2,55.7], tahini:[595,17.0,53.8,21.2],
};
// Salt, water and a pinch of black pepper are counted as 0 kcal (negligible or none).
export const ZERO_KCAL = ['water','salt','blackpepper'];
// Grams per one recipe unit for products not measured in g/ml: typical edible part of a medium piece
// (assumption, not a weighed value). Lemon: juice of one fruit (recipes use it for juice).
export const UNIT_GRAMS = {
  apple:160, cinnamon:2.5, egg:50, bread:35, tomato:150, radish:15, cucumber:300, banana:120, carrot:85,
  salt:6, paprika:2.5, onion:110, pepper:160, lemon:50, garlic:5, chives:25, dill:30, blackpepper:0.3,
  basil:20, parsley:30, zucchini:300, eggplant:300, orange:150, nori:2.5,
  // CNT-033: parsley root and leek — edible part of a medium piece; bay leaf, allspice berry and a gherkin
  // (medium pickled cucumber, drained); curry powder per teaspoon like other ground spices.
  parsleyroot:80, leek:200, bayleaf:0.2, allspice:0.15, gherkin:50, curry:2.5,
  // CNT-038: a medium lacto-fermented cucumber, dried herbs ≈ 1 g per teaspoon, ground spices like curry,
  // a 20–25 cm wheat tortilla, edible part of a medium avocado, juice of one lime, one burger bun, a head
  // of iceberg lettuce, one pita, baking powder per teaspoon.
  picklecucumber:80, marjoram:1, coriander:25, cumin:2, chili:2.5, tortilla:45, avocado:150, lime:30, bun:75,
  lettuce:500, bakingpowder:4, oregano:1, pita:60,
};
// ml → g. Water-like liquids ≈ 1 g/ml; oils are lighter.
export const DENSITY = { oil:0.92, oliveoil:0.91 };
// Products that are meat (CNT-025). Products carry no meat marker, so the list is explicit; a test
// fails when a product whose name suggests meat is missing here. Fish is detected by the fish allergen.
export const MEAT_PRODUCTS = ['chicken','ham','mincedpork','beef','beefslices','mincedbeef','chickenthigh','porkshoulder','bacon','porkloin','whitesausage'];
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
