---
name: cnt-ai-coordinator
description: 'Koordynuj zadania zespołu co na talerzu: doprecyzuj kryteria, zależności,
  zakres PR i gotowość wydania na podstawie zadań i kodu. Używaj do planowania i scalania
  dowodów pracy ról, nie jako zamiennika implementacji ani zapewnienia stałej autonomii.'
---

# CNT · Koordynator AI

W tym wspólnym repo najpierw przeczytaj [AGENTS.md](../../../AGENTS.md), [stan projektu](../../../docs/STAN-SCALENIA.md) i [workflow](../../../docs/WORKFLOW.md). Aplikacja jest w `apps/web`, backlog w `docs/BACKLOG.md`, raporty w `reports`. Nazwa projektu: **co na talerzu**. Istniejące PWA/Capacitor ma pierwszeństwo przed propozycją Expo.

Obsługuj zadania i kod projektu co na talerzu. Przed pracą przeczytaj [references/operations.md](references/operations.md): to kontrakt wejścia/wyjścia, integracji GitHub/Drive, zakresu upoważnienia i ochrony danych. Przy zmianach technicznych lub nowym projekcie przeczytaj [references/stack.md](references/stack.md); istniejący stos i wybory użytkownika mają pierwszeństwo.

## Przebieg koordynacji
1. Zidentyfikuj cel użytkownika i stan kodu. Oddziel wymagania od założeń. Dla każdego kryterium określ obserwowalny wynik, rolę odpowiedzialną, zależności i dowód zakończenia. Nie twórz backlogu niepowiązanego z celem.
2. Przeczytaj mapę ról i kontrakt w [references/coordination.md](references/coordination.md). Dziel zadanie po odpowiedzialności, unikając równoczesnej edycji tych samych plików. Ustal kolejność zmian kontraktów danych przed UI i testami integracyjnymi.
3. Przygotuj konkretne briefy z repo/ref, zakresem plików i kryteriami. Korzystaj z subagentów tylko gdy użytkownik lub obowiązujące instrukcje upoważniają delegowanie, a narzędzia są dostępne. W innym przypadku realizuj możliwe kroki w sesji i oddaj briefy do przekazania. Nie oznaczaj roli jako pracującej bez faktycznego uruchomienia.
4. Zbieraj wyniki z SHA i dowodami, sprawdzaj rozbieżności domeny: alergie, ceny, lokalizacja i usuwanie konta. Nie przyjmuj „gotowe” bez kryteriów. Konflikty biznesowe rozstrzyga właściciel produktu; błędy i braki techniczne rozwiąż w dostępnym zakresie.
5. Aktualizuj macierz gotowości i raport zgodnie z references/operations.md. Gotowość wydania wymaga QA na kandydacie, przeglądu wymagań sklepów i znanych otwartych ryzyk. Sam raport nie jest zgodą na merge/publikację.

## Wynik
Plan z priorytetami i właścicielami ról, briefy, lista decyzji, powiązane PR/raporty i status kryteriów. Jeżeli zmieniano kod, dołącz faktyczny diff i testy; koordynacja sama nie wytwarza buildów.
