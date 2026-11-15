# Pilotaż Co na talerz — Polska

Ustalenie z 15 listopada 2026: rozwój ma sześć obszarów. Pierwszy pilotaż obejmuje
Polskę, 30 kompletnych przepisów i odpowiadające im realne zdjęcia dań.
To plan i kryteria odbioru, nie potwierdzenie gotowości katalogu lub rozpoczęcia
pracy przez sześć autonomicznych zespołów. Kod, Skills i raporty pozostają
w jednym repo co na talerzu; zasady: [WORKFLOW.md](WORKFLOW.md).

## Sześć obszarów

| Obszar | Wynik pilotażu i kryterium odbioru | Skills wspierające |
| --- | --- | --- |
| 1. Koordynacja produktu i integracja | Jeden backlog, kontrakty danych i powiązanie przepisu, zdjęcia, oferty oraz regionu po stabilnych ID; kandydat wydania z dowodami QA | cnt-ai-coordinator, cnt-mobile-developer, cnt-quality-assurance |
| 2. Przepisy i standaryzacja | 30 różnych przepisów w katalogu PL, każdy kompletny według poniższej definicji; istniejące przepisy przechodzą ten sam przegląd co nowe | cnt-culinary-expert, cnt-mobile-developer, cnt-quality-assurance |
| 3. Gazetki, sklepy i promocje regionalne | Każda wyświetlana oferta ma źródło, sklep, region lub jawny zakres ogólnopolski, jednostkę, warunki i okres ważności; po wygaśnięciu przestaje być rekomendowana | cnt-store-promotions, cnt-mobile-developer, cnt-quality-assurance |
| 4. Grafika i kluczowe ekrany | Spójne karty przepisów, szczegóły, wyszukiwanie/filtry, Zaskocz mnie, ulubione, lista zakupów i promocje; odbiór na telefonie, klawiaturą oraz stanów pustych/offline/błędu | cnt-ux-localization, cnt-mobile-developer, cnt-quality-assurance |
| 5. Regiony, języki, waluty i jednostki | Aktywny rynek PL: pl-PL, PLN, Europe/Warsaw, jednostki metryczne i jednostki kuchenne; rynek sklepu jest oddzielony od języka UI i waluty oferty | cnt-ux-localization, cnt-mobile-developer, cnt-quality-assurance |
| 6. Realne zdjęcia, licencje i źródła | 30 rzeczywistych fotografii dopasowanych do 30 przepisów; lokalny plik lub zatwierdzony host, pełny rejestr praw, źródło i wymagane oznaczenie autora | cnt-ux-localization, cnt-culinary-expert, cnt-quality-assurance |

Sześć obszarów nie zastępuje siedmiu istniejących Skills: programista i QA wspierają
kilka obszarów, a cnt-mobile-release obsługuje późniejszą dystrybucję Android/iOS.
Obszary opisują odpowiedzialności, nie wskazują powołanych osób ani uruchomionych botów.

## Kompletny przepis

Każdy z 30 rekordów musi mieć:

- stabilne ID, nazwę po polsku i kategorię posiłku;
- dodatnią liczbę porcji, listę składników z ilościami i jednoznacznymi jednostkami;
- pełną kolejność kroków oraz czas przygotowania odpowiadający opisowi;
- zweryfikowane oznaczenia diety i znane alergeny, z jawną niepewnością tam, gdzie jest potrzebna;
- informację o pochodzeniu treści i stanie przeglądu; analiza redakcyjna nie oznacza próby kuchennej;
- przypisane ID fotografii oraz opis alternatywny po polsku.

Katalog ma obejmować istniejące sześć kategorii: śniadania, drugie śniadania,
obiady, kolacje, desery i przystawki. Liczebność kategorii jest do ustalenia;
nie wprowadzono dodatkowego wymagania równego podziału. Zmiana schematu ma zachować
ID istniejących przepisów i kompatybilność ulubionych oraz list zakupów.

## Zdjęcia i rejestr praw

Każda fotografia musi przedstawiać właściwe danie i odpowiadać jego istotnym
składnikom. Nie zastępuj realnej fotografii obrazem wygenerowanym ani podobną potrawą
bez jawnego uzgodnienia. Sam publiczny adres zdjęcia nie potwierdza prawa użycia.

Rejestr przypisany do recipeId/photoId ma zawierać: autora, URL strony źródłowej,
URL lub dowód licencji/zgody, datę pozyskania, dozwolony sposób użycia, wymagany
tekst atrybucji, opis modyfikacji, ścieżkę pliku oraz SHA-256. Przy zdjęciu własnym
zapisz autora i podstawę dysponowania prawami. Jeśli licencja wymaga oznaczenia
w aplikacji, oznaczenie musi być widoczne, a nie tylko zapisane w repo.
Brak potwierdzonych praw blokuje publikację danego zdjęcia. Zakup płatnych zdjęć
nie został zlecony w tym ustaleniu.

## Promocje regionalne

Oferty z gazetek i stron sklepów wymagają sprawdzonego źródła, czasu odczytu,
dat od/do z interpretacją w strefie rynku, sklepu i zasięgu regionalnego, ceny
z walutą, jednostki oraz warunków takich jak karta, kupon lub zakup wielosztukowy.
Nie rozszerzaj zasięgu lokalnej oferty na całą Polskę. Brak daty, ceny lub regionu
nie może być przedstawiany jako potwierdzona aktualna promocja regionalna.
Po wygaśnięciu/utracie świeżości oferta znika z rekomendacji także bez nowego pobrania.
Adapter ALDI jest punktem startowym; nie świadczy o pokryciu wszystkich gazetek/sklepów.

## Kolejne regiony

| Rynek | Status | Zakres przed aktywacją |
| --- | --- | --- |
| Polska | Zakres pierwszego pilotażu wskazany przez użytkownika | PL, pl-PL, PLN; odbiór 30 przepisów i 30 zdjęć |
| Niemcy | Propozycja, oczekuje potwierdzenia etapu | Treści, język, waluta, jednostki, źródła i zasięg sklepów, lokalne formatowanie oraz QA |
| Wielka Brytania | Propozycja, oczekuje potwierdzenia etapu | Treści, język, waluta, jednostki, źródła i zasięg sklepów, lokalne formatowanie oraz QA |

Niemcy i Wielka Brytania pozostają kandydatami kolejnego etapu. Ich obecność w planie
nie aktywuje sklepów, tłumaczeń, nowych regionów ani wydania na te rynki.

## Stan bazowy i kolejność

Stan sprawdzony w kodzie aplikacji na bazie commitu a590bfc:
18 rekordów przepisów, sześć kategorii, brak przypisanych realnych fotografii.
To liczba rekordów, nie 18 zaakceptowanych kompletnych przepisów według nowego odbioru.
Do docelowej liczby brakuje 12 rekordów; wszystkie 30 wymagają przeglądu i zdjęć.

Najpierw uzgodnij wspólny schemat przepisu/fotografii/regionu, następnie rozbuduj
i sprawdź katalog oraz rejestr praw. Projekt ekranów i adaptery ofert mogą korzystać
z tego samego kontraktu. Odbiór integracyjny i lokalizacja zamykają pilotaż.
Nie ustalono terminu wydania ani konkretnych wykonawców.

Pilotaż można uznać za gotowy po odbiorze 30/30 przepisów i 30/30 zdjęć z prawami,
sprawdzeniu ekranów i ważności ofert w PL oraz zaliczeniu testów/builda na kandydacie.
Gotowość pilotażu nie oznacza automatycznej publikacji w sklepach.
