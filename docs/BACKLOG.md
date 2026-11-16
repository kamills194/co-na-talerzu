# Wspólny backlog

Aktualny zakres produktu: [pilotaż PL i sześć obszarów](PILOT-PL.md).
Cel: 30 kompletnych przepisów i 30 realnych zdjęć z potwierdzonymi prawami.
Niemcy i Wielka Brytania są propozycjami kolejnego etapu, bez aktywacji.

Identyfikatory CNT są wspólne dla kodu, Skills, PR i raportów. Ten wykaz konsoliduje
znane zadania z obu wątków; nie sugeruje importu nieistniejącego systemu Issues.

| ID | Zadanie i kryterium odbioru | Rola | Stan |
| --- | --- | --- | --- |
| CNT-001 | Kopia kodu, pochodzenie plików, brak nadpisania oryginałów | Koordynator | Wykonane lokalnie |
| CNT-002 | Dołączyć siedem gotowych Skills; sprawdzić SKILL.md, agents/openai.yaml i references | Koordynator | Dołączone, kontrola struktury w reports/skills-validation.json |
| CNT-003 | Uzgodnić Skills z istniejącym PWA/Capacitor i wspólnym workflow | Programista | Wykonane lokalnie, zachowano oryginalne ZIP |
| CNT-004 | Potwierdzić przepisy, jednostki, porcje i alergeny w katalogu | Ekspert kulinarny | Przegląd do wykonania |
| CNT-005 | Kontynuować adapter ofert; zachować źródło, czas i ważność, nie pokazywać wygasłych cen | Promocje sklepowe | Adapter ALDI istnieje; dalszy rozwój |
| CNT-006 | Odbiór telefonu, klawiatury i polskiego UI; każdy kolejny język kompletny | UX/UI i lokalizacja | Odbiór scalonej wersji do wykonania |
| CNT-007 | Testy i build w nowym repo, raport z wynikiem i ograniczeniami | QA | Wynik w reports/verification.txt |
| CNT-008 | Utworzyć/podłączyć właściwe repo GitHub, uruchomić CI i procedurę PR | Koordynator | Wykonane: prywatne kamills194/co-na-talerzu, push i CI PASS |
| CNT-009 | Wyznaczyć folder Drive raportów i wpisać jego rzeczywisty ID | Koordynator | Wykonane: folder oraz raporty zweryfikowane, ID w project.config.json |
| CNT-010 | Buildy natywne, podpisy i testy urządzeń według apps/web/PLAN-WYDANIA.md | Publikacja Android/iOS | Niewykonane |
| CNT-011 | Porównać odzyskany Site z MVP; plan migracji danych przed wyborem backendu | Programista | Archiwum zachowane; migracja niewykonana |
| CNT-012 | Po zakończeniu źródłowych wątków wykonać ponowny import i przegląd konfliktów | Koordynator | Otwarte |
| CNT-013 | Zapisać sześć obszarów, zakres PL, kryteria 30 przepisów/zdjęć i status kolejnych regionów | Koordynacja produktu i integracja | Plan zapisany; realizacja pilotażu poniżej |
| CNT-014 | Uzgodnić wspólne ID i schemat przepisu, zdjęcia, rynku i oferty, z kompatybilnością istniejących danych | Obszar 1 + programista | Planowane |
| CNT-015 | Rozbudować katalog z 18 do 30 rekordów i odebrać kompletność wszystkich 30 według PILOT-PL.md | Obszar 2 + QA | Planowane; 18 rekordów nie oznacza 18 odebranych |
| CNT-016 | Dodać do oferty zasięg sklepu/regionu, warunki i wygasanie; przetestować brak danych i granice dat | Obszar 3 + QA | Planowane; istnieje adapter ALDI |
| CNT-017 | Ujednolicić kluczowe ekrany i wdrożyć przypisane fotografie z atrybucją oraz stanami błędu/offline | Obszar 4 + QA | Planowane |
| CNT-018 | Wydzielić rynek od języka UI, waluty i jednostek; aktywować wyłącznie PL w pilotażu | Obszar 5 + QA | Planowane; DE/GB bez aktywacji |
| CNT-019 | Pozyskać 30 realnych fotografii, powiązać z recipeId i zweryfikować źródła, licencje/zgody oraz atrybucję | Obszar 6 + ekspert kulinarny/QA | Planowane; w MVP brak przypisanych zdjęć |
| CNT-020 | Odbiór integracyjny PL: 30/30 przepisów, 30/30 zdjęć i praw, ekrany, lokalizacja, oferty, testy/build | Koordynacja + QA | Po CNT-014–019 |
| CNT-021 | Przegląd kodu apps/web po przejęciu prac: poprawki błędów bez zmiany stacku, kluczy localStorage i identyfikatorów; testy i build PASS | Programista + QA | Wykonane na gałęzi cnt-021-przeglad-kodu; raport reports/CNT-021.md, PR do main |

Każde nowe zadanie: cel użytkownika, zakres plików, kryteria odbioru, odpowiedzialna
rola, zależności i dowód wykonania. Nie przypisano rzeczywistych osób ani botów.
