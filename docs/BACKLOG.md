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
| CNT-004 | Potwierdzić przepisy, jednostki, porcje i alergeny w katalogu | Ekspert kulinarny | Przegląd redakcyjny 30 rekordów wykonany (reports/CNT-015.md); bez próby kuchennej |
| CNT-005 | Kontynuować adapter ofert; zachować źródło, czas i ważność, nie pokazywać wygasłych cen | Promocje sklepowe | Kontrakt oferty i walidacja wdrożone (reports/CNT-016.md); adapter ALDI nieuruchamiany na żywym źródle |
| CNT-006 | Odbiór telefonu, klawiatury i polskiego UI; każdy kolejny język kompletny | UX/UI i lokalizacja | Sprawdzone w headless Chrome 320–1280 px (reports/CNT-017.md); odbiór na telefonie i czytnikach ekranu do wykonania |
| CNT-007 | Testy i build w nowym repo, raport z wynikiem i ograniczeniami | QA | Wynik w reports/verification.txt |
| CNT-008 | Utworzyć/podłączyć właściwe repo GitHub, uruchomić CI i procedurę PR | Koordynator | Wykonane: prywatne kamills194/co-na-talerzu, push i CI PASS |
| CNT-009 | Wyznaczyć folder Drive raportów i wpisać jego rzeczywisty ID | Koordynator | Wykonane: folder oraz raporty zweryfikowane, ID w project.config.json |
| CNT-010 | Buildy natywne, podpisy i testy urządzeń według apps/web/PLAN-WYDANIA.md | Publikacja Android/iOS | Niewykonane |
| CNT-011 | Porównać odzyskany Site z MVP; plan migracji danych przed wyborem backendu | Programista | Wykonane: docs/MIGRACJA-SITE.md, reports/CNT-011.md; decyzje właściciela otwarte |
| CNT-012 | Po zakończeniu źródłowych wątków wykonać ponowny import i przegląd konfliktów | Koordynator | Otwarte |
| CNT-013 | Zapisać sześć obszarów, zakres PL, kryteria 30 przepisów/zdjęć i status kolejnych regionów | Koordynacja produktu i integracja | Plan zapisany; realizacja pilotażu poniżej |
| CNT-014 | Uzgodnić wspólne ID i schemat przepisu, zdjęcia, rynku i oferty, z kompatybilnością istniejących danych | Obszar 1 + programista | Wykonane w zakresie pól przepisu (origin, review, photo, photoAlt), rynku i oferty; rejestr zdjęć pusty |
| CNT-015 | Rozbudować katalog z 18 do 30 rekordów i odebrać kompletność wszystkich 30 według PILOT-PL.md | Obszar 2 + QA | Wykonane: 30 rekordów (reports/CNT-015.md); zdjęcia nieprzypisane |
| CNT-016 | Dodać do oferty zasięg sklepu/regionu, warunki i wygasanie; przetestować brak danych i granice dat | Obszar 3 + QA | Wykonane (reports/CNT-016.md); zasięg ALDI oznaczany jako niepotwierdzony |
| CNT-017 | Ujednolicić kluczowe ekrany i wdrożyć przypisane fotografie z atrybucją oraz stanami błędu/offline | Obszar 4 + QA | Wykonane bez zdjęć: mechanizm fotografii z atrybucją, stany pusty/offline/błędu (reports/CNT-017.md) |
| CNT-018 | Wydzielić rynek od języka UI, waluty i jednostek; aktywować wyłącznie PL w pilotażu | Obszar 5 + QA | Wykonane: src/market.js, aktywny wyłącznie PL |
| CNT-019 | Pozyskać 30 realnych fotografii, powiązać z recipeId i zweryfikować źródła, licencje/zgody oraz atrybucję | Obszar 6 + ekspert kulinarny/QA | Zastąpione przez CNT-032 decyzją właściciela z 17 listopada 2026 |
| CNT-020 | Odbiór integracyjny PL: 30/30 przepisów, 30/30 zdjęć i praw, ekrany, lokalizacja, oferty, testy/build | Koordynacja + QA | Po CNT-014–019 |
| CNT-021 | Przegląd kodu apps/web po przejęciu prac: poprawki błędów bez zmiany stacku, kluczy localStorage i identyfikatorów; testy i build PASS | Programista + QA | Wykonane na gałęzi cnt-021-przeglad-kodu; raport reports/CNT-021.md, PR do main |
| CNT-022 | Publikacja apps/web/dist na GitHub Pages po scaleniu do main i automatyczne odświeżanie zainstalowanej aplikacji po wykryciu nowej wersji | Programista + publikacja | Kod wykonany (reports/CNT-022.md); wymaga włączenia Pages w ustawieniach repo |
| CNT-023 | Kolejne proste dania: z 30 do 70 przepisów, do 30 minut i do 8 składników | Ekspert kulinarny | Wykonane: 70 rekordów (reports/CNT-023.md); bez próby kuchennej |
| CNT-024 | Kuchnie świata: pole kuchni w przepisie, zakładki kuchni i dania startowe | Ekspert kulinarny + UX | Wykonane: polska, włoska, niemiecka, francuska, japońska (reports/CNT-024.md) |
| CNT-025 | Uproszczone diety: krótka lista najpopularniejszych | Ekspert kulinarny + UX | Wykonane: 8 diet (reports/CNT-025-026.md) |
| CNT-026 | Kalorie i makroskładniki na porcję wyliczane ze składników, z możliwością ukrycia | Ekspert kulinarny + programista | Wykonane: wartości szacunkowe z ogólnych tabel, widok do wyłączenia (reports/CNT-025-026.md) |
| CNT-027 | Przepisy ułożone według liczby składników w aktualnej promocji | Promocje sklepowe + programista | Wykonane: ranking i przełącznik kolejności, losowanie z wagą promocji (reports/CNT-027-028.md, reports/CNT-029.md) |
| CNT-028 | Bot szuka promocji na jak najwięcej składników: pełna mapa produktów, kolejne działy i sklepy | Promocje sklepowe | Mapa 62/64 produktów, dodatkowe adresy działów jako argumenty bota; bot nieuruchamiany na żywo, inne sklepy do decyzji |
| CNT-029 | Link do promocji i cena przy każdym składniku w przepisie i na liście zakupów | Promocje sklepowe + UX | Wykonane: cena, sklep, termin i link przy składnikach i na liście; „Wylosuj inne” (reports/CNT-029.md); brak aktualnych ofert do czasu uruchomienia bota |
| CNT-030 | Wybór języka oraz tłumaczenia interfejsu i przepisów | UX/UI i lokalizacja | Wykonane: wybór języka i 7 tłumaczeń (en, de, uk, fr, da, es, it) wbudowanych offline (reports/CNT-030.md); bez korekty przez rodzimych użytkowników |
| CNT-031 | Nowa, bardziej bajkowa szata graficzna; najpierw warianty do wyboru | UX/UI | Wykonane: wdrożony wariant „Bajkowa książeczka” (src/theme.css), decyzja właściciela 17.11.2026 |
| CNT-032 | Realistyczne generowane zdjęcia 30 dań z opisem pochodzenia; zastępuje CNT-019 | UX/UI + ekspert kulinarny | Zablokowane: brak plików zdjęć; mechanizm wyświetlania gotowy |
| CNT-033 | 16 dań powyżej 60 minut, głównie z kuchni zagranicznych; katalog 86 przepisów, kuchnia polska poniżej 55% | Ekspert kulinarny | Wykonane (reports/CNT-033.md); bez próby kuchennej, tłumaczenia bez korekty rodzimych użytkowników |
| CNT-034 | Poprawki po użyciu na telefonie (17.11): losowanie i porcje, 1 porcja z przyciskami −/+, język w prawym rogu, filtr czasu powyżej 60 min, kuchnia na kartach, wyszukiwarka wykluczeń, grupy alergenów, pełne czyszczenie filtrów | Programista + UX | Wykonane (reports/CNT-034.md) |
| CNT-036 | Ilości składników w gramach (ml dla płynów), przy sztukach podpowiedź „≈ N szt.”; decyzja właściciela 17.11.2026 | Programista | Wykonane: przeliczenie tylko przy wyświetlaniu, zapisane dane bez zmian |

Każde nowe zadanie: cel użytkownika, zakres plików, kryteria odbioru, odpowiedzialna
rola, zależności i dowód wykonania. Nie przypisano rzeczywistych osób ani botów.

## Decyzje właściciela z 17 listopada 2026

Właściciel wskazał dziesięć kierunków rozwoju (CNT-023–CNT-032). Zmieniają one wcześniejsze
ustalenia z PILOT-PL.md w trzech miejscach: zdjęcia dań mogą być generowane, o ile wyglądają
realistycznie (wcześniej wymagane fotografie rzeczywiste); dopuszczony jest wybór języków
i kuchnie innych krajów (wcześniej wyłącznie pl-PL i katalog PL); dobór dań ma opierać się
na promocjach (wcześniej promocje były tylko podpowiedzią). Rynek sklepów pozostaje PL.
