// Polish is the source language (CNT-030): `messages` below is the complete source dictionary and
// recipes.pl.js the source catalog. Other languages live in flat files next to this one:
//   i18n.<code>.js     export const messages = { <key>: '<text>' }          (same keys as Polish)
//   recipes.<code>.js  export const recipes  = { <recipeId>: { name, steps:[...], photoAlt } }
//                      export const products = { <productId>: '<name>' }
// They are loaded lazily by setLanguage(); every missing or invalid entry silently falls back to Polish.
// Plural messages use CLDR suffixes (`_zero _one _two _few _many _other`, Intl.PluralRules of the UI
// locale); `{n}` is replaced by the formatted number. Format and rules: docs/TLUMACZENIA.md.
import { recipes as sourceRecipes, products as sourceProducts } from './recipes.pl.js';
export const messages = {
  recipes:'Przepisy', favorites:'Ulubione', shopping:'Lista zakupów', offers:'Promocje',
  privacyErrors:'Jeśli na stronie wystąpi błąd techniczny, wysyłamy jego anonimowy opis (komunikat, plik, przeglądarka), żeby go naprawić. Nie zawiera on Twoich ulubionych, zakupów ani wpisów.',
  app:'Aplikacja', appEyebrow:'APLIKACJA MOBILNA', appTitle:'Co na talerz w Twoim telefonie', appText:'Dodaj aplikację do ekranu głównego. Działa jak zwykła aplikacja, także bez internetu, i nie wymaga sklepu z aplikacjami.', appInstall:'Zainstaluj aplikację', appInstalled:'Aplikacja jest już zainstalowana na tym urządzeniu.', appInstallDone:'Gotowe! Ikona Co na talerz jest na ekranie głównym.', appOpenOnPhone:'Otwórz adres conatalerz.pl na telefonie i wykonaj kroki dla swojego systemu.', appYourDevice:'Twoje urządzenie', appBenefitsTitle:'Co zyskujesz', appBenefit1:'Ikonę na ekranie głównym i pełny ekran bez paska przeglądarki.', appBenefit2:'Przepisy, ulubione i lista zakupów działają bez internetu.', appBenefit3:'Bez konta i pobierania ze sklepu — dane zostają na telefonie.', appBenefit4:'Aktualizacje instalują się same.', appAndroidTitle:'Android', appAndroidBrowser:'W przeglądarce Chrome', appAndroid1:'Otwórz conatalerz.pl w przeglądarce Chrome.', appAndroid2:'Stuknij menu ⋮ w prawym górnym rogu.', appAndroid3:'Wybierz „Zainstaluj aplikację” albo „Dodaj do ekranu głównego”.', appAndroid4:'Potwierdź przyciskiem „Zainstaluj”. Ikona pojawi się na ekranie głównym.', appIosTitle:'iPhone i iPad', appIosBrowser:'W przeglądarce Safari', appIos1:'Otwórz conatalerz.pl w Safari.', appIos2:'Stuknij przycisk Udostępnij — kwadrat ze strzałką w górę.', appIos3:'Przewiń listę i wybierz „Do ekranu początkowego”.', appIos4:'Stuknij „Dodaj”. Ikona pojawi się na ekranie początkowym.', appIosNote:'Od iOS 16.4 aplikację można dodać w ten sam sposób także z Chrome i innych przeglądarek.',
  all:'Wszystkie', breakfast:'Śniadania', snack:'Drugie śniadania', lunch:'Obiady', dinner:'Kolacje', dessert:'Desery', starter:'Przystawki',
  anyDiet:'Bez preferencji', vegetarian:'Wegetariańska', vegan:'Wegańska',
  gluten:'Gluten', milk:'Mleko', eggs:'Jaja', nuts:'Orzechy', fish:'Ryby', soy:'Soja', celery:'Seler', mustard:'Gorczyca', sesame:'Sezam',
  heroLabel:'CODZIENNA KUCHNIA, MAŁE PRZYJEMNOŚCI', heroTitle:'Dziś coś dobrego.\nPo prostu, po domowemu.', heroText:'Znane składniki. Proste kroki. Pomysł na każdy apetyt.',
  surprise:'Zaskocz mnie', surpriseText:'Wybierz, na co masz ochotę. My znajdziemy pomysł.', meal:'Rodzaj posiłku', time:'Maksymalny czas', diet:'Dieta', exclude:'Wyklucz składniki', search:'Szukaj przepisu lub składnika', searchPlaceholder:'Np. pomidorowa, ziemniaki, jabłko…',
  noLimit:'Bez limitu', minutes:'min', noResults:'Nie ma przepisów pasujących do tych filtrów.', reset:'Wyczyść filtry', found:'Pomysły na domowy posiłek', result:'Propozycja dla Ciebie',
  addFavorite:'Dodaj do ulubionych', removeFavorite:'Usuń z ulubionych', emptyFavorites:'Zapisz przepisy serduszkiem — będą tutaj czekać.',
  portions:'Porcje', ingredients:'Składniki', steps:'Przygotowanie', allergens:'Alergeny', noAllergens:'Brak oznaczonych alergenów', allergenNote:'Sprawdź etykiety produktów i możliwe śladowe ilości alergenów. Filtry opierają się na składnikach przepisu.',
  addShopping:'Dodaj składniki do listy', added:'Składniki dodane do listy zakupów.', close:'Zamknij', easy:'Prosty przepis',
  shoppingTitle:'Zakupy bez zapominania', shoppingText:'Składniki z różnych przepisów łączymy w jedną listę.', emptyShopping:'Twoja lista jest pusta. Dodaj składniki z wybranego przepisu.', customItem:'Własny produkt', add:'Dodaj', remove:'Usuń', clearDone:'Usuń kupione', copy:'Kopiuj listę', copied:'Lista skopiowana.', copyFailed:'Kopiowanie niedostępne w tej przeglądarce.',
  offersTitle:'Gotuj z tego, co w promocji', offersText:'Oferty ze źródeł sklepowych i Twoje notatki z gazetek. Podpowiemy pasujące przepisy.', offersNotice:'Bot odczytuje publiczne dane ALDI ze strony ogólnopolskiej. Nie gwarantujemy dostępności produktu w Twoim sklepie. Terminy liczymy według czasu w Polsce. Sprawdź jednostkę ceny, termin i warunki w źródle. Własne wpisy poniżej są Twoimi notatkami.', product:'Produkt z przepisu', store:'Sklep', price:'Cena za opakowanie', until:'Ważna do', source:'Źródło (link lub opis gazetki)', offerAdd:'Zapisz ofertę', emptyOffers:'Nie masz zapisanych ofert. Dodaj pierwszą powyżej.', expired:'Oferta wygasła', matched:'Przepisy z tym składnikiem', invalidOffer:'Uzupełnij poprawnie wszystkie pola oferty.', offerSaved:'Zapisano ofertę.',
  botTitle:'Oferty od bota', botDescription:'Bot uruchamiany na komputerze pobiera datowane oferty ALDI. Pokazujemy tylko trwające promocje dopasowane do składników. Cen nie używamy do wyliczania kosztu dania.', botEmpty:'Brak potwierdzonych aktualnych ofert. Uruchom bota, aby odświeżyć dane.', verifiedOffers_one:'{n} oferta odczytana ze źródła sklepowego', verifiedOffers_few:'{n} oferty odczytane ze źródła sklepowego', verifiedOffers_many:'{n} ofert odczytanych ze źródła sklepowego', verifiedOffers_other:'{n} oferty odczytanej ze źródła sklepowego', fetched:'Odczyt', validFrom:'Ważna od', conditionsLabel:'Warunki', conditionsUser:'sprawdź w źródle', currencyLabel:'Waluta', unitPackage:'opakowanie',
  excludeProducts:'Pomiń konkretne produkty', allergensLabel:'Wyklucz alergeny',
  privacyTitle:'Twoje dane zostają u Ciebie', privacyText:'Ulubione, zakupy i wpisane oferty zapisujemy tylko w pamięci tej przeglądarki. Nie ma kont, analityki ani synchronizacji. Wyczyszczenie danych przeglądarki usuwa te wpisy. Zapisz kopię, aby przenieść je na inne urządzenie.', export:'Pobierz kopię danych', import:'Wczytaj kopię danych', importNote:'Wczytanie kopii zastępuje lokalne ulubione, zakupy i oferty.', imported:'Wczytano kopię danych.', invalidBackup:'Nieprawidłowy plik kopii danych.', storageError:'Nie udało się zapisać danych. Pamięć przeglądarki może być niedostępna lub pełna.', noMatches:'Brak pasującego przepisu. Zmień filtry i spróbuj ponownie.', savedCount:'Zapisane przepisy', offline:'Działa także offline po pierwszym otwarciu.', importLabel:'Plik kopii danych',
  eyebrowIdea:'POMYSŁ NA DZIŚ', eyebrowCollection:'TWOJA KOLEKCJA', eyebrowShopping:'Z KUCHNI DO SKLEPU', heroArtCaption:'smakuje jak w domu', heroArtNote:'odrobina inspiracji\nna każdy dzień',
  browseRecipes:'Przeglądaj przepisy', photoCredit:'Zdjęcie', photoLicense:'Licencja', photoChanges:'Zmiany',
  offlineNotice:'Jesteś offline. Przepisy, ulubione i lista zakupów działają dalej na tym urządzeniu.', offlineOffers:'Jesteś offline. Oferty ze sklepów wymagają połączenia z siecią — teraz ich nie pobierzemy. Twoje zapisane notatki o ofertach są nadal dostępne. Po odzyskaniu połączenia otwórz aplikację ponownie, aby odświeżyć oferty.', backOnline:'Znów jesteś online.',
  cuisine:'Kuchnia', allCuisines:'Wszystkie kuchnie', polish:'Polska', italian:'Włoska', german:'Niemiecka', french:'Francuska', japanese:'Japońska', cuisineCount:'Liczba przepisów',
  pescatarian:'Z rybami, bez mięsa', glutenFree:'Bezglutenowa', dairyFree:'Bez nabiału', highProtein:'Wysokobiałkowa', lowCarb:'Niskowęglowodanowa', light:'Lekka (mniej kalorii)',
  nutritionTitle:'Wartości odżywcze na porcję (szacunkowo)', nutritionEnergy:'Energia', nutritionProtein:'Białko', nutritionFat:'Tłuszcz', nutritionCarbs:'Węglowodany', kcal:'kcal', grams:'g',
  nutritionNote:'Szacunek z ogólnych tabel składu żywności dla typowych produktów, nie z etykiet. Rzeczywiste wartości zależą od marki i wielkości produktów.', nutritionMissing:'Brak pełnych danych o wartościach odżywczych tego przepisu.', showNutrition:'Pokazuj kalorie', approxKcal:'około',
  sortLabel:'Kolejność', sortDefault:'Domyślna', sortPromotions:'Najwięcej składników w promocji', sortNoOffers:'Brak aktualnych promocji — kolejność bez zmian',
  promo_one:'{n} składnik w promocji', promo_few:'{n} składniki w promocji', promo_many:'{n} składników w promocji', promo_other:'{n} składnika w promocji',
  promoUntil:'do', promoLink:'Zobacz promocję', promoNewTab:'(otwiera się w nowej karcie)',
  reroll:'Wylosuj inne', rerollSingle:'To jedyny przepis pasujący do wybranych filtrów.', sortPromotionsShort:'Promocje najpierw',
  // CNT-030: page shell (index.html is filled from here), offers eyebrow, language picker.
  docTitle:'Co na talerz — domowe pomysły', docDescription:'Proste domowe przepisy, pomysły na posiłki i Twoja lista zakupów.', skipLink:'Przejdź do treści',
  brandHome:'Co na talerz, strona główna', brandTagline:'dobrze, prosto, po domowemu', navLabel:'Główna nawigacja', footerText:'Co na talerz · Twoja domowa kuchnia', privacyButton:'Dane i kopia zapasowa',
  eyebrowOffers:'MNIEJ WYDAJESZ, DOBRZE JESZ', language:'Język',
  // Units of recipe amounts. Keys follow the stored unit (UNIT_KEYS below); the stored value itself never changes.
  unitG:'g', unitMl:'ml', unitPiece_other:'szt.',
  unitTsp_one:'łyżeczka', unitTsp_few:'łyżeczki', unitTsp_many:'łyżeczek', unitTsp_other:'łyżeczki',
  unitSlice_one:'kromka', unitSlice_few:'kromki', unitSlice_many:'kromek', unitSlice_other:'kromki',
  unitClove_one:'ząbek', unitClove_few:'ząbki', unitClove_many:'ząbków', unitClove_other:'ząbka',
  unitBunch_one:'pęczek', unitBunch_few:'pęczki', unitBunch_many:'pęczków', unitBunch_other:'pęczka',
  unitPinch_one:'szczypta', unitPinch_few:'szczypty', unitPinch_many:'szczypt', unitPinch_other:'szczypty',
  unitPot_one:'doniczka', unitPot_few:'doniczki', unitPot_many:'doniczek', unitPot_other:'doniczki',
  // CNT-034: time ranges, cuisine names on cards, servings stepper, exclusion search, allergen groups, reset.
  prepTime:'Czas przygotowania', timeUpTo:'Do {n} min', timeOver:'Powyżej {n} min', polishCuisine:'Kuchnia polska', italianCuisine:'Kuchnia włoska', germanCuisine:'Kuchnia niemiecka',
  frenchCuisine:'Kuchnia francuska', japaneseCuisine:'Kuchnia japońska', servingsDecrease:'Zmniejsz liczbę porcji', servingsIncrease:'Zwiększ liczbę porcji', servingsInvalid:'Wpisz liczbę od 1 do 20.', excludeSearch:'Wyklucz produkt',
  excludeSearchPlaceholder:'Wpisz nazwę, np. cebula', excludeNoMatch:'Nie ma takiego produktu w przepisach.', excludeHelp:'Strzałki w górę i w dół wybierają, Enter dodaje, Esc zamyka.', excludedAdded:'Wykluczono: {name}', excludedRemoved:'Przywrócono: {name}', removeExclusion:'Usuń wykluczenie',
  excludedSummary:'Wykluczone', clearExclusions:'Wyczyść', clearExclusionsLabel:'Wyczyść wszystkie wykluczenia', allergenExamples:'np. {list}', allergenNone:'brak w obecnych przepisach', filtersCleared:'Wyczyszczono wszystkie filtry.',
  servingsCount_one:'{n} porcja', servingsCount_few:'{n} porcje', servingsCount_many:'{n} porcji', servingsCount_other:'{n} porcji', suggestions_one:'{n} podpowiedź', suggestions_few:'{n} podpowiedzi',
  suggestions_many:'{n} podpowiedzi', suggestions_other:'{n} podpowiedzi',
  themeLabel:'Motyw', themeLight:'Jasny', themeDark:'Ciemny',
  // CNT-039: time in hours (above 60 min), products on promotion listed on the card, new cuisines (labels ready before data).
  hours:'h', promoOn:'W promocji: {list}',
  indian:'Indyjska', mexican:'Meksykańska', american:'Amerykańska', mediterranean:'Śródziemnomorska', asian:'Azjatycka',
  indianCuisine:'Kuchnia indyjska', mexicanCuisine:'Kuchnia meksykańska', americanCuisine:'Kuchnia amerykańska', mediterraneanCuisine:'Kuchnia śródziemnomorska', asianCuisine:'Kuchnia azjatycka',
  // CNT-041: kafelki sklepów i okno promocji sklepu podzielone na kategorie.
  storesTitle:'Sklepy i gazetki', storesText:'Promocje ALDI zobaczysz tutaj, podzielone na kategorie. Pozostałe sieci publikują gazetki na swoich stronach — kafelek otwiera je w nowej karcie.', storeDeals_one:'{n} promocja w aplikacji', storeDeals_few:'{n} promocje w aplikacji', storeDeals_many:'{n} promocji w aplikacji', storeDeals_other:'{n} promocji w aplikacji', storeLeaflet:'Gazetka', storeLeafletOf:'Gazetka {store}', storeDealsTitle:'Promocje {store}', storeNoDeals:'Brak aktualnych promocji tego sklepu w aplikacji. Sprawdź gazetkę.', storeSeeProduct:'Zobacz w {store}', storeDealsNote:'Ceny i warunki pochodzą ze strony sklepu. Przed zakupem sprawdź jednostkę ceny i warunki.',
};
export const categories = ['breakfast','snack','lunch','dinner','dessert','starter'];
export const allergens = ['gluten','milk','eggs','nuts','fish','soy','celery','mustard','sesame'];
// Ordered cuisine tabs. A recipe without `cuisine` counts as 'polish'.
export const cuisines = ['polish','italian','german','french','japanese','indian','mexican','american','mediterranean','asian'];


// Stored product unit (recipes.pl.js) → message key. Keys ending in a plural form are looked up with tn().
export const UNIT_KEYS = Object.freeze({ 'g':'unitG', 'ml':'unitMl', 'szt.':'unitPiece', 'łyżeczka':'unitTsp', 'kromka':'unitSlice', 'ząbek':'unitClove', 'pęczek':'unitBunch', 'szczypta':'unitPinch', 'doniczka':'unitPot' });

// ---------- CNT-030: language layer ----------
// Every language is pre-registered here, so adding one means only filling its two files.
// `locale` formats dates and numbers; prices keep the currency of the store market (CNT-018). `keepCase`: the
// language capitalises nouns, so ingredient lists on cards are not lower-cased. `flag` (CNT-039): emoji flag shown
// before the native name in the picker options (the header badge draws an SVG flag instead).
export const SOURCE_LANGUAGE = 'pl';
export const languages = Object.freeze([
  { code:'pl', flag:'🇵🇱', name:'Polski', locale:'pl-PL', dir:'ltr' },
  { code:'en', flag:'🇬🇧', name:'English', locale:'en-GB', dir:'ltr' },
  { code:'de', flag:'🇩🇪', name:'Deutsch', locale:'de-DE', dir:'ltr', keepCase:true },
  { code:'uk', flag:'🇺🇦', name:'Українська', locale:'uk-UA', dir:'ltr' },
  { code:'fr', flag:'🇫🇷', name:'Français', locale:'fr-FR', dir:'ltr' },
  { code:'da', flag:'🇩🇰', name:'Dansk', locale:'da-DK', dir:'ltr' },
  { code:'es', flag:'🇪🇸', name:'Español', locale:'es-ES', dir:'ltr' },
  { code:'it', flag:'🇮🇹', name:'Italiano', locale:'it-IT', dir:'ltr' },
].map(Object.freeze));
export const languageCodes = Object.freeze(languages.map(l => l.code));
export const languageInfo = (code = language) => languages.find(l => l.code === code) || languages[0];
// Live bindings: importers always see the current UI language and its locale.
export let language = SOURCE_LANGUAGE;
export let locale = languageInfo(SOURCE_LANGUAGE).locale;
const empty = () => ({ messages:{}, recipes:{}, products:{} });
let active = empty();

export const PLURAL_SUFFIX = /^(.+)_(zero|one|two|few|many|other)$/;
const pluralBases = new Set(Object.keys(messages).map(k => k.match(PLURAL_SUFFIX)?.[1]).filter(Boolean));
// A translation may use any key of the Polish dictionary, or any plural form of a Polish plural key.
export function isKnownKey(key) { if (Object.hasOwn(messages, key)) return true; const m = PLURAL_SUFFIX.exec(key); return !!m && pluralBases.has(m[1]); }
const text = v => typeof v === 'string' && v.trim() !== '';

export function t(key) {
  if (!Object.hasOwn(messages, key)) throw new Error(`Missing translation: ${key}`);
  return Object.hasOwn(active.messages, key) ? active.messages[key] : messages[key];
}
const pluralRules = new Map();
const rulesFor = loc => { if (!pluralRules.has(loc)) pluralRules.set(loc, new Intl.PluralRules(loc)); return pluralRules.get(loc); };
export const formatNumber = (n, loc = locale) => new Intl.NumberFormat(loc, { maximumFractionDigits:2 }).format(n);
export const format = (s, params = {}) => String(s).replace(/\{(\w+)\}/g, (m, k) => Object.hasOwn(params, k) ? String(params[k]) : m);
// Plural message: `<base>_<CLDR category>` of the UI language, then its `<base>_other`, then the same in Polish.
export function tn(base, n, params = {}) {
  const pick = (dict, loc) => { const k = `${base}_${rulesFor(loc).select(n)}`; return Object.hasOwn(dict, k) ? dict[k] : Object.hasOwn(dict, `${base}_other`) ? dict[`${base}_other`] : undefined; };
  const s = pick(active.messages, locale) ?? pick(messages, languageInfo(SOURCE_LANGUAGE).locale);
  if (s === undefined) throw new Error(`Missing plural translation: ${base}`);
  return format(s, { n:formatNumber(n), ...params });
}
// Unit label for an amount, e.g. unitLabel('kromka', 2) → 'kromki' (pl) / 'slices' (en). Unknown units are returned unchanged.
export function unitLabel(unit, n) { const key = UNIT_KEYS[unit]; if (!key) return unit; return Object.hasOwn(messages, key) ? t(key) : tn(key, n); }

// Recipe and product texts. Only text is translated; ids, amounts, allergens and flags come from recipes.pl.js.
const sourceById = new Map(sourceRecipes.map(r => [r.id, r]));
export function productName(id) { return Object.hasOwn(active.products, id) ? active.products[id] : sourceProducts[id]?.[0]; }
export function hasProductName(id) { return Object.hasOwn(active.products, id); }
export function hasRecipeText(id, field) { return Object.hasOwn(active.recipes, id) && active.recipes[id][field] !== undefined; }
const localized = new WeakMap();
// Copy of a recipe with name, steps and photoAlt in the UI language (each falls back to Polish separately).
export function localizeRecipe(r) {
  const tr = r && Object.hasOwn(active.recipes, r.id) ? active.recipes[r.id] : null;
  if (!tr) return r;
  const hit = localized.get(r);
  if (hit && hit.tr === tr) return hit.copy;
  const copy = Object.freeze({ ...r, name:tr.name ?? r.name, steps:tr.steps ?? r.steps, photoAlt:tr.photoAlt ?? r.photoAlt });
  localized.set(r, { tr, copy });
  return copy;
}

// Keeps only text for known keys/ids; a recipe's steps are used only when there are exactly as many as in Polish.
export function cleanMessages(src) { const out = {}; for (const [k, v] of Object.entries(src && typeof src === 'object' ? src : {})) if (isKnownKey(k) && text(v)) out[k] = v; return out; }
export function cleanRecipes(src) {
  const out = {};
  for (const [id, tr] of Object.entries(src && typeof src === 'object' ? src : {})) {
    const pl = sourceById.get(id); if (!pl || !tr || typeof tr !== 'object') continue;
    const r = {};
    if (text(tr.name)) r.name = tr.name;
    if (text(tr.photoAlt)) r.photoAlt = tr.photoAlt;
    if (Array.isArray(tr.steps) && tr.steps.length === pl.steps.length && tr.steps.every(text)) r.steps = Object.freeze([...tr.steps]);
    if (Object.keys(r).length) out[id] = Object.freeze(r);
  }
  return out;
}
export function cleanProducts(src) { const out = {}; for (const [id, v] of Object.entries(src && typeof src === 'object' ? src : {})) if (Object.hasOwn(sourceProducts, id) && text(v)) out[id] = v; return out; }

// Loads `code` (dynamic import; the files are in the offline cache) and makes it current. An unknown code
// selects Polish. If the files cannot be loaded the UI stays Polish and the result is false. When calls
// overlap, the last one wins.
let request = 0;
export async function setLanguage(code) {
  const info = languageInfo(code), mine = ++request;
  let next = empty();
  if (info.code !== SOURCE_LANGUAGE) {
    try {
      const [ui, rc] = await Promise.all([import(`./i18n.${info.code}.js`), import(`./recipes.${info.code}.js`)]);
      next = { messages:cleanMessages(ui.messages), recipes:cleanRecipes(rc.recipes), products:cleanProducts(rc.products) };
    } catch { if (mine === request) { active = empty(); language = SOURCE_LANGUAGE; locale = languageInfo(SOURCE_LANGUAGE).locale; } return false; }
  }
  if (mine !== request) return false;
  active = next; language = info.code; locale = info.locale;
  return info.code === code;
}
// First supported non-Polish language from the browser preferences, or null. Only a suggestion: the UI
// stays Polish until the user picks a language.
export function suggestLanguage(preferred = []) {
  for (const tag of Array.isArray(preferred) ? preferred : []) {
    const code = String(tag).toLowerCase().split('-')[0];
    if (code === SOURCE_LANGUAGE) return null;
    if (languageCodes.includes(code)) return code;
  }
  return null;
}
