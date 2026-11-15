# Aktualny wspólny projekt: co na talerzu

Aplikacja: `apps/web` (PWA, JavaScript ES modules, Node.js, konfiguracja Capacitor). Nie ma obecnie Expo, Supabase ani EAS w aktywnym MVP. Testy: `node scripts/run.mjs test`; build: `node scripts/run.mjs build` z katalogu głównego. Backlog: `docs/BACKLOG.md`, raporty: `reports/`, CI: `.github/workflows/ci.yml`. Wspólne repo GitHub: `kamills194/co-na-talerzu`, gałąź `main`. Folder Drive i podfoldery raportów/wersji mają rzeczywiste ID w `project.config.json`. Kod, Skills i źródła raportów wersjonuj w GitHub; na Drive zapisuj raport lub snapshot z dokładnym SHA. Publikacja natywna: `apps/web/PLAN-WYDANIA.md`.

Poniższa propozycja stosu dotyczy wyłącznie nowej implementacji po odrębnej decyzji; nie jest zadaniem migracji bieżącej aplikacji.

# Kontekst techniczny Co na talerz 2.0

## Decyzja startowa, nie nakaz migracji
Nowy projekt: Expo + React Native + TypeScript strict, Expo Router; Expo SDK i React Native w zgodnych wersjach z aktualnej dokumentacji Expo. Używaj `npx expo install` dla bibliotek natywnych. Wersje Node, menedżera pakietów i zależności przypnij w repo oraz lockfile. Nie wpisuj do projektu numerów wersji z pamięci.

Domyślnie: TanStack Query dla danych serwera; lokalny stan React, Zustand tylko przy potrzebie współdzielenia; Zod na granicach API; react-hook-form do złożonych formularzy; i18next/react-i18next oraz Intl do lokalizacji. Expo SQLite na lokalną listę zakupów/cache; SecureStore na małe tokeny sesyjne, nie całą bazę. Cache diety i alergii traktuj jako dane wrażliwe: ogranicz zakres, czas i dostęp; SQLite nie oznacza automatycznego szyfrowania.

Backend nowego projektu: Supabase Postgres/Auth/Storage z RLS; uprzywilejowane operacje i integracje ofert po stronie serwera (Edge Functions lub istniejące API). Publiczny klucz klienta nie zastępuje RLS. Klucz service-role, klucze dostawców, tokeny GitHub/Drive i klucze podpisu nigdy nie trafiają do aplikacji. `EXPO_PUBLIC_*` jest publiczne w bundlu. OAuth GitHub/Drive służy narzędziom zespołu; nie dodawaj tych integracji do aplikacji konsumenckiej bez osobnego wymagania.

Testy: Jest + React Native Testing Library dla logiki i UI, Maestro dla krytycznych przepływów na Android/iOS; testy integracyjne API/RLS na izolowanym środowisku. CI: GitHub Actions; dystrybucja: Expo/EAS Build, Submit, Update zależnie od bieżącego CLI i projektu. Nie wymagaj wszystkich narzędzi, jeśli repo ma odpowiedniki.

## Organizacja przy braku istniejących konwencji
`app/` routing; `src/features/{recipes,meal-plan,shopping,offers}` domeny; `src/components/` UI; `src/lib/` adaptery; `src/locales/` teksty; `supabase/migrations/` migracje; `tests/` i `e2e/` testy; `docs/reports/` raporty bez danych osobowych. Oddziel czyste obliczenia porcji, cen i jednostek od UI.

## Reguły domeny
- Pieniądze przechowuj jako całkowite grosze z walutą; ilości jako wartości z jednostką. Nie sumuj gramów i mililitrów bez jawnej gęstości.
- Daty oferty są lokalne dla sklepu/rynku; przechowuj strefę i granice ważności. Nie używaj UTC-midnight jako założenia o końcu promocji.
- Zmiana porcji przelicza ilości, ale czas obróbki nie skaluje się liniowo. Koszt zużytych składników i koszt zakupu opakowań to oddzielne wartości.
- Oferta nie może unieważniać wykluczenia alergenu. Brak wiedzy o alergenie oznacza niepewność, a nie bezpieczeństwo.
- Każdy rekord przepisu/oferty ma identyfikator, wersję, pochodzenie i czas weryfikacji. Brak danych ma jawny stan w UI.

## Źródła techniczne
Sprawdzaj dokumentację dla wersji repo przed zmianą API lub wydaniem:
- https://docs.expo.dev/ — zgodność SDK, Router i buildy.
- https://docs.expo.dev/guides/environment-variables/ — publiczność zmiennych klienta; sprawdzone 2026-11-15.
- https://docs.expo.dev/eas/cli/ — bieżące polecenia; nazwy usług i CLI mogą się zmieniać.
- https://supabase.com/docs/guides/database/postgres/row-level-security — polityki dostępu.
- https://reactnative.dev/docs/accessibility — zachowanie dostępności natywnej.
