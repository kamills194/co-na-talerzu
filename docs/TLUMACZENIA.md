# Tłumaczenia aplikacji Co na talerz (CNT-030)

Język źródłowy to **polski**. Pełny słownik interfejsu jest w `apps/web/src/i18n.js` (`messages`),
pełny katalog przepisów i produktów w `apps/web/src/recipes.pl.js`. Każdy inny język to **dwa płaskie
pliki** w `apps/web/src/` (nie w podkatalogu: build kopiuje `src/` jako pliki, a test powłoki wymaga,
by każdy plik z `src/` był w `ASSETS` w `sw.js`).

Wszystkie języki są już zarejestrowane — w liście `languages` w `i18n.js` (kod, nazwa we własnym
języku, locale, kierunek pisma) i w `ASSETS` w `sw.js`:

| Kod | Nazwa w wybieraczu | Locale (daty, liczby) | Pliki |
|---|---|---|---|
| `pl` | Polski | `pl-PL` | `i18n.js`, `recipes.pl.js` (źródło) |
| `en` | English | `en-GB` | `i18n.en.js`, `recipes.en.js` (gotowe, 100%) |
| `de` | Deutsch | `de-DE` | `i18n.de.js`, `recipes.de.js` |
| `uk` | Українська | `uk-UA` | `i18n.uk.js`, `recipes.uk.js` |
| `fr` | Français | `fr-FR` | `i18n.fr.js`, `recipes.fr.js` |
| `da` | Dansk | `da-DK` | `i18n.da.js`, `recipes.da.js` |
| `es` | Español | `es-ES` | `i18n.es.js`, `recipes.es.js` |
| `it` | Italiano | `it-IT` | `i18n.it.js`, `recipes.it.js` |

**Tłumacz danego języka zmienia wyłącznie treść swoich dwóch plików.** Nie edytuje `i18n.js`,
`recipes.pl.js`, `sw.js`, `app.js`, testów ani plików innych języków. Pliki zastępcze eksportują puste
obiekty — wtedy cała aplikacja w tym języku pokazuje polskie teksty.

## Format plików

### `apps/web/src/i18n.<kod>.js` — interfejs

```js
export const messages = {
  recipes:'Rezepte', favorites:'Favoriten',
  promo_one:'{n} Zutat im Angebot', promo_other:'{n} Zutaten im Angebot',
  unitSlice_one:'Scheibe', unitSlice_other:'Scheiben',
  // …
};
```

- Klucze **dokładnie takie jak w `messages` w `i18n.js`**. Nie dodawaj nowych kluczy.
- Wartość: niepusty tekst. Etykiety kategorii, alergenów, diet i kuchni oraz jednostki ilości są
  zwykłymi kluczami tego słownika (`breakfast`, `gluten`, `vegan`, `italian`, `unitTsp_…`, …).
- Dozwolone: zwykłe znaki, typograficzne cudzysłowy („ ” « » „ “), apostrof `'` (w JS zapisz jako
  `’` albo `\'`). **Niedozwolone: `<`, `>`, `"`, `&`** — teksty trafiają do HTML i atrybutów.
- `\n` występuje tylko tam, gdzie w polskim (np. `heroTitle`, `heroArtNote`) — tyle samo podziałów.
- Nazwa marki „Co na talerz” zostaje bez zmian (np. w `docTitle`, `brandHome`, `footerText`).
- `language` to słowo „Język” w Twoim języku; etykieta wybieracza to „<słowo> / Language”.

### `apps/web/src/recipes.<kod>.js` — przepisy i produkty

```js
export const recipes = {
  'owsianka':{ name:'…', steps:['…','…','…'], photoAlt:'…' },
  // klucz = id przepisu z recipes.pl.js (dokładnie, także 'twarożek' z polską literą)
};
export const products = {
  oats:'…', milk:'…',
  // klucz = id produktu z recipes.pl.js
};
```

- Tylko pola `name`, `steps`, `photoAlt` (w przepisie) i nazwa (w produkcie). **Nigdy** ilości,
  jednostek, czasu, porcji, alergenów, flag (`vegan`, `vegetarian`), kategorii, kuchni, emoji ani id.
- `steps` ma **tyle samo kroków co po polsku**, w tej samej kolejności. Przepis z inną liczbą kroków
  pokaże polskie kroki (aplikacja nie miesza języków w jednym przepisie).
- Ilości wyświetla aplikacja na liście składników; w krokach zachowaj liczby, temperatury i czasy
  z polskiego tekstu (np. „200°C”, „10 minut”, „około 2 cm”, „200 ml wody”) — bez przeliczania jednostek.
- Nazwy dań: przyjęta nazwa w danym języku albo krótki opis. Nazwy własne (Strammer Max, Tamagoyaki,
  Croque-monsieur, Rote Grütze…) zostaw i w razie potrzeby dodaj objaśnienie po myślniku. Dla polskich
  potraw bez odpowiednika użyj nazwy z objaśnieniem, np. „Potatoes in their jackets with gzik (quark,
  radish & chive spread)”. Nie zamieniaj polskiego dania na „podobne”, ale inne danie.
- Produkty: nazwa w mianowniku, z dookreśleniem jak w polskim (np. „z puszki, odsączona”, „18%”).
  `cheese` to polski twaróg (biały ser twarogowy), `yellowcheese` to ser żółty, `pepper` to świeża
  papryka, `blackpepper` — pieprz czarny mielony, `paprika` — papryka słodka mielona.
- `photoAlt` opisuje to, co widać na zdjęciu dania (krótko, bez „zdjęcie przedstawia”).

## Liczba mnoga i placeholdery

- Komunikaty z liczbą mają przyrostki kategorii CLDR: `_zero _one _two _few _many _other`. Aplikacja
  wybiera formę przez `Intl.PluralRules(<locale języka>)`. Podaj **wszystkie kategorie Twojego
  języka** i zawsze `_other`. Kategorie sprawdzisz w Node:
  `node -e "console.log(new Intl.PluralRules('uk-UA').resolvedOptions().pluralCategories)"`
  (Node 22: pl i uk — `one few many other`; en, de, da — `one other`; fr, es, it — `one many other`,
  gdzie `many` dotyczy dużych okrągłych liczb, np. 1 000 000, i zwykle brzmi jak `_other`).
  Forma, której język nie ma, jest błędem w teście.
- Klucze liczby mnogiej: `promo_*` (liczba składników w promocji na karcie), `verifiedOffers_*`
  (liczba ofert bota), `storeDeals_*` (liczba promocji sklepu na kafelku i w oknie sklepu, CNT-041), jednostki `unitPiece_* unitTsp_* unitSlice_* unitClove_* unitBunch_*
  unitPinch_* unitPot_*`. `unitG` i `unitMl` nie mają form.
- Ilości bywają ułamkowe (0,5 pęczka). Ułamki zwykle trafiają do kategorii `other` (w polskim
  „0,5 łyżeczki”, w angielskim „0.5 tsp”). Jednostki to tylko słowo — liczbę wstawia aplikacja.
- `{n}` to liczba sformatowana według locale (np. „1 200” / „1,200”). Placeholdery (`{n}` i ewentualne
  `${…}`) muszą być **identyczne jak w polskim** — możesz zmienić ich miejsce w zdaniu, nie nazwę.

## Co nie może się zmienić

- Identyfikatory przepisów i produktów, klucze słownika, klucz `localStorage` (`co-na-talerz:v1`).
- Rynek sklepów: Polska, waluta PLN, strefa Europe/Warsaw — niezależnie od języka (CNT-018). Ceny
  są w PLN także po angielsku („PLN 3.50”); daty i liczby w formacie języka.
- Teksty ofert ze sklepu (nazwa produktu ALDI, jednostka ceny, warunki) są danymi źródła i zostają
  po polsku.
- Interfejs nie przełącza się sam na język przeglądarki: domyślny jest polski, a język przeglądarki
  jest tylko podpowiedzią (przycisk obok wybieracza) do pierwszego wyboru użytkownika.

## Jak działa w aplikacji

- `setLanguage(kod)` w `i18n.js` ładuje oba pliki przez dynamiczne `import()` (są w pamięci offline,
  więc działa bez sieci), odrzuca nieznane klucze/id i niepełne wpisy, ustawia `language` i `locale`.
- Brakujący lub odrzucony tekst → polski, bez komunikatu dla użytkownika. Polski tekst nazwy
  przepisu i kroków w innym języku ma atrybut `lang="pl"` (czytniki ekranu).
- Wybór zapisuje się w `settings.language` (opcjonalne; stare dane bez tego pola działają).
  `<html lang>` i `dir`, tytuł strony i teksty nagłówka/stopki zmieniają się od razu.
- Wyszukiwarka dopasowuje nazwy przepisów i składników w wybranym języku **i** po polsku.

## Lista kontrolna tłumacza

1. Skopiuj klucze z `messages` w `i18n.js` do `i18n.<kod>.js` i przetłumacz wszystkie.
2. Dla kluczy z `_one/_few/…` wpisz dokładnie kategorie swojego języka (+ `_other`).
3. Sprawdź `{n}` i podziały `\n`; usuń znaki `< > " &`.
4. Dla każdego z 70 przepisów: `name`, `steps` (ta sama liczba), `photoAlt`; dla każdego produktu nazwa.
5. Zachowaj liczby, temperatury i czasy z polskich kroków; nie dopisuj ilości ani alergenów.
6. Nie zmieniaj żadnego innego pliku.
7. Uruchom walidację (niżej) i obejrzyj ekrany: katalog, szczegóły przepisu, lista zakupów, promocje,
   szerokość 320 px (długie słowa nie mogą powodować przewijania w poziomie).
8. W opisie zmiany zaznacz, czy tłumaczenie sprawdził rodzimy użytkownik języka.

## Walidacja

Z katalogu głównego repozytorium:

```
npm test          # m.in. apps/web/tests/i18n.test.mjs
npm run build
```

`tests/i18n.test.mjs` dla każdego pliku językowego sprawdza: (a) brak kluczy spoza polskiego słownika
i poprawne formy liczby mnogiej, (b) zgodność placeholderów i brak znaków HTML, (c) istnienie id
przepisów i tę samą liczbę kroków, (d) istnienie id produktów, oraz że plik zawiera wyłącznie tekst.
Dla `en` wymaga 100% kluczy, przepisów i produktów. Szybki podgląd pokrycia języka:

```
cd apps/web && node -e "const c='de';Promise.all([import('./src/i18n.js'),import('./src/i18n.'+c+'.js'),import('./src/recipes.'+c+'.js'),import('./src/recipes.pl.js')]).then(([b,u,r,p])=>console.log('UI',Object.keys(u.messages).length+'/'+Object.keys(b.messages).length,'przepisy',Object.keys(r.recipes).length+'/'+p.recipes.length,'produkty',Object.keys(r.products).length+'/'+Object.keys(p.products).length))"
```

Podgląd w przeglądarce: `npm run build`, potem w `apps/web`: `PORT=5180 node scripts/serve.mjs --dist`
i wybór języka w nagłówku („Język / Language”).
