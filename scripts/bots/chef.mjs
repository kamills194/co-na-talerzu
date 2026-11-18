// Bot „kucharz”: raz na dobę dopisuje porcję sprawdzonych, zredagowanych dań z wielu regionów, z tekstami we wszystkich
// 8 językach aplikacji, aż katalog ma co najmniej RECIPE_BOT_TARGET (600) pozycji; potem dalej, mniejszymi porcjami. Dodaje też warianty popularnych dań
// (np. obok pierogów ruskich: pierogi z mięsem, z jagodami).
//
// Przebieg jednego uruchomienia:
//  1. wybór regionu (najmniej liczne kuchnie) i dania bazowego do wariantów,
//  2. model (Claude) proponuje dania w formacie aplikacji: produkty, ilości na 2 porcje, kroki i teksty w 8 językach,
//  3. walidator (chef-validate.mjs) sprawdza każdy rekord; alergeny i diety liczy sam z produktów,
//     błędne rekordy model poprawia raz, potem są odrzucane,
//  4. drugi, niezależny przebieg modelu z wyszukiwarką internetową weryfikuje, że to prawdziwe, uznane danie regionu
//     i że proporcje, czasy i kroki są zgodne ze źródłami; źródło liczy się tylko, gdy jego adres był w wynikach wyszukiwania,
//  5. zaakceptowane dania trafiają do apps/web/src/recipes.bot.*.js, raport do apps/web/reports/chef-bot.json.
// Commit, testy i wdrożenie robi workflow .github/workflows/bot-chef.yml.
//
// Wymaga ANTHROPIC_API_KEY (sekret repozytorium). Bez klucza kończy się bez zmian (kod wyjścia 0, ostrzeżenie).
// Opcje: --dry (nic nie zapisuje), --batch N (dań w tym przebiegu), --region kuchnia.
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateCandidate, acceptedSources, pickRegion, mergeAccepted, LANGS, KINDS, kindOf } from './chef-validate.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC = ROOT + 'apps/web/src/';
const REPORT = ROOT + 'apps/web/reports/chef-bot.json';
const arg = name => { const i = process.argv.indexOf(name); return i >= 0 ? (process.argv[i + 1] ?? true) : undefined; };
const DRY = process.argv.includes('--dry');
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.RECIPE_BOT_MODEL || 'claude-opus-5-5';
const REVIEW_MODEL = process.env.RECIPE_BOT_REVIEW_MODEL || 'claude-sonnet-5-5';
const SEARCH_TOOL = process.env.RECIPE_BOT_WEB_SEARCH || 'web_search_20250305';
const TARGET = Number(process.env.RECIPE_BOT_TARGET || 600);
const UNITS = ['g', 'ml', 'szt.', 'łyżeczka', 'kromka', 'ząbek', 'pęczek', 'szczypta', 'doniczka'];
const REGION_NOTES = {
  polish: 'Poland', italian: 'Italy', german: 'Germany, Austria and German-speaking Switzerland', french: 'France and Belgium', japanese: 'Japan',
  indian: 'India, Pakistan, Bangladesh, Sri Lanka', mexican: 'Mexico', american: 'USA and Canada', mediterranean: 'Greece, Cyprus, Levant (Lebanon, Syria, Israel, Palestine, Jordan)',
  chinese: 'China and Taiwan (regional cuisines: Sichuan, Cantonese, Shandong, Hunan…)', thai: 'Thailand', vietnamese: 'Vietnam', korean: 'Korea',
  spanish: 'Spain (incl. Catalonia, Basque Country, Andalusia)', portuguese: 'Portugal and Brazil-Portuguese classics shared with Portugal', turkish: 'Turkey',
  hungarian: 'Hungary', ukrainian: 'Ukraine', georgian: 'Georgia (Caucasus)', british: 'England, Scotland, Wales, Ireland',
  scandinavian: 'Sweden, Norway, Denmark, Finland, Iceland', latinamerican: 'South and Central America and the Caribbean (Peru, Argentina, Brazil, Colombia, Cuba…)',
  african: 'Africa (Morocco, Tunisia, Egypt, Ethiopia, Nigeria, Senegal, South Africa…)', asian: 'other Asian countries',
};

const log = (...a) => console.log('[kucharz]', ...a);
const fresh = async file => import(pathToFileURL(SRC + file).href + '?t=' + Date.now());

async function loadContext() {
  const [cat, i18n, nut, botPl] = await Promise.all([fresh('recipes.pl.js'), fresh('i18n.js'), fresh('nutrition.js'), fresh('recipes.bot.pl.js')]);
  const langs = {};
  for (const l of LANGS.slice(1)) langs[l] = (await fresh(`recipes.bot.${l}.js`)).data;
  return {
    products: cat.products, recipes: cat.recipes, cuisines: cat.cuisines, categories: i18n.categories, allergens: i18n.allergens,
    meat: nut.MEAT_PRODUCTS, nutrition: nut.NUTRITION, unitGrams: nut.UNIT_GRAMS, density: nut.DENSITY, botKinds: botPl.data.kinds, units: UNITS,
    botPl: botPl.data, botLangs: langs,
  };
}

// ---------- Claude API ----------
async function claude(body, attempt = 0) {
  const r = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, stream: true }),
  });
  if ((r.status === 429 || r.status >= 500) && attempt < 4) {
    const wait = Number(r.headers.get('retry-after')) * 1000 || 15000 * (attempt + 1);
    log(`API ${r.status}, ponawiam za ${Math.round(wait / 1000)} s`); await new Promise(f => setTimeout(f, wait));
    return claude(body, attempt + 1);
  }
  if (!r.ok) throw Error(`Anthropic API: HTTP ${r.status} ${(await r.text()).slice(0, 500)}`);
  return readStream(r.body);
}
// Odpowiedź strumieniowa (SSE) — długie generowanie nie przekracza limitów czasu nagłówków HTTP.
export async function readStream(body) {
  const msg = { content: [], stop_reason: null }, json = {};
  let buf = '';
  const handle = ev => {
    if (ev.type === 'message_start') Object.assign(msg, ev.message, { content: [] });
    else if (ev.type === 'content_block_start') { msg.content[ev.index] = structuredClone(ev.content_block); if (ev.content_block.type === 'tool_use' || ev.content_block.type === 'server_tool_use') json[ev.index] = ''; }
    else if (ev.type === 'content_block_delta') {
      const b = msg.content[ev.index], d = ev.delta;
      if (d.type === 'text_delta') b.text = (b.text ?? '') + d.text;
      else if (d.type === 'input_json_delta') json[ev.index] += d.partial_json;
      else if (d.type === 'citations_delta') (b.citations ??= []).push(d.citation);
    } else if (ev.type === 'content_block_stop' && ev.index in json) {
      try { msg.content[ev.index].input = json[ev.index] ? JSON.parse(json[ev.index]) : {}; } catch { msg.content[ev.index].input = {}; }
    } else if (ev.type === 'message_delta') msg.stop_reason = ev.delta?.stop_reason ?? msg.stop_reason;
    else if (ev.type === 'error') throw Error(`Anthropic API: ${JSON.stringify(ev.error)}`);
  };
  const decoder = new TextDecoder();
  for await (const chunk of body) {
    buf += decoder.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i); buf = buf.slice(i + 2);
      const data = frame.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
      if (data) handle(JSON.parse(data));
    }
  }
  msg.content = msg.content.filter(Boolean);
  return msg;
}
// Rozmowa z narzędziami serwera (wyszukiwarka): kontynuuje po pause_turn, zbiera adresy z wyników wyszukiwania.
async function converse(body, toolName, searched = new Set()) {
  const messages = [...body.messages];
  for (let round = 0; round < 6; round++) {
    const res = await claude({ ...body, messages });
    for (const block of res.content) {
      if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) for (const x of block.content) if (x.url) searched.add(x.url);
      if (block.type === 'text') for (const c of block.citations ?? []) if (c.url) searched.add(c.url);
    }
    const call = res.content.find(b => b.type === 'tool_use' && b.name === toolName);
    if (call) return { input: call.input, searched };
    messages.push({ role: 'assistant', content: res.content });
    if (res.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Zakończ, wywołując narzędzie ${toolName}.` });
  }
  throw Error(`model nie wywołał ${toolName}`);
}

const textSchema = { type: 'object', required: ['name', 'steps', 'photoAlt'], properties: {
  name: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, photoAlt: { type: 'string' } } };
const SUBMIT = {
  name: 'submit_recipes',
  description: 'Zapisz zaproponowane dania w formacie katalogu aplikacji.',
  input_schema: { type: 'object', required: ['recipes'], properties: { recipes: { type: 'array', items: {
    type: 'object', required: ['id', 'category', 'cuisine', 'minutes', 'emoji', 'ingredients', 'texts'],
    properties: {
      id: { type: 'string', description: 'slug z polskiej nazwy, małe litery ASCII i myślniki' },
      variantOf: { type: 'string', description: 'id dania bazowego, gdy to wariant (inne nadzienie/wersja)' },
      category: { type: 'string' }, cuisine: { type: 'string' }, minutes: { type: 'integer' }, emoji: { type: 'string' },
      vegan: { type: 'boolean' }, vegetarian: { type: 'boolean' },
      ingredients: { type: 'array', items: { type: 'object', required: ['product', 'amount'], properties: { product: { type: 'string' }, amount: { type: 'number' } } } },
      newProducts: { type: 'object', additionalProperties: { type: 'object', required: ['name', 'unit', 'allergens', 'kind', 'nutrition', 'names'], properties: {
        name: { type: 'string' }, unit: { type: 'string', enum: UNITS }, allergens: { type: 'array', items: { type: 'string' } },
        kind: { type: 'string', enum: KINDS }, nutrition: { type: 'array', items: { type: 'number' } }, unitGrams: { type: 'number' },
        names: { type: 'object', properties: Object.fromEntries(LANGS.slice(1).map(l => [l, { type: 'string' }])) } } } },
      texts: { type: 'object', required: LANGS, properties: Object.fromEntries(LANGS.map(l => [l, textSchema])) },
    } } } } },
};
const REVIEW = {
  name: 'submit_review',
  description: 'Werdykt weryfikacji dla każdego dania.',
  input_schema: { type: 'object', required: ['reviews'], properties: { reviews: { type: 'array', items: {
    type: 'object', required: ['id', 'verdict', 'reasons', 'sources'],
    properties: { id: { type: 'string' }, verdict: { type: 'string', enum: ['accept', 'reject'] }, reasons: { type: 'string' },
      sources: { type: 'array', items: { type: 'string' }, description: 'adresy stron z wyników wyszukiwania potwierdzające danie i przepis' } } } } } },
};

function catalogBrief(ctx) {
  const lines = Object.entries(ctx.products).map(([id, p]) => `${id} | ${p[0]} | ${p[1]} | ${p[2].join(',') || '-'} | ${kindOf(id, ctx.products, ctx.meat, ctx.botKinds)}`);
  return lines.join('\n');
}
function generatorPrompt(ctx, region, n, base, rejected) {
  const inRegion = ctx.recipes.filter(r => r.cuisine === region);
  const cats = Object.fromEntries(ctx.categories.map(c => [c, inRegion.filter(r => r.category === c).length]));
  const variants = base ? ctx.recipes.filter(r => r.variantOf === base.id || r.id === base.id) : [];
  return `Jesteś redaktorem kulinarnym polskiej aplikacji z przepisami „Co na talerz”. Zaproponuj ${n} dań z regionu „${region}” (${REGION_NOTES[region] ?? region}).
${base ? `Dodatkowo zaproponuj 2 warianty dania „${base.name}” (id ${base.id}, kuchnia ${base.cuisine}) — inne tradycyjne nadzienia lub wersje tej samej potrawy, np. obok pierogów ruskich pierogi z mięsem czy z jagodami. Warianty mają pole variantOf="${base.id}" i kuchnię ${base.cuisine}. Istniejące wersje: ${variants.map(r => r.name).join('; ')}.` : ''}

ZASADY (wszystkie obowiązkowe):
1. Tylko prawdziwe, uznane dania tego regionu, opisane w wiarygodnych źródłach (książki kucharskie, instytucje kulinarne, duże serwisy kulinarne). Bez fusion i bez wymyślonych potraw. Każde danie zostanie sprawdzone w internecie; niepotwierdzone odpadną.
2. Wykonalne w domowej kuchni ze składników dostępnych w polskim supermarkecie. Zachowaj autentyczny charakter.
3. Ilości na 2 porcje, w jednostce produktu. Najpierw używaj istniejących produktów (lista niżej, format: id | nazwa | jednostka | alergeny | rodzaj). Nowy produkt dodaj w newProducts tylko gdy konieczny (najwyżej 3 na danie), z id w stylu katalogu (małe litery, bez myślników, ang. rdzeń, np. "gochujang"), jednostką z listy ${UNITS.join(', ')}, alergenami tylko z listy ${ctx.allergens.join(', ')} (deklaruj ostrożnie: produkty o zmiennym składzie dostają wszystkie typowe alergeny), rodzajem (${KINDS.join(', ')}; seafood = skorupiaki i mięczaki; animal = miód itp.), wartościami odżywczymi [kcal, białko, tłuszcz, węglowodany] na 100 g, unitGrams (gramy jednej jednostki, gdy jednostka nie jest g/ml) i nazwami w 7 językach.
4. Aplikacja oznacza wszystkie 14 alergenów UE, także skorupiaki (crustaceans), mięczaki (molluscs), orzeszki ziemne (peanuts), łubin (lupin) i siarczyny (sulphites: wino, ocet winny, suszone owoce siarkowane). Owoce morza mają rodzaj seafood. Dania z tymi składnikami są dozwolone, jeśli alergeny są oznaczone.
5. minutes: łączny czas z czasem biernym (pieczenie, duszenie, wyrastanie), liczba całkowita 5–180.
6. Kategoria: breakfast (śniadanie), snack (drugie śniadanie/przekąska), lunch (obiad), dinner (kolacja), dessert, starter. W regionie są już: ${JSON.stringify(cats)} — uzupełniaj najmniej liczne, ale nie na siłę.
7. Kroki: 3–8, tryb rozkazujący, pełne zdania zakończone kropką, z temperaturami i czasami; każdy składnik z listy jest w krokach; mięso i jajka zawsze dogotowane do bezpiecznej temperatury.
8. Teksty w językach ${LANGS.join(', ')}: naturalne, z kulinarną terminologią danego języka, tyle samo kroków co po polsku; ukraiński cyrylicą; zachowaj oryginalną nazwę potrawy tam, gdzie to przyjęte (np. „Bibimbap z wołowiną”). Nie używaj znaków < > " & ani podziałów wiersza; cudzysłowy typograficzne „ ” są dozwolone. photoAlt: opis zdjęcia gotowego dania, bez kropki na końcu, różny od innych.
9. emoji: jedna pasująca ikona jedzenia. id: slug polskiej nazwy (ASCII, myślniki).
10. Nie powtarzaj dań z katalogu. W tym regionie już są: ${inRegion.map(r => r.name).join('; ') || '(brak)'}.
Wszystkie nazwy w katalogu: ${ctx.recipes.map(r => r.name).join('; ')}.
${rejected.length ? `Wcześniej odrzucone (nie proponuj ponownie): ${rejected.join('; ')}.` : ''}

PRODUKTY:
${catalogBrief(ctx)}

Odpowiedz wyłącznie wywołaniem narzędzia submit_recipes.`;
}
function reviewPrompt(items, ctx) {
  const show = v => {
    const r = v.recipe, np = v.products;
    const ing = r.ingredients.map(i => { const p = np[i.product] ?? ctx.products[i.product]; return `${p[0]} ${i.amount} ${p[1]}`; }).join('; ');
    return `### ${r.id} — ${r.name} (kuchnia: ${r.cuisine}, kategoria: ${r.category}, ${r.minutes} min, 2 porcje${r.variantOf ? `, wariant ${r.variantOf}` : ''})
Składniki: ${ing}
Nowe produkty i alergeny: ${Object.entries(np).map(([id, p]) => `${p[0]} [${p[2].join(',') || 'brak'}]`).join('; ') || 'brak'}
Kroki: ${r.steps.map((s, k) => `${k + 1}. ${s}`).join(' ')}
Nazwa EN/UK: ${v.translations.en.recipe.name} / ${v.translations.uk.recipe.name}`;
  };
  return `Jesteś niezależnym weryfikatorem przepisów aplikacji „Co na talerz”. Dla KAŻDEGO dania poniżej użyj wyszukiwarki i sprawdź:
a) czy to prawdziwe, uznane danie podanego regionu (nie wymysł, nie fusion) — potwierdź co najmniej jednym wiarygodnym źródłem;
b) czy składniki, proporcje na 2 porcje, czas i kroki są zgodne z tradycyjnymi przepisami i dadzą jadalny wynik;
c) czy kroki są bezpieczne (dogotowanie mięsa, drobiu, jajek; brak niebezpiecznych technik);
d) czy nowe produkty mają wszystkie typowe alergeny z 14 alergenów UE (gluten, mleko, jaja, orzechy, orzeszki ziemne, ryby, skorupiaki, mięczaki, soja, seler, gorczyca, sezam, łubin, siarczyny);
e) redakcja: czy polski tekst jest poprawny językowo i stylistycznie (tryb rozkazujący, pełne zdania), a nazwy w innych językach naturalne i poprawne.
Odrzuć przy jakiejkolwiek wątpliwości. W sources podaj tylko adresy stron, które faktycznie pojawiły się w wynikach wyszukiwania. Na końcu wywołaj submit_review.

${items.map(show).join('\n\n')}`;
}

// ---------- zapis ----------
const HEAD_PL = `// Dania dodane przez bota „kucharz” (scripts/bots/chef.mjs). PLIK GENEROWANY — nie edytuj ręcznie.
// Każdy wpis przeszedł walidację (scripts/bots/chef-validate.mjs) i niezależną weryfikację ze źródłami.
// products: [nazwa, jednostka, alergeny]; kinds: plant|dairy|egg|meat|fish|animal (dieta liczona z nich);
// nutrition: [kcal, białko, tłuszcz, węglowodany] na 100 g; unitGrams: gramy jednej jednostki (nie g/ml).
`;
const headLang = l => `// Tłumaczenia dań bota „kucharz” (${l}). PLIK GENEROWANY — nie edytuj ręcznie (scripts/bots/chef.mjs).\n`;
export async function writeData(pl, langs) {
  await writeFile(SRC + 'recipes.bot.pl.js', HEAD_PL + 'export const data = ' + JSON.stringify(pl, null, 1) + ';\n');
  for (const l of LANGS.slice(1)) await writeFile(SRC + `recipes.bot.${l}.js`, headLang(l) + 'export const data = ' + JSON.stringify(langs[l], null, 1) + ';\n');
}
async function readReport() { try { return JSON.parse(await readFile(REPORT, 'utf8')); } catch { return { runs: [], rejected: [] }; } }

// ---------- główny przebieg ----------
// Jedna runda: jeden region (i ewentualnie warianty jednego dania), do 5 dań → walidacja → weryfikacja.
async function round(ctx, report, { region, n, base }) {
  const rejected = report.rejected.filter(x => x.region === region || (base && x.variantOf === base.id)).map(x => x.name).slice(-60);
  log(`runda: region ${region}, dań ${n}${base ? `, warianty: ${base.id}` : ''}`);
  const gen = async content => (await converse({ model: MODEL, max_tokens: 32000, tools: [SUBMIT], tool_choice: { type: 'tool', name: SUBMIT.name },
    messages: [{ role: 'user', content }] }, SUBMIT.name)).input.recipes ?? [];
  const candidates = await gen(generatorPrompt(ctx, region, n, base, rejected));
  const ok = [], bad = [], rejectedNow = [];
  const check = list => { for (const c of list) { const v = validateCandidate(c, { ...ctx, recipes: [...ctx.recipes, ...ok.map(o => o.recipe)] });
    if (v.ok) { if (typeof c.variantOf === 'string' && ctx.recipes.some(r => r.id === c.variantOf)) v.recipe.variantOf = c.variantOf; ok.push(v); } else bad.push({ c, errors: v.errors }); } };
  check(candidates);
  if (bad.length) {
    log(`poprawki: ${bad.length} rekordów z błędami walidacji`);
    const retry = bad.splice(0);
    const fixed = await gen(`Popraw poniższe rekordy tak, by spełniały wszystkie zasady (te same co wcześniej). Błędy walidatora podano przy każdym rekordzie. Zwróć poprawione rekordy przez submit_recipes; rekordy, których nie da się poprawić, pomiń.\n\nZasady:\n${generatorPrompt(ctx, region, retry.length, null, []).split('ZASADY (wszystkie obowiązkowe):')[1]}\n\nREKORDY:\n${retry.map(b => JSON.stringify(b.c) + '\nBŁĘDY: ' + b.errors.join('; ')).join('\n\n')}`);
    check(fixed);
    for (const b of [...retry.filter(r => !ok.some(o => o.recipe.id === r.c?.id)), ...bad]) rejectedNow.push({ name: b.c?.texts?.pl?.name ?? b.c?.id, region: b.c?.cuisine ?? region, variantOf: b.c?.variantOf, stage: 'walidacja', reasons: b.errors.slice(0, 6).join('; ') });
  }
  const accepted = [];
  if (ok.length) {
    const searched = new Set();
    const { input } = await converse({ model: REVIEW_MODEL, max_tokens: 8000,
      tools: [{ type: SEARCH_TOOL, name: 'web_search', max_uses: Math.min(20, 4 * ok.length) }, REVIEW],
      messages: [{ role: 'user', content: reviewPrompt(ok, ctx) }] }, REVIEW.name, searched);
    for (const v of ok) {
      const rv = (input.reviews ?? []).find(x => x.id === v.recipe.id);
      const sources = acceptedSources(rv?.sources, searched);
      if (rv?.verdict === 'accept' && sources.length) { v.recipe.sources = sources.slice(0, 4); accepted.push(v); }
      else rejectedNow.push({ name: v.recipe.name, region: v.recipe.cuisine, variantOf: v.recipe.variantOf, stage: 'weryfikacja', reasons: rv ? (rv.verdict === 'accept' ? 'brak źródła z wyników wyszukiwania' : rv.reasons) : 'brak werdyktu' });
    }
  }
  for (const a of accepted) log(`  + ${a.recipe.id} (${a.recipe.cuisine}) ← ${a.recipe.sources.join(' ')}`);
  for (const r of rejectedNow) log(`  − ${r.name} [${r.stage}]: ${r.reasons}`);
  report.runs.push({ at: new Date().toISOString(), region, variantsOf: base?.id ?? null, model: MODEL, reviewModel: REVIEW_MODEL, proposed: candidates.length, added: accepted.length, total: ctx.recipes.length + accepted.length, target: TARGET });
  report.rejected.push(...rejectedNow);
  return { accepted, rejectedNow };
}

// Raz na dobę (workflow bot-chef.yml): kilka rund, aż dojdzie RECIPE_BOT_DAILY dań (domyślnie 20),
// po osiągnięciu celu RECIPE_BOT_MAINTENANCE (domyślnie 4). Zapis po każdej rundzie — przerwany przebieg nie traci dań.
async function main() {
  const report = await readReport();
  let ctx = await loadContext();
  const start = ctx.recipes.length;
  const maintenance = start >= TARGET;
  if (!KEY) { console.log('::warning::Bot „kucharz”: brak sekretu ANTHROPIC_API_KEY — nic nie dodano (Settings → Secrets and variables → Actions).'); return 0; }
  const want = Number(arg('--batch') ?? (maintenance ? (process.env.RECIPE_BOT_MAINTENANCE || 4) : (process.env.RECIPE_BOT_DAILY || 20)));
  log(`katalog: ${start}/${TARGET}, dziś do dodania: ${want}`);
  const allAccepted = [], allRejected = [];
  let rounds = 0;
  while (allAccepted.length < want && rounds < Math.ceil(want / 5) + 3) {
    const region = arg('--region') ?? pickRegion(ctx.cuisines, ctx.recipes);
    // Warianty popularnego dania (pierogi z mięsem obok ruskich itd.) w pierwszej rundzie dnia.
    const variantCount = id => ctx.recipes.filter(r => r.variantOf === id).length;
    const bases = ctx.recipes.filter(r => !r.variantOf && variantCount(r.id) < 3 && r.category !== 'snack');
    const base = rounds === 0 && bases.length ? bases[Math.floor(Math.random() * bases.length)] : null;
    const n = Math.min(5, want - allAccepted.length);
    rounds++;
    let res;
    try { res = await round(ctx, report, { region, n, base }); }
    catch (e) { console.log(`::warning::Runda ${rounds} nieudana: ${e.message}`); if (rounds > 1 && /HTTP 4\d\d/.test(e.message)) break; continue; }
    allAccepted.push(...res.accepted); allRejected.push(...res.rejectedNow);
    if (res.accepted.length && !DRY) {
      const { pl, langs } = mergeAccepted(ctx.botPl, ctx.botLangs, res.accepted); await writeData(pl, langs);
      // Moduły ES są w pamięci podręcznej importu — kontekst uzupełniamy w miejscu, nie przez ponowny import.
      ctx = { ...ctx, botPl: pl, botLangs: langs, botKinds: pl.kinds, recipes: [...ctx.recipes, ...res.accepted.map(a => a.recipe)],
        products: { ...ctx.products, ...pl.products }, nutrition: { ...pl.nutrition, ...ctx.nutrition }, unitGrams: { ...pl.unitGrams, ...ctx.unitGrams },
        meat: [...new Set([...ctx.meat, ...Object.keys(pl.kinds).filter(id => pl.kinds[id] === 'meat')])] };
    }
  }
  report.runs = report.runs.slice(-400);
  report.rejected = report.rejected.slice(-800);
  report.updatedAt = new Date().toISOString();
  log(`dodane dziś: ${allAccepted.length}, odrzucone: ${allRejected.length}, katalog: ${start + allAccepted.length}`);
  if (DRY) { log('[na sucho] bez zapisu'); return 0; }
  await writeFile(REPORT, JSON.stringify(report, null, 1) + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `added=${allAccepted.length}\ntotal=${start + allAccepted.length}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `### Bot „kucharz”\nKatalog: **${start + allAccepted.length}** / ${TARGET}\n\n${allAccepted.map(a => `- ✅ ${a.recipe.name} (${a.recipe.cuisine})`).join('\n')}\n${allRejected.map(r => `- ❌ ${r.name} — ${r.stage}: ${r.reasons}`).join('\n')}\n`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().then(c => process.exit(c), e => { console.error(e); process.exit(1); });
