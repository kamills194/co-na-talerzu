import { normalize } from '../src/domain.js';
import { markets, marketDate } from '../src/market.js';
import { data as bot } from '../src/recipes.bot.pl.js';
// CNT-028: explicit keyword table from shop product names to catalog product IDs.
// Every catalog product is either here or in `excludedProducts` with a reason (checked by
// tests/promo.test.mjs). Matching is fail-closed: a name must hit an `any` phrase that is not a
// dependent phrase ("z X", "o smaku X", "bez X"…), satisfy every `all` pattern, hit no `not`
// pattern and no global exclusion, and match exactly ONE product. Similar products are never
// silently treated as identical (e.g. "sok pomidorowy" is not a tomato, "masło orzechowe" is not
// butter). Patterns are regex sources over the cleaned name: lower case, no diacritics
// (ł → l, ż → z …), punctuation replaced by single spaces, "%" kept.
export const productRules = [
  ['oats',{any:['platki owsiane'],not:['czekolad','owocow','o smaku','granol','musli','miod']}],
  ['milk',{any:['mleko'],not:['kokos','owsian','sojow','migdal','ryzow','roslinn','zageszczon','skondensowan','w proszku','czekolad','kakao','bez laktozy','kozie','zsiadle','modyfikowan','nastep']}],
  ['apple',{any:['jablk(?:a|o)'],not:['mus','prazon','suszon','ocet','cydr','pieczon','szarlotk']}],
  ['cinnamon',{any:['cynamon'],not:['cukier']}],
  // "jajka bez" forms like "bez jajek" are excluded by the dependent-phrase rule.
  ['egg',{any:['jaj(?:a|ka|ko)'],not:['czekolad','niespodziank','przepiorcz','makaron','w majonezie','faszerowan','pisanki']}],
  ['butter',{any:['maslo'],not:['orzech','shea','kakaow','klarowan','ghee','roslinn','czosnkow','ziolow','do smarowania','miks','mix']}],
  ['bread',{any:['chleb'],not:['chrupk','tostow','tortill','czosnkow','do wypieku','mieszanka']}],
  ['tomato',{any:['pomidor(?:y|ki)?'],not:['suszon','krojon','w puszce','przecier','koncentrat','passata','sos','w zalewie','pelati','pulpa']}],
  // "Twaróg" (cottage cheese, quark). Flavoured spreads and yellow cheese are different products.
  ['cheese',{any:['twarog','twarozek','ser twarogowy'],not:['zolty','szczypior','rzodkiew','ziol','czosn','pomidor','papryk','wanili','owocow','na sernik','sernik','kremowy','homogenizowan']}],
  ['yogurt',{any:['jogurt (?:naturalny|grecki|typu greckiego)'],not:['pitny','owocow','truskaw','wanili','kokos','roslinn','sojow','z musem','brzoskwin','malin','jagod']}],
  ['radish',{any:['rzodkiew(?:ka|ki)'],not:['biala','czarna','chrzan']}],
  ['cucumber',{any:['ogor(?:ek|ki)'],not:['kiszon','konserwow','malosoln','w zalewie','korniszon','kwaszon']}],
  ['banana',{any:['banan(?:y)?'],not:['suszon','pure','smoothie']}],
  ['carrot',{any:['marchew','marchewka','marchewki'],not:['groszk','mieszanka','tart','pure']}],
  ['hummus',{any:['hummus'],not:['krakers','nachos']}],
  ['rice',{any:['ryz'],not:['sushi','wafl','risotto','kleik','preparowan','mlecz']}],
  ['passata',{any:['passata','przecier pomidorowy']}],
  ['oil',{any:['olej rzepakowy'],not:['silnik','w sprayu']}],
  ['potato',{any:['ziemniak(?:i)?'],not:['frytk','puree','placki','kopytk','pyzy','skrobi','talarki']}],
  ['chicken',{any:['piers(?:i)? z kurczaka','filet(?:y)? z kurczaka','filet(?:y)? z piersi kurczaka'],not:['wedzon','pieczon','grillowan','panierowan','w panierce','nuggets','gyros','kebab','parowk','marynowan','sous vide','gotowan']}],
  // Ground sweet paprika (spice); fresh peppers are product `pepper`.
  ['paprika',{any:['papryka (?:slodka |wedzona )?mielona','papryka slodka'],not:['czerwona','zolta','zielona','swieza','mix','konserwow','marynowan','grillowan','ostra']}],
  // Catalog item is egg-free pasta (allergen filter!), so only explicitly egg-free kinds match.
  ['pasta',{any:['makaron'],all:['durum|bez jaj|semolin'],not:['(?<!bez )jaj','ryzow','gryczan','soczewic','ciecierzyc','instant','chinski','zupk','lasagne','z serem']}],
  ['onion',{any:['cebul(?:a|e|ka)'],not:['prazon','smazon','suszon','marynowan','szczypior','dymka','granulowan']}],
  ['lentils',{any:['soczewica czerwona'],not:['makaron','pasta','w puszce','gotowan']}],
  ['chickpeas',{any:['ciecierzyca'],not:['sucha','maka','makaron','prazon','chips']}],
  // Fresh (bell) pepper. Ground paprika is product `paprika`, chili peppers are different.
  ['pepper',{any:['papryk(?:a|i)'],not:['mielon','slodka','ostra','wedzon','marynowan','konserwow','grillowan','chili','w zalewie','pasta','faszerowan','przyprawa']}],
  ['flour',{any:['maka (?:pszenna|tortowa|krupczatka|poznanska)'],not:['ziemniaczan','pelnoziarnist','razow','mieszanka','do pizzy','do chleba','orkisz']}],
  ['sugar',{any:['cukier'],not:['puder','wanili','trzcin','zelujac','kokosow','brazow','ksylit','erytrytol','syrop','w saszetkach']}],
  ['cocoa',{any:['kakao'],not:['instant','rozpuszczaln','granulowan','napoj','mleko','z cukrem']}],
  ['beans',{any:['fasol(?:a|ka)'],not:['szparagow','bretonsk','sucha','suszon','edamame','mung','mrozon']}],
  ['lemon',{any:['cytryn(?:a|y)'],not:['kwasek','lemoniad','skork']}],
  ['garlic',{any:['czosnek'],not:['granulowan','suszon','niedzwiedzi','pasta','marynowan','w proszku','czarny']}],
  ['semolina',{any:['kasza manna'],not:['o smaku','dla dzieci','mlecz','owocow']}],
  // Catalog item is roasted buckwheat; unroasted ("niepalona", "biała") tastes different.
  ['buckwheat',{any:['kasza gryczana'],not:['niepalon','biala','w sosie','gotowan']}],
  ['kefir',{any:['kefir'],not:['owocow','truskaw','malin','roslinn','wanili']}],
  ['sourcream',{any:['smietana(?: gesta| kwasna)? 18 ?%']}],
  ['mackerel',{any:['makrela','filet(?:y)? z makreli'],all:['wedzon'],not:['w pomidorach','w oleju','pasta','w puszce','sos']}],
  ['chives',{any:['szczypior(?:ek)?'],not:['suszon','liofilizowan']}],
  ['dill',{any:['koper(?:ek)?'],not:['suszon','wloski','liofilizowan']}],
  ['blackpepper',{any:['pieprz czarny'],not:['ziarnist','w ziarnach','w ziarnie','ziarno','kolorow','ziolow','cayenne','mlynek']}],
  ['yellowcheese',{any:['ser(?:y)? zolty','gouda','edam(?:ski)?','ser morski','ser tylzycki','ser salami','ser krolewski','ser podlaski','radamer'],not:['topion','plesni']}],
  ['mozzarella',{any:['mozzarell(?:a|i)'],not:['paluszk','w panierce']}],
  ['oliveoil',{any:['oliwa'],not:['w sprayu','z wytloczyn','smakow','z czosnkiem','z chili','z przyprawami','z rozmarynem','z ziolami','truflow']}],
  ['basil',{any:['bazylia'],not:['suszon','pesto','mrozon','liofilizowan']}],
  // Plain "pietruszka" is ambiguous (root or leaves) and is not mapped.
  ['parsley',{any:['natka pietruszki','natka','pietruszka natka'],not:['suszon','korzen','seler','liofilizowan']}],
  ['zucchini',{any:['cukini(?:a|e)?'],not:['grillowan','marynowan']}],
  ['eggplant',{any:['baklazan(?:y)?'],not:['pasta','grillowan','marynowan']}],
  ['cabbage',{any:['kapusta(?: biala)?'],not:['kiszon','kwaszon','pekinsk','czerwon','wloska','surowk','bigos','golabk','pak choi','modra']}],
  ['mushroom',{any:['pieczark(?:i|a)'],not:['marynowan','konserwow','suszon','w zalewie','duszon']}],
  ['orange',{any:['pomarancz(?:a|e)'],not:['kandyzowan','skork','suszon','w plastrach']}],
  ['berries',{any:['owoce lesne','mieszanka owocow lesnych'],all:['mrozon']}],
  ['potatostarch',{any:['maka ziemniaczana','skrobia ziemniaczana']}],
  ['vinegar',{any:['ocet jablkowy']}],
  ['tuna',{any:['tunczyk'],all:['w sosie wlasnym|w wodzie'],not:['pasta','stek']}],
  ['mincedpork',{any:['mieso mielone','mielone'],all:['wieprz'],not:['wolow','drob','indyk','kurczak']}],
  ['ham',{any:['szynka'],all:['gotowan'],not:['indyk','drobiow','kurczak','surow','dojrzewaj']}],
  ['sushirice',{any:['ryz do sushi','ryz sushi']}],
  ['soysauce',{any:['sos sojowy'],not:['slodki','teriyaki']}],
  ['miso',{any:['pasta miso','miso'],not:['instant']}],
  ['tofu',{any:['tofu'],not:['wedzon','marynowan','ziol','bazyli','curry','pasta','jedwabist','sos']}],
  ['nori',{any:['nori'],not:['przekask','snack','pikantn']}],
  ['sesame',{any:['sezam'],not:['chalw','olej','pasta']}],
  // CNT-033. Beef cuts are told apart by the cut name; plain "wołowina" is ambiguous and not mapped.
  ['beef',{any:['wolowina gulaszowa','wolowina na gulasz','mieso gulaszowe wolowe'],not:['mielon','w sosie','konserw','w puszce','gotowan']}],
  ['beefslices',{any:['wolowina na zrazy','wolowina zrazowa','zrazy wolowe','zrazowa wolowa'],not:['mielon','w sosie','gotowan','panierowan']}],
  ['mincedbeef',{any:['mieso mielone','mielone'],all:['wolow'],not:['wieprz','drob','indyk','kurczak']}],
  // Bone-in raw legs/thighs; breast fillets are product `chicken`.
  ['chickenthigh',{any:['udk(?:a|o|i) z kurczaka','podudzi(?:a|e) z kurczaka','cwiartk(?:a|i) z kurczaka'],not:['bez kosci','bez skory','wedzon','pieczon','grillowan','panierowan','marynowan','gotowan','w przyprawach']}],
  ['porkshoulder',{any:['lopatka wieprzowa'],not:['mielon','wedzon','gotowan','pieczon','w galarecie','z koscia','konserw']}],
  // Raw smoked bacon only; scalded/baked bacon and bacon crisps are different products.
  ['bacon',{any:['boczek'],all:['wedzon'],not:['parzon','pieczon','gotowan','chips','w kostce z']}],
  ['sauerkraut',{any:['kapusta kiszona','kapusta kwaszona'],not:['bigos','z marchew']}],
  // Dry red wine for braising; sweet, mulled, sparkling and alcohol-free wines are not the same ingredient.
  ['wine',{any:['wino czerwone'],all:['wytrawn'],not:['polwytrawn','polslodk','slodk','bezalkohol','grzan','musujac','aromatyzowan']}],
  // Celeriac (root); celery stalks ("seler naciowy") are a different vegetable.
  ['celeriac',{any:['seler(?: korzeniowy)?'],not:['naciow','suszon','w zalewie','sol','tart']}],
  ['parsleyroot',{any:['pietruszka korzen','korzen pietruszki','pietruszka korzeniowa'],not:['natka','suszon']}],
  ['leek',{any:['por(?:y)?'],not:['suszon','mrozon']}],
  ['bayleaf',{any:['lisc(?:ie)? laurow(?:y|e)']}],
  ['allspice',{any:['ziele angielskie'],not:['mielon']}],
  ['mustard',{any:['musztarda'],not:['w proszku','nasion','ziarn']}],
  // Vinegar-pickled gherkins; lacto-fermented ("kiszone") cucumbers taste different and are not mapped.
  ['gherkin',{any:['ogor(?:ek|ki) konserwow(?:y|e)','korniszon(?:y)?'],not:['kiszon','malosoln','krojon']}],
  ['yeast',{any:['drozdze'],all:['swiez'],not:['instant','suszon','w proszku']}],
  ['ginger',{any:['imbir'],not:['mielon','marynowan','kandyzowan','suszon','w syropie','piernik','pasta']}],
  ['curry',{any:['curry'],all:['przypraw|mielon|w proszku'],not:['pasta','sos','tofu','kurczak','mleko','ketchup']}],
  // CNT-038. Raw pork loin only (smoked/cooked loin is a cold cut); white sausage only raw ("surowa"), the scalded
  // kind is a different product; lacto-fermented cucumbers ≠ fresh, vinegar-pickled or low-salt ("małosolne").
  ['porkloin',{any:['schab(?: wieprzowy)?'],not:['wedzon','pieczon','gotowan','z koscia','marynowan','w galarecie','konserw','mielon']}],
  ['breadcrumbs',{any:['bulka tarta'],not:['z przyprawami','czosnkow']}],
  ['picklecucumber',{any:['ogor(?:ek|ki) kiszon(?:y|e)'],not:['malosoln','krojon','plastr','sok']}],
  // Liquid starter for żurek; ready soup ("żurek" in a pouch) and starters for other soups are not mapped.
  ['sourstarter',{any:['zakwas'],all:['zur'],not:['chleb','barszcz','buracz','w proszku','instant']}],
  ['whitesausage',{any:['kielbasa biala'],all:['surow'],not:['parzon','wedzon','pieczon','gotowan','grill']}],
  ['marjoram',{any:['majeranek'],not:['swiez']}],
  ['parmesan',{any:['parmezan','parmigiano(?: reggiano)?'],not:['typu','wiork','chips','krakers']}],
  // Dried sheets; ready lasagne meals fall under the global "danie/gotowe" exclusion or the `not` list.
  ['lasagnesheets',{any:['(?:makaron )?lasagne','(?:makaron )?lazania'],not:['bolognese','mrozon','szpinak','z mies','wege','sos']}],
  ['mascarpone',{any:['mascarpone'],not:['tiramisu','deser','z owoc']}],
  ['ladyfingers',{any:['biszkopty (?:podluzne|savoiardi|do tiramisu)','savoiardi']}],
  ['coffee',{any:['kawa rozpuszczalna'],not:['cappuccino','latte','3 ?w ?1','zbozow','mrozon','mix','z mlekiem','smakow']}],
  ['coconutmilk',{any:['mleczko kokosowe'],not:['w proszku','light','do picia']}],
  ['coriander',{any:['kolendra(?: swieza)?'],not:['mielon','nasion','ziarn','suszon','liofilizowan']}],
  ['cumin',{any:['kumin','kmin rzymski'],not:['ziarn','w ziarnach','nasion','cal']}],
  ['chili',{any:['chil+i'],all:['mielon|w proszku|sproszkowan'],not:['sos','pasta','olej','ketchup','platk','ziarn','con carne','fasol']}],
  ['corn',{any:['kukurydza (?:konserwowa|w puszce|slodka)'],not:['kolb','mrozon','maka','prazon','popcorn','chrupk','platki']}],
  ['tortilla',{any:['tortill(?:a|e|i)'],all:['pszenn'],not:['chips','kukurydz','pelnoziarn','nachos']}],
  ['avocado',{any:['awokado'],not:['pasta','guacamole','olej','sos','mrozon']}],
  ['lime',{any:['limonk(?:a|i)'],not:['skork','kaffir','lisc']}],
  ['bun',{any:['bulk(?:a|i)'],all:['(?:ham)?burger'],not:['tarta','gotow','wege']}],
  ['lettuce',{any:['salata lodowa'],not:['mix','krojon','mieszank']}],
  ['chocolate',{any:['czekolada (?:gorzka|deserowa)'],not:['nadziew','orzech','mleczn','pitn','do picia','malin','pomarancz','miet','chili','karmel','solon','migdal','bakali']}],
  ['bakingpowder',{any:['proszek do pieczenia']}],
  // Feta only; "ser sałatkowy typu feta" is a different (often cow-milk) cheese.
  ['feta',{any:['(?:ser )?feta'],not:['salatkow','typu','w zalewie','ziol','marynowan','w oleju','pomidor','oliwk']}],
  ['olives',{any:['oliwki'],all:['czarn'],not:['nadziewan','pasta','tapenad','z pestk','zielon','w oleju']}],
  ['oregano',{any:['oregano'],not:['swiez','olej']}],
  ['pita',{any:['(?:chlebek |chlebki )?pit(?:a|y)'],not:['chips','pizza','krakers']}],
  ['tahini',{any:['tahini','pasta sezamowa'],not:['chalw','sos']}],
];
// Catalog products for which an ordinary shop promotion is not looked up, with the reason.
export const excludedProducts = new Map([
  ['salt','Sól: produkt spiżarniany o pomijalnej cenie; nie jest dobierany według promocji'],
  ['water','Woda z kranu jako składnik przepisu; oferty wody butelkowanej nie są składnikiem'],
]);
// Products added by the recipe bot get no shop-name rule automatically (fail-closed: a wrong rule would
// show a false promotion). The editor can add a rule to productRules later; then the exclusion is skipped.
for (const id of Object.keys(bot.products)) if (!productRules.some(([p]) => p === id)) excludedProducts.set(id, 'Produkt dodany przez bota „kucharz”: reguła dopasowania ofert czeka na redakcję');
// Names of derived / non-food / ready products: never a recipe ingredient whatever the keyword.
const globalExclusions=['soki?','nektar','napoj','syrop','chipsy?','bulion','rosol\\w*','kostka rosolowa','o smaku','aromat\\w*','przyprawa do','karma','dla (?:psa|psow|kota|kotow|zwierzat|niemowlat)','szampon','mydlo','zel','balsam','kosmetyk\\w*','salatk(?:a|i)','pizza','zapiekank\\w*','pierogi','zupa','zupka','krem','lody','baton\\w*','ciast(?:o|ka|eczka)','dzem','konfitur\\w*','herbat\\w*','ketchup','majonez','chrupki','wafle','danie','gotowe','pesto'];
// Words that make the following keyword an additive or a flavour, not the product itself
// ("ser z czosnkiem", "jogurt bez cukru", "chleb z cebulą", "filet z makreli" needs its own phrase).
const DEPENDENT=new Set(['z','ze','w','we','o','na','do','bez','smaku','aromacie','posypka']);
// Whole-word match; "%" may end a phrase ("18%"), so the end is a lookahead, not \\b.
const compile=s=>new RegExp(`(?<![a-z0-9])(?:${s})(?![a-z0-9])`,'g');
const compiled=productRules.map(([product,r])=>({product,any:r.any.map(compile),all:(r.all||[]).map(s=>new RegExp(`\\b(?:${s})`)),not:(r.not||[]).map(s=>new RegExp(`\\b(?:${s})`))}));
const globalRe=new RegExp(`\\b(?:${globalExclusions.join('|')})\\b`);
export const cleanName=name=>normalize(name).replace(/[^a-z0-9%]+/g,' ').trim();
function independentHit(re,text) {
  for(const m of text.matchAll(re)) { const before=text.slice(0,m.index).trim().split(' ').pop(); if(!DEPENDENT.has(before)) return true; }
  return false;
}
// Product ID for a shop product name, or null (unknown, excluded or ambiguous). Pure.
export function matchProduct(name) {
  if(typeof name!=='string'||!name.trim()) return null;
  const text=cleanName(name);
  if(globalRe.test(text)) return null;
  const hits=compiled.filter(r=>r.any.some(re=>independentHit(re,text))&&r.all.every(re=>re.test(text))&&!r.not.some(re=>re.test(text)));
  return hits.length===1?hits[0].product:null;
}
// Adapter facts: aldi.pl is the shop's nationwide site for the PL market, prices are in the market
// currency. The page does not state in which regions/shops an offer applies, so the scope is
// reported as unverified — never as nationwide and never with invented regions.
const adapterMarket=markets.PL;
const ALDI_SCOPE=Object.freeze({type:'unverified',note:'Oferta ze strony ogólnopolskiej sklepu; dostępność regionalna niepotwierdzona'});
const dateInMarket=epoch=>marketDate(new Date(epoch*1000),adapterMarket);
const text=(v,fallback,max)=>(typeof v==='string'&&v.trim()?v.trim():fallback).slice(0,max);
// ALDI price tags. Supported reductions (anything else is skipped, fail closed):
//  - strike price: regular price crossed out, `priceValue` is the new unit price;
//  - "-N% PRZY ZAKUPIE K SZT.": `priceValue` is the unit price when buying K pieces;
//  - "-N% CO DRUGA SZT.": the second piece costs `priceValue` → average unit price over 2 pieces;
//  - "A+B GRATIS": pay for A, get A+B → average unit price over A+B pieces.
// For multi-buy deals `price` is the AVERAGE unit price when the condition is met; the condition is
// always stated in `conditions` (plus the per-customer limit), so the app never hides it.
// Regular price for multi-buys comes from "Cena regularna: X zł" in the price tag text.
function plNumber(s){ const n=Number(String(s).replace(/\s/g,'').replace(',','.')); return Number.isFinite(n)?n:NaN; }
export function aldiDeal(p,item={}) {
  const price=p?.priceValue; if(!Number.isFinite(price)||price<=0) return null;
  const labels=p.priceTagLabels||{}, promo=String(labels.promoText1||'').replace(/\s+/g,' ').trim();
  const info=(p.basePrice||[]).map(b=>b?.basePriceAdditionalInformation||'').join(' ');
  const limit=String(item.shortDescription||'').match(/Limit:[^\n]*/i)?.[0]?.trim().replace(/\.$/,'');
  const join=(...a)=>a.filter(Boolean).join(' · ');
  const strike=p.strikePrice?.strikePriceValue;
  if(Number.isFinite(strike)) return price<strike?{price,regular:strike,conditions:join(promo,labels.bestPricesWithin30daysText,limit)}:null;
  const regular=plNumber(info.match(/cena regularna:\s*([\d\s]+,\d{2})\s*zł/i)?.[1]);
  if(!Number.isFinite(regular)||regular<=0) return null;
  const round=v=>Math.round(v*100)/100;
  let m;
  if((m=promo.match(/PRZY ZAKUPIE\s+(\d+)\s+SZT/i))&&price<regular) return {price,regular,conditions:join(`Cena przy zakupie ${m[1]} szt.`,promo,limit)};
  if(/CO DRUGA SZT/i.test(promo)&&price<regular) return {price:round((regular+price)/2),regular,conditions:join(`Średnio przy zakupie 2 szt. (druga za ${String(price.toFixed(2)).replace('.',',')} zł)`,promo,limit)};
  if((m=promo.match(/^(\d+)\s*\+\s*(\d+)\s+GRATIS/i))){ const a=+m[1],b=+m[2]; if(a>0&&b>0) return {price:round(regular*a/(a+b)),regular,conditions:join(`Średnio przy zakupie ${a+b} szt. (${a}+${b} gratis)`,limit)}; }
  return null;
}

export function parseAldi(html,{source,now=new Date()}={}) {
  const match=html.match(/<script\b[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if(!match) throw Error('Brak publicznych danych __NEXT_DATA__; adapter wymaga aktualizacji.');
  const data=JSON.parse(match[1]), items=[];
  // Product lists may be nested as JSON text inside other fields (e.g. pageProps.apiData on /oferty.html).
  function walk(x) {
    if(typeof x==='string'){ if(x.length>50&&/^\s*[\[{]/.test(x)&&x.includes('objectID')){ try{walk(JSON.parse(x));}catch{} } return; }
    if(!x||typeof x!=='object')return; if(x.objectID&&x.name)items.push(x); else for(const v of Object.values(x))walk(v);
  }
  walk(data);
  if(!items.length) {
    // CNT-040: pusta kategoria (wyniki Algolia z nbHits 0) to poprawny odczyt, nie zmiana struktury strony.
    // Strona zostaje na liście źródeł; oferty pojawią się, gdy ALDI doda do niej produkty.
    const results=Object.values(data?.props?.pageProps?.algoliaState?.initialResults||{}).flatMap(x=>Array.isArray(x?.results)?x.results:[]);
    if(results.length&&results.every(r=>r&&r.nbHits===0&&Array.isArray(r.hits)&&!r.hits.length))return {offers:[],productsSeen:0,unmapped:0,empty:true};
    throw Error('Nie rozpoznano struktury produktów.');
  }
  const output=new Map(); let skipped=0;
  for(const item of items) {
    const product=matchProduct(item.name);
    if(!product){skipped++;continue;}
    const candidates=[item.currentPrice,...(Array.isArray(item.promotionPrices)?item.promotionPrices:[])].filter(Boolean);
    for(const p of candidates) {
      const deal=aldiDeal(p,item);
      // Fail closed: a real price reduction, explicit validity window and active NOW required.
      if(!deal||!Number.isFinite(p.validFrom)||!Number.isFinite(p.validUntil)||p.validFrom*1000>now.getTime()||p.validUntil*1000<now.getTime())continue;
      const {price,regular}=deal;
      const id=`aldi-${item.objectID}-${p.validFrom}`;
      output.set(id,{id,product,market:adapterMarket.id,currency:adapterMarket.currency,scope:{...ALDI_SCOPE},store:'ALDI',price,until:dateInMarket(p.validUntil),from:dateInMarket(p.validFrom),source,fetchedAt:now.toISOString(),name:text(item.name,'',200),unit:text(item.salesUnit,'Sprawdź jednostkę w źródle',100),regularPrice:regular,validUntil:new Date(p.validUntil*1000).toISOString(),conditions:text(deal.conditions,'Sprawdź warunki w sklepie',500),evidence:JSON.stringify(p)});
    }
  }
  return {offers:[...output.values()],productsSeen:items.length,unmapped:skipped};
}
// robots.txt: consecutive User-agent lines form one group; rules after them apply to every agent
// of that group. Only Disallow is honoured (Allow is ignored, which is the stricter reading).
export function robotsDisallows(robots, path) {
  const rules=[]; let applies=false, inAgents=false;
  for (const raw of String(robots).split(/\r?\n/)) {
    const m=raw.replace(/#.*/,'').trim().match(/^(User-agent|Disallow)\s*:\s*(.*)$/i);
    if(!m) continue;
    if(m[1].toLowerCase()==='user-agent') { if(!inAgents) applies=false; inAgents=true; if(m[2].trim()==='*') applies=true; }
    else { inAgents=false; if(applies&&m[2]) rules.push(m[2].trim()); }
  }
  return rules.some(rule=>{ const anchored=rule.endsWith('$'); const body=anchored?rule.slice(0,-1):rule;
    return new RegExp('^'+body.split('*').map(v=>v.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*')+(anchored?'$':'')).test(path); });
}
// Extra bot sources from the command line: only https pages under www.aldi.pl/produkty/ (the
// site the ALDI adapter parses). Invalid input stops the run instead of being skipped silently.
export function extraSources(args) {
  const out=[];
  for(const a of args) { let u; try{u=new URL(a);}catch{throw Error(`Nieprawidłowy adres źródła: ${a}`);}
    if(u.protocol!=='https:'||u.hostname!=='www.aldi.pl'||u.username||u.password||!(u.pathname.startsWith('/produkty/')||u.pathname==='/oferty.html'))throw Error(`Źródło spoza https://www.aldi.pl/produkty/ i /oferty.html: ${a}`);
    u.hash='';out.push(u.href); }
  return out;
}
