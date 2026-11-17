import { recipes, products } from './recipes.pl.js';
import { t, tn, format, categories, allergens, cuisines, locale, language, languages, languageInfo, setLanguage, suggestLanguage, productName, localizeRecipe, hasRecipeText, unitLabel, formatNumber } from './i18n.js';
import { filterRecipes, surprise, addIngredients, matchingOffers, localDate, validOffer, isDisplayableAutomaticOffer as isCurrentAutomaticOffer } from './domain.js'; import { market, marketDate, formatCurrency, currencySymbol, formatMarketDay, formatMarketDateTime } from './market.js';
import { load, save, emptyState, validateState } from './storage.js';
import { photoFor, safeLink } from './photos.js';
import { nutritionPerServing, gramsPerUnit } from './nutrition.js';
import { initThemeMode, themeToggleHTML, bindThemeToggle } from './theme-mode.js';
import { DIETS } from './domain.js';
import { promoCoverage, rankByPromotions, ingredientOffers, pantryProducts } from './domain.js';
import { weightedSurprise } from './domain.js';
import { SERVINGS_MIN, SERVINGS_MAX, SERVINGS_DEFAULT, parseServings, clampServings, TIME_OPTIONS, timeOption, suggestProducts, allergenProducts } from './domain.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId=()=>globalThis.crypto?.randomUUID?.() || 'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const num=n=>formatNumber(n);
let state=emptyState(), storageWarning=false;
try { state=load(localStorage); } catch { storageWarning=true; }
// CNT-030: the UI language is only what the user chose (settings.language); without a choice it stays Polish.
// CNT-035: jasny / ciemny / automatyczny motyw — przed pierwszym renderem, żeby nie mignął niewłaściwy kolor.
initThemeMode(); bindThemeToggle(document);
if(state.settings?.language&&state.settings.language!=='pl') await setLanguage(state.settings.language);
let tab='recipes', filters={query:'',category:'',cuisine:'',maxTime:0,minTime:0,diet:'',excluded:[],excludedProducts:[]}, servings=SERVINGS_DEFAULT, selected, autoOffers=[];
function toast(message) { const d=$('#detail'), host=d.open?d:document.body; if($('#toast').parentNode!==host)host.append($('#toast')); $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500); }
function persist() { try { save(localStorage,state); } catch { toast(t('storageError')); } }
function nav() { $('#nav').innerHTML=['recipes','favorites','shopping','offers'].map((key,i)=>`<button data-tab="${key}" ${key===tab?'aria-current="page"':''}><span aria-hidden="true">${['⌂','♡','☷','%'][i]}</span> ${t(key)}${key==='shopping'&&state.shopping.length?` <b>${state.shopping.filter(i=>!i.done).length}</b>`:''}</button>`).join(''); }
const currentAuto=()=>autoOffers.filter(o=>isCurrentAutomaticOffer(o));
// Re-rendering replaces the focused control; keyboard and screen-reader users must not lose their place.
function refocus(selector) { document.querySelector(selector)?.focus({preventScroll:true}); }
const offline=()=>navigator.onLine===false;
// A small non-blocking notice outside #main: it survives every re-render of the screens.
function netStatus() { const el=$('#net-status'); if(!el)return; const text=offline()?t(tab==='offers'?'offlineOffers':'offlineNotice'):''; if(el.textContent!==text)el.textContent=text; el.hidden=!text; }
// Photos are shown only with a complete rights record; a file that failed to load (e.g. offline) falls back to the emoji art.
const brokenPhotos=new Set();
function shownPhoto(r) { const photo=photoFor(r); return photo&&!brokenPhotos.has(photo.file)?photo:null; }
function photoImg(r,photo) { return `<img class="photo" data-photo="${esc(photo.file)}" src="${esc(photo.file)}" alt="${esc(r.photoAlt||r.name)}" width="640" height="480" loading="lazy" decoding="async">`; }
function creditLink(text,url) { const href=safeLink(url); return href?`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`:esc(text); }
function photoCredit(photo) { return `<figcaption>${t('photoCredit')}: ${creditLink(photo.attribution,photo.sourceUrl)} · ${t('photoLicense')}: ${creditLink(photo.license,photo.licenseUrl)}${photo.modifications?` · ${t('photoChanges')}: ${esc(photo.modifications)}`:''}</figcaption>`; }
// Cuisine tabs: a recipe without `cuisine` is Polish. The row appears when the catalog has at least two cuisines; a tab is shown for a cuisine that has recipes in the current tab's list (or is the chosen one).
const cuisineOf=r=>r.cuisine||'polish';
// CNT-034: the card and the detail name the dish's cuisine ("Kuchnia włoska") instead of one shared "home cooking" label.
function cuisineText(r) { const c=cuisineOf(r); return cuisines.includes(c)?t(`${c}Cuisine`):''; }
function cuisineTabs(base) { const count=c=>base.filter(r=>cuisineOf(r)===c).length; if(cuisines.filter(c=>recipes.some(r=>cuisineOf(r)===c)).length<2||!base.length)return ''; return ['',...cuisines.filter(c=>count(c)||c===filters.cuisine)].map(c=>`<button data-cuisine="${esc(c)}" aria-pressed="${c===filters.cuisine}">${t(c||'allCuisines')} <span class="chip-count" title="${t('cuisineCount')}">${c?count(c):base.length}</span></button>`).join(''); }
// Amounts are shown by weight (owner's decision 17.11.2026): every unit except ml is converted to grams
// with the same per-unit weights the nutrition estimate uses; pieces also get a "≈ N szt." hint.
// Stored amounts and units never change — conversion happens only for display.
function roundGrams(g) { return g<10 ? Math.round(g*2)/2 : g<100 ? Math.round(g) : Math.round(g/5)*5; }
function amount(i,factor=1) {
  const n=i.amount*factor, unit=products[i.product][1];
  if(unit==='ml') return `${num(Math.round(n))} ${unitLabel('ml',n)}`;
  const per=gramsPerUnit(i.product); if(!per) return `${num(n)} ${unitLabel(unit,n)}`;
  const g=n*per; const shown=g<0.5?`< 1 ${unitLabel('g',1)}`:`${num(roundGrams(g))} ${unitLabel('g',g)}`;
  if(unit!=='szt.') return shown;
  const pieces=Math.max(0.5,Math.round(n*2)/2); return `${shown} (≈ ${num(pieces)} ${unitLabel(unit,pieces)})`;
}
// Recipe/product texts in the UI language. Search also matches them; a Polish fallback is marked lang="pl" for screen readers.
const searchText=r=>language==='pl'?[]:[localizeRecipe(r).name,...r.ingredients.map(i=>productName(i.product))];
const plLang=(id,field)=>language!=='pl'&&!hasRecipeText(id,field)?' lang="pl"':'';
const listName=id=>languageInfo().keepCase?productName(id):productName(id).toLocaleLowerCase(locale);
function hero() { return `<section class="hero"><div><p class="eyebrow">${t('heroLabel')}</p><h1>${t('heroTitle').replace('\n','<br>')}</h1><p>${t('heroText')}</p><button class="primary" id="hero-random">${t('surprise')} <span aria-hidden="true">↗</span></button><small class="offline">◌ ${t('offline')}</small></div><div class="hero-art" aria-hidden="true"><div class="art-caption">${t('heroArtCaption')}</div><div class="plate"><div class="food food-1"></div><div class="food food-2"></div><div class="food food-3"></div><div class="leaf l1"></div><div class="leaf l2"></div><div class="leaf l3"></div><div class="tomato tm1"></div><div class="tomato tm2"></div></div><span class="art-note">${t('heroArtNote').replace('\n','<br>')}</span></div></section>`; }
// Nutrition estimates (CNT-026) are shown unless the user turned them off; old saved data has no settings.
const showNutrition=()=>state.settings?.showNutrition!==false;
function kcalText(r) { const n=showNutrition()&&nutritionPerServing(r); return n?` · <span class="sr-only">${t('approxKcal')} </span><span aria-hidden="true">≈</span> ${esc(n.kcal)} ${t('kcal')}`:''; }
function nutritionBlock(r) { if(!showNutrition())return ''; const n=nutritionPerServing(r); const row=(key,value,unit)=>`<div><dt>${t(key)}</dt><dd>${esc(value)} ${t(unit)}</dd></div>`; return `<section class="nutrition" aria-labelledby="nutrition-heading"><h3 id="nutrition-heading">${t('nutritionTitle')}</h3>${n?`<dl>${row('nutritionEnergy',n.kcal,'kcal')}${row('nutritionProtein',num(n.protein),'grams')}${row('nutritionFat',num(n.fat),'grams')}${row('nutritionCarbs',num(n.carbs),'grams')}</dl>`:`<p>${t('nutritionMissing')}</p>`}<p class="muted small">${t('nutritionNote')}</p></section>`; }
// CNT-027 / CNT-029: dishes by store promotions, prices next to ingredients. Ranking and prices use only the
// current automatic offers (currentAuto); a user's own note still marks a card. Prices are per the shop's unit, never summed.
const sortMode=()=>state.settings?.sort==='promotions'?'promotions':'default';
const sortList=list=>sortMode()==='promotions'?rankByPromotions(list,currentAuto()):list;
function promoCount(r) { const products=[...promoCoverage(r,currentAuto()).matched.map(m=>m.product),...matchingOffers(r,state.offers).map(o=>o.product)]; return new Set(products.filter(p=>!pantryProducts.includes(p))).size; }
function promoCountText(n) { return tn('promo',n); }
function sortControl() { return `<label class="sort-control">${t('sortLabel')}<select id="sort">${['default','promotions'].map(v=>`<option value="${v}" ${sortMode()===v?'selected':''}${v==='promotions'?` aria-label="${t('sortPromotionsShort')} — ${t('sortPromotions')}" title="${t('sortPromotions')}"`:''}>${t(v==='promotions'?'sortPromotionsShort':'sortDefault')}</option>`).join('')}</select></label>${sortMode()==='promotions'&&!currentAuto().length?`<p class="sort-hint">${t('sortNoOffers')}</p>`:''}`; }
function promoLine(o) { return `<p class="promo-line"><span class="promo-price">${esc(formatCurrency(o.price,{currency:o.currency,locale}))}</span> · ${esc(o.unit)} · ${esc(o.store)}: ${esc(o.name)} · <span class="promo-until">${t('promoUntil')} ${esc(formatMarketDay(o.until,locale))}</span>${o.scope?.type==='unverified'?` · <span class="promo-scope" title="${esc(o.scope.note??'')}">${t('scopeLabel')}: ${t('scopeUnverified')}</span>`:''}${o.url?` <a class="promo-link" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">${t('promoLink')}<span class="sr-only"> — ${esc(o.name)}, ${esc(o.store)} ${t('promoNewTab')}</span></a>`:''}</p>`; }
const shoppingPromo=product=>product?ingredientOffers({ingredients:[{product,amount:1}]},currentAuto())[0].offer:null;
// Random dish (CNT-029 extension): weighted by current promotions, same filters as the catalog (and the favorites tab
// when drawn there). Avoids the dish shown now and, while enough candidates remain, the last 5 drawn in this session.
const recentRandom=[];
const randomCandidates=()=>filterRecipes(tab==='favorites'?recipes.filter(x=>state.favorites.includes(x.id)):recipes,filters,{extraText:searchText});
function drawRandom() { const pool=randomCandidates(); for(let k=recentRandom.length;k>=0;k--){ const r=weightedSurprise(pool,currentAuto(),new Date(),{exclude:recentRandom.slice(recentRandom.length-k)}); if(r){ recentRandom.push(r.id); if(recentRandom.length>5)recentRandom.shift(); return r; } } return null; }
function rerollBlock() { const single=randomCandidates().length<2; return `<div class="reroll"><button class="secondary" id="reroll" ${single?'disabled aria-describedby="reroll-hint"':''}><span aria-hidden="true">↻</span> ${t('reroll')}</button>${single?`<p class="muted" id="reroll-hint">${t('rerollSingle')}</p>`:''}</div>`; }
// ---------- CNT-034: filters state, servings stepper, exclusion search (combobox), allergen groups ----------
const filtersActive=()=>!!(filters.query.trim()||filters.category||filters.cuisine||Number(filters.maxTime)||Number(filters.minTime)||filters.diet||filters.excluded.length||filters.excludedProducts.length||sortMode()!=='default');
function servingsControl() { return `<div class="portions"><label for="servings">${t('portions')}</label><div class="stepper"><button type="button" class="step" id="servings-dec" aria-controls="servings" aria-label="${t('servingsDecrease')}" aria-disabled="${servings<=SERVINGS_MIN}"><span aria-hidden="true">−</span></button><input id="servings" type="number" inputmode="numeric" min="${SERVINGS_MIN}" max="${SERVINGS_MAX}" step="1" required aria-describedby="servings-error" value="${servings}"><button type="button" class="step" id="servings-inc" aria-controls="servings" aria-label="${t('servingsIncrease')}" aria-disabled="${servings>=SERVINGS_MAX}"><span aria-hidden="true">+</span></button></div><p class="field-error" id="servings-error" hidden>${t('servingsInvalid')}</p><span class="sr-only" id="servings-status" aria-live="polite"></span></div>`; }
// Applies a valid number of servings: amounts in the list, the field (unless the user is typing in it), button states.
function updateServings(n,{keepInput=false,announce=false}={}) {
  servings=clampServings(n); const input=$('#servings'); if(!input||!selected)return;
  if(!keepInput)input.value=String(servings); input.removeAttribute('aria-invalid'); const err=$('#servings-error'); if(err)err.hidden=true;
  for(const i of selected.ingredients){const el=$(`[data-amount="${i.product}"]`);if(el)el.textContent=amount(i,servings/selected.servings);}
  $('#servings-dec')?.setAttribute('aria-disabled',String(servings<=SERVINGS_MIN)); $('#servings-inc')?.setAttribute('aria-disabled',String(servings>=SERVINGS_MAX));
  if(announce){const st=$('#servings-status');if(st)st.textContent=tn('servingsCount',servings);}
}
function servingsInvalid() { $('#servings')?.setAttribute('aria-invalid','true'); const err=$('#servings-error'); if(err)err.hidden=false; }
// Allergen groups: each chip lists a few products of the catalog carrying the allergen.
function allergenHint(a) { const ids=allergenProducts(a); if(!ids.length)return t('allergenNone'); return format(t('allergenExamples'),{list:ids.slice(0,3).map(listName).join(' · ')+(ids.length>3?'…':'')}); }
function exclusionsBlock() {
  const n=filters.excluded.length+filters.excludedProducts.length;
  return `<details class="exclusions"><summary>${t('exclude')}${n?` (${n})`:''}</summary><p>${t('allergensLabel')}</p><div class="checks allergen-chips">${allergens.map(a=>`<div class="allergen-chip"><label><input type="checkbox" value="${a}" aria-describedby="allergen-hint-${a}" ${filters.excluded.includes(a)?'checked':''}> ${t(a)}</label><span class="chip-hint" id="allergen-hint-${a}">${esc(allergenHint(a))}</span></div>`).join('')}</div><div class="exclude-search"><label for="exclude-input">${t('excludeSearch')}</label><div class="combo"><input id="exclude-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="exclude-options" aria-describedby="exclude-help" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${t('excludeSearchPlaceholder')}"><ul id="exclude-options" role="listbox" aria-label="${t('excludeSearch')}" hidden></ul></div><p class="muted small" id="exclude-empty" hidden>${t('excludeNoMatch')}</p><p class="muted small" id="exclude-help">${t('excludeHelp')}</p><p class="sr-only" id="exclude-status" aria-live="polite"></p></div><p class="muted">${t('allergenNote')}</p></details>${exclusionSummary()}`;
}
function exclusionSummary() {
  if(!filters.excluded.length&&!filters.excludedProducts.length)return '';
  const chip=(attr,id,name)=>`<button class="exclude-chip" ${attr}="${esc(id)}" aria-label="${t('removeExclusion')}: ${esc(name)}"><span aria-hidden="true">×</span> ${esc(name)}</button>`;
  return `<div class="exclusion-summary" role="group" aria-label="${t('excludedSummary')}"><span class="summary-label">${t('excludedSummary')}:</span>${filters.excluded.map(a=>chip('data-unexclude-allergen',a,t(a))).join('')}${filters.excludedProducts.map(p=>chip('data-unexclude',p,productName(p))).join('')}<button class="text-button" id="clear-exclusions" aria-label="${t('clearExclusionsLabel')}">${t('clearExclusions')}</button></div>`;
}
// Combobox: suggestions in the UI language and Polish; water and salt are not offered (as before, CNT-021).
const combo={ids:[],active:-1};
function setActive(k) {
  combo.active=k; const input=$('#exclude-input'), list=$('#exclude-options'); if(!input||!list)return;
  if(k>=0){input.setAttribute('aria-activedescendant',`exclude-opt-${combo.ids[k]}`);}else input.removeAttribute('aria-activedescendant');
  list.innerHTML=combo.ids.map((id,i)=>`<li role="option" id="exclude-opt-${esc(id)}" data-exclude-product="${esc(id)}" aria-selected="${i===k}">${esc(productName(id))}${language!=='pl'&&productName(id)!==products[id][0]?` <span class="muted" lang="pl">(${esc(products[id][0])})</span>`:''}</li>`).join('');
}
function suggest(query) {
  const q=String(query??'').trim(); combo.ids=suggestProducts(q,{nameOf:productName,skip:[...filters.excludedProducts,'water','salt']}); setActive(-1);
  const list=$('#exclude-options'), input=$('#exclude-input'), empty=$('#exclude-empty'), status=$('#exclude-status');
  if(list)list.hidden=!combo.ids.length; input?.setAttribute('aria-expanded',String(!!combo.ids.length));
  if(empty)empty.hidden=!(q&&!combo.ids.length);
  if(status)status.textContent=!q?'':combo.ids.length?tn('suggestions',combo.ids.length):t('excludeNoMatch');
}
function closeSuggestions() { combo.ids=[]; setActive(-1); const list=$('#exclude-options'); if(list)list.hidden=true; $('#exclude-input')?.setAttribute('aria-expanded','false'); }
function excludeProduct(id) {
  if(!Object.hasOwn(products,id))return;
  if(!filters.excludedProducts.includes(id))filters.excludedProducts=[...filters.excludedProducts,id];
  combo.ids=[]; combo.active=-1; catalog(); const d=$('.exclusions'); if(d)d.open=true; refocus('#exclude-input'); toast(format(t('excludedAdded'),{name:productName(id)}));
}
function filterBar() { return `<section class="inspiration" id="inspiration"><div class="section-heading"><div><p class="eyebrow">${t('eyebrowIdea')}</p><h2>${t('surprise')}</h2><p>${t('surpriseText')}</p></div><button class="primary" id="random">${t('surprise')} <span aria-hidden="true">✧</span></button></div><div class="filter-row"><label>${t('meal')}<select id="category"><option value="">${t('all')}</option>${categories.map(c=>`<option value="${c}" ${c===filters.category?'selected':''}>${t(c)}</option>`).join('')}</select></label><label>${t('prepTime')}<select id="time">${['15','30','60','over60','0'].map(v=>`<option value="${v}" ${timeOption(filters)===v?'selected':''}>${v==='0'?t('noLimit'):v==='over60'?format(t('timeOver'),{n:60}):format(t('timeUpTo'),{n:v})}</option>`).join('')}</select></label><label>${t('diet')}<select id="diet">${['',...DIETS].map(d=>`<option value="${d}" ${filters.diet===d?'selected':''}>${t(d||'anyDiet')}</option>`).join('')}</select></label></div><label class="nutrition-toggle"><input type="checkbox" id="show-nutrition" ${showNutrition()?'checked':''}> ${t('showNutrition')}</label>${exclusionsBlock()}</section>`; }
function card(source,index) { const r=localizeRecipe(source); const favorite=state.favorites.includes(r.id); const deals=promoCount(r); const photo=shownPhoto(r); return `<article class="recipe-card"><div class="card-art art-${r.category}${photo?' has-photo':''}"><span aria-hidden="true">${r.emoji}</span>${photo?photoImg(r,photo):''}<span class="category-label">${t(r.category)}</span><button class="favorite ${favorite?'active':''}" data-favorite="${r.id}" aria-label="${t(favorite?'removeFavorite':'addFavorite')}: ${esc(r.name)}" aria-pressed="${favorite}">${favorite?'♥':'♡'}</button></div><div class="card-body"><div class="meta"><span>◷ ${r.minutes} ${t('minutes')}${kcalText(r)}</span><span>${r.vegan?t('vegan'):r.vegetarian?t('vegetarian'):t('easy')}</span></div><h3><button data-recipe="${r.id}"${plLang(r.id,'name')}>${esc(r.name)}</button></h3><p>${r.ingredients.slice(0,3).map(i=>esc(listName(i.product))).join(' · ')}</p><div class="card-bottom"><span class="card-series"><span aria-hidden="true">${String(index+1).padStart(2,'0')} / </span><span class="card-cuisine">${cuisineText(r)}</span></span><button data-recipe="${r.id}" aria-label="${esc(r.name)}">↗</button></div>${deals?`<span class="offer-tag"><span aria-hidden="true">%</span> ${esc(promoCountText(deals))}</span>`:''}</div></article>`; }
function results() {
  const base=tab==='favorites'?recipes.filter(r=>state.favorites.includes(r.id)):recipes;
  const list=sortList(filterRecipes(base,filters,{extraText:searchText}));
  const tabsEl=$('#cuisine-tabs'), tabsHtml=cuisineTabs(base); if(tabsEl&&tabsEl.tabsHtml!==tabsHtml){tabsEl.innerHTML=tabsHtml;tabsEl.tabsHtml=tabsHtml;tabsEl.hidden=!tabsHtml;const on=$('#cuisine-tabs [aria-pressed="true"]');if(on&&(on.offsetLeft<tabsEl.scrollLeft||on.offsetLeft+on.offsetWidth>tabsEl.scrollLeft+tabsEl.clientWidth))tabsEl.scrollLeft=on.offsetLeft-6;}
  // CNT-034: the reset button is shown whenever any filter (or the promotions order) is active; the empty state has its own.
  const emptyReset=!list.length&&!(tab==='favorites'&&!base.length), headReset=filtersActive()&&!emptyReset;
  $('#results').innerHTML=`<div class="results-heading"><p role="status">${t(tab==='favorites'?'savedCount':'found')}: ${list.length}</p>${sortControl()}${headReset?`<button id="reset" class="text-button">${t('reset')}</button>`:''}</div>${list.length?`<div class="recipe-grid">${list.map(card).join('')}</div>`:tab==='favorites'&&!base.length?`<div class="empty"><span class="empty-icon" aria-hidden="true">♡</span><p>${t('emptyFavorites')}</p><button class="secondary" data-tab="recipes">${t('browseRecipes')}</button></div>`:`<div class="empty"><span class="empty-icon" aria-hidden="true">⌕</span><p>${t('noResults')}</p><button class="secondary" id="reset">${t('reset')}</button></div>`}`;
}
function catalog() { const open=$('.exclusions')?.open; $('#main').innerHTML=`${tab==='recipes'?hero():`<section class="page-title"><p class="eyebrow">${t('eyebrowCollection')}</p><h1>${t('favorites')}</h1></section>`}${filterBar()}<section class="catalog"><div class="section-heading"><h2>${t(tab==='favorites'?'favorites':'recipes')}</h2><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="${t('search')}" placeholder="${t('searchPlaceholder')}" value="${esc(filters.query)}"></label></div><div class="cuisine-tabs" id="cuisine-tabs" role="group" aria-label="${t('cuisine')}" hidden></div><div class="category-chips" aria-label="${t('meal')}">${['',...categories].map(c=>`<button data-category="${c}" aria-pressed="${c===filters.category}">${t(c||'all')}</button>`).join('')}</div><div id="results"></div></section>`; if(open)$('.exclusions').open=true; results(); }
function shopping() { $('#main').innerHTML=`<section class="page-title"><p class="eyebrow">${t('eyebrowShopping')}</p><h1>${t('shoppingTitle')}</h1><p>${t('shoppingText')}</p></section><section class="panel shopping-panel"><form id="custom"><label for="custom-name">${t('customItem')}</label><div class="inline"><input id="custom-name" required maxlength="120"><button class="primary">${t('add')}</button></div></form>${state.shopping.length?`<div class="shopping-actions"><button class="secondary" id="clear-done">${t('clearDone')}</button><button class="secondary" id="copy">${t('copy')}</button></div><ul class="shopping-list">${state.shopping.map(i=>`<li class="${i.done?'done':''}"><label><input type="checkbox" data-check="${esc(i.id)}" ${i.done?'checked':''}><span>${esc(i.product?productName(i.product):i.name)}</span>${i.product?`<strong>${esc(amount(i))}</strong>`:''}</label><button class="text-button" data-remove="${esc(i.id)}" aria-label="${t('remove')}: ${esc(i.product?productName(i.product):i.name)}">×</button>${shoppingPromo(i.product)?promoLine(shoppingPromo(i.product)):''}</li>`).join('')}</ul>`:`<div class="empty"><span class="empty-icon" aria-hidden="true">☷</span><p>${t('emptyShopping')}</p><button class="secondary" data-tab="recipes">${t('browseRecipes')}</button></div>`}</section>`; }
function offerEntry(o,automatic=false) { const expired=o.until<marketDate(); const currency=automatic?o.currency:market.currency; const scope=!automatic?(o.region?esc(o.region):t('scopeNotGiven')):o.scope?.type==='nationwide'?t('scopeNationwide'):o.scope?.type==='region'?`${t('scopeRegion')}: ${esc(o.scope.regions.join(', '))}`:`${t('scopeUnverified')}: ${esc(o.scope?.note??'')}`; return `<article class="offer-row"><div><h3>${esc(automatic?o.name:productName(o.product))} · ${esc(formatCurrency(o.price,{currency,locale}))}${automatic?` · ${esc(o.unit)}`:` / ${t('unitPackage')}`}</h3><p>${esc(o.store)} · ${automatic?`${t('validFrom')}: ${esc(formatMarketDay(o.from,locale))} · `:''}${t('until')}: ${esc(formatMarketDay(o.until,locale))} ${expired?`<strong>${t('expired')}</strong>`:''}</p><p class="muted small">${t('scopeLabel')}: ${scope} · ${t('conditionsLabel')}: ${automatic?esc(o.conditions):t('conditionsUser')} · ${t('currencyLabel')}: ${esc(currency)}</p><small>${t('source')}: ${esc(o.source)}${automatic?` · ${t('fetched')}: ${esc(formatMarketDateTime(o.fetchedAt,locale))}`:''}</small></div>${automatic?'':`<button class="text-button" data-offer-remove="${esc(o.id)}">${t('remove')}</button>`}${expired?'':`<div class="offer-matches"><span>${t('matched')}:</span> ${recipes.filter(r=>r.ingredients.some(i=>i.product===o.product)).map(localizeRecipe).map(r=>`<button class="text-button" data-recipe="${r.id}"${plLang(r.id,'name')}>${esc(r.name)}</button>`).join('')}</div>`}</article>`; }
function offers() { $('#main').innerHTML=`<section class="page-title"><p class="eyebrow">${t('eyebrowOffers')}</p><h1>${t('offersTitle')}</h1><p>${t('offersText')}</p></section><p class="notice">${t('offersNotice')}</p><section class="panel"><h2>${t('botTitle')}</h2><p>${t('botDescription')}</p><p class="muted">${currentAuto().length?esc(tn('verifiedOffers',currentAuto().length)):t('botEmpty')}</p>${currentAuto().map(o=>offerEntry(o,true)).join('')}</section><section class="panel"><form id="offer-form"><div class="offer-form"><label>${t('product')}<select name="product">${Object.keys(products).filter(id=>id!=='water').sort((a,b)=>productName(a).localeCompare(productName(b),locale)).map(id=>`<option value="${id}">${esc(productName(id))}</option>`).join('')}</select></label><label>${t('store')}<input name="store" required maxlength="100"></label><label>${t('price')} (${esc(currencySymbol({locale}))})<input name="price" type="number" min="0.01" max="100000" step="0.01" required></label><label>${t('until')}<input name="until" type="date" min="${marketDate()}" required></label><label>${t('regionOptional')}<input name="region" maxlength="100"></label><label class="wide">${t('source')}<input name="source" required maxlength="500"></label></div><button class="primary">${t('offerAdd')}</button></form></section><section class="panel">${state.offers.length?state.offers.map(o=>offerEntry(o)).join(''):`<p class="empty">${t('emptyOffers')}</p>`}</section>`; }
// CNT-030: page shell texts, <html lang/dir> and the language picker follow the UI language.
const pickerLabel=()=>t('language')==='Language'?'Language':`${t('language')} / Language`;
const globe='<svg class="globe" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 12h19M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
// Language list: native name plus the name in the current UI language ("Українська — ukraiński"), so every
// option is recognisable; the badge uses country-style codes people know (UA, DK) instead of ISO "UK", "DA".
const BADGE={uk:'UA',da:'DK',en:'EN'};
function langBadge(code){return BADGE[code]||code.toUpperCase();}
function langOptionLabel(l){let local='';try{local=new Intl.DisplayNames([locale],{type:'language'}).of(l.code)||'';}catch{}
  return local&&local.toLocaleLowerCase(locale)!==l.name.toLocaleLowerCase(locale)?`${l.name} — ${local}`:l.name;}
function picker() {
  const el=$('#lang'); if(!el)return;
  const hint=!state.settings?.language&&language==='pl'?suggestLanguage(globalThis.navigator?.languages?.length?navigator.languages:[globalThis.navigator?.language]):null;
  // CNT-034: compact picker in the top-right corner — a small globe with the language code; the native select lies
  // over it (44 px hit area) and keeps the full accessible label.
  el.innerHTML=`${hint?`<button class="lang-suggest" id="lang-suggest" data-lang="${esc(hint)}" lang="${esc(hint)}" aria-label="${esc(pickerLabel())}: ${esc(languageInfo(hint).name)}"><span class="suggest-long">${esc(languageInfo(hint).name)}?</span><span class="suggest-short" aria-hidden="true">${esc(langBadge(hint))}?</span></button>`:''}${themeToggleHTML(t)}<div class="lang-select"><label for="language">${globe}<span class="sr-only">${esc(pickerLabel())}</span><span class="lang-code" aria-hidden="true">${esc(langBadge(language))}</span></label><select id="language">${languages.map(l=>`<option value="${esc(l.code)}" lang="${esc(l.code)}" ${l.code===language?'selected':''}>${esc(langOptionLabel(l))}</option>`).join('')}</select></div>`;
}
function shell() {
  const info=languageInfo(), root=document.documentElement;
  if(root){root.lang=info.code;root.dir=info.dir;}
  document.title=t('docTitle'); $('meta[name="description"]')?.setAttribute('content',t('docDescription'));
  const text=(s,v)=>{const el=$(s);if(el)el.textContent=v;};
  text('.skip',t('skipLink'));text('.brand small',t('brandTagline'));text('#footer-text',t('footerText'));text('#privacy',t('privacyButton'));
  $('.brand')?.setAttribute('aria-label',t('brandHome')); $('#nav')?.setAttribute('aria-label',t('navLabel'));
  picker();
}
async function chooseLanguage(code) {
  if(!languages.some(l=>l.code===code))return;
  state.settings={...state.settings,language:code}; persist();
  await setLanguage(code); shell(); render(); refocus('#language');
}
function render() { nav(); netStatus(); if(tab==='shopping') shopping(); else if(tab==='offers') offers(); else catalog(); }
// CNT-034: every recipe opens with 1 serving (amounts scale from recipe.servings); "Draw another" keeps the chosen number.
function openRecipe(id,random=false,keepServings=false) { selected=recipes.find(r=>r.id===id); if(!selected)return; if(!keepServings)servings=SERVINGS_DEFAULT; detail(random); }
function detail(random=false) {
  const r=localizeRecipe(selected); const d=$('#detail'); const photo=shownPhoto(r);
  const priced=ingredientOffers(r,currentAuto());
  d.innerHTML=`<div class="dialog-head"><span class="eyebrow">${random?t('result'):t(r.category)}</span><button class="close" data-close aria-label="${t('close')}">×</button></div><div class="detail-title${photo?' has-photo':''}">${photo?`<figure class="detail-photo">${photoImg(r,photo)}${photoCredit(photo)}</figure>`:''}<span aria-hidden="true">${r.emoji}</span><h2 id="detail-heading"${plLang(r.id,'name')}>${esc(r.name)}</h2><p class="muted">◷ ${r.minutes} ${t('minutes')} · ${r.vegan?t('vegan'):r.vegetarian?t('vegetarian'):t('easy')}${cuisineText(r)?` · ${cuisineText(r)}`:''}</p></div>${random?rerollBlock():''}${servingsControl()}<h3>${t('ingredients')}</h3><ul class="ingredients">${r.ingredients.map((i,k)=>`<li><span>${esc(productName(i.product))}</span><strong data-amount="${i.product}">${esc(amount(i,servings/r.servings))}</strong>${priced[k].offer&&!priced[k].pantry?promoLine(priced[k].offer):''}</li>`).join('')}</ul><button class="primary full" id="add-shopping">${t('addShopping')}</button>${nutritionBlock(r)}<h3>${t('steps')}</h3><ol class="steps"${plLang(r.id,'steps')}>${r.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="allergen-note"><strong>${t('allergens')}: ${r.allergens.length?r.allergens.map(t).join(', '):t('noAllergens')}</strong><p>${t('allergenNote')}</p></div>`;
  d.scrollTop=0; if(!d.open)d.showModal();
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('button,a,[role="option"]'); if(!b)return;
  if(b.id==='lang-suggest') {await chooseLanguage(b.dataset.lang);return;}
  if(b.dataset.tab) {tab=b.dataset.tab;render();window.scrollTo({top:0});}
  if(b.dataset.recipe)openRecipe(b.dataset.recipe);
  if(b.dataset.favorite) {const id=b.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];persist();results();refocus(`[data-favorite="${CSS.escape(id)}"]`);}
  if(b.dataset.category!==undefined) {filters.category=b.dataset.category;catalog();refocus(`.category-chips [data-category="${CSS.escape(filters.category)}"]`);}
  if(b.dataset.cuisine!==undefined) {filters.cuisine=b.dataset.cuisine;results();refocus(`#cuisine-tabs [data-cuisine="${CSS.escape(filters.cuisine)}"]`);}
  if(b.id==='reset'){filters={query:'',category:'',cuisine:'',maxTime:0,minTime:0,diet:'',excluded:[],excludedProducts:[]};state.settings={...state.settings,sort:'default'};persist();catalog();refocus('#search');toast(t('filtersCleared'));}
  if(b.id==='random'||b.id==='hero-random') {const r=drawRandom();if(r)openRecipe(r.id,true);else toast(t('noMatches'));}
  if(b.id==='reroll') {const r=drawRandom();if(r){openRecipe(r.id,true,true);refocus('#reroll');}}
  if(b.id==='servings-dec'||b.id==='servings-inc'){if(b.getAttribute?.('aria-disabled')==='true')return;updateServings(servings+(b.id==='servings-inc'?1:-1),{announce:true});}
  if(b.dataset.excludeProduct)excludeProduct(b.dataset.excludeProduct);
  if(b.dataset.unexclude!==undefined||b.dataset.unexcludeAllergen!==undefined){const p=b.dataset.unexclude,a=b.dataset.unexcludeAllergen;if(p!==undefined)filters.excludedProducts=filters.excludedProducts.filter(x=>x!==p);else filters.excluded=filters.excluded.filter(x=>x!==a);catalog();refocus('.exclusion-summary .exclude-chip');if(!$('.exclusion-summary .exclude-chip'))refocus('.exclusions summary');toast(format(t('excludedRemoved'),{name:p!==undefined?productName(p):t(a)}));}
  if(b.id==='clear-exclusions'){filters.excluded=[];filters.excludedProducts=[];catalog();refocus('.exclusions summary');}
  if(b.hasAttribute('data-close'))$('#detail').close();
  if(b.id==='add-shopping'){const n=parseServings($('#servings')?.value);if(n===null){servingsInvalid();refocus('#servings');return;}updateServings(n,{keepInput:true});state.shopping=addIngredients(state.shopping,selected,n);persist();nav();toast(t('added'));}
  if(b.dataset.remove){state.shopping=state.shopping.filter(i=>i.id!==b.dataset.remove);persist();render();}
  if(b.id==='clear-done'){state.shopping=state.shopping.filter(i=>!i.done);persist();render();}
  if(b.id==='copy'){try{await navigator.clipboard.writeText(state.shopping.map(i=>`${i.done?'✓':'□'} ${i.product?productName(i.product):i.name}${i.product?' — '+amount(i):''}`).join('\n'));toast(t('copied'));}catch{toast(t('copyFailed'));}}
  if(b.dataset.offerRemove){state.offers=state.offers.filter(o=>o.id!==b.dataset.offerRemove);persist();offers();}
  if(b.id==='privacy') {$('#detail').innerHTML=`<div class="dialog-head"><h2 id="detail-heading">${t('privacyTitle')}</h2><button class="close" data-close aria-label="${t('close')}">×</button></div><p>${t('privacyText')}</p><button class="primary" id="export">${t('export')}</button><p>${t('importNote')}</p><label class="file-label">${t('import')}<input type="file" id="import" accept="application/json,.json" aria-label="${t('importLabel')}"></label>`;$('#detail').showModal();}
  if(b.id==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`co-na-talerz-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
document.addEventListener('input',e=>{
  if(e.target.id==='search'){filters.query=e.target.value;results();}
  if(e.target.id==='servings'&&selected){const n=parseServings(e.target.value);if(n===null)servingsInvalid();else updateServings(n,{keepInput:true});}
  if(e.target.id==='exclude-input')suggest(e.target.value);
});
// Combobox keys: arrows move through suggestions, Enter adds the active (or first) one, Esc closes the list, then clears the field.
document.addEventListener('keydown',e=>{
  if(e.target?.id!=='exclude-input')return; const n=combo.ids.length;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!n){suggest(e.target.value);if(combo.ids.length)setActive(0);return;}setActive(e.key==='ArrowDown'?(combo.active+1)%n:(combo.active-1+n)%n);}
  else if(e.key==='Enter'){e.preventDefault();const id=combo.ids[combo.active]??combo.ids[0];if(id)excludeProduct(id);}
  else if(e.key==='Escape'){if(n){e.preventDefault();closeSuggestions();}else if(e.target.value){e.preventDefault();e.target.value='';suggest('');}}
});
// A press on a suggestion must not move focus out of the field (the list would close before the click).
document.addEventListener('mousedown',e=>{if(e.target?.closest?.('#exclude-options'))e.preventDefault();});
document.addEventListener('focusout',e=>{if(e.target?.id==='exclude-input')setTimeout(()=>{if(document.activeElement?.id!=='exclude-input')closeSuggestions();},0);});
document.addEventListener('change',async e=>{
  const el=e.target;
  if(el.id==='language'){await chooseLanguage(el.value);return;}
  if(el.id==='category'){filters.category=el.value;catalog();refocus('#category');}
  if(el.id==='time'){const o=TIME_OPTIONS[el.value]||TIME_OPTIONS['0'];filters.maxTime=o.maxTime;filters.minTime=o.minTime;results();}
  if(el.id==='diet'){filters.diet=el.value;results();}
  // Leaving the servings field with an invalid value restores the last valid number.
  if(el.id==='servings'&&selected&&parseServings(el.value)===null)updateServings(servings);
  if(el.id==='sort'){state.settings={...state.settings,sort:el.value==='promotions'?'promotions':'default'};persist();results();refocus('#sort');}
  if(el.id==='show-nutrition'){state.settings={...state.settings,showNutrition:el.checked};persist();results();}
  if(el.closest('.checks')){filters.excluded=[...document.querySelectorAll('.checks input:checked')].map(c=>c.value);catalog();refocus(`.checks input[value="${CSS.escape(String(el.value))}"]`);}
  if(el.dataset.check){const item=state.shopping.find(i=>i.id===el.dataset.check);if(!item)return;item.done=el.checked;persist();render();refocus(`[data-check="${CSS.escape(item.id)}"]`);}
  if(el.id==='import'){try{if(!el.files[0]||el.files[0].size>1000000)throw Error();const imported=validateState(JSON.parse(await el.files[0].text()));state=imported;persist();$('#detail').close();render();toast(t('imported'));}catch{toast(t('invalidBackup'));}}
});
document.addEventListener('submit',e=>{
  if(e.target.id==='custom'){e.preventDefault();const input=$('#custom-name');const name=input.value.trim();if(!name)return;state.shopping.push({id:newId(),name,done:false});persist();render();$('#custom-name').focus();}
  if(e.target.id==='offer-form'){e.preventDefault();const f=new FormData(e.target);const region=String(f.get('region')||'').trim();const o={id:newId(),product:f.get('product'),store:f.get('store').trim(),price:Number(f.get('price')),until:f.get('until'),source:f.get('source').trim(),...(region?{region}:{})};if(!validOffer(o)||o.until<marketDate()){toast(t('invalidOffer'));return;}state.offers.push(o);persist();offers();toast(t('offerSaved'));}
});
// Images do not bubble their error event, hence the capture phase.
document.addEventListener('error',e=>{const img=e.target;if(!(img instanceof HTMLImageElement)||!img.dataset.photo)return;brokenPhotos.add(img.dataset.photo);img.closest('.has-photo')?.classList.remove('has-photo');(img.closest('figure')||img).remove();},true);
// Close on a press that starts and ends on the backdrop; presses inside the dialog (also on its padding) keep it open.
const outside=(d,e)=>{const r=d.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
let backdropPress=false;
$('#detail').addEventListener('pointerdown',e=>{backdropPress=e.target===e.currentTarget&&outside(e.currentTarget,e);});
$('#detail').addEventListener('click',e=>{const d=e.currentTarget;if(backdropPress&&e.target===d&&outside(d,e))d.close();backdropPress=false;});
$('#detail').addEventListener('close',()=>{document.body.append($('#toast'));});
window.addEventListener('offline',netStatus);
window.addEventListener('online',()=>{brokenPhotos.clear();netStatus();toast(t('backOnline'));});
shell(); render(); if(storageWarning)toast(t('storageError'));
fetch('./offers.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.version===1&&Array.isArray(data.offers)){autoOffers=data.offers.filter(o=>isCurrentAutomaticOffer(o)&&typeof o.fetchedAt==='string');if(tab==='offers')offers();else if(tab==='recipes'||tab==='favorites')results();}}).catch(()=>{});
// Automatic updates: the build gives every release a new service-worker cache name. When the new
// worker takes over, reload so the page runs the new files — but never while the user is typing
// or has a dialog open; then wait until the app goes to the background or the dialog closes.
if('serviceWorker' in navigator) {
  const hadController=!!navigator.serviceWorker.controller; let updatePending=false, reloading=false;
  const busy=()=>$('#detail')?.open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
  const applyUpdate=()=>{ if(!updatePending||reloading)return; if(document.visibilityState==='hidden'||!busy()){reloading=true;location.reload();} };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!hadController)return; updatePending=true; applyUpdate(); });
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    const check=()=>{ if(navigator.onLine!==false)reg.update().catch(()=>{}); };
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible')check(); applyUpdate(); });
    window.addEventListener('online',check); setInterval(check,60*60*1000);
  }).catch(()=>{});
  $('#detail').addEventListener('close',applyUpdate); document.addEventListener('focusout',()=>setTimeout(applyUpdate,0));
}




