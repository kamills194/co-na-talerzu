// CNT-030: wybór języka, tłumaczenia interfejsu i przepisów, powrót do polskiego.
// Pliki językowe: src/i18n.<kod>.js (messages) i src/recipes.<kod>.js (recipes, products). Zasady: docs/TLUMACZENIA.md.
// Widok: app.js na atrapie DOM (jak promo-ui.test.mjs), każdy scenariusz w osobnym procesie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import * as i18n from '../src/i18n.js';
import { recipes, products } from '../src/recipes.pl.js';
import { filterRecipes } from '../src/domain.js';
import { emptyState, validateState, load, save, KEY } from '../src/storage.js';

const { messages, languages, languageCodes, PLURAL_SUFFIX, isKnownKey } = i18n;
const src = name => new URL('../src/' + name, import.meta.url);
const url = p => new URL(p, import.meta.url).href;
const others = languageCodes.filter(c => c !== 'pl');
const files = Object.fromEntries(await Promise.all(others.map(async code => [code, { ui:await import(src(`i18n.${code}.js`)), rc:await import(src(`recipes.${code}.js`)) }])));
const byId = new Map(recipes.map(r => [r.id, r]));
// Placeholders: {name} and ${...}. Compared as sets of names per key.
const placeholders = s => new Set([...String(s).matchAll(/\$\{[^}]*\}|\{\w+\}/g)].map(m => m[0]));
const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
// Polish counterpart of a key: the key itself or, for a plural form, the Polish `<base>_other`.
const polishOf = key => Object.hasOwn(messages, key) ? messages[key] : messages[`${PLURAL_SUFFIX.exec(key)[1]}_other`];
const pluralBases = [...new Set(Object.keys(messages).map(k => PLURAL_SUFFIX.exec(k)?.[1]).filter(Boolean))];
const plainKeys = Object.keys(messages).filter(k => !PLURAL_SUFFIX.test(k));

test('Lista języków: polski domyślny i siedem zarejestrowanych języków z nazwami we własnym języku', () => {
  assert.deepEqual(languages.map(l => [l.code, l.name]), [['pl','Polski'],['en','English'],['de','Deutsch'],['uk','Українська'],['fr','Français'],['da','Dansk'],['es','Español'],['it','Italiano']]);
  assert.equal(i18n.language, 'pl'); assert.equal(i18n.locale, 'pl-PL');
  for (const l of languages) { assert.ok(['ltr','rtl'].includes(l.dir), l.code); assert.doesNotThrow(() => new Intl.PluralRules(l.locale)); assert.equal(new Intl.Locale(l.locale).language, l.code === 'uk' ? 'uk' : l.code); }
});

test('Każdy język ma oba pliki w src/ i w pamięci offline (ASSETS)', async () => {
  const sw = await readFile(src('sw.js'), 'utf8');
  for (const code of others) for (const name of [`i18n.${code}.js`, `recipes.${code}.js`]) {
    await access(src(name));
    assert.ok(sw.includes(`'./${name}'`), `${name} nie jest w ASSETS`);
  }
});

test('Pliki językowe mają wymagane eksporty i tylko tekst', () => {
  for (const [code, { ui, rc }] of Object.entries(files)) {
    for (const [name, value] of [['messages', ui.messages], ['recipes', rc.recipes], ['products', rc.products]])
      assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${code}: brak eksportu ${name}`);
    for (const [k, v] of Object.entries(ui.messages)) assert.ok(typeof v === 'string' && v.trim(), `${code}.${k}: pusty lub nie-tekst`);
    for (const [id, v] of Object.entries(rc.products)) assert.ok(typeof v === 'string' && v.trim(), `${code} produkt ${id}`);
    for (const [id, r] of Object.entries(rc.recipes)) {
      assert.deepEqual(Object.keys(r).filter(k => !['name','steps','photoAlt'].includes(k)), [], `${code} ${id}: tylko name, steps, photoAlt (bez ilości, alergenów, flag)`);
      for (const f of ['name','photoAlt']) if (r[f] !== undefined) assert.ok(typeof r[f] === 'string' && r[f].trim(), `${code} ${id}.${f}`);
    }
  }
});

test('(a) Tłumaczenia nie mają kluczy spoza polskiego słownika; formy liczby mnogiej pasują do języka', () => {
  for (const [code, { ui }] of Object.entries(files)) {
    const cats = new Intl.PluralRules(i18n.languageInfo(code).locale).resolvedOptions().pluralCategories;
    for (const key of Object.keys(ui.messages)) {
      assert.ok(isKnownKey(key), `${code}: klucz „${key}” nie istnieje w i18n.js`);
      const m = PLURAL_SUFFIX.exec(key);
      if (m && pluralBases.includes(m[1])) assert.ok(cats.includes(m[2]), `${code}: ${key} — język nie ma formy „${m[2]}” (${cats})`);
    }
    for (const base of pluralBases) if (Object.keys(ui.messages).some(k => k.startsWith(base + '_'))) assert.ok(Object.hasOwn(ui.messages, `${base}_other`), `${code}: ${base} bez formy _other`);
  }
});

test('(b) Placeholdery {n} i ${...} są takie same jak w polskim; teksty UI bez znaków HTML', () => {
  for (const [key, text] of Object.entries(messages)) assert.ok(!/[<>"&]/.test(text), `pl.${key}`);
  for (const [code, { ui }] of Object.entries(files)) for (const [key, text] of Object.entries(ui.messages).filter(([k]) => isKnownKey(k))) {
    assert.ok(same(placeholders(text), placeholders(polishOf(key))), `${code}.${key}: ${[...placeholders(text)]} ≠ ${[...placeholders(polishOf(key))]}`);
    assert.ok(!/[<>"&]/.test(text), `${code}.${key}: znaki < > " & są niedozwolone (tekst trafia do HTML)`);
    assert.equal(text.split('\n').length, polishOf(key).split('\n').length, `${code}.${key}: liczba podziałów wiersza`);
  }
});

test('(c) Przetłumaczone przepisy istnieją w katalogu i mają tyle kroków co po polsku', () => {
  for (const [code, { rc }] of Object.entries(files)) for (const [id, r] of Object.entries(rc.recipes)) {
    assert.ok(byId.has(id), `${code}: nieznany przepis ${id}`);
    if (r.steps !== undefined) {
      assert.ok(Array.isArray(r.steps) && r.steps.every(s => typeof s === 'string' && s.trim()), `${code} ${id}.steps`);
      assert.equal(r.steps.length, byId.get(id).steps.length, `${code} ${id}: liczba kroków`);
    }
  }
});

test('(d) Przetłumaczone produkty istnieją w katalogu', () => {
  for (const [code, { rc }] of Object.entries(files)) for (const id of Object.keys(rc.products)) assert.ok(Object.hasOwn(products, id), `${code}: nieznany produkt ${id}`);
});

test('Angielski: 100% kluczy interfejsu, przepisów i produktów', () => {
  const { ui, rc } = files.en;
  for (const key of plainKeys) assert.ok(Object.hasOwn(ui.messages, key), `en: brak ${key}`);
  for (const base of pluralBases) for (const cat of new Intl.PluralRules('en-GB').resolvedOptions().pluralCategories) assert.ok(Object.hasOwn(ui.messages, `${base}_${cat}`), `en: brak ${base}_${cat}`);
  for (const r of recipes) {
    const tr = rc.recipes[r.id];
    assert.ok(tr && tr.name && tr.photoAlt && tr.steps?.length === r.steps.length, `en: niepełny przepis ${r.id}`);
  }
  for (const id of Object.keys(products)) assert.ok(rc.products[id], `en: brak produktu ${id}`);
  for (const r of recipes) assert.notEqual(rc.recipes[r.id].name, r.name, `en: nazwa ${r.id} nie jest przetłumaczona`);
});

test('Zastępcze pliki pozostałych języków: puste albo poprawne — brakujące teksty wracają do polskiego', async () => {
  try {
    assert.equal(await i18n.setLanguage('de'), true);
    assert.equal(i18n.language, 'de'); assert.equal(i18n.locale, 'de-DE');
    for (const key of plainKeys) assert.equal(i18n.t(key), Object.hasOwn(files.de.ui.messages, key) ? files.de.ui.messages[key] : messages[key], key);
    const r = byId.get('owsianka');
    assert.equal(i18n.localizeRecipe(r).name, files.de.rc.recipes.owsianka?.name ?? r.name);
    assert.equal(i18n.productName('apple'), files.de.rc.products.apple ?? 'Jabłko');
    assert.ok(i18n.tn('promo', 2).startsWith('2'));
    assert.throws(() => i18n.t('nieistniejacyKlucz'), /Missing translation/);
  } finally { await i18n.setLanguage('pl'); }
});

test('setLanguage: angielski, liczba mnoga przez Intl.PluralRules, jednostki, nieznany kod → polski', async () => {
  try {
    assert.equal(await i18n.setLanguage('en'), true);
    assert.equal(i18n.t('recipes'), 'Recipes'); assert.equal(i18n.locale, 'en-GB');
    assert.equal(i18n.tn('promo', 1), '1 ingredient on offer'); assert.equal(i18n.tn('promo', 3), '3 ingredients on offer');
    assert.equal(i18n.tn('verifiedOffers', 1200), '1,200 offers read from a shop source');
    assert.equal(i18n.unitLabel('kromka', 1), 'slice'); assert.equal(i18n.unitLabel('kromka', 4), 'slices'); assert.equal(i18n.unitLabel('g', 5), 'g');
    const r = byId.get('ziemniaki-z-gzikiem'), en = i18n.localizeRecipe(r);
    assert.match(en.name, /gzik/); assert.equal(en.steps.length, r.steps.length); assert.deepEqual(en.ingredients, r.ingredients); assert.equal(en.id, r.id); assert.equal(en.minutes, r.minutes);
    assert.equal(await i18n.setLanguage('xx'), false); assert.equal(i18n.language, 'pl'); assert.equal(i18n.t('recipes'), 'Przepisy');
  } finally { await i18n.setLanguage('pl'); }
  assert.equal(i18n.tn('promo', 1), '1 składnik w promocji'); assert.equal(i18n.tn('promo', 3), '3 składniki w promocji'); assert.equal(i18n.tn('promo', 5), '5 składników w promocji');
  assert.equal(i18n.unitLabel('łyżeczka', 0.5), 'łyżeczki'); assert.equal(i18n.unitLabel('ząbek', 1), 'ząbek'); assert.equal(i18n.unitLabel('szt.', 3), 'szt.');
  for (const [, p] of Object.entries(products)) assert.ok(Object.hasOwn(i18n.UNIT_KEYS, p[1]), `jednostka ${p[1]} bez klucza`);
});

test('Walidacja wpisów: kroki o innej liczbie, nieznane id i klucze są pomijane (powrót do polskiego)', () => {
  const r = byId.get('owsianka');
  assert.deepEqual(i18n.cleanRecipes({ owsianka:{ name:'X', steps:['a'] }, nieznany:{ name:'Y' } }), { owsianka:{ name:'X' } });
  assert.deepEqual(i18n.cleanRecipes({ owsianka:{ steps:r.steps.map(() => 'krok') } }).owsianka.steps.length, r.steps.length);
  assert.deepEqual(i18n.cleanMessages({ recipes:'R', nieznany:'?', promo_one:'{n} x', unitG_one:'g', copy:'', add:5 }), { recipes:'R', promo_one:'{n} x' });
  assert.deepEqual(i18n.cleanProducts({ apple:'Apple', unicorn:'U', milk:'' }), { apple:'Apple' });
});

test('Wyszukiwanie: nazwa przetłumaczona i polska', async () => {
  try {
    await i18n.setLanguage('en');
    const extraText = r => [i18n.localizeRecipe(r).name, ...r.ingredients.map(i => i18n.productName(i.product))];
    const ids = q => filterRecipes(recipes, { query:q }, { extraText }).map(r => r.id);
    assert.ok(ids('porridge').includes('owsianka')); assert.ok(ids('owsianka').includes('owsianka'));
    assert.ok(ids('courgette').includes('placki-z-cukinii')); assert.ok(ids('cukinia').includes('placki-z-cukinii'));
    assert.deepEqual(filterRecipes(recipes, { query:'porridge' }), [], 'bez extraText wyszukiwanie jak dotąd (tylko polski)');
  } finally { await i18n.setLanguage('pl'); }
});

test('Zapis: settings.language opcjonalne; stare dane bez niego ważne; nieznany kod pomijany; zły typ odrzucony', () => {
  const legacy = { version:1, favorites:['kakao'], shopping:[], offers:[], settings:{ showNutrition:false, sort:'promotions' } };
  assert.deepEqual(validateState(legacy), legacy);
  assert.deepEqual(validateState(emptyState()), emptyState());
  assert.deepEqual(validateState({ ...emptyState(), settings:{ language:'en' } }), { ...emptyState(), settings:{ language:'en' } });
  assert.deepEqual(validateState({ ...emptyState(), settings:{ language:'pl', sort:'default' } }), { ...emptyState(), settings:{ language:'pl', sort:'default' } });
  assert.deepEqual(validateState({ ...emptyState(), settings:{ language:'klingon' } }), emptyState());
  for (const bad of [5, null, {}, ['en']]) assert.throws(() => validateState({ ...emptyState(), settings:{ language:bad } }), JSON.stringify(bad));
  const m = new Map(), storage = { getItem:k => m.get(k) ?? null, setItem:(k, v) => m.set(k, v) };
  save(storage, { ...emptyState(), settings:{ language:'uk' } }); assert.equal(KEY, 'co-na-talerz:v1');
  assert.equal(load(storage).settings.language, 'uk'); assert.equal(JSON.parse(m.get(KEY)).version, 1);
});

function runApp({ saved, navLang = 'en-US', script }) {
  const code = `const els=new Map(),el=s=>{if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',open:false,attrs:{},classList:{add(){},remove(){}},showModal(){},close(){},focus(){},addEventListener(){},removeEventListener(){},setAttribute(k,v){this.attrs[k]=v},removeAttribute(){},append(){},hidden:false,style:{},dataset:{}});return els.get(s);};
    const handlers={},store=new Map(${JSON.stringify(saved ? [[KEY, JSON.stringify(saved)]] : [])});
    globalThis.document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,f)=>handlers[n]=f,body:el('body'),documentElement:{lang:'pl',dir:'ltr'},title:''};
    Object.defineProperty(globalThis,'navigator',{value:{language:${JSON.stringify(navLang)},languages:[${JSON.stringify(navLang)}],onLine:true},configurable:true});
    globalThis.window={scrollTo(){},addEventListener(){}};globalThis.CSS={escape:s=>String(s)};globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
    globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,offers:[]})});
    await import(${JSON.stringify(url('../src/app.js'))});await new Promise(r=>setTimeout(r,20));
    const click=b=>handlers.click({target:{closest:()=>({dataset:{},id:'',hasAttribute:()=>false,...b})}});
    const change=t=>handlers.change({target:{dataset:{},closest:()=>null,...t}});
    const input=t=>handlers.input({target:{dataset:{},validity:{valid:true},...t}});
    const out={};
    ${script}
    out.html=document.documentElement;out.title=document.title;out.saved=store.has(${JSON.stringify(KEY)})?JSON.parse(store.get(${JSON.stringify(KEY)})):null;
    console.log(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding:'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '', 'brak ostrzeżeń i błędów w konsoli');
  return JSON.parse(r.stdout);
}

test('Domyślnie polski, także gdy przeglądarka jest po angielsku; wybór zapisany, <html lang> i teksty zmienione', () => {
  const out = runApp({ script:`out.before={results:el('#results').innerHTML,lang:el('#lang').innerHTML,footer:el('#footer-text').textContent};
    await change({id:'language',value:'en'});
    out.after={results:el('#results').innerHTML,main:el('#main').innerHTML,lang:el('#lang').innerHTML,footer:el('#footer-text').textContent,nav:el('#nav').innerHTML,navLabel:el('#nav').attrs['aria-label']};
    await click({dataset:{recipe:'owsianka'}});out.detail=el('#detail').innerHTML;
    await click({dataset:{tab:'shopping'}});out.shopping=el('#main').innerHTML;` });
  const b = out.before, a = out.after;
  assert.ok(b.results.includes('>Owsianka z jabłkiem i cynamonem<')); assert.equal(b.footer, 'Co na talerz · Twoja domowa kuchnia');
  assert.ok(b.lang.includes('<label for="language">')); assert.ok(b.lang.includes('Język / Language'));
  assert.ok(b.lang.includes('<option value="pl" lang="pl" selected>Polski</option>'));
  for (const l of languages) assert.ok(b.lang.includes(`<option value="${l.code}" lang="${l.code}"`) && b.lang.includes(`>${l.name}</option>`), l.code);
  assert.ok(b.lang.includes('id="lang-suggest" data-lang="en" lang="en"'), 'podpowiedź języka przeglądarki, bez przełączania');
  assert.ok(a.results.includes('>Porridge with apple and cinnamon<')); assert.ok(a.results.includes('rolled oats · milk · apple'));
  assert.ok(a.main.includes('Surprise me')); assert.equal(a.footer, 'Co na talerz · Your home kitchen'); assert.equal(a.navLabel, 'Main navigation');
  assert.ok(a.nav.includes('Shopping list')); assert.ok(a.lang.includes('<option value="en" lang="en" selected>English</option>')); assert.ok(a.lang.includes('>Language<'));
  assert.ok(!a.lang.includes('lang-suggest'), 'po wyborze podpowiedź znika');
  assert.deepEqual(out.html, { lang:'en', dir:'ltr' }); assert.equal(out.title, 'Co na talerz — home-cooking ideas');
  assert.equal(out.saved.settings.language, 'en');
  assert.ok(out.detail.includes('Wash the apple, remove the core and grate it.')); assert.ok(out.detail.includes('100 g')); assert.ok(out.detail.includes('0.5 tsp'));
  assert.ok(out.detail.includes('<h2 id="detail-heading">Porridge with apple and cinnamon</h2>'));
  assert.ok(out.shopping.includes('Shopping without forgetting'));
});

test('Zapisany język działa od startu; stare dane bez języka i przeglądarka po polsku → polski bez podpowiedzi', () => {
  const saved = { ...emptyState(), favorites:['owsianka'], shopping:[{ id:'bread', product:'bread', amount:4, done:false }, { id:'garlic', product:'garlic', amount:1, done:false }], settings:{ language:'en', sort:'default' } };
  const out = runApp({ saved, navLang:'pl-PL', script:`out.results=el('#results').innerHTML;await click({dataset:{tab:'shopping'}});out.shopping=el('#main').innerHTML;
    await click({dataset:{tab:'offers'}});out.offers=el('#main').innerHTML;await click({dataset:{tab:'recipes'}});input({id:'search',value:'porridge'});out.searchEn=el('#results').innerHTML;input({id:'search',value:'owsianka'});out.searchPl=el('#results').innerHTML;` });
  assert.deepEqual(out.html, { lang:'en', dir:'ltr' });
  assert.ok(out.results.includes('Porridge with apple and cinnamon'));
  assert.ok(out.shopping.includes('<span>Bread</span><strong>4 slices</strong>')); assert.ok(out.shopping.includes('<span>Garlic</span><strong>1 clove</strong>'));
  assert.ok(out.offers.includes('SPEND LESS, EAT WELL')); assert.ok(out.offers.includes('Price per pack (PLN)'), 'waluta rynku (PLN) niezależnie od języka');
  assert.ok(out.searchEn.includes('data-recipe="owsianka"')); assert.ok(out.searchPl.includes('data-recipe="owsianka"'));
  assert.deepEqual(out.saved.settings, { language:'en', sort:'default' });
  const legacy = runApp({ saved:{ version:1, favorites:[], shopping:[], offers:[], settings:{ showNutrition:true } }, navLang:'pl-PL', script:`out.results=el('#results').innerHTML;out.lang=el('#lang').innerHTML;` });
  assert.deepEqual(legacy.html, { lang:'pl', dir:'ltr' }); assert.ok(legacy.results.includes('Owsianka z jabłkiem i cynamonem')); assert.ok(!legacy.lang.includes('lang-suggest'));
});

test('Język zastępczy (pusty plik) pokazuje polskie teksty bez błędów; brakujące teksty oznaczone lang="pl"', () => {
  const out = runApp({ saved:{ ...emptyState(), settings:{ language:'de' } }, script:`out.results=el('#results').innerHTML;await click({dataset:{recipe:'owsianka'}});out.detail=el('#detail').innerHTML;out.lang=el('#lang').innerHTML;` });
  assert.deepEqual(out.html, { lang:'de', dir:'ltr' });
  if (!Object.keys(files.de.rc.recipes).length) {
    assert.ok(out.results.includes('<button data-recipe="owsianka" lang="pl">Owsianka z jabłkiem i cynamonem</button>'));
    assert.ok(out.detail.includes('<ol class="steps" lang="pl">'));
  }
  assert.ok(out.lang.includes('<option value="de" lang="de" selected>Deutsch</option>'));
});
