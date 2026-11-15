# Weryfikacja MVP — 15 listopada 2026

## Automatyczne

`node --test tests/*.test.mjs`: **19 testów, 19 poprawnych, 0 błędów**. Obejmują logikę i parser, walidację danych, składnię modułów UI, komplet zasobów cache oraz literalne klucze słownika.

`node scripts/build.mjs`: poprawny build do `dist/`, poprzedzony kontrolą składni każdego modułu aplikacji.

`node scripts/offers-bot.mjs`: odczyt na żywo dwóch oficjalnych stron ALDI, 80 i 44 rekordy, 2 oferty z datami i cenami pasujące do jawnej mapy składników. W pliku raportu jest dokładny czas i adresy źródeł. Liczba ofert jest wynikiem tego przebiegu, nie obietnicą ich dostępności przy późniejszym uruchomieniu.

## Przeglądarka

Uruchomiony lokalny serwer HTTP i rzeczywista przeglądarka w aplikacji Codex. Potwierdzono widok pulpitu oraz szerokość mobilną 390 px:

- Katalog 18 przepisów, wyszukiwanie „pomidorowa” po tytule i składnikach.
- Szczegóły pomidorowej, zmiana 2 → 4 porcje i lista zakupów: passata 1000 ml, ryż 200 g, marchew 2 szt.
- Zachowanie listy po ponownym załadowaniu strony.
- Połączenie filtrów: kolacja, do 15 min, wegańska, wykluczony gluten → losowanie sałatki z ciecierzycą. Modal czytelny przy 390 × 844 px.
- Serduszko sałatki i jej obecność w Ulubionych.
- Zakładka Promocje: dwie odczytane oferty ALDI, ceny za kg, terminy, warunki ze źródła, czas pobrania, dopasowane przepisy.
- Po zatrzymaniu procesu lokalnego serwera ponownie załadowano aplikację: katalog 18 przepisów i zapisane ulubione nadal działały z cache service workera. Automatyczne oferty nie zostały pobrane offline.

## Granice weryfikacji

Nie wykonano testów na fizycznym Androidzie/iPhonie, podpisanych buildów natywnych ani recenzji sklepowej. Test szerokości przeglądarki nie jest testem fizycznego telefonu. Nie przeprowadzono badań z VoiceOver/TalkBack ani testów wszystkich przepisów w kuchni. Działanie przez HTTPS i instalację PWA na telefonie trzeba sprawdzić przed betą.

Osobne odzyskane archiwum Site v7 nie jest nowym MVP. Próba uruchomienia jego testów na tym komputerze wykazała brak zainstalowanej zależności `jose`; nie deklarujemy przejścia pełnego zestawu tego wcześniejszego projektu. Nie zmieniono jego źródeł, produkcyjnej bazy ani wdrożenia. Wymaga własnego `npm ci` i weryfikacji zgodnie z jego dokumentacją.
