# Porównanie Site v7 z MVP i plan migracji danych (CNT-011)

Stan na 16 listopada 2026. Baza repo: main `5c4dad6`. Dokument analityczny —
nie zmienia kodu aplikacji, nie uruchamia migracji i nie rozstrzyga wyboru backendu.

Oznaczenia użyte w całym dokumencie:

- **[plik]** — odczytane bezpośrednio z plików archiwum lub repo;
- **[wniosek]** — interpretacja autora analizy, do potwierdzenia;
- **[nieznane]** — nie da się ustalić z samego archiwum.

## 0. Najważniejsze ustalenia

1. Site v7 to osobna, znacznie większa aplikacja (0.6.0) z backendem typu Worker,
   bazą SQLite/D1, magazynem zdjęć R2, logowaniem i publikacjami społeczności. MVP
   (0.1.0) jest lokalną PWA bez serwera. **[plik]**
2. Katalog Site: 120 rekordów = 30 pełnych przepisów lokalnych + 90 odnośników
   katalogowych TheMealDB bez kroków, czasu i porcji. Katalog MVP: 18 pełnych
   przepisów. **[plik]**
3. Dane użytkownika w obu aplikacjach są lokalne i **niezgodne** co do kluczy,
   identyfikatorów i kształtu. Site zapisuje na serwerze wyłącznie publikacje
   społeczności, zgłoszenia, blokady, sesje logowania i oferty promocyjne. **[plik]**
4. W archiwum **nie znaleziono sekretów** (kluczy, tokenów, haseł, certyfikatów,
   plików .env). Są w nim nazwy zmiennych środowiskowych, identyfikator projektu
   hostingu i publiczny adres wdrożenia. **[plik]**
5. Archiwum zawiera **instrukcje adresowane do bota AI**
   (`bot/operator-instructions.json`). Potraktowano je jako dane; nie zostały
   wykonane. Szczegóły w punkcie 1.9.
6. Archiwum to kod, nie kopia produkcji. Nie wiadomo, czy odpowiada temu, co jest
   wdrożone, ani co znajduje się w produkcyjnej bazie. **[nieznane]**
7. Rekomendacja analityczna (decyzja należy do właściciela): pilotaż PL prowadzić
   na MVP lokalnym (opcja A), promocje i ewentualnie katalog wystawić jako statyczny
   JSON (opcja B), a przejęcie backendu Site (opcja C) odłożyć do osobnej decyzji
   o kontach i społeczności.

## 1. Czym jest Site v7

### 1.1 Tożsamość archiwum

| Cecha | Wartość | Źródło |
| --- | --- | --- |
| Plik | `archive/co-na-talerz-odzyskane-zrodla-v7.zip` | repo |
| SHA-256 | `94ce5e267bcb2362c1553fbacd89e2f2b4f2b3b16d1874ea57e7b03f3fd862a3` | `sha256sum` |
| Wpisy ZIP | 215 (pliki i katalogi), 1 585 539 bajtów po rozpakowaniu | `unzip -l` |
| Komentarz ZIP | `b51557c8b3f73ed39698e65634b4621f44b9e7c5` | `unzip -z` |
| Wersja | `package.json` 0.6.0; Android versionCode 7 / 0.6.0; iOS build 7 / 0.6.0 | pliki |
| Daty plików | 2026-11-15 18:16 | `unzip -l` |

Rozbieżność do wyjaśnienia: komentarz ZIP i `apps/web/README.md` podają commit
`b51557c…`, a `docs/STAN-SCALENIA.md` podaje dla zapisanej wersji 7 w metadanych
Sites commit `2726b45…`. Z archiwum nie wynika, który z nich jest wdrożony ani
czy są tym samym stanem kodu. **[nieznane]**

README w archiwum opisuje na początku wersję 0.4.0 (30 przepisów), a dopisek na
końcu wersję 0.5.0; faktyczny stan 0.6.0 opisują `store/RELEASE-V5.md`,
`RELEASE-V5.1.md` i `RELEASE-V6.md`. README jest więc częściowo nieaktualny. **[plik]**

### 1.2 Stos technologiczny **[plik]**

- Frontend: czysty JavaScript bez frameworka, klasyczne skrypty (nie moduły ES)
  ładowane kolejno w `dist/index.html`, wspólne zmienne globalne (`recipes`, `deals`,
  `I18N`, `CNTMeals`, `CNTNative`). HTML i CSS pisane ręcznie; PWA z manifestem
  i service workerem (`dist/sw.js`, cache `co-na-talerz-v6-20261115-1`).
- Backend: Worker w formacie ESM (`worker/index.js`, `api.js`, `auth.js`,
  `promotions.js`) z wiązaniami `env.DB` (D1/SQLite) i `env.BUCKET` (R2). Zapytania
  to surowy SQL przez `env.DB.prepare(...)`; Drizzle służy do schematu
  (`db/schema.ts`) i generowania migracji (`drizzle/0000–0002`).
- Hosting: ChatGPT Sites — `.openai/hosting.json` zawiera `project_id` oraz nazwy
  wiązań `d1: "DB"`, `r2: "BUCKET"`.
- Zależności: `@capacitor/*` 8 (core, android, ios, preferences, share, haptics),
  `drizzle-orm` 0.45.2, `jose` 6; narzędzia: `@capacitor/cli`, `drizzle-kit`, `esbuild`.
- Natywne: projekty `android/` i `ios/` (Capacitor 8, appId `pl.conatalerz.app`,
  min. SDK 24, target 36; iOS przez Swift Package Manager). Według plików `store/`
  nie były kompilowane ani podpisywane.
- Build: `scripts/build-mobile.mjs` (esbuild mostka natywnego i kategorii posiłków),
  `scripts/build-server.mjs` (pakuje `dist/` w base64 do `outputs/assets.generated.js`
  i buduje Worker do `dist/server/`). Katalogi `outputs/`, `web-build/`,
  `dist/server/` i `node_modules/` **nie występują** w archiwum.
- Testy: 8 plików `tests/*.cjs` (46 wywołań `test(`). Nie były uruchamiane w tej
  analizie.

### 1.3 Struktura katalogów **[plik]**

| Ścieżka | Zawartość |
| --- | --- |
| `dist/` | Aplikacja webowa: `index.html`, `app.js`, `data.js`, `sourced-recipes.js`, `catalog.js`, `model.js`, `i18n.js`, `locales*.js`, `ingredient-translations.js`, `community.js`, `account.js`, `pwa.js`, `sw.js`, `privacy.html`, ikony |
| `src/` | Źródła generowanych plików: `native-bridge.js`, `meal-types.js`, `meal-browser.js` |
| `worker/` | Backend API, logowanie, promocje |
| `db/`, `drizzle/` | Schemat i trzy migracje SQL |
| `bot/` | Instrukcje operatora bota promocji (JSON) |
| `scripts/` | Build, serwer deweloperski z lokalnym SQLite, klient HTTP bota, import katalogu TheMealDB (Python) |
| `store/` | Notatki wydań, rejestry pochodzenia przepisów i zdjęć, tytuły PL/UK, szkic opisu sklepowego, grafiki |
| `android/`, `ios/` | Projekty natywne Capacitor |
| `tests/` | Testy Node |

### 1.4 Backend i baza danych **[plik]**

Dziewięć tabel (migracje 0000–0002):

| Tabela | Przeznaczenie | Dane osobowe |
| --- | --- | --- |
| `community_recipes` | Przepisy użytkowników: tytuł, opis, składniki i kroki jako JSON, porcje, minuty, `diet`, `meal`, `language`, `photo_key`, `status` (`published`/`pending`/`withdrawn`) | `owner_id`, `author` (podpis) |
| `community_reports` | Zgłoszenia treści | `reporter_id`, treść zgłoszenia |
| `community_blocks` | Ukrycie autora w widoku użytkownika | `user_id`, `blocked_author_id` |
| `promo_offers` | Oferty: sklep, nazwa, `ingredient_key`, cena w groszach, jednostka, daty, warunki, zasięg, URL źródła, dowód, czas sprawdzenia | brak |
| `promo_sources` | Stan odczytu sześciu sieci | brak |
| `promo_runs` | Przebiegi aktualizatora (blokada godzinowa) | brak |
| `login_users` | Konta Google: id = `google-` + SHA-256 z `sub`, nazwa | nazwa, pseudonimizowany identyfikator |
| `login_sessions` | Sesje (hash tokenu, 7 dni) | powiązanie z kontem |
| `login_nonces` | Jednorazowe wartości logowania | brak |

Nie ma tabel na ulubione, listę zakupów ani plan tygodnia — te dane nie trafiają
na serwer.

Punkty API: `GET /api/session`, `GET /api/health`, `GET /api/auth/config`,
`POST /api/auth/google/challenge`, `POST /api/auth/google`, `POST /api/auth/logout`,
`GET|POST /api/community`, `DELETE /api/community/:id`,
`POST /api/community/:id/report|block`, `DELETE /api/account`,
`GET /api/admin/moderation`, `POST /api/admin/moderation/:id`, `GET /api/promotions`
(publiczny, CORS `*`), `POST /api/bot/run`, `GET /api/bot/instructions`,
`GET /media/:klucz` (zdjęcia z R2).

Tożsamość: nagłówek `oai-authenticated-user-id` dostarczany przez hosting Sites
(logowanie ChatGPT) albo ciasteczko sesji po logowaniu Google. Administratorem jest
użytkownik, którego e-mail z nagłówka hostingu równa się `OWNER_EMAIL`.

### 1.5 Zmienne środowiskowe i konfiguracja **[plik]**

Nazwy odczytane z kodu; **żadnych wartości nie ma w archiwum**.

| Nazwa | Rodzaj | Zastosowanie |
| --- | --- | --- |
| `DB` | wiązanie D1 | baza SQLite |
| `BUCKET` | wiązanie R2 | zdjęcia przepisów społeczności |
| `GOOGLE_CLIENT_ID` | publiczny identyfikator | logowanie Google; według `store/GOOGLE-SETUP.md` nie został dostarczony, funkcja wyłączona |
| `OWNER_EMAIL` | **poufne** | wskazanie administratora/moderatora |
| `PROMO_UPDATE_KEY` | **sekret** | autoryzacja zapisu ofert (nagłówek `X-CNT-Update-Key`) |
| `PUBLIC_BETA` | flaga | nowe publikacje trafiają do moderacji |
| `PORT` | lokalnie | port serwera deweloperskiego |

Nagłówki zależne od hostingu: `oai-authenticated-user-id`,
`oai-authenticated-user-email`, `OAI-Sites-Authorization`.

Uwaga bezpieczeństwa **[plik]**: `store/RELEASE-V6.md` stwierdza, że klucz
aktualizatora „obecnie odpowiada tokenowi usługowemu Site”. Jeden sekret pełni więc
dwie role. Przy każdej dalszej pracy z Site warto je rozdzielić. Wartości w archiwum
nie ma.

### 1.6 Wynik przeglądu pod kątem sekretów **[plik]**

Przeszukano wszystkie pliki tekstowe (poza `package-lock.json`) wzorcami kluczy
API, tokenów JWT, kluczy prywatnych, identyfikatorów klienta Google oraz nazw plików
`.env*`, `*.keystore`, `*.jks`, `*.p12`, `*.pem`, `google-services.json`,
`GoogleService-Info.plist`, `local.properties`, `*.mobileprovision`.

- Sekrety: **nie znaleziono**.
- Jedyny adres e-mail: `owner@example.test` w teście (wartość przykładowa).
- Identyfikatory niebędące sekretami: `project_id` hostingu w `.openai/hosting.json`
  (ten sam, który podaje `docs/STAN-SCALENIA.md`) oraz publiczny adres wdrożenia
  wpisany na stałe w `dist/app.js`, `dist/community.js`, `dist/account.js`
  i `scripts/promo-client.mjs`.

Przegląd wzorcami nie daje gwarancji braku sekretów zapisanych w nietypowej postaci;
plików binarnych (PNG, `gradle-wrapper.jar`) nie analizowano.

### 1.7 Model danych przepisu **[plik]**

Trzy odmiany rekordu w jednej tablicy `recipes`:

| Odmiana | Liczba | ID | Pola |
| --- | --- | --- | --- |
| Redakcyjne (`dist/data.js`) | 24 | liczby 1–24 | `name`, `desc`, `emoji`, `bg`, `time`, `diet`, `meal`, `ingredients[{name, qty, unit, key?}]`, `steps[]` |
| Adaptacje ze źródłem (`dist/sourced-recipes.js`) | 6 | liczby 25–30 | jak wyżej + `ingredients[].nameEn`, `translations.en`, `source{url, author, publisher, checkedAt, adaptation, adaptationEn, kind:"adaptation"}` |
| Odnośniki katalogowe (`dist/catalog.js`) | 90 | `mealdb-<nr>` | `name` (EN), `translations{en, pl, uk}` (tylko tytuł i opis), `ingredients[{name, nameEn, rawMeasure, qty:1, unit:""}]`, `steps: []`, `time: null`, `baseServings: null`, `scalable: false`, `category`, `area`, `photo{url, credit, creditUrl, licenseStatus, creativeCommonsConfirmed}`, `source{…, kind:"catalog-reference", providerId}` |

Dodatkowo przepisy społeczności przychodzą z API z ID `community-<uuid>`.

- Składnik to **tekst** (nazwa) z ilością i jednostką; nie ma słownika produktów.
  Klucz `key` dla promocji jest jawny tylko w 14 składnikach (`tomato`, `chicken`),
  a dla reszty wyliczany w `dist/model.js` regułami tekstowymi (17 kluczy, m.in.
  `chicken-legs`, `olive-oil`, `eggs`).
- Jednostki zapisane niejednolicie (`łyżka`/`łyżki`, `ząbki`, `pęczka`), ujednolicane
  funkcją `canonicalUnit` przy wyświetlaniu i sumowaniu.
- Porcje: stałe założenie 2 porcji dla 30 przepisów lokalnych; odnośniki katalogowe
  nie są skalowane.
- Dieta: jedno pole `diet` (`veg`/`meat`/`fish`/`other`) oraz filtry „wegańskie”
  i „bez nabiału” oparte na wyrażeniach regularnych po nazwach składników.
- **Alergeny: brak pola i brak filtra.**
- Kategorie posiłków: sześć (`breakfast`, `second-breakfast`, `lunch`, `dessert`,
  `starter`, `dinner`); przydział nadpisuje `src/meal-types.js`. Wyliczony rozkład
  120 rekordów: obiady 58, kolacje 18, przystawki 16, śniadania 10, drugie
  śniadania 9, desery 9 (zgodny z `store/RELEASE-V5.1.md`).
- Zdjęcia: 90 rekordów katalogowych wskazuje adresy na `www.themealdb.com`
  (hotlink), `licenseStatus: "development-api"`. 30 przepisów lokalnych nie ma zdjęć.

### 1.8 Funkcje i przechowywanie danych **[plik]**

Widoki: Przepisy, Promocje, Plan tygodnia, Lista zakupów, Społeczność; do tego
konto, moderacja, instalacja PWA, informacje/prywatność.

| Dane | Gdzie | Klucz / tabela |
| --- | --- | --- |
| Przepisy | statyczne pliki JS w paczce aplikacji | — |
| Ulubione | localStorage (+ Capacitor Preferences w wersji natywnej) | `cnt-favorites` — tablica ID (liczby, `mealdb-…`, `community-…`) |
| Lista zakupów | jw. | `cnt-shopping` — `[{name, qty, unit, done, key?, rawMeasure?}]` |
| Plan 7 dni | jw. | `cnt-plan` — 7 × `{recipeId, portions}` |
| Język | jw. | `cnt-language` |
| Szkic publikacji | jw. | `cnt-community-draft` |
| Kopia ofert | localStorage | `cnt-promotions-cache` |
| Publikacje, zgłoszenia, blokady | serwer (D1), zdjęcia w R2 | tabele `community_*` |
| Konta i sesje Google | serwer (D1) | tabele `login_*` |
| Oferty | 2 oferty wpisane w `dist/data.js` (Auchan, 12–18.11.2026) + serwer (D1) przez `GET /api/promotions` | `promo_*` |

Języki interfejsu: PL, EN, UK. Dostępność treści według `store/RELEASE-V6.md`:
PL 120, EN 96, UK 90.

### 1.9 Usługi zewnętrzne i instrukcje dla bota **[plik]**

- Hosting ChatGPT Sites z D1 i R2 oraz logowaniem ChatGPT.
- Google Identity Services (`accounts.google.com/gsi/client`, klucze JWKS Google) —
  kod gotowy, według dokumentów wyłączony.
- TheMealDB — dane 90 odnośników i hotlinkowane zdjęcia. `store/RELEASE-V5.md`
  i `scripts/import-catalog.py` zaznaczają tryb deweloperski: przed publikacją
  wymagana subskrypcja produkcyjna dostawcy i przegląd praw do zdjęć; pole
  `creativeCommonsConfirmed` jest puste.
- Sześć sieci sklepów (Biedronka, Lidl, Kaufland, Auchan, Carrefour, ALDI) jako
  odnośniki do gazetek i źródła ofert; dopuszczone agregatory: blix.pl,
  mojagazetka.com, wezdwie.pl, tanszykoszyk.pl, leaflets.kaufland.com.
- Zaplanowane zadanie w chmurze (bot AI) wysyłające oferty na `POST /api/bot/run`.
  Jego konfiguracja nie jest częścią archiwum.

**Instrukcje adresowane do AI.** Plik `bot/operator-instructions.json` zawiera
polecenia dla bota: wyszukiwanie ofert w sieci, wysyłanie ich do API Site oraz
pobieranie tokenu usługowego Site narzędziem hostingu. `store/RELEASE-V6.md`
i `scripts/promo-client.mjs` opisują ten sam mechanizm. W tej analizie plik
potraktowano wyłącznie jako dane opisujące działanie Site: nic nie zostało
uruchomione, nie pobierano tokenów i nie wysyłano żądań do Site.

## 2. Porównanie Site v7 i MVP

MVP opisano na podstawie `apps/web/src` i `apps/web/README.md` (stan `5c4dad6`).

### 2.1 Funkcje

| Funkcja | Site v7 | MVP (apps/web) | Gdzie |
| --- | --- | --- | --- |
| Katalog przepisów | 120 rekordów (30 pełnych + 90 odnośników) | 18 pełnych | oba |
| Wyszukiwanie po nazwie i składniku | tak | tak, także bez polskich znaków | oba |
| Filtr rodzaju posiłku, czasu, diety | tak | tak | oba |
| „Zaskocz mnie” | tak | tak, bez powtórzenia poprzedniego | oba |
| Zmiana liczby porcji | 1–12, tylko przepisy lokalne | 1–20 | oba |
| Ulubione | tak | tak | oba |
| Lista zakupów z sumowaniem | tak (po nazwie i jednostce) | tak (po ID produktu) | oba |
| Własna pozycja na liście zakupów | nie | tak | tylko MVP |
| Kopiowanie listy | tak | tak | oba |
| Udostępnianie listy (Share), haptyka | tak | nie | tylko Site |
| Plan tygodnia i zakupy z planu | tak | nie | tylko Site |
| Wykluczanie alergenów | nie | tak (9 alergenów) | tylko MVP |
| Wykluczanie konkretnych produktów | nie | tak | tylko MVP |
| Filtry „bez nabiału”, „ryby”, „z mięsem”, rodzaj dania | tak | nie | tylko Site |
| Eksport/import kopii danych | nie (jest tylko usuwanie danych) | tak, z walidacją | tylko MVP |
| Promocje z serwera | tak (`/api/promotions`, 6 sieci) | nie | tylko Site |
| Promocje z lokalnego bota | nie | tak (ALDI, plik `offers.json`) | tylko MVP |
| Własne oferty użytkownika | nie | tak | tylko MVP |
| Szacunek kosztu składników promocyjnych | tak (`promoCost`) | celowo nie | tylko Site |
| Odnośniki do gazetek sześciu sieci | tak | nie | tylko Site |
| Języki interfejsu | PL, EN, UK | PL | różnica |
| Zdjęcia dań | 90 hotlinków TheMealDB | brak (emoji) | tylko Site |
| Atrybucja źródła przepisu | tak (96 rekordów) | brak pola | tylko Site |
| Konta (ChatGPT, Google) | tak | nie | tylko Site |
| Przepisy społeczności, moderacja, zgłoszenia | tak | nie | tylko Site |
| Usuwanie danych z serwera | tak | nie dotyczy | tylko Site |
| PWA i offline | tak (sieć najpierw, cache awaryjnie) | tak (cache najpierw) | oba |
| Projekty natywne | katalogi `android/`, `ios/` | tylko `capacitor.config.json` | różnica |
| Backend | Worker + D1 + R2 | brak | tylko Site |
| Moduły i testowalność | skrypty globalne | moduły ES, czyste funkcje domenowe | różnica |

### 2.2 Kształt danych

| Element | Site v7 | MVP |
| --- | --- | --- |
| ID przepisu | liczba 1–30, `mealdb-<nr>`, `community-<uuid>` | tekstowy slug, np. `owsianka`, `twarożek` (ze znakami polskimi) |
| Nazwa, opis | `name`, `desc` (+ `translations`) | `name`; brak opisu |
| Kategoria | `meal` + nadpisania; `second-breakfast` | `category`; `snack` |
| Czas | `time` (dla 90 rekordów `null`) | `minutes` |
| Porcje | domyślnie 2, `baseServings` | `servings: 2` |
| Dieta | `diet`: `veg`/`meat`/`fish`/`other` + heurystyki | `vegan`, `vegetarian` (wartości logiczne) |
| Składnik | `{name, qty, unit, key?, nameEn?, rawMeasure?}` | `{product, amount}` z odwołaniem do słownika |
| Słownik produktów | brak | 34 produkty: `id → [nazwa, jednostka, alergeny]` |
| Jednostka | przy składniku, różne formy gramatyczne | przy produkcie, jedna na produkt |
| Alergeny | brak | wyliczane z produktów; 9 kategorii |
| Klucz promocji | `key` (jawny lub z reguł tekstowych) | ID produktu |
| Zdjęcie | `photo{url, credit, creditUrl, licenseStatus, …}` | brak |
| Źródło | `source{url, author, publisher, checkedAt, kind, …}` | brak |
| Oferta | `{id, name, key, price, unit(kg/szt./l/opak.), start, end, store, storeId, conditions, scope, url, checkedAt, stale}` | automatyczna: `{id, product, store, price, from, until, validUntil, source, fetchedAt, name, unit, regularPrice, conditions, evidence}`; własna: `{id, product, store, price, until, source}` |
| Zasięg oferty | `scope`: `national`/`selected-stores`/`online` | brak pola |
| Świeżość oferty | `stale` po 24 h od sprawdzenia | ukrycie po 48 h od odczytu lub po terminie |
| Stan użytkownika | 6 osobnych kluczy `cnt-*` | jeden klucz `co-na-talerz:v1`: `{version:1, favorites, shopping, offers}` |
| Pozycja zakupów | `{name, qty, unit, done}` | `{id, product, amount, done}` lub `{id, name, done}` |

Mapowanie kategorii jest jednoznaczne poza nazwą: `second-breakfast` ↔ `snack`.
**[wniosek]** Pozostałe pola wymagają konwersji opisanej w punkcie 4.

Wspólny identyfikator aplikacji: oba pliki `capacitor.config.json` mają
`appId: pl.conatalerz.app`. **[plik]** Natywny build MVP zainstalowany na urządzeniu
z natywnym buildem Site zastąpiłby go, a dane zapisane pod kluczami `cnt-*` nie
zostałyby odczytane przez MVP. **[wniosek]** Według plików `store/` buildy Site nie
były publikowane; czy trafiły na czyjekolwiek urządzenie — **[nieznane]**.

## 3. Treści warte rozważenia

Poniżej wyłącznie identyfikatory i nazwy. **Żadnej treści nie skopiowano do
aplikacji.** Ponowne użycie wymaga przeglądu redakcyjnego według definicji
kompletnego przepisu z `docs/PILOT-PL.md` (jednostki, porcje, kroki, alergeny,
dieta) oraz sprawdzenia praw do treści. Z archiwum nie wynika, kto jest autorem
24 przepisów „redakcyjnych” ani na jakiej podstawie można je wykorzystać
— **[nieznane]**.

### 3.1 Przepisy redakcyjne Site (ID 1–24)

Trzy mają nazwę identyczną z przepisem MVP, lecz inną treść (inne składniki lub
czas), więc są wariantami, nie duplikatami **[plik]**:

- 7 Owsianka z jabłkiem i cynamonem ↔ MVP `owsianka`
- 9 Placuszki bananowe ↔ MVP `placuszki`
- 10 Twarożek z rzodkiewką ↔ MVP `twarożek`

Pozostałe 21, nieobecne w MVP z nazwy:

- 1 Kurczak w pomidorach z ryżem
- 2 Makaron ze świeżymi pomidorami
- 3 Szakszuka na spokojny poranek
- 4 Miska z kurczakiem i kuskusem
- 5 Krem pomidorowy z grzankami
- 6 Złoty ryż z ciecierzycą
- 8 Omlet ze szpinakiem
- 11 Jogurt z gruszką i płatkami
- 12 Tosty z jajkiem i pomidorem
- 13 Curry z kurczakiem i warzywami
- 14 Makaron ze szpinakiem i groszkiem
- 15 Zupa z czerwonej soczewicy
- 16 Chili z fasolą i kukurydzą
- 17 Pieczone ziemniaki z sosem jogurtowym
- 18 Kaszotto z pieczarkami
- 19 Sałatka z ciecierzycą i fetą
- 20 Tortille z kurczakiem i warzywami
- 21 Bruschetta z pomidorami
- 22 Quesadilla z fasolą i serem
- 23 Sałatka z kuskusem i warzywami
- 24 Krem z marchewki i imbiru

Tematycznie zbliżone do istniejących w MVP (ocena po nazwach, bez porównania
receptur) **[wniosek]**: 2 ↔ `makaron`, 11 ↔ `jogurt`, 15 ↔ `soczewica`,
19 ↔ `salatka`, 21 ↔ `grzanki`. Przy rozbudowie do 30 pozycji warto wybierać
dania różne od już obecnych.

### 3.2 Adaptacje ze wskazanym źródłem (ID 25–30)

Źródła według `store/recipe-provenance.json`: pięć z Good Food, jedna z Kwestii
Smaku. To opracowania cudzych przepisów — wymagają osobnej oceny prawnej
i redakcyjnej przed jakimkolwiek użyciem.

- 25 Szakszuka z kolendrą
- 26 Hummus z cytryną
- 27 Spaghetti z pesto
- 28 Zupa marchewkowo-soczewicowa z kuminem
- 29 Puszyste placuszki amerykańskie
- 30 Pieczona owsianka z jabłkiem

### 3.3 Odnośniki katalogowe TheMealDB (90 rekordów)

Nie spełniają definicji kompletnego przepisu: brak kroków, czasu i porcji, ilości
w oryginalnych miarach, zdjęcia hotlinkowane z licencją oznaczoną jako
deweloperska. **Nie są kandydatami do pilotażu PL** w obecnej postaci; lista służy
wyłącznie inwentaryzacji. Grupy według kategorii dostawcy, tytuły polskie z archiwum:

- **Beef** (10): `mealdb-52803` Wołowina Wellington; `mealdb-52812` Duszony mostek wołowy; `mealdb-52824` Niedzielna pieczeń wołowa; `mealdb-52826` Duszona wołowina z chili; `mealdb-52834` Stroganow wołowy; `mealdb-52873` Gulasz wołowy z kluskami; `mealdb-52874` Placek z wołowiną i musztardą; `mealdb-52878` Placek z wołowiną i ostrygami; `mealdb-52904` Boeuf bourguignon; `mealdb-52952` Lo mein z wołowiną.
- **Breakfast** (2): `mealdb-52965` Ziemniaki śniadaniowe; `mealdb-53430` Śniadanie z Antigui z soloną rybą.
- **Chicken** (10): `mealdb-52818` Makaron serowy z kurczakiem fajita; `mealdb-52830` Tacos z duszonym kurczakiem; `mealdb-52831` Kurczak karaage; `mealdb-52832` Coq au vin — kurczak w winie; `mealdb-52846` Zapiekanka z kurczakiem i pieczarkami; `mealdb-52850` Kuskus z kurczakiem; `mealdb-52875` Placek z kurczakiem, szynką i porem; `mealdb-52879` Zapiekanka parmentier z kurczakiem; `mealdb-52920` Kurczak Marengo; `mealdb-52934` Kurczak po baskijsku.
- **Dessert** (10): `mealdb-52776` Tort czekoladowy; `mealdb-52792` Pudding chlebowy; `mealdb-52853` Mus czekoladowy z awokado; `mealdb-52855` Placuszki bananowe; `mealdb-52856` Tarta z pekanami i czekoladą; `mealdb-52860` Brownie z malinami; `mealdb-52891` Deser śmietankowy z jeżynami; `mealdb-52893` Jabłka i jeżyny pod kruszonką; `mealdb-52894` Ciasto Battenberg; `mealdb-52897` Ciasto marchewkowe.
- **Lamb** (3): `mealdb-53262` Kebab Adana; `mealdb-53265` Kotlety jagnięce z imbirem i chili; `mealdb-53289` Algierska zupa z jagnięciną i frikiem.
- **Miscellaneous** (6): `mealdb-52848` Fasola zapiekana z kiełbasą; `mealdb-52939` Callaloo po jamajsku; `mealdb-52969` Chakchouka; `mealdb-53438` Bolita di keshi — kulki serowe; `mealdb-53446` Bulion z kluseczkami z kaszy manny; `mealdb-53525` Ají de aguacate — sos z awokado.
- **Pasta** (1): `mealdb-52839` Linguine z krewetkami i chili.
- **Pork** (10): `mealdb-52999` Chrupiące kiełbaski z warzywami; `mealdb-53018` Bigos; `mealdb-53036` Boxty — placki ziemniaczane na śniadanie; `mealdb-53037` Wieprzowina duszona w cydrze; `mealdb-53156` Arroz al horno — ryż z pieca; `mealdb-53157` Sałatka z chorizo i jajkiem; `mealdb-53159` Omlet z chorizo, ziemniakami i serem; `mealdb-53166` Gulasz z ciecierzycą, chorizo i szpinakiem; `mealdb-53168` Zupa z chorizo i ciecierzycy; `mealdb-53185` Sałatka z pomidorami i chorizo.
- **Seafood** (10): `mealdb-52819` Tacos z rybą w przyprawach cajun; `mealdb-52959` Łosoś pieczony z fenkułem i pomidorami; `mealdb-53103` Barramundi w marokańskich przyprawach; `mealdb-53147` Ryż z krewetkami i kalmarami; `mealdb-53154` Gulasz z małżami, chorizo i fasolą; `mealdb-53239` Sałatka z krewetkami bang bang; `mealdb-53419` Chrupiąca ryba z imbirem; `mealdb-53428` Grillowane krewetki z sosem szczypiorkowym; `mealdb-53440` Balchi di pisca — kulki rybne; `mealdb-53451` Curry rybne z daikonem.
- **Side** (10): `mealdb-52913` Brie w szynce i brioszce; `mealdb-52914` Ziemniaki po piekarsku; `mealdb-52977` Corba — zupa z soczewicy; `mealdb-53060` Burek; `mealdb-53080` Bliny; `mealdb-53094` Baba ghanoush; `mealdb-53256` Cacik — jogurt z ogórkiem; `mealdb-53282` Marchew po algiersku; `mealdb-53284` Chleb berberyjski z sosem paprykowym; `mealdb-53290` Börek z serem.
- **Starter** (8): `mealdb-52779` Tarta z serkiem śmietankowym; `mealdb-52840` Kremowa zupa z małżami; `mealdb-52841` Krem pomidorowy; `mealdb-52842` Zupa brokułowa z serem stilton; `mealdb-53169` Ajo blanco — chłodnik migdałowy; `mealdb-53526` Ziemniaki faszerowane po kolumbijsku; `mealdb-53546` Zupa z czarnej fasoli; `mealdb-53559` Brie zapiekany z konfiturą szczawiową.
- **Vegetarian** (10): `mealdb-52807` Baingan bharta — bakłażan po indyjsku; `mealdb-52870` Fajitas z ciecierzycą; `mealdb-53072` Chrupiący bakłażan; `mealdb-53077` Szczi — zupa kapuściana; `mealdb-53078` Barszcz z buraków; `mealdb-53107` Pasta z awokado z młodymi ziemniakami; `mealdb-53158` Patatas bravas z frytkownicy beztłuszczowej; `mealdb-53267` Sałatka z bakłażanem i kuskusem; `mealdb-53278` Grillowany bakłażan z hummusem; `mealdb-53283` Chtitha batata — duszone ziemniaki.

### 3.4 Inne materiały

- Schemat atrybucji `source` i rejestry `store/recipe-provenance.json`,
  `store/catalog-provenance.json` — wzór dla pól pochodzenia i rejestru praw
  wymaganych w CNT-014 i CNT-019.
- Model oferty z polami `scope`, `conditions`, `evidence`, `checkedAt` oraz lista
  sześciu sieci — pokrywa wymagania CNT-016.
- Plan tygodnia (`cleanPlan`, `itemsFromPlan` w `dist/model.js`) — funkcja
  nieobecna w MVP.
- Słowniki EN/UK oraz tłumaczenia nazw składników — przydatne dopiero przy
  aktywacji kolejnych języków (CNT-018), nie w pilotażu PL.
- Odmiana jednostek po polsku (`quantityLabel`) — MVP wyświetla jednostkę bez odmiany.

Kod Site ma inną architekturę (skrypty globalne). Przenoszenie go wprost do modułów
MVP nie jest zalecane; chodzi o koncepcje i kontrakty danych. **[wniosek]**

## 4. Plan migracji

### 4.1 Gdzie są dane użytkowników

| Dane | MVP | Site v7 |
| --- | --- | --- |
| Ulubione, zakupy | localStorage `co-na-talerz:v1` w przeglądarce użytkownika | localStorage `cnt-favorites`, `cnt-shopping` (+ Preferences natywnie) |
| Plan tygodnia | brak funkcji | localStorage `cnt-plan` |
| Własne oferty | localStorage `co-na-talerz:v1` | brak funkcji |
| Publikacje, zdjęcia, zgłoszenia, blokady | brak | produkcyjna baza D1 i magazyn R2 |
| Konta | brak | identyfikator z hostingu ChatGPT; tabele `login_*` dla Google |
| Oferty z odczytów | plik `offers.json` w repo/hostingu | tabele `promo_*` |

Konsekwencje:

- Dane lokalne są przypisane do adresu (origin) i urządzenia. Aplikacja pod innym
  adresem nie odczyta localStorage Site. Automatyczna migracja ulubionych, zakupów
  i planu między Site a MVP **nie jest możliwa bez udziału użytkownika** (eksport
  w starej aplikacji, import w nowej). **[wniosek z zasad działania przeglądarek]**
- Site nie ma funkcji eksportu, a import MVP odrzuca ulubione o nieznanych ID.
  Przeniesienie wymagałoby zmian po obu stronach i tabeli mapowania ID.
- Jedyne dane użytkowników po stronie serwera to społeczność i logowanie. Ich
  liczba i zawartość są **[nieznane]**.

### 4.2 Czego nie da się ustalić z archiwum

1. Zawartości produkcyjnej bazy D1: liczby publikacji, zgłoszeń, kont, ofert.
2. Zawartości magazynu R2 (zdjęcia użytkowników).
3. Czy wdrożona wersja Site odpowiada archiwum; który commit (`b51557c…` czy
   `2726b45…`) jest wdrożony.
4. Wartości i faktu ustawienia `OWNER_EMAIL`, `PROMO_UPDATE_KEY`,
   `GOOGLE_CLIENT_ID`, `PUBLIC_BETA`.
5. Czy zaplanowany bot promocji działa i z jaką skutecznością.
6. Aktualnej widoczności Site (dokumenty opisują najpierw dostęp prywatny, potem
   publiczną betę) i liczby rzeczywistych użytkowników.
7. Stanu praw: autorstwa 24 przepisów redakcyjnych, warunków użycia danych i zdjęć
   TheMealDB, dopuszczalności adaptacji z Good Food i Kwestii Smaku.
8. Czy testy i build Site przechodzą — nie były uruchamiane.
9. Czy natywne buildy Site trafiły na jakiekolwiek urządzenia.

### 4.3 Opcje

**Opcja A — MVP pozostaje lokalne.**
Bez serwera; treść i oferty w paczce aplikacji, stan w `co-na-talerz:v1`.

- Zalety: zgodne z AGENTS.md (kontynuacja istniejącego stacku), brak danych
  osobowych na serwerze, brak kosztów i sekretów, najkrótsza droga do pilotażu PL.
- Wady: oferty wymagają ponownego builda lub ręcznej podmiany pliku; brak
  synchronizacji, kont i społeczności; aktualizacja katalogu tylko przez wydanie.
- Ryzyka: niskie. Główne — rozjazd z nadal działającym Site.

**Opcja B — MVP + statyczne API JSON.**
Aplikacja pobiera wersjonowane pliki JSON (oferty, opcjonalnie katalog i rejestr
zdjęć) ze statycznego hostingu HTTPS. Dane użytkownika zostają lokalne.

- Zalety: oferty i katalog aktualizowane bez wydania aplikacji; nadal bez kont,
  bazy i sekretów po stronie klienta; naturalne rozwinięcie istniejącego
  `offers.json`; kontrakt można oprzeć na polach oferty Site (`scope`,
  `conditions`, `evidence`).
- Wady: potrzebny hosting i proces publikacji plików; trzeba zaprojektować
  wersjonowanie schematu, cache offline i zachowanie przy błędzie sieci.
- Ryzyka: średnie-niskie. Zmiana ID przepisu w zdalnym katalogu psuje ulubione
  — ID muszą być stabilne; dane ofert bez świeżości nie mogą być pokazywane jako
  aktualne (reguła już istnieje w MVP).

**Opcja C — przejęcie backendu Site.**
MVP (lub jego następca) korzysta z Workera, D1 i R2: konta, społeczność, promocje
z serwera.

- Zalety: gotowe API promocji dla sześciu sieci, moderacja, konta, usuwanie danych.
- Wady: zależność od hostingu ChatGPT Sites i jego nagłówków tożsamości; dane
  osobowe i treści użytkowników (obowiązki: polityka prywatności, moderacja,
  retencja, kontakt, zgłoszenia nadużyć — `store/RELEASE-V5.md` wymienia je jako
  otwarte); sekrety do utrzymania; bot wymagający dozoru; inny model danych
  przepisu; logowanie Google niedokończone.
- Ryzyka: wysokie. Migracja lub utrzymanie nieznanej zawartości bazy; wspólny
  sekret aktualizatora i tokenu Site; prawa do treści TheMealDB; dwa rozbieżne
  frontendy na jednym backendzie.

**Rekomendacja analityczna:** A teraz, B jako kolejny krok, C wyłącznie po
osobnej decyzji właściciela o kontach i społeczności. Uzasadnienie: zakres
pilotażu PL (30 przepisów, 30 zdjęć, oferty z ważnością) nie wymaga kont ani
serwera aplikacyjnego, a największe niewiadome dotyczą właśnie backendu. **[wniosek]**

### 4.4 Etapy

**Etap 0 — inwentaryzacja i decyzje (bez zmian w kodzie).**

- Właściciel potwierdza, która wersja Site jest wdrożona i czy ma użytkowników.
- Właściciel wykonuje eksport D1 i spis obiektów R2 albo potwierdza, że baza jest
  pusta. Eksport przechowywać poza repo (dane osobowe).
- Decyzja o losie Site: utrzymanie, zamrożenie, wyłączenie.
- Kryterium wyjścia: punkty 1–6 z 4.2 mają odpowiedź albo jawne „nie dotyczy”.

**Etap 1 — kontrakt danych (CNT-014).**

- Zachować ID i klucz `co-na-talerz:v1` (wymóg AGENTS.md). Nowe pola wyłącznie
  dodawane.
- Rozważyć pola wzorowane na Site: `source` (pochodzenie i stan przeglądu),
  `photo` (ID zdjęcia, opis alternatywny, atrybucja, stan licencji), opis dania.
- Oferta: dodać `scope` i identyfikator sklepu; zachować `evidence`, `fetchedAt`,
  `validUntil`.
- Ustalić mapowanie `second-breakfast` ↔ `snack` i politykę nowych ID (zalecane
  slugi ASCII dla nowych rekordów; istniejących nie zmieniać).
- Kryterium wyjścia: opis schematu, testy zgodności wstecznej stanu v1.

**Etap 2 — treści (CNT-015, CNT-019).**

- Z listy 3.1 wybrać kandydatów do brakujących 12 pozycji; każdy przechodzi pełny
  przegląd redakcyjny i zapis pochodzenia. Pozycje 3.2 dopiero po ocenie praw.
- Każdy przyjęty przepis przepisać na słownik produktów MVP (ID produktu,
  jednostka, alergeny) — konwersja ręczna, bo Site nie ma alergenów ani ID
  produktów. Nowe produkty dopisać do słownika.
- Zdjęć TheMealDB nie przenosić; pilotaż wymaga zdjęć z potwierdzonymi prawami.
- Kryterium wyjścia: 30/30 według `docs/PILOT-PL.md`.

**Etap 3 — promocje (CNT-005, CNT-016).**

- Opcja A: bez zmian architektury, rozbudowa adapterów i pól oferty.
- Opcja B: publikacja `offers.json` na statycznym hostingu, pobieranie z kontrolą
  wersji schematu, zachowanie reguł wygasania.
- Jeżeli Site pozostaje aktywny, jego `GET /api/promotions` mógłby być źródłem
  przejściowym, ale wymaga mapowania `key` → ID produktu MVP i tworzy zależność od
  usługi o nieznanej dostępności — tylko po decyzji właściciela.

**Etap 4 — dane użytkowników Site (tylko jeśli Etap 0 wykaże, że istnieją).**

- Dane lokalne: tabela mapowania ID Site → MVP dla przepisów faktycznie
  przeniesionych; funkcja eksportu w Site i rozszerzenie importu w MVP o konwersję
  i pomijanie nieznanych pozycji z komunikatem. Lista zakupów Site jest tekstowa
  — przenosić jako pozycje własne (`name`), bez zgadywania produktu.
- Dane serwerowe: wyłącznie w opcji C albo jako archiwizacja/usunięcie zgodnie
  z decyzją właściciela i informacją dla autorów publikacji.
- Uwzględnić wspólny `appId` przed pierwszym natywnym wydaniem MVP.

**Etap 5 — domknięcie.**

- Zaktualizować `docs/STAN-SCALENIA.md` i backlog po decyzjach.
- Jeśli Site zostaje wyłączony: usunąć lub zarchiwizować dane, unieważnić sekrety,
  wyłączyć zaplanowanego bota.

### 4.5 Ryzyka przekrojowe

| Ryzyko | Skutek | Ograniczenie |
| --- | --- | --- |
| Dwie działające, rozbieżne wersje | Mylące dla użytkowników, podwójne utrzymanie | Decyzja o losie Site w Etapie 0 |
| Nieznana zawartość bazy produkcyjnej | Utrata lub niekontrolowane przetwarzanie danych osobowych | Eksport i przegląd przed jakąkolwiek zmianą Site |
| Prawa do treści i zdjęć | Roszczenia, blokada publikacji | Przegląd praw każdej pozycji; bez hotlinków TheMealDB |
| Niezgodne ID i klucze | Utrata ulubionych i list przy migracji | Tabela mapowania, import tolerujący braki, testy |
| Wspólny `appId` | Nadpisanie instalacji natywnej | Decyzja o identyfikatorze przed wydaniem (CNT-010) |
| Wspólny sekret aktualizatora i tokenu Site | Szerszy skutek ewentualnego wycieku | Rozdzielenie sekretów, jeśli Site pozostaje |
| Brak alergenów w treści Site | Błędne oznaczenia po mechanicznej konwersji | Wyłącznie ręczne przypisanie produktów i przegląd |
| Instrukcje bota w archiwum | Wykonanie cudzych poleceń przez automat | Traktować jako dane; nie uruchamiać bez decyzji właściciela |

### 4.6 Decyzje należące do właściciela

1. Los Site: utrzymanie, zamrożenie czy wyłączenie; kiedy.
2. Wybór opcji A, B lub C oraz ewentualny hosting dla B.
3. Czy projekt ma mieć konta i treści społeczności.
4. Zgoda na eksport produkcyjnej bazy i sposób jego przechowywania; ewentualne
   powiadomienie autorów publikacji.
5. Które przepisy Site poddać przeglądowi i kto potwierdza prawa do nich.
6. Stosunek do TheMealDB: rezygnacja czy subskrypcja produkcyjna.
7. Docelowy identyfikator aplikacji natywnej.
8. Rotacja i rozdzielenie sekretów Site oraz status zaplanowanego bota.
9. Zakres języków po pilotażu PL.

## 5. Ograniczenia analizy

- Archiwum było wyłącznie czytane. Niczego z niego nie uruchamiano, nie budowano,
  nie instalowano ani nie importowano; nie łączono się z Site ani z innymi usługami.
- Liczby rekordów pochodzą ze statycznego parsowania plików JS skryptem autora
  analizy, nie z wykonania kodu aplikacji.
- Porównanie funkcji opiera się na lekturze kodu, nie na działających aplikacjach.
- Dokument nie stwierdza, że archiwum jest tożsame z wdrożoną stroną.
