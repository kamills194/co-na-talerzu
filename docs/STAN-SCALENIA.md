# Podłączenie GitHub i Google Drive — 15 listopada 2026

Wspólne repo: https://github.com/kamills194/co-na-talerzu (prywatne), gałąź main.
Folder Drive: https://drive.google.com/drive/folders/1PYHtPoRuIvv-wyi2jkawOwudBI7y1XbT.
Identyfikatory usług zapisano w project.config.json. Aktualny status przesłania plików
i dowody zdalne zapisuje reports/connection-status.json. GitHub jest wspólnym źródłem
kodu, Skills, backlogu i raportów; Drive zawiera raporty i snapshoty przypisane do SHA.
Nie skonfigurowano bezobsługowej synchronizacji Drive ani nie dodano współpracowników
bez wskazania ich kont. Poniższy zapis jest historią wcześniejszego scalania.

---

# Stan na 15 listopada 2026

Nazwa docelowa: **co na talerzu**. Utworzono jedno lokalne repozytorium Git.
To konsolidacja dostępnych plików, a nie połączenie historii rozmów ani procesów.

| Źródło | Dostęp i stan podczas sprawdzania | Wynik |
| --- | --- | --- |
| Zbuduj MVP Co na talerz — 01a1e10a-c744-7f50-b6f3-b03bba431091 | Wątek dostępny, inProgress; istnieje kod | Kopia w apps/web, z manifestem SHA-256 |
| Utwórz 7 Skills dla Co na talerz 2.0 — 01a1e115-fff9-7fe2-8248-ee9a4574f951 | Początkowo inProgress bez plików; później idle i dostępne siedem kompletnych katalogów | Zaimportowano 35 plików do .agents/skills i dostosowano kontekst do wspólnego PWA/Capacitor; oryginalne ZIP zachowano |
| Wcześniejsza aplikacja Site, v7 | Istnieje odzyskany ZIP źródeł w wynikach pierwszego wątku | Zachowany w archive, bez uruchamiania migracji bazy lub wdrożenia |
| GitHub | Łącznik zwrócił tylko kamills194/echo-korony. | Nie jest repo tego produktu; brak przypisanego remote |
| Google Drive | Wyszukanie „talerz” zwróciło HTML „Co na talerz”, 4711 bajtów; „talerzu” bez wyników | Brak zidentyfikowanego folderu raportów; folderId pozostaje null |

Oryginały pozostają w katalogach obu wątków. Import nie zmienia nazw kluczy
localStorage ani identyfikatorów mobilnych. Wcześniejszy Site i MVP są różnymi
implementacjami; zachowanie ZIP nie oznacza funkcjonalnego scalenia ich backendów.
Archiwum nie stanowi kopii produkcyjnej bazy ani sekretów wdrożenia.

Podany przez użytkownika adres https://co-na-talerz-kamil.przestrze-ro-2040.chatgpt.site
potwierdzono przez Sites get_site: projekt appgprj_6af9a4afcdc48191983117b2bd390f22,
tytuł „Co na talerz”, status active, siedem zapisanych wersji. Najnowsza zapisana
wersja 7 wskazuje commit 2726b45b94e5454ff0bc673fb5f869c3a01971f1. To metadane
Sites; nie dowód identyczności zachowanego ZIP z bieżącym repo źródłowym Site.
Nie edytowano ani nie publikowano tej strony. Odczyt narzędziem web był niedostępny;
nie wykonano nowego odbioru działania publicznego UI.

Właściwą bazą dalszej pracy jest apps/web. Zmiana na Expo wymaga osobnej decyzji
architektonicznej i migracji. Skills powinny stosować istniejącą konfigurację projektu.

Wyniki sprawdzenia po imporcie: reports/verification.txt. Nie wykonywano publikacji
do sklepów, wdrożenia strony, wysyłania raportów na Drive ani uruchamiania agentów.
Nowe zmiany ze źródłowych wątków wymagają kolejnego importu i rozstrzygnięcia konfliktów.

Skills mają wspólne odnośniki do AGENTS.md, backlogu, stanu i workflow. Dodano bieżący
stack i rzeczywiste ścieżki; nazwy cnt-* zachowano dla zgodności wywołań. Oryginalne
instrukcje Expo pozostają jako warunkowa propozycja dla nowego projektu, nie nakaz migracji.
