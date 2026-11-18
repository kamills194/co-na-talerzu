// Walidator bota „kucharz” (scripts/bots/chef.mjs). Czyste funkcje, bez sieci — testy: apps/web/tests/chef-bot.test.mjs.
// Model językowy proponuje danie, ale o wszystkim, co dotyczy bezpieczeństwa, decyduje ten kod:
//  - alergeny przepisu liczone są z produktów, a flagi vegan/vegetarian z rodzaju produktów (kinds),
//  - nowe produkty muszą mieć alergeny z listy aplikacji, rodzaj, wartości odżywcze i przeliczenie jednostki,
//  - produkty z alergenami, których aplikacja nie umie oznaczyć (skorupiaki, mięczaki, orzeszki ziemne,
//    łubin, siarczyny), są odrzucane,
//  - teksty w 8 językach mają tyle samo kroków, bez znaków HTML i bez błędów redakcyjnych.
import { tidy, lint } from './text-rules.mjs';

export const LANGS = ['pl', 'en', 'de', 'uk', 'fr', 'da', 'es', 'it'];
export const KINDS = ['plant', 'dairy', 'egg', 'meat', 'fish', 'animal'];
// Rodzaj produktów redakcji (nie mają znacznika rodzaju): mięso z listy MEAT_PRODUCTS, ryby z alergenu,
// nabiał i jajka z alergenów. Miód i żelatyny nie ma w katalogu redakcji.
export function kindOf(id, products, meat, botKinds = {}) {
  if (botKinds[id]) return botKinds[id];
  const p = products[id]; if (!p) return null;
  if (meat.includes(id)) return 'meat';
  if (p[2].includes('fish')) return 'fish';
  if (p[2].includes('milk')) return 'dairy';
  if (p[2].includes('eggs')) return 'egg';
  return 'plant';
}
// Nazwy wskazujące na alergeny spoza listy aplikacji (pl i en). Takie produkty bot odrzuca.
const UNSUPPORTED = /krewet|krab|homar|langust|raki\b|kalmar|ośmiorni|małż|mul(e|i)\b|ostryg|przegrzeb|orzesz(ek|ki) ziemn|arachid|łubin|siarczyn|shrimp|prawn|crab|lobster|squid|octopus|mussel|oyster|clam|scallop|peanut|lupin|sulphite|sulfite|pasta krewetkowa|shrimp paste/i;
// Rdzenie nazw mięsa i ryb — produkt o takiej nazwie musi mieć odpowiedni rodzaj (jak test w nutrition.test.mjs).
const MEAT_STEMS = /kurczak|kurcz|szynk|mięs|mies|wieprz|wołow|wolow|boczek|kiełbas|kielbas|indyk|kaczk|jagnię|baranin|cielęc|chorizo|salami|smalec|żelatyn|bulion drobiow|bulion wołow/i;
const FISH_STEMS = /ryb|łosoś|losos|dorsz|śledź|śledz|tuńczyk|sardyn|anchois|makrel|pstrąg|halibut|mintaj|morszczuk|szprot/i;
const HTML = /[<>"&]/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRODUCT_ID = /^[a-z][a-z0-9]{1,23}$/;
const EMOJI = /^\p{Extended_Pictographic}️?$/u;
const graphemes = s => [...new Intl.Segmenter('pl', { granularity: 'grapheme' }).segment(s)].length;
export const norm = s => String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, ' ').trim();

function checkText(s, lang, where, errors, { min = 1, max = 400 } = {}) {
  if (typeof s !== 'string' || !s.trim()) { errors.push(`${where}: pusty tekst`); return s; }
  const t = tidy(s.trim(), lang);
  if (t.length < min) errors.push(`${where}: za krótki tekst`);
  if (t.length > max) errors.push(`${where}: za długi tekst`);
  if (HTML.test(t)) errors.push(`${where}: niedozwolony znak < > " &`);
  if (/\n/.test(t)) errors.push(`${where}: podział wiersza`);
  for (const issue of lint(t, lang)) errors.push(`${where}: ${issue}`);
  return t;
}

/**
 * Sprawdza jedno danie zaproponowane przez model i buduje rekordy do zapisu.
 * @param c kandydat z modelu (format: SCHEMA w chef.mjs)
 * @param ctx { products, recipes, meat, botKinds, nutrition, unitGrams, density, categories, cuisines, allergens, units }
 * @returns { ok, errors, recipe, products, kinds, nutrition, unitGrams, translations:{lang:{recipe, products}} }
 */
export function validateCandidate(c, ctx) {
  const errors = [];
  if (!c || typeof c !== 'object') return { ok: false, errors: ['brak danych'] };
  const id = String(c.id ?? '');
  if (!SLUG.test(id) || id.length > 48) errors.push(`id „${id}” nie jest poprawnym identyfikatorem`);
  if (ctx.recipes.some(r => r.id === id)) errors.push(`id „${id}” już istnieje`);
  if (!ctx.categories.includes(c.category)) errors.push(`nieznana kategoria ${c.category}`);
  if (!ctx.cuisines.includes(c.cuisine)) errors.push(`nieznana kuchnia ${c.cuisine}`);
  if (!Number.isInteger(c.minutes) || c.minutes < 5 || c.minutes > 180) errors.push(`czas ${c.minutes} poza 5–180 min`);
  if (typeof c.emoji !== 'string' || graphemes(c.emoji) !== 1 || !EMOJI.test(c.emoji)) errors.push(`ikona „${c.emoji}” nie jest jednym emoji`);

  // Nowe produkty.
  const newProducts = {}, kinds = {}, nutrition = {}, unitGrams = {}, names = Object.fromEntries(LANGS.slice(1).map(l => [l, {}]));
  for (const [pid, p] of Object.entries(c.newProducts ?? {})) {
    const w = `produkt ${pid}`;
    if (!PRODUCT_ID.test(pid)) { errors.push(`${w}: niepoprawne id`); continue; }
    if (pid in ctx.products) { errors.push(`${w}: id już istnieje w katalogu`); continue; }
    const name = checkText(p?.name, 'pl', `${w}.name`, errors, { max: 60 });
    if (Object.values(ctx.products).some(q => norm(q[0]) === norm(name))) errors.push(`${w}: produkt „${name}” już jest w katalogu pod innym id`);
    if (!ctx.units.includes(p?.unit)) errors.push(`${w}: jednostka ${p?.unit} spoza listy ${ctx.units.join(', ')}`);
    const al = Array.isArray(p?.allergens) ? [...new Set(p.allergens)] : null;
    if (!al || !al.every(a => ctx.allergens.includes(a))) errors.push(`${w}: alergeny spoza listy aplikacji`);
    if (!KINDS.includes(p?.kind)) errors.push(`${w}: nieznany rodzaj ${p?.kind}`);
    const allNames = [name, ...Object.values(p?.names ?? {})].join(' | ');
    if (UNSUPPORTED.test(allNames)) errors.push(`${w}: zawiera alergen, którego aplikacja nie oznacza (skorupiaki, mięczaki, orzeszki ziemne, łubin, siarczyny)`);
    if (MEAT_STEMS.test(name) && p?.kind !== 'meat') errors.push(`${w}: nazwa wskazuje na mięso, a rodzaj to ${p?.kind}`);
    if (FISH_STEMS.test(name) && p?.kind !== 'fish') errors.push(`${w}: nazwa wskazuje na rybę, a rodzaj to ${p?.kind}`);
    if (p?.kind === 'fish' && !al?.includes('fish')) errors.push(`${w}: ryba bez alergenu fish`);
    if (al?.includes('fish') && p?.kind !== 'fish') errors.push(`${w}: alergen fish przy rodzaju ${p?.kind}`);
    if (p?.kind === 'dairy' && !al?.includes('milk')) errors.push(`${w}: nabiał bez alergenu milk`);
    if (p?.kind === 'egg' && !al?.includes('eggs')) errors.push(`${w}: jajka bez alergenu eggs`);
    if (p?.kind === 'plant' && al?.some(a => ['milk', 'eggs', 'fish'].includes(a))) errors.push(`${w}: produkt roślinny z alergenem odzwierzęcym`);
    const n = p?.nutrition;
    if (!Array.isArray(n) || n.length !== 4 || !n.every(v => Number.isFinite(v) && v >= 0) || n[0] > 900 || n[1] + n[2] + n[3] > 100.5) errors.push(`${w}: wartości odżywcze poza zakresem na 100 g`);
    if (!['g', 'ml'].includes(p?.unit)) {
      if (!Number.isFinite(p?.unitGrams) || p.unitGrams <= 0 || p.unitGrams > 2000) errors.push(`${w}: brak przeliczenia jednostki ${p?.unit} na gramy`);
      else unitGrams[pid] = p.unitGrams;
    }
    for (const l of LANGS.slice(1)) names[l][pid] = checkText(p?.names?.[l], l, `${w}.names.${l}`, errors, { max: 60 });
    newProducts[pid] = [name, p?.unit, al ?? []];
    kinds[pid] = p?.kind; nutrition[pid] = n;
  }
  const productOf = pid => newProducts[pid] ?? ctx.products[pid];

  // Składniki.
  const items = Array.isArray(c.ingredients) ? c.ingredients : [];
  if (items.length < 2 || items.length > 16) errors.push(`liczba składników ${items.length} poza 2–16`);
  const seen = new Set();
  for (const it of items) {
    const pid = it?.product, a = it?.amount;
    if (!productOf(pid)) { errors.push(`nieznany produkt ${pid}`); continue; }
    if (seen.has(pid)) errors.push(`produkt ${pid} podany dwa razy`); seen.add(pid);
    const unit = productOf(pid)[1];
    const max = ['g', 'ml'].includes(unit) ? 3000 : 30;
    if (!Number.isFinite(a) || a <= 0 || a > max) errors.push(`ilość ${pid}: ${a} ${unit} poza zakresem`);
  }
  for (const pid of Object.keys(newProducts)) if (!seen.has(pid)) errors.push(`nowy produkt ${pid} nie jest użyty`);

  // Diety i alergeny — liczone, nie przepisywane z modelu.
  const kindOfItem = pid => kinds[pid] ?? kindOf(pid, ctx.products, ctx.meat, ctx.botKinds);
  const ks = items.filter(i => productOf(i?.product)).map(i => kindOfItem(i.product));
  const vegetarian = !ks.some(k => k === 'meat' || k === 'fish');
  const vegan = ks.every(k => k === 'plant');
  const allergens = [...new Set(items.filter(i => productOf(i?.product)).flatMap(i => productOf(i.product)[2]))];
  if (c.vegan !== undefined && c.vegan !== vegan) errors.push(`model podał vegan=${c.vegan}, z produktów wynika ${vegan}`);
  if (c.vegetarian !== undefined && c.vegetarian !== vegetarian) errors.push(`model podał vegetarian=${c.vegetarian}, z produktów wynika ${vegetarian}`);

  // Wartości odżywcze na porcję (jak nutritionPerServing): 40–1500 kcal i zgodność z makro.
  const grams = pid => { const u = productOf(pid)[1]; return u === 'g' ? 1 : u === 'ml' ? (ctx.density[pid] ?? 1) : (unitGrams[pid] ?? ctx.unitGrams[pid]); };
  const sum = [0, 0, 0, 0]; let nutritionOk = true;
  for (const it of items) {
    const n = nutrition[it?.product] ?? ctx.nutrition[it?.product], g = productOf(it?.product) ? grams(it.product) : null;
    if (!Array.isArray(n) || !Number.isFinite(g) || !Number.isFinite(it?.amount)) { nutritionOk = false; break; }
    n.forEach((v, k) => { sum[k] += v * it.amount * g / 100; });
  }
  if (nutritionOk) {
    const [kcal, p, f, carb] = sum.map(v => v / 2);
    if (kcal < 40 || kcal > 1500) errors.push(`${Math.round(kcal)} kcal na porcję — poza 40–1500`);
    if (Math.abs(4 * p + 4 * carb + 9 * f - kcal) > 0.25 * kcal) errors.push('kcal na porcję niezgodne z makroskładnikami');
  } else errors.push('brak danych do policzenia wartości odżywczych');

  // Teksty w 8 językach.
  const texts = {}, plSteps = c.texts?.pl?.steps;
  if (!Array.isArray(plSteps) || plSteps.length < 3 || plSteps.length > 10) errors.push('polski przepis musi mieć 3–10 kroków');
  for (const l of LANGS) {
    const tx = c.texts?.[l];
    if (!tx) { errors.push(`brak tekstów ${l}`); continue; }
    const name = checkText(tx.name, l, `${l}.name`, errors, { min: 3, max: 90 });
    const photoAlt = checkText(tx.photoAlt, l, `${l}.photoAlt`, errors, { min: 10, max: 200 });
    if (/\.$/.test(photoAlt ?? '')) errors.push(`${l}.photoAlt: kropka na końcu`);
    if (!Array.isArray(tx.steps) || tx.steps.length !== (plSteps?.length ?? -1)) { errors.push(`${l}: liczba kroków różna od polskiej`); continue; }
    const steps = tx.steps.map((s, k) => checkText(s, l, `${l}.steps[${k}]`, errors, { min: 15, max: 700 }));
    texts[l] = { name, steps, photoAlt };
  }
  const plName = texts.pl?.name;
  if (plName && ctx.recipes.some(r => norm(r.name) === norm(plName))) errors.push(`danie „${plName}” już jest w katalogu`);
  if (texts.pl?.photoAlt && ctx.recipes.some(r => r.photoAlt === texts.pl.photoAlt)) errors.push('opis zdjęcia powtarza istniejący');
  // Polskie kroki muszą wymieniać składniki — przepis nie może pomijać produktów z listy.
  const plStepsText = norm((texts.pl?.steps ?? []).join(' '));
  const missing = items.filter(i => productOf(i?.product) && !['salt', 'water', 'blackpepper', 'oil', 'oliveoil'].includes(i.product))
    .filter(i => { const words = norm(productOf(i.product)[0]).split(' ').filter(w => w.length >= 4); return words.length && !words.some(w => plStepsText.includes(w.slice(0, Math.max(4, w.length - 3)))); });
  if (missing.length > Math.max(1, Math.floor(items.length / 4))) errors.push(`kroki nie wspominają składników: ${missing.map(i => i.product).join(', ')}`);

  if (errors.length) return { ok: false, errors };
  const recipe = {
    id, category: c.category, cuisine: c.cuisine, name: texts.pl.name, minutes: c.minutes, vegan, vegetarian, emoji: c.emoji, servings: 2,
    ingredients: items.map(i => ({ product: i.product, amount: i.amount })), allergens, steps: texts.pl.steps,
    origin: 'Przepis opracowany przez bota redakcji Co na talerz i sprawdzony automatycznie ze źródłami', review: 'bot', photo: null,
    photoAlt: texts.pl.photoAlt, sources: [],
  };
  const translations = Object.fromEntries(LANGS.slice(1).map(l => [l, { recipe: texts[l], products: names[l] }]));
  return { ok: true, errors: [], recipe, products: newProducts, kinds, nutrition, unitGrams, translations };
}

// Źródło uznajemy, gdy adres pojawił się w wynikach wyszukiwania tej samej rozmowy (nie jest wymyślony).
export function acceptedSources(urls, searched) {
  const clean = u => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href.replace(/[#?].*$/, '').replace(/\/$/, '') : null; } catch { return null; } };
  const known = new Set([...searched].map(clean).filter(Boolean));
  return [...new Set((urls ?? []).map(clean).filter(u => u && known.has(u)))];
}

// Region o najmniejszej liczbie dań (losowo spośród trzech najmniej licznych — dla różnorodności).
export function pickRegion(cuisines, recipes, random = Math.random) {
  const count = c => recipes.filter(r => (r.cuisine || 'polish') === c).length;
  const sorted = [...cuisines].sort((a, b) => count(a) - count(b));
  const pool = sorted.slice(0, 3);
  return pool[Math.floor(random() * pool.length)];
}

// Scala zaakceptowane dania z danymi bota (bez nadpisywania). Zwraca nowe obiekty danych.
export function mergeAccepted(plData, langData, accepted) {
  const pl = structuredClone(plData), langs = structuredClone(langData);
  for (const a of accepted) {
    Object.assign(pl.products, a.products); Object.assign(pl.kinds, a.kinds); Object.assign(pl.nutrition, a.nutrition); Object.assign(pl.unitGrams, a.unitGrams);
    pl.recipes.push(a.recipe);
    for (const [l, t] of Object.entries(a.translations)) {
      Object.assign(langs[l].products, t.products);
      langs[l].recipes[a.recipe.id] = t.recipe;
    }
  }
  return { pl, langs };
}
