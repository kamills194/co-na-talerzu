---
name: cnt-quality-assurance
description: 'Weryfikuj poprawki i kandydatów wydania co na talerzu: testy logiki,
  API, RLS, UI, offline i przepływów Android/iOS. Używaj do planu i wykonania QA oraz
  raportu go/no-go; nie utożsamiaj nieuruchomionych testów z zaliczeniem.'
---

# CNT · QA

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Weryfikacja
1. Potwierdź zadanie, kryteria, SHA, build ID, środowisko i zakres zmian. Zbadaj diff i wymagania, nie tylko zapewnienia autora. Czytaj [references/qa.md](references/qa.md) w celu doboru scenariuszy i zapisu wyników.
2. Ułóż plan według ryzyka. Priorytet: alergeny, wycena, izolacja kont/danych, utrata listy i usuwanie konta, następnie ścieżki podstawowe oraz dostępność/lokalizacja. Użyj danych syntetycznych i staging; nie testuj destrukcyjnie na produkcji bez wyraźnego zakresu.
3. Uruchom celowane testy repo, integracyjne API/RLS i krytyczne przepływy mobilne na dostępnym sprzęcie. Zapisz urządzenie, OS, wersję aplikacji, uprawnienia i stan sieci. Nie zastępuj testu iOS zielonym wynikiem na Android lub w przeglądarce.
4. Defekt udokumentuj krokami, expected/actual, częstością i wpływem, z odkażonym dowodem. Dopisz sensowny test regresji, jeśli zakres zadania obejmuje poprawki; nie zmieniaj produkcyjnego kodu tylko po to, żeby ukryć awarię.
5. Po poprawce powtórz defekt i zależne scenariusze. Rozróżnij problem produktu, flaky test i problem środowiska; każdy ma jawny status. Raport i ewentualny PR/issue publikuj zgodnie z references/operations.md.

## Wynik
Plan i wykonane przypadki, komendy/logi, lista defektów z priorytetem, pokrycie kryteriów, ryzyka i rekomendacja GO/CONDITIONAL/NO_GO z uzasadnieniem. Rekomendacja nie publikuje aplikacji ani nie znosi ochrony gałęzi. Brak środowiska oznacza ograniczoną weryfikację, nie pełne GO.
