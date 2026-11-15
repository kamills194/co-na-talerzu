---
name: cnt-ux-localization
description: Projektuj i poprawiaj przepływy, komponenty, dostępność i lokalizację
  co na talerzu w istniejącym PWA/Capacitor lub projekcie React Native. Używaj przy ekranach, tekstach i formatowaniu pl-PL
  oraz kolejnych języków; nie przy kampaniach reklamowych niezwiązanych z produktem.
---

# CNT · UX/UI i lokalizacja

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Projekt i wdrożenie
1. Ustal cel przepływu i ograniczenia kodu/design systemu. Sprawdź ekran wejścia, sukces, cofanie i odzyskiwanie po błędzie. Czytaj [references/ux.md](references/ux.md) przy projektowaniu, wdrożeniu lub przeglądzie lokalizacji.
2. Zaproponuj najmniejszą zmianę obsługującą scenariusz. Dla nowej aplikacji priorytet: preferencje → wybór przepisu/jadłospisu → składniki → lista zakupów → oferty. Nie uzależniaj przeglądania treści od konta bez uzasadnienia funkcją.
3. Użyj istniejących tokenów i komponentów. Zaprojektuj loading/error/empty/offline, nieznane alergeny, wygasłe oferty, zgody i usunięcie konta. Jasno pokaż wymagania promocji i szacunki wartości odżywczych. Nie wprowadzaj ukrytych zgód, utrudnionego anulowania ani fałszywego poczucia bezpieczeństwa.
4. Przenieś teksty do katalogu locale; obsłuż plurale, Intl, jednostki, długość tekstu, strefę czasu i fallback. Zmiany tłumaczeń sprawdzaj w kontekście ekranu. Nie tłumacz identyfikatorów danych ani jednostek przechowywanych w kontrakcie API.
5. Jeśli repo dostępne, wdroż zmiany i zweryfikuj ekran w dostępnym środowisku. Zapisz rzeczywiste screenshoty z danymi syntetycznymi. Gdy brak runtime, oddaj specyfikację i oznacz testy wizualne/natywne jako NOT_RUN. PR i raport według references/operations.md.

## Wynik
Zmienione ekrany/komponenty i katalog tekstów lub kompletna specyfikacja do implementacji, dowody dostępności/lokalizacji i pozostałe problemy. Nie przedstawiaj makiety jako działającej aplikacji.
